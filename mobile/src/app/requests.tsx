import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { ago, firstName } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** For mentors: founders who asked for your help. Yes opens a conversation. */
export default function Requests() {
  const { data, error, reload } = useLoad(api.requests);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  if (!data) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;

  const answer = async (id: string, a: "yes" | "not now") => {
    setBusy(id);
    setErr("");
    try {
      const r = await api.answer(id, a);
      if (a === "yes" && r.conversationId) return router.replace({ pathname: "/thread/[id]", params: { id: r.conversationId } });
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  };

  return (
    <Screen back>
      <Title>Asked for your help</Title>
      {data.requests.length === 0 && <T tone="muted">Nothing waiting. When a founder asks you to mentor them, it shows up here.</T>}
      {data.requests.map((r) => (
        <Card key={r.id} style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Avatar name={r.from.name} size={40} />
            <View style={{ flex: 1 }}>
              <T weight="medium">{r.from.name}</T>
              <T size={13} tone="muted" lines={2}>
                {[r.from.headline, r.company].filter(Boolean).join(" · ")}
              </T>
            </View>
            <T size={12} tone="subtle">
              {ago(r.at)}
            </T>
          </View>
          <T>{r.note}</T>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button small busy={busy === r.id} onPress={() => answer(r.id, "yes")}>
              Yes, let&apos;s talk
            </Button>
            <Button small variant="ghost" disabled={busy === r.id} onPress={() => answer(r.id, "not now")}>
              Not now
            </Button>
          </View>
          <T size={12} tone="subtle">
            A yes opens a conversation with {firstName(r.from.name)} and shares contact details both ways.
          </T>
        </Card>
      ))}
      <ErrorLine>{err}</ErrorLine>
    </Screen>
  );
}
