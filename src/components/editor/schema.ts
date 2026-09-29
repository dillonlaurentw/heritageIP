"use client";

import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from "@blocknote/core";
import { createDatabaseBlock } from "./DatabaseBlock";
import { Mention } from "./Mention";

/** The one editor schema. Stored page JSON must stay valid against it. */
export const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, database: createDatabaseBlock() },
  inlineContentSpecs: { ...defaultInlineContentSpecs, mention: Mention },
});

export type SelfEditor = typeof schema.BlockNoteEditor;
