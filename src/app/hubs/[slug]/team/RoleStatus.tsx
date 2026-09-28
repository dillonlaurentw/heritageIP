"use client";

import { useTransition } from "react";
import { setRoleStatus } from "./actions";

export function RoleStatusControls({ roleId, status }: { roleId: string; status: "OPEN" | "FILLED" | "CLOSED" }) {
  const [busy, start] = useTransition();
  const set = (s: "OPEN" | "FILLED" | "CLOSED") => start(() => setRoleStatus(roleId, s));
  const btn = "text-small font-medium text-smoke hover:text-bone disabled:opacity-40";
  return (
    <div className="flex gap-5">
      {status === "OPEN" ? (
        <>
          <button type="button" className={btn} disabled={busy} onClick={() => set("FILLED")}>
            Mark filled
          </button>
          <button type="button" className={btn} disabled={busy} onClick={() => set("CLOSED")}>
            Close
          </button>
        </>
      ) : (
        <button type="button" className={btn} disabled={busy} onClick={() => set("OPEN")}>
          Reopen
        </button>
      )}
    </div>
  );
}
