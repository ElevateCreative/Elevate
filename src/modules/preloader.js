import { gsap } from 'gsap';

/* Luxury intro: the wordmark rises while a metallic bar + counter fill, then lifts away. */
export function runPreloader({ reduced = false } = {}) {
  return new Promise((resolve) => {
    const pre = document.getElementById('preloader');
    if (!pre) {
      resolve();
      return;
    }

    const finish = () => {
      pre.style.display = 'none';
      resolve();
    };

    if (reduced) {
      gsap.set('#preloader-fill', { scaleX: 1 });
      gsap.to(pre, { autoAlpha: 0, duration: 0.4, onComplete: finish });
      return;
    }

    const words = pre.querySelectorAll('.preloader__wordmark span');
    const fill = document.getElementById('preloader-fill');
    const count = document.getElementById('preloader-count');
    const counter = { v: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        // resolve now so the hero intro starts, then let the curtain fade over it
        resolve();
        gsap.to(pre, {
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            pre.style.display = 'none';
          },
        });
      },
    });

    tl.to(words, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.1)
      .to(fill, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0.1)
      .to(
        counter,
        {
          v: 100,
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            count.textContent = Math.round(counter.v);
          },
        },
        0.1
      )
      .to({}, { duration: 0.25 });
  });
}
