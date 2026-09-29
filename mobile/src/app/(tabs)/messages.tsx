import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Avatar, Card, Dot, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { ago } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** Conversations with people you share a company or an accepted request with. */
export default function Messages() {
  const col = useColors();
  const { data, error } = useLoad(api.conversations);
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  return (
    <Screen>
      <Title>Messages</Title>
      {data.conversations.length === 0 && <T tone="muted">No conversations yet. They open with people in your circle, your company, or anyone who said yes to you.</T>}
      <Card style={{ padding: 0 }}>
        {data.conversations.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => router.push({ pathname: "/thread/[id]", params: { id: c.id } })}
            style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderTopWidth: i ? 1 : 0, borderColor: col.border, opacity: pressed ? 0.6 : 1 })}
          >
              <Avatar name={c.other.name} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {c.unread && <Dot />}
                  <T weight="medium" style={{ flex: 1 }} lines={1}>
                    {c.other.name}
                  </T>
                  {c.last && (
                    <T size={12} tone="subtle">
                      {ago(c.last.at)}
                    </T>
                  )}
                </View>
                <T size={13} tone="muted" lines={1}>
                  {c.last ? `${c.last.mine ? "You: " : ""}${c.last.text}` : c.about ?? ""}
                </T>
              </View>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
