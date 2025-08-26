import express from 'express';
import { storage } from './storage';
import { oktaService } from './services/okta';

const app = express();
app.use(express.json());

// MCP Server Configuration for LLM Client
const MCP_CLIENT_CONFIG = {
  clientId: process.env.MCP_CLIENT_ID || 'mcp_llm_client_001',
  clientSecret: process.env.MCP_CLIENT_SECRET || 'mcp_secret_for_llm_communication_2024',
  audience: 'mcp-inventory-access'
};

interface MCPTokenExchangeRequest {
  jagToken: string;
  clientId: string;
  clientSecret: string;
}

interface InventoryQuery {
  type: 'warehouse' | 'all_inventory' | 'low_stock';
  filters?: {
    state?: string;
    warehouseName?: string;
    category?: string;
  };
}

// MCP Token Exchange Endpoint - JAG Token → Application Token
app.post('/mcp/auth/token-exchange', async (req, res) => {
  try {
    const { jagToken, clientId, clientSecret }: MCPTokenExchangeRequest = req.body;
    
    if (!jagToken || !clientId || !clientSecret) {
      return res.status(400).json({ 
        error: 'missing_credentials',
        message: 'JAG token, client ID, and client secret are required' 
      });
    }

    // Validate MCP client credentials
    if (clientId !== MCP_CLIENT_CONFIG.clientId || clientSecret !== MCP_CLIENT_CONFIG.clientSecret) {
      return res.status(401).json({ 
        error: 'invalid_client',
        message: 'Invalid MCP client credentials' 
      });
    }

    // Validate JAG token format (basic validation)
    if (!jagToken.startsWith('eyJ')) {
      return res.status(401).json({ 
        error: 'invalid_jag_token',
        message: 'Invalid JAG token format' 
      });
    }

    // Generate MCP Application Token
    const mcpApplicationToken = `mcp_app_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    console.log('=== MCP Token Exchange ===');
    console.log(`JAG Token (preview): ${jagToken.substring(0, 50)}...`);
    console.log(`MCP Client: ${clientId}`);
    console.log(`MCP App Token: ${mcpApplicationToken}`);
    console.log('============================');

    res.json({
      success: true,
      applicationToken: mcpApplicationToken,
      tokenType: 'mcp_application_token',
      audience: MCP_CLIENT_CONFIG.audience,
      expiresIn: 3600,
      scope: 'inventory:read warehouse:read'
    });
  } catch (error) {
    console.error('MCP token exchange error:', error);
    res.status(500).json({ 
      error: 'token_exchange_failed',
      message: 'Internal server error during token exchange' 
    });
  }
});

// MCP Inventory Query Endpoint - Requires MCP Application Token
app.post('/mcp/inventory/query', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const mcpToken = authHeader?.replace('Bearer ', '');
    
    if (!mcpToken || !mcpToken.startsWith('mcp_app_')) {
      return res.status(401).json({ 
        error: 'unauthorized',
        message: 'Valid MCP application token required' 
      });
    }

    const query: InventoryQuery = req.body;
    
    console.log('=== MCP Inventory Query ===');
    console.log(`MCP Token: ${mcpToken.substring(0, 25)}...`);
    console.log(`Query Type: ${query.type}`);
    console.log(`Filters:`, query.filters);
    console.log('===========================');

    let responseData;

    switch (query.type) {
      case 'warehouse':
        if (query.filters?.state) {
          const warehouses = await storage.getWarehouses();
          const warehouse = warehouses.find(w => w.state === query.filters?.state);
          
          if (warehouse) {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            responseData = {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          } else {
            return res.status(404).json({ 
              error: 'warehouse_not_found',
              message: `No warehouse found for state: ${query.filters.state}` 
            });
          }
        } else {
          return res.status(400).json({ 
            error: 'missing_filter',
            message: 'State filter required for warehouse query' 
          });
        }
        break;

      case 'all_inventory':
        const warehouses = await storage.getWarehouses();
        responseData = await Promise.all(
          warehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            return {
              warehouse,
              items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
            };
          })
        );
        break;

      case 'low_stock':
        const allWarehouses = await storage.getWarehouses();
        const lowStockData = await Promise.all(
          allWarehouses.map(async (warehouse) => {
            const items = await storage.getInventoryByWarehouse(warehouse.id);
            const lowStockItems = items.filter(item => item.quantity <= (item.minStockLevel || 0));
            return {
              warehouse: warehouse.name,
              lowStockItems: lowStockItems.map(item => ({
                ...item,
                warehouseName: warehouse.name
              }))
            };
          })
        );
        responseData = lowStockData.filter(w => w.lowStockItems.length > 0);
        break;

      default:
        return res.status(400).json({ 
          error: 'invalid_query_type',
          message: 'Supported query types: warehouse, all_inventory, low_stock' 
        });
    }

    res.json({
      success: true,
      queryType: query.type,
      data: responseData,
      timestamp: new Date().toISOString(),
      source: 'mcp-inventory-server'
    });

  } catch (error) {
    console.error('MCP inventory query error:', error);
    res.status(500).json({ 
      error: 'query_failed',
      message: 'Internal server error during inventory query' 
    });
  }
});

// MCP Server Health Check
app.get('/mcp/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-inventory-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: ['token_exchange', 'inventory_query', 'warehouse_lookup']
  });
});

// MCP Configuration Endpoint (for client discovery)
app.get('/mcp/config', (req, res) => {
  res.json({
    clientId: MCP_CLIENT_CONFIG.clientId,
    audience: MCP_CLIENT_CONFIG.audience,
    endpoints: {
      tokenExchange: '/mcp/auth/token-exchange',
      inventoryQuery: '/mcp/inventory/query',
      health: '/mcp/health'
    },
    supportedQueries: ['warehouse', 'all_inventory', 'low_stock'],
    tokenType: 'mcp_application_token'
  });
});

export { app as mcpServer, MCP_CLIENT_CONFIG };