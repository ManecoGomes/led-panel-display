import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { type InsertProperty } from '@shared/schema';

export interface PropertySitemapEntry {
  loc: string[];
  lastmod?: string[];
  changefreq?: string[];
  priority?: string[];
}

export class PropertyScraper {
  private readonly sitemapUrl = 'https://www.manecogomes.com.br/property-sitemap.xml';

  async fetchSitemap(): Promise<string[]> {
    try {
      const response = await axios.get(this.sitemapUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LED-Panel-Bot/1.0)'
        }
      });

      const xmlData = await parseStringPromise(response.data);
      const urls: string[] = [];

      if (xmlData.urlset && xmlData.urlset.url) {
        for (const urlEntry of xmlData.urlset.url) {
          if (urlEntry.loc && urlEntry.loc[0]) {
            urls.push(urlEntry.loc[0]);
          }
        }
      }

      return urls;
    } catch (error) {
      console.error('Error fetching property sitemap:', error);
      throw new Error('Failed to fetch property sitemap data');
    }
  }

  async scrapeProperty(url: string): Promise<InsertProperty | null> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LED-Panel-Bot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('h1').first().text().trim() || $('title').text().trim();
      
      // Extract image URL - try multiple strategies
      let imageUrl: string | null = null;
      
      // Strategy 1: Try property featured image first (property pages use this class)
      const propertyFeaturedImages = $('img.property-featured-image');
      propertyFeaturedImages.each((i, elem) => {
        if (imageUrl) return;
        const dataLazySrc = $(elem).attr('data-lazy-src');
        const dataSrc = $(elem).attr('data-src');
        const src = $(elem).attr('src');
        const imgSrc = dataLazySrc || dataSrc || src;
        if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.includes('placeholder')) {
          imageUrl = imgSrc;
          if (imageUrl.startsWith('/')) {
            imageUrl = 'https://www.manecogomes.com.br' + imageUrl;
          }
        }
      });
      
      // Strategy 2: Try WordPress featured image (wp-post-image)
      if (!imageUrl) {
        const featuredImages = $('img.wp-post-image');
        featuredImages.each((i, elem) => {
          if (imageUrl) return;
          const dataLazySrc = $(elem).attr('data-lazy-src');
          const dataSrc = $(elem).attr('data-src');
          const src = $(elem).attr('src');
          const imgSrc = dataLazySrc || dataSrc || src;
          if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.includes('placeholder')) {
            imageUrl = imgSrc;
            if (imageUrl.startsWith('/')) {
              imageUrl = 'https://www.manecogomes.com.br' + imageUrl;
            }
          }
        });
      }
      
      // Strategy 3: If no featured image, get FIRST large image (skip logos/icons)
      if (!imageUrl) {
        const allImages = $('img');
        allImages.each((i, elem) => {
          if (imageUrl) return;
          
          const dataSrc = $(elem).attr('data-src');
          const src = $(elem).attr('src');
          const imgSrc = dataSrc || src;
          
          // Skip logos, icons, small images (80x80, 150x150), and placeholders
          const skip = imgSrc && (
            imgSrc.includes('logo') ||
            imgSrc.includes('icon') ||
            imgSrc.includes('placeholder') ||
            imgSrc.startsWith('data:') ||
            imgSrc.includes('avatar') ||
            imgSrc.includes('-80-80') ||  // CDR-80-80-pb.png
            imgSrc.includes('150x150') ||
            imgSrc.includes('50x50') ||
            imgSrc.includes('100x100') ||
            imgSrc.includes('-pb.png') ||  // Pattern badge
            imgSrc.includes('CDR-')        // CDR logos
          );
          
          if (imgSrc && !skip) {
            imageUrl = imgSrc;
            if (imageUrl.startsWith('/')) {
              imageUrl = 'https://www.manecogomes.com.br' + imageUrl;
            }
          }
        });
      }

      // Extract property value
      let value = 0;
      const content = $.text();
      
      // Look for price patterns: R$ 1.500.000, R$ 1500000, R$1.500.000,00, etc.
      const pricePatterns = [
        /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,  // R$ 1.500.000,00
        /valor[:\s]*R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi, // Valor: R$ ...
        /preço[:\s]*R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/gi, // Preço: R$ ...
      ];
      
      for (const pattern of pricePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const priceStr = match[1].replace(/\./g, '').replace(',', '.');
          const priceValue = parseFloat(priceStr);
          if (priceValue > value) {
            value = priceValue;
          }
        }
      }
      
      // Determine transaction type based on value
      // VENDE: value = 0 (not found) OR value > 90,000
      // ALUGA: value between 1 and 90,000
      let transactionType = 'VENDE'; // Default
      if (value > 0 && value <= 90000) {
        transactionType = 'ALUGA';
      }

      return {
        url,
        title,
        imageUrl,
        value,
        transactionType
      };

    } catch (error) {
      console.error(`Error scraping property ${url}:`, error);
      return null;
    }
  }

  async scrapeAllProperties(): Promise<InsertProperty[]> {
    try {
      const urls = await this.fetchSitemap();
      console.log(`Found ${urls.length} property URLs to scrape`);

      const properties: InsertProperty[] = [];
      
      // Process URLs in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const batchPromises = batch.map(url => this.scrapeProperty(url));
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result) {
            properties.push(result);
          }
        }

        // Add delay between batches
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return properties;
    } catch (error) {
      console.error('Error scraping all properties:', error);
      throw error;
    }
  }
}

export const propertyScraper = new PropertyScraper();
