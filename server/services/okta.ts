interface OktaConfig {
  domain: string;
  orgAuthServer: string;
  inventoryClientId: string;
  inventoryClientSecret: string;
  jarvisClientId: string;
  jarvisClientSecret: string;
}

const oktaConfig: OktaConfig = {
  domain: "fcxdemo.okta.com",
  orgAuthServer: "https://fcxdemo.okta.com/oauth2/v1",
  inventoryClientId: "0oau8x7jn10yYmlhw697",
  inventoryClientSecret: process.env.INVENTORY_CLIENT_SECRET || "Ixvrzzgq2jZ4BCdbKXI9YxD0kTwEWpajWDWZcj2niXLJJIoBOjLKKePP4Qf1efDK",
  jarvisClientId: "0oau8wb0eiLgOCT1X697",
  jarvisClientSecret: process.env.JARVIS_CLIENT_SECRET || "e6DQE5cSnD3qCYx6BpfBDLzNgZrI-wRobgrcpz4ylyKfBhv7ljkRZcrLuTk_Innt",
};

export interface TokenExchangeRequest {
  subjectToken: string;
  audience: string;
  clientId: string;
  clientSecret: string;
}

export interface TokenExchangeResponse {
  issued_token_type: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class OktaService {
  private config: OktaConfig;

  constructor() {
    this.config = oktaConfig;
  }

  async performTokenExchange(request: TokenExchangeRequest): Promise<TokenExchangeResponse> {
    const tokenUrl = `https://${this.config.domain}/oauth2/v1/token`;
    
    const formData = new URLSearchParams({
      'grant_type': 'urn:ietf:params:oauth:grant-type:token-exchange',
      'requested_token_type': 'urn:ietf:params:oauth:token-type:id-jag',
      'subject_token': request.subjectToken,
      'subject_token_type': 'urn:ietf:params:oauth:token-type:id_token',
      'audience': request.audience,
      'client_id': request.clientId,
      'client_secret': request.clientSecret,
    });

    console.log('Token exchange request:', {
      url: tokenUrl,
      audience: request.audience,
      clientId: request.clientId,
      subjectTokenPreview: request.subjectToken.substring(0, 100) + '...',
      subjectTokenLength: request.subjectToken.length
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', { status: response.status, error: errorText });
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async exchangeJarvisToInventory(idToken: string): Promise<TokenExchangeResponse> {
    return this.performTokenExchange({
      subjectToken: idToken,
      audience: 'http://localhost:5001', // Inventory application audience
      clientId: this.config.jarvisClientId,
      clientSecret: this.config.jarvisClientSecret,
    });
  }

  getInventoryClientConfig() {
    return {
      clientId: this.config.inventoryClientId,
      domain: this.config.domain,
      redirectUri: `http://localhost:5000/login/callback`,
      scope: ['openid', 'profile', 'email'],
    };
  }

  getJarvisClientConfig() {
    return {
      clientId: this.config.jarvisClientId,
      domain: this.config.domain,
      redirectUri: `http://localhost:5000/jarvis/callback`,
      scope: ['openid', 'profile', 'email'],
    };
  }

  decodeIdToken(idToken: string): any {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid ID token format');
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeIdToken(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }
}

export const oktaService = new OktaService();
