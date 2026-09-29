import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, ErrorLine, Field, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useColors } from "@/lib/theme";

type Key = "name" | "headline" | "beliefs" | "buildingToward" | "gaps";
const QUESTIONS: { key: Key; ask: string; hint: string; placeholder: string; multiline?: boolean; min: number }[] = [
  { key: "name", ask: "What should people call you?", hint: "Your circle sees this.", placeholder: "Your name", min: 1 },
  { key: "headline", ask: "One line about you.", hint: "What you've done, or what you're doing now.", placeholder: "Ex-nurse building scheduling for night shifts", min: 3 },
  { key: "beliefs", ask: "What do you believe that most people don't?", hint: "About your field, your customers, or how things should be built.", placeholder: "Most people think…", multiline: true, min: 10 },
  { key: "buildingToward", ask: "What are you building toward?", hint: "Not the pitch. Where you want this to be in a few years.", placeholder: "In three years…", multiline: true, min: 10 },
  { key: "gaps", ask: "Where could you use help?", hint: "Your circle and mentors read this. Honest beats impressive.", placeholder: "I've never…", multiline: true, min: 5 },
];

/** Five questions, one at a time. The answers start your Self, which you can always see and edit. */
export default function Onboarding() {
  const c = useColors();
  const { me, refresh } = useSession();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<Key, string>>({ name: me?.name ?? "", headline: me?.headline ?? "", beliefs: "", buildingToward: "", gaps: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = QUESTIONS[i]!;
  const value = answers[q.key];
  const last = i === QUESTIONS.length - 1;

  const next = async () => {
    if (!last) return setI(i + 1);
    setBusy(true);
    setError("");
    try {
      await api.saveBasics(answers);
      await refresh();
      router.replace("/today");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {QUESTIONS.map((x, n) => (
          <View key={x.key} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: n <= i ? c.primary : c.border }} />
        ))}
      </View>
      <T size={12} tone="subtle" mono>
        {i + 1} OF {QUESTIONS.length}
      </T>
      <Card lift style={{ gap: 16 }}>
        <T size={24} weight="medium">
          {q.ask}
        </T>
        <T tone="muted">{q.hint}</T>
        <Field key={q.key} autoFocus value={value} onChangeText={(v) => setAnswers({ ...answers, [q.key]: v })} placeholder={q.placeholder} multiline={q.multiline} />
      </Card>
      <ErrorLine>{error}</ErrorLine>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {i > 0 && (
          <Button variant="secondary" onPress={() => setI(i - 1)}>
            Back
          </Button>
        )}
        <Button style={{ flex: 1 }} onPress={next} busy={busy} disabled={value.trim().length < q.min}>
          {last ? "Meet your circle" : "Next"}
        </Button>
      </View>
    </Screen>
  );
}
