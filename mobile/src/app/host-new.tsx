import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Chip, ErrorLine, Field, Screen, T, Title, Toggle } from "@/components/ui";
import { api } from "@/lib/api";

/** Same keys and words as src/lib/app-rules.ts. */
const KINDS: [string, string][] = [
  ["DINNER", "Dinner"],
  ["TRIP", "Trip"],
  ["WORKSHOP", "Workshop"],
  ["EVENT", "Event seat"],
  ["INTRO_DAY", "Intro day"],
];
const FIELDS: [string, string][] = [
  ["FOOD", "Food"],
  ["CLIMATE", "Climate"],
  ["HEALTH", "Health"],
  ["MONEY", "Fintech"],
  ["SOFTWARE", "Software"],
  ["CONSUMER", "Consumer"],
  ["HARDWARE", "Hardware"],
];
const STAGES: [string, string][] = [
  ["IDEA", "Idea"],
  ["BUILDING", "First build"],
  ["FIRST_CUSTOMERS", "First customers"],
  ["GROWING", "Growing"],
];
const WHEN: [number, string][] = [
  [7, "In a week"],
  [14, "In two weeks"],
  [30, "In a month"],
  [60, "In two months"],
];

const toggle = (list: string[], k: string) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

/** Host something. Small and real: a dinner, a visit, an hour online. SELF takes no payments. */
export default function HostNew() {
  const [kind, setKind] = useState("DINNER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [days, setDays] = useState(14);
  const [seats, setSeats] = useState("8");
  const [forWho, setForWho] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [buildingOnly, setBuildingOnly] = useState(false);
  const [costNote, setCostNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    const start = new Date(Date.now() + days * 86_400_000);
    start.setUTCHours(18, 0, 0, 0);
    try {
      await api.host({ kind, title, description, place, startsAt: start.toISOString(), seats: Number(seats), forWho: forWho || "Any member", fields, stages, buildingOnly, costNote: costNote || null });
      router.replace("/hosting");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen back>
      <Title>Host something</Title>
      <T tone="muted">You pick who comes, for fit. Members only see it if it fits them, and they see why. Nobody pays for a seat through SELF.</T>
      <Card lift style={{ gap: 16 }}>
        <Wrap>
          {KINDS.map(([k, v]) => (
            <Chip key={k} label={v} on={kind === k} onPress={() => setKind(k)} />
          ))}
        </Wrap>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Food founders dinner" />
        <Field label="What it is" value={description} onChangeText={setDescription} multiline placeholder="One long table, no pitching. Bring the question you can't answer yet." />
        <Field label="Where" value={place} onChangeText={setPlace} placeholder="Lisbon, or Online" />
        <T size={13} weight="medium">
          When
        </T>
        <Wrap>
          {WHEN.map(([d, v]) => (
            <Chip key={d} label={v} on={days === d} onPress={() => setDays(d)} />
          ))}
        </Wrap>
        <Field label="Seats" value={seats} onChangeText={(v) => setSeats(v.replace(/\D/g, ""))} keyboardType="number-pad" />
        <Field label="Who it's for, in words" value={forWho} onChangeText={setForWho} placeholder="Food founders finding first customers" />
        <T size={13} weight="medium">
          Only for these fields (none = anyone)
        </T>
        <Wrap>
          {FIELDS.map(([k, v]) => (
            <Chip key={k} label={v} on={fields.includes(k)} onPress={() => setFields(toggle(fields, k))} />
          ))}
        </Wrap>
        <T size={13} weight="medium">
          Only at these stages (none = any)
        </T>
        <Wrap>
          {STAGES.map(([k, v]) => (
            <Chip key={k} label={v} on={stages.includes(k)} onPress={() => setStages(toggle(stages, k))} />
          ))}
        </Wrap>
        <Toggle label="Only people building lately" hint="Wrote in their journal or talked in their circle in the last two weeks." value={buildingOnly} onChange={setBuildingOnly} />
        <Field label="Cost, in words" value={costNote} onChangeText={setCostNote} placeholder="Dinner is on me · You book your own travel" hint="SELF never takes payments. Say who covers what." />
        <ErrorLine>{error}</ErrorLine>
        <Button onPress={save} busy={busy} disabled={title.trim().length < 4 || description.trim().length < 20 || !place.trim() || !Number(seats)}>
          Post it
        </Button>
      </Card>
    </Screen>
  );
}

const Wrap = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
