import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Field, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { ago, firstName } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** One mentor. Ask with a short note; a yes opens a conversation. */
export default function MentorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: m, error, reload } = useLoad(() => api.mentor(id));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!m) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const first = firstName(m.name);

  const ask = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.askMentor(m.id, note);
      setNote("");
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {m.focus.map((f) => (
          <T key={f} size={13} tone="muted">
            {f} ·
          </T>
        ))}
      </View>

      {m.ask.status === "yes" ? (
        <Card style={{ gap: 10 }}>
          <T weight="medium">{first} is mentoring you</T>
          <T size={14} tone="muted">
            Talk directly: how often, how long and about what is up to the two of you.
          </T>
          {m.ask.conversationId && (
            <Button onPress={() => router.push({ pathname: "/thread/[id]", params: { id: (m.ask as { conversationId: string }).conversationId } })}>Message {first}</Button>
          )}
        </Card>
      ) : m.ask.status === "pending" ? (
        <Card style={{ gap: 6 }}>
          <T weight="medium">Asked {ago(m.ask.since)}</T>
          <T size={14} tone="muted">
            {first} will say yes or not now. If it&apos;s a yes, a conversation opens with your note.
          </T>
        </Card>
      ) : !m.open ? (
        <T tone="subtle">{first} isn&apos;t taking new requests right now.</T>
      ) : (
        <Card lift style={{ gap: 14 }}>
          {m.ask.status === "not now" && (
            <T size={13} tone="subtle">
              {first} said not now last time. You can ask again when things have moved on.
            </T>
          )}
          <Field
            label={`Ask ${first} for mentorship`}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="What you're building, where you are, and what you'd like help with."
            hint={`${first} reads this first. Your contact details stay private until they say yes.`}
          />
          <Button onPress={ask} busy={busy} disabled={note.trim().length < 20}>
            Ask {first}
          </Button>
          <ErrorLine>{err}</ErrorLine>
        </Card>
      )}
    </Screen>
  );
}
