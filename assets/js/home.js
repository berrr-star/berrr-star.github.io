/* 首页交互：滚动高亮、入场、降级兜底 */
(() => {
  const hero = document.querySelector('.hero');
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const nav = document.querySelector('.site-nav');

  /* ---- 滚动出现 ---- */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          reveal.observe(entry.target);
          reveal.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealItems.forEach((item) => reveal.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-in'));
  }

  /* ---- 三个按钮随滚动高亮 ---- */
  const sections = ['experience', 'skills', 'about']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach((link) => {
      if (link.dataset.nav === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  let ticking = false;
  function updateScrollState() {
    ticking = false;
    if (nav) {
      const pastHero = window.scrollY > (hero ? hero.offsetHeight * 0.55 : 400);
      document.body.classList.toggle('is-past-hero', pastHero);
    }

    const line = window.innerHeight * 0.42;
    let current = null;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) current = section.id;
    });
    if (!current && window.scrollY < 200) current = null;
    if (current) setActive(current);
    else if (window.scrollY < 200) setActive(null);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollState);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  /* ---- 首屏加载失败兜底：3D 没就绪时显示对应尺寸的降级图 ---- */
  window.setTimeout(() => {
    if (!window.__heroReady) {
      document.body.classList.add('no-webgl');
      document.body.classList.add('is-ready');
    }
  }, 4200);

  /* ---- 平滑滚动：给浏览器一点兜底（CSS 已开启） ---- */
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) setActive(target.id);
    });
  });
})();
