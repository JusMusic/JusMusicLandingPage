import { useEffect, useRef, useState } from "react";

// Types a single line out character by character, then reports completion.
export default function Typewriter({ text, start, charMs = 55, instant = false, className, onComplete }) {
  const [count, setCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!start) return undefined;

    // Reduced motion: the line is simply there, already complete.
    if (instant) {
      setCount(text.length);
      const done = setTimeout(() => onCompleteRef.current?.(), 0);
      return () => clearTimeout(done);
    }

    const timers = [];
    for (let visible = 1; visible <= text.length; visible += 1) {
      timers.push(
        setTimeout(() => {
          setCount(visible);
          if (visible === text.length) onCompleteRef.current?.();
        }, visible * charMs)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [start, text, charMs, instant]);

  // The caret lives only while characters are still arriving.
  const typing = Boolean(start) && count > 0 && count < text.length;

  return (
    <span className={`relative inline-block whitespace-nowrap ${className ?? ""}`}>
      {/* Reserves the final width so the line never shifts while typing */}
      <span className="invisible" aria-hidden="true">{text}</span>
      <span className="absolute inset-0 text-left">
        {text.slice(0, count)}
        {typing && <span className="typing-cursor" aria-hidden="true" />}
      </span>
    </span>
  );
}