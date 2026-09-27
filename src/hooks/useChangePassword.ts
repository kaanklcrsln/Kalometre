import { useState } from "react";
import { validatePasswordChange } from "../lib/password";
import { changePassword, passwordChangeErrorMessage } from "../services/auth";

/** Ayarlar > Hesap: şifre değiştirme formu. */
export function useChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setRepeat("");
    setError(null);
  };

  const submit = async () => {
    const invalid = validatePasswordChange(current, next, repeat);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      reset();
      setOpen(false);
      setDone(true);
    } catch (err) {
      setError(passwordChangeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setError(null);
  };

  return {
    open,
    current,
    next,
    repeat,
    busy,
    error,
    done,
    start: () => {
      reset();
      setDone(false);
      setOpen(true);
    },
    cancel: () => {
      reset();
      setOpen(false);
    },
    setCurrent: edit(setCurrent),
    setNext: edit(setNext),
    setRepeat: edit(setRepeat),
    submit,
  };
}
