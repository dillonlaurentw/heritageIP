/*
 * Demo data shared by the seed script. Clearly fictional people, companies
 * and firms, written so every screen looks real in a demo.
 */
import type { Role } from "../src/generated/prisma/enums";

export type Person = {
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

export const people: Person[] = [
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
    // A partner who has signed up but isn't linked to a firm yet: the admin
    // links them to Lakeshore Counsel in /admin/partners.
    key: "lakeshore",
    name: "Dana Whitfield",
    roles: ["PARTNER"],
    headline: "Food and hospitality lawyer",
    location: "Chicago",
    partnerOrgName: "Lakeshore Counsel",
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


export type SeedHub = {
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

export const hubs: SeedHub[] = [
  {
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
    owner: "maya",
    slug: "loam",
    name: "Loam",
    oneLiner: "Restaurant food waste, collected and composted within five miles.",
    rawIdea:
      "Restaurants throw out tonnes of food waste that gets trucked hours away. Urban farms on the edge of the city need compost. Connect them with small electric vans.",
  },
  {
    owner: "admin",
    slug: "common-thread",
    name: "Common Thread",
    oneLiner: "Neighbourhood textile repair and recycling points.",
    rawIdea: "Clothes get binned because fixing them is a hassle. Repair and drop-off points in libraries and community centres.",
  },
];


export type SeedStep = [stage: "VALIDATE" | "SETUP" | "BUILD" | "LAUNCH", title: string, detail: string, needs: string[], done?: boolean];

export const plans: Record<string, SeedStep[]> = {
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


export type SeedPartner = {
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
export const partners: SeedPartner[] = [
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

