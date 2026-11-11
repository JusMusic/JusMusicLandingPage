import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent } from
"framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useSmoothScroll from "@/hooks/useSmoothScroll";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { Image } from "@/components/ui/image";
import FinalScene from "@/components/jusmusic/FinalScene";
import StatusBadge from "@/components/jusmusic/StatusBadge";

// The globe occupies only a small part of the 1408 × 768 source image:
// its visible limb is centered at (704, 384) with a 202px radius, so the disc
// is 28.7% of the frame's width. The image is scaled 1408 / 404 ≈ 348.5% inside
// that circle, so the globe's limb lands exactly on the circular clip and the
// image's black surround is never rendered at all.
// The plate is 1.4× the globe's own diameter. The planet sits in the middle of
// it at exactly its old size, and the extra margin is empty space where a
// feathered radial mask fades everything to nothing — so the photo's limb is
// never chopped by a hard circular cut and no ring, rim or dark disc can appear
// around the Earth.
const PLATE_WIDTH = "40.18%";
const IMAGE_WIDTH = "249%";
const IMAGE_HEIGHT = "135.8%";
const PLATE_MASK =
"radial-gradient(circle closest-side, #000 0%, #000 74%, rgba(0,0,0,0.9) 81%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.2) 94%, rgba(0,0,0,0) 100%)";

const EARTH_URL =
"https://media.base44.com/images/public/user_6ab3fa99c1ed7566ce9427ce/bd0b23eb2_IMG_9284.JPG";
const AUDIENCE_URL =
"https://media.base44.com/images/public/user_6ab3fa99c1ed7566ce9427ce/9f8ada06c_B668EE53-E5A2-46CF-A263-96C11DE7DC31.PNG";
const CLOUD_FAR =
"https://media.base44.com/images/public/6ab3fd148fbca3efc55df54f/ae1f1a49e_generated_3dfad246.jpg";
const CLOUD_NEAR =
"https://media.base44.com/images/public/6ab3fd148fbca3efc55df54f/de3b2d20c_generated_37a74c0c.jpg";

const TITLE_1 = "BETTER FOR ARTISTS, FANS & THE PLANET";

// The Earth's scale over the descent, as keyframes: progress → scale.
const EARTH_SCALE = [
  { at: 0, scale: 1 },
  { at: 0.26, scale: 2.6 },
  { at: 0.48, scale: 4.6 }
];

export default function CinematicJourney() {
  const stageRef = useRef(null);
  const p = useMotionValue(0);
  const reducedMotion = usePrefersReducedMotion();

  // Inertia scrolling across the whole document (off when motion is reduced).
  useSmoothScroll();

  // The stage pins and tracks the scroll position one-to-one, so every beat
  // lands exactly where the scroll actually is — no catch-up, no drift, and a
  // fast wheel spin can never leave the picture behind the scrollbar.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top top",
      // A shorter runway for reduced motion: less travel, same story.
      end: reducedMotion ? "+=2200" : "+=7000",
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => p.set(self.progress)
    });

    return () => trigger.kill();
  }, [p, reducedMotion]);

  // ScrollTrigger already re-measures on resize, debounced into a single pass,
  // and ignoreMobileResize (see useSmoothScroll) keeps a collapsing address bar
  // from re-measuring the pin mid-scroll — so a second listener here would only
  // duplicate that work. The one case it cannot know about is the typeface
  // landing after first paint: the wordmark and taglines settle a few pixels
  // when Inter arrives, so measure once more at that moment.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- The final act begins only once the screen is fully black ----
  const sceneOpacity = useTransform(p, [0.9, 0.94], [0, 1]);
  const [finalActive, setFinalActive] = useState(false);
  useMotionValueEvent(p, "change", (value) => {
    if (value >= 0.94) setFinalActive(true);
  });

  // ---- Opening wordmark ----
  const wordOpacity = useTransform(p, [0, 0.1, 0.18, 0.24], [1, 1, 1, 0]);
  const wordY = useTransform(p, [0, 0.24], [0, -54]);
  const wordScale = useTransform(p, [0, 0.24], [1, 0.95]);

  // ---- Opening tagline (under the Earth, mirrors the wordmark spacing) ----
  const taglineOpacity = useTransform(p, [0, 0.1, 0.18, 0.24], [1, 1, 1, 0]);
  const taglineY = useTransform(p, [0, 0.24], [0, 40]);

  // ---- Earth (descent) — it fills the frame, then dissolves into the clouds
  //      before its edge could ever read as a disc sitting on top of them ----
  const earthScale = useTransform(p, [0, 0.22, 0.4], [1, 2.6, 4.6]);
  const earthOpacity = useTransform(p, [0, 0.2, 0.38], [1, 1, 0]);
  const earthBlurN = useTransform(p, [0, 0.24, 0.42], [0, 6, 26]);
  const earthFilter = useMotionTemplate`blur(${earthBlurN}px)`;

  // ---- Earth edge blend — unify the opening to jet black ----
  const vignetteOpacity = useTransform(p, [0, 0.26, 0.4], [1, 1, 0]);

  // ---- Clouds (far) — a long, unhurried fade-in that cross-dissolves with
  //      the Earth and holds well before the crowd begins to arrive ----
  const cloudFarOpacity = useTransform(
    p,
    [0.1, 0.36, 0.58, 0.7],
    [0, 1, 1, 0]
  );
  const cloudFarScale = useTransform(p, [0.1, 0.7], [1, 3.2]);
  const cloudFarBlurN = useTransform(p, [0.1, 0.7], [0, 12]);
  const cloudFarY = useTransform(p, [0.1, 0.7], [0, -150]);
  const cloudFarFilter = useMotionTemplate`blur(${cloudFarBlurN}px)`;

  // ---- Clouds (near) — a slower, later fade-in that overlaps the far layer
  //      and only completes just before the next act starts ----
  const cloudNearOpacity = useTransform(
    p,
    [0.2, 0.46, 0.58, 0.7],
    [0, 1, 1, 0]
  );
  const cloudNearScale = useTransform(p, [0.2, 0.7], [1.15, 3.2]);
  const cloudNearBlurN = useTransform(p, [0.2, 0.7], [0, 16]);
  const cloudNearY = useTransform(p, [0.2, 0.7], [0, -140]);
  const cloudNearFilter = useMotionTemplate`blur(${cloudNearBlurN}px)`;

  // ---- Audience — begins only once the cloud flight has fully arrived, then
  //      dissolves in under it without ever popping ----
  const audienceOpacity = useTransform(
    p,
    [0.46, 0.6, 0.68, 0.9],
    [0, 1, 1, 0]
  );
  const audienceScale = useTransform(p, [0.24, 0.9], [1.06, 1.36]);

  // ---- Atmospheric colour washes ----
  const violetOpacity = useTransform(p, [0.22, 0.4, 0.6, 0.84], [0, 0.5, 0.4, 0]);
  const goldGlowOpacity = useTransform(
    p,
    [0.38, 0.52, 0.68, 0.86, 1],
    [0, 0.6, 0.45, 0.12, 0.08]
  );

  // ---- Final deep-black fade ----
  const blackOpacity = useTransform(p, [0.78, 0.92], [0, 1]);

  // ---- Hero title 1 — fades in together with the audience image, and fades
  //      back out exactly when the image fades out ----
  const title1Opacity = useTransform(p, [0.46, 0.6, 0.76, 0.92], [0, 1, 1, 0]);
  const title1Y = useTransform(p, [0.46, 0.6, 0.76, 0.92], [40, 0, 0, -26]);
  const title1Scale = useTransform(p, [0.76, 0.92], [1, 0.95]);

  // ---- Scroll hint ----
  const hintOpacity = useTransform(p, [0, 0.04, 0.08], [0.65, 0.65, 0]);

  return (
    <div
      className="hero-sequence-container relative w-full">
      
      {/* The stage never clips: the globe scales freely past its own box, so no
          square or rectangular edge can ever cut into the expanding sphere. */}
      <div
        ref={stageRef}
        className="relative h-screen w-full bg-black"
        style={{ height: "100dvh", overflow: "visible" }}>
        {/* Earth */}
        <motion.div
          className="earth-frame absolute inset-0 flex items-center justify-center"
          style={{ opacity: earthOpacity, zIndex: 10, overflow: "visible" }}>
          
          <div className="earth-frame earth-plate scale-[1.6] sm:scale-100" style={{ overflow: "visible" }}>
            <motion.div
              style={{ scale: earthScale, filter: earthFilter, overflow: "visible" }}
              className="earth-frame relative will-change-transform">
              <div
                style={{ width: "min(100vw, 183.33vh)", aspectRatio: "1408 / 768" }}
                className="relative">
                {/* The planet is never cut by a circle: the plate is masked
                    with a feathered radial gradient, so the limb and atmosphere
                    dissolve into the black with no edge of any kind */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: PLATE_WIDTH,
                    aspectRatio: "1 / 1",
                    WebkitMaskImage: PLATE_MASK,
                    maskImage: PLATE_MASK
                  }}>
                  <Image
                    src={EARTH_URL}
                    fittingType="fill"
                    alt="Earth seen from space"
                    className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
                    style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Earth edge blend — unify the opening to jet black */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: vignetteOpacity,
            background:
            "radial-gradient(circle at 50% 50%, transparent 40%, #000 76%)"
          }} />
        

        {/* Clouds — far layer. No mask of any kind: the field is full screen
            from its first frame, so it can never read as a circle or a box. */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: cloudFarOpacity,
            y: cloudFarY,
            filter: cloudFarFilter,
            mixBlendMode: "screen"
          }}>
          
          <motion.div
            style={{ scale: cloudFarScale }}
            className="absolute inset-0 will-change-transform">
            
            <Image
              src={CLOUD_FAR}
              fittingType="fill"
              alt=""
              className="h-full w-full object-cover" />
            
          </motion.div>
        </motion.div>

        {/* Clouds — near layer */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: cloudNearOpacity,
            y: cloudNearY,
            filter: cloudNearFilter,
            mixBlendMode: "screen"
          }}>
          
          <motion.div
            style={{ scale: cloudNearScale }}
            className="absolute inset-0 will-change-transform">
            
            <Image
              src={CLOUD_NEAR}
              fittingType="fill"
              alt=""
              className="h-full w-full object-cover" />
            
          </motion.div>
        </motion.div>

        {/* Audience */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: audienceOpacity }}>
          
          <motion.div
            style={{ scale: audienceScale }}
            className="absolute inset-0 will-change-transform">
            
            <Image
              src={AUDIENCE_URL}
              fittingType="fill"
              alt="A vast live music audience at night"
              className="h-full w-full object-cover" />
            
          </motion.div>
        </motion.div>

        {/* Violet atmosphere wash */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: violetOpacity,
            background:
            "radial-gradient(120% 85% at 50% 62%, rgba(74,20,140,0) 0%, rgba(30,21,46,0.55) 58%, rgba(10,17,40,0.82) 100%)"
          }} />
        

        {/* Warm stage / golden glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: goldGlowOpacity,
            background:
            "radial-gradient(62% 52% at 50% 80%, rgba(227,197,118,0.42) 0%, rgba(227,197,118,0) 72%)"
          }} />
        

        {/* Final deep-black fade with subtle blue/violet core */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: blackOpacity,
            background:
            "radial-gradient(110% 110% at 50% 48%, rgba(13,17,40,0.55) 0%, #000 72%)"
          }} />
        

        {/* Opening wordmark */}
        <motion.div
          className="hero-wordmark absolute inset-x-0 top-[12%] sm:top-[15%] flex justify-center px-6"
          style={{ opacity: wordOpacity, y: wordY, scale: wordScale, zIndex: 40 }}>
          
          <span className="select-none text-[#FDFCF5] text-3xl sm:text-5xl md:text-6xl font-medium tracking-[-0.035em]">
            JusMusic
          </span>
        </motion.div>

        {/* Opening tagline — under the Earth, mirrors the wordmark spacing */}
        <motion.div
          className="tagline-anchor absolute inset-x-0 flex justify-center px-6"
          style={{ opacity: taglineOpacity, y: taglineY, zIndex: 40 }}>
          
          <p className="select-none text-center font-light tracking-[0.14em] sm:tracking-[0.2em] text-[#FDFCF5]/80 text-base sm:text-xl md:text-2xl">
            Where Music Meets <span className="font-semibold text-[#FDFCF5]">Impact.</span>
          </p>
        </motion.div>

        {/* Opening scroll cue — inside the pinned stage, so it travels with the
            opening scene instead of being anchored to a viewport edge. */}
        <motion.div
          className="scroll-hint pointer-events-none absolute inset-x-0 bottom-[3%] flex flex-col items-center gap-2 sm:gap-3"
          style={{ opacity: hintOpacity, zIndex: 45 }}>
          
          <span className="select-none text-[10px] tracking-[0.4em] text-[#FDFCF5]/70 font-light">
            SCROLL
          </span>
          <span className="h-8 w-px bg-gradient-to-b from-[#FDFCF5]/60 to-transparent" />
        </motion.div>

        {/* Hero title 1 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: title1Opacity, y: title1Y, scale: title1Scale, zIndex: 40 }}>
          
          <h1 className="select-none max-w-[22rem] sm:max-w-3xl text-center font-medium uppercase leading-[1.6] sm:leading-[1.5] text-[#FDFCF5] text-base sm:text-2xl md:text-3xl tracking-[0.08em] sm:tracking-[0.16em] md:tracking-[0.18em]">
            {TITLE_1}
          </h1>
        </motion.div>

        {/* Final act — strictly sequenced once the screen is fully black */}
        <FinalScene opacity={sceneOpacity} active={finalActive} />

        {/* 2% film grain for tactile depth */}
        <div className="grain-overlay" style={{ zIndex: 30 }} />

        {/* Private preview status */}
        <StatusBadge />
      </div>

    </div>);

}