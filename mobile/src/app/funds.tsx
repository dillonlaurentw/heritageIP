import { Card, Screen, T, Title } from "@/components/ui";

/**
 * Funds inside SELF: the long-term idea, explained plainly, and why it isn't
 * built. Nothing about investing is built until a licensed partner and
 * securities counsel are in place (see docs/FUNDS.md).
 */
export default function Funds() {
  return (
    <Screen back>
      <Title>Investing through SELF</Title>
      <T size={16}>One day, members may be able to invest in each other through SELF. Not yet.</T>
      <Card style={{ gap: 10 }}>
        <T weight="medium">Why not yet</T>
        <T tone="muted">
          Letting people invest in companies is regulated almost everywhere. Doing it properly needs a licensed partner (a registered funding portal, broker-dealer or investment adviser, depending on the country) and securities lawyers. Until those are in place, SELF doesn&apos;t move money, hold money, or offer investments.
        </T>
      </Card>
      <Card style={{ gap: 10 }}>
        <T weight="medium">What SELF does now</T>
        <T tone="muted">Founders share progress with backers when they choose. Backers follow and say they&apos;re interested. A yes opens a conversation. Anything about money happens between you, off SELF.</T>
      </Card>
      <Card style={{ gap: 10 }}>
        <T weight="medium">What it will stand on</T>
        <T tone="muted">A real record of building, week after week, that founders choose to share. That record is being built now.</T>
      </Card>
      <T size={12} tone="subtle">
        Nothing in SELF is an offer to buy or sell securities.
      </T>
    </Screen>
  );
}
