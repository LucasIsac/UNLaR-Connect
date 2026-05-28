"use client";

import { useEffect, useState } from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export default function Logo({ className, alt = "UNLaR-Connect", ...props }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState("/logo.svg");

  useEffect(() => {
    // Read initial logo
    const savedLogo = localStorage.getItem("selected-logo");
    if (savedLogo) {
      setLogoSrc(savedLogo);
    }

    // Set up a listener for custom event to change logo on the fly
    const handleLogoChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setLogoSrc(customEvent.detail);
    };

    window.addEventListener("logo-changed", handleLogoChange);
    return () => {
      window.removeEventListener("logo-changed", handleLogoChange);
    };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
}
