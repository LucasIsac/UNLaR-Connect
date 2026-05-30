import Image from "next/image";

interface LogoProps {
  className?: string;
  alt?: string;
}

export default function Logo({ className, alt = "UNLaR-Connect" }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={36}
      height={36}
      className={className}
    />
  );
}

