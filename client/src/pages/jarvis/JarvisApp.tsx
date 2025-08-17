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
      <div className="h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        {/* Background constantly spinning wheels */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1200px] h-[1200px] border-2 border-blue-400/20 rounded-full animate-spin" />
          <div className="absolute w-[900px] h-[900px] border border-blue-400/15 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
          <div className="absolute w-[600px] h-[600px] border border-blue-400/10 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute w-[400px] h-[400px] border-2 border-blue-300/25 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        {/* Navigation Header */}
        <nav className="bg-blue-800/90 backdrop-blur-sm shadow-xl border-b border-blue-400/30 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">J</span>
                  </div>
                  <h1 className="text-xl font-bold text-white" data-testid="text-app-title">
                    J.A.R.V.I.S
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="text-blue-400 hover:text-blue-300"
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
                  className="text-blue-400 hover:text-blue-300"
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
                    <span className="text-sm text-white" data-testid="text-user-name">
                      {authState.user.firstName} {authState.user.lastName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-blue-400 hover:text-blue-300"
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
