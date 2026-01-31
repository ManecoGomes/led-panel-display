import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { type InsertPost } from '@shared/schema';

export interface SitemapEntry {
  loc: string[];
  lastmod?: string[];
  changefreq?: string[];
  priority?: string[];
}

export class WebScraper {
  private readonly sitemapUrl = 'https://www.manecogomes.com.br/post-sitemap.xml';
  private readonly targetCategory = 'prestador-servicos';

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
            const url = urlEntry.loc[0];
            // Filter for "Profissionais & Empresas" category posts
            if (url.includes(this.targetCategory)) {
              urls.push(url);
            }
          }
        }
      }

      return urls;
    } catch (error) {
      console.error('Error fetching sitemap:', error);
      throw new Error('Failed to fetch sitemap data');
    }
  }

  async scrapePost(url: string): Promise<InsertPost | null> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LED-Panel-Bot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      let title = $('h1').first().text().trim() || $('title').text().trim();
      
      // Clean title - remove "Prestador Serviços:" prefix
      let cleanTitle = title.replace(/^Prestador\s+Serviços:\s*/i, '').trim();
      
      // Extract image URL - look for WordPress post image
      let imageUrl: string | null = null;
      
      // WordPress uses 'wp-post-image' class for the main post image
      const postImages = $('img.wp-post-image');
      
      postImages.each((i, elem) => {
        // Skip if already found an image
        if (imageUrl) return;
        
        // Try data-src first (lazy loading), then src
        const dataSrc = $(elem).attr('data-src');
        const src = $(elem).attr('src');
        const imgSrc = dataSrc || src;
        
        // Only use if it's a real image URL (not data URI or placeholder)
        if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.includes('placeholder')) {
          imageUrl = imgSrc;
          // Handle relative URLs
          if (imageUrl.startsWith('/')) {
            imageUrl = 'https://www.manecogomes.com.br' + imageUrl;
          }
        }
      });

      // Extract WhatsApp number from content
      let whatsapp: string | null = null;
      // Get post content - try article first (includes all post paragraphs), then entry-content
      const content = $('article').text() || $('.entry-content').text() || $('.post-content').text() || $.text();
      
      // Look for various WhatsApp patterns
      const whatsappPatterns = [
        /WhatsApp[:\s]*\+?55?[\s-]?(\(?(?:24|21)\)?)[\s-]?9?\s*(\d{4}[\s-]?\d{4})/gi,
        /Whats[:\s]*\+?55?[\s-]?(\(?(?:24|21)\)?)[\s-]?9?\s*(\d{4}[\s-]?\d{4})/gi,
        /telefone[:\s]*\+?55?[\s-]?(\(?(?:24|21)\)?)[\s-]?9?\s*(\d{4}[\s-]?\d{4})/gi,
        /contato[:\s]*\+?55?[\s-]?(\(?(?:24|21)\)?)[\s-]?9?\s*(\d{4}[\s-]?\d{4})/gi,
        /(\(?(?:24|21)\)?)[\s-]?9\s*(\d{4}[\s-]?\d{4})/g
      ];

      for (const pattern of whatsappPatterns) {
        const match = pattern.exec(content);
        if (match) {
          // Format the number consistently
          const areaCode = match[1]?.replace(/[()]/g, '') || '24';
          const number = match[2]?.replace(/[\s-]/g, '') || '';
          if (number) {
            whatsapp = `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`;
            break;
          }
        }
      }

      // Default WhatsApp if none found
      if (!whatsapp) {
        whatsapp = '(24) 9 8841 8058';
      }

      // Extract hashtags - find the <p> containing "hashtags" directly
      const hashtags: string[] = [];
      
      // Find all paragraphs and look for the one with "hashtags"
      let hashtagsString = '';
      $('p').each((i, elem) => {
        const pText = $(elem).text();
        if (pText.toLowerCase().includes('hashtags')) {
          hashtagsString = pText;
          return false; // break loop
        }
      });
      
      if (hashtagsString) {
        // WordPress format: "hashtags": "#profissão # #"
        // WordPress uses curly quotes (" " " ") instead of straight quotes (" ')
        // Include all quote variations: " " " " ' ' ' '
        const hashtagsPattern = /[""\u201C\u201D"']hashtags[""\u201C\u201D"']?\s*:\s*[""\u201C\u201D"']([^""\u201C\u201D"']+)[""\u201C\u201D"']/i;
        const hashtagsMatch = hashtagsString.match(hashtagsPattern);
        
        if (hashtagsMatch && hashtagsMatch[1]) {
          const extractedHashtags = hashtagsMatch[1];
          
          // Pattern: #profissão - must start with a letter, not a number
          const hashtagPattern = /#[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9\s]*/g;
          const hashtagMatches = extractedHashtags.match(hashtagPattern);
          
          if (hashtagMatches && hashtagMatches.length > 0) {
            // Filter out invalid hashtags and clean them
            const validHashtags = hashtagMatches
              .map(tag => tag.trim()) // Remove whitespace
              .filter(tag => {
                // Must be at least 3 characters (#xx)
                if (tag.length < 3) return false;
                
                // Exclude if it looks like a hex color
                if (/^#[0-9A-Fa-f]{6}$/.test(tag)) return false;
                if (/^#[0-9A-Fa-f]{3}$/.test(tag)) return false;
                
                return true;
              });
            
            const uniqueHashtags = Array.from(new Set(validHashtags));
            hashtags.push(...uniqueHashtags.slice(0, 3));
          }
        }
      }

      return {
        url,
        title,
        cleanTitle,
        imageUrl,
        whatsapp,
        hashtags,
        category: 'Profissionais & Empresas'
      };

    } catch (error) {
      console.error(`Error scraping post ${url}:`, error);
      return null;
    }
  }

  async scrapeAllPosts(): Promise<InsertPost[]> {
    try {
      const urls = await this.fetchSitemap();
      console.log(`Found ${urls.length} URLs to scrape`);

      const posts: InsertPost[] = [];
      
      // Process URLs in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const batchPromises = batch.map(url => this.scrapePost(url));
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result) {
            posts.push(result);
          }
        }

        // Add delay between batches
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return posts;
    } catch (error) {
      console.error('Error scraping all posts:', error);
      throw error;
    }
  }
}

export const scraper = new WebScraper();
