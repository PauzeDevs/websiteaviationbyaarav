/* Aviation by Aarav — ThreeUI Temple Night full-page background.
 * Uses the MIT-licensed Community Temple Night renderer from Meng To / ThreeUI.
 * Lazy-started, visibility-aware, responsive and self-disposing.
 */
(() => {
  "use strict";
  const canvas = document.querySelector("#ambient-three-canvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let renderer = null;
  let loading = false;
  let disposed = false;
  let visible = !("IntersectionObserver" in window);
  let frame = 0;
  let lastFrameAt = 0;
  const frameInterval = finePointer ? 1000 / 60 : 1000 / 30;

  canvas.dataset.state = "loading";

  const cancelFrame = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const schedule = () => {
    if (!disposed && renderer && visible && !document.hidden && !renderer.reducedMotion && !frame) {
      frame = requestAnimationFrame(draw);
    }
  };

  const draw = (time) => {
    frame = 0;
    if (disposed || !renderer || !visible || document.hidden) return;
    if (lastFrameAt && time - lastFrameAt < frameInterval) {
      schedule();
      return;
    }
    lastFrameAt = time;
    renderer.render(time);
    schedule();
  };

  const resize = () => {
    if (!renderer) return;
    try {
      renderer.resize();
      schedule();
    } catch (error) {
      console.warn("Temple Night resize failed.", error);
    }
  };

  const pointerMove = (event) => {
    if (!renderer || !finePointer) return;
    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
    const y = 1 - ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2;
    renderer.setPointer(x, y, true);
    schedule();
  };

  const clearPointer = () => {
    renderer?.setPointer(0, 0, false);
    schedule();
  };

  const visibilityChange = () => {
    if (document.hidden) cancelFrame();
    else {
      lastFrameAt = 0;
      resize();
      schedule();
    }
  };

  const start = async () => {
    if (loading || renderer || disposed || document.hidden || !visible) return;
    loading = true;
    canvas.dataset.state = "loading";
    try {
      const module = await import("./templeNightRenderer.js");
      if (disposed || document.hidden || !visible) return;
      renderer = module.createTempleNightRenderer(canvas);
      if (!renderer) throw new Error("WebGL renderer could not be created.");

      canvas.dataset.state = "ready";
      window.addEventListener("resize", resize, { passive: true });
      window.addEventListener("orientationchange", resize, { passive: true });
      window.addEventListener("pointermove", pointerMove, { passive: true });
      window.addEventListener("pointerout", (event) => {
        if (!event.relatedTarget) clearPointer();
      }, { passive: true });
      window.addEventListener("blur", clearPointer);
      document.addEventListener("visibilitychange", visibilityChange);
      if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(resize);
        observer.observe(document.documentElement);
        window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
      }
      resize();
      if (!renderer.reducedMotion) schedule();
    } catch (error) {
      console.error("Aviation by Aarav Temple Night background could not initialise.", error);
      canvas.dataset.state = "fallback";
      canvas.style.background = "#070d12";
    } finally {
      loading = false;
    }
  };

  let visibilityObserver = null;
  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) cancelFrame();
      else start();
    }, { rootMargin: "120px", threshold: 0.001 });
    visibilityObserver.observe(canvas);
  } else {
    start();
  }

  if (!document.hidden && visible) start();

  window.addEventListener("pagehide", (event) => {
    cancelFrame();
    if (event.persisted) return;
    disposed = true;
    visibilityObserver?.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("orientationchange", resize);
    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("blur", clearPointer);
    document.removeEventListener("visibilitychange", visibilityChange);
    renderer?.dispose();
    renderer = null;
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    visible = true;
    visibilityChange();
    start();
  });
})();
