import { redirect } from "next/navigation";

/** Self2's "Your agent" is now "Your Self". */
export default function AgentPage() {
  redirect("/me/self");
}
