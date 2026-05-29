"use client";

import { useEffect } from "react";

let hasHandledServiceWorker = false;

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (hasHandledServiceWorker) return;
    if (!("serviceWorker" in navigator)) return;
    hasHandledServiceWorker = true;

    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalDev) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          return Promise.all(registrations.map((registration) => registration.unregister()));
        })
        .catch((error: unknown) => {
          console.log("SW unregister failed:", error);
        });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error: unknown) => {
          console.log("SW registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
