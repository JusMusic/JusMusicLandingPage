import { useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// A mouse, trackpad or stylus is precise and hover-capable; a finger is not.
// The two kinds of input get completely different scrolling, exactly as the
// operating system itself does it.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

// Desktop — the trackpad glide. Each notch travels a little under the full
// distance and the easing is soft enough to read as continuous motion, so the
// descent feels unhurried and weighted without ever trailing the hand.
//
// The easing is expressed in TIME, not per frame. A per-frame lerp moves a
// fixed percentage every frame, so on a 120Hz display it would ease exactly
// twice as fast as on a 60Hz one and the descent would feel like a different
// film on every screen. A fixed duration with an exponential decay draws one
// identical curve at 60, 90 and 120Hz — tuned to the same time constant the
// old per-frame 0.12 lerp produced at 60Hz, so the weight is unchanged.
const DESKTOP_EASING = (t) => 1 - Math.pow(2, -10 * t);
const DESKTOP = {
  duration: 0.9,
  easing: DESKTOP_EASING,
  // GSAP's ticker steps Lenis; Lenis must never start a second loop.
  autoRaf: false,
  wheelMultiplier: 0.85,
  smoothWheel: true,
  smoothTouch: false,
  syncTouch: false,
  touchMultiplier: 1,
  gestureOrientation: "vertical",
};

export default function useSmoothScroll() {
  const reducedMotion = usePrefersReducedMotion();
  const [finePointer, setFinePointer] = useState(
    () => window.matchMedia(FINE_POINTER).matches
  );

  // Switching between a trackpad and touch (a tablet with a keyboard, a
  // convertible laptop) must swap the behaviour live, not on reload.
  useEffect(() => {
    const query = window.matchMedia(FINE_POINTER);
    const update = (event) => setFinePointer(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // A phone's address bar collapsing on scroll must not re-measure the pin
    // and shove the page — that is the classic mobile stutter.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Refresh only the callbacks a refresh actually needs — no wasted work
    // when the pin re-measures during a fast scroll or a resize.
    ScrollTrigger.config({ limitCallbacks: true });

    // Phones and tablets are left entirely to the browser: iOS momentum,
    // rubber-banding and finger tracking are already the most natural scroll
    // there is, and synthesising them would only cost frames.
    if (reducedMotion || !finePointer) return undefined;

    const lenis = new Lenis(DESKTOP);

    lenis.on("scroll", ScrollTrigger.update);

    // One shared loop: GSAP's ticker steps Lenis, so a wheel tick can never
    // fall out of phase with the scrubbed timeline. lagSmoothing is off so a
    // dropped frame never injects a time jump on the next one.
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      // Hand the ticker's time handling back exactly as it was found.
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reducedMotion, finePointer]);
}