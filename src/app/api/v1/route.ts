import { json } from "@/lib/self/http";

/** No key needed: says what this is and where the docs are. */
export async function GET() {
  return json({
    name: "Self API",
    version: "v1",
    note: "Sandbox only. Synthetic customers; not a production service.",
    docs: "/docs",
  });
}
