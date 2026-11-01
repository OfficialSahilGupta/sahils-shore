"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-text">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <TopBar />

        {/* Page Content with Framer Motion Transition */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-8 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Mobile Bottom Navigation & Floating Quick Add */}
        <MobileNav />
      </div>
    </div>
  );
}
