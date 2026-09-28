/**
 * SELF is introductions only. This guard keeps investment terms out of the
 * free text on backer surfaces (a hub's backer ask, a backer's note), so
 * nothing on SELF reads like an offer. It is deliberately conservative: it
 * catches obvious money talk, not every possible phrasing. Pure, unit tested.
 */
const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /[$€£¥₦₵]\s?\d/, why: "an amount" },
  { re: /\b\d+(\.\d+)?\s?(k|m|mm|bn|million|thousand|billion)\b/i, why: "an amount" },
  { re: /\bvaluation\b|\bpre-?money\b|\bpost-?money\b|\bvaluation cap\b/i, why: "a valuation" },
  { re: /\bSAFE\b/, why: "deal terms" }, // case-sensitive: "safe" is an ordinary word
  { re: /\bconvertible notes?\b|\bterm sheet\b|\bpriced round\b/i, why: "deal terms" },
  { re: /\b\d+(\.\d+)?\s?%\s*(of\s+the\s+company|equity|stake|shares?)\b/i, why: "an equity stake" },
  { re: /\b(raising|raise|invest(ing)?|commit(ting)?|cheque|check|ticket)\s+(of\s+)?[$€£]?\d/i, why: "an amount" },
];

export function mentionsTerms(text: string): string | null {
  for (const p of PATTERNS) if (p.re.test(text)) return p.why;
  return null;
}

export const NO_TERMS_MESSAGE = (why: string) =>
  `Leave out ${why}. SELF only makes introductions; money and terms are for you to discuss directly, off SELF.`;
