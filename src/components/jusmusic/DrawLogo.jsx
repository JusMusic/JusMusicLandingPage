import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const WORD = "JusMusic";
const LETTERS = WORD.split("");

// A dash long enough to cover any single glyph outline.
const DASH = 120;

// Glyph advances (Inter Medium, 28px) used until real metrics are available.
const FALLBACK_X = [21.3, 34.9, 50.6, 64.2, 88.4, 104.1, 117.7, 125.0];
const FALLBACK_END = 139;

const fontStyle = {
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontWeight: 500,
  fontSize: 28,
  letterSpacing: "0.01em",
};

export default function DrawLogo({ start }) {
  const svgRef = useRef(null);
  const measureRef = useRef(null);
  const strokeRefs = useRef([]);
  const fillRefs = useRef([]);
  const penRef = useRef(null);

  useEffect(() => {
    if (!start) return undefined;

    let timeline;
    let cancelled = false;

    const draw = () => {
      if (cancelled || !svgRef.current) return;

      const measure = measureRef.current;
      const positions = LETTERS.map((_, index) => {
        try {
          return measure.getStartPositionOfChar(index).x;
        } catch {
          return FALLBACK_X[index];
        }
      });
      let endX = FALLBACK_END;
      try {
        endX = measure.getEndPositionOfChar(LETTERS.length - 1).x;
      } catch {
        // keep the estimated end
      }

      gsap.set(svgRef.current, { opacity: 1 });
      strokeRefs.current.forEach((el, index) => {
        if (!el) return;
        gsap.set(el, { attr: { x: positions[index] }, strokeDashoffset: DASH, opacity: 1 });
      });
      fillRefs.current.forEach((el, index) => {
        if (!el) return;
        gsap.set(el, { attr: { x: positions[index] }, opacity: 0 });
      });
      gsap.set(penRef.current, { x: positions[0], opacity: 0 });

      // One letter at a time: each starts only after the previous one is
      // finished, so the word reads as slowly hand-written.
      const STROKE = 0.38;
      const STEP = STROKE + 0.06;

      timeline = gsap.timeline({ delay: 0.15 });

      timeline.fromTo(
        penRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power1.out" },
        0
      );

      strokeRefs.current.forEach((el, index) => {
        const at = index * STEP;
        // One continuous pen stroke per letter, left to right.
        timeline.fromTo(
          el,
          { strokeDashoffset: DASH },
          { strokeDashoffset: 0, duration: STROKE, ease: "none" },
          at
        );
        // The moment a letter's stroke completes, it settles into solid type.
        timeline.fromTo(
          fillRefs.current[index],
          { opacity: 0 },
          { opacity: 1, duration: 0.22, ease: "power1.out" },
          at + STROKE * 0.9
        );
        // The nib travels across just this glyph, then rests before the next.
        timeline.set(penRef.current, { x: positions[index] }, at);
        timeline.to(
          penRef.current,
          {
            x: index < LETTERS.length - 1 ? positions[index + 1] : endX,
            duration: STROKE,
            ease: "none",
          },
          at
        );
      });

      timeline.to(penRef.current, { opacity: 0, duration: 0.35, ease: "power1.out" }, "+=0.05");
    };

    if (document.fonts?.status === "loaded") draw();
    else if (document.fonts?.ready) document.fonts.ready.then(draw);
    else draw();

    return () => {
      cancelled = true;
      timeline?.kill();
    };
  }, [start]);

  return (
    <svg
      ref={svgRef}
      className="jusmusic-logo-stage h-7 sm:h-8 md:h-9 w-auto select-none"
      style={{ opacity: 0 }}
      data-stage
      role="img"
      aria-label="JusMusic"
      viewBox="0 0 160 44"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs data-defs>
        <linearGradient id="jus-glint" gradientUnits="userSpaceOnUse" x1="-34" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#FDFCF5" stopOpacity="0" />
          <stop offset="70%" stopColor="#FDFCF5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FDFCF5" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Metric source only — never painted */}
      <text
        ref={measureRef}
        x="80"
        y="31"
        textAnchor="middle"
        fill="none"
        opacity="0"
        aria-hidden="true"
        style={fontStyle}
      >
        {WORD}
      </text>

      <g data-world>
        {/* Solid fill layer — each letter settles as its stroke completes */}
        <g data-picture>
          {LETTERS.map((letter, index) => (
            <text
              key={`fill-${letter}-${index}`}
              ref={(el) => {
                fillRefs.current[index] = el;
              }}
              x={FALLBACK_X[index]}
              y="31"
              fill="#FDFCF5"
              opacity="0"
              style={fontStyle}
            >
              {letter}
            </text>
          ))}
        </g>

        {/* Tracing outlines */}
        <g
          data-pieces
          fill="none"
          stroke="#FDFCF5"
          strokeWidth={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {LETTERS.map((letter, index) => (
            <text
              key={`stroke-${letter}-${index}`}
              ref={(el) => {
                strokeRefs.current[index] = el;
              }}
              x={FALLBACK_X[index]}
              y="31"
              strokeDasharray={DASH}
              strokeDashoffset={DASH}
              opacity="0"
              style={fontStyle}
            >
              {letter}
            </text>
          ))}
        </g>

        <g data-links />

        {/* Glint trail and square nib riding the stroke head */}
        <g ref={penRef} style={{ opacity: 0 }}>
          <path
            className="scia"
            data-glint
            d="M-34 22 L0 22"
            fill="none"
            stroke="url(#jus-glint)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <g data-nib>
            <rect
              className="punto"
              data-nib-rect
              x="-1.8"
              y="20.2"
              width="3.6"
              height="3.6"
              rx="0.4"
              fill="#FDFCF5"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}