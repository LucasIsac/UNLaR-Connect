"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { CombinedHeaderData } from "@/actions/perfil";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

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

      {/* Main Page Content Wrapper - Offset by top header height and collapsed sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pl-20 h-screen overflow-hidden">
        {/* Scrollable page content with generous left padding to clear the expanded sidebar */}
        <main className={cn(
          "flex-1 overflow-y-auto custom-scrollbar pl-6 pr-6 md:pl-52 md:pr-20 lg:pl-56 lg:pr-24 xl:pl-64 xl:pr-32 2xl:pl-72 2xl:pr-40 max-w-[1920px] mx-auto w-full relative",
          pathname === "/chat" ? "pt-6 pb-2 md:pt-8 md:pb-2" : "p-6 md:py-8"
        )}>
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
