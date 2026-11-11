import { useEffect, useRef, useState } from "react";
import { HOLD_MIN, HOLD_FULL } from "../data/tarot.js";
import { getCards } from "../api/tarot.js";
const backStages = { ask: "landing", shuffle: "ask", spread: "shuffle" };
function shuffledCards(catalog) {
  const cards = [...catalog];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function useTarot() {
  const [catalog, setCatalog] = useState([]);
  const [cardsError, setCardsError] = useState("");
  const [cardsAttempt, setCardsAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCardsError("");
    getCards(controller.signal)
      .then((cards) => {
        if (!controller.signal.aborted) setCatalog(cards);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCardsError(error.message);
      });
    return () => controller.abort();
  }, [cardsAttempt]);
  const [stage, setStage] = useState("landing");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [holding, setHolding] = useState(false);
  const [deck, setDeck] = useState([]);
  const [picks, setPicks] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [done, setDone] = useState(false);
  const [readingId, setReadingId] = useState(null);
  const selectionLock = useRef(false);
  useEffect(() => {
    if (!holding || stage !== "shuffle") return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = now - last;
      last = now;
      setEnergy((value) => Math.min(HOLD_FULL, value + elapsed));
    }, 40);
    return () => clearInterval(timer);
  }, [holding, stage]);
  useEffect(() => {
    if (flipped.length !== 3) return;
    const timer = setTimeout(
      () => setDone(true),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 1700,
    );
    return () => clearTimeout(timer);
  }, [flipped]);
  const stopHold = () => setHolding(false);
  useEffect(() => {
    window.addEventListener("blur", stopHold);
    return () => window.removeEventListener("blur", stopHold);
  }, []);
  function restart(nextQuestion = "", nextStage = "landing") {
    setHolding(false);
    setEnergy(0);
    setPicks([]);
    setFlipped([]);
    setDone(false);
    setCategory(null);
    setQuestion(nextQuestion);
    setStage(nextStage);
    setReadingId(null);
    selectionLock.current = false;
  }
  function finishShuffle() {
    if (energy < HOLD_MIN || catalog.length < 3) return;
    setHolding(false);
    setDeck(shuffledCards(catalog).slice(0, 22));
    setPicks([]);
    setFlipped([]);
    setReadingId(crypto.randomUUID());
    setStage("spread");
    selectionLock.current = false;
  }
  function pick(card) {
    if (stage !== "spread" || selectionLock.current || picks.includes(card))
      return;
    const next = [...picks, card];
    if (next.length > 3) return;
    setPicks(next);
    if (next.length === 3) {
      selectionLock.current = true;
      setStage("reading");
    }
  }
  return {
    stage,
    cardsError,
    cardsLoading: catalog.length === 0 && !cardsError,
    retryCards: () => setCardsAttempt((n) => n + 1),
    question,
    setQuestion,
    category,
    setCategory,
    energy,
    holding,
    picks,
    flipped,
    done,
    deck,
    readingId,
    ready: energy >= HOLD_MIN && catalog.length >= 3,
    canBack: !!backStages[stage],
    start: () => setStage("ask"),
    submit: (skip = false) => {
      setQuestion(skip ? "" : question.trim());
      setStage("shuffle");
    },
    startHold: () => {
      if (stage === "shuffle") setHolding(true);
    },
    stopHold,
    finishShuffle,
    pick,
    flip: (index) =>
      setFlipped((previous) =>
        previous.includes(index) ? previous : [...previous, index],
      ),
    back: () => {
      setHolding(false);
      setPicks([]);
      setStage(backStages[stage] || stage);
    },
    restart,
  };
}
