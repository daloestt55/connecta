import React from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Phone, Settings, LogOut, Hexagon, ShoppingBag, Users, UserCircle, Hash, Shield, Crown } from "lucide-react";

interface SidebarProps {
  className?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ className, activeTab, onTabChange, onLogout, isAdmin = false }: SidebarProps) {
  const navItems = [
    { id: "dashboard", icon: <Hexagon className="w-5 h-5" />, label: "Home" },
    { id: "channels", icon: <Hash className="w-5 h-5" />, label: "Channels" },
    { id: "friends", icon: <Users className="w-5 h-5" />, label: "Friends" },
    { id: "chats", icon: <MessageSquare className="w-5 h-5" />, label: "Chats" },
    { id: "calls", icon: <Phone className="w-5 h-5" />, label: "Calls" },
    { id: "store", icon: <ShoppingBag className="w-5 h-5" />, label: "Store" },
    { id: "subscriptions", icon: <Crown className="w-5 h-5" />, label: "Subscriptions" },
    { id: "profile", icon: <UserCircle className="w-5 h-5" />, label: "Profile" },
  ];

  return (
    <div className={cn("flex flex-col h-full w-[72px] border-r border-white/5 bg-[#0A0A0C] items-center py-6", className)}>
      {/* Brand Icon */}
      <div className="mb-8 text-blue-500">
         <Hexagon className="w-8 h-8 fill-blue-500/20" strokeWidth={1.5} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-4 w-full px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col items-center gap-4 w-full px-2">
        {isAdmin && (
          <>
            <button
              onClick={() => onTabChange("admin")}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                activeTab === "admin" 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                  : "text-gray-500 hover:text-white hover:bg-purple-500/10"
              )}
              title="Admin Panel"
            >
              <Shield className="w-5 h-5" />
            </button>
            <div className="h-px w-8 bg-white/10" />
          </>
        )}
        <button
          onClick={() => onTabChange("settings")}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
            activeTab === "settings" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white hover:bg-white/5"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-px w-8 bg-white/10" />

        <button 
          onClick={onLogout}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
