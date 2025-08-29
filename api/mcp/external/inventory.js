// Demo inventory data
const DEMO_WAREHOUSES = [
  {
    id: 'wh_california_001',
    name: 'West Coast Distribution',
    location: 'Los Angeles, CA',
    manager: 'Sarah Chen',
    items: [
      { id: 'bev_001', name: 'Premium Coffee Blend', category: 'Hot Beverages', stock: 245, location: 'A1-B3', lastRestocked: '2024-08-15' },
      { id: 'bev_002', name: 'Organic Green Tea', category: 'Hot Beverages', stock: 180, location: 'A1-C2', lastRestocked: '2024-08-10' },
      { id: 'bev_003', name: 'Sparkling Water - Lemon', category: 'Cold Beverages', stock: 420, location: 'B2-A1', lastRestocked: '2024-08-20' },
      { id: 'bev_004', name: 'Energy Drink - Berry', category: 'Energy Drinks', stock: 315, location: 'B2-C3', lastRestocked: '2024-08-18' }
    ]
  },
  {
    id: 'wh_texas_002',
    name: 'Central Hub Logistics',
    location: 'Austin, TX',
    manager: 'Mike Rodriguez',
    items: [
      { id: 'bev_005', name: 'Cold Brew Coffee', category: 'Cold Beverages', stock: 290, location: 'C1-A2', lastRestocked: '2024-08-12' },
      { id: 'bev_006', name: 'Herbal Tea Mix', category: 'Hot Beverages', stock: 155, location: 'C1-B1', lastRestocked: '2024-08-08' },
      { id: 'bev_007', name: 'Sports Drink - Orange', category: 'Sports Drinks', stock: 380, location: 'C2-A3', lastRestocked: '2024-08-16' },
      { id: 'bev_008', name: 'Protein Shake - Vanilla', category: 'Protein Beverages', stock: 225, location: 'C2-B2', lastRestocked: '2024-08-14' },
      { id: 'bev_009', name: 'Coconut Water', category: 'Natural Beverages', stock: 190, location: 'C3-A1', lastRestocked: '2024-08-11' }
    ]
  },
  {
    id: 'wh_nevada_003',
    name: 'Mountain State Storage',
    location: 'Las Vegas, NV',
    manager: 'Jessica Park',
    items: [
      { id: 'bev_010', name: 'Alkaline Water', category: 'Premium Water', stock: 340, location: 'D1-A1', lastRestocked: '2024-08-19' },
      { id: 'bev_011', name: 'Kombucha - Ginger', category: 'Fermented Beverages', stock: 125, location: 'D1-B3', lastRestocked: '2024-08-13' },
      { id: 'bev_012', name: 'Fresh Juice - Apple', category: 'Fresh Juices', stock: 95, location: 'D2-A2', lastRestocked: '2024-08-17' },
      { id: 'bev_013', name: 'Electrolyte Drink', category: 'Sports Drinks', stock: 275, location: 'D2-C1', lastRestocked: '2024-08-21' }
    ]
  }
];

module.exports = function(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('External MCP Request');
    
    // Simple token check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({error: 'unauthorized'});
    }
    
    const query = req.body?.query || req.query?.query || '';
    console.log('Query:', query);
    
    // Filter data
    let result = DEMO_WAREHOUSES;
    
    if (query.toLowerCase().includes('california')) {
      result = [DEMO_WAREHOUSES[0]];
    } else if (query.toLowerCase().includes('texas')) {
      result = [DEMO_WAREHOUSES[1]];
    } else if (query.toLowerCase().includes('nevada')) {
      result = [DEMO_WAREHOUSES[2]];
    }
    
    return res.status(200).json({
      success: true,
      data: result,
      query: query
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: error.message
    });
  }
};