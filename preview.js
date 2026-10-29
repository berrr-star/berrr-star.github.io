(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const wide = window.matchMedia('(min-width: 768px)');

  document.querySelectorAll('.ink-zone').forEach((zone) => {
    if (!finePointer.matches || !wide.matches || reduced.matches) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'ink-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    zone.prepend(canvas);
    const context = canvas.getContext('2d');
    if (!context) return;

    let marks = [];
    let frame = 0;
    let visible = true;
    let disabled = false;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = zone.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      frame = 0;
      if (disabled || !visible) return;
      context.clearRect(0, 0, width, height);
      marks = marks.filter((mark) => mark.life > 0.02);
      for (const mark of marks) {
        const gradient = context.createRadialGradient(mark.x, mark.y, 0, mark.x, mark.y, mark.radius);
        gradient.addColorStop(0, `rgba(28,28,28,${0.085 * mark.life})`);
        gradient.addColorStop(0.42, `rgba(50,50,50,${0.045 * mark.life})`);
        gradient.addColorStop(1, 'rgba(80,80,80,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
        context.fill();
        mark.radius += 0.32;
        mark.life *= 0.965;
      }
      if (marks.length) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };

    const addMark = (event) => {
      if (disabled || event.target.closest('a, button, input, textarea, select')) return;
      const rect = zone.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      marks.push({ x, y, radius: 18 + Math.random() * 22, life: 1 });
      if (marks.length > 80) marks.splice(0, marks.length - 80);
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (visible && marks.length && !frame) {
        frame = requestAnimationFrame(draw);
      }
    });
    observer.observe(zone);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(zone);
    resize();
    zone.addEventListener('pointermove', addMark, { passive: true });

    reduced.addEventListener('change', (event) => {
      disabled = event.matches;
      if (disabled) {
        marks = [];
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        context.clearRect(0, 0, width, height);
        canvas.style.display = 'none';
      } else {
        canvas.style.display = 'block';
      }
    });
  });

  const runner = document.querySelector('.hero-runner-video');
  if (runner) {
    const syncRunnerMotion = () => {
      if (reduced.matches) {
        runner.pause();
        runner.currentTime = 0;
      } else {
        runner.play().catch(() => {});
      }
    };
    syncRunnerMotion();
    runner.addEventListener('loadeddata', syncRunnerMotion);
    reduced.addEventListener('change', syncRunnerMotion);
  }
})();

(() => {
  const finePointer = window.matchMedia('(pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const selector = [
    '.site-nav a',
    '.hero-title',
    '.section-title',
    '.case-title',
    '.detail-title',
    '.prose h2',
    '.fact strong',
    '.case-metric strong',
    '.next-case strong',
  ].join(',');
  const targets = document.querySelectorAll(selector);
  if (!finePointer.matches || reduced.matches || !targets.length) return;

  let lens = null;
  let copy = null;
  let targetRect = null;
  let latestEvent = null;
  let radius = 0;
  let scale = 1;
  let frame = 0;

  const removeLens = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    latestEvent = null;
    if (lens) lens.remove();
    lens = null;
    copy = null;
    targetRect = null;
  };

  const renderLens = () => {
    frame = 0;
    if (!lens || !copy || !targetRect || !latestEvent) return;
    const x = latestEvent.clientX;
    const y = latestEvent.clientY;
    const relativeX = x - targetRect.left;
    const relativeY = y - targetRect.top;
    lens.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0)`;
    copy.style.left = `${radius - relativeX * scale}px`;
    copy.style.top = `${radius - relativeY * scale}px`;
  };

  const moveLens = (event) => {
    if (!lens) {
      createLens(event);
      return;
    }
    latestEvent = event;
    if (!frame) frame = requestAnimationFrame(renderLens);
  };

  const createLens = (event) => {
    removeLens();
    const target = event.currentTarget;
    const source = getComputedStyle(target);
    const isNav = Boolean(target.closest('.site-nav'));
    const diameter = isNav ? 88 : Math.round(Math.max(150, Math.min(210, parseFloat(source.fontSize) * 2.2)));
    radius = diameter / 2;
    scale = isNav ? 1.35 : 1.22;
    targetRect = target.getBoundingClientRect();

    lens = document.createElement('div');
    lens.className = 'magnifier-lens';
    lens.setAttribute('aria-hidden', 'true');
    lens.style.width = `${diameter}px`;
    lens.style.height = `${diameter}px`;

    copy = target.cloneNode(true);
    copy.className = 'lens-copy';
    copy.removeAttribute('id');
    copy.removeAttribute('href');
    copy.setAttribute('aria-hidden', 'true');
    Object.assign(copy.style, {
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
      padding: source.padding,
      boxSizing: 'border-box',
      fontFamily: source.fontFamily,
      fontSize: source.fontSize,
      fontStyle: source.fontStyle,
      fontWeight: source.fontWeight,
      lineHeight: source.lineHeight,
      letterSpacing: source.letterSpacing,
      textAlign: source.textAlign,
      textTransform: source.textTransform,
      whiteSpace: source.whiteSpace,
      transform: `scale(${scale})`,
    });
    lens.append(copy);
    document.body.append(lens);
    moveLens(event);
  };

  targets.forEach((target) => {
    target.addEventListener('pointerenter', createLens);
    target.addEventListener('pointermove', moveLens, { passive: true });
    target.addEventListener('pointerleave', removeLens);
    target.addEventListener('pointercancel', removeLens);
  });
  window.addEventListener('scroll', removeLens, true);
  window.addEventListener('resize', removeLens);
  reduced.addEventListener('change', (event) => {
    if (event.matches) removeLens();
  });
})();
