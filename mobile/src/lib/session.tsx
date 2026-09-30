/**
 * Who is signed in, and where they belong: welcome → access (invite or apply)
 * → waiting → onboarding → the app. `gate()` is the one place that decides.
 */
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setSignedOutHandler, type Me } from "./api";
import { forgetPush, listenForTaps, registerForPush } from "./push";
import { tokenStore } from "./storage";

type Session = {
  status: "loading" | "out" | "in";
  me: Me | null;
  signIn: (token: string) => Promise<Me | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<Me | null>;
};

const Ctx = createContext<Session | null>(null);

export function gate(me: Me | null): "/welcome" | "/access" | "/waiting" | "/onboarding" | "/today" {
  if (!me) return "/welcome";
  if (me.access === "NONE") return "/access";
  if (me.access === "APPLIED") return "/waiting";
  if (!me.onboarded) return "/onboarding";
  return "/today";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Session["status"]>("loading");
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    if (!(await tokenStore.get())) {
      setMe(null);
      setStatus("out");
      return null;
    }
    try {
      const m = await api.me();
      setMe(m);
      setStatus("in");
      if (m.access === "MEMBER" && m.onboarded) void registerForPush();
      return m;
    } catch {
      setMe(null);
      setStatus("out");
      return null;
    }
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => {
      setMe(null);
      setStatus("out");
      router.replace("/welcome");
    });
    void refresh();
    return listenForTaps();
  }, [refresh]);

  const value = useMemo<Session>(
    () => ({
      status,
      me,
      refresh,
      signIn: async (token) => {
        await tokenStore.set(token);
        return refresh();
      },
      signOut: async () => {
        await forgetPush();
        await tokenStore.clear();
        setMe(null);
        setStatus("out");
        router.replace("/welcome");
      },
    }),
    [status, me, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession outside SessionProvider");
  return s;
}
