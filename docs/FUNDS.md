# Funds inside SELF: what it would take

**Status: not built, on purpose.** SELF moves no money, holds no money and
offers no investments. This note is the plan for when that changes. It is
not legal advice; securities counsel must review every step before anything
is built.

## The idea

Members invest small amounts in each other's companies, or in a pooled fund
of SELF companies, through SELF. It fits SELF's promise: capital follows a
real record of building, not a pitch deck.

## Why it can't just be switched on

Selling a share of a company to the public is a **securities offering**. In
most countries that needs a registered offering, or an exemption with strict
rules about who may invest, how much, what must be disclosed, and who is
allowed to run the platform. Running it without a licence can expose SELF,
its founders and its members to serious liability. Some examples (US; other
countries have their own versions):

| Route | What it allows | Who must run it |
|---|---|---|
| Reg CF (crowdfunding) | Anyone can invest small amounts, with limits per person | A registered **funding portal** or broker-dealer |
| Reg D 506(b) / 506(c) | Private raises, mostly accredited investors; 506(c) allows general solicitation with verification | Usually a broker-dealer, or the company itself with care |
| Rolling funds / syndicates (SPVs) | A lead invests with backers through a fund vehicle | A registered or exempt **investment adviser** plus a fund administrator |
| EU (ECSP regulation) | Cross-border crowdfunding in the EU | An authorised **crowdfunding service provider** |

Posting "we're raising $2M" to a broad audience can also count as
**general solicitation**, which is why SELF blocks amounts and terms on every
backer-facing text today (`mentionsTerms()`).

## The path

1. **Pick a lane with counsel.** Likely first lane: partner with an existing
   licensed platform (a funding portal for Reg CF, or a syndicate platform for
   SPVs) rather than becoming one. SELF sends founders and investors there;
   the partner holds the money, does the checks and files the paperwork.
2. **Sign the partner.** Written agreement: who does KYC/AML, investor
   verification, disclosures, escrow, cap-table updates and investor
   communications. SELF never touches funds.
3. **Build the seam, not a bank.** In SELF: a founder chooses to "raise
   through <partner>", SELF shows backers a link to the partner's regulated
   offering page, and nothing about amounts or terms lives in SELF's own
   pages. The seams are already noted at the bottom of `prisma/schema.prisma`.
4. **Keep the rules that exist.** Journals stay private and are never shown
   to backers. Interest stays a signal the founder answers. No scores or
   rankings of founders, ever.
5. **Launch small.** A handful of companies, with counsel reviewing every
   screen and email before it goes out.

## What SELF is building now that this will stand on

- Founders' shared updates (`FounderUpdate`): a record of building, week
  after week, that the founder chooses to share.
- Backer follows and interest (`Follow`, `BACKER_INTEREST` signals).
- Invite-only access by commitment and fit.

## Open questions for counsel

- Which countries first, and does SELF need its own registration anywhere?
- Can SELF be paid by the partner (referral fees) without becoming a broker?
- What can SELF show on a company page next to a link to the offering?
- How should founders' shared updates be treated once they're raising?
