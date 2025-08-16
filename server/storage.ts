import { 
  users, warehouses, inventoryItems, authSessions, tokenExchangeLog,
  type User, type InsertUser, type Warehouse, type InsertWarehouse,
  type InventoryItem, type InsertInventoryItem, type AuthSession, type InsertAuthSession,
  type TokenExchangeLog, type InsertTokenExchangeLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByOktaId(oktaUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.oktaUserId, oktaUserId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Warehouse management
  async getWarehouses(): Promise<Warehouse[]> {
    return db.select().from(warehouses).where(eq(warehouses.active, true));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db
      .insert(warehouses)
      .values({ ...insertWarehouse, createdAt: new Date() })
      .returning();
    return warehouse;
  }

  // Inventory management
  async getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.warehouseId, warehouseId));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values({ ...insertItem, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updateItem: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [item] = await db
      .update(inventoryItems)
      .set({ ...updateItem, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getInventoryBySku(sku: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.sku, sku));
  }

  // Auth session management
  async createAuthSession(insertSession: InsertAuthSession): Promise<AuthSession> {
    const [session] = await db
      .insert(authSessions)
      .values({ ...insertSession, createdAt: new Date() })
      .returning();
    return session;
  }

  async getAuthSession(sessionId: string): Promise<AuthSession | undefined> {
    const [session] = await db.select().from(authSessions).where(eq(authSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateAuthSession(sessionId: string, updateSession: Partial<InsertAuthSession>): Promise<AuthSession> {
    const [session] = await db
      .update(authSessions)
      .set(updateSession)
      .where(eq(authSessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async deleteAuthSession(sessionId: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.sessionId, sessionId));
  }

  async getUserSessions(userId: string): Promise<AuthSession[]> {
    return db.select().from(authSessions)
      .where(eq(authSessions.userId, userId))
      .orderBy(desc(authSessions.createdAt));
  }

  // Token exchange logging
  async logTokenExchange(insertLog: InsertTokenExchangeLog): Promise<TokenExchangeLog> {
    const [log] = await db
      .insert(tokenExchangeLog)
      .values({ ...insertLog, createdAt: new Date() })
      .returning();
    return log;
  }

  async getTokenExchangeHistory(userId: string): Promise<TokenExchangeLog[]> {
    return db.select().from(tokenExchangeLog)
      .where(eq(tokenExchangeLog.userId, userId))
      .orderBy(desc(tokenExchangeLog.createdAt));
  }
}

export const storage = new DatabaseStorage();
