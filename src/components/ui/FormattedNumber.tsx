"use client";

import { useState, useEffect } from "react";

interface FormattedNumberProps {
  value: number;
  className?: string;
}

export default function FormattedNumber({ value, className }: FormattedNumberProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and first render, show unformatted number
  // After hydration, show formatted number
  return (
    <span className={className}>
      {mounted ? value.toLocaleString("es-AR") : value.toString()}
    </span>
  );
}
