"use client";

import { createReactInlineContentSpec } from "@blocknote/react";

/** An @mention of a person. Stored as { type: "mention", props: { userId, name } }. */
export const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: { userId: { default: "" }, name: { default: "Someone" } },
    content: "none",
  },
  {
    render: ({ inlineContent }) => (
      <span
        className="rounded-sm bg-accent-soft px-0.5 font-medium text-accent-text"
        data-mention={inlineContent.props.userId}
      >
        @{inlineContent.props.name}
      </span>
    ),
  },
);
