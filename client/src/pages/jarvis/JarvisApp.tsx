import { useState, useEffect } from "react";
import { authService, type AuthState } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/AuthGuard";
import ChatInterface from "./ChatInterface";
import TokenSidebar from "@/components/TokenSidebar";
import { Key, User, Home } from "lucide-react";

export default function JarvisApp() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
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

  return (
    <AuthGuard
      application="jarvis"
      title="J.A.R.V.I.S"
      description="Just A Rather Very Intelligent System"
      icon="fas fa-robot"
      theme="jarvis"
    >
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background spinning wheels */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1200px] h-[1200px] border-2 border-amber-400/5 rounded-full animate-spin-slow" />
          <div className="absolute w-[900px] h-[900px] border border-amber-400/3 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '10s' }} />
          <div className="absolute w-[600px] h-[600px] border border-amber-400/2 rounded-full animate-spin-slow" style={{ animationDuration: '15s' }} />
        </div>
        {/* Navigation Header */}
        <nav className="bg-slate-800/90 backdrop-blur-sm shadow-xl border-b border-amber-400/30 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-slate-900 text-sm font-bold">J</span>
                  </div>
                  <h1 className="text-xl font-bold text-white" data-testid="text-app-title">
                    J.A.R.V.I.S
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="text-amber-400 hover:text-amber-300"
                  data-testid="button-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTokenSidebarOpen(true)}
                  className="text-amber-400 hover:text-amber-300"
                  data-testid="button-toggle-tokens"
                >
                  <Key className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Tokens</span>
                </Button>
                {authState.user && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-slate-900 text-sm font-medium" data-testid="text-user-initials">
                        {getUserInitials()}
                      </span>
                    </div>
                    <span className="text-sm text-white" data-testid="text-user-name">
                      {authState.user.firstName} {authState.user.lastName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-amber-400 hover:text-amber-300"
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
        
        <div className="h-[calc(100vh-4rem)]">
          <ChatInterface />
        </div>
        
        {/* Token Sidebar */}
        <TokenSidebar 
          isOpen={isTokenSidebarOpen} 
          onClose={() => setIsTokenSidebarOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
}
