// Tells iOS that "Sign in with Self" links open the Self app when it's
// installed (Universal Links), skipping the web page. SELF_IOS_APP_IDS is
// "TEAMID.bundle.id" (comma-separated for more than one); until it's set the
// file lists no apps and links keep opening in the browser.
export const dynamic = "force-dynamic";

export function GET() {
  const appIDs = (process.env.SELF_IOS_APP_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return Response.json(
    {
      applinks: {
        details: appIDs.length
          ? [{ appIDs, components: [{ "/": "/self/oauth/authorize", comment: "Sign in with Self" }] }]
          : [],
      },
      webcredentials: { apps: appIDs },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
