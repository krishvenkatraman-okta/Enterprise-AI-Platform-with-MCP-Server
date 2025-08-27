export interface OktaConfig {
  clientId: string;
  issuer: string;
  redirectUri: string;
  scopes: string[];
  pkce: boolean;
}

// Dynamic configuration fetched from backend
let cachedConfig: any = null;

async function fetchServerConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    const response = await fetch('/api/config');
    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Failed to fetch server config, using fallback:', error);
    // Fallback to default configuration
    return {
      okta: {
        domain: "fcxdemo.okta.com",
        authorizationServer: "https://fcxdemo.okta.com/oauth2",
        inventoryClientId: "0oau8x7jn10yYmlhw697",
        jarvisClientId: "0oau8wb0eiLgOCT1X697"
      }
    };
  }
}

export async function getOktaConfig(app: 'inventory' | 'jarvis'): Promise<OktaConfig> {
  const config = await fetchServerConfig();
  
  const clientId = app === 'inventory' 
    ? config.okta.inventoryClientId 
    : config.okta.jarvisClientId;
    
  const redirectPath = app === 'inventory' ? '/login/callback' : '/jarvis/callback';
  
  return {
    clientId,
    issuer: config.okta.authorizationServer,
    redirectUri: `${window.location.origin}${redirectPath}`,
    scopes: ["openid", "profile", "email"],
    pkce: true,
  };
}

// Legacy synchronous versions (deprecated - use async version above)
export const INVENTORY_OKTA_CONFIG: OktaConfig = {
  clientId: "0oau8x7jn10yYmlhw697",
  issuer: "https://fcxdemo.okta.com/oauth2",
  redirectUri: `${window.location.origin}/login/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: true,
};

export const JARVIS_OKTA_CONFIG: OktaConfig = {
  clientId: "0oau8wb0eiLgOCT1X697",
  issuer: "https://fcxdemo.okta.com/oauth2",
  redirectUri: `${window.location.origin}/jarvis/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: true,
};
