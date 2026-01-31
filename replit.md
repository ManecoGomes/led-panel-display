# LED Panel Display System

## Overview

This is a full-stack web application with two LED panel displays optimized for 382x382 pixel LED screens. The system automatically scrapes content from a WordPress website (manecogomes.com.br), randomizes the order, and presents it in eye-catching LED panel slideshows with automatic 6-second rotation. Built with React, Express, and PostgreSQL using a modern TypeScript stack.

### Two Display Modes:

1. **Professionals Panel** (`/`): Displays service providers from the "Profissionais & Empresas" category
2. **Properties Panel** (`/imoveis`): Displays real estate listings with transaction types (VENDE/ALUGA)

## User Preferences

Preferred communication style: Simple, everyday language.

## Key Features

- **Auto-refresh on Load**: Automatically scrapes and loads fresh content every time a page is accessed
- **Random Order**: Content is randomized using Fisher-Yates shuffle algorithm for varied display
- **6-Second Rotation**: Automatic slideshow with smooth fade transitions between slides
- **Fixed 382x382px Display**: Optimized for single LED panel with all dimensions proportionally scaled to fit
- **Independent Pages**: No navigation between pages - each panel operates completely independently

### Professionals Panel Features (`/`):
- **Header**: "CADASTRE-SE (24) 9.8841.8058 - É GRÁTIS" (white text, blue gradient, 12px font)
- **Content**:
  - Profession/title in green WhatsApp-style box (above image, 16px font)
  - Professional images (130px square, 60% larger than original)
  - Profession hashtags in gold (#FFD700) with glow effect (16px font, up to 3 hashtags)
  - WhatsApp contact links at bottom (16px font)
- **Smart WhatsApp Formatting**: Automatically adds "9" digit after DDD for 10-digit numbers

### Properties Panel Features (`/imoveis`):
- **Header**: "Imobiliária Maneco Gomes Empreendimentos" with "CRECI7973RJ" at 30% font size (colorful gradient: red→yellow→green)
- **Content**:
  - Transaction badge: "VENDE" (red) or "ALUGA" (blue)
    - Logic: VENDE if value = 0 OR value > R$ 90,000
    - Logic: ALUGA if 0 < value ≤ R$ 90,000
  - Property title (20pts/calc(1.25em))
  - Property images (calc(10.725em) - 70% larger than original)
  - Footer (20pts/calc(1.25em)): 
    - Line 1: www.manecogomes.com.br
    - Line 2: WhatsApp icon + (24)9.8841.8058

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- React with TypeScript for type safety and developer experience
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing (single route application)
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- shadcn/ui components built on Radix UI primitives for accessible, customizable UI elements
- Tailwind CSS for utility-first styling with custom LED panel theme
- CSS variables for theming with custom LED-specific color palette (led-bg, led-primary, led-accent)

**Fixed 382x382px Display System**
- Container: Fixed dimensions of 382px × 382px
- Base font size: 16px
- All dimensions proportionally reduced to 25% of original 1528px design (382/1528 = 0.25)
- All spacing, padding, margins, and font sizes use `calc(Xem * 0.25)` for consistent scaling
- Images scaled proportionally: professional images 130px, property images ~98px
- Layout centered with `margin: 0 auto` for optimal display positioning
- Typography: Header 12px, profession title 16px, hashtags 16px (gold), phone 16px

**State Management Pattern**
- Server state managed through React Query with disabled refetching (staleTime: Infinity)
- Local UI state managed with React hooks (useState, useEffect)
- Custom hooks for mobile detection and toast notifications

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Custom middleware for request logging and JSON body parsing with raw body preservation
- Vite middleware integration for development hot-reloading
- Static file serving for production builds

**API Design**
- RESTful API endpoints under `/api` prefix
- GET `/api/posts` - Retrieve all posts or filter by category query parameter
- POST `/api/posts/refresh` - Trigger scraping and database update
- Structured error handling with try-catch blocks returning JSON error responses

**Data Storage Strategy**
- Abstracted storage interface (IStorage) allowing multiple implementations
- In-memory storage (MemStorage) for development/testing
- PostgreSQL designed for production (via Drizzle ORM configuration)
- Schema defined in shared directory for type consistency between client and server

### Database Schema

**Technology Stack**
- Drizzle ORM for type-safe database operations and migrations
- PostgreSQL as the target database (configured via DATABASE_URL)
- Neon Database serverless driver for PostgreSQL connections

**Posts Table Structure**
- `id`: UUID primary key (auto-generated)
- `url`: Unique text field for the post URL
- `title`: Full post title text
- `cleanTitle`: Processed title without category prefix
- `imageUrl`: Optional post image URL
- `whatsapp`: Optional WhatsApp contact number
- `hashtags`: Array of hashtags extracted from content (up to 3)
- `category`: Category classification (filtered to "prestador-servicos")
- `lastUpdated`: Timestamp with automatic defaultNow()

**Data Validation**
- Zod schemas for runtime validation of post data and API responses
- Insert schema omits auto-generated fields (id, lastUpdated)
- API response schema ensures consistent structure with success flag and error handling

### External Dependencies

**Web Scraping Services**
- Axios for HTTP requests to external website
- Cheerio for HTML parsing and data extraction
- xml2js for parsing XML sitemap data

**Professionals Scraper** (`server/services/scraper.ts`):
- Fetches sitemap from manecogomes.com.br/post-sitemap.xml
- Filters URLs by "prestador-servicos" category
- Extracts post data (title, image, WhatsApp, hashtags) from HTML using WordPress-specific selectors
- Uses 'wp-post-image' CSS class to capture correct post images (not logos)
- Handles lazy loading via data-src attribute
- Processes titles to remove "Prestador Serviços:" prefix
- Extracts hashtags from WordPress content paragraphs:
  - Searches all `<p>` tags for the one containing "hashtags"
  - WordPress format: `"hashtags": "#profissão # #profissão #profissão"`
  - Uses Unicode-aware regex to handle curly quotes (`\u201C` and `\u201D`)
  - Filters out empty "#" symbols and invalid tags
  - Must start with letter (excludes hex colors like #35AAE1)
  - Minimum 3 characters required
  - Limits to 3 unique profession hashtags
  - Examples: #Eletricista, #Massagista, #Fisioterapeuta

**Properties Scraper** (`server/services/property-scraper.ts`):
- Fetches sitemap from manecogomes.com.br/property-sitemap.xml
- Extracts all property listings with:
  - Title, image URL, and property value
  - Price patterns: R$ 1.500.000, R$ 1500000, R$1.500.000,00
  - Searches for "valor:", "preço:", or any R$ amount in content
- Determines transaction type based on VALUE:
  - VENDE: value = 0 (not found) OR value > R$ 90,000
  - ALUGA: 0 < value ≤ R$ 90,000
- Uses 'wp-post-image' CSS class for property images
- Handles lazy loading via data-src attribute

**Third-Party UI Libraries**
- Multiple Radix UI primitives (@radix-ui/react-*) for headless accessible components
- class-variance-authority for managing component variants
- cmdk for command palette functionality
- date-fns for date formatting and manipulation

**Development Tools**
- Replit-specific plugins for development experience (error overlay, cartographer, dev banner)
- TypeScript for static type checking
- PostCSS with Tailwind and Autoprefixer for CSS processing
- esbuild for production server bundling

**Environment Configuration**
- DATABASE_URL environment variable required for database connection
- NODE_ENV for environment-specific behavior (development/production)
- Separate build processes for client (Vite) and server (esbuild)