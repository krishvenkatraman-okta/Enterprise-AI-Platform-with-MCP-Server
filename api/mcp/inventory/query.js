const DEMO_DATA = [
  {
    id: 'wh_california_001',
    name: 'West Coast Distribution',
    location: 'Los Angeles, CA',
    manager: 'Sarah Chen',
    items: [
      { id: 'bev_001', name: 'Premium Coffee Blend', category: 'Hot Beverages', stock: 245 },
      { id: 'bev_002', name: 'Organic Green Tea', category: 'Hot Beverages', stock: 180 },
      { id: 'bev_003', name: 'Sparkling Water - Lemon', category: 'Cold Beverages', stock: 420 },
      { id: 'bev_004', name: 'Energy Drink - Berry', category: 'Energy Drinks', stock: 315 }
    ]
  }
];

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('MCP Query Request');
    
    // Check auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({error: 'unauthorized'});
    }
    
    const query = req.body?.query || req.query?.query || '';
    
    return res.status(200).json({
      success: true,
      data: DEMO_DATA,
      query: query
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: error.message
    });
  }
}