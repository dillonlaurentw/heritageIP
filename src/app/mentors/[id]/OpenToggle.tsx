"use client";

import { useTransition } from "react";
import { setMentorOpen } from "../actions";
import { Button } from "@/components/ui/ArrowLink";

export function OpenToggle({ open }: { open: boolean }) {
  const [busy, start] = useTransition();
  return (
    <Button variant={open ? "ghost" : "signal"} disabled={busy} onClick={() => start(() => setMentorOpen(!open))}>
      {open ? "Pause new requests" : "Start taking requests"}
    </Button>
  );
}
