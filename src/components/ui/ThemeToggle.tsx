"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    // Fallback if browser does not support View Transitions API
    if (!(document as any).startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // Get click coordinates, fall back to center of button/window if triggered by keyboard
    const x = event.clientX || window.innerWidth / 2;
    const y = event.clientY || window.innerHeight / 2;

    // Calculate maximum radius to fully cover the screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Start transition
    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
    });

    // Run custom clip-path circle expansion on the new snapshot
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500, // Smooth expansion duration (500ms)
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 rounded-xl border border-border/40 hover:border-border bg-card/40 backdrop-blur-md text-foreground/80 hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      aria-label="Cambiar tema de color"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon */}
        <Sun
          className={`w-5 h-5 transform transition-transform duration-300 ${
            theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute w-5 h-5 transform transition-transform duration-300 ${
            theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}

