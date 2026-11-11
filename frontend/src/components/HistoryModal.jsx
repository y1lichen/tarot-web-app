import { useState } from "react";
import { CARDS, LABELS } from "../data/tarot.js";
import { MiniCard } from "./Card.jsx";
import Modal from "./Modal.jsx";
import ReadingBox from "./ReadingBox.jsx";
const formatDate = (ts) =>
  new Date(ts).toLocaleString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export default function HistoryModal({ records, onClose, onAskAgain }) {
  const [selected, setSelected] = useState(null);
  const thumbnails = (record) =>
    record.picks.map((n, i) => (
      <MiniCard key={i} card={CARDS[n]} label={LABELS[i]} />
    ));
  return (
    <Modal titleId="histTitle" wide onClose={onClose}>
      {selected && (
        <button className="hback" onClick={() => setSelected(null)}>
          ‹ 返回紀錄
        </button>
      )}
      <div className="hhead">
        <h3 id="histTitle">{selected ? "占卜紀錄" : "我的占卜紀錄"}</h3>
        <p className="sheet-sub">
          {selected
            ? formatDate(selected.ts)
            : `共 ${records.length} 筆 · 由新到舊`}
        </p>
      </div>
      <div className="hbody" key={selected?.id || "list"}>
        {selected ? (
          <>
            <div className="rd-thumbs">{thumbnails(selected)}</div>
            <ReadingBox
              question={selected.q}
              cards={selected.picks.map((n) => CARDS[n])}
              onAgain={() => onAskAgain(selected.q)}
              againLabel="再問一次類似的問題"
            />
          </>
        ) : records.length ? (
          <div className="recs">
            {records.map((r) => (
              <button className="rec" key={r.id} onClick={() => setSelected(r)}>
                <div className="rec-meta">
                  <span>{formatDate(r.ts)}</span>
                  <span className="rec-go">查看 ›</span>
                </div>
                <div className="rec-q">
                  {r.q ? `「${r.q}」` : "默念在心裡的問題"}
                </div>
                <div className="rec-cards">{thumbnails(r)}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="hempty">
            <span className="big">✦</span>還沒有紀錄
            <br />
            去問第一個問題吧
            <br />
            <button className="btn-gold" onClick={() => onAskAgain("")}>
              開始占卜
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
