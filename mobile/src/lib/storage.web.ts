/** On the web preview there is no keychain; the token lives in this browser only. */
const key = "self.token";
const safe = <T,>(fn: () => T, fallback: T) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const tokenStore = {
  get: async () => safe(() => localStorage.getItem(key), null),
  set: async (v: string) => safe(() => localStorage.setItem(key, v), undefined),
  clear: async () => safe(() => localStorage.removeItem(key), undefined),
};
