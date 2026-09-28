"use client";

import { Copy, FileText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShellProvider, useShell } from "@/components/shell/ShellContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Topbar } from "@/components/shell/Topbar";
import type { TreeNode } from "@/components/shell/types";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { Popover } from "@/components/ui/Popover";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import { Tag, TAG_COLORS } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";

const COLORS = [
  ["bg", "Background"],
  ["bg-subtle", "Sidebar, headers"],
  ["bg-inset", "Inputs, wells"],
  ["fg", "Text"],
  ["fg-muted", "Secondary text"],
  ["fg-subtle", "Tertiary text"],
  ["border", "Hairlines"],
  ["accent", "SELF orange"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["danger", "Danger"],
] as const;

const sampleTree: TreeNode[] = [
  { id: "1", title: "Thesis", icon: null, href: "#thesis", kind: "PAGE", children: [] },
  {
    id: "2",
    title: "Game plan",
    icon: null,
    href: "#plan",
    kind: "DATABASE",
    children: [],
  },
  {
    id: "3",
    title: "Team handbook",
    icon: "📘",
    href: "#handbook",
    kind: "PAGE",
    children: [{ id: "4", title: "How we meet", icon: null, href: "#meet", kind: "PAGE", children: [] }],
  },
];

export function StyleGuide() {
  return (
    <ShellProvider>
      <div className="flex h-dvh">
        <Sidebar
          user={{ name: "Maya Okonkwo", email: "maya@self.demo", isAdmin: false }}
          workspaces={[{ slug: "tidewater", name: "Tidewater Kelp", icon: null }]}
          current={{ slug: "tidewater", name: "Tidewater Kelp", icon: null }}
          personalSlug="maya"
          tree={sampleTree}
          privateTree={[{ id: "p1", title: "Ideas scratchpad", icon: null, href: "#scratch", kind: "PAGE", children: [] }]}
          inboxCount={3}
          canEdit
        />
        <main className="scroll-quiet min-w-0 flex-1 overflow-y-auto">
          <Topbar crumbs={[{ label: "SELF" }, { label: "Style guide", icon: null }]} actions={<ThemeToggle />} />
          <Content />
        </main>
      </div>
      <CommandPalette
        items={[
          { id: "home", label: "Home", group: "Go to", href: "/home" },
          { id: "theme", label: "Switch light / dark", group: "Actions", action: "theme" },
        ]}
      />
    </ShellProvider>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Content() {
  const toast = useToast();
  const { openPalette } = useShell();
  const [dialog, setDialog] = useState(false);
  const [on, setOn] = useState(true);

  return (
    <div className="mx-auto max-w-4xl px-8 pb-24">
      <div className="py-12">
        <h1 className="text-title font-bold">Style guide</h1>
        <p className="mt-2 max-w-2xl text-md text-fg-muted">
          Calm, clear and fast. Content leads; the interface stays quiet. One accent, SELF orange, for the primary action
          and live states. Try light and dark with the switch above.
        </p>
      </div>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLORS.map(([token, label]) => (
            <div key={token} className="overflow-hidden rounded-md border border-border">
              <div className="h-14" style={{ background: `var(--${token})` }} />
              <div className="px-2.5 py-2">
                <div className="font-mono text-xs">{token}</div>
                <div className="text-xs text-fg-muted">{label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {TAG_COLORS.map((c) => (
            <Tag key={c} color={c}>
              {c}
            </Tag>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-3">
          <p className="text-title font-bold">Page title · 40</p>
          <p className="text-2xl font-semibold">Heading 1 · 28</p>
          <p className="text-xl font-semibold">Heading 2 · 22</p>
          <p className="text-lg font-semibold">Heading 3 · 18</p>
          <p className="max-w-[72ch] text-md">
            Body text for writing, 16px with generous leading. Pages are for thinking, so text gets room to breathe and lines
            stay short enough to read.
          </p>
          <p className="text-base">UI text · 14</p>
          <p className="text-sm text-fg-muted">Sidebar, menus and tables · 13</p>
          <p className="font-mono text-xs text-fg-subtle">HUB-03 · 12/40 · mono for IDs and counts</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="primary" size="md">
            <Plus className="size-4" /> New page
          </Button>
          <Button size="xs">Extra small</Button>
          <Tooltip label="More actions" shortcut="⌘." render={<Button iconOnly variant="ghost" aria-label="More" />} />
          <Button disabled>Disabled</Button>
          <Spinner />
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <Field label="Workspace name" hint="You can change it any time.">
            <Input placeholder="Tidewater Kelp" />
          </Field>
          <Field label="Email" error="That doesn't look like an email.">
            <Input aria-invalid defaultValue="maya@" />
          </Field>
          <Field label="Role">
            <Select defaultValue="MEMBER">
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="GUEST">Guest</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Write something…" />
          </Field>
          <label className="flex items-center gap-3 text-base">
            <Switch checked={on} onCheckedChange={setOn} label="Let my agent join simulations" />
            Let my agent join simulations
          </label>
        </div>
      </Section>

      <Section title="Menus, popovers, dialogs">
        <div className="flex flex-wrap items-center gap-2">
          <Menu trigger={<Button>Open menu</Button>}>
            <MenuLabel>Page</MenuLabel>
            <MenuItem icon={<Pencil />} shortcut="⌘R">
              Rename
            </MenuItem>
            <MenuItem icon={<Copy />}>Duplicate</MenuItem>
            <MenuItem icon={<Sparkles />}>Ask AI</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger>
              Move to trash
            </MenuItem>
          </Menu>
          <Popover trigger={<Button>Popover</Button>} className="w-64">
            <p className="text-sm font-medium">Share this page</p>
            <p className="mt-1 text-xs text-fg-muted">Everyone in Tidewater Kelp can view and edit.</p>
          </Popover>
          <Button onClick={() => setDialog(true)}>Dialog</Button>
          <Button onClick={() => toast("Saved")}>Toast</Button>
          <Button onClick={() => openPalette()}>
            Command palette <Kbd>⌘K</Kbd>
          </Button>
        </div>
        <Dialog open={dialog} onOpenChange={setDialog} title="Invite people" description="They'll get an email with a link to join.">
          <div className="flex flex-col gap-3 p-5">
            <Input placeholder="name@company.com" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialog(false)}>
                Send invite
              </Button>
            </div>
          </div>
        </Dialog>
      </Section>

      <Section title="People">
        <div className="flex items-center gap-4">
          <Avatar name="Maya Okonkwo" size="xl" />
          <Avatar name="Dev Raman" size="lg" />
          <Avatar name="Ana Ruiz" />
          <AvatarStack names={["Maya Okonkwo", "Dev Raman", "Ana Ruiz", "Kwame Asante", "Lena Fischer"]} />
        </div>
      </Section>

      <Section title="Empty state">
        <div className="rounded-lg border border-dashed border-border">
          <EmptyState
            icon={<FileText />}
            title="No pages yet"
            hint="Pages hold your thinking: notes, plans, docs. Start with one."
            action={
              <Button variant="primary">
                <Plus className="size-4" /> New page
              </Button>
            }
          />
        </div>
      </Section>
    </div>
  );
}
