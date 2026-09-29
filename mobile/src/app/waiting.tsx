import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Eyebrow, Screen, T, Title } from "@/components/ui";
import { useSession } from "@/lib/session";
import { ago, firstName } from "@/lib/time";

/** After applying: what you sent, and a way to check back. A person reads every one. */
export default function Waiting() {
  const { me, refresh, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const app = me?.application;
  return (
    <Screen>
      <Title>Thanks{me?.name ? `, ${firstName(me.name)}` : ""}.</Title>
      <T tone="muted">A person at SELF reads every application. If it&apos;s a yes, you&apos;ll join a circle of founders and get three invites of your own.</T>
      {app && (
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Eyebrow>What you&apos;re building</Eyebrow>
            <T>{app.building}</T>
          </View>
          <View style={{ gap: 4 }}>
            <Eyebrow>Last week</Eyebrow>
            <T>{app.lastWeek}</T>
          </View>
          <T size={12} tone="subtle">
            Sent {ago(app.createdAt)}
          </T>
        </Card>
      )}
      <Button
        variant="secondary"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await refresh();
          setBusy(false);
          router.replace("/");
        }}
      >
        Check again
      </Button>
      <View style={{ alignItems: "center" }}>
        <Button variant="ghost" small onPress={signOut}>
          Sign out
        </Button>
      </View>
    </Screen>
  );
}
