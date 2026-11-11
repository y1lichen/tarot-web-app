// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App.jsx";

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
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => Date.now());
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    new Proxy({}, { get: () => () => {}, set: () => true }),
  );
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<App />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("completes a keyboard shuffle, selects unique cards, reveals a reading and saves it after demo login", () => {
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
  act(() => vi.advanceTimersByTime(1800));
  expect(host.querySelector(".read .q").textContent).toContain(
    "我和他之間還有未來嗎？",
  );
  click(host.querySelector(".save-slot button"));
  click(button("使用示範帳號登入"));
  act(() => vi.advanceTimersByTime(1500));
  const records = JSON.parse(localStorage.getItem("aurum.records"));
  expect(records).toHaveLength(1);
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
  click(button("不想寫下來，我在心裡默念"));
  expect(host.querySelector(".quote").textContent).toBe("把問題默念在心裡");
  click(host.querySelector('[aria-label="上一步"]'));
  expect(host.querySelector("#app").dataset.stage).toBe("ask");
  click(host.querySelector('[aria-label="重新開始"]'));
  expect(host.querySelector("#app").dataset.stage).toBe("landing");
  expect(host.querySelector(".slots")).toBeNull();
});

it("restores valid old records and rejects malformed browser storage", () => {
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
  act(() => root.render(<App />));
  click(host.querySelector('[aria-label="帳號選單"]'));
  click(button("我的占卜紀錄"));
  expect(host.querySelectorAll(".rec")).toHaveLength(1);
  expect(host.querySelector(".rec-q").textContent).toContain("舊問題");
  key(document.activeElement, "keydown", "Escape");
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(document.getElementById("experience").inert).toBe(false);
});
