import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CATALOGUE, recommend, type Product } from "@/lib/demo/catalogue";
import { COOKIE_TOKEN, askSelf, demoClient, fetchIdentity } from "@/lib/demo/self-client";
import { AskBox } from "./ask-box";
import { SignalButtons } from "./signal-buttons";

export const metadata: Metadata = { title: "Cadence Outdoor (demo)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// The page (and its Ask Self box) waits for Self's answers.
export const maxDuration = 60;

// A pretend shop that uses "Sign in with Self", the way a real company would.
export default async function DemoShop({ searchParams }: PageProps<"/demo">) {
  const query = await searchParams;
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const identity = token ? await fetchIdentity(token) : null;
  const axes = identity?.self.formed ? identity.self.axes : null;
  const learned = identity?.learned ?? null;

  // Behind the scenes, Cadence asks Self which products to lead with.
  const LEAD_QUESTION = "Which of these products should we show this customer first, and why?";
  const lead =
    token && identity
      ? await askSelf(token, {
          question: LEAD_QUESTION,
          context: "Building the home page for a signed-in customer of Cadence Outdoor.",
          options: CATALOGUE.map((p) => ({ id: p.id, label: p.name, details: `${p.detail}, $${p.price}` })),
        })
      : null;
  const reasons = new Map(lead && !lead.declined ? lead.ranking.map((r) => [r.id, r.reason]) : []);
  const ranked = lead && !lead.declined ? lead.ranking.map((r) => CATALOGUE.find((p) => p.id === r.id)).filter((p): p is Product => !!p) : [];
  const picks = ranked.length >= 4
    ? ranked.slice(0, 4)
    : recommend(axes ? { aesthetic: axes.aesthetic?.value, riskPosture: axes.riskPosture?.value } : null, learned);

  return (
    <div className="min-h-dvh bg-[#f4f1ea] text-[#2b2a26]">
      <header className="flex items-center justify-between border-b border-[#ddd6c8] px-6 py-5 sm:px-12">
        <p className="font-display text-xl tracking-[0.08em]">CADENCE OUTDOOR</p>
        <p className="text-xs text-[#8a8576]">A demo shop for Sign in with Self · not a real store</p>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        {!identity ? (
          <>
            <h1 className="font-display text-[40px] leading-tight">Find gear that fits how you walk.</h1>
            <p className="mt-3 text-sm text-[#8a8576]">Sign in to get recommendations made for you.</p>
            {query.cancelled && <p className="mt-4 text-sm text-[#8a8576]">Sign-in was cancelled.</p>}
            {query.failed && <p className="mt-4 text-sm text-[#b42318]">Sign-in didn’t complete ({String(query.failed)}). Please try again.</p>}
            {demoClient() ? (
              <a href="/demo/login" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#111] px-6 py-3 text-sm tracking-wide text-[#fff]">
                <span className="size-3.5 rounded-full bg-[radial-gradient(circle_at_40%_40%,#8a87a6,#2d2b3a)]" />
                Sign in with Self
              </a>
            ) : (
              <p className="mt-8 text-sm text-[#8a8576]">
                The demo isn’t connected to Self yet (missing on this deployment:{" "}
                {["SELF_DEMO_CLIENT_ID", "SELF_DEMO_CLIENT_SECRET"].filter((k) => !process.env[k]).join(", ")}).
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="font-display text-[40px] leading-tight">Welcome, {identity.given_name ?? "friend"}.</h1>
              <a href="/demo/signout" className="text-xs text-[#8a8576] underline-offset-4 hover:underline">Sign out</a>
            </div>
            <p className="mt-2 text-sm text-[#8a8576]">Signed in with Self{identity.email ? ` as ${identity.email}` : ""}</p>
            <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.4fr]">
              <section>
                <p className="text-sm text-[#8a8576]">What Cadence received from your Self</p>
                {axes ? (
                  Object.entries(axes).map(([key, a]) => (
                    <div key={key} className="mt-3 text-[13px]">
                      {a.low} ↔ {a.high}
                      <div className="mt-1 h-1.5 rounded bg-[#e6e0d4]">
                        <div className="h-1.5 rounded bg-[#2b2a26]" style={{ width: `${a.value}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="mt-3 text-sm">No SELF yet. Do your SELF conversation at forself.xyz/self and come back.</p>
                )}
                <div className="mt-8">
                  <p className="text-sm text-[#8a8576]">What your Self has learned about your taste</p>
                  {learned ? (
                    <div className="mt-2 text-[13px]">
                      <p>{learned.summary}</p>
                      {learned.likes.length > 0 && <p className="mt-2"><span className="text-[#8a8576]">Likes:</span> {learned.likes.join(" · ")}</p>}
                      {learned.avoids.length > 0 && <p className="mt-1"><span className="text-[#8a8576]">Avoids:</span> {learned.avoids.join(" · ")}</p>}
                      <p className="mt-2 text-xs text-[#8a8576]">From {learned.based_on_signals} things you did at shops you signed in to with Self.</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px]">Nothing yet. Save a few things or tell us what’s not for you, and your Self starts learning.</p>
                  )}
                </div>
              </section>
              <section>
                <p className="text-sm text-[#8a8576]">{reasons.size ? "Picked for you by Self" : axes ? "Picked for you, from your Self" : "Popular right now"}</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {picks.map((p) => (
                    <div key={p.id} className="rounded-md border border-[#e6e0d4] bg-[#fff] p-4 text-sm">
                      <p>{p.name}</p>
                      <p className="text-[#8a8576]">{p.detail} · ${p.price}</p>
                      {reasons.get(p.id) && <p className="mt-2 text-xs text-[#5c5849]">{reasons.get(p.id)}</p>}
                      <SignalButtons productId={p.id} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[#8a8576]">Save and “Not for me” are sent back to your Self.</p>
                <div className="mt-10 rounded-md border border-dashed border-[#d6cfbf] p-4">
                  <p className="text-sm">Behind the scenes</p>
                  <p className="mt-1 text-xs text-[#8a8576]">
                    How a company uses Self in its own workflow: it asks questions about you and gets answers, without seeing your
                    conversations or profile.
                  </p>
                  {lead && (
                    <div className="mt-3 text-sm">
                      <p className="text-xs text-[#8a8576]">Cadence asked: “{LEAD_QUESTION}”</p>
                      <p className="mt-1">{lead.answer}</p>
                    </div>
                  )}
                  <p className="mt-5 text-xs text-[#8a8576]">Try asking Self something, as Cadence:</p>
                  <AskBox />
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
