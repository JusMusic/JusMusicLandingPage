import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import TypewriterLines from "@/components/jusmusic/TypewriterLines";
import Typewriter from "@/components/jusmusic/Typewriter";
import DrawLogo from "@/components/jusmusic/DrawLogo";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

// Typed one line at a time, each waiting for the previous to finish.
const PURPOSE_LINES = [
  { before: "Built by ", bold: "Artists", after: "," },
  { before: "Powered by ", bold: "Music", after: "," },
  { before: "Driven by ", bold: "Purpose", after: "." },
];

// Deep indigo/violet ambient aura sitting behind the COMING SOON frame.
const AURA =
  "radial-gradient(closest-side, rgba(91,78,236,0.42) 0%, rgba(124,45,235,0.3) 38%, rgba(76,29,149,0.16) 66%, rgba(49,16,110,0) 100%)";

export default function FinalScene({ opacity, active }) {
  const [statementDone, setStatementDone] = useState(false);
  const [subtitleStarted, setSubtitleStarted] = useState(false);
  const [taglineDone, setTaglineDone] = useState(false);
  const [logoReveal, setLogoReveal] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // Deliberate middle hold — the finished frame sits still for a beat before
  // the wordmark is drawn. Reduced motion goes straight there.
  useEffect(() => {
    if (!taglineDone) return undefined;
    const timer = setTimeout(() => setLogoReveal(true), reducedMotion ? 0 : 1600);
    return () => clearTimeout(timer);
  }, [taglineDone, reducedMotion]);

  // Step 4 — only once "COMING SOON" has finished focusing (2.4s lens pull).
  useEffect(() => {
    if (!statementDone) return undefined;
    const timer = setTimeout(() => setSubtitleStarted(true), reducedMotion ? 0 : 2450);
    return () => clearTimeout(timer);
  }, [statementDone, reducedMotion]);

  // Micro-magnetic cursor follow for the COMING SOON container.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const magneticX = useSpring(mouseX, { stiffness: 70, damping: 15, mass: 0.6 });
  const magneticY = useSpring(mouseY, { stiffness: 70, damping: 15, mass: 0.6 });

  useEffect(() => {
    if (reducedMotion) return undefined;
    const handlePointer = (event) => {
      mouseX.set((event.clientX / window.innerWidth - 0.5) * 18);
      mouseY.set((event.clientY / window.innerHeight - 0.5) * 14);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, [mouseX, mouseY, reducedMotion]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-evenly px-6 pt-20 pb-20 sm:pt-28 sm:pb-20"
      style={{ opacity, zIndex: 50 }}
    >
      {/* a) Purpose statement — typed in strict sequence */}
      <TypewriterLines
        lines={PURPOSE_LINES}
        start={active}
        instant={reducedMotion}
        onComplete={() => setStatementDone(true)}
      />

      {/* b) COMING SOON — aura, then a dot that opens into the capsule */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "min(130vw, 1150px)",
            aspectRatio: "2 / 1",
            background: AURA,
            filter: "blur(52px)",
            willChange: "opacity",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: statementDone ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 1.8, ease: "easeOut" }}
        />

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(16px)" }}
          animate={
            statementDone
              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
              : { opacity: 0, scale: 0.95, filter: "blur(16px)" }
          }
          transition={{ duration: reducedMotion ? 0 : 2.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            x: magneticX,
            y: magneticY,
            // Keep the frame on its own layer for the whole reveal, so the
            // browser never rebuilds it mid-animation and blink a frame.
            willChange: "opacity, transform, filter",
          }}
        >
          <div className="light-beam-frame px-12 py-5 sm:px-20 sm:py-8">
            <h2 className="select-none text-center font-medium tracking-[-0.035em] md:tracking-[-0.045em] text-[#FDFCF5] text-2xl sm:text-4xl md:text-[3.5rem]">
              COMING SOON
            </h2>
          </div>
        </motion.div>
      </div>

      {/* c) A New Era For Music — only once COMING SOON is fully focused */}
      <Typewriter
        text="A New Era For Music."
        start={subtitleStarted}
        instant={reducedMotion}
        onComplete={() => setTaglineDone(true)}
        className="select-none text-center font-light tracking-[0.01em] text-[#FDFCF5]/90 text-lg sm:text-2xl md:text-3xl"
      />

      {/* d) Baseline wordmark — pen-drawn after the hold */}
      <DrawLogo start={logoReveal} />

      {/* e) Closing copyright — part of the final scene's own composition, so
          it arrives with the scene and can never sit outside the screen. */}
      <p className="final-copyright select-none text-center font-light text-[#FDFCF5] text-[8px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em]">
        Copyright 2026 JusMusic ™ All rights reserved
      </p>
    </motion.div>
  );
}