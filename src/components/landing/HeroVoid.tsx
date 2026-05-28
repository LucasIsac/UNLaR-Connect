import Link from "next/link";

const words = ["La", "comunidad", "de", "la", "UNLaR,", "conectada", "en", "un", "solo", "lugar."];

export default function HeroVoid() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 z-10"
    >
      {/* Headline - word by word reveal */}
      <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.25] mb-8 overflow-visible py-2">
        {words.map((word, i) => {
          const isUNLaR = word.includes("UNLaR");
          const cleanWord = isUNLaR ? "UNLaR" : word;
          const hasComma = isUNLaR && word.endsWith(",");
          
          return (
            <span
              key={i}
              className={`inline-block mr-[0.25em] opacity-0 translate-y-4 animate-fade-in-up`}
              style={{
                animationDelay: `${100 + i * 80}ms`,
              }}
            >
              {isUNLaR ? (
                <span className="relative inline-flex items-center mx-[0.1em]">
                  {/* Skewed & tilted vector wireframe wrapper */}
                  <span className="absolute -inset-x-2 -inset-y-1 border border-accent/50 bg-accent/[0.02] rounded-sm transform skew-x-[-7deg] rotate-[-1.2deg] select-none pointer-events-none">
                    {/* Figma-style vector corner anchors, skewed together with the border */}
                    <span className="absolute -top-[3.5px] -left-[3.5px] w-[7px] h-[7px] bg-background border border-accent rounded-none" />
                    <span className="absolute -top-[3.5px] -right-[3.5px] w-[7px] h-[7px] bg-background border border-accent rounded-none" />
                    <span className="absolute -bottom-[3.5px] -left-[3.5px] w-[7px] h-[7px] bg-background border border-accent rounded-none" />
                    <span className="absolute -bottom-[3.5px] -right-[3.5px] w-[7px] h-[7px] bg-background border border-accent rounded-none" />
                    
                    {/* Glow backdrop behind text */}
                    <span className="absolute inset-0 bg-accent/8 blur-[14px] -z-10 rounded-sm" />
                  </span>

                  {/* High-legibility straight text */}
                  <span className="relative z-10 px-1 text-accent font-black tracking-tight select-none">
                    {cleanWord}
                  </span>
                  {hasComma && <span className="text-foreground font-black z-10">,</span>}
                </span>
              ) : (
                word
              )}
            </span>
          );
        })}
      </h1>

      {/* Subtitle */}
      <p
        className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-12 opacity-0 translate-y-4 animate-fade-in-up"
        style={{
          animationDelay: "1.0s",
        }}
      >
        Compartí apuntes, sacate dudas en los foros y chateá con tus PDFs usando IA.
        Todo en un solo lugar, hecho para los estudiantes de la UNLaR.
      </p>

      {/* CTA Buttons */}
      <div
        className="flex flex-col sm:flex-row gap-4 items-center opacity-0 translate-y-4 animate-fade-in-up"
        style={{
          animationDelay: "1.2s",
        }}
      >
        <Link
          href="/dashboard"
          className="px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-sm tracking-wide transition-colors hover:bg-accent/90 shadow-lg shadow-accent/10"
        >
          Empezá ahora, es gratis
        </Link>
        <a
          href="#features"
          className="px-8 py-4 rounded-xl border border-border/60 text-muted-foreground font-semibold text-sm hover:text-foreground hover:border-border transition-colors"
        >
          Ver cómo funciona ↓
        </a>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 translate-y-4 animate-fade-in-up"
        style={{
          animationDelay: "1.8s",
        }}
      >
        <div
          className="w-px h-12 bg-gradient-to-b from-transparent via-accent/40 to-transparent animate-scroll-pulse"
        />
      </div>
    </section>
  );
}
