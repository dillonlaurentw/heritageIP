import { router } from "expo-router";
import { View } from "react-native";
import { Ring } from "@/components/Ring";
import { Button, Screen, T, Wordmark } from "@/components/ui";
import type { RingNode } from "@/lib/ring";

/** A quiet picture of what you get: peers around you, advisors, and the rest later. */
const PREVIEW: RingNode[] = [
  { id: "a", theme: "COFOUNDERS", kind: "person", state: "linked", name: "Maya Okonkwo", note: "peer" },
  { id: "b", theme: "COFOUNDERS", kind: "person", state: "linked", name: "Dev Raman", note: "peer" },
  { id: "c", theme: "COFOUNDERS", kind: "person", state: "pending", name: "Joana Pires", note: "peer" },
  { id: "d", theme: "ADVISORS", kind: "person", state: "linked", name: "Rosa Almeida", note: "mentor" },
];

export default function Welcome() {
  return (
    <Screen>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <Wordmark />
      </View>
      <Ring nodes={PREVIEW} size={250} labels={false} />
      <View style={{ gap: 12 }}>
        <T size={32} weight="medium" style={{ lineHeight: 38 }}>
          Build with people who are building.
        </T>
        <T size={16} tone="muted">
          A circle of six founders who check in every week, and mentors who give you twenty minutes when you&apos;re stuck.
        </T>
        <T size={14} tone="subtle">
          Invite-only for now. Not by price or pedigree: by what you did last week.
        </T>
      </View>
      <View style={{ gap: 10 }}>
        <Button onPress={() => router.push("/sign-in")}>Get started</Button>
        <Button variant="ghost" onPress={() => router.push("/sign-in")}>
          I already have an account
        </Button>
      </View>
    </Screen>
  );
}
