import "server-only";

/** Demo login ("sign in as Maya") is always on in dev, opt-in elsewhere. */
export const demoLoginEnabled = () =>
  process.env.NODE_ENV !== "production" || process.env.DEMO_LOGIN === "true";

export const DEMO_EMAIL_DOMAIN = "@self.demo";
