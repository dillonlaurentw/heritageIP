import { router, type Href } from "expo-router";
import { View } from "react-native";
import { Ring } from "@/components/Ring";
import { Avatar, Button, Card, Dot, ErrorLine, Eyebrow, Loading, Screen, T, Title, Wordmark } from "@/components/ui";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { firstName, greeting, when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** Today: your ring (peers and advisors), what needs you, and your next hour with a mentor. */
export default function Today() {
  const c = useColors();
  const { data: t, error } = useLoad(api.today);
  if (!t) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  return (
    <Screen>
      <Wordmark size={13} />
      <View style={{ gap: 4 }}>
        <Title>
          {greeting()}, {firstName(t.name)}.
        </Title>
        <T tone="muted">{t.needs.length ? "Here's what needs you today." : "Nothing is waiting on you. A good day to build."}</T>
      </View>

      <Ring nodes={t.ring} size={250} onNode={(n) => router.push(n.theme === "ADVISORS" ? "/mentors" : "/circle")} />

      {t.needs.length > 0 && (
        <View style={{ gap: 10 }}>
          {t.needs.map((n) => (
            <Card key={n.key} onPress={() => router.push(n.to as Href)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Dot />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight="medium">{n.title}</T>
                <T size={13} tone="muted" lines={2}>
                  {n.detail}
                </T>
              </View>
              <T tone="subtle">›</T>
            </Card>
          ))}
        </View>
      )}

      {t.circle && (
        <Card onPress={() => router.push("/circle")} style={{ gap: 6 }}>
          <Eyebrow>{t.circle.name}</Eyebrow>
          <T weight="medium">
            {t.circle.checkedIn} of {t.circle.members} checked in this week
          </T>
          <T size={13} tone="muted">
            {t.circle.mine ? "You're in. Read theirs and reply where you can help." : "Yours is the one missing."}
          </T>
        </Card>
      )}

      <View style={{ gap: 10 }}>
        <Eyebrow>Office hours</Eyebrow>
        {t.hours.length === 0 ? (
          <Card style={{ gap: 12 }}>
            <T tone="muted">Twenty minutes with someone who has done it. Bring one question.</T>
            <Button variant="secondary" small style={{ alignSelf: "flex-start" }} onPress={() => router.push("/mentors")}>
              Find a mentor
            </Button>
          </Card>
        ) : (
          t.hours.map((h) => (
            <Card key={h.id} style={{ flexDirection: "row", gap: 12 }}>
              <Avatar name={h.with} />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight="medium">{h.with}</T>
                <T size={13} tone="muted">
                  {when(h.at)} · {h.minutes} min
                </T>
                {h.topic && (
                  <T size={13} tone="subtle" lines={2}>
                    {h.topic}
                  </T>
                )}
              </View>
            </Card>
          ))
        )}
      </View>

      {t.company && t.company.steps.length > 0 && (
        <View style={{ gap: 10 }}>
          <Eyebrow>Next on {t.company.name}</Eyebrow>
          <Card style={{ gap: 12 }}>
            {t.company.steps.map((s, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <View style={{ width: 16, height: 16, borderRadius: 5, borderWidth: 1.5, borderColor: c.borderStrong }} />
                <T style={{ flex: 1 }}>{s.title}</T>
              </View>
            ))}
          </Card>
        </View>
      )}
    </Screen>
  );
}
