import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, ErrorLine, Loading, T } from "@/components/ui";
import { api, type Circle } from "@/lib/api";
import { font, useColors } from "@/lib/theme";
import { openReport } from "@/lib/report";
import { ago, firstName } from "@/lib/time";

/**
 * Your circle: a handful of founders like you, talking. SELF only starts one
 * optional thread a week and, if you ask, catches you up. Polls while open.
 */
export default function CircleScreen() {
  const c = useColors();
  const [me, setMe] = useState("");
  const [circle, setCircle] = useState<Circle | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [catching, setCatching] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.circle();
      setMe(r.me);
      setCircle(r.circle);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void load();
      return () => setFocused(false);
    }, [load]),
  );
  useEffect(() => {
    if (!focused) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [focused, load]);

  if (circle === undefined) return error ? <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: c.bg }}><ErrorLine>{error}</ErrorLine></SafeAreaView> : <Loading />;
  if (circle === null)
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, gap: 8, backgroundColor: c.bg }}>
        <T size={30} weight="medium">
          Your circle
        </T>
        <T tone="muted">You&apos;ll join a small group of founders like you once you&apos;ve finished setting up.</T>
      </SafeAreaView>
    );

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      await api.say(body);
      setText("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  const catchUp = async () => {
    setCatching(true);
    setError("");
    try {
      await api.catchUp();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setCatching(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "left", "right"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 10, borderBottomWidth: 1, borderColor: c.border }}>
        <T size={22} weight="medium">
          {circle.name}
        </T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {circle.members.map((m) => (
            <View key={m.id} style={{ opacity: m.activeThisWeek || m.id === me ? 1 : 0.45 }}>
              <Avatar name={m.name} size={28} />
            </View>
          ))}
          <View style={{ flex: 1 }} />
          {!circle.summary && (
            <Pressable onPress={catchUp} disabled={catching} style={{ paddingHorizontal: 12, height: 30, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: "center" }}>
              <T size={13} weight="medium">
                {catching ? "Reading…" : "Catch me up"}
              </T>
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ padding: 20, gap: 14 }}>
          {circle.messages.map((m, i) => {
            if (!m.author)
              return (
                <View key={m.id} style={{ alignItems: "center", gap: 2, paddingVertical: 6 }}>
                  <T size={11} tone="subtle" mono>
                    SELF · THIS WEEK
                  </T>
                  <T size={15} tone="muted" center>
                    {m.text}
                  </T>
                </View>
              );
            const mine = m.author.id === me;
            const prev = circle.messages[i - 1];
            const showName = !mine && prev?.author?.id !== m.author.id;
            return (
              <Pressable key={m.id} onLongPress={mine ? undefined : () => openReport({ kind: "CIRCLE_MESSAGE", name: m.author!.name, targetId: m.id })} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%", gap: 3 }}>
                {showName && (
                  <T size={12} tone="subtle" style={{ paddingHorizontal: 4 }}>
                    {firstName(m.author.name)}
                  </T>
                )}
                <View style={{ backgroundColor: mine ? c.primary : c.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <T size={15} tone={mine ? "inverse" : "fg"}>
                    {m.text}
                  </T>
                </View>
                <T size={11} tone="subtle" style={{ alignSelf: mine ? "flex-end" : "flex-start", paddingHorizontal: 6 }}>
                  {ago(m.at)}
                  {m.fromJournal ? " · from journal" : ""}
                </T>
              </Pressable>
            );
          })}
          {circle.summary && (
            <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 8 }}>
              <T size={11} tone="subtle" mono>
                SELF · CATCH-UP{circle.summary.demo ? " · DEMO" : ""}
              </T>
              <T size={15}>{circle.summary.text}</T>
              {circle.summary.helps.map((h, i) => (
                <T key={i} size={14} tone="muted">
                  {h.from} could help {h.to}: {h.why}
                </T>
              ))}
            </View>
          )}
          <ErrorLine>{error}</ErrorLine>
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.bg, alignItems: "flex-end" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Say something to ${circle.name.split(" · ")[0]}`}
            placeholderTextColor={c.fgSubtle}
            multiline
            style={{ flex: 1, backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.regular, fontSize: 15, color: c.fg, maxHeight: 120 }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={send}
            disabled={busy || !text.trim()}
            style={{ height: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: c.primary, justifyContent: "center", opacity: busy || !text.trim() ? 0.4 : 1 }}
          >
            <T size={14} weight="medium" tone="inverse">
              Send
            </T>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
