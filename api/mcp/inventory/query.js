// Vercel Serverless Function for MCP Inventory Query Endpoint
// URL: /api/mcp/inventory/query
// Requires Bearer token from /api/oauth2/token

// Demo inventory data - matches server/mcp-server.ts
const DEMO_WAREHOUSES = new Map([
  ['warehouse-ca-001', {
    id: 'warehouse-ca-001',
    name: 'West Coast Distribution',
    location: 'Los Angeles, CA',
    state: 'California',
    active: true,
    createdAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['warehouse-tx-001', {
    id: 'warehouse-tx-001', 
    name: 'Central Distribution Hub',
    location: 'Austin, TX',
    state: 'Texas',
    active: true,
    createdAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['warehouse-nv-001', {
    id: 'warehouse-nv-001',
    name: 'Desert Springs Depot',
    location: 'Las Vegas, NV', 
    state: 'Nevada',
    active: true,
    createdAt: new Date('2025-08-29T02:26:57.104Z')
  }]
]);

const DEMO_INVENTORY = new Map([
  // California items
  ['item-ca-001', {
    id: 'item-ca-001',
    warehouseId: 'warehouse-ca-001',
    name: 'Premium Cola Classic',
    sku: 'COLA-PREM-001',
    category: 'Soft Drinks',
    quantity: 150,
    minStockLevel: 50,
    price: 2.99,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['item-ca-002', {
    id: 'item-ca-002',
    warehouseId: 'warehouse-ca-001',
    name: 'Craft IPA Selection',
    sku: 'BEER-IPA-001',
    category: 'Alcoholic Beverages',
    quantity: 45,
    minStockLevel: 25,
    price: 8.99,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['item-ca-003', {
    id: 'item-ca-003',
    warehouseId: 'warehouse-ca-001',
    name: 'Energy Boost Original',
    sku: 'ENERGY-ORIG-001',
    category: 'Energy Drinks',
    quantity: 200,
    minStockLevel: 75,
    price: 3.49,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['item-ca-004', {
    id: 'item-ca-004',
    warehouseId: 'warehouse-ca-001',
    name: 'Sparkling Water Lemon',
    sku: 'WATER-SPARK-001',
    category: 'Water',
    quantity: 30,
    minStockLevel: 50,
    price: 1.99,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['item-ca-005', {
    id: 'item-ca-005',
    warehouseId: 'warehouse-ca-001',
    name: 'Organic Green Tea',
    sku: 'TEA-GREEN-001',
    category: 'Tea',
    quantity: 80,
    minStockLevel: 40,
    price: 4.99,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  // Texas items
  ['item-tx-001', {
    id: 'item-tx-001',
    warehouseId: 'warehouse-tx-001',
    name: 'Diet Cola Zero',
    sku: 'COLA-DIET-001',
    category: 'Soft Drinks',
    quantity: 190,
    minStockLevel: 60,
    price: 2.89,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  ['item-tx-002', {
    id: 'item-tx-002',
    warehouseId: 'warehouse-tx-001',
    name: 'Sports Recovery Drink',
    sku: 'SPORTS-REC-001',
    category: 'Sports Drinks',
    quantity: 120,
    minStockLevel: 45,
    price: 3.79,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }],
  // Nevada items
  ['item-nv-001', {
    id: 'item-nv-001',
    warehouseId: 'warehouse-nv-001',
    name: 'Desert Spring Water',
    sku: 'WATER-SPRING-001',
    category: 'Water',
    quantity: 300,
    minStockLevel: 100,
    price: 1.49,
    createdAt: new Date('2025-08-29T02:26:57.104Z'),
    updatedAt: new Date('2025-08-29T02:26:57.104Z')
  }]
]);

// Get inventory items for a warehouse
function getInventoryByWarehouse(warehouseId) {
  const items = [];
  for (const [itemId, item] of DEMO_INVENTORY) {
    if (item.warehouseId === warehouseId) {
      items.push(item);
    }
  }
  return items;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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
    console.log('📦 MCP Inventory Query Request (Vercel)');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Validate Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Bearer token required'
      });
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    console.log(`🎫 Access token: ${accessToken.substring(0, 20)}...`);
    
    const { type, filters = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Query type is required'
      });
    }
    
    console.log(`📋 Query type: ${type}`);
    console.log(`🔍 Filters:`, filters);
    
    let responseData;
    
    switch (type) {
      case 'warehouse':
        if (filters.state) {
          // Find warehouse by state
          let warehouse = null;
          for (const [warehouseId, warehouseData] of DEMO_WAREHOUSES) {
            if (warehouseData.state === filters.state) {
              warehouse = warehouseData;
              break;
            }
          }
          
          if (warehouse) {
            const items = getInventoryByWarehouse(warehouse.id);
            responseData = {
              warehouses: [warehouse],
              items: items,
              totalItems: items.length,
              lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0))
            };
          } else {
            return res.status(404).json({ 
              error: 'warehouse_not_found',
              message: `No warehouse found for state: ${filters.state}` 
            });
          }
        } else {
          // Return all warehouses
          responseData = {
            warehouses: Array.from(DEMO_WAREHOUSES.values()),
            items: Array.from(DEMO_INVENTORY.values()),
            totalItems: DEMO_INVENTORY.size,
            lowStockItems: Array.from(DEMO_INVENTORY.values()).filter(item => item.quantity <= (item.minStockLevel || 0))
          };
        }
        break;
        
      case 'all_inventory':
        responseData = {
          warehouses: Array.from(DEMO_WAREHOUSES.values()),
          items: Array.from(DEMO_INVENTORY.values()),
          totalItems: DEMO_INVENTORY.size,
          lowStockItems: Array.from(DEMO_INVENTORY.values()).filter(item => item.quantity <= (item.minStockLevel || 0))
        };
        break;
        
      case 'low_stock':
        const lowStockItems = Array.from(DEMO_INVENTORY.values()).filter(item => item.quantity <= (item.minStockLevel || 0));
        responseData = {
          warehouses: [],
          items: lowStockItems,
          totalItems: lowStockItems.length,
          lowStockItems: lowStockItems
        };
        break;
        
      default:
        return res.status(400).json({
          error: 'unsupported_query_type',
          message: `Query type '${type}' is not supported. Supported types: warehouse, all_inventory, low_stock`
        });
    }
    
    console.log(`✅ Returning ${responseData.items.length} items from ${responseData.warehouses.length} warehouses`);
    
    return res.status(200).json({
      success: true,
      queryType: type,
      data: responseData,
      timestamp: new Date().toISOString(),
      source: 'mcp-inventory-server-vercel'
    });

  } catch (error) {
    console.error('❌ MCP Inventory Query Error:', error.message);
    
    return res.status(500).json({ 
      error: 'query_failed',
      message: 'Internal server error during inventory query' 
    });
  }
}