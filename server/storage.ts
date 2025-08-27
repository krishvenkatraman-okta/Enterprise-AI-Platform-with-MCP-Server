import { 
  type User, type InsertUser, type Warehouse, type InsertWarehouse,
  type InventoryItem, type InsertInventoryItem, type AuthSession, type InsertAuthSession,
  type TokenExchangeLog, type InsertTokenExchangeLog
} from "@shared/types";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOktaId(oktaUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Warehouse management
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;

  // Inventory management
  getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;
  getInventoryBySku(sku: string): Promise<InventoryItem[]>;

  // Auth session management
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSession(sessionId: string): Promise<AuthSession | undefined>;
  updateAuthSession(sessionId: string, session: Partial<InsertAuthSession>): Promise<AuthSession>;
  deleteAuthSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): Promise<AuthSession[]>;

  // Token exchange logging
  logTokenExchange(log: InsertTokenExchangeLog): Promise<TokenExchangeLog>;
  getTokenExchangeHistory(userId: string): Promise<TokenExchangeLog[]>;
}

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private warehouses: Map<string, Warehouse> = new Map();
  private inventoryItems: Map<string, InventoryItem> = new Map();
  private authSessions: Map<string, AuthSession> = new Map();
  private tokenExchangeLog: TokenExchangeLog[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default warehouses
    const californiaWarehouse: Warehouse = {
      id: "warehouse-ca-001",
      name: "West Coast Distribution",
      location: "Los Angeles, CA",
      state: "California",
      active: true,
      createdAt: new Date()
    };

    const texasWarehouse: Warehouse = {
      id: "warehouse-tx-001", 
      name: "Central Distribution Hub",
      location: "Austin, TX",
      state: "Texas",
      active: true,
      createdAt: new Date()
    };

    const nevadaWarehouse: Warehouse = {
      id: "warehouse-nv-001",
      name: "Desert Springs Depot",
      location: "Las Vegas, NV", 
      state: "Nevada",
      active: true,
      createdAt: new Date()
    };

    this.warehouses.set(californiaWarehouse.id, californiaWarehouse);
    this.warehouses.set(texasWarehouse.id, texasWarehouse);
    this.warehouses.set(nevadaWarehouse.id, nevadaWarehouse);

    // Create default inventory for California
    const californiaInventory: InventoryItem[] = [
      {
        id: "item-ca-001",
        warehouseId: californiaWarehouse.id,
        name: "Premium Cola Classic",
        sku: "COLA-PREM-001",
        category: "Soft Drinks",
        quantity: 150,
        minStockLevel: 50,
        price: 2.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-ca-002",
        warehouseId: californiaWarehouse.id,
        name: "Craft IPA Selection",
        sku: "BEER-IPA-001",
        category: "Alcoholic Beverages",
        quantity: 45,
        minStockLevel: 25,
        price: 8.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-ca-003",
        warehouseId: californiaWarehouse.id,
        name: "Energy Boost Original",
        sku: "ENERGY-ORIG-001",
        category: "Energy Drinks",
        quantity: 200,
        minStockLevel: 75,
        price: 3.49,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-ca-004",
        warehouseId: californiaWarehouse.id,
        name: "Sparkling Water Lemon",
        sku: "WATER-SPARK-001",
        category: "Water",
        quantity: 30,
        minStockLevel: 50,
        price: 1.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-ca-005",
        warehouseId: californiaWarehouse.id,
        name: "Organic Green Tea",
        sku: "TEA-GREEN-001",
        category: "Tea",
        quantity: 80,
        minStockLevel: 40,
        price: 4.99,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create default inventory for Texas
    const texasInventory: InventoryItem[] = [
      {
        id: "item-tx-001",
        warehouseId: texasWarehouse.id,
        name: "Sweet Tea Southern Style",
        sku: "TEA-SWEET-001",
        category: "Tea",
        quantity: 120,
        minStockLevel: 60,
        price: 2.49,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-tx-002",
        warehouseId: texasWarehouse.id,
        name: "Local Root Beer",
        sku: "SODA-ROOT-001",
        category: "Soft Drinks",
        quantity: 85,
        minStockLevel: 40,
        price: 3.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-tx-003",
        warehouseId: texasWarehouse.id,
        name: "Sports Hydration Blue",
        sku: "SPORTS-HYD-001",
        category: "Sports Drinks",
        quantity: 180,
        minStockLevel: 80,
        price: 2.79,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-tx-004",
        warehouseId: texasWarehouse.id,
        name: "BBQ Cola Limited",
        sku: "COLA-BBQ-001",
        category: "Soft Drinks",
        quantity: 25,
        minStockLevel: 30,
        price: 4.49,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create default inventory for Nevada
    const nevadaInventory: InventoryItem[] = [
      {
        id: "item-nv-001",
        warehouseId: nevadaWarehouse.id,
        name: "Desert Spring Water",
        sku: "WATER-SPRING-001",
        category: "Water",
        quantity: 300,
        minStockLevel: 100,
        price: 1.49,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-nv-002", 
        warehouseId: nevadaWarehouse.id,
        name: "Premium Mixer Tonic",
        sku: "MIXER-TONIC-001",
        category: "Mixers",
        quantity: 75,
        minStockLevel: 35,
        price: 5.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-nv-003",
        warehouseId: nevadaWarehouse.id,
        name: "Luxury Vodka Selection",
        sku: "VODKA-LUX-001", 
        category: "Spirits",
        quantity: 40,
        minStockLevel: 20,
        price: 89.99,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "item-nv-004",
        warehouseId: nevadaWarehouse.id,
        name: "Casino Energy Rush",
        sku: "ENERGY-CASINO-001",
        category: "Energy Drinks",
        quantity: 15,
        minStockLevel: 25,
        price: 4.99,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Store all inventory items
    [...californiaInventory, ...texasInventory, ...nevadaInventory].forEach(item => {
      this.inventoryItems.set(item.id, item);
    });

    console.log('✅ Memory storage initialized with demo data:');
    console.log(`   - ${this.warehouses.size} warehouses`);
    console.log(`   - ${this.inventoryItems.size} inventory items`);
  }
  // User management
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserByOktaId(oktaUserId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.oktaUserId === oktaUserId) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...updateUser,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Warehouse management
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).filter(w => w.active);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const warehouse: Warehouse = {
      id: randomUUID(),
      ...insertWarehouse,
      createdAt: new Date()
    };
    this.warehouses.set(warehouse.id, warehouse);
    return warehouse;
  }

  // Inventory management
  async getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.warehouseId === warehouseId);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const item: InventoryItem = {
      id: randomUUID(),
      ...insertItem,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.inventoryItems.set(item.id, item);
    return item;
  }

  async updateInventoryItem(id: string, updateItem: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) {
      throw new Error(`Inventory item with id ${id} not found`);
    }
    
    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updateItem,
      updatedAt: new Date()
    };
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    this.inventoryItems.delete(id);
  }

  async getInventoryBySku(sku: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.sku === sku);
  }

  // Auth session management
  async createAuthSession(insertSession: InsertAuthSession): Promise<AuthSession> {
    const session: AuthSession = {
      id: randomUUID(),
      ...insertSession,
      createdAt: new Date()
    };
    this.authSessions.set(session.sessionId, session);
    return session;
  }

  async getAuthSession(sessionId: string): Promise<AuthSession | undefined> {
    return this.authSessions.get(sessionId);
  }

  async updateAuthSession(sessionId: string, updateSession: Partial<InsertAuthSession>): Promise<AuthSession> {
    const existingSession = this.authSessions.get(sessionId);
    if (!existingSession) {
      throw new Error(`Auth session with sessionId ${sessionId} not found`);
    }
    
    const updatedSession: AuthSession = {
      ...existingSession,
      ...updateSession
    };
    
    this.authSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteAuthSession(sessionId: string): Promise<void> {
    this.authSessions.delete(sessionId);
  }

  async getUserSessions(userId: string): Promise<AuthSession[]> {
    return Array.from(this.authSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Token exchange logging
  async logTokenExchange(insertLog: InsertTokenExchangeLog): Promise<TokenExchangeLog> {
    const log: TokenExchangeLog = {
      id: randomUUID(),
      ...insertLog,
      createdAt: new Date()
    };
    this.tokenExchangeLog.push(log);
    return log;
  }

  async getTokenExchangeHistory(userId: string): Promise<TokenExchangeLog[]> {
    return this.tokenExchangeLog
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemoryStorage();
