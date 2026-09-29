import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, ErrorLine, Field, Screen, Segmented, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { firstName } from "@/lib/time";

/**
 * SELF is invite-only: a member's code gets you in, or you apply with two
 * questions. The bar is commitment and fit, never price or pedigree.
 */
export default function Access() {
  const { me, refresh, signOut } = useSession();
  const [mode, setMode] = useState<"invite" | "apply">("invite");
  const [code, setCode] = useState("");
  const [building, setBuilding] = useState("");
  const [lastWeek, setLastWeek] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>{me?.name ? `Welcome, ${firstName(me.name)}.` : "Welcome."}</Title>
      <T tone="muted">SELF starts small on purpose. Every member is building something right now, and each one can bring in three people.</T>
      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError("");
        }}
        options={[
          { key: "invite", label: "I have an invite" },
          { key: "apply", label: "Apply" },
        ]}
      />
      {mode === "invite" ? (
        <Card lift style={{ gap: 16 }}>
          <Field label="Your invite code" value={code} onChangeText={setCode} placeholder="SELF-XXXX-XXXX" autoCapitalize="characters" autoCorrect={false} style={{ fontSize: 18, letterSpacing: 2 }} />
          <Button onPress={() => run(() => api.redeem(code))} busy={busy} disabled={code.replace(/[^a-z0-9]/gi, "").length < 8}>
            Join
          </Button>
        </Card>
      ) : (
        <Card lift style={{ gap: 16 }}>
          <Field label="What are you building?" value={building} onChangeText={setBuilding} multiline placeholder="Say it the way you'd tell a friend." />
          <Field
            label="What did you do on it last week?"
            value={lastWeek}
            onChangeText={setLastWeek}
            multiline
            placeholder="Calls made, things shipped, what you learned."
            hint="Something done last week counts more than any title."
          />
          <Button onPress={() => run(() => api.apply(building, lastWeek))} busy={busy} disabled={building.trim().length < 20 || lastWeek.trim().length < 20}>
            Send
          </Button>
        </Card>
      )}
      <ErrorLine>{error}</ErrorLine>
      <View style={{ alignItems: "center" }}>
        <Button variant="ghost" small onPress={signOut}>
          Sign out
        </Button>
      </View>
    </Screen>
  );
}
