/* ============================================================
   1500 米之后 · 子页面少量交互
   1) 滚动出现（IntersectionObserver；无 JS / 减弱动效时内容照常显示）
   2) 桌面指针倾斜（只作用于 [data-tilt] 卡片）
   ============================================================ */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 滚动出现 ---------- */
  const riseItems = Array.from(document.querySelectorAll("[data-rise]"));

  if (riseItems.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      document.documentElement.classList.add("has-js");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      riseItems.forEach((item) => observer.observe(item));
    } else {
      riseItems.forEach((item) => item.classList.add("is-in"));
    }
  }

  /* ---------- 指针倾斜 ---------- */
  const tiltItems = Array.from(document.querySelectorAll("[data-tilt]"));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (tiltItems.length && canHover && !reduceMotion) {
    const MAX_X = 5;
    const MAX_Y = 6;

    tiltItems.forEach((card) => {
      let frame = 0;

      const paint = (rx, ry) => {
        card.style.setProperty("--rx", rx.toFixed(2) + "deg");
        card.style.setProperty("--ry", ry.toFixed(2) + "deg");
      };

      const onMove = (event) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          paint(-py * MAX_X, px * MAX_Y);
        });
      };

      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.classList.remove("is-tilting");
        paint(0, 0);
      };

      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") card.classList.add("is-tilting");
      });
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "mouse") onMove(event);
      });
      card.addEventListener("pointerleave", reset);
      card.addEventListener("pointercancel", reset);
    });
  }
})();
