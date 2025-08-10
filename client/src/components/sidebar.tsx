import { useState } from "react";
import { Search, Home, Compass, Library, Clock, MoreHorizontal, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ConversationHistory from "./conversation-history";

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export default function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "explore", label: "Explore", icon: Compass, path: "/explore" },
    { id: "library", label: "Library", icon: Library, path: "/library" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    onNavChange(item.id);
    if (item.id === "home") {
      setLocation("/");
    }
    // Other navigation items can be implemented later
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200 pl-[24px] pr-[24px] pt-[10px] pb-[10px]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-800" data-testid="text-logo">BeeBot</span>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4 pt-[15px] pb-[15px]">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 text-sm border-slate-200 focus:ring-2 focus:ring-brand-blue focus:border-transparent pt-[0px] pb-[0px] mt-[5px] mb-[5px]"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item)}
                  className="flex items-center space-x-3 px-3 py-2 font-medium rounded-lg transition-colors duration-150 w-full text-left pt-[9px] pb-[9px] bg-[#edf1f77a] text-[#424242] text-[14px]"
                  data-testid={`button-nav-${item.id}`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-normal ml-[7px] mr-[7px]">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <ConversationHistory />
      </nav>
      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-200 pt-[8px] pb-[8px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 truncate text-[13px] font-semibold">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await logoutMutation.mutateAsync();
                toast({
                  title: "Logged out",
                  description: "You have been logged out successfully.",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to log out. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            disabled={logoutMutation.isPending}
            className="text-slate-500 hover:text-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
