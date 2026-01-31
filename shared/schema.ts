import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  cleanTitle: text("clean_title").notNull(), // Title without "Prestador Serviços:" prefix
  imageUrl: text("image_url"),
  whatsapp: text("whatsapp"),
  hashtags: text("hashtags").array(), // Array of hashtags from content
  category: text("category").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  lastUpdated: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// API Response types
export const postResponseSchema = z.object({
  success: z.boolean(),
  posts: z.array(z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    cleanTitle: z.string(),
    imageUrl: z.string().nullable(),
    whatsapp: z.string().nullable(),
    hashtags: z.array(z.string()).nullable(),
    category: z.string(),
    lastUpdated: z.string(),
  })),
  error: z.string().optional(),
});

export type PostResponse = z.infer<typeof postResponseSchema>;

// Properties (Real Estate) Table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  value: numeric("value", { precision: 10, scale: 2 }).default("0"), // Property value in R$
  transactionType: text("transaction_type").notNull(), // "VENDE" or "ALUGA"
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  lastUpdated: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property API Response types
export const propertyResponseSchema = z.object({
  success: z.boolean(),
  properties: z.array(z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    imageUrl: z.string().nullable(),
    value: z.string().nullable(), // numeric fields return strings in Drizzle
    transactionType: z.string(),
    lastUpdated: z.string(),
  })),
  error: z.string().optional(),
});

export type PropertyResponse = z.infer<typeof propertyResponseSchema>;
