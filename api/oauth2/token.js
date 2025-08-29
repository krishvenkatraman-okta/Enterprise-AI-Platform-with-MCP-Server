export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'method_not_allowed'});
  }

  try {
    console.log('OAuth2 Token Request');
    
    const body = req.body || {};
    
    // Validate grant type
    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      return res.status(400).json({error: 'unsupported_grant_type'});
    }
    
    if (!body.assertion) {
      return res.status(400).json({error: 'invalid_request'});
    }
    
    // Simple JWT check
    const parts = body.assertion.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({error: 'invalid_grant'});
    }
    
    // Generate token
    const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    console.log('Generated token');
    
    return res.status(200).json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: 86400,
      scope: 'inventory:read'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: error.message
    });
  }
}