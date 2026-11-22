import { useEffect, useState } from 'react';

/**
 * The public landing pages (beranda, e-library) use the old Bootstrap theme.
 * Loading it globally leaked Bootstrap styles into the app, so these sheets
 * are only attached while a landing page is mounted. They are inserted at the
 * top of <head> so antd styles keep the same precedence as before.
 */
const LANDING_STYLESHEETS = [
  '/css/bootstrap.css',
  '/fonts/font-awesome/css/font-awesome.css',
  '/css/style.css',
  '/css/nivo-lightbox/nivo-lightbox.css',
  '/css/nivo-lightbox/default.css',
  'https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700|Lato:400,700|Raleway:300,400,500,600,700,800,900&display=swap'
];

const ATTRIBUTE = 'data-landing-style';
let mountedPages = 0;

export default function useLandingStyles() {
  const [ready, setReady] = useState(
    () => document.querySelectorAll(`link[${ATTRIBUTE}]`).length === LANDING_STYLESHEETS.length
  );

  useEffect(() => {
    mountedPages += 1;
    const head = document.head;
    const existing = Array.from(document.querySelectorAll<HTMLLinkElement>(`link[${ATTRIBUTE}]`));

    if (existing.length === LANDING_STYLESHEETS.length) {
      setReady(true);
    } else {
      let pending = LANDING_STYLESHEETS.length;
      const done = () => {
        pending -= 1;
        if (pending <= 0) setReady(true);
      };
      // Insert in reverse so the final order matches LANDING_STYLESHEETS.
      [...LANDING_STYLESHEETS].reverse().forEach((href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute(ATTRIBUTE, 'true');
        link.onload = done;
        link.onerror = done; // never block the page on a missing sheet
        head.insertBefore(link, head.firstChild);
      });
      // Safety net if load events never fire.
      window.setTimeout(() => setReady(true), 3000);
    }

    return () => {
      mountedPages -= 1;
      // Leaving the landing pages: remove the sheets so the app stays clean.
      window.setTimeout(() => {
        if (mountedPages === 0) {
          document.querySelectorAll(`link[${ATTRIBUTE}]`).forEach((link) => link.remove());
        }
      }, 0);
    };
  }, []);

  return ready;
}
