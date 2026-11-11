import cardBack from "../../assets/card-back.png";
function starPath(spikes, outer, inner) {
  return (
    Array.from({ length: spikes * 2 }, (_, i) => {
      const radius = i % 2 ? inner : outer,
        angle = (Math.PI * i) / spikes - Math.PI / 2;
      return `${i ? "L" : "M"}${(radius * Math.cos(angle)).toFixed(1)} ${(radius * Math.sin(angle)).toFixed(1)}`;
    }).join("") + "Z"
  );
}
export function CardFront({ card }) {
  return (
    <div className="front-in">
      <div className="num">{card.rn}</div>
      <svg className="sigil" viewBox="-100 -100 200 200" aria-hidden="true">
        <circle r="94" />
        <circle r="85" strokeDasharray="1 4" />
        <g transform={`rotate(${card.n * 9})`}>
          <path d={starPath(6 + (card.n % 9), 70, 28)} />
        </g>
        <path className="fill" d={starPath(8, 34, 13)} />
        <circle className="fill" r="4.5" />
      </svg>
      <div className="nm">{card.zh}</div>
      <div className="en">{card.en}</div>
    </div>
  );
}
export default function Card({ card, flipped = false, className = "", style }) {
  return (
    <div
      className={`card ${flipped ? "flipped" : ""} ${className}`}
      style={style}
    >
      <div className="card-inner">
        <div className="face back">
          <img src={cardBack} alt="" draggable="false" />
        </div>
        {card && (
          <div className="face front">
            <CardFront card={card} />
          </div>
        )}
      </div>
    </div>
  );
}
export function MiniCard({ card, label }) {
  return (
    <figure className="mini">
      <div className="thumb">
        <div className="face front">
          <CardFront card={card} />
        </div>
      </div>
      <figcaption>
        {label}
        <b>{card.zh}</b>
      </figcaption>
    </figure>
  );
}
