import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "@/app/(app)/(global)/home/AcceptInviteButton";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/workspace-rules";

export const metadata: Metadata = { title: "Join a workspace" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?next=/invite/${encodeURIComponent(token)}` as never);
  if (!viewer.profile.onboardedAt) redirect("/onboarding");

  const invite = await db.invite.findUnique({
    where: { token },
    include: { workspace: { select: { name: true, icon: true, slug: true } }, invitedBy: { select: { name: true } } },
  });
  const valid = invite && !invite.acceptedAt && invite.expiresAt > new Date();
  const mine = valid && invite.email.toLowerCase() === viewer.user.email.toLowerCase();

  return (
    <div className="flex min-h-dvh items-start justify-center px-6 pt-[16vh]">
      <div className="w-full max-w-sm rounded-xl bg-surface shadow-card p-6 text-center">
        {!valid ? (
          <>
            <h1 className="text-lg font-semibold">This invite has expired</h1>
            <p className="mt-2 text-sm text-fg-muted">Ask whoever sent it for a new one.</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <WorkspaceMark name={invite.workspace.name} icon={invite.workspace.icon} size="lg" />
            </div>
            <h1 className="text-lg font-semibold">Join {invite.workspace.name}</h1>
            <p className="mt-2 text-sm text-fg-muted">
              {invite.invitedBy.name} invited you as {ROLE_LABEL[invite.role].toLowerCase()}.
            </p>
            {mine ? (
              <div className="mt-6 flex justify-center">
                <AcceptInviteButton token={token} />
              </div>
            ) : (
              <p className="mt-6 rounded-md bg-warning-soft px-3 py-2 text-sm">
                This invite is for {invite.email}, but you&apos;re signed in as {viewer.user.email}. Sign in with that email to join.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
