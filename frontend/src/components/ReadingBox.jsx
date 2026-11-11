import { FRAMES, LABELS } from "../data/tarot.js";
export default function ReadingBox({
  question,
  cards,
  children,
  onAgain,
  againLabel = "再問一個問題",
}) {
  return (
    <div className="box">
      <div className="q-wrap">
        <span className="q-tag">你的提問</span>
        <p className="q">
          {question ? `「${question}」` : "你心中默念的那個問題"}
        </p>
      </div>
      <div className="rule" />
      {cards.map((card, i) => (
        <section key={card.n} className="sec">
          <div className="sec-h">
            <span className="when">{LABELS[i]}</span>
            <span className="cn">{card.zh}</span>
            <span className="en">{card.en}</span>
          </div>
          <p>{FRAMES[i](card.line)}</p>
        </section>
      ))}
      <section className="sum-box">
        <div className="sec-h">
          <span className="when">綜合指引</span>
        </div>
        <p className="sum">
          你的過去帶著「{cards[0].kw[0]}」的底色，此刻正處在「{cards[1].kw[0]}
          」之中，而未來指向「{cards[2].kw[0]}」。
          <br />
          三張牌連起來看，是在提醒你：{cards[2].line}
        </p>
      </section>
      <p className="note">※ 此區為版面示意，正式解讀內容由後端／AI 串接帶入</p>
      {children}
      <div className="acts">
        <button className="btn-gold" onClick={onAgain}>
          {againLabel}
        </button>
      </div>
    </div>
  );
}
