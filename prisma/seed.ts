/*
 * Demo data. Every person here is fictional; emails end in @self.demo so the
 * sign-in page can offer "sign in as" in dev. Safe to re-run: it upserts.
 *
 *   npx prisma db seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Role } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Person = {
  key: string;
  name: string;
  roles: Role[];
  headline: string;
  location: string;
  onboarded?: boolean;
  beliefs?: string;
  workStyle?: string;
  buildingToward?: string;
  strengths?: string;
  gaps?: string;
  decisionStyle?: string;
  focusAreas?: string[];
  mentorNote?: string;
  backerNote?: string;
  partnerOrgName?: string;
  contactLink?: string;
};

const people: Person[] = [
  {
    key: "maya",
    name: "Maya Okonkwo",
    roles: ["BUILDER"],
    headline: "Ex-shipping ops lead, turning kelp into packaging",
    location: "Lisbon",
    beliefs:
      "Most people think sustainable packaging has to cost more. I think the cost is in the logistics, not the material, and nobody has redesigned the logistics.",
    workStyle:
      "Early mornings, long walks, then a burst of building. I write everything down before I talk about it. I like a small room and a clear owner for every decision.",
    buildingToward:
      "Coastal towns that make money from the sea without emptying it. The packaging is just the first product that proves it.",
    strengths: "Operations. Suppliers trust me. I can make a spreadsheet tell a story and a factory floor run on time.",
    gaps: "Brand and storytelling. I also need someone who can build the software side, and someone who loves fundraising more than I do.",
    decisionStyle:
      "Data first, then I sleep on it. If a partner disagrees I want the argument out loud, same day. I'd rather be wrong fast than right in a month.",
    contactLink: "https://example.com/maya",
  },
  {
    key: "dev",
    name: "Dev Raman",
    roles: ["BUILDER", "MENTOR"],
    headline: "Two-time technical founder, one exit, one lesson",
    location: "London",
    beliefs:
      "Most early teams build too much. The best MVP is embarrassing and specific. Equity should be split evenly unless there's a very good reason, then vested hard.",
    workStyle: "Late nights, headphones, long uninterrupted blocks. I prototype before I plan.",
    buildingToward: "A studio that helps non-technical founders ship their first real version without getting fleeced.",
    strengths: "Shipping software fast. Hiring engineers. Saying no to features.",
    gaps: "Sales. Patience with process. I need someone who will make me write the plan down.",
    decisionStyle: "Gut, then test it. I disagree loudly and then commit fully.",
    focusAreas: ["AI", "B2B software", "Product", "Hiring"],
    mentorNote: "I help first-time founders scope MVPs and hire their first two engineers.",
    contactLink: "https://example.com/dev",
  },
  {
    key: "ana",
    name: "Ana Ruiz",
    roles: ["BUILDER"],
    headline: "Night-shift nurse building a bakery for night workers",
    location: "Chicago",
    beliefs:
      "Night workers are a whole city nobody designs for. Food at 3am is either vending machines or nothing, and people will pay for better.",
    workStyle: "Irregular hours, lots of short sessions. I talk ideas through with people before I commit.",
    buildingToward: "Owning something that looks after people the way my shifts look after patients.",
    strengths: "Staying calm under pressure. I know my customers because I am one.",
    gaps: "Numbers, leases, suppliers. I've never run a business.",
    decisionStyle: "I ask three people I trust, then decide. I hate conflict but I don't avoid it.",
  },
  {
    key: "kwame",
    name: "Kwame Asante",
    roles: ["BUILDER"],
    headline: "Soil scientist mapping farmland from phone photos",
    location: "Accra",
    beliefs: "Smallholder farmers have better data than anyone thinks. It's just in their heads and their phones.",
    workStyle: "Field days and desk days. I need both. I plan in quarters and adjust weekly.",
    buildingToward: "Farmers getting credit on the strength of their soil, not their paperwork.",
    strengths: "Research, patience, field trust. I speak three local languages.",
    gaps: "Product design and anything to do with investors.",
    decisionStyle: "Evidence, then consensus. I slow down when the stakes go up.",
  },
  {
    key: "lena",
    name: "Lena Fischer",
    roles: ["BUILDER"],
    headline: "Designer building tools for community clinics",
    location: "Berlin",
    beliefs: "Healthcare software is ugly because nobody who buys it has to use it. Clinics will switch for something their staff love.",
    workStyle: "Sketch, share, sketch again. I work best with daily check-ins and a shared board.",
    buildingToward: "A clinic where the software disappears and the care is all you notice.",
    strengths: "Design, research, making complex things feel simple.",
    gaps: "Engineering, regulatory, sales cycles.",
    decisionStyle: "I prototype the options and let users choose. With co-founders I want written trade-offs.",
  },
  {
    key: "tomas",
    name: "Tomás Herrera",
    roles: ["BUILDER"],
    headline: "Carpenter making repairable hand tools",
    location: "Mexico City",
    beliefs: "People want to own fewer, better things. Tools should last three generations and be fixable at home.",
    workStyle: "With my hands first. I think by building.",
    buildingToward: "A workshop brand that's proud to sell you spare parts.",
    strengths: "Making, sourcing materials, quality control.",
    gaps: "E-commerce, marketing, anything online.",
    decisionStyle: "If it feels wrong in the hand, it's wrong. I trust craft over spreadsheets, which is sometimes a problem.",
  },
  {
    key: "priya",
    name: "Priya Nair",
    roles: ["BACKER"],
    headline: "Angel. Former operator. Backs first-time founders",
    location: "Singapore",
    focusAreas: ["Climate", "Food", "Supply chain"],
    backerNote: "I back operators who've felt the problem firsthand, early, before the deck is polished.",
  },
  {
    key: "marcus",
    name: "Marcus Bell",
    roles: ["BACKER", "MENTOR"],
    headline: "Community fund lead, ex-founder",
    location: "Atlanta",
    focusAreas: ["Community", "Consumer", "Fundraising"],
    backerNote: "Local businesses with national potential. I care about who's building more than the category.",
    mentorNote: "Fundraising narrative and investor Q&A practice. I'll tell you what a pass really means.",
  },
  {
    key: "harbor",
    name: "Jules Okafor",
    roles: ["PARTNER"],
    headline: "Startup lawyer. Formation, equity, first contracts",
    location: "New York",
    partnerOrgName: "Harbor & Vine Legal",
  },
  {
    key: "northloop",
    name: "Sofia Lindqvist",
    roles: ["PARTNER"],
    headline: "Contract manufacturing broker, EU + Asia",
    location: "Rotterdam",
    partnerOrgName: "Northloop Sourcing",
  },
  {
    key: "ines",
    name: "Ines Okafor",
    roles: ["MENTOR"],
    headline: "Supply chain lead at three consumer brands",
    location: "Manchester",
    focusAreas: ["Supply chain", "Operations", "Hardware"],
    mentorNote: "First production runs, supplier negotiation, and not getting stuck with 10,000 units.",
  },
  {
    key: "admin",
    name: "Sam Admin",
    roles: ["ADMIN", "BUILDER"],
    headline: "Runs SELF",
    location: "Remote",
  },
  {
    // Signs in fresh so you can walk through onboarding.
    key: "new",
    name: "New Builder",
    roles: [],
    headline: "",
    location: "",
    onboarded: false,
  },
];

async function main() {
  for (const p of people) {
    const { key, name, onboarded = true, ...rest } = p;
    const email = `${key}@self.demo`;
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, emailVerified: true },
      update: { name },
    });
    // Explicit nulls so re-seeding resets anything changed while testing.
    const blank = {
      beliefs: null, workStyle: null, buildingToward: null, strengths: null, gaps: null,
      decisionStyle: null, mentorNote: null, backerNote: null, partnerOrgName: null, contactLink: null,
    };
    const data = {
      ...blank,
      ...rest,
      headline: rest.headline || null,
      location: rest.location || null,
      focusAreas: rest.focusAreas ?? [],
      contactEmail: email,
      onboardedAt: onboarded ? new Date() : null,
      onboardingStep: 0,
    };
    await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  }
  console.log(`Seeded ${people.length} people.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
