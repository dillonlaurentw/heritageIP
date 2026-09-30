import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AskInline, Button, Card, ErrorLine, Loading, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { openReport } from "@/lib/report";
import { firstName, when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** One opportunity: what it is, who it's for, why you're seeing it, and "I'd like to come". */
export default function OpportunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: o, error, reload } = useLoad(() => api.opportunity(id));
  if (!o) return error ? <Screen back><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const host = firstName(o.host.name);
  return (
    <Screen back>
      <T size={12} tone="subtle" mono>
        {o.kindLabel.toUpperCase()} · {o.place.toUpperCase()}
      </T>
      <Title>{o.title}</Title>
      <T tone="muted">
        {when(o.startsAt)} · {o.seats} {o.seats === 1 ? "seat" : "seats"}
      </T>
      <T size={16}>{o.description}</T>
      <Card style={{ gap: 8 }}>
        <Row label="Hosted by" value={`${o.host.name}${o.host.line ? `, ${o.host.line}` : ""}`} />
        <Row label="For" value={o.forWho} />
        {o.costNote && <Row label="Cost" value={o.costNote} />}
        {o.why && <Row label="Why you're seeing this" value={o.why} />}
      </Card>

      {o.isHost ? (
        <Button onPress={() => router.push("/hosting")}>See who asked to come</Button>
      ) : o.request === "PICKED" ? (
        <Card lift style={{ gap: 8 }}>
          <T weight="medium">You&apos;re in.</T>
          <T size={14} tone="muted">
            {host} picked you. You can message them in Messages.
          </T>
          <Button small variant="ghost" style={{ alignSelf: "flex-start" }} onPress={async () => { await api.withdrawSeat(o.id).catch(() => {}); await reload(); }}>
            I can&apos;t make it
          </Button>
        </Card>
      ) : o.request === "PENDING" ? (
        <Card style={{ gap: 6 }}>
          <T weight="medium">Asked. {host} will pick.</T>
          {o.myWhy && (
            <T size={14} tone="muted">
              You said: {o.myWhy}
            </T>
          )}
          <Button small variant="ghost" style={{ alignSelf: "flex-start" }} onPress={async () => { await api.withdrawSeat(o.id).catch(() => {}); await reload(); }}>
            Withdraw
          </Button>
        </Card>
      ) : o.request === "NOT_THIS_TIME" ? (
        <T tone="subtle">Not this time. There&apos;ll be others.</T>
      ) : o.open ? (
        <View style={{ gap: 6 }}>
          <AskInline
            label="I'd like to come"
            placeholder={`In a line, why you'd like to come. ${host} reads this to pick.`}
            hint="Hosts pick for fit. Nobody pays for a seat."
            onSend={async (why) => {
              await api.askSeat(o.id, why);
              await reload();
            }}
          />
        </View>
      ) : (
        <T tone="subtle">{host} isn&apos;t taking requests for this one any more.</T>
      )}
      {!o.isHost && (
        <Button variant="ghost" small style={{ alignSelf: "center" }} onPress={() => openReport({ kind: "OPPORTUNITY", name: o.host.name, targetId: o.id })}>
          Report this
        </Button>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <T size={12} tone="subtle">
        {label}
      </T>
      <T size={15}>{value}</T>
    </View>
  );
}
