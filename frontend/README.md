# Korean Eyewear Shop - Frontend

Next.js 16 + TypeScript + Tailwind CSS v4 with Winter/Pre-Tet Theme

## 🎨 Theme Overview

### Color Palette

**Winter Colors** - Cool, Minimalist, High-End
- `winter-ice`: #F0F4F8 - Light backgrounds
- `winter-sky`: #E3EBF3 - Secondary backgrounds
- `winter-frost`: #D1DCE5 - Borders, dividers
- `winter-stone`: #8B9BAA - Muted text
- `winter-deep`: #4A5568 - Primary text
- `winter-night`: #2D3748 - Headings

**Tet Celebration Colors** - Warm Accents
- `tet-red`: #DC2626 - Sale badges, CTAs
- `tet-gold`: #F59E0B - Primary actions, highlights
- `tet-apricot`: #FEF3C7 - Subtle accents

### Typography

- **Display Font**: Outfit - For headings and brand elements
- **Body Font**: Inter - For readable content

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx             # Home page
│   └── globals.css          # Tailwind + Winter/Tet theme
├── components/
│   ├── ProductCard.tsx      # Spotlight effect product card
│   ├── effects/
│   │   └── SnowEffect.tsx   # Interactive snow particles
│   └── decorations/
│       └── ApricotDecor.tsx # Tet-themed Apricot Blossom SVG
├── lib/
│   ├── api.ts               # Axios API client + types
│   ├── store.ts             # Zustand state management
│   └── utils.ts             # Utility functions
└── public/
    └── (images, icons)
```

## 🎯 Key Features Implemented

### 1. Winter/Tet Theme System
- Custom Tailwind v4 configuration with CSS variables
- Dark mode support
- Smooth transitions and animations
- Custom scrollbar styling

### 2. Interactive Effects
- **Snow Particles**: Interactive snowfall using tsparticles
  - Mouse hover repulsion effect
  - Click to add more snowflakes
  - Realistic wobble and falling animation

- **Apricot Blossoms**: SVG decorations for Tet theme
  - Corner positioning (4 corners)
  - Animated petal appearance
  - Subtle golden tones

### 3. Spotlight Product Card
The signature UX feature:
- Hover to scale up (1.05x)
- Blurs sibling cards for focus
- Wishlist toggle with heart animation
- Sale/New/Best Seller badges
- Stock status indicators
- Add to cart with celebration effect

### 4. State Management (Zustand)

**Stores:**
- `useCartStore`: Cart state with persistence
- `useUIStore`: UI modals, mobile menu, search
- `useWishlistStore`: Wishlist with localStorage
- `useFilterStore`: Product filtering state
- `useRecentlyViewedStore`: Recently viewed products

### 5. API Integration

Fully typed API client with:
- Authentication interceptors
- Error handling
- All backend endpoints mapped
- TypeScript interfaces for all models

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+ 
npm or yarn
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## 📦 Dependencies

### Core
- **next**: 16.1.1 - React framework
- **react**: 19.2.3
- **typescript**: ^5

### UI & Animations
- **framer-motion**: ^11.15.0 - Animations
- **@tsparticles/react**: ^3.0.0 - Particle effects
- **lucide-react**: ^0.469.0 - Icons

### State & Data
- **zustand**: ^5.0.2 - State management
- **axios**: ^1.7.9 - HTTP client

### Utilities
- **clsx**: ^2.1.1 - Conditional classnames
- **tailwind-merge**: ^2.6.0 - Merge Tailwind classes

## 🎨 Custom Utilities

### `cn()` - Class Name Utility
```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class")} />
```

### Price Formatting
```typescript
formatPrice(500000) // "500.000 ₫"
formatPriceRange(200000, 800000) // "200.000 ₫ - 800.000 ₫"
```

### Stock Status
```typescript
getStockStatus("in_stock") 
// { color: "text-success", label: "In Stock", bg: "bg-success/10" }
```

## 🎭 Component Usage

### ProductCard
```typescript
import ProductCard from "@/components/ProductCard";

<div className="spotlight-container grid grid-cols-3 gap-6">
  {products.map(product => (
    <ProductCard 
      key={product.id}
      product={product}
      onAddToCart={handleAddToCart}
    />
  ))}
</div>
```

### SnowEffect
```typescript
import SnowEffect from "@/components/effects/SnowEffect";

export default function Layout({ children }) {
  return (
    <>
      <SnowEffect />
      {children}
    </>
  );
}
```

### ApricotDecor
```typescript
import ApricotDecor from "@/components/decorations/ApricotDecor";

<ApricotDecor position="top-right" />
<ApricotDecor position="bottom-left" />
```

## 🎨 Tailwind Classes

### Winter/Tet Colors
```css
bg-winter-ice, text-winter-deep
bg-tet-gold, text-tet-red
border-winter-frost
```

### Custom Effects
```css
glass-effect          /* Glassmorphism backdrop blur */
winter-glow          /* Winter-themed glow shadow */
tet-glow             /* Tet-themed golden glow */
text-gradient-winter /* Winter gradient text */
text-gradient-tet    /* Tet gradient text */
```

### Animations
```css
animate-float        /* Gentle float up/down */
animate-shimmer      /* Shimmer effect */
animate-fade-in-up   /* Fade in from below */
animate-sparkle      /* Sparkle effect */
```

### Spotlight Effect
```css
card-spotlight                 /* Apply to card */
spotlight-container            /* Apply to parent container */
```

## 🌐 API Usage

### Fetch Products
```typescript
import { productsAPI } from "@/lib/api";

const { data } = await productsAPI.getProducts({
  category: 1,
  in_stock: true,
  ordering: "-created_at"
});
```

### Cart Operations
```typescript
import { cartAPI } from "@/lib/api";

// Add to cart
await cartAPI.addItem(variantId, quantity);

// Get cart
const { data } = await cartAPI.getCart();

// Cart merge on login
const response = await cartAPI.mergeCheck(sessionKey);
if (response.data.code === "MERGE_REQUIRED") {
  // Show merge prompt
}
```

## 🎯 Next Steps

### Immediate Tasks
1. Create Navigation component
2. Build Hero section with Scrollytelling
3. Implement Product Listing page
4. Create Product Detail page
5. Build Shopping Cart page
6. Implement Checkout flow

### Advanced Features
- Cart merge prompt UI
- VNPAY payment integration
- Order tracking
- User profile
- Review system

## 📝 Code Style

- Use TypeScript for all new files
- Follow React Server/Client Component patterns
- Use Tailwind CSS for styling (no CSS modules)
- Prefer named exports for components
- Use "use client" only when needed (interactivity, hooks)

## 🐛 Troubleshooting

**Particles not showing:**
- Check z-index layering
- Ensure SnowEffect is client component
install missing

**TypeScript errors:**
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` paths configuration

**Tailwind classes not working:**
- Verify Tailwind v4 syntax in `globals.css`
- Check `@theme inline` configuration

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TSParticles](https://particles.js.org/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

## 🎨 Design Philosophy

The Winter/Tet theme combines:
- **Korean Minimalism**: Clean lines, ample whitespace, high-end feel
- **Winter Elegance**: Cool blues and grays, frosted effects, snow animations
- **Tet Warmth**: Strategic use of red and gold for celebration and joy
- **Premium UX**: Smooth animations, interactive elements, attention to detail

Every interaction should feel fluid, intentional, and delightful! ✨
