"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Page Content Wrapper - Offset by top header height */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 h-screen overflow-hidden">
        {/* Header toolbar */}
        <Header onMenuToggle={() => setIsSidebarOpen(true)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:py-8 md:px-80 relative">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
