/**
 * SELF's primitives for the app: text, cards, pill buttons, fields.
 * Quiet and warm: paper background, white cards, ink actions, orange only
 * for "needs you".
 */
import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font, radius, space, useColors } from "@/lib/theme";

type Tone = "fg" | "muted" | "subtle" | "accent" | "danger" | "inverse";

export function T({
  children,
  size = 15,
  weight = "regular",
  tone = "fg",
  mono,
  center,
  lines,
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: "regular" | "medium" | "semibold";
  tone?: Tone;
  mono?: boolean;
  center?: boolean;
  lines?: number;
  style?: StyleProp<TextStyle>;
}) {
  const c = useColors();
  const color = { fg: c.fg, muted: c.fgMuted, subtle: c.fgSubtle, accent: c.accentText, danger: c.danger, inverse: c.primaryFg }[tone];
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          color,
          fontFamily: mono ? font.mono : font[weight],
          fontSize: size,
          lineHeight: Math.round(size * (size >= 24 ? 1.2 : 1.5)),
          letterSpacing: size >= 28 ? -0.6 : 0,
          textAlign: center ? "center" : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const Title = ({ children }: { children: ReactNode }) => (
  <T size={30} weight="medium">
    {children}
  </T>
);

export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <T size={size} weight="semibold" style={{ letterSpacing: size * 0.18 }}>
      SELF
    </T>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <T size={12} tone="muted" weight="medium" style={{ letterSpacing: 0.4, textTransform: "uppercase" }}>
    {children}
  </T>
);

/** The orange dot: "this needs you". */
export function Dot() {
  const c = useColors();
  return <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent }} />;
}

export function Card({ children, lift, style, onPress }: { children: ReactNode; lift?: boolean; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors();
  const base: ViewStyle = {
    backgroundColor: c.surface,
    borderRadius: lift ? radius.lift : radius.card,
    padding: lift ? 24 : 18,
    boxShadow: lift ? "0 40px 80px -48px rgba(29,29,31,0.24)" : "0 1px 2px rgba(29,29,31,0.03), 0 12px 24px -18px rgba(29,29,31,0.18)",
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }, style]}>
      {children}
    </Pressable>
  );
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled,
  busy,
  small,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = variant === "primary" ? c.primary : variant === "secondary" ? c.surface : "transparent";
  const fg = variant === "primary" ? c.primaryFg : c.fg;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingHorizontal: small ? 14 : 22,
          height: small ? 34 : 48,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {busy && <ActivityIndicator size="small" color={fg} />}
      <Text style={{ color: fg, fontFamily: font.medium, fontSize: small ? 13 : 15 }}>{children}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, style, ...rest }: TextInputProps & { label?: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <T size={13} weight="medium">
          {label}
        </T>
      )}
      <TextInput
        placeholderTextColor={c.fgSubtle}
        {...rest}
        style={[
          {
            backgroundColor: c.surface,
            borderRadius: radius.field,
            borderWidth: 1,
            borderColor: c.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: font.regular,
            fontSize: 16,
            color: c.fg,
            minHeight: rest.multiline ? 96 : 48,
            textAlignVertical: rest.multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {hint && (
        <T size={12} tone="subtle">
          {hint}
        </T>
      )}
    </View>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const c = useColors();
  const i = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % c.avatars.length;
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.avatars[i], alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: c.avatarFg, fontFamily: font.medium, fontSize: size * 0.36 }}>{letters}</Text>
    </View>
  );
}

/** A full screen: paper background, safe areas, scrolls, 20px gutters. */
export function Screen({ children, scroll = true, back, title, right }: { children: ReactNode; scroll?: boolean; back?: boolean; title?: string; right?: ReactNode }) {
  const c = useColors();
  const header =
    back || title ? (
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: space.gutter, height: 48, gap: 12 }}>
        {back && (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))} hitSlop={12}>
            <T size={22} tone="muted">
              ‹
            </T>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {title && (
            <T size={15} weight="medium" lines={1}>
              {title}
            </T>
          )}
        </View>
        {right}
      </View>
    ) : null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "left", "right"]}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: space.gutter, paddingTop: header ? 4 : space.gutter, paddingBottom: 48, gap: 20 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
      <ActivityIndicator color={c.fgMuted} />
    </View>
  );
}

export function ErrorLine({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <T size={13} tone="danger">
      {children}
    </T>
  );
}

/** A two-way switch between options (e.g. "I have an invite" / "Apply"). */
export function Segmented<K extends string>({ value, options, onChange }: { value: K; options: { key: K; label: string }[]; onChange: (k: K) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.bgInset, borderRadius: radius.pill, padding: 3 }}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            flex: 1,
            height: 34,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: o.key === value ? c.surface : "transparent",
            boxShadow: o.key === value ? "0 1px 3px rgba(29,29,31,0.12)" : undefined,
          }}
        >
          <T size={13} weight={o.key === value ? "medium" : "regular"} tone={o.key === value ? "fg" : "muted"}>
            {o.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
