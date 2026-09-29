import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Card, ErrorLine, Field, Screen, T, Title } from "@/components/ui";
import { api } from "@/lib/api";

/** The weekly check-in: three short answers your circle reads. Editable all week. */
export default function CheckInScreen() {
  const [did, setDid] = useState("");
  const [stuck, setStuck] = useState("");
  const [need, setNeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .circle()
      .then(({ circle }) => {
        if (circle?.mine) {
          setDid(circle.mine.did);
          setStuck(circle.mine.stuck);
          setNeed(circle.mine.need);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.checkIn({ did, stuck, need });
      // Back to wherever you came from (Today or Circle); both reload on focus.
      if (router.canGoBack()) router.back();
      else router.replace("/circle");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen back title="Check in">
      <Title>This week</Title>
      <T tone="muted">Short and true beats long and polished. Your circle reads this, nobody else.</T>
      <Card lift style={{ gap: 18 }}>
        <Field label="What did you get done?" value={did} onChangeText={setDid} multiline placeholder="Shipped, called, learned…" />
        <Field label="Where are you stuck?" value={stuck} onChangeText={setStuck} multiline placeholder="The thing you keep putting off, or can't crack." />
        <Field label="What would help?" value={need} onChangeText={setNeed} multiline placeholder="An intro, a second pair of eyes, someone who has done it." />
      </Card>
      <ErrorLine>{error}</ErrorLine>
      <Button onPress={save} busy={busy} disabled={did.trim().length < 5}>
        Share with my circle
      </Button>
    </Screen>
  );
}
