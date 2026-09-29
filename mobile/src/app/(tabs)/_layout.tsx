import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { TabIcon, type TabIconName } from "@/components/TabIcon";
import { Loading } from "@/components/ui";
import { gate, useSession } from "@/lib/session";
import { font, useColors } from "@/lib/theme";

const TABS: { name: TabIconName; title: string }[] = [
  { name: "today", title: "Today" },
  { name: "circle", title: "Circle" },
  { name: "mentors", title: "Mentors" },
  { name: "messages", title: "Messages" },
  { name: "you", title: "You" },
];

/** The app proper, for members who have finished onboarding. */
export default function TabsLayout() {
  const c = useColors();
  const { status, me } = useSession();
  if (status === "loading") return <Loading />;
  if (gate(me) !== "/today") return <Redirect href={gate(me)} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarActiveTintColor: c.fg,
        tabBarInactiveTintColor: c.fgSubtle,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border, borderTopWidth: 1, elevation: 0, ...(Platform.OS === "web" ? { height: 64, paddingTop: 6, paddingBottom: 8 } : {}) },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11, lineHeight: 14 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <TabIcon name={t.name} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}
