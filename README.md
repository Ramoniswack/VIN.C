# VIN.C Clothing Brand

<div align="center">
  <img src="public/logo.png" alt="VIN.C Logo" width="200"/>
  
  **Premium Clothing Brand Crafted in Nepal**
  
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## Overview

VIN.C is a premium clothing brand based and manufactured in Nepal. This modern, responsive web application showcases our exquisite collection of contemporary garments crafted with traditional Nepalese expertise and artisanal techniques. The website features clean design with sections for browsing our shop, exploring lookbooks, learning about our brand, and an admin dashboard for product management.

## Key Features

### Modern Immersive Design

- Responsive layout optimized for all devices with dark and light modes
- Elegant and intuitive shopping experience
- Interactive components with subtle animations
- Fully accessible and SEO-friendly

### Shop Experience

- Filterable product catalog by category, size, color, and price
- Detailed product pages with multiple images and specifications
- Featured collections showcase
- Seamless cart and checkout experience

### Brand Storytelling

- Lookbook with seasonal collections
- About page sharing our Nepalese heritage and craftsmanship
- Brand philosophy and sustainable manufacturing approach
- Quality materials and artisan craftsmanship highlights

### Admin Dashboard

- Comprehensive product management
- Real-time sales statistics and order tracking
- Mobile-responsive admin interface
- Secure authentication system

## Project Structure Navigator

### Main Components

| Component      | Description                  | Location                                 |
| -------------- | ---------------------------- | ---------------------------------------- |
| Navigation     | Header with section links    | `src/components/Navigation.tsx`          |
| Hero Section   | Main landing area            | `src/components/Hero.tsx`                |
| Featured       | Featured collections         | `src/components/FeaturedCollections.tsx` |
| Shop           | Product browsing             | `src/pages/Shop.tsx`                     |
| Product Detail | Individual product pages     | `src/pages/ProductDetail.tsx`            |
| Lookbook       | Fashion lookbook             | `src/pages/Lookbook.tsx`                 |
| About          | Brand story                  | `src/pages/About.tsx`                    |
| Cart           | Shopping cart                | `src/pages/Cart.tsx`                     |
| Admin Panel    | Product management dashboard | `src/pages/Admin.tsx`                    |

### Key Files

- **Index Page:** `src/pages/Index.tsx` - Main landing page
- **App:** `src/App.tsx` - Root application component
- **Styles:** `src/index.css` - Global styles
- **Utilities:** `src/lib/utils.ts` - Helper functions
- **Custom Hooks:** `src/hooks/` - Custom React hooks

### Store Management

- **Product Store:** `src/store/productStore.ts` - Product data management
- **Cart Store:** `src/store/cartStore.ts` - Shopping cart functionality
- **Auth Store:** `src/store/authStore.ts` - Admin authentication

### UI Components

The UI components are built using Shadcn UI and can be found in `src/components/ui/`. Key components include:

- Button: `src/components/ui/button.tsx`
- Card: `src/components/ui/card.tsx`
- Dialog: `src/components/ui/dialog.tsx`
- Badge: `src/components/ui/badge.tsx`
- Form elements: `src/components/ui/form.tsx`, `src/components/ui/input.tsx`
- Accordion: `src/components/ui/accordion.tsx`

## Quick Start

### Prerequisites

- Node.js 16.0+
- npm or bun package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ramoniswack/VIN.C.git
   cd VIN.C
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Start development server**

   ```bash
   npm run dev
   # or
   bun run dev
   ```

   Open your browser and navigate to `http://localhost:8080`

## Technology Stack

### Frontend

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **TailwindCSS** - Utility-first CSS framework

### State Management

- **Zustand** - Lightweight state management
- **React Query** - Data fetching library
- **React Router** - Navigation

### UI Components

- **Shadcn UI** - Component library
- **Lucide Icons** - SVG icon library
- **Radix UI** - Headless UI components
- **Tailwind Variants** - Advanced styling solutions

### Animation & Effects

- **CSS Animations** - Smooth transitions
- **React Hooks** - State and effect management
- **Custom CSS** - Additional styling

## Available Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `npm run dev`     | Start development server  |
| `npm run build`   | Build for production      |
| `npm run preview` | Preview production build  |
| `npm run lint`    | Run ESLint                |
| `npm run format`  | Format code with Prettier |

## Admin Features

### Product Management

The admin dashboard provides comprehensive product management capabilities:

- **Product List:** View, filter, and sort all products
- **Add Product:** Create new products with images, details, and pricing
- **Edit Product:** Update existing products
- **View Product:** Detailed admin view of product information
- **Delete Product:** Remove products from the catalog

### Admin Authentication

Secure admin access with authentication:

- Login page for admin users
- Protected routes for admin functionality
- Session management

### Mobile Responsive

The admin interface is fully responsive:

- Optimized tables convert to cards on mobile
- Touch-friendly controls
- Adaptive layouts for all screen sizes

## Customization Guide

### Adding Products

To add new products:

1. Log in to the admin panel at `/auth`
2. Navigate to Products and click "Add Product"
3. Fill in the product details and upload images
4. Save to publish the product to the shop

### Updating Product Images

To update product images:

1. Add new product photos to the `public/Products/` directory
2. Edit the product through the admin interface
3. Select or upload the new images

### Modifying Theme

To adjust the visual design:

1. Global styles are in `src/index.css`
2. Theme settings are in `src/contexts/ThemeContext.tsx`
3. TailwindCSS configuration is in `tailwind.config.ts`

## Deployment

### Build for Production

```bash
npm run build
```

This generates optimized files in the `dist/` directory.

### Hosting Options

- **Vercel**: Connect GitHub repository for automatic deployment
- **Netlify**: Similar to Vercel with continuous deployment
- **GitHub Pages**: Host static files directly from your repository
- **Any Static Hosting**: Upload the `dist/` directory to any static file host

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Contributing

We welcome contributions to improve the website:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p><strong>VIN.C - Contemporary Nepalese Craftsmanship</strong></p>
  <p><i>© 2025 VIN.C. All rights reserved. Proudly made in Nepal.</i></p>
</div>
