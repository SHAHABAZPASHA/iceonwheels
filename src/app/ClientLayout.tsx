"use client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </CartProvider>
  );
}
