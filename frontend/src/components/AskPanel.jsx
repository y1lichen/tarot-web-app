import { useEffect, useRef } from "react";
import { CATS, ICON } from "../data/tarot.js";
export default function AskPanel({ tarot }) {
  const input = useRef(null);
  useEffect(() => {
    if (matchMedia("(pointer:fine)").matches)
      input.current?.focus({ preventScroll: true });
  }, []);
  const category = CATS.find((c) => c.id === tarot.category);
  return (
    <div className="panel ask on">
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (tarot.question.trim().length >= 2) tarot.submit();
        }}
      >
        <div className="field">
          <input
            ref={input}
            type="text"
            maxLength={80}
            value={tarot.question}
            onChange={(e) => tarot.setQuestion(e.target.value)}
            placeholder="在心中默念，然後寫下你的問題⋯"
            aria-label="你的問題"
            enterKeyHint="go"
          />
          <span className="count">{tarot.question.length} / 80</span>
        </div>
        <div className="cat-title">不知道怎麼問？選一個方向</div>
        <div className="cats" role="group" aria-label="問題類型">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${c.id === tarot.category ? "on" : ""}`}
              aria-pressed={c.id === tarot.category}
              onClick={() =>
                tarot.setCategory(c.id === tarot.category ? null : c.id)
              }
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: ICON[c.id] }}
              />
              {c.name}
            </button>
          ))}
        </div>
        <div className="suggest" aria-live="polite">
          {category ? (
            category.qs.map((q, i) => (
              <button
                key={q}
                className="sg"
                style={{ "--i": i }}
                type="button"
                onClick={() => {
                  tarot.setQuestion(q);
                  input.current?.focus();
                }}
              >
                {q}
              </button>
            ))
          ) : (
            <div className="empty">點選上方類型，看看常見的提問</div>
          )}
        </div>
        <div className="ask-actions">
          <button
            className="btn-gold"
            type="submit"
            disabled={tarot.question.trim().length < 2}
          >
            獻上問題
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => tarot.submit(true)}
          >
            不想寫下來，我在心裡默念
          </button>
        </div>
      </form>
    </div>
  );
}
