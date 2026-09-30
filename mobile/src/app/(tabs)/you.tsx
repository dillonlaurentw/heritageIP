import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Ring } from "@/components/Ring";
import { Avatar, Button, Card, ErrorLine, Eyebrow, Loading, Screen, T, Title } from "@/components/ui";
import { api, type Invite, type SelfDoc, type Today } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useColors } from "@/lib/theme";
import { useLoad } from "@/lib/useLoad";

/** You: your ring, your Self (the lines your agent is given, and nothing else), your invites. */
export default function You() {
  const col = useColors();
  const { me, signOut } = useSession();
  const { data, error, reload } = useLoad(async () => {
    const [self, inv, today] = await Promise.all([api.self(), api.invites(), api.today()]);
    return { self, invites: inv.invites, today };
  });
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const { self, invites, today } = data as { self: SelfDoc; invites: Invite[]; today: Today };
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

      <Ring nodes={today.ring} size={250} onNode={(n) => router.push(n.theme === "COFOUNDERS" ? "/circle" : { pathname: "/network", params: { section: { ADVISORS: "mentors", PARTNERS: "partners", CAPITAL: "capital" }[n.theme] } })} />
      {today.company && today.company.steps.length > 0 && (
        <Card style={{ gap: 8 }}>
          <T size={13} weight="medium" tone="muted">
            Next on {today.company.name}
          </T>
          {today.company.steps.map((s) => (
            <T key={s}>{s}</T>
          ))}
        </Card>
      )}

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
        <Eyebrow>Later</Eyebrow>
        <Card onPress={() => router.push("/funds")} style={{ gap: 6 }}>
          <T weight="medium">Investing through SELF</T>
          <T size={14} tone="muted">
            Not available yet: it needs a licensed partner first. Nothing on SELF moves money.
          </T>
        </Card>
      </View>

      <Button variant="secondary" onPress={signOut}>
        Sign out
      </Button>
    </Screen>
  );
}
