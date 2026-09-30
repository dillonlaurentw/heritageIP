import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorLine, Loading, Screen, T } from "@/components/ui";
import { api, type Thread } from "@/lib/api";
import { font, useColors } from "@/lib/theme";
import { openReport } from "@/lib/report";
import { ago } from "@/lib/time";

/** One conversation. Polls every 4 seconds while open, like the web. */
export default function ThreadScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [t, setT] = useState<Thread | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      api
        .thread(id)
        .then((x) => live && setT(x))
        .catch((e: Error) => live && setError(e.message));
    void load();
    const timer = setInterval(load, 4000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [id]);

  if (!t) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      await api.send(id, body);
      setText("");
      setT(await api.thread(id));
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Screen
      back
      title={t.other.name}
      scroll={false}
      right={
        <Pressable accessibilityRole="button" accessibilityLabel={`Report or block ${t.other.name}`} hitSlop={10} onPress={() => openReport({ kind: "PERSON", name: t.other.name, userId: t.other.id })}>
          <T size={13} tone="subtle">
            Report
          </T>
        </Pressable>
      }
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ padding: 20, gap: 8 }}>
          {t.other.headline && (
            <T size={13} tone="subtle" center style={{ marginBottom: 8 }}>
              {t.other.headline}
            </T>
          )}
          {t.messages.map((m) => {
            const mine = m.authorId === t.me;
            return (
              <Pressable key={m.id} onLongPress={mine ? undefined : () => openReport({ kind: "MESSAGE", name: t.other.name, targetId: m.id })} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", gap: 2 }}>
                <View style={{ backgroundColor: mine ? c.primary : c.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <T size={15} tone={mine ? "inverse" : "fg"}>
                    {m.kind === "TEXT" ? m.text : m.text || "Proposed a trial week"}
                  </T>
                </View>
                <T size={11} tone="subtle" style={{ alignSelf: mine ? "flex-end" : "flex-start", paddingHorizontal: 6 }}>
                  {ago(m.at)}
                </T>
              </Pressable>
            );
          })}
          <ErrorLine>{error}</ErrorLine>
        </ScrollView>
        <SafeAreaView edges={["bottom"]} style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.bg, alignItems: "flex-end" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a message"
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
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
