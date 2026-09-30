// Two photographs, one moving reveal. The browser animates between sparse targets;
// there is no requestAnimationFrame loop or rendering work outside the viewport.
export function initHeroScanner(root) {
  const reveal = root?.querySelector('.hero-scan-reveal');
  const guide = root?.querySelector('.hero-scan-guide');
  if (!reveal || !guide || typeof reveal.animate !== 'function') return {setPaused() {}};

  let ready = false;
  let paused = true;
  let visible = !('IntersectionObserver' in window);
  let animations = [];
  let current = {left: 10, width: 22};
  const canRun = () => ready && visible && !paused && !document.hidden;
  const clip = ({left, width}) => `inset(0 ${100 - left - width}% 0 ${left}%)`;

  function nextPosition() {
    const width = 19 + Math.random() * 9;
    const previousCentre = current.left + current.width / 2;
    let left = 0;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      left = Math.random() * (100 - width);
      if (Math.abs(left + width / 2 - previousCentre) >= 24) return {left, width};
    }
    return {left: previousCentre < 50 ? 100 - width : 0, width};
  }

  function move() {
    if (!canRun()) return;
    root.classList.add('is-scan-ready');
    const next = nextPosition();
    const options = {
      duration: 3600 + Math.random() * 600,
      easing: 'cubic-bezier(.45, 0, .25, 1)',
      fill: 'both',
    };
    animations = [
      reveal.animate([{clipPath: clip(current)}, {clipPath: clip(next)}], options),
      guide.animate([
        {left: `${current.left}%`, width: `${current.width}%`},
        {left: `${next.left}%`, width: `${next.width}%`},
      ], options),
    ];
    animations[0].onfinish = () => {
      // Commit the target before discarding finished animations, so random legs
      // join without a jump and the animation list cannot grow over time.
      current = next;
      reveal.style.clipPath = clip(current);
      guide.style.left = `${current.left}%`;
      guide.style.width = `${current.width}%`;
      for (const animation of animations) animation.cancel();
      animations = [];
      move();
    };
  }

  function sync() {
    if (canRun()) {
      if (animations.length) animations.forEach(animation => animation.play());
      else move();
    } else {
      animations.forEach(animation => animation.pause());
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, {threshold: 0});
    observer.observe(root);
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => animations.forEach(animation => animation.pause()));
  window.addEventListener('pageshow', sync);

  const images = [...root.querySelectorAll('img')];
  Promise.all(images.map(image => image.decode())).then(() => {
    ready = true;
    sync();
  }).catch(() => {
    // The base picture remains readable if the optional second image fails.
    root.classList.remove('is-scan-ready');
  });

  return {
    setPaused(value) {
      paused = Boolean(value);
      sync();
    },
  };
}
