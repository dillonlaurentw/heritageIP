import { AppShell } from "@/components/shell/AppShell";

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
