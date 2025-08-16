import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  oktaUserId: text("okta_user_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  state: text("state").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull().unique(),
  idToken: text("id_token").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  application: text("application").notNull(), // 'inventory' or 'jarvis'
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenExchangeLog = pgTable("token_exchange_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  fromApp: text("from_app").notNull(),
  toApp: text("to_app").notNull(),
  jagToken: text("jag_token").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(authSessions),
  tokenExchanges: many(tokenExchangeLog),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  inventoryItems: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [inventoryItems.warehouseId],
    references: [warehouses.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const tokenExchangeLogRelations = relations(tokenExchangeLog, ({ one }) => ({
  user: one(users, {
    fields: [tokenExchangeLog.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  oktaUserId: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).pick({
  name: true,
  location: true,
  state: true,
  active: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  warehouseId: true,
  name: true,
  sku: true,
  category: true,
  quantity: true,
  minStockLevel: true,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).pick({
  userId: true,
  sessionId: true,
  idToken: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
  application: true,
});

export const insertTokenExchangeLogSchema = createInsertSchema(tokenExchangeLog).pick({
  userId: true,
  fromApp: true,
  toApp: true,
  jagToken: true,
  success: true,
  errorMessage: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type TokenExchangeLog = typeof tokenExchangeLog.$inferSelect;
export type InsertTokenExchangeLog = z.infer<typeof insertTokenExchangeLogSchema>;
