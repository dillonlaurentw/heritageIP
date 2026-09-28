"use client";

import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";

/** Dev/demo only: sign in as another seed person, to test both sides of a request. */
export function DemoSwitch({ current, users }: { current: string; users: { email: string; name: string; roles: string }[] }) {
  return (
    <Popover
      side="top"
      align="end"
      className="w-72 p-1"
      trigger={
        <button
          type="button"
          className="flex h-6 items-center gap-1.5 rounded-md border border-dashed border-accent px-2 text-xs font-medium text-accent-text hover:bg-accent-soft"
        >
          <Users className="size-3.5" /> Demo
        </button>
      }
    >
      <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-fg-subtle">Demo: switch person</p>
      <div className="scroll-quiet max-h-[60vh] overflow-y-auto">
        {users.map((u) => (
          <form key={u.email} method="post" action="/api/demo-login">
            <button
              type="submit"
              name="email"
              value={u.email}
              disabled={u.email === current}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-bg-hover disabled:opacity-50"
            >
              <Avatar name={u.name} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{u.name}</span>
                <span className="block truncate text-xs text-fg-muted">{u.roles}</span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </Popover>
  );
}
