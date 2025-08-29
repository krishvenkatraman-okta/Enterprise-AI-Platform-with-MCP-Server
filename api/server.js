import express from 'express';
import session from 'express-session';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'demo-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Simple in-memory storage for demo
const storage = {
  users: new Map(),
  warehouses: new Map(),
  inventoryItems: new Map(),
  authSessions: new Map(),
  tokenExchangeLog: []
};

// Initialize demo data
function initializeDemoData() {
  // Add warehouses
  const californiaWarehouse = {
    id: "warehouse-ca-001",
    name: "West Coast Distribution",
    location: "Los Angeles, CA",
    state: "California",
    active: true,
    createdAt: new Date()
  };
  
  const texasWarehouse = {
    id: "warehouse-tx-001", 
    name: "Central Distribution Hub",
    location: "Austin, TX",
    state: "Texas",
    active: true,
    createdAt: new Date()
  };
  
  const nevadaWarehouse = {
    id: "warehouse-nv-001",
    name: "Desert Springs Depot", 
    location: "Las Vegas, NV",
    state: "Nevada",
    active: true,
    createdAt: new Date()
  };

  storage.warehouses.set(californiaWarehouse.id, californiaWarehouse);
  storage.warehouses.set(texasWarehouse.id, texasWarehouse);
  storage.warehouses.set(nevadaWarehouse.id, nevadaWarehouse);

  // Add inventory items
  const items = [
    { id: "item-001", name: "Premium Cola", category: "Beverages", warehouseId: californiaWarehouse.id, quantity: 250, minStock: 50, price: 2.99 },
    { id: "item-002", name: "Energy Drink", category: "Beverages", warehouseId: californiaWarehouse.id, quantity: 180, minStock: 40, price: 3.49 },
    { id: "item-003", name: "Sparkling Water", category: "Water", warehouseId: californiaWarehouse.id, quantity: 320, minStock: 80, price: 1.79 },
    { id: "item-004", name: "Orange Juice", category: "Juices", warehouseId: californiaWarehouse.id, quantity: 45, minStock: 60, price: 4.29 },
    { id: "item-005", name: "Spring Water", category: "Water", warehouseId: texasWarehouse.id, quantity: 500, minStock: 100, price: 1.29 },
    { id: "item-006", name: "Craft Beer", category: "Alcoholic", warehouseId: texasWarehouse.id, quantity: 120, minStock: 30, price: 4.99 },
    { id: "item-007", name: "Sports Drink", category: "Beverages", warehouseId: texasWarehouse.id, quantity: 25, minStock: 50, price: 2.79 },
    { id: "item-008", name: "Iced Tea", category: "Beverages", warehouseId: texasWarehouse.id, quantity: 85, minStock: 40, price: 2.49 },
    { id: "item-009", name: "Fruit Juice", category: "Juices", warehouseId: nevadaWarehouse.id, quantity: 90, minStock: 25, price: 3.29 },
    { id: "item-010", name: "Energy Shots", category: "Beverages", warehouseId: nevadaWarehouse.id, quantity: 15, minStock: 30, price: 5.99 },
    { id: "item-011", name: "Coconut Water", category: "Water", warehouseId: nevadaWarehouse.id, quantity: 65, minStock: 35, price: 3.79 },
    { id: "item-012", name: "Protein Shake", category: "Health", warehouseId: nevadaWarehouse.id, quantity: 40, minStock: 20, price: 6.49 },
    { id: "item-013", name: "Kombucha", category: "Health", warehouseId: nevadaWarehouse.id, quantity: 30, minStock: 15, price: 4.79 }
  ];

  items.forEach(item => {
    storage.inventoryItems.set(item.id, { ...item, createdAt: new Date() });
  });

  console.log('✅ Demo data initialized with 3 warehouses and 13 inventory items');
}

// Initialize data
initializeDemoData();

// Configuration endpoint - uses environment variables
app.get('/api/config', (req, res) => {
  res.json({
    okta: {
      domain: process.env.OKTA_DOMAIN || "fcxdemo.okta.com",
      authorizationServer: process.env.OKTA_AUTHORIZATION_SERVER || "https://fcxdemo.okta.com/oauth2",
      inventoryClientId: process.env.INVENTORY_CLIENT_ID || "0oau8x7jn10yYmlhw697",
      jarvisClientId: process.env.JARVIS_CLIENT_ID || "0oau8wb0eiLgOCT1X697"
    }
  });
});

// Auth callback endpoint
app.post('/api/auth/callback', async (req, res) => {
  console.log('=== Auth Callback Request ===');
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    const { code, state, application, redirectUri, codeVerifier } = req.body;
    
    console.log('Callback parameters:', { 
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing', 
      application,
      redirectUri,
      codeVerifier: codeVerifier ? 'present' : 'missing'
    });
    
    if (!code || !state || !application || !redirectUri || !codeVerifier) {
      console.error('Missing required parameters');
      return res.status(400).json({ error: "Code, state, application, redirectUri, and codeVerifier are required" });
    }

    // Get Okta configuration from environment
    const oktaDomainRaw = process.env.OKTA_DOMAIN || "fcxdemo.okta.com";
    // Fix: Extract domain from authorization server if needed
    const authServer = process.env.OKTA_AUTHORIZATION_SERVER || "https://fcxdemo.okta.com/oauth2";
    const oktaDomain = authServer.includes('://') ? authServer.split('://')[1].split('/')[0] : oktaDomainRaw;
    const clientId = application === 'inventory' 
      ? (process.env.INVENTORY_CLIENT_ID || "0oau8x7jn10yYmlhw697")
      : (process.env.JARVIS_CLIENT_ID || "0oau8wb0eiLgOCT1X697");
    const clientSecret = application === 'inventory'
      ? (process.env.INVENTORY_CLIENT_SECRET || "Ixvrzzgq2jZ4BCdbKXI9YxD0kTwEWpajWDWZcj2niXLJJIoBOjLKKePP4Qf1efDK")
      : (process.env.JARVIS_CLIENT_SECRET || "e6DQE5cSnD3qCYx6BpfBDLzNgZrI-wRobgrcpz4ylyKfBhv7ljkRZcrLuTk_Innt");

    console.log('Using Okta configuration:', { oktaDomain, clientId: clientId.substring(0, 10) + '...' });

    // Exchange authorization code for tokens
    // Fix: Remove https:// if it's already in the oktaDomain
    const cleanDomain = oktaDomain.replace(/^https?:\/\//, '');
    const tokenUrl = `https://${cleanDomain}/oauth2/v1/token`;
    console.log('Token URL:', tokenUrl);
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        return res.status(401).json({ error: 'Token exchange failed', details: errorText });
      }

      const tokens = await response.json();
      
      res.json({
        idToken: tokens.id_token,
        success: true,
      });
    } catch (fetchError) {
      console.error('Fetch error during token exchange:', fetchError);
      return res.status(500).json({ error: 'Network error during token exchange' });
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: "Authentication callback failed" });
  }
});

// Login endpoint  
app.post('/api/auth/login', async (req, res) => {
  try {
    const { idToken, application } = req.body;
    
    if (!idToken || !application) {
      return res.status(400).json({ error: "ID token and application are required" });
    }

    // Decode ID token (basic decoding for demo)
    const parts = idToken.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const sessionId = 'session_' + Date.now();
        const user = {
          id: payload.sub || 'demo_user_001',
          email: payload.email || 'demo@atlas.com', 
          firstName: payload.given_name || 'Demo',
          lastName: payload.family_name || 'User'
        };

        const session = {
          sessionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          application
        };

        storage.authSessions.set(sessionId, { user, session });

        res.json({
          user,
          session,
          success: true
        });
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
        res.status(401).json({ error: "Invalid token format" });
      }
    } else {
      res.status(401).json({ error: "Invalid token format" });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Token exchange endpoint for J.A.R.V.I.S to get JAG tokens
app.post('/api/auth/token-exchange', async (req, res) => {
  console.log('=== Token Exchange Request ===');
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    const { targetApp } = req.body;
    const authHeader = req.headers.authorization;
    
    console.log('Token exchange parameters:', { 
      targetApp,
      authHeader: authHeader ? 'present' : 'missing'
    });
    
    if (targetApp !== 'inventory') {
      return res.status(400).json({ error: "Only inventory app access is supported" });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Bearer token required" });
    }

    const idToken = authHeader.substring(7); // Remove "Bearer " prefix
    
    console.log('ID Token (first 100 chars):', idToken.substring(0, 100) + '...');
    
    // Decode the ID token to check its contents
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const isExpired = payload.exp < (Date.now() / 1000);
        console.log('ID Token payload:', {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: new Date(payload.exp * 1000).toISOString(),
          iat: new Date(payload.iat * 1000).toISOString(),
          now: new Date().toISOString(),
          isExpired
        });
        
        // Check if token is expired before attempting exchange
        if (isExpired) {
          console.error('ID token is expired');
          return res.status(401).json({ 
            error: 'Token expired', 
            details: 'ID token has expired, please re-authenticate',
            shouldReauth: true 
          });
        }
      }
    } catch (decodeError) {
      console.error('Failed to decode ID token:', decodeError);
    }
    
    // Get Okta configuration from environment
    const oktaDomainRaw = process.env.OKTA_DOMAIN || "fcxdemo.okta.com";
    const authServer = process.env.OKTA_AUTHORIZATION_SERVER || "https://fcxdemo.okta.com/oauth2";
    const oktaDomain = authServer.includes('://') ? authServer.split('://')[1].split('/')[0] : oktaDomainRaw;
    const jarvisClientId = process.env.JARVIS_CLIENT_ID || "0oau8wb0eiLgOCT1X697";
    const jarvisClientSecret = process.env.JARVIS_CLIENT_SECRET || "e6DQE5cSnD3qCYx6BpfBDLzNgZrI-wRobgrcpz4ylyKfBhv7ljkRZcrLuTk_Innt";
    const audience = process.env.AUDIENCE || "http://localhost:5001";
    
    console.log('Using Okta configuration for token exchange:', { 
      oktaDomain, 
      jarvisClientId: jarvisClientId.substring(0, 10) + '...',
      audience 
    });

    // Exchange JAG token using OAuth 2.0 Token Exchange (RFC 8693)
    const tokenUrl = `https://${oktaDomain}/oauth2/v1/token`;
    console.log('Token exchange URL:', tokenUrl);
    
    // Prepare the exact same request format as the working curl
    const params = {
      'grant_type': 'urn:ietf:params:oauth:grant-type:token-exchange',
      'requested_token_type': 'urn:ietf:params:oauth:token-type:id-jag',
      'subject_token': idToken,
      'subject_token_type': 'urn:ietf:params:oauth:token-type:id_token',
      'audience': audience,
      'client_id': jarvisClientId,
      'client_secret': jarvisClientSecret
    };
    
    console.log('Token exchange request parameters:');
    for (const [key, value] of Object.entries(params)) {
      console.log(`  ${key}: ${key === 'subject_token' ? value.substring(0, 50) + '...' : value}`);
    }
    
    // Create URLSearchParams exactly like curl's --data-urlencode
    const requestBody = new URLSearchParams(params);
    console.log('Request body string length:', requestBody.toString().length);
    
    try {
      // Try the exact same approach as the working oktaService implementation
      console.log('Making token exchange request with body as string:', requestBody.toString());
      
      // Test with axios first like the working implementation
      let response;
      try {
        console.log('Attempting with axios (like working implementation)...');
        
        // Import axios dynamically for Vercel compatibility
        const axios = (await import('axios')).default;
        
        const axiosResponse = await axios.post(tokenUrl, requestBody.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        });
        
        console.log('Axios token exchange successful, status:', axiosResponse.status);
        const exchangeResult = axiosResponse.data;
        
        res.json({
          success: true,
          jagToken: exchangeResult.access_token,
          expiresIn: exchangeResult.expires_in || 3600,
          tokenType: exchangeResult.token_type || 'Bearer',
          issuedTokenType: exchangeResult.issued_token_type,
        });
        return;
        
      } catch (axiosError) {
        console.error('Axios failed, falling back to fetch:', axiosError.response?.data || axiosError.message);
        
        // Fallback to fetch like the working implementation
        response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: requestBody // Use URLSearchParams object for fetch fallback
        });
      }

      console.log('Token exchange response status:', response.status);

      console.log('Token exchange response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        
        // Check if it's a login_required error - token might be expired
        if (errorText.includes('login_required')) {
          return res.status(401).json({ 
            error: 'Token expired', 
            details: 'ID token has expired, please re-authenticate',
            shouldReauth: true 
          });
        }
        
        return res.status(401).json({ error: 'Token exchange failed', details: errorText });
      }

      const exchangeResult = await response.json();
      console.log('Token exchange successful, received JAG token');
      
      res.json({
        success: true,
        jagToken: exchangeResult.access_token,
        expiresIn: exchangeResult.expires_in || 3600,
        tokenType: exchangeResult.token_type || 'Bearer',
        issuedTokenType: exchangeResult.issued_token_type,
      });
    } catch (fetchError) {
      console.error('Fetch error during token exchange:', fetchError);
      return res.status(500).json({ error: 'Network error during token exchange' });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

// Inventory endpoints
app.get('/api/warehouses', (req, res) => {
  const warehouses = Array.from(storage.warehouses.values());
  res.json(warehouses);
});

app.get('/api/inventory/:warehouseId', (req, res) => {
  const { warehouseId } = req.params;
  const items = Array.from(storage.inventoryItems.values())
    .filter(item => item.warehouseId === warehouseId);
  res.json(items);
});

// MCP endpoints (both /oauth2 and /api/oauth2 for compatibility)
const handleOAuth2Token = (req, res) => {
  try {
    console.log('🔑 OAuth2 Token Request');
    
    // Check Basic Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Basic authentication required'
      });
    }
    
    // Decode Basic Auth
    const base64 = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');
    
    // Validate client credentials
    const validClientId = process.env.MCP_SERVER_CLIENT_ID || 'mcp_inventory_server_001';
    const validClientSecret = process.env.MCP_SERVER_CLIENT_SECRET || 'mcp_server_secret_2024_inventory_access';
    
    if (clientId !== validClientId || clientSecret !== validClientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }
    
    const { grant_type, assertion } = req.body;
    
    console.log('📋 Grant type:', grant_type);
    console.log('🎫 JAG token received');
    
    // Validate grant type
    if (grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
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
    
    // Basic JWT validation
    const parts = assertion.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid JWT format'
      });
    }
    
    // Generate access token
    const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    console.log('✅ Generated MCP access token');
    
    return res.status(200).json({
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: 86400,
      scope: 'inventory:read'
    });
    
  } catch (error) {
    console.error('❌ OAuth Token Error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
};

// Register both endpoints
app.post('/oauth2/token', handleOAuth2Token);
app.post('/api/oauth2/token', handleOAuth2Token);

const handleMcpInventoryQuery = (req, res) => {
  try {
    console.log('🔍 MCP Inventory Query Request');
    console.log('📋 Request body:', req.body);
    
    // Check Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Bearer token required'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // Handle both old format (type/filters) and new format (query)
    const { type, filters, query } = req.body;
    const searchQuery = query || '';
    
    console.log('🔍 Query:', searchQuery);
    console.log('🔍 Type:', type);
    console.log('🔍 Filters:', filters);
    
    // Get all warehouses
    let warehouses = Array.from(storage.warehouses.values());
    
    // Filter warehouses based on query OR type/filters
    if (searchQuery) {
      if (searchQuery.toLowerCase().includes('california') || searchQuery.toLowerCase().includes('west coast')) {
        warehouses = warehouses.filter(w => w.state === 'California');
        console.log('📦 Filtering for California warehouses (query)');
      } else if (searchQuery.toLowerCase().includes('texas') || searchQuery.toLowerCase().includes('central')) {
        warehouses = warehouses.filter(w => w.state === 'Texas');  
        console.log('📦 Filtering for Texas warehouses (query)');
      } else if (searchQuery.toLowerCase().includes('nevada') || searchQuery.toLowerCase().includes('mountain')) {
        warehouses = warehouses.filter(w => w.state === 'Nevada');
        console.log('📦 Filtering for Nevada warehouses (query)');
      }
    } else if (type === 'warehouse' && filters?.state) {
      warehouses = warehouses.filter(w => w.state === filters.state);
      console.log(`📦 Filtering for warehouse state: ${filters.state} (type)`);
    }
    
    // Build response - match InventoryData interface
    const result = warehouses.map(warehouse => {
      const items = Array.from(storage.inventoryItems.values())
        .filter(item => item.warehouseId === warehouse.id);
      
      const lowStockItems = items.filter(item => item.quantity <= item.minStock);
      
      return {
        warehouse: {
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.location,
          state: warehouse.state
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.id,
          category: item.category,
          quantity: item.quantity,
          minStockLevel: item.minStock,
          price: item.price
        })),
        totalItems: items.length,
        lowStockItems: lowStockItems.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.id,
          quantity: item.quantity,
          minStockLevel: item.minStock
        }))
      };
    });
    
    console.log(`✅ Returning ${result.length} warehouses with inventory data`);
    
    // Return the array directly (frontend expects InventoryData[])
    return res.status(200).json({
      success: true,
      data: result, // This should be InventoryData[]
      query: searchQuery,
      timestamp: new Date().toISOString(),
      count: result.length
    });
    
  } catch (error) {
    console.error('❌ MCP Query Error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: error.message
    });
  }
};

// Register both endpoints 
app.post('/mcp/inventory/query', handleMcpInventoryQuery);
app.post('/api/mcp/inventory/query', handleMcpInventoryQuery);

// External MCP endpoint
app.post('/mcp/external/token', (req, res) => {
  res.json({
    token_type: 'Bearer',
    access_token: 'external_mcp_token_' + Date.now(),
    expires_in: 3600
  });
});

// Health check
app.get('/mcp/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    warehouses: storage.warehouses.size,
    inventoryItems: storage.inventoryItems.size
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;