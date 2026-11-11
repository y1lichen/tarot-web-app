import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
export default function LoginModal({ onClose, onSignIn }) {
  const [loading, setLoading] = useState(false),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Modal titleId="loginTitle" onClose={onClose}>
      <svg className="emblem" viewBox="-30 -30 60 60" aria-hidden="true">
        <circle r="27" />
        <circle r="22" strokeDasharray="1 3.2" />
        <path
          className="fill"
          d="M0 -17 L3.6 -3.6 17 0 3.6 3.6 0 17 -3.6 3.6 -17 0 -3.6 -3.6Z"
        />
      </svg>
      <h3 id="loginTitle">登入，珍藏你的占卜</h3>
      <p className="sheet-sub">讓每一次提問都有跡可循</p>
      <button
        className={`g-btn ${loading ? "loading" : ""}`}
        disabled={loading}
        onClick={() => {
          setLoading(true);
          timer.current = setTimeout(onSignIn, 1500);
        }}
      >
        <span className="g-spin" aria-hidden="true" />
        <span className="g-text">
          {loading ? "正在登入示範帳號⋯" : "使用示範帳號登入"}
        </span>
      </button>
      <p className="demo-note on">目前為本機示範登入，紀錄只儲存在此瀏覽器。</p>
      <div className="sheet-rule">
        <span>登入後你可以</span>
      </div>
      <ul className="perks">
        <li>回顧曾經問過的問題與抽到的牌</li>
        <li>隨時重讀那一次的解讀</li>
      </ul>
      <button className="btn-ghost" onClick={onClose}>
        先不登入，繼續占卜
      </button>
    </Modal>
  );
}
