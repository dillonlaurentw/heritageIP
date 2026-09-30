import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { AskInline, Avatar, Button, Card, Chip, ErrorLine, Eyebrow, Field, Loading, Screen, T, Title, Toggle } from "@/components/ui";
import { api, type State } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { ago, firstName, when } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

const SECTIONS = [
  { key: "opportunities", label: "Opportunities" },
  { key: "mentors", label: "Mentors" },
  { key: "cofounders", label: "Co-founders" },
  { key: "partners", label: "Partners" },
  { key: "capital", label: "Capital" },
] as const;
type Section = (typeof SECTIONS)[number]["key"];

/** Everyone around you who isn't in your circle: what's on, mentors, co-founders, partners and capital. */
export default function Network() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [section, setSection] = useState<Section>(SECTIONS.find((s) => s.key === params.section)?.key ?? "opportunities");
  return (
    <Screen>
      <Title>Network</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
        <View style={{ width: 12 }} />
        {SECTIONS.map((s) => (
          <Chip key={s.key} label={s.label} on={section === s.key} onPress={() => setSection(s.key)} />
        ))}
        <View style={{ width: 12 }} />
      </ScrollView>
      {section === "opportunities" && <Opportunities />}
      {section === "mentors" && <Mentors />}
      {section === "cofounders" && <CoFounders />}
      {section === "partners" && <Partners />}
      {section === "capital" && <Capital />}
    </Screen>
  );
}

const stateLine = (s: State, yes: string, pending: string) => (s === "yes" ? yes : s === "pending" ? pending : s === "not now" ? "They said not now. You can ask again when things have moved on." : null);

// ── Opportunities ─────────────────────────────────────────────

const REQUEST_LINE: Record<string, string> = { PENDING: "Asked · the host will pick", PICKED: "You're in", NOT_THIS_TIME: "Not this time", WITHDRAWN: "Withdrawn" };

function Opportunities() {
  const { data, error } = useLoad(api.opportunities);
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  return (
    <View style={{ gap: 14 }}>
      <T tone="muted">Dinners, trips and workshops hosted by mentors, partners and backers. You only see the ones that fit you, and why.</T>
      {data.canHost && (
        <Button variant="secondary" small style={{ alignSelf: "flex-start" }} onPress={() => router.push("/hosting")}>
          What you're hosting
        </Button>
      )}
      {data.opportunities.length === 0 && <T tone="subtle">Nothing that fits you right now. New ones come up every few weeks.</T>}
      {data.opportunities.map((o) => (
        <Card key={o.id} onPress={() => router.push({ pathname: "/opportunity/[id]", params: { id: o.id } })} style={{ gap: 8 }}>
          <T size={12} tone="subtle" mono>
            {o.kindLabel.toUpperCase()} · {o.place.toUpperCase()} · {when(o.startsAt).toUpperCase()}
          </T>
          <T size={18} weight="medium">
            {o.title}
          </T>
          <T size={14} tone="muted">
            Hosted by {o.host.name}
            {o.host.line ? `, ${o.host.line}` : ""}
          </T>
          {o.request ? (
            <T size={13} weight="medium">
              {REQUEST_LINE[o.request]}
            </T>
          ) : (
            o.why && (
              <T size={13} tone="subtle">
                Why you're seeing this: {o.why}
              </T>
            )
          )}
        </Card>
      ))}
    </View>
  );
}

// ── Mentors ───────────────────────────────────────────────────

function Mentors() {
  const col = useColors();
  const { data, error } = useLoad(api.mentors);
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  return (
    <View style={{ gap: 14 }}>
      <T tone="muted">People who&apos;ve done it. Ask one for help; if they say yes, you two decide how to work together.</T>
      {data.mentors.map((m) => {
        const line = m.ask.status === "yes" ? "Mentoring you" : m.ask.status === "pending" ? "Asked · waiting for an answer" : !m.open ? "Not taking new requests right now" : null;
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
    </View>
  );
}

// ── Co-founders ───────────────────────────────────────────────

function CoFounders() {
  const { data, error, reload } = useLoad(api.coFounders);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState("");
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  const draft = note ?? data.me.note ?? "";
  const set = async (open: boolean) => {
    setErr("");
    try {
      await api.setOpenToMatches(open, draft);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <View style={{ gap: 14 }}>
      <T tone="muted">People open to building something together. You only see what they chose to share.</T>
      <Card style={{ gap: 12 }}>
        <Toggle label="I'm open to building with someone" hint="Others can see your name, headline, strengths and this line, and say hello." value={data.me.open} onChange={set} />
        <Field value={draft} onChangeText={setNote} placeholder="What you're looking for, in a line" onEndEditing={() => data.me.open && note !== null && set(true)} />
        <ErrorLine>{err}</ErrorLine>
      </Card>
      {data.people.map((p) => (
        <Card key={p.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Avatar name={p.name} size={40} />
            <View style={{ flex: 1 }}>
              <T weight="medium">{p.name}</T>
              <T size={13} tone="muted" lines={2}>
                {[p.headline, p.location].filter(Boolean).join(" · ")}
              </T>
            </View>
          </View>
          {p.lookingFor && <T size={15}>Looking for: {p.lookingFor}</T>}
          {p.strengths && (
            <T size={14} tone="muted">
              Strong at: {p.strengths}
            </T>
          )}
          {p.sameField && p.field && (
            <T size={12} tone="subtle">
              Also builds in {p.field.toLowerCase()}
            </T>
          )}
          <AskInline
            label="Say hello"
            placeholder={`What you're building and why you'd like to talk to ${firstName(p.name)}`}
            done={stateLine(p.hello, `You and ${firstName(p.name)} are talking. Find them in Messages.`, "Said hello · waiting for an answer")}
            onSend={async (n) => {
              await api.hello(p.id, n);
              await reload();
            }}
          />
        </Card>
      ))}
    </View>
  );
}

// ── Partners ──────────────────────────────────────────────────

function Partners() {
  const { data, error, reload } = useLoad(api.partners);
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  return (
    <View style={{ gap: 14 }}>
      <T tone="muted">Firms that do the work: legal, manufacturing, marketing, finance. Their contact details come with a yes.</T>
      {data.partners.map((p) => (
        <Card key={p.id} style={{ gap: 8 }}>
          <T size={12} tone="subtle" mono>
            {p.categories.join(" · ").toUpperCase()} · {p.location.toUpperCase()}
          </T>
          <T size={17} weight="medium">
            {p.name}
          </T>
          <T size={14}>{p.tagline}</T>
          {p.priceNote && (
            <T size={13} tone="subtle">
              {p.priceNote}
            </T>
          )}
          <AskInline
            label="Ask for an intro"
            placeholder="What you're building and what you need from them"
            done={stateLine(p.intro, "Introduced. Check Messages or your email.", "Intro asked · waiting for an answer")}
            onSend={async (n) => {
              await api.askIntro(p.id, n);
              await reload();
            }}
          />
        </Card>
      ))}
    </View>
  );
}

// ── Capital ───────────────────────────────────────────────────

/** Interest and introductions only. No amounts, valuations or terms; no money moves on SELF. */
const NotAnOffer = () => (
  <T size={12} tone="subtle">
    SELF makes introductions only. Nothing here is an offer to buy or sell anything, and no money moves on SELF.
  </T>
);

function Capital() {
  const { data, error, reload } = useLoad(api.capital);
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  return (
    <View style={{ gap: 14 }}>
      {data.isBacker ? <BackerView /> : <FounderCapital data={data} reload={reload} />}
      <Card onPress={() => router.push("/funds")} style={{ gap: 4 }}>
        <T weight="medium">Investing through SELF</T>
        <T size={14} tone="muted">
          Not available yet. Here&apos;s why, and what it will take.
        </T>
      </Card>
      <NotAnOffer />
    </View>
  );
}

function FounderCapital({ data, reload }: { data: NonNullable<Awaited<ReturnType<typeof api.capital>>>; reload: () => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };
  return (
    <>
      <T tone="muted">Share short updates with backers on SELF when you choose. Never your journal, never amounts or terms. Backers follow, and can tell you they&apos;re interested.</T>
      <Card style={{ gap: 12 }}>
        <Toggle label="Open to backers" hint={data.openToBackers ? "Backers on SELF can read your updates." : "Off: nobody sees your updates."} value={data.openToBackers} onChange={(v) => run(() => api.setOpenToBackers(v))} disabled={busy} />
        {data.followers.length > 0 && (
          <T size={13} tone="muted">
            Following your updates: {data.followers.join(", ")}
          </T>
        )}
      </Card>
      <Card lift style={{ gap: 10 }}>
        <Field label="Share an update" value={text} onChangeText={setText} multiline placeholder="What moved: something shipped, learned or decided." hint="No amounts, valuations or terms." />
        <Button small busy={busy} disabled={text.trim().length < 20} style={{ alignSelf: "flex-start" }} onPress={() => run(async () => { await api.postUpdate(text); setText(""); })}>
          Share with backers
        </Button>
        <ErrorLine>{err}</ErrorLine>
      </Card>
      {data.interest.map((i) => (
        <Card key={i.id} onPress={i.status === "PENDING" ? () => router.push("/requests") : undefined} style={{ gap: 6 }}>
          <T weight="medium">
            {i.from} {i.status === "PENDING" ? "is interested" : "· you're talking"}
          </T>
          <T size={14} tone="muted">
            {i.note}
          </T>
        </Card>
      ))}
      {data.updates.length > 0 && <Eyebrow>Your updates</Eyebrow>}
      {data.updates.map((u) => (
        <View key={u.id} style={{ gap: 2 }}>
          <T size={15}>{u.text}</T>
          <T size={12} tone="subtle">
            {ago(u.at)}
          </T>
        </View>
      ))}
    </>
  );
}

function BackerView() {
  const { data, error, reload } = useLoad(api.founders);
  if (!data) return error ? <ErrorLine>{error}</ErrorLine> : <Loading />;
  return (
    <>
      <T tone="muted">Founders sharing their progress with backers. Follow their updates; tell them if you&apos;re interested. A yes opens a conversation.</T>
      {data.founders.map((f) => (
        <Card key={f.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Avatar name={f.name} size={40} />
            <View style={{ flex: 1 }}>
              <T weight="medium">{f.company ? `${f.name} · ${f.company.name}` : f.name}</T>
              <T size={13} tone="muted" lines={2}>
                {f.company?.oneLiner ?? f.headline}
              </T>
            </View>
          </View>
          {f.updates.map((u) => (
            <View key={u.id} style={{ gap: 2 }}>
              <T size={14}>{u.text}</T>
              <T size={12} tone="subtle">
                {ago(u.at)}
              </T>
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              small
              variant={f.following ? "ghost" : "secondary"}
              onPress={async () => {
                await api.follow(f.id, !f.following).catch(() => {});
                await reload();
              }}
            >
              {f.following ? "Following" : "Follow updates"}
            </Button>
          </View>
          <AskInline
            label="I'm interested"
            placeholder="What caught your eye, and what you could bring besides money"
            hint="No amounts, valuations or terms."
            done={stateLine(f.interest, `You and ${firstName(f.name)} are talking. Find them in Messages.`, "Interest sent · waiting for an answer")}
            onSend={async (n) => {
              await api.interest(f.id, n);
              await reload();
            }}
          />
        </Card>
      ))}
    </>
  );
}
