import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dot, ErrorLine, Loading, T, Wordmark } from "@/components/ui";
import { api, type Journal, type JournalLine, type Today } from "@/lib/api";
import { font, useColors } from "@/lib/theme";
import { firstName, greeting } from "@/lib/time";
import { useVoice } from "@/lib/voice";

/**
 * Today is your journal: say or type what happened, SELF answers with one
 * good question. Private: only you can read it. Anything that needs you
 * (a mentor request, your circle talking) sits quietly above.
 */
export default function TodayScreen() {
  const c = useColors();
  const [today, setToday] = useState<Today | null>(null);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const [t, j] = await Promise.all([api.today(), api.journal()]);
      setToday(t);
      setJournal(j);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const send = useCallback(
    async (body: string, spoken: boolean) => {
      const clean = body.trim();
      if (!clean) return;
      setBusy(true);
      setError("");
      // Show it right away; SELF's answer follows.
      setJournal((j) => (j ? { ...j, today: [...j.today, { id: `tmp-${Date.now()}`, who: "me", text: clean, spoken, demo: false, shared: false, at: new Date().toISOString() }] } : j));
      setText("");
      try {
        const r = await api.write(clean, spoken);
        if (r.replyError) setError(r.replyError);
        setJournal(await api.journal());
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(false);
    },
    [],
  );
  const onVoice = useCallback((heard: string) => void send(heard, true), [send]);
  const voice = useVoice(onVoice);

  if (!today || !journal) return error ? <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: c.bg }}><ErrorLine>{error}</ErrorLine></SafeAreaView> : <Loading />;

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setJournal(await api.journal());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Wordmark size={13} />
          <View style={{ gap: 4 }}>
            <T size={30} weight="medium">
              {greeting()}, {firstName(today.name)}.
            </T>
            <T tone="muted">{journal.today.length ? "Your journal for today. Only you can read it." : "What happened today? Say it or type it. Only you can read this."}</T>
          </View>

          {today.needs.length > 0 && (
            <View style={{ gap: 8 }}>
              {today.needs.map((n) => (
                <Pressable
                  key={n.key}
                  onPress={() => router.push(n.to as Href)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 })}
                >
                  <Dot />
                  <View style={{ flex: 1 }}>
                    <T size={14} weight="medium" lines={1}>
                      {n.title}
                    </T>
                    <T size={13} tone="muted" lines={1}>
                      {n.detail}
                    </T>
                  </View>
                  <T tone="subtle">›</T>
                </Pressable>
              ))}
            </View>
          )}

          {journal.earlier.length > 0 && (
            <View style={{ gap: 6 }}>
              {journal.earlier.slice(0, 5).reverse().map((d) => (
                <View key={d.day}>
                  <Pressable onPress={() => setOpenDay(openDay === d.day ? null : d.day)} style={{ flexDirection: "row", gap: 10, paddingVertical: 6 }}>
                    <T size={12} tone="subtle" mono style={{ width: 64 }}>
                      {dayLabel(d.day)}
                    </T>
                    <T size={14} tone="muted" lines={openDay === d.day ? undefined : 1} style={{ flex: 1 }}>
                      {d.messages.find((m) => m.who === "me")?.text ?? ""}
                    </T>
                  </Pressable>
                  {openDay === d.day && (
                    <View style={{ paddingLeft: 74, gap: 10, paddingBottom: 8 }}>
                      {d.messages.slice(1).map((m) => (
                        <Entry key={m.id} m={m} compact />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 1, backgroundColor: c.border }} />
          <T size={12} tone="subtle" mono>
            TODAY
          </T>
          {journal.today.map((m) => (
            <Entry key={m.id} m={m} onShare={today.circle && !m.shared ? () => act(() => api.shareEntry(m.id)) : undefined} onDelete={() => act(() => api.deleteEntry(m.id))} circleName={today.circle?.name} />
          ))}
          {busy && (
            <T size={14} tone="subtle">
              SELF is reading…
            </T>
          )}
          {voice.listening && (
            <T size={16} tone="muted">
              {voice.partial || "Listening…"}
            </T>
          )}
          <ErrorLine>{error || voice.error}</ErrorLine>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.bg, alignItems: "flex-end" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={voice.available ? "Type, or hold the mic to talk" : "Write about today"}
            placeholderTextColor={c.fgSubtle}
            multiline
            style={{ flex: 1, backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.regular, fontSize: 16, color: c.fg, maxHeight: 140 }}
          />
          {voice.available && !text.trim() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hold to talk"
              onPressIn={voice.start}
              onPressOut={voice.stop}
              style={{ height: 44, width: 44, borderRadius: 22, backgroundColor: voice.listening ? c.accent : c.primary, alignItems: "center", justifyContent: "center" }}
            >
              <MicGlyph color={c.primaryFg} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => send(text, false)}
              disabled={busy || !text.trim()}
              style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: c.primary, justifyContent: "center", opacity: busy || !text.trim() ? 0.4 : 1 }}
            >
              <T size={14} weight="medium" tone="inverse">
                Add
              </T>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** One journal line: yours read like a page; SELF's are quieter and marked. */
function Entry({ m, compact, onShare, onDelete, circleName }: { m: JournalLine; compact?: boolean; onShare?: () => void; onDelete?: () => void; circleName?: string }) {
  const c = useColors();
  const [menu, setMenu] = useState(false);
  if (m.who === "self")
    return (
      <View style={{ flexDirection: "row", gap: 10, paddingLeft: compact ? 0 : 2 }}>
        <View style={{ width: 2, borderRadius: 1, backgroundColor: c.borderStrong }} />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={11} tone="subtle" mono>
            SELF{m.demo ? " · DEMO" : ""}
          </T>
          <T size={compact ? 14 : 15} tone="muted">
            {m.text}
          </T>
        </View>
      </View>
    );
  return (
    <Pressable onLongPress={() => setMenu(true)} onPress={() => onDelete && setMenu(!menu)} style={{ gap: 6 }}>
      <T size={compact ? 14 : 17} style={{ lineHeight: compact ? 21 : 26 }}>
        {m.text}
      </T>
      {(m.shared || m.spoken) && !compact && (
        <T size={12} tone="subtle">
          {[m.spoken && "said out loud", m.shared && `shared with ${circleName ?? "your circle"}`].filter(Boolean).join(" · ")}
        </T>
      )}
      {menu && (onShare || onDelete) && (
        <View style={{ flexDirection: "row", gap: 16 }}>
          {onShare && (
            <Pressable onPress={() => { setMenu(false); onShare(); }}>
              <T size={13} weight="medium">
                Share with my circle
              </T>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={() => { setMenu(false); onDelete(); }}>
              <T size={13} tone="danger">
                Delete
              </T>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 10, height: 15, borderRadius: 5, borderWidth: 1.8, borderColor: color }} />
      <View style={{ width: 14, height: 6, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 1.8, borderTopWidth: 0, borderColor: color, marginTop: -5 }} />
      <View style={{ width: 1.8, height: 3, backgroundColor: color }} />
    </View>
  );
}

function dayLabel(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  const diff = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (diff <= 1) return "YESTERDAY";
  return d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
}
