import { useCallback, useEffect, useState } from "react";
import { useTarot } from "./hooks/useTarot.js";
import { useAccount } from "./hooks/useAccount.js";
import { useViewport } from "./hooks/useViewport.js";
import Background from "./components/Background.jsx";
import Header from "./components/Header.jsx";
import Headline from "./components/Headline.jsx";
import HeroDeck from "./components/HeroDeck.jsx";
import AskPanel from "./components/AskPanel.jsx";
import CardSpread from "./components/CardSpread.jsx";
import ReadingBox from "./components/ReadingBox.jsx";
import LoginModal from "./components/LoginModal.jsx";
import HistoryModal from "./components/HistoryModal.jsx";
export default function App() {
  const tarot = useTarot(),
    account = useAccount(),
    { width, height } = useViewport();
  const [modal, setModal] = useState(null),
    [toast, setToast] = useState("");
  const closeModal = useCallback(() => setModal(null), []);
  const slotWidth = Math.max(76, Math.min(width * 0.24, height * 0.17, 150));
  const { user, saveReading } = account;
  const { done, readingId, question, picks } = tarot;
  useEffect(() => {
    if (done && user && readingId) saveReading(readingId, question, picks);
  }, [done, user, readingId, question, picks, saveReading]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);
  const saved = user && account.records.some((r) => r.id === readingId);
  return (
    <div
      id="app"
      data-stage={tarot.stage}
      className={`${done ? "done" : ""} ${tarot.holding ? "holding" : ""}`}
      style={{
        "--H": `${height}px`,
        "--sw": `${slotWidth}px`,
        "--energy": tarot.energy / 5000,
      }}
    >
      <div id="experience">
        <Background />
        <Header
          tarot={tarot}
          user={user}
          onLogin={() => setModal("login")}
          onHistory={() => setModal("history")}
          onLogout={() => {
            account.signOut();
            setToast("已登出");
          }}
        />
        <Headline tarot={tarot} />
        <HeroDeck tarot={tarot} />
        {tarot.stage === "ask" && <AskPanel tarot={tarot} />}
        {["spread", "reading"].includes(tarot.stage) && (
          <CardSpread
            tarot={tarot}
            width={width}
            height={height}
            slotWidth={slotWidth}
          />
        )}
        {done && (
          <div className="panel read on shown">
            <ReadingBox
              question={question}
              cards={picks}
              onAgain={() => tarot.restart()}
            >
              <div className="save-slot">
                {saved ? (
                  <>
                    <span className="saved">✦ 已存入你的紀錄</span>
                    <button
                      className="link"
                      onClick={() => setModal("history")}
                    >
                      查看紀錄
                    </button>
                  </>
                ) : (
                  !user && (
                    <>
                      <span>登入後即可保存這次的占卜</span>
                      <button
                        className="link"
                        onClick={() => setModal("login")}
                      >
                        登入
                      </button>
                    </>
                  )
                )}
              </div>
            </ReadingBox>
          </div>
        )}
      </div>
      {modal === "login" && (
        <LoginModal
          onClose={closeModal}
          onSignIn={() => {
            account.signIn();
            closeModal();
            setToast("已登入示範帳號");
          }}
        />
      )}
      {modal === "history" && (
        <HistoryModal
          records={account.records}
          onClose={closeModal}
          onAskAgain={(q) => {
            closeModal();
            tarot.restart(q, "ask");
          }}
        />
      )}
      <div
        className={`toast ${toast ? "on" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
