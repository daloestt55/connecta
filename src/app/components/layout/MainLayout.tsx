import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  rightPanelContext?: "call" | "chat" | "idle";
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

export function MainLayout({ children, rightPanelContext = "idle", activeTab, onTabChange, onLogout, isAdmin = false }: MainLayoutProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("dashboard");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const currentTab = activeTab || internalActiveTab;
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0A0A0C] text-white overflow-hidden font-sans select-none">
      {/* Sidebar (Fixed Width Icon Only) */}
      <div className="flex-shrink-0 z-50">
        <Sidebar 
          activeTab={currentTab} 
          onTabChange={handleTabChange}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-[#0A0A0C]">
        <div className="flex-1 overflow-hidden relative">
           {children}
        </div>
      </main>

      {/* Right Panel (Optional) */}
      <div className={cn(
        "hidden lg:block transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] border-l border-white/5 bg-[#0e0e11]",
        rightPanelOpen ? "w-[300px]" : "w-0 overflow-hidden"
      )}>
        <RightPanel 
          isOpen={true} 
          onToggle={() => setRightPanelOpen(!rightPanelOpen)} 
          context={rightPanelContext}
        />
      </div>
      
      {/* Toggle button when panel is closed - Subtle and minimal */}
      {!rightPanelOpen && rightPanelContext !== "idle" && (
        <button 
          onClick={() => setRightPanelOpen(true)}
          className="absolute right-4 top-4 p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-40"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
