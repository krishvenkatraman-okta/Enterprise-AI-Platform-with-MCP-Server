// Vercel Serverless Function for MCP OAuth2 Token Endpoint
// URL: /api/oauth2/token

const crypto = require('crypto');

// MCP Configuration
const MCP_CONFIG = {
  clientId: process.env.MCP_SERVER_CLIENT_ID || 'mcp_inventory_server_001',
  clientSecret: process.env.MCP_SERVER_CLIENT_SECRET || 'mcp_server_secret_2024_inventory_access',
  oktaDomain: process.env.OKTA_DOMAIN || 'fcxdemo.okta.com',
  tokenLifetime: 86400
};

// Simple JWT validation (demo purposes)
function validateJagToken(jagToken) {
  try {
    const parts = jagToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (!payload.sub || !payload.iss) {
      throw new Error('Invalid JWT payload');
    }
    
    if (!payload.iss.includes(MCP_CONFIG.oktaDomain)) {
      throw new Error('Invalid issuer');
    }
    
    if (payload.exp && payload.exp < (Date.now() / 1000)) {
      throw new Error('JWT token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('JWT validation failed: ' + error.message);
  }
}

// Validate Basic Auth
function validateBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new Error('Basic authentication required');
  }
  
  const base64Credentials = authHeader.replace('Basic ', '');
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const parts = credentials.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Invalid Basic auth format');
  }
  
  const clientId = parts[0];
  const clientSecret = parts[1];
  
  if (clientId !== MCP_CONFIG.clientId || clientSecret !== MCP_CONFIG.clientSecret) {
    throw new Error('Invalid client credentials');
  }
  
  return { clientId, clientSecret };
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'method_not_allowed',
      error_description: 'Only POST method supported'
    });
  }

  try {
    console.log('MCP OAuth2 Token Request');
    
    // Validate client credentials
    const credentials = validateBasicAuth(req.headers.authorization);
    
    const body = req.body || {};
    const grantType = body.grant_type;
    const assertion = body.assertion;
    
    // Validate grant type
    if (grantType !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only jwt-bearer grant type supported'
      });
    }
    
    if (!assertion) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'assertion parameter required'
      });
    }
    
    console.log('Client:', credentials.clientId);
    console.log('Grant type:', grantType);
    console.log('JAG token length:', assertion.length);
    
    // Validate JAG token
    const validatedClaims = validateJagToken(assertion);
    
    // Generate MCP access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    console.log('Generated access token for user:', validatedClaims.sub);
    
    return res.status(200).json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: MCP_CONFIG.tokenLifetime,
      scope: 'inventory:read',
      subject: validatedClaims.sub
    });

  } catch (error) {
    console.error('OAuth Token Error:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('credentials')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: error.message
      });
    }
    
    if (error.message.includes('JWT') || error.message.includes('expired')) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: error.message
      });
    }
    
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
};