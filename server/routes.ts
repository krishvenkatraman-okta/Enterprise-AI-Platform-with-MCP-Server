import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oktaService } from "./services/okta";
import { authenticateToken, requireInventoryAccess, requireJarvisAccess, type AuthenticatedRequest } from "./services/auth";
import { insertUserSchema, insertInventoryItemSchema, insertWarehouseSchema } from "@shared/types";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Memory storage automatically initializes with default data

  // Configuration endpoint for frontend
  app.get("/api/config", (req, res) => {
    res.json({
      okta: {
        domain: process.env.OKTA_DOMAIN || "fcxdemo.okta.com",
        authorizationServer: process.env.OKTA_AUTHORIZATION_SERVER || "https://fcxdemo.okta.com/oauth2",
        inventoryClientId: process.env.INVENTORY_CLIENT_ID || "0oau8x7jn10yYmlhw697",
        jarvisClientId: process.env.JARVIS_CLIENT_ID || "0oau8wb0eiLgOCT1X697"
      }
    });
  });

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
      
      // Token exchange debugging (can be enabled when needed)
      // console.log('=== Token Exchange Debug ===');
      // console.log('ID token length:', req.session!.idToken.length);
      
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

  // Inventory app token exchange endpoint
  app.post('/api/inventory/token-exchange', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { jagToken } = req.body;
      
      if (!jagToken) {
        return res.status(400).json({ success: false, error: 'JAG token required' });
      }

      // Simulate inventory application token exchange
      // In real implementation, this would validate the JAG token and issue an app-specific token
      const applicationToken = `inv_app_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      console.log(`Inventory app token exchange: JAG token → Application token`);
      console.log(`JAG token preview: ${jagToken.substring(0, 50)}...`);
      console.log(`Application token: ${applicationToken}`);

      res.json({
        success: true,
        applicationToken: applicationToken,
        tokenType: 'inventory_access_token',
        expiresIn: 3600
      });
    } catch (error) {
      console.error('Inventory token exchange error:', error);
      res.status(500).json({ success: false, error: 'Token exchange failed' });
    }
  });

  // Jarvis cross-app inventory access - now uses application token for data access
  app.get("/api/jarvis/inventory", async (req, res) => {
    try {
      const applicationToken = req.headers['x-app-token'] as string;
      const authHeader = req.headers.authorization;
      
      if (!applicationToken && !authHeader) {
        return res.status(401).json({ error: "Application token or authentication required for inventory access" });
      }

      // Verify application token if provided, or fall back to regular auth
      if (applicationToken) {
        try {
          // Verify the application token is valid (basic check - in production you'd validate the token)
          if (!applicationToken.startsWith('inv_app_')) {
            throw new Error('Invalid application token format');
          }
          console.log(`Using application token for inventory access: ${applicationToken.substring(0, 20)}...`);
        } catch (error) {
          return res.status(401).json({ error: "Invalid application token" });
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


