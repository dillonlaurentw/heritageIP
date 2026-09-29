import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Card, ErrorLine, Field, Screen, T } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useColors } from "@/lib/theme";

type TextKey = "name" | "headline" | "beliefs" | "buildingToward" | "gaps";

/** Same keys and words as FIELDS / STAGES in src/lib/app-rules.ts. */
const FIELDS: [string, string][] = [
  ["FOOD", "Food"],
  ["CLIMATE", "Climate"],
  ["HEALTH", "Health"],
  ["MONEY", "Money and fintech"],
  ["SOFTWARE", "Software"],
  ["CONSUMER", "Consumer"],
  ["HARDWARE", "Hardware"],
  ["OTHER", "Something else"],
];
const STAGES: [string, string][] = [
  ["IDEA", "Shaping the idea"],
  ["BUILDING", "Building the first version"],
  ["FIRST_CUSTOMERS", "Finding first customers"],
  ["GROWING", "Growing"],
];

type Step =
  | { kind: "text"; key: TextKey; ask: string; hint: string; placeholder: string; multiline?: boolean; min: number }
  | { kind: "where"; ask: string; hint: string };

const STEPS: Step[] = [
  { kind: "text", key: "name", ask: "What should people call you?", hint: "Your circle sees this.", placeholder: "Your name", min: 1 },
  { kind: "text", key: "headline", ask: "One line about you.", hint: "What you've done, or what you're doing now.", placeholder: "Ex-nurse building scheduling for night shifts", min: 3 },
  { kind: "where", ask: "Where are you building?", hint: "We'll put you in a small circle of founders in the same place." },
  { kind: "text", key: "beliefs", ask: "What do you believe that most people don't?", hint: "About your field, your customers, or how things should be built.", placeholder: "Most people think…", multiline: true, min: 10 },
  { kind: "text", key: "buildingToward", ask: "What are you building toward?", hint: "Not the pitch. Where you want this to be in a few years.", placeholder: "In three years…", multiline: true, min: 10 },
  { kind: "text", key: "gaps", ask: "Where could you use help?", hint: "Your circle and mentors read this. Honest beats impressive.", placeholder: "I've never…", multiline: true, min: 5 },
];

/** A few questions, one at a time. The answers start your Self and find your circle. */
export default function Onboarding() {
  const c = useColors();
  const { me, refresh } = useSession();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<TextKey, string>>({ name: me?.name ?? "", headline: me?.headline ?? "", beliefs: "", buildingToward: "", gaps: "" });
  const [field, setField] = useState("");
  const [stage, setStage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;
  const ready = step.kind === "where" ? !!field && !!stage : answers[step.key].trim().length >= step.min;

  const next = async () => {
    if (!last) return setI(i + 1);
    setBusy(true);
    setError("");
    try {
      await api.saveBasics({ ...answers, field, stage });
      await refresh();
      router.replace("/today");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const Chips = ({ options, value, onChange, label }: { options: [string, string][]; value: string; onChange: (v: string) => void; label: string }) => (
    <View style={{ gap: 8 }}>
      <T size={13} weight="medium">
        {label}
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map(([k, v]) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityState={{ selected: value === k }}
            onPress={() => onChange(k)}
            style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: "center", backgroundColor: value === k ? c.primary : c.surface, borderWidth: 1, borderColor: value === k ? c.primary : c.border }}
          >
            <T size={14} tone={value === k ? "inverse" : "fg"}>
              {v}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {STEPS.map((_, n) => (
          <View key={n} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: n <= i ? c.primary : c.border }} />
        ))}
      </View>
      <T size={12} tone="subtle" mono>
        {i + 1} OF {STEPS.length}
      </T>
      <Card lift style={{ gap: 16 }}>
        <T size={24} weight="medium">
          {step.ask}
        </T>
        <T tone="muted">{step.hint}</T>
        {step.kind === "where" ? (
          <>
            <Chips label="What you build in" options={FIELDS} value={field} onChange={setField} />
            <Chips label="How far along" options={STAGES} value={stage} onChange={setStage} />
          </>
        ) : (
          <Field key={step.key} autoFocus value={answers[step.key]} onChangeText={(v) => setAnswers({ ...answers, [step.key]: v })} placeholder={step.placeholder} multiline={step.multiline} />
        )}
      </Card>
      <ErrorLine>{error}</ErrorLine>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {i > 0 && (
          <Button variant="secondary" onPress={() => setI(i - 1)}>
            Back
          </Button>
        )}
        <Button style={{ flex: 1 }} onPress={next} busy={busy} disabled={!ready}>
          {last ? "Start my journal" : "Next"}
        </Button>
      </View>
    </Screen>
  );
}
