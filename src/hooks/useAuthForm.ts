import { FirebaseError } from "firebase/app";
import { useState } from "react";
import { validatePassword, validateUsername } from "../lib/username";
import { authErrorMessage, signIn, signUp } from "../services/auth";

export type AuthMode = "signUp" | "signIn";

/** Hatanın türü; arayüz (ör. avatar) buna göre farklı tepki verir. */
export type AuthErrorKind = "wrong-credentials" | "username-taken" | "invalid-input" | "other";

export interface AuthFormEvents {
  /** İstek gönderilmeden hemen önce. */
  onStart?: () => void;
  onSuccess?: (mode: AuthMode) => void;
  onError?: (kind: AuthErrorKind) => void;
}

function errorKind(err: unknown): AuthErrorKind {
  const code = err instanceof FirebaseError ? err.code : "";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(code)) {
    return "wrong-credentials";
  }
  if (code === "auth/email-already-in-use") return "username-taken";
  return "other";
}

export function useAuthForm(events: AuthFormEvents = {}) {
  const [mode, setMode] = useState<AuthMode>("signUp");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<AuthErrorKind | null>(null);

  const fail = (message: string, k: AuthErrorKind) => {
    setError(message);
    setKind(k);
    events.onError?.(k);
  };

  const submit = async () => {
    // Girişte biçim kontrolü yapılmaz; yanlışsa Firebase "hatalı" der.
    const invalid = mode === "signUp" ? validateUsername(username) ?? validatePassword(password) : null;
    if (invalid) {
      fail(invalid, "invalid-input");
      return;
    }
    setBusy(true);
    setError(null);
    setKind(null);
    events.onStart?.();
    try {
      await (mode === "signUp" ? signUp(username, password) : signIn(username, password));
      events.onSuccess?.(mode);
    } catch (err) {
      fail(authErrorMessage(err), errorKind(err));
      setBusy(false);
    }
  };

  const clearError = () => {
    setError(null);
    setKind(null);
  };

  return {
    mode,
    username,
    password,
    busy,
    error,
    errorKind: kind,
    setMode: (m: AuthMode) => {
      setMode(m);
      clearError();
    },
    setUsername: (v: string) => {
      setUsername(v);
      clearError();
    },
    setPassword: (v: string) => {
      setPassword(v);
      clearError();
    },
    submit,
  };
}
