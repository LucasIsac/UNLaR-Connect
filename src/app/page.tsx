import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 bg-background/40 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-heading font-black text-background text-lg shadow-lg shadow-primary/20">
              UC
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
              UNLaR<span className="text-secondary font-bold">-Connect</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#recursos" className="hover:text-foreground transition-colors">Banco de Apuntes</Link>
            <Link href="#foros" className="hover:text-foreground transition-colors">Foros Académicos</Link>
            <Link href="#tutorias" className="hover:text-foreground transition-colors">Tutorías P2P</Link>
            <Link href="#ia" className="hover:text-foreground transition-colors">Asistente IA</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-sm font-semibold hover:text-foreground transition-colors text-muted-foreground"
            >
              Ingresá
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Registrate
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-16 pb-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-glass text-xs font-semibold text-secondary border border-secondary/20 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          ¡Impulsá tu carrera con Inteligencia Artificial!
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6">
          La comunidad de la <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">UNLaR</span>, conectada en un solo lugar.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10">
          Compartí apuntes, sacate las dudas en los foros por materia y coordiná tutorías P2P con tus compañeros. Todo asistido por un chatbot de IA que entiende tus PDFs al instante.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-20 w-full sm:w-auto">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold hover:opacity-95 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98]"
          >
            Empezá ahora, es gratis
          </Link>
          <Link 
            href="#recursos" 
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-glass text-foreground font-semibold hover:bg-white/5 transition-all border border-border/80"
          >
            Ver cómo funciona
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left" id="features">
          {/* Card 1 */}
          <div className="bg-glass p-8 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm mb-6 group-hover:scale-110 transition-transform">
              RE
            </div>
            <h3 className="font-heading font-extrabold text-xl mb-3">Banco de Recursos</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subí y buscá apuntes de tus materias. Filtramos de manera inteligente para que encuentres lo que necesitás al toque.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-glass p-8 rounded-3xl relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-heading font-bold text-sm mb-6 group-hover:scale-110 transition-transform">
              FO
            </div>
            <h3 className="font-heading font-extrabold text-xl mb-3">Foros y Tutorías P2P</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ¿No entendés un tema? Creá un post en el foro de la materia o coordiná una tutoría directa con un compañero que la tenga clara.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-glass p-8 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm mb-6 group-hover:scale-110 transition-transform">
              IA
            </div>
            <h3 className="font-heading font-extrabold text-xl mb-3">Asistente IA Integrado</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Chateá directamente con tus PDFs subidos. Nuestro sistema de RAG y FreeLLMAPI responde tus dudas en segundos usando los apuntes oficiales.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 px-6 text-center text-xs text-muted-foreground bg-background/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} UNLaR-Connect. Hecho con dedicación para la comunidad de la Universidad Nacional de La Rioja.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
