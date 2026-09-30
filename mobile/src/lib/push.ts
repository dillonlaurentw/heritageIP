/**
 * Push notifications on the phone: ask once after sign-in, register this
 * phone's Expo push token with SELF, and open the right screen when a
 * notification is tapped. Does nothing on the web preview, in simulators, or
 * until the app has an EAS project id (see mobile/README.md).
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let current: string | null = null;

export async function registerForPush(): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) return;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "SELF", importance: Notifications.AndroidImportance.DEFAULT });
    }
    const existing = await Notifications.getPermissionsAsync();
    const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    if (!status.granted) return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    current = token;
    await api.pushToken(token, Platform.OS);
  } catch {
    // Push is a nicety: never block the app on it.
  }
}

/** Signing out: stop sending this phone notifications for that account. */
export async function forgetPush(): Promise<void> {
  if (!current) return;
  await api.forgetPushToken(current).catch(() => {});
  current = null;
}

/** Tapping a notification opens the screen it's about. */
export function listenForTaps() {
  if (Platform.OS === "web") return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const to = (r.notification.request.content.data as { to?: string } | undefined)?.to;
    if (to) router.push(to as Href);
  });
  return () => sub.remove();
}
