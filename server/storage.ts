import { type Post, type InsertPost, type Property, type InsertProperty, posts, properties } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Posts methods
  getPosts(): Promise<Post[]>;
  getPostsByCategory(category: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  getPostByUrl(url: string): Promise<Post | undefined>;
  
  // Properties methods
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getPropertyByUrl(url: string): Promise<Property | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private posts: Map<string, Post>;
  private properties: Map<string, Property>;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.properties = new Map();
  }

  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Posts methods
  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async getPostsByCategory(category: string): Promise<Post[]> {
    return Array.from(this.posts.values()).filter(post => post.category === category);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = { 
      ...insertPost,
      imageUrl: insertPost.imageUrl ?? null,
      whatsapp: insertPost.whatsapp ?? null,
      hashtags: insertPost.hashtags ?? null,
      id,
      lastUpdated: new Date()
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, updateData: Partial<InsertPost>): Promise<Post | undefined> {
    const existingPost = this.posts.get(id);
    if (!existingPost) return undefined;

    const updatedPost: Post = {
      ...existingPost,
      ...updateData,
      lastUpdated: new Date()
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getPostByUrl(url: string): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(post => post.url === url);
  }

  // Properties methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = { 
      ...insertProperty,
      imageUrl: insertProperty.imageUrl ?? null,
      value: insertProperty.value ?? null,
      id,
      lastUpdated: new Date()
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: string, updateData: Partial<InsertProperty>): Promise<Property | undefined> {
    const existingProperty = this.properties.get(id);
    if (!existingProperty) return undefined;

    const updatedProperty: Property = {
      ...existingProperty,
      ...updateData,
      lastUpdated: new Date()
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  async getPropertyByUrl(url: string): Promise<Property | undefined> {
    return Array.from(this.properties.values()).find(property => property.url === url);
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<any | undefined> {
    // User functionality not implemented yet
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // User functionality not implemented yet
    return undefined;
  }

  async createUser(user: any): Promise<any> {
    // User functionality not implemented yet
    return user;
  }

  // Posts methods
  async getPosts(): Promise<Post[]> {
    return await this.db.select().from(posts);
  }

  async getPostsByCategory(category: string): Promise<Post[]> {
    return await this.db.select().from(posts).where(eq(posts.category, category));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await this.db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: string, updateData: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await this.db.update(posts).set(updateData).where(eq(posts.id, id)).returning();
    return post;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await this.db.delete(posts).where(eq(posts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPostByUrl(url: string): Promise<Post | undefined> {
    const [post] = await this.db.select().from(posts).where(eq(posts.url, url));
    return post;
  }

  // Properties methods
  async getProperties(): Promise<Property[]> {
    return await this.db.select().from(properties);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await this.db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id: string, updateData: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await this.db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
    return property;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await this.db.delete(properties).where(eq(properties.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPropertyByUrl(url: string): Promise<Property | undefined> {
    const [property] = await this.db.select().from(properties).where(eq(properties.url, url));
    return property;
  }
}

export const storage = new DbStorage();
