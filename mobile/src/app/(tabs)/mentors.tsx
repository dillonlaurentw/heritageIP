import { router } from "expo-router";
import { View } from "react-native";
import { Avatar, Card, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api, type Ask } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { useLoad } from "@/lib/useLoad";

export const askLine = (a: Ask, open: boolean) =>
  a.status === "yes" ? "Mentoring you" : a.status === "pending" ? "Asked · waiting for an answer" : !open ? "Not taking new requests right now" : null;

/** People who've done it, taking requests. Ask one; if they say yes, you talk directly. */
export default function Mentors() {
  const col = useColors();
  const { data, error } = useLoad(api.mentors);
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>Mentors</Title>
        <T tone="muted">People who&apos;ve done it. Ask one for help; if they say yes, you two decide how to work together.</T>
      </View>
      {data.mentors.map((m) => {
        const line = askLine(m.ask, m.open);
        return (
          <Card key={m.id} onPress={() => router.push({ pathname: "/mentor/[id]", params: { id: m.id } })} style={{ gap: 10, opacity: m.open || m.ask.status === "yes" ? 1 : 0.6 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Avatar name={m.name} size={40} />
              <View style={{ flex: 1 }}>
                <T weight="medium">{m.name}</T>
                <T size={13} tone="muted" lines={2}>
                  {m.headline}
                </T>
              </View>
            </View>
            {m.note && (
              <T size={14} lines={3}>
                {m.note}
              </T>
            )}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {m.focus.map((f) => (
                <View key={f} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: col.bgInset }}>
                  <T size={12} tone="muted">
                    {f}
                  </T>
                </View>
              ))}
            </View>
            {line && (
              <T size={13} tone="subtle">
                {line}
              </T>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
