import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-10 animate-pulse" aria-label="Cargando contenido">
        <div className="space-y-3">
          <div className="h-10 bg-card/45 rounded-2xl w-3/4 md:w-1/2" />
          <div className="h-5 bg-card/45 rounded-2xl w-2/3 md:w-1/3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-52 bg-glass rounded-3xl border border-accent/5" />
          <div className="h-52 bg-glass rounded-3xl border border-accent/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-8 bg-card/45 rounded-2xl w-1/3" />
            <div className="h-44 bg-glass rounded-3xl border border-accent/5" />
            <div className="h-44 bg-glass rounded-3xl border border-accent/5" />
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-card/45 rounded-2xl w-1/3" />
            <div className="h-24 bg-glass rounded-3xl border border-accent/5" />
            <div className="h-24 bg-glass rounded-3xl border border-accent/5" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
