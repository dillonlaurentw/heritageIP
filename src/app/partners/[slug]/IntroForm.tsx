"use client";

import { askForIntro } from "../actions";
import { HubRequestForm, type HubOption } from "@/components/connect/HubRequestForm";

export function IntroForm({
  partnerId,
  partnerName,
  hubs,
  initialHubId,
  initialStepId,
}: {
  partnerId: string;
  partnerName: string;
  hubs: HubOption[];
  initialHubId: string | null;
  initialStepId: string | null;
}) {
  return (
    <HubRequestForm
      hubs={hubs}
      initialHubId={initialHubId}
      initialStepId={initialStepId}
      noteLabel={`A note to ${partnerName}`}
      placeholder="What you need, by when, and what you've done so far."
      hint="They'll see this with your hub's name and one-liner. Your contact details are shared only if they accept."
      submitLabel="Request an intro"
      sentLine={`Sent. We'll email you when ${partnerName} says yes.`}
      send={(input) => askForIntro({ partnerId, ...input })}
    />
  );
}
