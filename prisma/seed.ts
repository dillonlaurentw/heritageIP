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
  mentorOpen?: boolean;
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
    key: "rosa",
    name: "Rosa Almeida",
    roles: ["MENTOR"],
    headline: "Ran EU grant programmes for food and ocean startups",
    location: "Lisbon",
    focusAreas: ["Climate", "Food", "Fundraising"],
    mentorNote: "Non-dilutive funding in Europe: which grants fit, how evaluators read an application, and how to report without drowning.",
  },
  {
    key: "tunde",
    name: "Tunde Bakare",
    roles: ["MENTOR"],
    headline: "Built rural lending at two West African fintechs",
    location: "Lagos",
    focusAreas: ["Fintech", "AI", "Go-to-market"],
    mentorNote: "Credit models for people with thin files, partnering with rural banks, and getting agents in the field to trust your product.",
  },
  {
    key: "hana",
    name: "Hana Sato",
    roles: ["MENTOR"],
    headline: "Shipped clinical software through German certification",
    location: "Berlin",
    focusAreas: ["Health", "Product", "B2B software"],
    mentorNote: "Getting healthcare software certified without stalling the product, and selling to clinics where the buyer isn't the user.",
    mentorOpen: false,
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


type SeedHub = {
  number: number;
  owner: string;
  slug: string;
  name: string;
  oneLiner: string;
  rawIdea: string;
  cover?: { layout?: string; tone?: string };
  thesis?: {
    statement: string;
    problem: string;
    audience: string;
    whyNow: string;
    whyUs: string;
    contrarian: string;
    openQuestions: string[];
  };
};

const hubs: SeedHub[] = [
  {
    number: 1,
    owner: "maya",
    slug: "tidewater-kelp",
    name: "Tidewater Kelp",
    oneLiner: "Seaweed packaging for coastal food producers, made where it's used.",
    rawIdea:
      "Plastic packaging for seafood is absurd: it's used for two days and lasts four hundred years. Kelp grows fast right next to where the fish is landed. What if the packaging came from the same coast?",
    thesis: {
      statement:
        "Coastal food producers will switch to kelp packaging made on their own coast, because local production beats plastic on total cost once logistics are counted.",
      problem:
        "Seafood producers ship in plastic trays and film that cost more every year and that their buyers increasingly refuse. Existing bio-packaging is shipped in from far away and priced like a luxury.",
      audience:
        "Small and mid-size seafood processors on the Atlantic coast of Portugal and Spain, starting with the 40 in the Peniche and Nazaré area.",
      whyNow:
        "EU single-use plastic rules tighten in 2027, supermarket buyers already demand plastic-free seafood, and kelp farming capacity on the Iberian coast doubled in three years.",
      whyUs:
        "Maya ran shipping operations for a cold-chain logistics firm for eight years and knows these processors' supply chains, costs and buyers personally.",
      contrarian:
        "Sustainable packaging isn't expensive because of the material. It's expensive because of the logistics, and nobody has redesigned those.",
      openQuestions: [
        "Can kelp trays hold up to 48 hours of wet, chilled transport?",
        "Will processors sign volume commitments before a pilot proves it?",
      ],
    },
  },
  {
    number: 2,
    owner: "ana",
    slug: "night-shift-bakery",
    name: "Night Shift Bakery",
    oneLiner: "Real food, baked on the night shift's clock.",
    rawIdea:
      "I work nights. At 3am the only food is a vending machine. A bakery that opens at 10pm and delivers to hospitals, depots and call centres before the break.",
    cover: { layout: "index", tone: "raised" },
    thesis: {
      statement:
        "Night-shift workers are a large, loyal market nobody cooks for; a bakery that runs on their hours and delivers to their workplaces can own it.",
      problem:
        "Millions of people work nights and eat from vending machines or not at all. Kitchens close before their shift starts, and delivery apps are thin after midnight.",
      audience:
        "Nurses, warehouse and transit workers on night shifts in Chicago, reached through their employers: three hospitals and two logistics depots to start.",
      whyNow:
        "Employers are competing hard to retain night staff and are looking for perks that aren't pay rises. Ghost-kitchen space is cheap after 9pm.",
      whyUs: "Ana has worked night shifts as a nurse for nine years. She is the customer, and she knows the break-room politics.",
      contrarian: "Night workers don't want cheap food. They want food that feels like someone thought about them.",
      openQuestions: ["Will employers pay, or will workers pay?", "What's the smallest menu that keeps people coming back?"],
    },
  },
  {
    number: 3,
    owner: "kwame",
    slug: "ground-truth",
    name: "Ground Truth",
    oneLiner: "Soil maps from phone photos, so smallholders can borrow on their land's real value.",
    rawIdea:
      "Farmers in Ghana can't get credit because banks can't assess their land. But every farmer has a phone. Photos of soil plus a few simple tests could give lenders a real picture.",
    thesis: {
      statement:
        "Lenders will extend credit to smallholder farmers if they can see soil quality cheaply, and a phone photo plus a field kit is enough to show it.",
      problem:
        "Smallholders are refused loans because lenders have no reliable, cheap way to assess what their land can produce, so they price all farmers as high risk.",
      audience:
        "Rural banks and microfinance lenders in Ghana's Ashanti and Bono regions, and the cocoa and maize smallholders they lend to.",
      whyNow:
        "Phone cameras and on-device models are finally good enough for field use, and Ghana's central bank is pushing lenders to grow agricultural lending.",
      whyUs: "Kwame is a soil scientist with ten years of field research in these regions, fluent in three local languages and trusted by farmer cooperatives.",
      contrarian: "Smallholders have better data than anyone thinks. It's in their heads and their phones, not in databases.",
      openQuestions: ["Will a lender change a loan decision based on this in a pilot?", "Who pays for the field kit?"],
    },
  },
  {
    number: 4,
    owner: "lena",
    slug: "parallel-clinic",
    name: "Parallel Clinic",
    oneLiner: "Clinic software that staff choose, not just buyers.",
    rawIdea:
      "Community clinics run on ugly, slow software that nurses hate. If the software was actually good, staff would push to switch.",
    cover: { layout: "repeat", tone: "bone" },
    thesis: {
      statement:
        "In small community clinics, the staff who use the software can drive the purchase, so software designed for them first will win against incumbents built for buyers.",
      problem:
        "Community clinics use records and scheduling software built for hospital procurement. It's slow, confusing and adds an hour of admin to every shift.",
      audience: "Independent community clinics with 5 to 30 staff in Germany, starting with Berlin's 60 migrant-health and family clinics.",
      whyNow: "Germany's e-health mandates force clinics to replace legacy systems by 2027, opening a once-in-a-decade switching window.",
      whyUs: "Lena spent six years designing tools with clinic staff and has run research in twenty of these clinics.",
      contrarian: "Healthcare software is ugly because nobody who buys it has to use it. Fix that and staff will sell it for you.",
      openQuestions: ["Which compliance certifications are needed before the first sale?", "Who signs the contract in a 10-person clinic?"],
    },
  },
  {
    number: 5,
    owner: "tomas",
    slug: "open-hand-tools",
    name: "Open Hand Tools",
    oneLiner: "Hand tools built to be repaired at home, for three generations.",
    rawIdea: "Tools used to last a lifetime. Now they're glued shut. A workshop brand that sells spare parts proudly.",
    cover: { layout: "stack", tone: "bone" },
    thesis: {
      statement:
        "A growing group of buyers wants fewer, better things, and a tool brand that makes repair easy will earn their loyalty for decades.",
      problem: "Modern hand tools are designed to be replaced, not repaired. Parts aren't sold, and repair guides don't exist.",
      audience: "Serious home woodworkers and small workshops in Mexico and the US southwest who already buy premium tools.",
      whyNow: "Right-to-repair laws are spreading and buyers are actively searching for repairable products.",
      whyUs: "Tomás is a carpenter with twenty years at the bench and a network of small metal and wood suppliers in Mexico City.",
      contrarian: "Selling spare parts isn't lost revenue. It's the marketing.",
      openQuestions: ["Can he sell online without becoming a marketer?", "Which three tools prove the brand?"],
    },
  },
  {
    number: 6,
    owner: "dev",
    slug: "field-notes",
    name: "Field Notes",
    oneLiner: "Voice-first job notes for field technicians.",
    rawIdea:
      "Field technicians write up jobs in their vans, badly, at the end of the day. What if they just talked while working and the report wrote itself?",
    thesis: {
      statement:
        "Field service companies will pay for reports written from voice notes, because better job records cut repeat visits and disputes.",
      problem: "Technicians hate paperwork, so job reports are late and thin. That causes repeat visits, billing disputes and lost warranty claims.",
      audience: "HVAC and elevator maintenance companies with 20 to 200 technicians in the UK.",
      whyNow: "Speech models now handle noisy sites and technical vocabulary, and customers expect digital job records.",
      whyUs: "Dev has shipped two B2B products to field teams and knows how to build fast without overbuilding.",
      contrarian: "The best MVP here has no app. Technicians just send a voice note to a number.",
      openQuestions: ["Will companies pay per technician or per job?", "How do reports plug into their existing job systems?"],
    },
  },
  {
    number: 7,
    owner: "maya",
    slug: "loam",
    name: "Loam",
    oneLiner: "Restaurant food waste, collected and composted within five miles.",
    rawIdea:
      "Restaurants throw out tonnes of food waste that gets trucked hours away. Urban farms on the edge of the city need compost. Connect them with small electric vans.",
  },
  {
    number: 8,
    owner: "admin",
    slug: "common-thread",
    name: "Common Thread",
    oneLiner: "Neighbourhood textile repair and recycling points.",
    rawIdea: "Clothes get binned because fixing them is a hassle. Repair and drop-off points in libraries and community centres.",
  },
];


type SeedStep = [stage: "VALIDATE" | "SETUP" | "BUILD" | "LAUNCH", title: string, detail: string, needs: string[], done?: boolean];

const plans: Record<string, SeedStep[]> = {
  "tidewater-kelp": [
    ["VALIDATE", "Interview 15 seafood processors", "Peniche and Nazaré first. Done when you can name their packaging cost per kilo.", [], true],
    ["VALIDATE", "Wet-transport test for kelp trays", "Ship 200 trays chilled for 48 hours with a partner processor. Measure leaks and breakage.", ["SUPPLIER"], true],
    ["VALIDATE", "Get three letters of intent", "Three processors commit to a paid pilot if the trays pass the transport test.", [], true],
    ["SETUP", "Find a co-founder for brand and software", "Maya's gaps: storytelling, the software side, and fundraising.", ["COFOUNDER"], true],
    ["SETUP", "Form the company in Portugal", "Lda structure, founder vesting, and an IP assignment for the tray design.", ["LEGAL"]],
    ["SETUP", "Apply for the Blue Economy grant", "EU and Portuguese grants for coastal circular-economy pilots. Deadline in March.", ["FUNDING"]],
    ["BUILD", "Contract a local kelp press", "Two quotes from Iberian processors, one sample run of 5,000 trays.", ["SUPPLIER"]],
    ["BUILD", "Food-contact certification", "EU food-contact material testing before any trays touch fish.", ["LEGAL", "MENTOR"]],
    ["BUILD", "Paid pilot with the sardine processor", "30,000 trays a week for four weeks. Track cost per kilo against PET.", []],
    ["LAUNCH", "Brand and a one-page site for buyers", "Supermarket buyers need to see it before processors will switch.", ["MARKETING", "WEBSITE"]],
    ["LAUNCH", "Pitch the plastic-free story to two supermarket buyers", "Buyers pull processors. Get one buyer to name kelp trays as preferred.", ["GTM"]],
    ["LAUNCH", "Open to backers for a seed round", "After the pilot numbers, not before.", ["FUNDING", "MENTOR"]],
  ],
  "night-shift-bakery": [
    ["VALIDATE", "Survey 50 night-shift workers", "Break times, what they eat now, what they'd pay. At two hospitals and a depot.", [], true],
    ["VALIDATE", "Run a pop-up break-room table", "Three nights, one ward. Sell out or learn why not.", [], true],
    ["VALIDATE", "Pitch one employer on a staff-perk pilot", "HR at one hospital agrees to subsidise a month of deliveries.", ["MENTOR"]],
    ["SETUP", "Find a co-founder who runs kitchens", "Ana needs someone who knows food costs, leases and suppliers.", ["COFOUNDER"]],
    ["SETUP", "Food business licence and insurance", "City of Chicago food licence for a shared ghost kitchen.", ["LEGAL"]],
    ["BUILD", "Rent night hours in a ghost kitchen", "10pm to 6am, three nights a week to start.", ["SUPPLIER"]],
    ["BUILD", "A six-item menu that travels", "Built for 3am: warm, one-handed, holds for 40 minutes.", []],
    ["BUILD", "Simple ordering page for wards", "Order by 9pm, delivered to the break room by midnight.", ["WEBSITE"]],
    ["LAUNCH", "Launch at one hospital", "One ward, then the whole night shift. Every order gets a handwritten note.", ["MARKETING"]],
    ["LAUNCH", "Sign the second employer", "Use pilot numbers: retention, sick days, staff survey.", ["GTM"]],
  ],
  "field-notes": [
    ["VALIDATE", "Ride along with six technicians", "HVAC and elevator. Time how long write-ups take and where they break.", []],
    ["VALIDATE", "Voice-note-to-report by hand", "Dev writes reports from voice notes manually for ten jobs. Would managers pay for this?", []],
    ["SETUP", "Find a co-founder who sells to facilities managers", "Dev can build; he needs someone who can open doors.", ["COFOUNDER"]],
    ["SETUP", "Data processing agreement template", "Job sites include customer premises. Get GDPR right from day one.", ["LEGAL"]],
    ["BUILD", "WhatsApp number that returns a report", "No app. Send a voice note, get a structured PDF back in two minutes.", []],
    ["BUILD", "Integrate with one job-management system", "Pick the one most of the first ten customers use.", ["WEBSITE"]],
    ["LAUNCH", "Paid pilot with a 40-technician firm", "Per-technician pricing, one month.", ["GTM"]],
    ["LAUNCH", "Case study and a trade-show demo", "Numbers from the pilot: repeat visits, disputes, time saved.", ["MARKETING"]],
  ],
};


type SeedPartner = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categories: ("SUPPLIER" | "LEGAL" | "WEBSITE" | "MARKETING" | "GTM" | "DESIGN" | "FINANCE" | "OTHER")[];
  services: string[];
  stages: ("VALIDATE" | "SETUP" | "BUILD" | "LAUNCH")[];
  location: string;
  priceNote?: string;
  featured?: boolean;
  claimedBy?: string;
};

// Fictional firms. None of these are real companies.
const partners: SeedPartner[] = [
  { slug: "northloop-sourcing", name: "Northloop Sourcing", tagline: "Contract manufacturing without the 10,000-unit minimum.", description: "We broker first production runs between early brands and vetted factories across the EU and Asia. We negotiate small minimums, run samples, and stay on the factory floor until the first order ships.", categories: ["SUPPLIER"], services: ["Factory matching", "Sample runs", "Small first orders", "Quality inspections"], stages: ["BUILD"], location: "Rotterdam", priceNote: "Success fee on first order, no retainer", featured: true, claimedBy: "northloop" },
  { slug: "iberia-fibre-works", name: "Iberia Fibre Works", tagline: "Moulded fibre and bio-based packaging, made in Portugal.", description: "A packaging mill that runs short batches of trays, clamshells and inserts from plant fibre and seaweed blends. Food-contact certified lines.", categories: ["SUPPLIER"], services: ["Moulded fibre trays", "Food-contact lines", "Custom tooling", "Batches from 5,000"], stages: ["BUILD", "LAUNCH"], location: "Porto" },
  { slug: "oaxaca-forge-collective", name: "Oaxaca Forge Collective", tagline: "Small-batch metalwork by a cooperative of smiths.", description: "Forged and machined parts for tools, hardware and home goods. We'll make fifty before we make five thousand.", categories: ["SUPPLIER"], services: ["Forging", "CNC machining", "Heat treatment", "Spare-part runs"], stages: ["BUILD"], location: "Mexico City" },
  { slug: "brightline-kitchens", name: "Brightline Contract Kitchens", tagline: "Licensed kitchen space by the shift, including nights.", description: "Commercial kitchens rented by the shift across Chicago, with night hours, cold storage and delivery bays.", categories: ["SUPPLIER"], services: ["Night shifts", "Cold storage", "Licensed prep space", "Delivery bays"], stages: ["BUILD", "LAUNCH"], location: "Chicago", priceNote: "From $180 per shift" },
  { slug: "pearl-delta-prototyping", name: "Pearl Delta Prototyping", tagline: "From CAD to a working prototype in two weeks.", description: "Rapid prototyping for hardware: 3D print, soft tooling, electronics bring-up and a clear path to production.", categories: ["SUPPLIER", "DESIGN"], services: ["3D printing", "Soft tooling", "Electronics bring-up", "DFM reviews"], stages: ["VALIDATE", "BUILD"], location: "Shenzhen" },
  { slug: "harbor-and-vine-legal", name: "Harbor & Vine Legal", tagline: "Formation, equity and first contracts for early builders.", description: "A small firm for founders who haven't raised yet. We set up companies properly, write founder agreements people actually understand, and review your first customer and supplier contracts.", categories: ["LEGAL"], services: ["Company formation", "Founder agreements & vesting", "Customer contracts", "IP assignment"], stages: ["SETUP"], location: "New York", priceNote: "Fixed-fee formation from $1,200", featured: true, claimedBy: "harbor" },
  { slug: "lakeshore-counsel", name: "Lakeshore Counsel", tagline: "Licences, leases and food law for small operators.", description: "We help restaurants, kitchens and food startups get licensed, sign sane leases and stay on the right side of food regulations.", categories: ["LEGAL"], services: ["Food business licences", "Commercial leases", "Insurance review", "Employment basics"], stages: ["SETUP", "LAUNCH"], location: "Chicago", priceNote: "Fixed-fee licence packages" },
  { slug: "tejo-legal", name: "Tejo Legal", tagline: "Portuguese and EU company law, in plain English.", description: "Company formation in Portugal, EU grant compliance, and product regulation for startups selling into Europe.", categories: ["LEGAL"], services: ["Lda formation", "EU grant compliance", "Food-contact regulation", "Supplier contracts"], stages: ["SETUP", "BUILD"], location: "Lisbon", priceNote: "Formation from €900" },
  { slug: "kestrel-ip", name: "Kestrel IP", tagline: "Trademarks and patents before you tell the world.", description: "Patent and trademark attorneys who help early teams decide what's worth protecting, and file only that.", categories: ["LEGAL"], services: ["Trademark filing", "Patent searches", "Design registration", "IP strategy calls"], stages: ["SETUP", "LAUNCH"], location: "London" },
  { slug: "adwoa-mensah-partners", name: "Adwoa Mensah & Partners", tagline: "Company, lending and agri-finance law in Ghana.", description: "We work with agri and fintech founders on registration, lending licences and partnerships with rural banks.", categories: ["LEGAL"], services: ["Company registration", "Lending licences", "Bank partnerships", "Data protection"], stages: ["SETUP"], location: "Accra" },
  { slug: "quarterlight-studio", name: "Quarterlight Studio", tagline: "The first real version of your product, in eight weeks.", description: "A small product studio that designs and builds v1 web and mobile products for non-technical founders, then hands over cleanly.", categories: ["WEBSITE", "DESIGN"], services: ["MVP build", "Product design", "Integrations", "Clean handover"], stages: ["BUILD"], location: "Berlin", priceNote: "Fixed-scope sprints from €18k", featured: true },
  { slug: "shipyard-dev", name: "Shipyard Dev", tagline: "Websites and ordering pages that launch this month.", description: "Fast, accessible websites and simple ordering flows for small businesses and first launches.", categories: ["WEBSITE"], services: ["Launch websites", "Ordering pages", "Payments setup", "Analytics"], stages: ["BUILD", "LAUNCH"], location: "London", priceNote: "Launch sites from £2,500" },
  { slug: "nine-lives-web", name: "Nine Lives Web", tagline: "Shops that sell spare parts as proudly as products.", description: "E-commerce builds for makers and craft brands, including parts catalogues and repair guides.", categories: ["WEBSITE"], services: ["E-commerce", "Parts catalogues", "Repair guides", "Bilingual sites"], stages: ["BUILD", "LAUNCH"], location: "Mexico City" },
  { slug: "fieldwork-software", name: "Fieldwork Software", tagline: "Offline-first apps for people who work outdoors.", description: "Mobile apps that work without signal, in bright sun, in several languages. Agriculture, logistics and field service.", categories: ["WEBSITE"], services: ["Offline-first mobile", "Low-literacy UX", "SMS and WhatsApp flows", "Field testing"], stages: ["BUILD"], location: "Nairobi" },
  { slug: "loud-quiet", name: "Loud Quiet", tagline: "Brand identities for products with a conscience and a margin.", description: "A brand studio for sustainable consumer and B2B products: naming, identity, packaging and the pitch story.", categories: ["MARKETING", "DESIGN"], services: ["Naming", "Identity", "Packaging design", "Pitch narrative"], stages: ["BUILD", "LAUNCH"], location: "Lisbon", featured: true },
  { slug: "paper-tiger-content", name: "Paper Tiger Content", tagline: "Launch stories that press and buyers actually read.", description: "Content, PR and launch campaigns for early products, built around one clear story.", categories: ["MARKETING"], services: ["Launch PR", "Founder content", "Case studies", "Media training"], stages: ["LAUNCH"], location: "New York" },
  { slug: "common-tongue", name: "Common Tongue", tagline: "Marketing across languages and markets in Southeast Asia.", description: "Localisation and growth marketing for brands entering Singapore, Indonesia and the Philippines.", categories: ["MARKETING", "GTM"], services: ["Localisation", "Paid social", "Community launches", "Market entry research"], stages: ["LAUNCH"], location: "Singapore" },
  { slug: "first-twenty", name: "First Twenty", tagline: "We help you close your first twenty customers yourself.", description: "A sales sprint for founders: target list, scripts, pipeline and weekly coaching until twenty customers say yes.", categories: ["GTM"], services: ["Target lists", "Outreach scripts", "Pipeline setup", "Weekly coaching"], stages: ["VALIDATE", "LAUNCH"], location: "London", priceNote: "Six-week sprint, fixed fee" },
  { slug: "aisle-access", name: "Aisle Access", tagline: "Get your product in front of grocery buyers.", description: "Former supermarket buyers who prepare founders for category reviews and make warm intros to buyers.", categories: ["GTM"], services: ["Buyer intros", "Category review prep", "Pricing and margins", "Retail readiness"], stages: ["LAUNCH"], location: "Chicago" },
  { slug: "route-nine-distribution", name: "Route Nine Distribution", tagline: "EU distribution for small food and packaging brands.", description: "Warehousing, distribution and wholesale relationships across the Benelux and Iberia.", categories: ["GTM", "SUPPLIER"], services: ["Warehousing", "Wholesale intros", "EU logistics", "Pallet-level fulfilment"], stages: ["LAUNCH"], location: "Rotterdam" },
  { slug: "studio-mare", name: "Studio Maré", tagline: "Packaging design that ships well and sells better.", description: "Structural and graphic packaging design, tested for transport before it's printed.", categories: ["DESIGN"], services: ["Structural packaging", "Transport testing", "Print-ready artwork", "Sustainable materials"], stages: ["BUILD"], location: "Porto" },
  { slug: "plain-sight-design", name: "Plain Sight Design", tagline: "Product design for tools people use on hard days.", description: "UX research and interface design for healthcare, field work and operations software.", categories: ["DESIGN"], services: ["UX research", "Interface design", "Accessibility audits", "Usability testing"], stages: ["VALIDATE", "BUILD"], location: "Berlin" },
  { slug: "ledger-and-lamp", name: "Ledger & Lamp", tagline: "Bookkeeping and a monthly finance call for early teams.", description: "Bookkeeping, payroll, and a founder-friendly monthly look at burn and runway.", categories: ["FINANCE"], services: ["Bookkeeping", "Payroll", "Runway reports", "Year-end accounts"], stages: ["SETUP", "BUILD", "LAUNCH"], location: "London", priceNote: "From £250 a month" },
  { slug: "grantwise", name: "Grantwise", tagline: "Grant applications written with you, not for you.", description: "We find the non-dilutive grants you qualify for and help you write applications that win.", categories: ["FINANCE", "OTHER"], services: ["Grant search", "Application writing", "Budget narratives", "Reporting"], stages: ["SETUP"], location: "Dublin" },
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
      decisionStyle: null, mentorNote: null, backerNote: null, partnerOrgName: null, contactLink: null, mentorOpen: true,
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
  // ── Hubs: reset every demo-owned hub, then recreate. ──
  const demoUsers = await db.user.findMany({ where: { email: { endsWith: "@self.demo" } } });
  const idByKey = new Map(demoUsers.map((u) => [u.email.split("@")[0], u.id]));
  await db.hub.deleteMany({ where: { ownerId: { in: demoUsers.map((u) => u.id) } } });
  await db.agentRun.deleteMany({ where: { userId: { in: demoUsers.map((u) => u.id) } } });

  const DAY = 86_400_000;
  for (const [i, h] of hubs.entries()) {
    const ownerId = idByKey.get(h.owner)!;
    const created = new Date(Date.now() - (hubs.length - i) * 9 * DAY);
    const hub = await db.hub.create({
      data: {
        number: h.number,
        slug: h.slug,
        ownerId,
        name: h.name,
        oneLiner: h.oneLiner,
        rawIdea: h.rawIdea,
        stage: h.thesis ? "THESIS" : "IDEA",
        coverLayout: h.cover?.layout ?? null,
        coverTone: h.cover?.tone ?? null,
        createdAt: created,
      },
    });
    if (h.thesis) {
      await db.thesis.create({ data: { hubId: hub.id, ...h.thesis } });
      await db.thesisRevision.create({ data: { hubId: hub.id, source: "AGENT", snapshot: h.thesis, createdAt: created } });
    }
  }
  // Game plans for a few hubs; the rest are left for you to generate.
  for (const [slug, steps] of Object.entries(plans)) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug } });
    const pos = new Map<string, number>();
    await db.planStep.createMany({
      data: steps.map(([stage, title, detail, needs, done]) => {
        const position = pos.get(stage) ?? 0;
        pos.set(stage, position + 1);
        return {
          hubId: hub.id,
          stage,
          position,
          title,
          detail,
          needs: needs as never,
          source: "AGENT" as const,
          doneAt: done ? new Date(Date.now() - 5 * DAY) : null,
        };
      }),
    });
    await db.hub.update({ where: { id: hub.id }, data: { stage: "PLAN" } });
  }

  // ── Team: roles, interest signals, accepted members. ──
  type SeedRole = {
    hub: string;
    title: string;
    commitment: string;
    description: string;
    skills: string[];
    step?: string; // plan step title to link
    status?: "OPEN" | "FILLED" | "CLOSED";
    signals?: { from: string; note: string; status: "PENDING" | "ACCEPTED" | "DECLINED"; daysAgo: number }[];
  };
  const roles: SeedRole[] = [
    {
      hub: "tidewater-kelp",
      title: "Technical co-founder",
      commitment: "Co-founder",
      description:
        "Own the software side: supplier ordering, traceability for every tray, and the tools processors use to reorder. Early, scrappy, and close to the factory floor.",
      skills: ["Full-stack", "Ops tooling", "Hardware-adjacent"],
      step: "Find a co-founder for brand and software",
      status: "FILLED",
      signals: [
        {
          from: "dev",
          note: "I've built ordering and traceability tools for two field businesses. I like physical products with messy logistics, and I'd rather ship an ugly v1 in four weeks than plan for four months.",
          status: "ACCEPTED",
          daysAgo: 12,
        },
      ],
    },
    {
      hub: "tidewater-kelp",
      title: "Brand and storytelling co-founder",
      commitment: "Co-founder",
      description:
        "Make supermarket buyers and processors fall for kelp packaging. Own the brand, the pitch deck and the story of the coast. You'll lead fundraising prep with Maya.",
      skills: ["Brand", "Storytelling", "Fundraising"],
      step: "Find a co-founder for brand and software",
      signals: [
        {
          from: "lena",
          note: "I've spent six years making complicated things feel simple for people who don't have time for them. Your buyers are that audience. I'd love to design how this looks and sounds.",
          status: "PENDING",
          daysAgo: 2,
        },
        {
          from: "tomas",
          note: "I make things people keep for a lifetime. I think the story of kelp from the same coast is a craft story, and I know how to tell those.",
          status: "PENDING",
          daysAgo: 1,
        },
      ],
    },
    {
      hub: "night-shift-bakery",
      title: "Kitchen operations co-founder",
      commitment: "Co-founder",
      description:
        "Run the kitchen: suppliers, food costs, the ghost-kitchen lease and a night crew. Ana brings the customers and the story; you make it run at 3am.",
      skills: ["Kitchen ops", "Food costing", "Suppliers"],
      step: "Find a co-founder who runs kitchens",
      signals: [
        {
          from: "maya",
          note: "I ran cold-chain logistics for eight years. Getting warm food to a ward by midnight is a delivery-window problem, and those are my favourite kind.",
          status: "PENDING",
          daysAgo: 3,
        },
      ],
    },
    {
      hub: "field-notes",
      title: "Sales co-founder for facilities",
      commitment: "Co-founder",
      description: "Open doors at HVAC and elevator maintenance firms. You've sold to operations managers before and you like being in the van as much as the boardroom.",
      skills: ["B2B sales", "Facilities", "UK"],
      step: "Find a co-founder who sells to facilities managers",
    },
    {
      hub: "parallel-clinic",
      title: "Full-stack engineer",
      commitment: "Part-time",
      description: "Help build the first scheduling module with Lena. Ten hours a week to start, clinic visits included.",
      skills: ["TypeScript", "Healthcare data", "Accessibility"],
      signals: [
        {
          from: "dev",
          note: "Happy to do ten hours a week. I've shipped to field teams who hate software, which sounds a lot like clinic staff.",
          status: "PENDING",
          daysAgo: 4,
        },
      ],
    },
    {
      hub: "ground-truth",
      title: "Product designer",
      commitment: "Advisor",
      description: "Shape the phone flow farmers use in the field. It has to work in bright sun, offline, in three languages.",
      skills: ["Mobile", "Field research", "Low-literacy UX"],
      status: "FILLED",
      signals: [
        {
          from: "lena",
          note: "Designing for people who don't have time for software is my whole career. Offline and in bright sun is a fun constraint.",
          status: "ACCEPTED",
          daysAgo: 8,
        },
        {
          from: "ana",
          note: "I'm not a designer, but I've used a lot of bad hospital software on tired shifts and I know what breaks.",
          status: "DECLINED",
          daysAgo: 9,
        },
      ],
    },
  ];

  for (const r of roles) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug: r.hub } });
    const step = r.step ? await db.planStep.findFirst({ where: { hubId: hub.id, title: r.step } }) : null;
    const role = await db.roleOpening.create({
      data: {
        hubId: hub.id,
        planStepId: step?.id ?? null,
        title: r.title,
        commitment: r.commitment,
        description: r.description,
        skills: r.skills,
        status: r.status ?? "OPEN",
        createdAt: new Date(Date.now() - 14 * DAY),
      },
    });
    for (const sig of r.signals ?? []) {
      const at = new Date(Date.now() - sig.daysAgo * DAY);
      const fromUserId = idByKey.get(sig.from)!;
      await db.signal.create({
        data: {
          kind: "ROLE_INTEREST",
          status: sig.status,
          fromUserId,
          toUserId: hub.ownerId,
          hubId: hub.id,
          roleOpeningId: role.id,
          planStepId: step?.id ?? null,
          note: sig.note,
          createdAt: at,
          respondedAt: sig.status === "PENDING" ? null : new Date(at.getTime() + DAY),
        },
      });
      if (sig.status === "ACCEPTED") {
        await db.hubMember.create({ data: { hubId: hub.id, userId: fromUserId, role: r.title, joinedAt: new Date(at.getTime() + DAY) } });
      }
    }
  }

  // ── Partners: reset and recreate, then a few intro requests. ──
  await db.partner.deleteMany({ where: { slug: { in: partners.map((p) => p.slug) } } });
  for (const p of partners) {
    const { claimedBy, ...data } = p;
    await db.partner.create({
      data: { ...data, contactEmail: `intros@${p.slug}.example`, website: `https://${p.slug}.example`, claimedById: claimedBy ? idByKey.get(claimedBy) : null },
    });
  }
  const concierge = idByKey.get("admin")!;
  const intros: { from: string; hub: string; partner: string; step: string; status: "PENDING" | "ACCEPTED"; note: string; daysAgo: number }[] = [
    { from: "maya", hub: "tidewater-kelp", partner: "harbor-and-vine-legal", step: "Form the company in Portugal", status: "PENDING", daysAgo: 1, note: "We need to form in Portugal with founder vesting and an IP assignment for the tray design. Two co-founders, one more joining. Hoping to file this month." },
    { from: "maya", hub: "tidewater-kelp", partner: "northloop-sourcing", step: "Contract a local kelp press", status: "ACCEPTED", daysAgo: 6, note: "Looking for a press in Iberia for a 5,000-tray sample run of kelp trays, then 30,000 a week for a pilot." },
    { from: "ana", hub: "night-shift-bakery", partner: "lakeshore-counsel", step: "Food business licence and insurance", status: "PENDING", daysAgo: 2, note: "I need a food licence for a shared ghost kitchen running 10pm to 6am, and insurance for deliveries into hospitals." },
    { from: "dev", hub: "field-notes", partner: "quarterlight-studio", step: "Integrate with one job-management system", status: "ACCEPTED", daysAgo: 5, note: "Need help integrating with one job-management system our first customers use. Small, fixed scope." },
  ];
  for (const it of intros) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug: it.hub } });
    const partner = await db.partner.findUniqueOrThrow({ where: { slug: it.partner } });
    const step = await db.planStep.findFirst({ where: { hubId: hub.id, title: it.step } });
    const at = new Date(Date.now() - it.daysAgo * DAY);
    await db.signal.create({
      data: {
        kind: "PARTNER_INTRO",
        status: it.status,
        fromUserId: idByKey.get(it.from)!,
        toUserId: partner.claimedById ?? concierge,
        hubId: hub.id,
        partnerId: partner.id,
        planStepId: step?.id ?? null,
        note: it.note,
        createdAt: at,
        respondedAt: it.status === "ACCEPTED" ? new Date(at.getTime() + DAY / 2) : null,
      },
    });
  }
  console.log(`Seeded ${partners.length} partners.`);

  // ── Backer discovery: a few hubs opt in; some interest signals. ──
  const discovery: Record<string, { sector: string; backerAsk: string }> = {
    "tidewater-kelp": { sector: "Climate", backerAsk: "Operators who know EU food retail, and intros to blue-economy grant funds." },
    "night-shift-bakery": { sector: "Food", backerAsk: "Someone who has scaled a food business with hospital or employer contracts." },
    "ground-truth": { sector: "Fintech", backerAsk: "Backers with rural lending or agri-finance networks in West Africa." },
    "parallel-clinic": { sector: "Health", backerAsk: "Healthcare operators who know German clinic procurement." },
  };
  for (const [slug, d] of Object.entries(discovery)) {
    await db.hub.update({ where: { slug }, data: { discoverable: true, discoverableAt: new Date(Date.now() - 4 * DAY), ...d } });
  }
  const backerSignals: { from: string; hub: string; status: "PENDING" | "ACCEPTED"; note: string; daysAgo: number }[] = [
    { from: "priya", hub: "tidewater-kelp", status: "PENDING", daysAgo: 1, note: "I spent a decade in cold-chain for a Singapore seafood exporter. I'd love to understand your processor economics and help with buyer intros in Asia later." },
    { from: "marcus", hub: "night-shift-bakery", status: "ACCEPTED", daysAgo: 6, note: "Our community fund backs local food businesses with employer contracts. I'd like to hear how the hospital pilot is going." },
    { from: "marcus", hub: "parallel-clinic", status: "PENDING", daysAgo: 2, note: "Two of our portfolio founders run community clinics. Happy to open doors for your research visits." },
  ];
  for (const b of backerSignals) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug: b.hub } });
    const at = new Date(Date.now() - b.daysAgo * DAY);
    await db.signal.create({
      data: {
        kind: "BACKER_INTEREST",
        status: b.status,
        fromUserId: idByKey.get(b.from)!,
        toUserId: hub.ownerId,
        hubId: hub.id,
        note: b.note,
        createdAt: at,
        respondedAt: b.status === "ACCEPTED" ? new Date(at.getTime() + DAY) : null,
      },
    });
  }

  // ── Mentorship requests. ──
  const mentorAsks: { from: string; to: string; hub: string; step?: string; status: "PENDING" | "ACCEPTED"; note: string; daysAgo: number }[] = [
    { from: "maya", to: "ines", hub: "tidewater-kelp", step: "Food-contact certification", status: "ACCEPTED", daysAgo: 7, note: "We're about to run our first 5,000 trays and I've never taken a product through food-contact testing. An hour on what to test first would save us weeks." },
    { from: "maya", to: "rosa", hub: "tidewater-kelp", step: "Apply for the Blue Economy grant", status: "PENDING", daysAgo: 1, note: "We're applying for the Blue Economy grant in March. I'd love your read on whether our pilot fits, before we spend a month writing." },
    { from: "ana", to: "marcus", hub: "night-shift-bakery", step: "Pitch one employer on a staff-perk pilot", status: "PENDING", daysAgo: 2, note: "I'm pitching hospital HR on subsidising night-shift meals. You've sold to employers before; what makes them say yes?" },
    { from: "kwame", to: "tunde", hub: "ground-truth", status: "PENDING", daysAgo: 3, note: "Would a rural bank change a loan decision based on soil data? You've built lending with these banks. I'd value 30 minutes before our first pilot pitch." },
  ];
  for (const m of mentorAsks) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug: m.hub } });
    const step = m.step ? await db.planStep.findFirst({ where: { hubId: hub.id, title: m.step } }) : null;
    const at = new Date(Date.now() - m.daysAgo * DAY);
    await db.signal.create({
      data: {
        kind: "MENTOR_REQUEST",
        status: m.status,
        fromUserId: idByKey.get(m.from)!,
        toUserId: idByKey.get(m.to)!,
        hubId: hub.id,
        planStepId: step?.id ?? null,
        note: m.note,
        createdAt: at,
        respondedAt: m.status === "ACCEPTED" ? new Date(at.getTime() + DAY) : null,
      },
    });
  }

  // ── GTM workspaces (some sections left empty to try the agent). ──
  const gtm: Record<string, { positioning?: string; customers?: string; channels?: string; launchPlan?: string }> = {
    "tidewater-kelp": {
      positioning:
        "For seafood processors on the Iberian coast who are being pushed off plastic by buyers and EU rules, Tidewater Kelp is packaging made from kelp grown on their own coast. Unlike imported bio-packaging, it costs less once you count the freight.\nTagline: Packaging from the same sea as the catch.\n- Made within 50km of the processors who use it\n- Food-contact certified trays that survive 48 hours chilled\n- Priced against PET on total landed cost, not unit cost",
      customers:
        "Mid-size processors in Peniche and Nazaré\n- Who: sardine and mackerel processors shipping 20,000+ trays a week\n- Where to find them: the producers' association and the Monday auction\n- Trigger: a supermarket buyer asking for plastic-free packaging\n- First 20: the 15 processors already interviewed, then their referrals\n\nSupermarket seafood buyers\n- Who: category buyers for chilled seafood at Iberian chains\n- Where to find them: category reviews and sustainability teams\n- Trigger: 2027 plastic targets in their annual plan\n- First 20: intros through Aisle Access and the pilot processor",
      channels:
        "1. Direct to processors · Maya knows them from cold-chain work · 20 site visits, target 5 pilots\n2. Buyer pull · buyers make processors switch · 2 buyer meetings with pilot data\n3. Producers' association · one talk reaches 40 processors · a 15-minute slot at the spring meeting\n4. Trade press · short, local, credible · one story in the regional seafood trade press",
    },
    "night-shift-bakery": {
      positioning:
        "For night-shift nurses and warehouse crews who eat from vending machines at 3am, Night Shift Bakery is a bakery that runs on their clock and delivers to the break room. Unlike delivery apps, it's there when they're hungry.\nTagline: Real food on the night shift's clock.",
      customers:
        "Hospital night staff\n- Who: nurses and orderlies on 7pm to 7am shifts\n- Where to find them: ward break rooms and staff WhatsApp groups\n- Trigger: the 3am slump\n- First 20: Ana's own ward, then two neighbouring wards",
    },
  };
  for (const [slug, data] of Object.entries(gtm)) {
    const hub = await db.hub.findUniqueOrThrow({ where: { slug } });
    await db.gtmWorkspace.create({ data: { hubId: hub.id, ...data } });
  }

  // Keep the auto-number counter ahead of the seeded numbers.
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Hub"', 'number'), (SELECT MAX(number) FROM "Hub"))`);

  // One finished thesis dialogue, so the history reads real.
  const tide = await db.hub.findUniqueOrThrow({ where: { slug: "tidewater-kelp" }, include: { thesis: true } });
  const maya = idByKey.get("maya")!;
  const q1 = [
    "Who is the first processor who would pay for this, and what do they use today?",
    "What changed recently that makes kelp packaging possible or urgent now?",
    "What do you know about seafood logistics that someone new to it wouldn't?",
  ];
  const a1 = [
    "A mid-size sardine processor in Peniche. They use PET trays and film, about 30,000 a week.",
    "EU plastic rules in 2027, and supermarket buyers already asking for plastic-free seafood.",
    "Packaging is 20% of their logistics cost, mostly because it's shipped in from Asia.",
  ];
  await db.agentThread.create({
    data: {
      userId: maya,
      hubId: tide.id,
      kind: "thesis",
      createdAt: new Date(Date.now() - 20 * DAY),
      messages: {
        create: [
          {
            role: "AGENT",
            text: q1.join("\n"),
            data: { type: "questions", round: 1, reflection: "Packaging made from the same coast as the catch. The real bet is on cost, not virtue.", questions: q1 },
          },
          { role: "USER", text: a1.join("\n"), data: { type: "answers", answers: q1.map((q, i) => ({ question: q, answer: a1[i] })) } },
          { role: "AGENT", text: tide.thesis!.statement, data: { type: "draft", ...tide.thesis! } as never },
        ],
      },
    },
  });
  // A fresh thread, as saving a thesis leaves behind.
  await db.agentThread.create({ data: { userId: maya, hubId: tide.id, kind: "thesis" } });

  // Usage log rows so the (Phase 11) cost view has history.
  const runs = [
    ["thesis.questions", 2140, 410],
    ["thesis.draft", 3380, 1260],
    ["ideas.fromProfile", 1650, 980],
  ] as const;
  for (const [i, [purpose, inputTokens, outputTokens]] of runs.entries()) {
    await db.agentRun.create({
      data: { userId: maya, hubId: tide.id, purpose, model: "claude-opus-5", status: "OK", inputTokens, outputTokens, durationMs: 9000 + i * 4000, createdAt: new Date(Date.now() - (20 - i) * DAY) },
    });
  }
  console.log(`Seeded ${hubs.length} hubs.`);

}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
