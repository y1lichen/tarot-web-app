import { useEffect, useRef } from "react";
export default function Modal({ titleId, onClose, wide = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const background = document.getElementById("experience");
    background.inert = true;
    ref.current.querySelector("button")?.focus();
    function keyboard(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key !== "Tab") return;
      const elements = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), input, [href], [tabindex="0"]',
        ),
      ].filter((el) => !el.hidden);
      const first = elements[0],
        last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      background.inert = false;
      document.removeEventListener("keydown", keyboard);
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="modal on"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="modal-bg" onClick={onClose} />
      <div className={`sheet ${wide ? "wide" : ""}`}>
        <button
          className="icon-btn sheet-x"
          onClick={onClose}
          aria-label="關閉"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
