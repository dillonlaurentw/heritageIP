"use client";

import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { Mention } from "./Mention";

/** The one editor schema. Stored page JSON must stay valid against it. */
export const schema = BlockNoteSchema.create({
  inlineContentSpecs: { ...defaultInlineContentSpecs, mention: Mention },
});

export type SelfEditor = typeof schema.BlockNoteEditor;
