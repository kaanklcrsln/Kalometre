import { useState } from "react";
import { validatePassword, validateUsername } from "../lib/username";
import { authErrorMessage, signIn, signUp } from "../services/auth";

export type AuthMode = "signUp" | "signIn";

export function useAuthForm() {
  const [mode, setMode] = useState<AuthMode>("signUp");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    // Girişte biçim kontrolü yapılmaz; yanlışsa Firebase "hatalı" der.
    const invalid = mode === "signUp" ? validateUsername(username) ?? validatePassword(password) : null;
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (mode === "signUp" ? signUp(username, password) : signIn(username, password));
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return {
    mode,
    username,
    password,
    busy,
    error,
    setMode: (m: AuthMode) => {
      setMode(m);
      setError(null);
    },
    setUsername: (v: string) => {
      setUsername(v);
      setError(null);
    },
    setPassword: (v: string) => {
      setPassword(v);
      setError(null);
    },
    submit,
  };
}
