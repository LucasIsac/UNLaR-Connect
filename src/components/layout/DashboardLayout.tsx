"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { CombinedHeaderData } from "@/actions/perfil";

export default function DashboardLayout({
  children,
  initialHeaderData,
  searchQuery,
  onSearchChange,
  activeScope,
  onScopeChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  searchPlaceholder,
  showSearch = true,
}: {
  children: React.ReactNode;
  initialHeaderData?: CombinedHeaderData;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  activeScope?: "foro" | "apuntes" | "materias" | "todos";
  onScopeChange?: (scope: "foro" | "apuntes" | "materias" | "todos") => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div suppressHydrationWarning className="relative min-h-screen bg-background text-foreground transition-colors duration-300 flex overflow-hidden">
      {/* Header toolbar */}
      <Header 
        onMenuToggle={() => setIsSidebarOpen(true)} 
        initialData={initialHeaderData}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeScope={activeScope}
        onScopeChange={onScopeChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        searchPlaceholder={searchPlaceholder}
        showSearch={showSearch}
      />

      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Page Content Wrapper - Offset by top header height */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 h-screen overflow-hidden">
        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:py-8 md:px-12 lg:px-20 xl:px-32 2xl:px-48 max-w-[1920px] mx-auto w-full relative">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
