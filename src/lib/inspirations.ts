/**
 * The inspirations scattered around the Self home page: one creative work
 * each. Pure: shared by the home page and the inspiration pages.
 *
 * Copyright: 1 and 2 are Shel Silverstein's (Falling Up, 1996) and under
 * copyright. They show the title, opening line and credit; `lines` is added
 * only by whoever holds the permission, with the credit wording it requires.
 * Everything from 4 on is in the public domain (US), quoted in full or in
 * part. Bashō is Self's own translation.
 */

export type Inspiration = {
  n: number;
  title: string;
  author: string;
  /** Book or source and year, shown under the work. */
  credit: string;
  kind: "poem" | "prose" | "blank";
  /** The work. For a poem, one entry per line ("" for a stanza break). */
  lines?: string[];
  /** Shown instead of `lines` when the full text can't be published. */
  opening?: string;
};

export const INSPIRATIONS: Inspiration[] = [
  {
    n: 1,
    title: "The Voice",
    author: "Shel Silverstein",
    credit: "Shel Silverstein, from Falling Up (1996)",
    kind: "poem",
    opening: "There is a voice inside of you",
    // lines: ["first line", "second line", ...],
  },
  {
    n: 2,
    title: "Underface",
    author: "Shel Silverstein",
    credit: "Shel Silverstein, from Falling Up (1996)",
    kind: "poem",
    opening: "Underneath my outside face",
    // lines: ["first line", "second line", ...],
  },
  {
    n: 3,
    title: "You. Me.",
    author: "Self",
    credit: "",
    kind: "blank",
  },
  {
    n: 4,
    title: "I'm Nobody! Who are you?",
    author: "Emily Dickinson",
    credit: "Emily Dickinson, Poems, Second Series (1891)",
    kind: "poem",
    lines: [
      "I'm nobody! Who are you?",
      "Are you nobody, too?",
      "Then there's a pair of us — don't tell!",
      "They'd banish us, you know.",
      "",
      "How dreary to be somebody!",
      "How public, like a frog",
      "To tell your name the livelong day",
      "To an admiring bog!",
    ],
  },
  {
    n: 5,
    title: "Song of Myself, 1",
    author: "Walt Whitman",
    credit: "Walt Whitman, Leaves of Grass (1892)",
    kind: "poem",
    lines: [
      "I celebrate myself, and sing myself,",
      "And what I assume you shall assume,",
      "For every atom belonging to me as good belongs to you.",
      "",
      "I loafe and invite my soul,",
      "I lean and loafe at my ease observing a spear of summer grass.",
    ],
  },
  {
    n: 6,
    title: "Self-Reliance",
    author: "Ralph Waldo Emerson",
    credit: "Ralph Waldo Emerson, Essays: First Series (1841)",
    kind: "prose",
    lines: [
      "To believe your own thought, to believe that what is true for you in your private heart is true for all men — that is genius.",
      "Trust thyself: every heart vibrates to that iron string.",
    ],
  },
  {
    n: 7,
    title: "To thine own self be true",
    author: "William Shakespeare",
    credit: "William Shakespeare, Hamlet, Act 1, Scene 3 (c. 1600)",
    kind: "poem",
    lines: ["This above all: to thine own self be true,", "And it must follow, as the night the day,", "Thou canst not then be false to any man."],
  },
  {
    n: 8,
    title: "The Road Not Taken",
    author: "Robert Frost",
    credit: "Robert Frost, Mountain Interval (1916)",
    kind: "poem",
    lines: [
      "Two roads diverged in a yellow wood,",
      "And sorry I could not travel both",
      "And be one traveler, long I stood",
      "And looked down one as far as I could",
      "To where it bent in the undergrowth;",
      "",
      "Then took the other, as just as fair,",
      "And having perhaps the better claim,",
      "Because it was grassy and wanted wear;",
      "Though as for that the passing there",
      "Had worn them really about the same,",
      "",
      "And both that morning equally lay",
      "In leaves no step had trodden black.",
      "Oh, I kept the first for another day!",
      "Yet knowing how way leads on to way,",
      "I doubted if I should ever come back.",
      "",
      "I shall be telling this with a sigh",
      "Somewhere ages and ages hence:",
      "Two roads diverged in a wood, and I —",
      "I took the one less traveled by,",
      "And that has made all the difference.",
    ],
  },
  {
    n: 9,
    title: "Dreams",
    author: "Langston Hughes",
    credit: "Langston Hughes, The World Tomorrow (1923)",
    kind: "poem",
    lines: [
      "Hold fast to dreams",
      "For if dreams die",
      "Life is a broken-winged bird",
      "That cannot fly.",
      "",
      "Hold fast to dreams",
      "For when dreams go",
      "Life is a barren field",
      "Frozen with snow.",
    ],
  },
  {
    n: 10,
    title: "On Self-Knowledge",
    author: "Kahlil Gibran",
    credit: "Kahlil Gibran, The Prophet (1923)",
    kind: "prose",
    lines: [
      "Say not, “I have found the truth,” but rather, “I have found a truth.”",
      "Say not, “I have found the path of the soul.” Say rather, “I have met the soul walking upon my path.”",
    ],
  },
  {
    n: 11,
    title: "Look within",
    author: "Marcus Aurelius",
    credit: "Marcus Aurelius, Meditations VII.59, trans. George Long (1862)",
    kind: "prose",
    lines: ["Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig."],
  },
  {
    n: 12,
    title: "Knowing yourself",
    author: "Lao Tzu",
    credit: "Lao Tzu, Tao Te Ching, ch. 33, trans. James Legge (1891)",
    kind: "prose",
    lines: ["He who knows other men is discerning; he who knows himself is intelligent.", "He who overcomes others is strong; he who overcomes himself is mighty."],
  },
  {
    n: 13,
    title: "Old pond",
    author: "Matsuo Bashō",
    credit: "Matsuo Bashō (1686), translated for Self",
    kind: "poem",
    lines: ["An old pond —", "a frog jumps in,", "the sound of water."],
  },
];

export function inspiration(n: number): Inspiration | undefined {
  return INSPIRATIONS.find((i) => i.n === n);
}

/**
 * Where each number sits around the page (percent of the width and height),
 * clear of the words in the middle. Phones show the numbers in a row instead.
 */
export const SPOTS: Record<number, { left: number; top: number }> = {
  1: { left: 10, top: 14 },
  2: { left: 31, top: 9 },
  3: { left: 54, top: 13 },
  4: { left: 76, top: 8 },
  5: { left: 90, top: 24 },
  6: { left: 6, top: 38 },
  7: { left: 93, top: 47 },
  8: { left: 12, top: 63 },
  9: { left: 87, top: 70 },
  10: { left: 24, top: 86 },
  11: { left: 47, top: 92 },
  12: { left: 70, top: 87 },
  13: { left: 4, top: 87 },
};
