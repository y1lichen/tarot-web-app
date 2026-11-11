// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App.jsx";
import backendCards from "../../backend/data/cards.json";
const summaries = backendCards.map(({ upright, reversed, ...card }) => card);
function apiReading(body) {
  return {
    question: body.question,
    cards: body.cards.map((d) => ({
      card: summaries.find((c) => c.id === d.card_id),
      position: d.position,
      position_label: { past: "過去", present: "現在", future: "未來趨勢" }[
        d.position
      ],
      reversed: d.reversed,
      interpretation: "後端逐牌解讀",
    })),
    overall: "後端整體分析",
    advice: "後端反思建議",
    mock: true,
  };
}
const response = (data) => ({ ok: true, json: async () => data });
let fetchMock;

let host, root;
const click = (element) => act(() => element.click());
const button = (text) =>
  [...host.querySelectorAll("button")].find((el) => el.textContent === text);
const key = (element, type, value) =>
  act(() =>
    element.dispatchEvent(
      new KeyboardEvent(type, { key: value, bubbles: true }),
    ),
  );
beforeEach(async () => {
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => Date.now());
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    new Proxy({}, { get: () => () => {}, set: () => true }),
  );
  fetchMock = vi.fn(async (url, options) =>
    response(
      url.endsWith("/cards") ? summaries : apiReading(JSON.parse(options.body)),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<App />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("completes a keyboard shuffle, selects unique cards, reveals a reading and saves it after demo login", async () => {
  click(host.querySelector('[aria-label="點擊牌卡，開始占卜"]'));
  expect(host.querySelector("#app").dataset.stage).toBe("ask");
  click(button("感情"));
  click(button("我和他之間還有未來嗎？"));
  expect(host.querySelector("input").value).toBe("我和他之間還有未來嗎？");
  act(() =>
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(button("洗好牌了").disabled).toBe(true);
  const pad = host.querySelector(".pad");
  key(pad, "keydown", " ");
  act(() => vi.advanceTimersByTime(2200));
  key(pad, "keyup", " ");
  expect(button("洗好牌了").disabled).toBe(false);
  click(button("洗好牌了"));
  const fan = [...host.querySelectorAll(".fslot")];
  click(fan[3]);
  expect(fan[3].disabled).toBe(true);
  click(fan[3]);
  expect(host.querySelectorAll(".slot.filled")).toHaveLength(1);
  click(fan[9]);
  click(fan[15]);
  expect(host.querySelector("#app").dataset.stage).toBe("reading");
  for (const trigger of host.querySelectorAll(".slot-trigger")) click(trigger);
  await act(async () => vi.advanceTimersByTime(1800));
  expect(host.querySelector(".read .q").textContent).toContain(
    "我和他之間還有未來嗎？",
  );
  expect(host.querySelector(".read").textContent).toContain("後端整體分析");
  expect(host.querySelector(".read").textContent).toContain("後端反思建議");
  const request = JSON.parse(
    fetchMock.mock.calls.find(([url]) => url.endsWith("/readings"))[1].body,
  );
  expect(request.question).toBe("我和他之間還有未來嗎？");
  expect(request.cards.map((c) => c.position)).toEqual([
    "past",
    "present",
    "future",
  ]);
  expect(
    request.cards.every((c) => summaries.some((s) => s.id === c.card_id)),
  ).toBe(true);
  click(host.querySelector(".save-slot button"));
  click(button("使用示範帳號登入"));
  act(() => vi.advanceTimersByTime(1500));
  const records = JSON.parse(localStorage.getItem("aurum.records"));
  expect(records).toHaveLength(1);
  expect(records[0].reading.overall).toBe("後端整體分析");
  expect(new Set(records[0].picks).size).toBe(3);
  expect(host.querySelector(".saved").textContent).toContain("已存入");
  click(button("查看紀錄"));
  click(host.querySelector(".rec"));
  expect(host.querySelector(".hbody .q").textContent).toContain(records[0].q);
  click(button("再問一次類似的問題"));
  expect(host.querySelector("#app").dataset.stage).toBe("ask");
  expect(host.querySelector("input").value).toBe(records[0].q);
});

it("allows a private question, back navigation and restarting without retaining a previous draw", () => {
  click(host.querySelector('[aria-label="點擊牌卡，開始占卜"]'));
  expect(button("獻上問題").disabled).toBe(true);
  click(button("不寫問題，取得一般性指引"));
  expect(host.querySelector(".quote").textContent).toBe("把問題默念在心裡");
  click(host.querySelector('[aria-label="上一步"]'));
  expect(host.querySelector("#app").dataset.stage).toBe("ask");
  click(host.querySelector('[aria-label="重新開始"]'));
  expect(host.querySelector("#app").dataset.stage).toBe("landing");
  expect(host.querySelector(".slots")).toBeNull();
});

it("restores valid old records and rejects malformed browser storage", async () => {
  act(() => root.unmount());
  root = createRoot(host);
  localStorage.setItem(
    "aurum.user",
    JSON.stringify({ name: "星語旅人", email: "stargazer@example.com" }),
  );
  localStorage.setItem(
    "aurum.records",
    JSON.stringify([
      { id: "old", ts: 123, q: "舊問題", picks: [0, 1, 2] },
      { id: "bad", ts: 123, q: "bad", picks: [900, 1, 2] },
    ]),
  );
  await act(async () => root.render(<App />));
  click(host.querySelector('[aria-label="帳號選單"]'));
  click(button("我的占卜紀錄"));
  expect(host.querySelectorAll(".rec")).toHaveLength(1);
  expect(host.querySelector(".rec-q").textContent).toContain("舊問題");
  key(document.activeElement, "keydown", "Escape");
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(document.getElementById("experience").inert).toBe(false);
});

async function completeDraw() {
  click(host.querySelector('[aria-label="點擊牌卡，開始占卜"]'));
  click(button("不寫問題，取得一般性指引"));
  const pad = host.querySelector(".pad");
  key(pad, "keydown", " ");
  act(() => vi.advanceTimersByTime(2200));
  key(pad, "keyup", " ");
  click(button("洗好牌了"));
  const fan = [...host.querySelectorAll(".fslot")];
  for (const i of [0, 7, 14]) click(fan[i]);
  for (const trigger of host.querySelectorAll(".slot-trigger")) click(trigger);
  await act(async () => vi.advanceTimersByTime(1800));
}
it("retries failed readings with the same cards and only saves successful responses", async () => {
  fetchMock.mockImplementation(async (url, options) =>
    url.endsWith("/cards")
      ? response(summaries)
      : {
          ok: false,
          status: 504,
          json: async () => ({ detail: "解讀服務逾時，請稍後再試" }),
        },
  );
  await completeDraw();
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "解讀服務逾時",
  );
  expect(localStorage.getItem("aurum.records")).toBeNull();
  const firstBody = fetchMock.mock.calls.find(([url]) =>
    url.endsWith("/readings"),
  )[1].body;
  expect(JSON.parse(firstBody).question).toContain("一般性反思指引");
  fetchMock.mockImplementation(async (url, options) =>
    response(apiReading(JSON.parse(options.body))),
  );
  await act(async () => button("重試解讀").click());
  expect(host.querySelector(".read").textContent).toContain("後端逐牌解讀");
  expect(fetchMock.mock.calls.at(-1)[1].body).toBe(firstBody);
});
it("recovers from a card catalogue network failure", async () => {
  act(() => root.unmount());
  root = createRoot(host);
  fetchMock.mockRejectedValue(new TypeError("offline"));
  await act(async () => root.render(<App />));
  click(host.querySelector('[aria-label="點擊牌卡，開始占卜"]'));
  click(button("不寫問題，取得一般性指引"));
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "無法連線",
  );
  expect(button("洗好牌了").disabled).toBe(true);
  fetchMock.mockResolvedValue(response(summaries));
  await act(async () => button("重新載入牌卡").click());
  expect(host.querySelector('[role="alert"]')).toBeNull();
});
it("aborts an in-flight reading when restarting and does not display a stale result", async () => {
  let resolveReading, readingSignal;
  fetchMock.mockImplementation((url, options) => {
    if (url.endsWith("/cards")) return Promise.resolve(response(summaries));
    readingSignal = options.signal;
    return new Promise((resolve) => {
      resolveReading = () =>
        resolve(response(apiReading(JSON.parse(options.body))));
    });
  });
  await completeDraw();
  expect(host.querySelector('.read [role="status"]').textContent).toContain(
    "正在為你解讀",
  );
  click(host.querySelector('[aria-label="重新開始"]'));
  expect(readingSignal.aborted).toBe(true);
  await act(async () => resolveReading());
  expect(host.querySelector("#app").dataset.stage).toBe("landing");
  expect(host.querySelector(".read")).toBeNull();
});

it("restores saved minor-arcana cards and the original API response without generating another reading", async () => {
  act(() => root.unmount());
  root = createRoot(host);
  const chosen = summaries.slice(22, 25);
  const request = {
    question: "保留這次解讀",
    cards: chosen.map((c, i) => ({
      card_id: c.id,
      position: ["past", "present", "future"][i],
      reversed: false,
    })),
  };
  localStorage.setItem(
    "aurum.user",
    JSON.stringify({ name: "旅人", email: "demo@example.com" }),
  );
  localStorage.setItem(
    "aurum.records",
    JSON.stringify([
      {
        id: "api-record",
        ts: 123,
        q: request.question,
        picks: [22, 23, 24],
        cards: chosen.map((c, i) => ({
          id: c.id,
          n: 22 + i,
          rn: String(c.number),
          zh: c.name_zh,
          en: c.name_en,
          kw: [],
        })),
        reading: apiReading(request),
      },
    ]),
  );
  await act(async () => root.render(<App />));
  click(host.querySelector('[aria-label="帳號選單"]'));
  click(button("我的占卜紀錄"));
  click(host.querySelector(".rec"));
  expect(host.querySelector(".hbody").textContent).toContain(chosen[0].name_zh);
  expect(host.querySelector(".hbody").textContent).toContain("後端反思建議");
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/readings"))).toBe(
    false,
  );
});
