import { AppShell } from "@/components/shell/AppShell";
import { RememberWorkspace } from "@/components/shell/RememberWorkspace";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  return (
    <AppShell slug={ws}>
      <RememberWorkspace slug={ws} />
      {children}
    </AppShell>
  );
}
