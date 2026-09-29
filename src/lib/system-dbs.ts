/**
 * The built-in databases every company workspace can have. Fixed property ids
 * so features (my tasks, goal progress, hiring, need tags) can rely on them.
 * Pure data: used by the server and by the seed.
 */
import { DEFAULT_STATUS, emptyConfig, type DbSchema, type ViewConfig, type ViewType } from "./db-schema";
import { NEED_TAGS, NEEDS } from "./needs";

export type SystemKey = "tasks" | "gamePlan" | "roles" | "meetings" | "goals" | "crm";

export type SystemDb = {
  key: SystemKey;
  title: string;
  icon: string;
  description: string;
  schema: DbSchema;
  views: { name: string; type: ViewType; config: ViewConfig }[];
};

export const STAGES = [
  { id: "VALIDATE", name: "Validate", color: "purple" },
  { id: "SETUP", name: "Set up", color: "blue" },
  { id: "BUILD", name: "Build", color: "orange" },
  { id: "LAUNCH", name: "Launch", color: "green" },
] as const;

export const SYSTEM_DBS: Record<SystemKey, SystemDb> = {
  tasks: {
    key: "tasks",
    title: "Tasks",
    icon: "✅",
    description: "Everything the team is doing, who's on it, and when it's due.",
    schema: {
      properties: [
        { id: "status", name: "Status", type: "status", options: [...DEFAULT_STATUS] },
        { id: "assignee", name: "Assignee", type: "person" },
        { id: "due", name: "Due", type: "date" },
        {
          id: "priority",
          name: "Priority",
          type: "select",
          options: [
            { id: "high", name: "High", color: "red" },
            { id: "medium", name: "Medium", color: "yellow" },
            { id: "low", name: "Low", color: "gray" },
          ],
        },
        // Wired to Goals / Meetings when those exist (see linkSystemRelations).
        { id: "goal", name: "Goal", type: "relation", relation: { databaseId: "" } },
        { id: "meeting", name: "From meeting", type: "relation", relation: { databaseId: "" } },
      ],
    },
    views: [
      { name: "Board", type: "BOARD", config: { ...emptyConfig(), groupBy: "status", hidden: ["goal", "meeting"] } },
      { name: "My tasks", type: "LIST", config: { ...emptyConfig(), filters: [{ propId: "assignee", op: "me" }, { propId: "status", op: "not_done" }], sorts: [{ propId: "due", dir: "asc" }] } },
      { name: "All", type: "TABLE", config: { ...emptyConfig(), sorts: [{ propId: "status", dir: "asc" }] } },
      { name: "Calendar", type: "CALENDAR", config: { ...emptyConfig(), dateProp: "due" } },
    ],
  },
  gamePlan: {
    key: "gamePlan",
    title: "Game plan",
    icon: "🧭",
    description: "From idea to launch, in stages. Need tags show who you need; click one to find them.",
    schema: {
      properties: [
        { id: "stage", name: "Stage", type: "select", options: STAGES.map((s) => ({ ...s })) },
        { id: "status", name: "Status", type: "status", options: [...DEFAULT_STATUS] },
        { id: "needs", name: "Needs", type: "multiSelect", options: NEED_TAGS.map((n) => ({ id: n, name: NEEDS[n].label, color: NEEDS[n].color })) },
        { id: "owner", name: "Owner", type: "person" },
        { id: "due", name: "Due", type: "date" },
      ],
    },
    views: [
      { name: "By stage", type: "BOARD", config: { ...emptyConfig(), groupBy: "stage" } },
      { name: "All steps", type: "TABLE", config: { ...emptyConfig(), sorts: [{ propId: "stage", dir: "asc" }] } },
      { name: "Open needs", type: "TABLE", config: { ...emptyConfig(), filters: [{ propId: "needs", op: "not_empty" }, { propId: "status", op: "not_done" }] } },
    ],
  },
  roles: {
    key: "roles",
    title: "Roles",
    icon: "🤝",
    description: "Co-founders and teammates you're looking for. Posted roles appear on the Network for other builders.",
    schema: {
      properties: [
        {
          id: "commitment",
          name: "Commitment",
          type: "select",
          options: [
            { id: "cofounder", name: "Co-founder", color: "purple" },
            { id: "parttime", name: "Part-time", color: "blue" },
            { id: "advisor", name: "Advisor", color: "yellow" },
            { id: "freelance", name: "Freelance", color: "gray" },
          ],
        },
        {
          id: "state",
          name: "State",
          type: "select",
          options: [
            { id: "open", name: "Open", color: "green" },
            { id: "filled", name: "Filled", color: "blue" },
            { id: "closed", name: "Closed", color: "gray" },
          ],
        },
        { id: "skills", name: "Skills", type: "text" },
        { id: "posted", name: "Posted to Network", type: "checkbox" },
        { id: "step", name: "Plan step", type: "relation", relation: { databaseId: "" } },
      ],
    },
    views: [
      { name: "All roles", type: "TABLE", config: emptyConfig() },
      { name: "By state", type: "BOARD", config: { ...emptyConfig(), groupBy: "state" } },
    ],
  },
  meetings: {
    key: "meetings",
    title: "Meetings",
    icon: "🗓️",
    description: "Notes from every meeting. Action items become tasks with one click.",
    schema: {
      properties: [
        { id: "date", name: "Date", type: "date" },
        { id: "attendees", name: "Attendees", type: "person" },
        {
          id: "kind",
          name: "Type",
          type: "select",
          options: [
            { id: "weekly", name: "Weekly", color: "blue" },
            { id: "oneonone", name: "1:1", color: "purple" },
            { id: "customer", name: "Customer", color: "green" },
            { id: "supplier", name: "Supplier", color: "orange" },
            { id: "other", name: "Other", color: "gray" },
          ],
        },
      ],
    },
    views: [
      { name: "Recent", type: "TABLE", config: { ...emptyConfig(), sorts: [{ propId: "date", dir: "desc" }] } },
      { name: "Calendar", type: "CALENDAR", config: { ...emptyConfig(), dateProp: "date" } },
    ],
  },
  goals: {
    key: "goals",
    title: "Goals",
    icon: "🎯",
    description: "What the company is aiming for. Progress comes from the tasks linked to each goal.",
    schema: {
      properties: [
        {
          id: "health",
          name: "Health",
          type: "select",
          options: [
            { id: "on", name: "On track", color: "green" },
            { id: "risk", name: "At risk", color: "yellow" },
            { id: "off", name: "Off track", color: "red" },
            { id: "done", name: "Achieved", color: "blue" },
          ],
        },
        { id: "owner", name: "Owner", type: "person" },
        { id: "target", name: "Target date", type: "date" },
      ],
    },
    views: [{ name: "All goals", type: "LIST", config: { ...emptyConfig(), sorts: [{ propId: "target", dir: "asc" }] } }],
  },
  crm: {
    key: "crm",
    title: "Customers & suppliers",
    icon: "📇",
    description: "Everyone you sell to or buy from, where things stand, and the next step.",
    schema: {
      properties: [
        {
          id: "type",
          name: "Type",
          type: "select",
          options: [
            { id: "customer", name: "Customer", color: "green" },
            { id: "supplier", name: "Supplier", color: "orange" },
            { id: "partner", name: "Partner", color: "blue" },
            { id: "other", name: "Other", color: "gray" },
          ],
        },
        {
          id: "stage",
          name: "Stage",
          type: "select",
          options: [
            { id: "lead", name: "Lead", color: "gray" },
            { id: "talking", name: "Talking", color: "yellow" },
            { id: "trial", name: "Trial", color: "purple" },
            { id: "active", name: "Active", color: "green" },
            { id: "paused", name: "Paused", color: "red" },
          ],
        },
        { id: "owner", name: "Owner", type: "person" },
        { id: "contact", name: "Contact", type: "text" },
        { id: "next", name: "Next step", type: "text" },
        { id: "nextDate", name: "Next date", type: "date" },
      ],
    },
    views: [
      { name: "Pipeline", type: "BOARD", config: { ...emptyConfig(), groupBy: "stage" } },
      { name: "All", type: "TABLE", config: emptyConfig() },
    ],
  },
};

/** Which relation property points at which other system database. */
export const SYSTEM_RELATIONS: { from: SystemKey; prop: string; to: SystemKey }[] = [
  { from: "tasks", prop: "goal", to: "goals" },
  { from: "tasks", prop: "meeting", to: "meetings" },
  { from: "roles", prop: "step", to: "gamePlan" },
];
