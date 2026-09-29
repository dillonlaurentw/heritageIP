import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Field, Screen, T, Title } from "@/components/ui";
import { api, DEMO } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useColors } from "@/lib/theme";

const DEMO_PEOPLE = [
  { email: "maya@self.demo", name: "Maya Okonkwo", line: "Founder, kelp packaging" },
  { email: "new@self.demo", name: "New Builder", line: "No access yet" },
  { email: "leo@self.demo", name: "Leo Brandt", line: "Applied, waiting" },
  { email: "rosa@self.demo", name: "Rosa Almeida", line: "Mentor, one request waiting" },
];

/** Email, then a 6-digit code. No passwords, no links to tap on another device. */
export default function SignIn() {
  const col = useColors();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const go = async (token: string) => {
    await signIn(token);
    router.replace("/");
  };
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await api.sendCode(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  const verify = async () => {
    setBusy(true);
    setError("");
    try {
      await go(await api.verifyCode(email.trim().toLowerCase(), code.trim()));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  const demo = async (e: string) => {
    setBusy(true);
    setError("");
    try {
      await go((await api.demoLogin(e)).token);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen back>
      <Title>{sent ? "Check your email" : "What's your email?"}</Title>
      <T tone="muted">{sent ? `We sent a 6-digit code to ${email.trim()}. It works for ten minutes.` : "We'll send you a code. No password to remember."}</T>
      {!sent ? (
        <>
          <Field value={email} onChangeText={setEmail} placeholder="you@company.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onSubmitEditing={send} />
          <Button onPress={send} busy={busy} disabled={!/.+@.+\..+/.test(email)}>
            Send me a code
          </Button>
        </>
      ) : (
        <>
          <Field value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" style={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }} onSubmitEditing={verify} />
          <Button onPress={verify} busy={busy} disabled={code.length !== 6}>
            Sign in
          </Button>
          <Button variant="ghost" onPress={() => setSent(false)}>
            Use a different email
          </Button>
        </>
      )}
      <ErrorLine>{error}</ErrorLine>

      {DEMO && !sent && (
        <View style={{ gap: 10, marginTop: 12 }}>
          <T size={12} tone="subtle" mono>
            DEMO · SIGN IN AS
          </T>
          <Card style={{ padding: 0 }}>
            {DEMO_PEOPLE.map((p, i) => (
              <Pressable key={p.email} onPress={() => demo(p.email)} disabled={busy} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderColor: col.border, opacity: pressed ? 0.6 : 1 })}>
                <Avatar name={p.name} size={32} />
                <View style={{ flex: 1 }}>
                  <T size={15} weight="medium">
                    {p.name}
                  </T>
                  <T size={13} tone="muted">
                    {p.line}
                  </T>
                </View>
              </Pressable>
            ))}
          </Card>
        </View>
      )}
    </Screen>
  );
}
