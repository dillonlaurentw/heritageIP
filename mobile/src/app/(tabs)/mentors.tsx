import { router } from "expo-router";
import { View } from "react-native";
import { Avatar, Card, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** Mentors taking office hours: who they are, what they help with, the next open slot. */
export default function Mentors() {
  const col = useColors();
  const { data, error } = useLoad(api.mentors);
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>Mentors</Title>
        <T tone="muted">Twenty minutes with someone who has done it. Bring one question.</T>
      </View>
      {data.mentors.length === 0 && <T tone="subtle">No office hours open right now.</T>}
      {data.mentors.map((m) => (
        <Card key={m.id} onPress={() => router.push({ pathname: "/mentor/[id]", params: { id: m.id } })} style={{ gap: 10 }}>
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
          <T size={13} tone="subtle">
            {m.next ? `Next: ${when(m.next.at)} · ${m.openSlots} open` : "No open slots this week"}
          </T>
        </Card>
      ))}
    </Screen>
  );
}
