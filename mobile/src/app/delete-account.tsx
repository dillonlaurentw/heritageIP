import { useState } from "react";
import { Button, Card, ErrorLine, Field, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

/** Delete your account, for good. Shared companies pass to the next teammate first. */
export default function DeleteAccount() {
  const { signOut } = useSession();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Screen back>
      <Title>Delete your account</Title>
      <T tone="muted">This can&apos;t be undone.</T>
      <Card style={{ gap: 10 }}>
        <T weight="medium">What goes</T>
        <T tone="muted">Your journal, your Self, your messages and circle messages, your requests, updates and invites, and anything that was only yours.</T>
        <T weight="medium">What stays</T>
        <T tone="muted">Companies you share with others. The next teammate becomes the owner and keeps the pages you wrote there, so they lose nothing.</T>
      </Card>
      <Field label="Type DELETE to confirm" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} />
      <ErrorLine>{error}</ErrorLine>
      <Button
        busy={busy}
        disabled={typed.trim() !== "DELETE"}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            await api.deleteAccount();
            await signOut();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        Delete my account
      </Button>
    </Screen>
  );
}
