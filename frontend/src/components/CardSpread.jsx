import Card from "./Card.jsx";
import { LABELS, RATIO } from "../data/tarot.js";
export default function CardSpread({ tarot, width, height, slotWidth }) {
  const narrow = width < 700;
  const cw = Math.max(
    narrow ? 66 : 84,
    Math.min(width * (narrow ? 0.235 : 0.2), height * 0.17, 132),
  );
  const ch = cw * RATIO,
    angle = ((narrow ? 42 : 46) * Math.PI) / 180;
  const radius = Math.max(
    Math.min((width / 2 - cw * 0.45) / Math.sin(angle), height * 0.95) - ch,
    48,
  );
  const outer = radius + ch,
    headEnd = narrow ? 176 : 196;
  const slotTop = height - slotWidth * RATIO - Math.max(84, height * 0.1);
  const top =
    headEnd +
    Math.max(
      0,
      (slotTop - headEnd - 12 - (outer - radius * Math.cos(angle))) / 2,
    ) *
      0.6;
  return (
    <>
      {tarot.stage === "spread" && (
        <div className="fan">
          {tarot.deck.map((card, i) => (
            <button
              key={card.n}
              className={`fslot ${tarot.picks.includes(card) ? "gone" : ""}`}
              disabled={tarot.picks.includes(card)}
              aria-label={`第 ${i + 1} 張牌`}
              onClick={() => tarot.pick(card)}
              style={{
                left: width / 2 - cw / 2,
                top,
                width: cw,
                height: ch,
                transformOrigin: `${cw / 2}px ${outer}px`,
                transform: `rotate(${((-angle + (2 * angle * i) / (tarot.deck.length - 1)) * 180) / Math.PI}deg)`,
                zIndex: i,
                "--lift": `${ch * 0.16}px`,
                "--i": i,
              }}
            >
              <Card />
            </button>
          ))}
        </div>
      )}
      <div className="slots">
        {LABELS.map((label, i) => {
          const card = tarot.picks[i],
            flipped = tarot.flipped.includes(i),
            reading = tarot.stage === "reading";
          return (
            <div
              key={label}
              className={`slot ${card ? "filled landed" : ""} ${reading ? "ready" : ""} ${flipped ? "flipped" : ""} ${tarot.stage === "spread" && i === tarot.picks.length ? "next" : ""}`}
            >
              <div className="slot-frame">
                <span>{["I", "II", "III"][i]}</span>
              </div>
              {card && (
                <button
                  className="slot-trigger"
                  disabled={!reading || flipped}
                  aria-label={
                    flipped ? `${label}：${card.zh}` : `翻開${label}的牌`
                  }
                  onClick={() => tarot.flip(i)}
                >
                  <Card card={card} flipped={flipped} className="flyer" />
                </button>
              )}
              <div className="slot-meta">
                <div className="slot-label">{label}</div>
                <div className="slot-name">{flipped && card?.zh}</div>
                <div className="slot-en">{flipped && card?.en}</div>
                <ul className="slot-kw">
                  {flipped && card?.kw.map((k) => <li key={k}>{k}</li>)}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
