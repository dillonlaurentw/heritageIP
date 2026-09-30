import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { firstName, when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** For hosts: what you're hosting and who'd like to come. Pick for fit; a pick opens a conversation. */
export default function Hosting() {
  const { data, error, reload } = useLoad(api.hosting);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  if (!data) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const answer = async (id: string, a: "pick" | "not this time") => {
    setBusy(id);
    setErr("");
    try {
      await api.answerSeat(id, a);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  };
  return (
    <Screen back>
      <Title>What you&apos;re hosting</Title>
      <Button style={{ alignSelf: "flex-start" }} small onPress={() => router.push("/host-new")}>
        Host something
      </Button>
      <ErrorLine>{err}</ErrorLine>
      {data.hosting.length === 0 && <T tone="muted">Nothing yet. A dinner, a factory visit, an hour online: small and real works best.</T>}
      {data.hosting.map((o) => (
        <View key={o.id} style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <T size={18} weight="medium">
              {o.title}
            </T>
            <T size={13} tone="muted">
              {o.place} · {when(o.startsAt)} · {o.picked} of {o.seats} seats picked{o.open ? "" : " · closed"}
            </T>
          </View>
          {o.requests.length === 0 && <T tone="subtle">Nobody has asked yet.</T>}
          {o.requests.map((r) => (
            <Card key={r.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Avatar name={r.who.name} size={36} />
                <View style={{ flex: 1 }}>
                  <T weight="medium">{r.who.name}</T>
                  <T size={13} tone="muted" lines={1}>
                    {r.who.headline}
                  </T>
                </View>
              </View>
              <T>{r.why}</T>
              {r.status === "PENDING" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button small busy={busy === r.id} onPress={() => answer(r.id, "pick")}>
                    Pick {firstName(r.who.name)}
                  </Button>
                  <Button small variant="ghost" disabled={busy === r.id} onPress={() => answer(r.id, "not this time")}>
                    Not this time
                  </Button>
                </View>
              ) : (
                <T size={13} tone="subtle">
                  {r.status === "PICKED" ? "Picked. You can message each other." : "Not this time."}
                </T>
              )}
            </Card>
          ))}
          {o.open && (
            <Button small variant="ghost" style={{ alignSelf: "flex-start" }} onPress={async () => { await api.closeOpportunity(o.id).catch(() => {}); await reload(); }}>
              Stop taking requests
            </Button>
          )}
        </View>
      ))}
    </Screen>
  );
}
