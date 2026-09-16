import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** No motion for reduced-motion users or for pages opened in a hidden tab (animation frames do not run there). */
export const shouldAnimate = () => !prefersReducedMotion() && typeof document !== 'undefined' && document.visibilityState === 'visible';

/** Study content must never stay invisible: if the animation ticker stalls, reset the styles after `ms`. Returns a cleanup. */
export function failSafe(targets, ms = 1500) {
  const timer = setTimeout(() => gsap.set(targets, { clearProps: 'opacity,visibility,transform' }), ms);
  return () => clearTimeout(timer);
}

/** Scroll-triggered reveal for marketing sections (never used on questions/solutions while studying). */
export function useReveal(scopeRef, { selector = '[data-reveal]', y = 20, stagger = 0.07, dependencies = [] } = {}) {
  useGSAP(
    () => {
      if (!shouldAnimate() || !scopeRef.current) return undefined;
      // Only below-the-fold elements are hidden, so what the student sees first is never delayed.
      const fold = window.innerHeight * 0.92;
      const elements = gsap.utils.toArray(selector, scopeRef.current).filter((el) => el.getBoundingClientRect().top > fold);
      if (!elements.length) return undefined;
      gsap.set(elements, { autoAlpha: 0, y });
      ScrollTrigger.batch(elements, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger, overwrite: true, clearProps: 'opacity,visibility,transform' }),
      });
      return undefined;
    },
    { scope: scopeRef, dependencies, revertOnUpdate: true },
  );
}

/** Short entrance timeline for a page header / hero block. */
export function useEntrance(scopeRef, dependencies = []) {
  useGSAP(
    () => {
      if (!shouldAnimate() || !scopeRef.current) return undefined;
      const items = gsap.utils.toArray('[data-enter]', scopeRef.current);
      if (!items.length) return undefined;
      gsap.fromTo(items, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,visibility,transform' });
      return failSafe(items, 1500);
    },
    { scope: scopeRef, dependencies },
  );
}

export { gsap, ScrollTrigger, useGSAP };
