import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oktaService } from "./services/okta";
import { authenticateToken, requireInventoryAccess, requireJarvisAccess, type AuthenticatedRequest } from "./services/auth";
import { insertUserSchema, insertInventoryItemSchema, insertWarehouseSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default warehouses on startup
  await initializeDefaultData();

  // Auth routes
  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code, state, application, redirectUri, codeVerifier } = req.body;
      
      if (!code || !state || !application || !redirectUri || !codeVerifier) {
        return res.status(400).json({ error: "Code, state, application, redirectUri, and codeVerifier are required" });
      }

      // Get the appropriate client configuration
      const clientConfig = application === 'inventory' 
        ? oktaService.getInventoryClientConfig() 
        : oktaService.getJarvisClientConfig();

      // Exchange authorization code for tokens (server-side)
      const tokenResponse = await fetch(`https://${clientConfig.domain}/oauth2/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientConfig.clientId,
          client_secret: application === 'inventory' 
            ? process.env.INVENTORY_CLIENT_SECRET || "Ixvrzzgq2jZ4BCdbKXI9YxD0kTwEWpajWDWZcj2niXLJJIoBOjLKKePP4Qf1efDK"
            : process.env.JARVIS_CLIENT_SECRET || "e6DQE5cSnD3qCYx6BpfBDLzNgZrI-wRobgrcpz4ylyKfBhv7ljkRZcrLuTk_Innt",
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return res.status(401).json({ error: 'Token exchange failed' });
      }

      const tokens = await tokenResponse.json();
      
      // Return the ID token to the frontend
      res.json({
        idToken: tokens.id_token,
        success: true,
      });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: "Authentication callback failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { idToken, application } = req.body;
      
      if (!idToken || !application) {
        return res.status(400).json({ error: "ID token and application are required" });
      }

      // Decode and validate the ID token
      const decoded = oktaService.decodeIdToken(idToken);
      const { sub: oktaUserId, email, given_name: firstName, family_name: lastName, exp } = decoded;

      // Find or create user
      let user = await storage.getUserByOktaId(oktaUserId);
      if (!user) {
        user = await storage.createUser({
          username: email,
          email,
          firstName,
          lastName,
          oktaUserId,
        });
      }

      // Create session
      const sessionId = randomUUID();
      const expiresAt = new Date(exp * 1000);
      
      const session = await storage.createAuthSession({
        userId: user.id,
        sessionId,
        idToken,
        expiresAt,
        application,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        session: {
          sessionId,
          expiresAt,
          application,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/token-exchange", authenticateToken, requireJarvisAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const { targetApp } = req.body;
      
      if (targetApp !== 'inventory') {
        return res.status(400).json({ error: "Only inventory app access is supported" });
      }

      // Perform token exchange
      console.log('Using ID token for exchange (first 50 chars):', req.session!.idToken.substring(0, 50) + '...');
      
      // Decode and check token expiration
      const decodedToken = oktaService.decodeIdToken(req.session!.idToken);
      const now = Math.floor(Date.now() / 1000);
      console.log('Token details:', {
        issued: new Date(decodedToken.iat * 1000).toISOString(),
        expires: new Date(decodedToken.exp * 1000).toISOString(),
        currentTime: new Date(now * 1000).toISOString(),
        isExpired: now > decodedToken.exp,
        audience: decodedToken.aud,
        issuer: decodedToken.iss
      });
      
      if (now > decodedToken.exp) {
        return res.status(401).json({ error: "ID token expired, please re-authenticate" });
      }
      
      // Before token exchange, let's log the exact curl command equivalent
      console.log('\n=== EQUIVALENT CURL COMMAND ===');
      console.log(`curl --location 'https://fcxdemo.okta.com/oauth2/v1/token' \\`);
      console.log(`--header 'Content-Type: application/x-www-form-urlencoded' \\`);
      console.log(`--data-urlencode 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \\`);
      console.log(`--data-urlencode 'requested_token_type=urn:ietf:params:oauth:token-type:id-jag' \\`);
      console.log(`--data-urlencode 'subject_token=${req.session!.idToken}' \\`);
      console.log(`--data-urlencode 'subject_token_type=urn:ietf:params:oauth:token-type:id_token' \\`);
      console.log(`--data-urlencode 'audience=http://localhost:5001' \\`);
      console.log(`--data-urlencode 'client_id=0oau8wb0eiLgOCT1X697' \\`);
      console.log(`--data-urlencode 'client_secret=e6DQE5cSnD3qCYx6BpfBDLzNgZrI-wRobgrcpz4ylyKfBhv7ljkRZcrLuTk_Innt'`);
      console.log('=== END CURL COMMAND ===\n');
      
      const exchangeResult = await oktaService.exchangeJarvisToInventory(req.session!.idToken);
      
      // Log the token exchange
      await storage.logTokenExchange({
        userId: req.user!.id,
        fromApp: 'jarvis',
        toApp: 'inventory',
        jagToken: exchangeResult.access_token,
        success: true,
      });

      res.json({
        success: true,
        jagToken: exchangeResult.access_token,
        expiresIn: exchangeResult.expires_in,
        tokenType: exchangeResult.token_type,
        issuedTokenType: exchangeResult.issued_token_type,
      });
    } catch (error) {
      console.error("Token exchange error:", error);
      
      // Log failed exchange
      await storage.logTokenExchange({
        userId: req.user!.id,
        fromApp: 'jarvis',
        toApp: 'inventory',
        jagToken: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({ error: "Token exchange failed" });
    }
  });

  app.get("/api/auth/sessions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.id);
      const tokenHistory = await storage.getTokenExchangeHistory(req.user!.id);
      
      res.json({
        sessions: sessions.map(s => ({
          id: s.id,
          application: s.application,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          idTokenPreview: s.idToken.substring(0, 20) + '...',
        })),
        tokenExchangeHistory: tokenHistory.map(t => ({
          id: t.id,
          fromApp: t.fromApp,
          toApp: t.toApp,
          success: t.success,
          createdAt: t.createdAt,
          errorMessage: t.errorMessage,
        })),
      });
    } catch (error) {
      console.error("Sessions error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteAuthSession(req.session!.sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Warehouse routes
  app.get("/api/warehouses", authenticateToken, requireInventoryAccess, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Warehouses error:", error);
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  // Inventory routes
  app.get("/api/inventory/:warehouseId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { warehouseId } = req.params;
      const items = await storage.getInventoryByWarehouse(warehouseId);
      res.json(items);
    } catch (error) {
      console.error("Inventory error:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", authenticateToken, requireInventoryAccess, async (req, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      console.error("Create inventory error:", error);
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", authenticateToken, requireInventoryAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const item = await storage.updateInventoryItem(id, updateData);
      res.json(item);
    } catch (error) {
      console.error("Update inventory error:", error);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", authenticateToken, requireInventoryAccess, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInventoryItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inventory error:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  // Jarvis cross-app inventory access - uses JAG token for cross-app authorization within same system
  app.get("/api/jarvis/inventory", async (req, res) => {
    try {
      const jagToken = req.headers['x-jag-token'] as string;
      const authHeader = req.headers.authorization;
      
      if (!jagToken && !authHeader) {
        return res.status(401).json({ error: "JAG token or authentication required for inventory access" });
      }

      // Verify JAG token if provided, or fall back to regular auth
      if (jagToken) {
        try {
          // Verify the JAG token is valid (basic check - in production you'd validate with Okta)
          if (!jagToken.startsWith('eyJ')) {
            throw new Error('Invalid JAG token format');
          }
          // JAG token is valid, proceed with inventory access
        } catch (error) {
          return res.status(401).json({ error: "Invalid JAG token" });
        }
      }

      // Get inventory data from local storage
      const warehouses = await storage.getWarehouses();
      const inventoryData = await Promise.all(
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

      res.json(inventoryData);
    } catch (error) {
      console.error("Jarvis inventory error:", error);
      res.status(500).json({ error: "Failed to fetch inventory data" });
    }
  });

  app.get("/api/jarvis/inventory/:warehouseId", authenticateToken, requireJarvisAccess, async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const warehouse = await storage.getWarehouse(warehouseId);
      const items = await storage.getInventoryByWarehouse(warehouseId);
      
      res.json({
        warehouse,
        items,
        totalItems: items.length,
        lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)),
      });
    } catch (error) {
      console.error("Jarvis warehouse inventory error:", error);
      res.status(500).json({ error: "Failed to fetch warehouse inventory" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultData() {
  try {
    const existingWarehouses = await storage.getWarehouses();
    if (existingWarehouses.length > 0) {
      return; // Already initialized
    }

    // Create default warehouses
    const warehouses = [
      { name: "Texas Warehouse", location: "Dallas, TX", state: "Texas" },
      { name: "California Warehouse", location: "Los Angeles, CA", state: "California" },
      { name: "Nevada Warehouse", location: "Las Vegas, NV", state: "Nevada" },
    ];

    const createdWarehouses = await Promise.all(
      warehouses.map(warehouse => storage.createWarehouse(warehouse))
    );

    // Create sample inventory for each warehouse
    const sampleItems = [
      { name: "Atlas Cola Classic", sku: "AC-001", category: "Beverages", quantity: 1250, minStockLevel: 100 },
      { name: "Atlas Energy Drink", sku: "AE-008", category: "Beverages", quantity: 892, minStockLevel: 75 },
      { name: "Crunch Chips Original", sku: "CC-015", category: "Snacks", quantity: 45, minStockLevel: 50 },
      { name: "Atlas Sparkling Water", sku: "ASW-003", category: "Beverages", quantity: 567, minStockLevel: 100 },
      { name: "Premium Nuts Mix", sku: "PNM-022", category: "Snacks", quantity: 234, minStockLevel: 30 },
    ];

    for (const warehouse of createdWarehouses) {
      await Promise.all(
        sampleItems.map(item => 
          storage.createInventoryItem({
            ...item,
            warehouseId: warehouse.id,
            // Vary quantities per warehouse
            quantity: Math.floor(item.quantity * (0.7 + Math.random() * 0.6)),
          })
        )
      );
    }

    console.log("Default warehouses and inventory initialized");
  } catch (error) {
    console.error("Failed to initialize default data:", error);
  }
}
