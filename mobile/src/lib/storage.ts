import * as SecureStore from "expo-secure-store";

/** The sign-in token lives in the phone's keychain / keystore. */
export const tokenStore = {
  get: () => SecureStore.getItemAsync("self.token"),
  set: (v: string) => SecureStore.setItemAsync("self.token", v),
  clear: () => SecureStore.deleteItemAsync("self.token"),
};
