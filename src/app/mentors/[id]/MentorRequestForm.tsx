"use client";

import { askForMentor } from "../actions";
import { HubRequestForm, type HubOption } from "@/components/connect/HubRequestForm";

export function MentorRequestForm(props: { mentorId: string; firstName: string; hubs: HubOption[]; initialHubId: string | null; initialStepId: string | null }) {
  return (
    <HubRequestForm
      hubs={props.hubs}
      initialHubId={props.initialHubId}
      initialStepId={props.initialStepId}
      noteLabel={`A note to ${props.firstName}`}
      placeholder="What you're stuck on, what you've tried, and what an hour of their time would change."
      hint="Mentors give their time for free. Be specific. Contact details are shared only if they accept."
      submitLabel="Ask for mentorship"
      sentLine={`Sent. We'll email you when ${props.firstName} answers.`}
      send={(input) => askForMentor({ mentorId: props.mentorId, ...input })}
    />
  );
}
