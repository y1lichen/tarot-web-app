import { useEffect, useRef, useState } from "react";
export default function Header({ tarot, user, onLogin, onHistory, onLogout }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null),
    accountRef = useRef(null);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector("button")?.focus();
    const dismiss = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !accountRef.current?.contains(e.target)
      )
        setMenu(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") {
        setMenu(false);
        accountRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);
  const index = ["ask", "shuffle", "spread", "reading"].indexOf(tarot.stage);
  return (
    <header className="top">
      <button
        className={`icon-btn ${tarot.canBack ? "" : "off"}`}
        disabled={!tarot.canBack}
        onClick={tarot.back}
        aria-label="上一步"
      >
        <svg viewBox="0 0 24 24">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      </button>
      <div className="brand">
        <div className="brand-name">AURUM</div>
        <ol className="steps">
          {["提問", "洗牌", "選牌", "解讀"].map((label, i) => (
            <li
              key={label}
              className={i === index ? "active" : i < index ? "done" : ""}
              aria-current={i === index ? "step" : undefined}
            >
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="tr">
        <div className="tr-in">
          <button
            className="icon-btn"
            hidden={tarot.stage === "landing"}
            onClick={() => tarot.restart()}
            aria-label="重新開始"
          >
            <svg viewBox="0 0 24 24">
              <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
            </svg>
          </button>
          {!user && tarot.stage === "landing" && (
            <button
              className="icon-btn login-btn"
              onClick={onLogin}
              aria-haspopup="dialog"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8.5" r="3.6" />
                <path d="M4.8 20c.9-3.6 3.78-5.4 7.2-5.4s6.3 1.8 7.2 5.4" />
              </svg>
              <span>登入</span>
            </button>
          )}
          {user && (
            <button
              ref={accountRef}
              className="icon-btn acct"
              onClick={() => setMenu(!menu)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-controls="acctMenu"
              aria-label="帳號選單"
            >
              {[...user.name][0]}
            </button>
          )}
        </div>
      </div>
      {user && menu && (
        <div ref={menuRef} className="acct-menu" id="acctMenu" role="menu">
          <div className="am-user">
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <button
            className="am-item"
            role="menuitem"
            onClick={() => {
              setMenu(false);
              onHistory();
            }}
          >
            我的占卜紀錄
          </button>
          <button
            className="am-item"
            role="menuitem"
            onClick={() => {
              setMenu(false);
              onLogout();
            }}
          >
            登出
          </button>
        </div>
      )}
    </header>
  );
}
