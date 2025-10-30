# Ice on Wheels 🍨

A modern, responsive web application for ordering delicious ice cream from our mobile cart. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🍦 **Extensive Menu**: 60+ items across 10 categories including Ice Cream, Milkshakes, Fruit Juices, Hot Chocolate Bowls, Brownies, and more
- 🎨 **Smart Customization**: 
  - Toppings (GEMS, MARSHMALLOW, CHOCOCHIP, OTHERS) only for Ice Cream
  - Size selection (Small/Medium/Large) only for Fruit Juices and Milkshakes
- 🛒 **Smart Cart**: Add, remove, and modify items with real-time updates
- 💰 **Promo Codes**: Apply discount codes for special offers
- 💳 **UPI Payments**: Secure payment through popular UPI apps
- 📱 **Mobile-First**: Fully responsive design optimized for QR code scanning
- ✨ **Smooth Animations**: Engaging user experience with CSS animations

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: Emoji and custom CSS animations

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iceonwheels
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── cart/           # Shopping cart page
│   ├── checkout/       # Checkout and payment page
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable React components
│   ├── Header.tsx      # Navigation header
│   ├── Footer.tsx      # Site footer
│   ├── Menu.tsx        # Ice cream menu display
│   ├── MenuItem.tsx    # Individual menu item
│   └── CustomizationModal.tsx # Item customization modal
├── context/            # React context for state management
│   └── CartContext.tsx # Shopping cart state
├── data/               # Static data
│   ├── menu.ts         # Ice cream menu items
│   └── promoCodes.ts   # Promo code definitions
└── types/              # TypeScript type definitions
    └── index.ts        # Shared types
```

## Usage

1. **Browse Menu**: View our ice cream varieties with categories
2. **Customize**: Click "Customize & Add to Cart" to choose size and toppings
3. **Manage Cart**: View cart, adjust quantities, or remove items
4. **Apply Promo**: Enter promo codes for discounts
5. **Checkout**: Enter delivery details and select UPI payment method
6. **Pay**: Complete payment through your preferred UPI app

## Available Promo Codes

- `WELCOME10` - 10% off
- `SAVE50` - ₹50 off
- `ICE20` - 20% off
- `FRESH15` - ₹15 off

## Deployment

The app is ready for deployment on Vercel, Netlify, or any platform supporting Next.js.

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Ice on Wheels** - Bringing smiles one scoop at a time! 🍦✨
