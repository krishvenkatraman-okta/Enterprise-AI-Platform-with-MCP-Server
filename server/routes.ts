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

  // Jarvis cross-app inventory access
  app.get("/api/jarvis/inventory", authenticateToken, requireJarvisAccess, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all warehouses and their inventory
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
