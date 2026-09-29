/** Quiet line icons for the tab bar, drawn with SVG (no icon font to load). */
import Svg, { Circle, Path } from "react-native-svg";

export type TabIconName = "today" | "circle" | "mentors" | "messages" | "you";

export function TabIcon({ name, color, size = 22 }: { name: TabIconName; color: string; size?: number }) {
  const s = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "today" && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...s} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
        </>
      )}
      {name === "circle" && (
        <>
          <Circle cx={12} cy={5.5} r={2.2} {...s} />
          <Circle cx={5.8} cy={16} r={2.2} {...s} />
          <Circle cx={18.2} cy={16} r={2.2} {...s} />
          <Path d="M10.2 7 7 14 M13.8 7 17 14 M8 16.5h8" {...s} />
        </>
      )}
      {name === "mentors" && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...s} />
          <Path d="M12 7.5V12l3 2" {...s} />
        </>
      )}
      {name === "messages" && <Path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3.5v-3.5h0.5a2 2 0 0 1-2-2z" {...s} />}
      {name === "you" && (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...s} />
          <Path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" {...s} />
        </>
      )}
    </Svg>
  );
}
