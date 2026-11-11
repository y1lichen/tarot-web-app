export const POSITIONS = ["past", "present", "future"];
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
async function request(path, { signal, ...options } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 75000);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = typeof data?.detail === "string" ? data.detail : null;
      throw new Error(
        detail ||
          (response.status === 422
            ? "提問或牌卡資料有誤，請重新提問。"
            : "服務暫時無法使用，請稍後再試。"),
      );
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) throw new Error("連線逾時，請稍後重試。");
    if (error instanceof TypeError)
      throw new Error("無法連線至後端，請確認服務已啟動後重試。");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export function toDisplayCard(card, index = 0) {
  return {
    id: card.id,
    n: index,
    rn: String(card.number),
    zh: card.name_zh,
    en: card.name_en,
    image: card.image,
    kw: card.upright || [],
    reversed: false,
  };
}
export async function getCards(signal) {
  const cards = await request("/cards", { signal });
  if (
    !Array.isArray(cards) ||
    cards.length < 3 ||
    cards.some((c) => !c.id || !c.name_zh || !c.name_en) ||
    new Set(cards.map((c) => c.id)).size !== cards.length
  )
    throw new Error("後端牌卡資料格式有誤。");
  return cards.map(toDisplayCard);
}
export function isReading(value) {
  return (
    value &&
    typeof value.question === "string" &&
    typeof value.overall === "string" &&
    typeof value.advice === "string" &&
    typeof value.mock === "boolean" &&
    Array.isArray(value.cards) &&
    value.cards.length === 3 &&
    value.cards.every(
      (c) =>
        c.card?.id &&
        typeof c.interpretation === "string" &&
        POSITIONS.includes(c.position),
    )
  );
}
export async function createReading(question, cards, signal) {
  const reading = await request("/readings", {
    signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: question.trim() || "未填寫問題，請依牌陣提供一般性反思指引。",
      cards: cards.map((card, i) => ({
        card_id: card.id,
        position: POSITIONS[i],
        reversed: card.reversed ?? false,
      })),
    }),
  });
  if (
    !isReading(reading) ||
    reading.cards.some(
      (c, i) => c.card.id !== cards[i].id || c.position !== POSITIONS[i],
    )
  )
    throw new Error("後端解讀資料格式有誤，請重試。");
  return reading;
}
