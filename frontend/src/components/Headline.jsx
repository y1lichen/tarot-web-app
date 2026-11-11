import { useEffect, useState } from "react";
import { LABELS, WHISPERS } from "../data/tarot.js";
export default function Headline({ tarot }) {
  const [whisper, setWhisper] = useState(0);
  useEffect(() => {
    if (tarot.stage !== "landing") return;
    const timer = setInterval(
      () => setWhisper((i) => (i + 1) % WHISPERS.length),
      5600,
    );
    return () => clearInterval(timer);
  }, [tarot.stage]);
  const { stage, question, picks, flipped, done } = tarot;
  const copy = {
    landing: [
      "Aurum Tarot · 金夜塔羅",
      "星辰低語，牌自有答",
      WHISPERS[whisper],
    ],
    ask: [
      "第一步 · 提問",
      "你心中，想問什麼？",
      "專注於一個問題，牌會回應你的誠意。",
    ],
    shuffle: [
      "第二步 · 洗牌",
      "讓牌記住你的氣息",
      question ? `「${question}」` : "把問題默念在心裡",
    ],
    spread: [
      "第三步 · 選牌",
      "憑直覺，挑三張牌",
      `第 ${picks.length + 1} 張 · 代表你的「${LABELS[picks.length]}」（${picks.length} / 3）`,
    ],
    reading: [
      "第四步 · 解讀",
      "牌，已為你落定",
      done
        ? "你的三張牌解讀"
        : flipped.length === 3
          ? "三張牌皆已揭曉"
          : `依序輕觸牌背，還有 ${3 - flipped.length} 張未翻開`,
    ],
  }[stage];
  const Title = stage === "landing" ? "h1" : "h2";
  return (
    <section className="headline" aria-live="polite">
      <div key={stage} className="hl on" data-for={stage}>
        <div className="eyebrow">{copy[0]}</div>
        <Title aria-label={copy[1]}>
          {[...copy[1]].map((c, i) => (
            <span
              key={i}
              className="ch"
              aria-hidden="true"
              style={{ "--i": i }}
            >
              {c}
            </span>
          ))}
        </Title>
        <p className={stage === "shuffle" ? "quote" : "whisper"}>{copy[2]}</p>
      </div>
    </section>
  );
}
