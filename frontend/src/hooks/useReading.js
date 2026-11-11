import { useEffect, useState } from "react";
import { createReading } from "../api/tarot.js";
export function useReading(enabled, question, cards) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(null);
    setError("");
    if (!enabled) return;
    const controller = new AbortController();
    createReading(question, cards, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setResult(value);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [enabled, question, cards, attempt]);
  return {
    result: enabled ? result : null,
    error,
    loading: enabled && !result && !error,
    retry: () => setAttempt((n) => n + 1),
  };
}
