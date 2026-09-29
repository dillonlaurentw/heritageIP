import { router } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Avatar, Button, Card, Dot, ErrorLine, Eyebrow, Loading, Screen, T, Title } from "@/components/ui";
import { api, type CheckIn } from "@/lib/api";
import { font, useColors } from "@/lib/theme";
import { ago, firstName } from "@/lib/time";
import { useLoad } from "@/lib/useLoad";

/** Your circle's week: who checked in, what they need, replies, and SELF's weekly note. */
export default function CircleScreen() {
  const { data, error, reload } = useLoad(api.circle);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!data) return error ? <Screen><ErrorLine>{error}</ErrorLine></Screen> : <Loading />;
  const c = data.circle;
  if (!c)
    return (
      <Screen>
        <Title>Your circle</Title>
        <T tone="muted">You&apos;re not in a circle yet. We&apos;ll place you in one soon.</T>
      </Screen>
    );
  const others = c.checkIns.filter((x) => x.userId !== data.me);
  const summarise = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.summarise();
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Title>{c.name}</Title>
        <T tone="muted">
          {c.checkIns.length} of {c.members.length} checked in this week
        </T>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {c.members.map((m) => (
          <View key={m.id} style={{ alignItems: "center", gap: 4, width: 52, opacity: m.checkedIn ? 1 : 0.45 }}>
            <Avatar name={m.name} size={40} />
            <T size={11} tone="muted" lines={1}>
              {m.id === data.me ? "You" : firstName(m.name)}
            </T>
          </View>
        ))}
      </View>

      {!c.mine ? (
        <Card lift style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Dot />
            <T weight="medium">Your check-in is the one missing</T>
          </View>
          <T tone="muted">What you did, where you&apos;re stuck, what would help. Two minutes.</T>
          <Button onPress={() => router.push("/checkin")}>Check in</Button>
        </Card>
      ) : (
        <CheckInCard ci={c.mine} me={data.me} mine onChange={reload} />
      )}

      {c.summary ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Eyebrow>This week&apos;s note</Eyebrow>
            <T size={11} tone="subtle" mono>
              SELF{c.summary.demo ? " · DEMO" : ""}
            </T>
          </View>
          <T>{c.summary.text}</T>
          {c.summary.helps.length > 0 && (
            <View style={{ gap: 8 }}>
              <T size={13} weight="medium">
                Who could help whom
              </T>
              {c.summary.helps.map((h, i) => (
                <T key={i} size={14} tone="muted">
                  {h.from} → {h.to}: {h.why}
                </T>
              ))}
            </View>
          )}
        </Card>
      ) : (
        c.checkIns.length >= 2 && (
          <Card style={{ gap: 10 }}>
            <T weight="medium">SELF can write this week&apos;s note</T>
            <T size={14} tone="muted">
              A short read of the circle&apos;s week and who could help whom. No rankings, nothing about anyone outside the circle.
            </T>
            <Button variant="secondary" small busy={busy} style={{ alignSelf: "flex-start" }} onPress={summarise}>
              Write the note
            </Button>
            <ErrorLine>{err}</ErrorLine>
          </Card>
        )
      )}

      {others.length > 0 && <Eyebrow>From your circle</Eyebrow>}
      {others.map((ci) => (
        <CheckInCard key={ci.id} ci={ci} me={data.me} onChange={reload} />
      ))}
    </Screen>
  );
}

function CheckInCard({ ci, me, mine, onChange }: { ci: CheckIn; me: string; mine?: boolean; onChange: () => void }) {
  const col = useColors();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await api.reply(ci.id, text);
      setText("");
      setOpen(false);
      onChange();
    } catch {}
    setBusy(false);
  };
  const Part = ({ label, body }: { label: string; body: string }) =>
    body ? (
      <View style={{ gap: 2 }}>
        <T size={12} tone="subtle">
          {label}
        </T>
        <T>{body}</T>
      </View>
    ) : null;
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={ci.name} size={32} />
        <T weight="medium" style={{ flex: 1 }}>
          {mine ? "Your check-in" : ci.name}
        </T>
        <T size={12} tone="subtle">
          {ago(ci.at)}
        </T>
      </View>
      <Part label="Did" body={ci.did} />
      <Part label="Stuck" body={ci.stuck} />
      <Part label="Would help" body={ci.need} />
      {ci.replies.map((r) => (
        <View key={r.id} style={{ flexDirection: "row", gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderColor: col.border }}>
          <T size={14} style={{ flex: 1 }}>
            <T size={14} weight="medium">
              {r.authorId === me ? "You" : firstName(r.author)}
            </T>{" "}
            {r.text}
          </T>
        </View>
      ))}
      {mine ? (
        <Pressable onPress={() => router.push("/checkin")}>
          <T size={13} tone="muted">
            Edit
          </T>
        </Pressable>
      ) : open ? (
        <View style={{ gap: 8 }}>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder={`I can help with…`}
            placeholderTextColor={col.fgSubtle}
            multiline
            style={{ borderWidth: 1, borderColor: col.border, borderRadius: 14, padding: 12, minHeight: 60, fontFamily: font.regular, fontSize: 15, color: col.fg }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button small busy={busy} disabled={text.trim().length < 2} onPress={send}>
              Reply
            </Button>
            <Button small variant="ghost" onPress={() => setOpen(false)}>
              Cancel
            </Button>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)}>
          <T size={13} tone="muted">
            I can help
          </T>
        </Pressable>
      )}
    </Card>
  );
}
