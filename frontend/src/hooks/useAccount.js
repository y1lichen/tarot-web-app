import { useCallback, useState } from "react";
import { isReading } from "../api/tarot.js";
import { CARDS } from "../data/tarot.js";
const memory = {};
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory[key];
    }
  },
  set(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Private browsing fallback. */
    }
  },
};
function load(key, fallback) {
  try {
    return JSON.parse(storage.get(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function useAccount() {
  const [user, setUser] = useState(() => {
    const value = load("aurum.user", null);
    return value &&
      typeof value.name === "string" &&
      typeof value.email === "string"
      ? value
      : null;
  });
  const [records, setRecords] = useState(() => {
    const value = load("aurum.records", []);
    return Array.isArray(value)
      ? value
          .filter(
            (r) =>
              r &&
              typeof r.id === "string" &&
              Number.isFinite(r.ts) &&
              typeof r.q === "string" &&
              (r.cards || r.reading
                ? Array.isArray(r.cards) &&
                  r.cards.length === 3 &&
                  r.cards.every(
                    (c) =>
                      c &&
                      typeof c.id === "string" &&
                      typeof c.zh === "string" &&
                      typeof c.en === "string",
                  ) &&
                  isReading(r.reading)
                : Array.isArray(r.picks) &&
                  r.picks.length === 3 &&
                  r.picks.every(
                    (n) => Number.isInteger(n) && n >= 0 && n < CARDS.length,
                  )),
          )
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 50)
      : [];
  });
  const signIn = () => {
    const profile = { name: "星語旅人", email: "stargazer@example.com" };
    storage.set("aurum.user", JSON.stringify(profile));
    setUser(profile);
  };
  const signOut = () => {
    storage.set("aurum.user", "null");
    setUser(null);
  };
  const saveReading = useCallback((id, question, cards, reading) => {
    setRecords((previous) => {
      if (previous.some((r) => r.id === id)) return previous;
      const next = [
        {
          id,
          ts: Date.now(),
          q: question,
          picks: cards.map((c) => c.n),
          cards,
          reading,
        },
        ...previous,
      ].slice(0, 50);
      storage.set("aurum.records", JSON.stringify(next));
      return next;
    });
  }, []);
  return { user, records, signIn, signOut, saveReading };
}
