import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Chip, ErrorLine, Field, Screen, T, Title, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import { firstName } from "@/lib/time";

/** Same keys and words as REPORT_REASONS in src/lib/app-rules.ts. */
const REASONS: [string, string][] = [
  ["HARASSMENT", "Harassment or bullying"],
  ["SPAM", "Spam or selling"],
  ["SCAM", "A scam or fraud"],
  ["MONEY", "Asking for money or investment"],
  ["INAPPROPRIATE", "Inappropriate content"],
  ["OTHER", "Something else"],
];
const WHAT: Record<string, string> = { PERSON: "this person", MESSAGE: "this message", CIRCLE_MESSAGE: "this message", OPPORTUNITY: "this opportunity", UPDATE: "this update" };

/** Report a person or something they wrote. A person at SELF reviews every report. */
export default function Report() {
  const p = useLocalSearchParams<{ kind: string; name: string; userId?: string; targetId?: string }>();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const who = firstName(p.name ?? "them");

  if (done)
    return (
      <Screen back>
        <Title>Thank you</Title>
        <T tone="muted">A person at SELF will look at this. {alsoBlock ? `${who} can't message you or send you requests any more, and won't be told.` : ""}</T>
        <Button onPress={() => router.back()}>Done</Button>
      </Screen>
    );

  return (
    <Screen back>
      <Title>Report {WHAT[p.kind ?? "PERSON"]}</Title>
      <T tone="muted">What&apos;s wrong? {who} won&apos;t know who reported it.</T>
      <Card lift style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {REASONS.map(([k, v]) => (
            <Chip key={k} label={v} on={reason === k} onPress={() => setReason(k)} />
          ))}
        </View>
        <Field value={note} onChangeText={setNote} multiline placeholder="Anything else we should know (optional)" />
        <Toggle label={`Also block ${who}`} hint="No messages or requests between you. They won't be told." value={alsoBlock} onChange={setAlsoBlock} />
        <ErrorLine>{error}</ErrorLine>
        <Button
          busy={busy}
          disabled={!reason}
          onPress={async () => {
            setBusy(true);
            setError("");
            try {
              await api.report({ kind: p.kind ?? "PERSON", userId: p.userId, targetId: p.targetId, reason, note: note || undefined, alsoBlock });
              setDone(true);
            } catch (e) {
              setError((e as Error).message);
            }
            setBusy(false);
          }}
        >
          Send report
        </Button>
      </Card>
    </Screen>
  );
}
