import { z } from "zod";

// Base interfaces for all data types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  oktaUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  state: string;
  active: boolean;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  sessionId: string;
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: Date;
  application: string; // 'inventory' or 'jarvis'
  createdAt: Date;
}

export interface TokenExchangeLog {
  id: string;
  userId: string;
  fromApp: string;
  toApp: string;
  jagToken: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// Insert schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  oktaUserId: z.string().optional(),
});

export const insertWarehouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  state: z.string().min(1),
  active: z.boolean().default(true),
});

export const insertInventoryItemSchema = z.object({
  warehouseId: z.string(),
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0),
  minStockLevel: z.number().int().min(0).default(50),
  price: z.number().positive().optional(),
});

export const insertAuthSessionSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  idToken: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
  application: z.enum(['inventory', 'jarvis']),
});

export const insertTokenExchangeLogSchema = z.object({
  userId: z.string(),
  fromApp: z.string(),
  toApp: z.string(),
  jagToken: z.string(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
});

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type InsertTokenExchangeLog = z.infer<typeof insertTokenExchangeLogSchema>;