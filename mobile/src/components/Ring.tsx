/**
 * The ring for the app. Same rules as the web (<Ring>): you in the middle,
 * four quarters, a dark stretch of arc under people you work with, grey for
 * pending, dashed orange circles for open chairs.
 *
 * In stage 1 the top-left quarter is your circle of peers and the bottom-right
 * your advisors (mentors); partners and capital are drawn but quiet: "later".
 */
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { ARC_GAP, arcPath, initials, layoutRing, THEME_ARC, THEMES, type PlacedNode, type RingNode, type Theme } from "@/lib/ring";
import { font, useColors } from "@/lib/theme";
import { T } from "./ui";

export const APP_LABELS: Record<Theme, { label: string; later?: boolean }> = {
  COFOUNDERS: { label: "Peers" },
  PARTNERS: { label: "Partners", later: true },
  ADVISORS: { label: "Advisors" },
  CAPITAL: { label: "Capital", later: true },
};

function summary(t: Theme, nodes: RingNode[]) {
  if (APP_LABELS[t].later) return "later";
  const mine = nodes.filter((n) => n.theme === t);
  if (!mine.length) return t === "ADVISORS" ? "ask a mentor" : "your circle";
  const linked = mine.filter((n) => n.state === "linked").length;
  const pending = mine.filter((n) => n.state === "pending").length;
  return [linked && `${linked} ${t === "ADVISORS" ? "with you" : "talking"}`, pending && `${pending} quiet`].filter(Boolean).join(" · ");
}

export function Ring({
  nodes,
  size = 280,
  labels = true,
  onNode,
  center = "you",
}: {
  nodes: RingNode[];
  size?: number;
  labels?: boolean;
  onNode?: (n: PlacedNode) => void;
  center?: string;
}) {
  const c = useColors();
  const pad = labels ? 44 : 10;
  const box = size + pad * 2;
  const mid = box / 2;
  const r = size * 0.4;
  const dot = Math.round(Math.max(26, Math.min(40, size * 0.11)));
  const stroke = Math.max(4, Math.round(size / 64));
  const { placed } = layoutRing(nodes, mid, mid, r);

  return (
    <View style={{ width: box, height: box, alignSelf: "center" }}>
      <View
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.surface,
          boxShadow: "0 40px 80px -48px rgba(29,29,31,0.24)",
        }}
      />
      <Svg width={box} height={box} style={{ position: "absolute" }}>
        {THEMES.map((t) => {
          const [a, b] = THEME_ARC[t];
          return <Path key={t} d={arcPath(mid, mid, r, a + ARC_GAP, b - ARC_GAP)} stroke={c.ringTrack} strokeWidth={stroke} strokeLinecap="round" fill="none" opacity={APP_LABELS[t].later ? 0.6 : 1} />;
        })}
        {placed
          .filter((p) => p.state === "linked")
          .map((p) => (
            <Path key={p.id} d={arcPath(mid, mid, r, p.angle - 13, p.angle + 13)} stroke={c.ringLink} strokeWidth={stroke} strokeLinecap="round" fill="none" />
          ))}
        <Circle cx={mid} cy={mid} r={r * 0.62} fill={c.bg} />
        <Circle cx={mid} cy={mid} r={Math.max(4, size / 80)} fill={c.accent} />
      </Svg>
      <View style={{ position: "absolute", left: 0, right: 0, top: mid + Math.max(10, size / 30), alignItems: "center" }}>
        <T size={13} tone="muted">
          {center}
        </T>
      </View>

      {placed.map((p) => (
        <Pressable
          key={p.id}
          accessibilityLabel={`${p.name}, ${p.note}`}
          onPress={onNode ? () => onNode(p) : undefined}
          style={{
            position: "absolute",
            left: p.x - dot / 2,
            top: p.y - dot / 2,
            width: dot,
            height: dot,
            borderRadius: p.kind === "firm" ? dot * 0.3 : dot / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: p.state === "linked" ? c.primary : c.surface,
            borderWidth: p.state === "open" ? 1.5 : p.state === "pending" ? 1 : 0,
            borderStyle: p.state === "open" ? "dashed" : "solid",
            borderColor: p.state === "open" ? c.accent : c.borderStrong,
          }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: dot * 0.34, color: p.state === "linked" ? c.primaryFg : p.state === "open" ? c.accent : c.fgSubtle }}>
            {p.state === "open" ? "+" : initials(p.name)}
          </Text>
        </Pressable>
      ))}

      {labels &&
        THEMES.map((t) => {
          const top = t === "COFOUNDERS" || t === "PARTNERS";
          const left = t === "COFOUNDERS" || t === "CAPITAL";
          return (
            <View key={t} style={{ position: "absolute", [top ? "top" : "bottom"]: 0, [left ? "left" : "right"]: 0, alignItems: left ? "flex-start" : "flex-end", maxWidth: box * 0.45 }}>
              <T size={13} weight="medium" tone={APP_LABELS[t].later ? "subtle" : "fg"}>
                {APP_LABELS[t].label}
              </T>
              <T size={12} tone="subtle">
                {summary(t, nodes)}
              </T>
            </View>
          );
        })}
    </View>
  );
}
