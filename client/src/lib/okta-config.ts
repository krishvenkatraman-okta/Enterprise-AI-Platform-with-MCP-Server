export interface OktaConfig {
  clientId: string;
  issuer: string;
  redirectUri: string;
  scopes: string[];
  pkce: boolean;
}

export const INVENTORY_OKTA_CONFIG: OktaConfig = {
  clientId: "0oau8x7jn10yYmlhw697",
  issuer: "https://fcxdemo.okta.com/oauth2/v1",
  redirectUri: `${window.location.origin}/login/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: true,
};

export const JARVIS_OKTA_CONFIG: OktaConfig = {
  clientId: "0oau8wb0eiLgOCT1X697",
  issuer: "https://fcxdemo.okta.com/oauth2/v1",
  redirectUri: `${window.location.origin}/jarvis/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: true,
};

export function getOktaConfig(app: 'inventory' | 'jarvis'): OktaConfig {
  return app === 'inventory' ? INVENTORY_OKTA_CONFIG : JARVIS_OKTA_CONFIG;
}
