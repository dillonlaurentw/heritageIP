"use client";

import { Copy, ExternalLink, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  archivePageAction,
  duplicatePageAction,
  movePageAction,
  newPage,
  searchPalette,
} from "@/app/actions/pages";
import { newDatabase } from "@/app/actions/databases";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { useToast } from "@/components/ui/Toast";
import { CommandPalette } from "./CommandPalette";
import { DemoSwitch } from "./DemoSwitch";
import { ShellProvider } from "./ShellContext";
import { Sidebar } from "./Sidebar";
import type { PaletteItem, ShellWorkspace, TreeNode } from "./types";

type Props = {
  user: { name: string; email: string; isAdmin: boolean };
  workspaces: ShellWorkspace[];
  current: (ShellWorkspace & { id: string }) | null;
  personal: { slug: string; id: string };
  tree: TreeNode[];
  privateTree: TreeNode[];
  inboxCount: number;
  canEdit: boolean;
  signOut: () => Promise<void>;
  demoUsers: { email: string; name: string; roles: string }[];
  children: ReactNode;
};

/** Wires the sidebar and ⌘K to page actions. Everything visual lives in Sidebar. */
export function ShellClient(p: Props) {
  const router = useRouter();
  const toast = useToast();

  const create = async (workspaceId: string, parentId: string | null) => {
    const res = await newPage(workspaceId, parentId);
    if (res.ok) router.push(res.href as Route);
    else toast(res.message, "danger");
  };

  const workspaceOf = (nodeId: string) => (findIn(p.privateTree, nodeId) ? p.personal.id : p.current?.id ?? p.personal.id);

  const palette: PaletteItem[] = [
      { id: "go-home", label: "Home", group: "Go to", href: "/home" },
      { id: "go-inbox", label: "Inbox", group: "Go to", href: "/inbox" },
      { id: "go-network", label: "Network", group: "Go to", href: "/network", keywords: "co-founders mentors partners backers roles" },
      ...(p.current
        ? [
            { id: "go-people", label: `People in ${p.current.name}`, group: "Go to", href: `/w/${p.current.slug}/people` },
            { id: "go-templates", label: "Templates", group: "Go to", href: `/w/${p.current.slug}/templates`, keywords: "new from template gtm meeting weekly" },
            { id: "go-thesis", label: "Write or sharpen the thesis", group: "Actions", href: `/w/${p.current.slug}/thesis`, keywords: "idea problem why now ai" },
            { id: "go-plan", label: "Plan with SELF", group: "Actions", href: `/w/${p.current.slug}/plan`, keywords: "game plan steps roadmap ai" },
            { id: "go-settings", label: `${p.current.name} settings`, group: "Go to", href: `/w/${p.current.slug}/settings` },
          ]
        : []),
      ...p.workspaces
        .filter((w) => w.slug !== p.current?.slug)
        .map((w) => ({ id: `ws:${w.slug}`, label: w.name, group: "Workspaces", href: `/w/${w.slug}`, keywords: "switch workspace" })),
      ...(p.canEdit && p.current ? [{ id: "new-page", label: "New page", group: "Actions", action: "new-page", keywords: "create add" }] : []),
      ...(p.canEdit && p.current ? [{ id: "new-db", label: "New database", group: "Actions", action: "new-database", keywords: "create table board calendar tracker" }] : []),
      { id: "new-private", label: "New private page", group: "Actions", action: "new-private", keywords: "create note" },
      { id: "new-ws", label: "New workspace", group: "Actions", href: "/new", keywords: "company idea create" },
      { id: "profile", label: "Your profile", group: "Actions", href: "/me", keywords: "account settings" },
      { id: "theme", label: "Switch light / dark", group: "Actions", action: "theme", keywords: "theme dark mode" },
  ];

  return (
    <ShellProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar
          user={p.user}
          workspaces={p.workspaces}
          current={p.current}
          personalSlug={p.personal.slug}
          tree={p.tree}
          privateTree={p.privateTree}
          inboxCount={p.inboxCount}
          canEdit={p.canEdit}
          signOut={() => void p.signOut()}
          onNewPage={(where) => void create(where === "private" || !p.current ? p.personal.id : p.current.id, null)}
          treeHandlers={{
            onAddChild: (parentId) => void create(workspaceOf(parentId), parentId),
            onDropNode: async (dragId, targetId, where) => {
              const res = await movePageAction(dragId, targetId, where);
              if (!res.ok) toast(res.message, "danger");
            },
            renderMenu: (node, trigger) => (
              <Menu trigger={trigger as React.ReactElement} className="w-52">
                <MenuItem icon={<ExternalLink />} onClick={() => router.push(node.href as Route)}>
                  Open
                </MenuItem>
                <MenuItem
                  icon={<Copy />}
                  onClick={async () => {
                    const res = await duplicatePageAction(node.id);
                    if (res.ok) router.push(res.href as Route);
                    else toast(res.message, "danger");
                  }}
                >
                  Duplicate
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={<Trash2 />}
                  danger
                  onClick={async () => {
                    const res = await archivePageAction(node.id);
                    if (res.ok) toast("Moved to trash");
                    else toast(res.message, "danger");
                  }}
                >
                  Move to trash
                </MenuItem>
              </Menu>
            ),
          }}
          footer={p.demoUsers.length > 0 ? <DemoSwitch current={p.user.email} users={p.demoUsers} /> : null}
        />
        <main id="main" className="scroll-quiet relative flex min-w-0 flex-1 flex-col overflow-y-auto">
          {p.children}
        </main>
      </div>
      <CommandPalette
        items={palette}
        search={searchPalette}
        onAction={(action, q) => {
          if (action === "new-page" && p.current) void create(p.current.id, null);
          else if (action === "new-database" && p.current)
            void newDatabase(p.current.id, null).then((res) => (res.ok ? router.push(res.href as Route) : toast(res.message, "danger")));
          else if (action === "new-private") void create(p.personal.id, null);
          else if (action === "ask") router.push(`/ask?q=${encodeURIComponent(q)}` as Route);
        }}
      />
    </ShellProvider>
  );
}

function findIn(nodes: TreeNode[], id: string): boolean {
  return nodes.some((n) => n.id === id || findIn(n.children, id));
}
