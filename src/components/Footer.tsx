export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <img src="/logo.jpg" alt="Ice on Wheels Logo" className="w-12 h-12 rounded-full mr-3" />
          <h3 className="text-xl font-bold">Ice on Wheels</h3>
        </div>
        <p>&copy; 2025 Ice on Wheels. All rights reserved.</p>
        <p className="mt-2">Scan QR code to order your favorite ice cream!</p>
      </div>
    </footer>
  );
}