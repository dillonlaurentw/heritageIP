import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Eyebrow, Field, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { firstName, when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** One mentor: what they help with, and their open slots. Booking needs a real question. */
export default function MentorScreen() {
  const col = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: m, error, reload } = useLoad(() => api.mentor(id));
  const [slot, setSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  if (!m) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const open = m.slots.filter((s) => !s.mine);
  const mine = m.slots.filter((s) => s.mine);

  const book = async () => {
    if (!slot) return;
    setBusy(true);
    setErr("");
    try {
      await api.book(slot, topic);
      setDone(true);
      setSlot(null);
      setTopic("");
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Screen back>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <Avatar name={m.name} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Title>{m.name}</Title>
          <T size={13} tone="muted">
            {[m.headline, m.location].filter(Boolean).join(" · ")}
          </T>
        </View>
      </View>
      {m.note && <T size={16}>{m.note}</T>}

      {mine.length > 0 && (
        <Card style={{ gap: 8 }}>
          <Eyebrow>{done ? "Booked" : "Your hour"}</Eyebrow>
          {mine.map((s) => (
            <View key={s.id} style={{ gap: 2 }}>
              <T weight="medium">
                {when(s.at)} · {s.minutes} min
              </T>
              {s.topic && (
                <T size={14} tone="muted">
                  {s.topic}
                </T>
              )}
            </View>
          ))}
          <T size={13} tone="subtle">
            {firstName(m.name)} has been told. Messages open once you&apos;ve met.
          </T>
        </Card>
      )}

      {m.open && open.length > 0 && mine.length === 0 && (
        <View style={{ gap: 10 }}>
          <Eyebrow>Open slots</Eyebrow>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {open.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSlot(s.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: slot === s.id ? col.primary : col.surface,
                  borderWidth: 1,
                  borderColor: slot === s.id ? col.primary : col.border,
                }}
              >
                <T size={13} weight="medium" tone={slot === s.id ? "inverse" : "fg"}>
                  {when(s.at)}
                </T>
                <T size={12} tone={slot === s.id ? "inverse" : "subtle"}>
                  {s.minutes} min
                </T>
              </Pressable>
            ))}
          </View>
          {slot && (
            <Card lift style={{ gap: 14 }}>
              <Field
                label="What do you want help with?"
                value={topic}
                onChangeText={setTopic}
                multiline
                placeholder="One question, with enough context to think about it before you meet."
                hint={`${firstName(m.name)} reads this before the call.`}
              />
              <Button onPress={book} busy={busy} disabled={topic.trim().length < 15}>
                Book this slot
              </Button>
              <ErrorLine>{err}</ErrorLine>
            </Card>
          )}
        </View>
      )}
      {(!m.open || open.length === 0) && mine.length === 0 && <T tone="subtle">No open slots right now. Check back next week.</T>}
      <Button variant="ghost" small onPress={() => router.back()}>
        Back to mentors
      </Button>
    </Screen>
  );
}
