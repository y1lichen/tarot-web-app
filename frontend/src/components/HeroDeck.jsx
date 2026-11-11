import Card from "./Card.jsx";
import { DECK_N, HOLD_FULL } from "../data/tarot.js";
export default function HeroDeck({ tarot }) {
  const landing = tarot.stage === "landing",
    shuffle = tarot.stage === "shuffle";
  return (
    <>
      <div id="center">
        <div className="floaty">
          <div className="aura" />
          <svg className="halo" viewBox="-300 -300 600 600" aria-hidden="true">
            <g className="a">
              <circle r="298" />
              <circle r="262" strokeDasharray="2 7" />
              {Array.from({ length: 120 }, (_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1="-292"
                  x2="0"
                  y2={i % 10 === 0 ? -270 : i % 5 === 0 ? -279 : -285}
                  transform={`rotate(${i * 3})`}
                />
              ))}
            </g>
            <g className="b">
              <circle r="236" />
              <circle r="204" strokeDasharray="1 5" />
            </g>
            <circle r="172" opacity=".4" />
          </svg>
          <div
            className="tilt"
            role={landing ? "button" : undefined}
            tabIndex={landing ? 0 : -1}
            aria-label={landing ? "點擊牌卡，開始占卜" : undefined}
            onClick={() => landing && tarot.start()}
            onKeyDown={(e) => {
              if (landing && ["Enter", " "].includes(e.key)) {
                e.preventDefault();
                tarot.start();
              }
            }}
          >
            <div className={`deck ${tarot.holding ? "shuffling" : ""}`}>
              {Array.from({ length: DECK_N }, (_, i) => (
                <Card
                  key={i}
                  className={`dcard ${i < DECK_N - 1 ? "under" : ""}`}
                  style={{
                    "--card-index": i,
                    transform: `translate(${(i - DECK_N + 1) * 0.6}px,${(DECK_N - 1 - i) * 1.15}px)`,
                    zIndex: i,
                  }}
                />
              ))}
            </div>
            <div className="glare" />
          </div>
          {shuffle && (
            <div
              className="pad"
              role="button"
              tabIndex={0}
              aria-label="長按以洗牌（也可按住空白鍵）"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                tarot.startHold();
              }}
              onPointerUp={tarot.stopHold}
              onPointerCancel={tarot.stopHold}
              onLostPointerCapture={tarot.stopHold}
              onBlur={tarot.stopHold}
              onKeyDown={(e) => {
                if ([" ", "Enter"].includes(e.key)) {
                  e.preventDefault();
                  tarot.startHold();
                }
              }}
              onKeyUp={(e) => {
                if ([" ", "Enter"].includes(e.key)) {
                  e.preventDefault();
                  tarot.stopHold();
                }
              }}
            />
          )}
        </div>
        {landing && (
          <div className="cta on">
            <b>點擊牌卡</b>
            <small>靜心一念，開啟這場占卜</small>
          </div>
        )}
      </div>
      {shuffle && (
        <div className="panel shuffle on">
          <div className="hint">
            <span className="dot" />
            <span>
              {tarot.holding
                ? "洗牌中⋯"
                : tarot.ready
                  ? "覺得夠了，就可以收牌"
                  : "長按牌堆，持續洗牌"}
            </span>
          </div>
          <div className="sub">
            {tarot.holding
              ? "心裡默念你的問題，不要放開"
              : "按住不放，牌會隨你的專注而流動"}
          </div>
          <div
            className="meter"
            role="progressbar"
            aria-label="洗牌進度"
            aria-valuemin={0}
            aria-valuemax={HOLD_FULL}
            aria-valuenow={Math.round(tarot.energy)}
          >
            <i style={{ width: `${(tarot.energy / HOLD_FULL) * 100}%` }} />
          </div>
          <button
            id="doneShuffle"
            className={`btn-gold ${tarot.ready ? "show" : ""}`}
            disabled={!tarot.ready}
            onClick={tarot.finishShuffle}
          >
            洗好牌了
          </button>
        </div>
      )}
    </>
  );
}
