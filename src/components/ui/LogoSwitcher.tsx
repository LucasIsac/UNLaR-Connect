"use client";

import { useEffect, useState } from "react";
import { Palette, Check, RotateCcw, Copy, Code2 } from "lucide-react";

interface LogoOption {
  name: string;
  path: string;
}

export default function LogoSwitcher() {
  const [selectedLogo, setSelectedLogo] = useState("/logo.svg");
  const [mounted, setMounted] = useState(false);
  const [copiedLogo, setCopiedLogo] = useState<string | null>(null);
  const [customSvgText, setCustomSvgText] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState(false);

  // Logo options ordered alphabetically by developer name
  const logoOptions: LogoOption[] = [
    { name: "Emiliano (Original)", path: "/emiliano.svg" },
    { name: "Emiliano (V2)", path: "/emiliano_variant2.svg" },
    { name: "Jorge (Original)", path: "/jorge.svg" },
    { name: "Jorge (V2)", path: "/jorge_variant2.svg" },
    { name: "Leo", path: "/leo.svg" },
    { name: "Lucas (Original)", path: "/lucas.svg" },
    { name: "Lucas (V2)", path: "/lucas_variant2.svg" },
  ];

  useEffect(() => {
    setMounted(true);
    const savedLogo = localStorage.getItem("selected-logo");
    if (savedLogo) {
      setSelectedLogo(savedLogo);
      // If it's a custom SVG, populate the textarea so they can edit it
      if (savedLogo.startsWith("data:image/svg+xml")) {
        try {
          const decoded = decodeURIComponent(savedLogo.replace(/^data:image\/svg\+xml;utf8,/, ""));
          setCustomSvgText(decoded);
        } catch {
          // If base64 or failed decode
          try {
            const base64Content = savedLogo.replace(/^data:image\/svg\+xml;base64,/, "");
            setCustomSvgText(atob(base64Content));
          } catch (e) {}
        }
      }
    }
  }, []);

  const changeLogo = (path: string) => {
    setSelectedLogo(path);
    localStorage.setItem("selected-logo", path);
    window.dispatchEvent(new CustomEvent("logo-changed", { detail: path }));
  };

  const handleReset = () => {
    setSelectedLogo("/logo.svg");
    localStorage.removeItem("selected-logo");
    setCustomSvgText("");
    setCustomSuccess(false);
    setCustomError(null);
    window.dispatchEvent(new CustomEvent("logo-changed", { detail: "/logo.svg" }));
  };

  const handleCopy = async (path: string, name: string) => {
    try {
      let svgText = "";
      if (path.startsWith("data:image/svg+xml")) {
        // Retrieve custom SVG content
        try {
          svgText = decodeURIComponent(path.replace(/^data:image\/svg\+xml;utf8,/, ""));
        } catch {
          const base64Content = path.replace(/^data:image\/svg\+xml;base64,/, "");
          svgText = atob(base64Content);
        }
      } else {
        // Fetch static SVG file from public directory
        const response = await fetch(path);
        if (!response.ok) throw new Error();
        svgText = await response.text();
      }

      await navigator.clipboard.writeText(svgText);
      setCopiedLogo(path);
      setTimeout(() => setCopiedLogo(null), 2000);
    } catch (err) {
      console.error("No se pudo copiar el SVG", err);
    }
  };

  const handleApplyCustomSvg = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    setCustomSuccess(false);

    const trimmed = customSvgText.trim();
    if (!trimmed) {
      setCustomError("Pegá algún código SVG válido, che.");
      return;
    }

    if (!trimmed.toLowerCase().includes("<svg") || !trimmed.toLowerCase().includes("</svg>")) {
      setCustomError("El código no parece ser un SVG válido.");
      return;
    }

    try {
      // Encode custom SVG as a Data URL
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
      setSelectedLogo(dataUrl);
      localStorage.setItem("selected-logo", dataUrl);
      window.dispatchEvent(new CustomEvent("logo-changed", { detail: dataUrl }));
      setCustomSuccess(true);
      setTimeout(() => setCustomSuccess(false), 3000);
    } catch (err) {
      setCustomError("Error al procesar el SVG.");
    }
  };

  const isCustomActive = selectedLogo.startsWith("data:image/svg+xml");

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 group pointer-events-auto">
      {/* Floating Panel wrapper that acts as the mouse bridge */}
      <div className="absolute bottom-full right-0 pb-4 w-72 scale-95 opacity-0 pointer-events-none translate-y-2 group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-300 origin-bottom-right">
        {/* Styled panel container */}
        <div className="relative bg-background/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-border/40 dark:border-zinc-800/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Glow decoration */}
          <div className="absolute -inset-px bg-gradient-to-r from-accent/20 to-amber-500/20 rounded-2xl -z-10 blur-xl opacity-50 pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col gap-1">
            <h4 className="font-heading font-black text-xs text-foreground tracking-wide flex items-center gap-1.5 uppercase">
              <Palette className="w-3.5 h-3.5 text-accent" />
              ¡Votá el nuevo Logo!
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium leading-normal">
              Probá propuestas en toda la web o copia su código SVG al portapapeles:
            </p>
          </div>

          {/* Options List */}
          <div className="flex flex-col gap-1.5">
            {/* Standard Options */}
            {logoOptions.map((opt) => {
              const isSelected = selectedLogo === opt.path;
              return (
                <div key={opt.name} className="flex items-center gap-1.5 w-full">
                  <button
                    onClick={() => changeLogo(opt.path)}
                    className={`flex-grow flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all duration-200 ${
                      isSelected
                        ? "bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                        : "bg-card/30 border-border/30 hover:bg-card/60 hover:border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={opt.path}
                        alt={`Logo de ${opt.name}`}
                        className="w-5 h-5 object-contain"
                      />
                      <span className="truncate max-w-[130px]">{opt.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 animate-scale-up" />}
                  </button>

                  <button
                    onClick={() => handleCopy(opt.path, opt.name)}
                    title="Copiar código SVG"
                    className={`p-2 border rounded-xl transition-all duration-200 shrink-0 ${
                      copiedLogo === opt.path
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : "bg-card/30 border-border/30 hover:bg-card/60 hover:border-accent/40 text-muted-foreground hover:text-accent"
                    }`}
                  >
                    {copiedLogo === opt.path ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Custom SVG Active Row */}
            {isCustomActive && (
              <div className="flex items-center gap-1.5 w-full">
                <button
                  className="flex-grow flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold border bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                  disabled
                >
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedLogo}
                      alt="Logo Custom"
                      className="w-5 h-5 object-contain"
                    />
                    <span className="truncate max-w-[130px]">Logo Personalizado</span>
                  </div>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                </button>

                <button
                  onClick={() => handleCopy(selectedLogo, "Logo Custom")}
                  title="Copiar código SVG Custom"
                  className={`p-2 border rounded-xl transition-all duration-200 shrink-0 ${
                    copiedLogo === selectedLogo
                      ? "bg-green-500/10 border-green-500/30 text-green-500"
                      : "bg-card/30 border-border/30 hover:bg-card/60 hover:border-accent/40 text-muted-foreground hover:text-accent"
                  }`}
                >
                  {copiedLogo === selectedLogo ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-border/20 my-1" />

          {/* Custom SVG Paste Form */}
          <form onSubmit={handleApplyCustomSvg} className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-foreground flex items-center gap-1.5 uppercase">
              <Code2 className="w-3.5 h-3.5 text-accent" />
              Pegar SVG Personalizado
            </label>
            <textarea
              value={customSvgText}
              onChange={(e) => setCustomSvgText(e.target.value)}
              placeholder="<svg ...> ... </svg>"
              rows={3}
              className="w-full text-[10px] font-mono bg-card/40 focus:bg-card/60 border border-border/40 focus:border-accent rounded-xl p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/40 resize-none transition-colors"
            />
            {customError && (
              <p className="text-[9px] font-semibold text-destructive">{customError}</p>
            )}
            {customSuccess && (
              <p className="text-[9px] font-semibold text-green-500">¡Logo personalizado aplicado con éxito!</p>
            )}
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-bold py-2 rounded-xl transition-colors shadow-md shadow-accent/5 flex items-center justify-center gap-1"
            >
              Aplicar Custom Logo
            </button>
          </form>

          {/* Reset button */}
          {selectedLogo !== "/logo.svg" && (
            <button
              onClick={handleReset}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors border border-dashed border-border/40 hover:border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer al Original
            </button>
          )}
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 dark:border-white/5 relative">
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
        </span>
        <Palette className="w-5 h-5 animate-pulse-slow" />
      </button>
    </div>
  );
}
