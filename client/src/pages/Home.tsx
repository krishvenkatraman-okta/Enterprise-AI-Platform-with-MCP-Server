import { useState, useEffect } from "react";
import { authService, type AuthState } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TokenSidebar from "@/components/TokenSidebar";
import InventoryApp from "./inventory/InventoryApp";
import JarvisApp from "./jarvis/JarvisApp";
import { Boxes, Bot, Key, User } from "lucide-react";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [currentApp, setCurrentApp] = useState<'inventory' | 'jarvis'>('inventory');
  const [isTokenSidebarOpen, setIsTokenSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  const getUserInitials = () => {
    if (!authState.user) return "U";
    return `${authState.user.firstName[0]}${authState.user.lastName[0]}`;
  };

  const tabClasses = (app: 'inventory' | 'jarvis', isActive: boolean) => {
    const baseClasses = "px-3 py-2 text-sm font-medium border-b-2 transition-colors";
    if (isActive) {
      return `${baseClasses} text-blue-600 border-blue-600`;
    }
    return `${baseClasses} text-gray-500 hover:text-gray-700 border-transparent`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900" data-testid="text-app-title">
                  Enterprise AI Platform
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <button 
                    onClick={() => setCurrentApp('inventory')}
                    className={tabClasses('inventory', currentApp === 'inventory')}
                    data-testid="button-tab-inventory"
                  >
                    <Boxes className="w-4 h-4 inline-block mr-2" />
                    Atlas Beverages Inventory
                  </button>
                  <button 
                    onClick={() => setCurrentApp('jarvis')}
                    className={tabClasses('jarvis', currentApp === 'jarvis')}
                    data-testid="button-tab-jarvis"
                  >
                    <Bot className="w-4 h-4 inline-block mr-2" />
                    Jarvis AI Assistant
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTokenSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-tokens"
              >
                <Key className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tokens</span>
              </Button>
              {authState.user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium" data-testid="text-user-initials">
                      {getUserInitials()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700" data-testid="text-user-name">
                    {authState.user.firstName} {authState.user.lastName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="h-screen">
        {currentApp === 'inventory' ? (
          <InventoryApp />
        ) : (
          <JarvisApp />
        )}
      </main>

      {/* Token Sidebar */}
      <TokenSidebar 
        isOpen={isTokenSidebarOpen} 
        onClose={() => setIsTokenSidebarOpen(false)} 
      />
    </div>
  );
}
