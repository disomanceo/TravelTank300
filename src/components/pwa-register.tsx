"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalDevelopment =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";

    if (isLocalDevelopment) {
      // Development must never use a stale production service worker because
      // cached Next.js router/RSC payloads are incompatible across builds.
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      );
      if ("caches" in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        await registration.update();
      } catch {
        // PWA installation is optional; the web app must remain usable.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return;
    }

    const handleLoad = () => void register();
    window.addEventListener("load", handleLoad, { once: true });
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  return null;
}
