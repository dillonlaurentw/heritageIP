import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Button, Card, ErrorLine, Eyebrow, Loading, Screen, T, Title } from "@/components/ui";
import { api, type Invite, type SelfDoc } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useColors } from "@/lib/theme";
import { useLoad } from "@/lib/useLoad";

/** You: your Self (the lines your agent is given, and nothing else), your invites, sign out. */
export default function You() {
  const col = useColors();
  const { me, signOut } = useSession();
  const { data, error, reload } = useLoad(async () => {
    const [self, inv] = await Promise.all([api.self(), api.invites()]);
    return { self, invites: inv.invites };
  });
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const { self, invites } = data as { self: SelfDoc; invites: Invite[] };
  const answer = async (type: "accept" | "reject", id: string) => {
    await api.changeSelf({ type, id }).catch(() => {});
    await reload();
  };
  const unused = invites.filter((i) => !i.usedBy);

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar name={me?.name ?? "?"} size={56} />
        <View style={{ flex: 1 }}>
          <Title>{me?.name}</Title>
          {me?.headline && <T tone="muted">{me.headline}</T>}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>Your Self</Eyebrow>
        <T size={14} tone="muted">
          These lines are exactly what SELF&apos;s agents know about you. Nothing else.
        </T>
        {self.suggestions.map((s) => (
          <Card key={s.id} style={{ gap: 10, borderWidth: 1.5, borderColor: col.accent }}>
            <T size={12} tone="accent" weight="medium">
              Is this you? · {s.facet}
            </T>
            <T>{s.text}</T>
            <T size={13} tone="subtle">
              {s.why}
            </T>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button small onPress={() => answer("accept", s.id)}>
                Yes, add it
              </Button>
              <Button small variant="ghost" onPress={() => answer("reject", s.id)}>
                Not really
              </Button>
            </View>
          </Card>
        ))}
        {self.facets
          .filter((f) => f.lines.length)
          .map((f) => (
            <Card key={f.key} style={{ gap: 8 }}>
              <T size={13} weight="medium" tone="muted">
                {f.label}
              </T>
              {f.lines.map((l) => (
                <T key={l.id}>{l.text}</T>
              ))}
            </Card>
          ))}
        <T size={12} tone="subtle">
          Edit every line on the web at /me/self.
        </T>
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>Invites</Eyebrow>
        <T size={14} tone="muted">
          {unused.length ? `You can bring in ${unused.length} more ${unused.length === 1 ? "person" : "people"}. Pick builders who are building now.` : "You've used all your invites."}
        </T>
        <Card style={{ padding: 0 }}>
          {invites.map((i, n) => (
            <Pressable key={i.code} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderTopWidth: n ? 1 : 0, borderColor: col.border }}>
              <T mono size={14} tone={i.usedBy ? "subtle" : "fg"}>
                {i.code}
              </T>
              <T size={13} tone="subtle">
                {i.usedBy ? `${i.usedBy} joined` : "unused"}
              </T>
            </Pressable>
          ))}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>Coming later</Eyebrow>
        <Card style={{ gap: 6 }}>
          <T weight="medium">Partners, co-founders and capital</T>
          <T size={14} tone="muted">
            SELF opens these one at a time, once circles and mentors work well. Nothing here moves money.
          </T>
        </Card>
      </View>

      <Button variant="secondary" onPress={signOut}>
        Sign out
      </Button>
    </Screen>
  );
}
