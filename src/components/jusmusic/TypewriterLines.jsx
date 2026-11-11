import { useEffect, useRef, useState } from "react";

// Characters reveal one at a time, in strict sequence: the next line only
// begins once the previous line has completely finished typing.
const CHAR_MS = 55;
const LINE_GAP_MS = 420;

const toSegments = (line) => [
{ text: line.before, bold: false },
{ text: line.bold, bold: true },
{ text: line.after, bold: false }];


export default function TypewriterLines({ lines, start, instant = false, onComplete }) {
  const [counts, setCounts] = useState(() => lines.map(() => 0));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!start) return undefined;

    // Reduced motion: all three lines are simply there, already complete.
    if (instant) {
      setCounts(lines.map((line) => line.before.length + line.bold.length + line.after.length));
      const done = setTimeout(() => onCompleteRef.current?.(), 0);
      return () => clearTimeout(done);
    }

    const timers = [];
    let elapsed = 0;

    lines.forEach((line, lineIndex) => {
      const length = line.before.length + line.bold.length + line.after.length;
      for (let visible = 1; visible <= length; visible += 1) {
        elapsed += CHAR_MS;
        timers.push(
          setTimeout(() => {
            setCounts((current) => {
              const next = [...current];
              next[lineIndex] = visible;
              return next;
            });
          }, elapsed)
        );
      }
      // A beat after a line completes, before the next one starts.
      elapsed += LINE_GAP_MS;
    });

    // Everything has been typed — hand off to the next step of the sequence.
    timers.push(setTimeout(() => onCompleteRef.current?.(), elapsed));

    return () => timers.forEach(clearTimeout);
  }, [start, lines, instant]);

  return (
    <div className="flex flex-col items-start gap-3 sm:gap-5 font-mono text-[#FDFCF5] text-base sm:text-xl md:text-2xl leading-[1.6]">
      {lines.map((line, lineIndex) => {
        const segments = toSegments(line);
        const lineLength = segments.reduce((total, segment) => total + segment.text.length, 0);
        const typing = counts[lineIndex] > 0 && counts[lineIndex] < lineLength;
        let remaining = counts[lineIndex];
        return (
          <span key={line.bold} className="relative block whitespace-nowrap">
            {/* Reserves the final width so the line never shifts while typing */}
            <span className="invisible" aria-hidden="true">
              {segments.map((segment, index) =>
              <span
                key={index}
                className={segment.bold ? "font-semibold" : undefined}>
                
                  {segment.text}
                </span>
              )}
            </span>
            <span className="absolute inset-0 text-left">
              {segments.map((segment, index) => {
                if (remaining <= 0) return null;
                const slice = segment.text.slice(0, remaining);
                remaining -= slice.length;
                if (!slice) return null;
                return (
                  <span
                    key={index}
                    className={segment.bold ? "font-semibold" : undefined}>
                    
                    {slice}
                  </span>);

              })}
              {typing && <span className="typing-cursor" aria-hidden="true" />}
            </span>
          </span>);

      })}
    </div>);

}