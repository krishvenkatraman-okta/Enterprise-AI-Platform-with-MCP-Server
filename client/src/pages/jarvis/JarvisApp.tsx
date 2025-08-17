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
        {/* Enhanced spinning animation with radial lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Outer ring with radial lines */}
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 bg-blue-400/30"
                  style={{
                    height: '48px',
                    left: '50%',
                    top: '0',
                    transformOrigin: '50% 192px',
                    transform: `translateX(-50%) rotate(${i * 15}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Middle ring with shorter lines */}
          <div className="absolute relative w-64 h-64">
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 bg-blue-300/40"
                  style={{
                    height: '32px',
                    left: '50%',
                    top: '0',
                    transformOrigin: '50% 128px',
                    transform: `translateX(-50%) rotate(${i * 22.5}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Inner ring with dots */}
          <div className="absolute relative w-32 h-32">
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-200/60 rounded-full"
                  style={{
                    left: '50%',
                    top: '0',
                    transformOrigin: '50% 64px',
                    transform: `translateX(-50%) rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
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
