import { ImgHTMLAttributes } from "react";

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export default function Logo({ className, alt = "UNLaR-Connect", ...props }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={alt}
      className={className}
      {...props}
    />
  );
}

