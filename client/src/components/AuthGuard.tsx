import { useEffect, useState } from "react";
import { authService, type AuthState } from "@/lib/auth";
import { getOktaConfig, type OktaConfig } from "@/lib/okta-config";
import { generateCodeVerifier, generateCodeChallenge, buildAuthUrl } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: React.ReactNode;
  application: 'inventory' | 'jarvis';
  title: string;
  description: string;
  icon: string;
  theme: 'atlas' | 'jarvis';
}

export default function AuthGuard({ 
  children, 
  application, 
  title, 
  description, 
  icon, 
  theme 
}: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [config] = useState<OktaConfig>(getOktaConfig(application));

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Handle OAuth callback - let backend handle token exchange
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('code_verifier');

      if (code && state === storedState && codeVerifier) {
        setIsLoading(true);
        try {
          // Send the authorization code to backend for token exchange
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
              application,
              redirectUri: config.redirectUri,
              codeVerifier,
            }),
          });

          if (!response.ok) {
            throw new Error('Authentication failed');
          }

          const data = await response.json();
          authService.setIdToken(data.idToken);
          await authService.login(data.idToken, application);

          // Clean up
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('code_verifier');
          
          // Force state update
          setAuthState(authService.getState());
          
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Authentication error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [config, application]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      sessionStorage.setItem('code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      const authUrl = buildAuthUrl(config, codeChallenge, state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const isAppAuthenticated = authState.isAuthenticated && authState.session?.application === application;
  

  if (isAppAuthenticated) {
    return <>{children}</>;
  }

  const themeClasses = {
    atlas: {
      bg: "bg-white",
      gradient: "bg-gradient-to-r from-blue-600 to-blue-700",
      iconBg: "bg-gradient-to-br from-blue-600 to-blue-700",
      accent: "text-blue-600",
      dots: "bg-blue-600",
    },
    jarvis: {
      bg: "bg-slate-900 border-amber-400/30",
      gradient: "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-500",
      accent: "text-amber-400",
      dots: "bg-amber-400",
    },
  };

  const styles = themeClasses[theme];

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'jarvis' ? 'bg-slate-900 overflow-hidden' : 'bg-black/50'}`}>
      {/* Spinning wheel background for Jarvis */}
      {theme === 'jarvis' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 border-4 border-amber-400/20 rounded-full animate-spin-slow" />
          <div className="absolute w-80 h-80 border-2 border-amber-400/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }} />
          <div className="absolute w-64 h-64 border border-amber-400/5 rounded-full animate-spin-slow" style={{ animationDuration: '6s' }} />
        </div>
      )}
      <Card className={`w-full max-w-md mx-4 animate-fade-in relative z-10 ${styles.bg} ${theme === 'jarvis' ? 'shadow-amber-400/20 shadow-2xl backdrop-blur-sm bg-slate-900/90' : ''}`}>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'jarvis' ? 'animate-pulse' : ''}`}>
              <i className={`${icon} text-white text-2xl`} />
              {theme === 'jarvis' && (
                <div className="absolute inset-0 w-16 h-16 border-2 border-amber-400 rounded-full animate-spin opacity-30" />
              )}
            </div>
            <h2 className={`text-2xl font-bold ${theme === 'jarvis' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
            <p className={`${styles.accent} mt-2`}>{description}</p>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center">
                <p className={`text-sm mb-4 ${theme === 'jarvis' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {theme === 'jarvis' ? 'Initializing secure neural link...' : 'Authenticating with enterprise identity provider...'}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 ${styles.dots} rounded-full animate-bounce`} />
                  <div className={`w-2 h-2 ${styles.dots} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }} />
                  <div className={`w-2 h-2 ${styles.dots} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                className={`w-full ${styles.gradient} font-medium hover:opacity-90 transition-opacity`}
                data-testid={`button-login-${application}`}
              >
                {theme === 'jarvis' ? 'Initialize Jarvis AI' : `Continue to ${title}`}
              </Button>
            )}
          </div>
          
          <div className={`mt-6 text-center text-xs ${theme === 'jarvis' ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Secured by Enterprise SSO</p>
            <p className="mt-1">
              {theme === 'jarvis' ? 'Cross-App Access • Token Exchange' : 'PKCE • OpenID Connect'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
