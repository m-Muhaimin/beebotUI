import { useState } from "react";
import { Search, Home, Compass, Library, Clock, MoreHorizontal, LogOut, MoreVertical, Settings, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
    <aside className="w-60 sm:w-64 lg:w-72 xl:w-80 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Logo Section - Responsive */}
      <div className="p-4 sm:p-6 border-b border-slate-200 pl-[16px] pr-[16px] sm:pl-[24px] sm:pr-[24px] pt-[10px] pb-[10px]">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 brand-gradient rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-semibold text-slate-800" data-testid="text-logo">BeeBot</span>
        </div>
      </div>
      {/* Navigation - Responsive */}
      <nav className="flex-1 p-3 sm:p-4 pt-[12px] sm:pt-[15px] pb-[12px] sm:pb-[15px]">
        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 sm:h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-8 sm:pl-10 text-xs sm:text-sm border-slate-200 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <ul className="space-y-1 mt-[-11px] mb-[-11px]">
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
          <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-blue-600">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="truncate font-semibold text-[12px] text-[#374661] pt-[0px] pb-[0px] mt-[0px] mb-[0px]">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
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
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
