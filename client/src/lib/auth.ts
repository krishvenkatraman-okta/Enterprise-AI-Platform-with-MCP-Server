import { apiRequest, setAuthHeadersGetter } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthSession {
  sessionId: string;
  expiresAt: string;
  application: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
}

export class AuthService {
  private authState: AuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.loadStoredAuth();
    // Register auth headers function with query client
    setAuthHeadersGetter(() => this.getAuthHeaders());
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): AuthState {
    return { ...this.authState };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  private loadStoredAuth() {
    try {
      const stored = localStorage.getItem('atlas_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (new Date(parsed.session?.expiresAt) > new Date()) {
          this.authState = { ...parsed, isAuthenticated: true };
          this.notify();
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      this.clearAuth();
    }
  }

  private storeAuth() {
    try {
      localStorage.setItem('atlas_auth', JSON.stringify({
        user: this.authState.user,
        session: this.authState.session,
      }));
    } catch (error) {
      console.error('Failed to store auth:', error);
    }
  }

  private clearAuth() {
    this.authState = {
      user: null,
      session: null,
      isAuthenticated: false,
    };
    localStorage.removeItem('atlas_auth');
    localStorage.removeItem('atlas_id_token');
    this.notify();
  }

  async login(idToken: string, application: 'inventory' | 'jarvis'): Promise<void> {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        idToken,
        application,
      });

      const data = await response.json();
      
      this.authState = {
        user: data.user,
        session: data.session,
        isAuthenticated: true,
      };

      // Store the ID token for API authentication
      this.setIdToken(idToken);
      
      this.storeAuth();
      this.notify();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authState.session) {
        await apiRequest('POST', '/api/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async exchangeToken(targetApp: string): Promise<{ jagToken: string; expiresIn: number }> {
    try {
      const response = await apiRequest('POST', '/api/auth/token-exchange', {
        targetApp,
      });

      return await response.json();
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.authState.session) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.getIdToken()}`,
      'X-Session-Id': this.authState.session.sessionId,
    };
  }

  private getIdToken(): string {
    // This should be stored securely, but for demo purposes we'll reconstruct it
    // In a real app, you'd store the full token securely
    return localStorage.getItem('atlas_id_token') || '';
  }

  setIdToken(token: string): void {
    localStorage.setItem('atlas_id_token', token);
  }
}

export const authService = new AuthService();

// PKCE helper functions
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function buildAuthUrl(config: any, codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: config.scopes.join(' '),
    redirect_uri: config.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${config.issuer}/v1/authorize?${params.toString()}`;
}
