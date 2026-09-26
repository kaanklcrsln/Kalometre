import { createContext, useContext } from "react";
import type { UserDoc } from "../types";

export interface Session {
  uid: string;
  username: string;
  userDoc: UserDoc;
}

export const SessionContext = createContext<Session | null>(null);

/** Onboarding'i tamamlamış, giriş yapmış kullanıcı. Yalnızca korumalı sayfalarda kullan. */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession, SessionContext dışında kullanıldı");
  return session;
}
