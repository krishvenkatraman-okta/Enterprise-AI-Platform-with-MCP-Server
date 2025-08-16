import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Key, Clock, CheckCircle, XCircle } from "lucide-react";

interface TokenSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionData {
  sessions: Array<{
    id: string;
    application: string;
    createdAt: string;
    expiresAt: string;
    idTokenPreview: string;
  }>;
  tokenExchangeHistory: Array<{
    id: string;
    fromApp: string;
    toApp: string;
    success: boolean;
    createdAt: string;
    errorMessage?: string;
  }>;
}

export default function TokenSidebar({ isOpen, onClose }: TokenSidebarProps) {
  const authState = authService.getState();
  
  const { data: sessionData } = useQuery<SessionData>({
    queryKey: ["/api/auth/sessions"],
    enabled: authState.isAuthenticated,
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getAppDisplayName = (app: string) => {
    const names = {
      inventory: "Atlas Beverages",
      jarvis: "Jarvis AI",
    };
    return names[app as keyof typeof names] || app;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-16 h-full w-80 bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-testid="sidebar-tokens"
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Authentication Tokens
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-full pb-20">
          {/* Current Session */}
          {authState.user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">User:</span> 
                  <span className="ml-2" data-testid="text-current-user">
                    {authState.user.email}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                {authState.session && (
                  <div>
                    <span className="font-medium">Expires:</span> 
                    <span className="ml-2" data-testid="text-session-expires">
                      {formatDate(authState.session.expiresAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Sessions */}
          {sessionData?.sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{getAppDisplayName(session.application)}</span>
                  {session.application === authState.session?.application && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Current
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Token Type:</span> 
                  <span className="ml-2">ID Token</span>
                </div>
                <div>
                  <span className="font-medium">Issued:</span> 
                  <span className="ml-2" data-testid={`text-token-issued-${session.application}`}>
                    {formatTime(session.createdAt)}
                  </span>
                </div>
                <div className="bg-gray-100 p-2 rounded text-xs break-all font-mono">
                  <span data-testid={`text-token-preview-${session.application}`}>
                    {session.idTokenPreview}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Cross-App Access Log */}
          {sessionData?.tokenExchangeHistory && sessionData.tokenExchangeHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cross-App Access Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionData.tokenExchangeHistory.map((exchange) => (
                  <div key={exchange.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center justify-between text-sm">
                      <span data-testid={`text-exchange-${exchange.id}`}>
                        {getAppDisplayName(exchange.fromApp)} → {getAppDisplayName(exchange.toApp)}
                      </span>
                      {exchange.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Token exchange {exchange.success ? 'completed' : 'failed'} at {formatTime(exchange.createdAt)}
                    </div>
                    {!exchange.success && exchange.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {exchange.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!sessionData || sessionData.sessions.length === 0) && authState.isAuthenticated && (
            <Card>
              <CardContent className="text-center py-8">
                <Key className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No token data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
