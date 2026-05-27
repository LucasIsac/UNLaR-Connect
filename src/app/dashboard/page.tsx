import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  BookOpen, 
  ChevronRight, 
  History, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Zap, 
  Users,
  MessageSquare,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Mock student stats
  const studentName = "Alejandro";
  const karmaLevel = 12;
  const currentXP = 2450;
  const nextLevelXP = 3000;
  const xpPercentage = (currentXP / nextLevelXP) * 100;

  // Mock suggested materias (Argentine subject naming)
  const materiasSugeridas = [
    {
      id: 1,
      materia: "Análisis Matemático II",
      año: "2do Año",
      detalles: "Prof. Martinez • 12 recursos nuevos",
      tagColor: "text-secondary bg-secondary/10 border-secondary/20",
    },
    {
      id: 2,
      materia: "Programación II",
      año: "2do Año",
      detalles: "Prof. Gomez • Práctica pendiente",
      tagColor: "text-accent bg-accent/10 border-accent/20",
    },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "upload",
      description: "Maria F. subió apuntes de Derivadas Parciales",
      time: "Hace 2 horas",
      subject: "Análisis Matemático II",
      icon: FileText,
      iconColor: "text-accent bg-accent/10",
    },
    {
      id: 2,
      type: "forum",
      description: "Nueva discusión en Estructuras de Datos",
      time: "Hace 5 horas",
      subject: "Programación II",
      icon: MessageSquare,
      iconColor: "text-secondary bg-secondary/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Welcome Hero Section */}
        <section className="relative">
          <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tight mb-2">
            ¡Qué bueno verte de nuevo, <span className="text-accent">{studentName}</span>!
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            ¿Listo para seguir metiéndole? Tenés{" "}
            <span className="text-accent font-bold">3 debates nuevos</span> en Programación II y{" "}
            <span className="text-secondary font-bold">1 entrega pendiente</span>.
          </p>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Level & Karma Progress Card - SPECIAL CARD using a premium gradient */}
          <div className="bg-special-gradient rounded-3xl p-6 lg:col-span-5 flex flex-col relative overflow-hidden shadow-sm">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent animate-pulse-slow" />
                <span>Tu Nivel de Karma</span>
              </h3>
            </div>

            <div className="flex-1 flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-heading text-4xl font-extrabold text-accent">
                  Nivel {karmaLevel}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {currentXP} / {nextLevelXP} XP
                </span>
              </div>

              {/* dopamine-inducing animated progress bar wrapper */}
              <div className="w-full bg-card/65 dark:bg-card/40 h-3 rounded-full overflow-hidden border border-border/20 mb-6">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.35)]" 
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>

              {/* Badges Earned Section */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Insignias Recientes
                </p>
                <div className="flex gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:border-accent transition-colors duration-200" 
                    title="Colaborador Destacado"
                  >
                    <MessageSquare className="w-4 h-4 text-secondary" />
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:border-accent transition-colors duration-200" 
                    title="Mente Brillante"
                  >
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:border-accent transition-colors duration-200" 
                    title="Compañero Fiel"
                  >
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sugeridas & Actividad (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Suggested Subjects Box (Glassmorphic) */}
            <div className="bg-glass rounded-3xl p-6 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  <span>Materias Sugeridas</span>
                </h3>
                <Link 
                  href="/dashboard/materias" 
                  className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 group"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materiasSugeridas.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-card/40 border border-border/40 rounded-2xl p-4 hover:border-accent/40 transition-all duration-300 cursor-pointer group hover-glow-subtle"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${item.tagColor}`}>
                        {item.año}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">
                      {item.materia}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {item.detalles}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Box (Glassmorphic) */}
            <div className="bg-glass rounded-3xl p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-secondary" />
                <span>Actividad Reciente</span>
              </h3>

              <div className="space-y-4">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div 
                      key={act.id} 
                      className="flex gap-4 items-start pb-4 border-b border-border/20 last:border-0 last:pb-0"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${act.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate leading-tight">
                          {act.description}
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] text-muted-foreground/75 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {act.time}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-[10px] text-muted-foreground/75 font-semibold">
                            {act.subject}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
