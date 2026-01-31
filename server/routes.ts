import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { propertyScraper } from "./services/property-scraper";
import { postResponseSchema, propertyResponseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all posts or posts by category
  app.get("/api/posts", async (req, res) => {
    try {
      const category = req.query.category as string;
      
      let posts;
      if (category) {
        posts = await storage.getPostsByCategory(category);
      } else {
        posts = await storage.getPosts();
      }

      const response = postResponseSchema.parse({
        success: true,
        posts: posts.map(post => ({
          ...post,
          lastUpdated: post.lastUpdated?.toISOString() || new Date().toISOString()
        }))
      });

      res.json(response);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({
        success: false,
        posts: [],
        error: 'Failed to fetch posts'
      });
    }
  });

  // Refresh posts by scraping the website
  app.post("/api/posts/refresh", async (req, res) => {
    try {
      console.log('Starting post refresh...');
      
      // Scrape new posts
      const scrapedPosts = await scraper.scrapeAllPosts();
      console.log(`Scraped ${scrapedPosts.length} posts`);

      // Update storage
      const updatedPosts = [];
      for (const postData of scrapedPosts) {
        try {
          // Check if post already exists
          const existingPost = await storage.getPostByUrl(postData.url);
          
          if (existingPost) {
            // Update existing post
            const updated = await storage.updatePost(existingPost.id, postData);
            if (updated) {
              updatedPosts.push(updated);
            }
          } else {
            // Create new post
            const newPost = await storage.createPost(postData);
            updatedPosts.push(newPost);
          }
        } catch (error) {
          console.error(`Error saving post ${postData.url}:`, error);
        }
      }

      console.log(`Successfully processed ${updatedPosts.length} posts`);

      const response = postResponseSchema.parse({
        success: true,
        posts: updatedPosts.map(post => ({
          ...post,
          lastUpdated: post.lastUpdated?.toISOString() || new Date().toISOString()
        }))
      });

      res.json(response);
    } catch (error) {
      console.error('Error refreshing posts:', error);
      res.status(500).json({
        success: false,
        posts: [],
        error: 'Failed to refresh posts'
      });
    }
  });

  // Get all properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();

      const response = propertyResponseSchema.parse({
        success: true,
        properties: properties.map(property => ({
          ...property,
          lastUpdated: property.lastUpdated?.toISOString() || new Date().toISOString()
        }))
      });

      res.json(response);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({
        success: false,
        properties: [],
        error: 'Failed to fetch properties'
      });
    }
  });

  // Refresh properties by scraping the website
  app.post("/api/properties/refresh", async (req, res) => {
    try {
      console.log('Starting property refresh...');
      
      // Scrape new properties
      const scrapedProperties = await propertyScraper.scrapeAllProperties();
      console.log(`Scraped ${scrapedProperties.length} properties`);

      // Update storage
      const updatedProperties = [];
      for (const propertyData of scrapedProperties) {
        try {
          // Check if property already exists
          const existingProperty = await storage.getPropertyByUrl(propertyData.url);
          
          if (existingProperty) {
            // Update existing property
            const updated = await storage.updateProperty(existingProperty.id, propertyData);
            if (updated) {
              updatedProperties.push(updated);
            }
          } else {
            // Create new property
            const newProperty = await storage.createProperty(propertyData);
            updatedProperties.push(newProperty);
          }
        } catch (error) {
          console.error(`Error saving property ${propertyData.url}:`, error);
        }
      }

      console.log(`Successfully processed ${updatedProperties.length} properties`);

      const response = propertyResponseSchema.parse({
        success: true,
        properties: updatedProperties.map(property => ({
          ...property,
          lastUpdated: property.lastUpdated?.toISOString() || new Date().toISOString()
        }))
      });

      res.json(response);
    } catch (error) {
      console.error('Error refreshing properties:', error);
      res.status(500).json({
        success: false,
        properties: [],
        error: 'Failed to refresh properties'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
