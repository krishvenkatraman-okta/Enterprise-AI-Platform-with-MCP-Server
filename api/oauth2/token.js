// Vercel Serverless Function for MCP OAuth2 Token Endpoint
// URL: /api/oauth2/token
// Implements JWT-bearer grant type with JAG token validation

import crypto from 'crypto';
import { createPublicKey, verify } from 'crypto';

// MCP Authorization Server Configuration
const MCP_CONFIG = {
  clientId: process.env.MCP_SERVER_CLIENT_ID || 'mcp_inventory_server_001',
  clientSecret: process.env.MCP_SERVER_CLIENT_SECRET || 'mcp_server_secret_2024_inventory_access',
  oktaDomain: process.env.OKTA_DOMAIN || 'fcxdemo.okta.com',
  tokenLifetime: 86400 // 24 hours
};

// In-memory cache for Okta JWKS (in production, use Redis or similar)
let oktaJwksCache = null;
let jwksCacheExpiry = 0;

// Helper function to get Okta JWKS for JWT validation
async function getOktaJwks() {
  const now = Date.now();
  
  // Return cached JWKS if still valid (cache for 1 hour)
  if (oktaJwksCache && now < jwksCacheExpiry) {
    return oktaJwksCache;
  }
  
  try {
    const jwksUrl = `https://${MCP_CONFIG.oktaDomain}/oauth2/v1/keys`;
    const response = await fetch(jwksUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }
    
    oktaJwksCache = await response.json();
    jwksCacheExpiry = now + (60 * 60 * 1000); // Cache for 1 hour
    
    return oktaJwksCache;
  } catch (error) {
    console.error('Error fetching Okta JWKS:', error);
    throw new Error('Unable to validate JWT - JWKS fetch failed');
  }
}

// Helper function to validate JAG JWT token with proper signature verification
async function validateJagToken(jagToken) {
  try {
    // Parse JWT header and payload
    const parts = jagToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format - must have 3 parts');
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Basic payload validation
    if (!payload.sub || !payload.iss) {
      throw new Error('Invalid JWT payload - missing required claims');
    }
    
    // Check issuer
    const expectedIssuer = `https://${MCP_CONFIG.oktaDomain}`;
    if (payload.iss !== expectedIssuer) {
      throw new Error(`Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`);
    }
    
    // Check expiration
    if (payload.exp && payload.exp < (Date.now() / 1000)) {
      throw new Error('JWT token has expired');
    }
    
    // Get JWKS and validate signature
    const jwks = await getOktaJwks();
    const signingKey = jwks.keys.find(key => key.kid === header.kid);
    
    if (!signingKey) {
      throw new Error(`No matching key found for kid: ${header.kid}`);
    }
    
    // Construct public key from JWKS
    const publicKeyPem = `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----`;
    const publicKey = createPublicKey(publicKeyPem);
    
    // Verify JWT signature
    const signData = parts[0] + '.' + parts[1];
    const signature = Buffer.from(parts[2], 'base64url');
    
    const isValid = verify('RSA-SHA256', Buffer.from(signData), publicKey, signature);
    
    if (!isValid) {
      throw new Error('JWT signature verification failed');
    }
    
    console.log(`✅ JAG token signature validated for subject: ${payload.sub}`);
    console.log(`📋 Token issuer: ${payload.iss}`);
    console.log(`🔑 Validated with kid: ${header.kid}`);
    
    return payload;
    
  } catch (error) {
    console.error('JAG token validation failed:', error);
    throw new Error(`JWT validation failed: ${error.message}`);
  }
}

// Validate Basic Auth credentials
function validateBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new Error('Client authentication required');
  }
  
  const base64Credentials = authHeader.replace('Basic ', '');
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [clientId, clientSecret] = credentials.split(':');
  
  if (clientId !== MCP_CONFIG.clientId || clientSecret !== MCP_CONFIG.clientSecret) {
    throw new Error('Invalid client credentials');
  }
  
  return { clientId, clientSecret };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set OAuth cache control headers
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'method_not_allowed',
      error_description: 'Only POST method is supported'
    });
  }

  try {
    console.log('🔐 MCP OAuth2 Token Request (Vercel)');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Validate client credentials
    const { clientId, clientSecret } = validateBasicAuth(req.headers.authorization);
    
    const { grant_type, assertion } = req.body;
    
    // Validate grant type
    if (grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only jwt-bearer grant type is supported'
      });
    }
    
    if (!assertion) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'assertion parameter is required'
      });
    }
    
    console.log(`✅ Client authenticated: ${clientId}`);
    console.log(`📋 Grant type: ${grant_type}`);
    console.log(`🎫 JAG token (assertion): ${assertion.substring(0, 50)}...`);
    
    // Validate the JAG token against Okta
    const validatedClaims = await validateJagToken(assertion);
    
    // Generate MCP access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    console.log(`🎯 Generated MCP access token: ${accessToken.substring(0, 20)}...`);
    console.log(`👤 For user: ${validatedClaims.sub}`);
    
    return res.status(200).json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: MCP_CONFIG.tokenLifetime,
      scope: 'inventory:read',
      subject: validatedClaims.sub
    });

  } catch (error) {
    console.error('❌ MCP OAuth Token Error:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('credentials')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: error.message
      });
    }
    
    if (error.message.includes('JWT validation') || error.message.includes('expired')) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: error.message
      });
    }
    
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token issuance'
    });
  }
}