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
  const [config, setConfig] = useState<OktaConfig | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Load Okta configuration
    const loadConfig = async () => {
      try {
        const oktaConfig = await getOktaConfig(application);
        setConfig(oktaConfig);
      } catch (error) {
        console.error('Failed to load Okta config:', error);
      }
    };
    loadConfig();
  }, [application]);

  useEffect(() => {
    // Handle OAuth callback - let backend handle token exchange
    const handleCallback = async () => {
      // Only process callback if we're on a callback URL
      if (!window.location.pathname.includes('/callback')) {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('code_verifier');

      console.log('Callback debug:', { 
        pathname: window.location.pathname,
        code: code ? 'present' : 'missing', 
        state: state ? 'present' : 'missing', 
        storedState: storedState ? 'present' : 'missing', 
        codeVerifier: codeVerifier ? 'present' : 'missing',
        config: config ? 'loaded' : 'not loaded',
        application
      });

      // Enhanced debugging
      if (code) {
        console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      }
      if (!config) {
        console.log('Config not loaded yet, waiting...');
        return;
      }
      
      if (code && state === storedState && codeVerifier && config) {
        setIsLoading(true);
        try {
          const requestBody = {
            code,
            state,
            application,
            redirectUri: config.redirectUri,
            codeVerifier,
          };
          console.log('Sending callback request:', requestBody);
          
          // Send the authorization code to backend for token exchange
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log('Callback response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Authentication failed:', errorText);
            throw new Error(`Authentication failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('Authentication successful, processing login...');
          authService.setIdToken(data.idToken);
          await authService.login(data.idToken, application);

          // Clean up
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('code_verifier');
          
          // Force state update
          setAuthState(authService.getState());
          
          // Navigate to the appropriate application after successful authentication  
          const redirectPath = application === 'inventory' ? '/inventory' : '/jarvis';
          console.log('Authentication complete, navigating to:', redirectPath);
          // Use history navigation instead of full page reload to preserve sessionStorage
          window.history.pushState({}, '', redirectPath);
          // Trigger a popstate event to notify React Router
          window.dispatchEvent(new PopStateEvent('popstate'));
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
    if (!config) {
      console.error('Okta config not loaded yet');
      return;
    }

    setIsLoading(true);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      sessionStorage.setItem('code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      console.log('Starting OIDC flow with config:', config);
      const authUrl = buildAuthUrl(config, codeChallenge, state);
      console.log('Redirecting to:', authUrl);
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
      bg: "bg-slate-800/90 border-blue-400/30 backdrop-blur-sm",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      accent: "text-blue-400",
      dots: "bg-blue-400",
    },
  };

  const styles = themeClasses[theme];

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'jarvis' ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 overflow-hidden' : 'bg-black/50'}`}>
      {/* Enhanced radial spinning background for Jarvis */}
      {theme === 'jarvis' && (
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
          
          {/* Inner ring with accent lines */}
          <div className="absolute relative w-32 h-32">
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 ${i % 3 === 0 ? 'bg-cyan-400/60' : 'bg-blue-200/50'}`}
                  style={{
                    height: '20px',
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
      )}
      <Card className={`w-full max-w-md mx-4 animate-fade-in relative z-10 ${styles.bg} ${theme === 'jarvis' ? 'shadow-blue-400/20 shadow-2xl' : ''}`}>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 relative`}>
              <i className={`${icon} text-white text-2xl`} />
              {theme === 'jarvis' && (
                <div className="absolute inset-0 w-16 h-16 border-2 border-blue-400/50 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
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
                <p className={`text-sm mb-4 ${theme === 'jarvis' ? 'text-blue-300' : 'text-gray-600'}`}>
                  {theme === 'jarvis' ? 'Starting authentication...' : 'Authenticating with enterprise identity provider...'}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 ${styles.dots}/60 rounded-full`}>
                    <div className={`w-full h-full ${styles.dots} rounded-full animate-ping`} />
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                disabled={!config}
                className={`w-full ${styles.gradient} font-medium hover:opacity-90 transition-opacity shadow-lg`}
                data-testid={`button-login-${application}`}
              >
                {!config ? 'Loading...' : theme === 'jarvis' ? 'Sign in with Okta' : `Continue to ${title}`}
              </Button>
            )}
          </div>
          
          <div className={`mt-6 text-center text-xs ${theme === 'jarvis' ? 'text-blue-400/80' : 'text-gray-500'}`}>
            <p>Secured by Enterprise SSO</p>
            <p className="mt-1">
              {theme === 'jarvis' ? 'Cross-Interface Access • Token Exchange' : 'PKCE • OpenID Connect'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
