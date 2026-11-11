import { FRAMES, LABELS } from "../data/tarot.js";
export default function ReadingBox({
  reading,
  question,
  cards,
  children,
  onAgain,
  againLabel = "再問一個問題",
}) {
  const shownCards = reading
    ? reading.cards.map((c) => ({
        id: c.card.id,
        zh: c.card.name_zh,
        en: c.card.name_en,
        position: c.position_label,
        text: c.interpretation,
        reversed: c.reversed,
      }))
    : cards;
  return (
    <div className="box">
      <div className="q-wrap">
        <span className="q-tag">你的提問</span>
        <p className="q">
          {question ? `「${question}」` : "你心中默念的那個問題"}
        </p>
      </div>
      <div className="rule" />
      {shownCards.map((card, i) => (
        <section key={card.id || card.n} className="sec">
          <div className="sec-h">
            <span className="when">{card.position || LABELS[i]}</span>
            <span className="cn">
              {card.zh}
              {reading && (card.reversed ? " · 逆位" : " · 正位")}
            </span>
            <span className="en">{card.en}</span>
          </div>
          <p>{reading ? card.text : FRAMES[i](card.line)}</p>
        </section>
      ))}
      <section className="sum-box">
        <div className="sec-h">
          <span className="when">綜合指引</span>
        </div>
        <p className="sum">
          {reading
            ? reading.overall
            : `你的過去帶著「${cards[0].kw[0]}」的底色，此刻正處在「${cards[1].kw[0]}」之中，而未來指向「${cards[2].kw[0]}」。${cards[2].line}`}
        </p>
      </section>
      {reading && (
        <section className="sec">
          <div className="sec-h">
            <span className="when">反思建議</span>
          </div>
          <p>{reading.advice}</p>
        </section>
      )}
      <p className="note">
        {reading
          ? reading.mock
            ? "目前為後端示範解讀，尚未使用 AI。"
            : "此解讀由 AI 產生，供自我反思參考。"
          : "這是舊版示範紀錄，未包含後端解讀。"}
      </p>
      {children}
      <div className="acts">
        <button className="btn-gold" onClick={onAgain}>
          {againLabel}
        </button>
      </div>
    </div>
  );
}
