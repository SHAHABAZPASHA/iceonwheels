'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { getBluetoothPrinter } from '../../utils/bluetoothPrinter';

const upiIds = [
  { name: 'Google Pay', id: 'Irfanpashask@okhdfcbank', app: 'Google Pay', image: '/gpay.jpg' },
  { name: 'PhonePe', id: '8310094095@ybl', app: 'PhonePe', image: '/phonepe.jpg' },
  { name: 'Paytm', id: '8310094095@pthdfc', app: 'Paytm', image: '/paytm.png' },
  { name: 'BHIM UPI', id: 'iceonwheels@bhim', app: 'BHIM UPI', emoji: '🏦' }
];

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderType, setOrderType] = useState('dinein');
  const [upiAppOpened, setUpiAppOpened] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState<number | null>(null);

  const finalTotal = state.total;

  const connectPrinter = async () => {
    setIsConnectingPrinter(true);
    try {
      const printer = getBluetoothPrinter();
      const connected = await printer.connect();
      setPrinterConnected(connected);
      if (connected) {
        alert('Printer connected successfully!');
      } else {
        // Don't show error for user cancellation - it's expected behavior
        console.log('Printer connection cancelled or failed');
      }
    } catch (error: any) {
      console.error('Printer connection error:', error);
      // Show specific error messages for different error types
      if (error.message.includes('not supported')) {
        alert('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or another compatible browser.');
      } else if (error.message.includes('HTTPS')) {
        alert('Bluetooth printing requires HTTPS. Please access this site over a secure connection.');
      } else if (error.name !== 'NotFoundError') {
        alert(`Failed to connect to printer: ${error.message}`);
      }
      // Don't show error for NotFoundError (user cancellation) - it's expected
    }
    setIsConnectingPrinter(false);
  };

  const printReceipt = async () => {
    if (!printerConnected) {
      alert('Please connect to printer first.');
      return;
    }

    if (!currentOrder) {
      alert('No order to print.');
      return;
    }

    try {
      const printer = getBluetoothPrinter();
      await printer.printReceipt(currentOrder);
      alert('Receipt printed successfully!');
    } catch (error) {
      console.error('Printing error:', error);
      alert('Failed to print receipt. Please check printer connection.');
    }
  };

  const printOrderPreview = async (orderData: any) => {
    if (!printerConnected) {
      alert('Please connect to printer first.');
      return;
    }

    try {
      const printer = getBluetoothPrinter();
      await printer.printReceipt(orderData);
      alert('Order preview printed successfully!');
    } catch (error) {
      console.error('Printing error:', error);
      alert('Failed to print order preview. Please check printer connection.');
    }
  };

  const printTestReceipt = async () => {
    if (!printerConnected) {
      alert('Please connect to printer first.');
      return;
    }

    try {
      const printer = getBluetoothPrinter();
      await printer.printTestReceipt();
      alert('Test receipt printed successfully!');
    } catch (error) {
      console.error('Test printing error:', error);
      alert('Failed to print test receipt. Please check printer connection.');
    }
  };

  const handlePlaceOrder = () => {
    if (!customerName || !customerPhone || !selectedPayment) {
      alert('Please fill in all required fields');
      return;
    }

    // For UPI payments, require payment confirmation first
    if (selectedPayment !== 'cash' && !upiAppOpened) {
      alert('Please open your UPI app and complete the payment first, then click "Payment Completed" to place your order.');
      return;
    }


    // Create order object
    const order = {
      id: `ORD${Date.now()}`,
      customerName,
      customerPhone,
      items: state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations ? Object.values(item.customizations).filter(val => val && val.length > 0) : undefined
      })),
      total: finalTotal,
      status: 'pending' as const,
      orderType: orderType === 'dinein' ? 'pickup' : 'pickup',
      paymentMethod: selectedPayment === 'cash' ? 'cash' : 'upi',
      paymentStatus: selectedPayment === 'cash' ? 'pending' : 'paid',
      timestamp: new Date().toISOString(),
      notes: state.appliedPromo ? `Promo code applied: ${state.appliedPromo.code}` : undefined
    };

    // Store order for printing
    setCurrentOrder({
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: state.subtotal,
      discount: state.discount,
      total: order.total,
      paymentMethod: order.paymentMethod === 'cash' ? 'Cash' : 'UPI',
      orderType: order.orderType === 'pickup' ? 'Pickup' : 'Dine In',
      timestamp: order.timestamp
    });
    setPlacedOrderTotal(order.total);

    // Save order to localStorage for admin
    const existingOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('adminOrders', JSON.stringify(existingOrders));

    // Clear cart after successful order
    dispatch({ type: 'CLEAR_CART' });

    // Simulate order placement
    setOrderPlaced(true);

    // In a real app, this would send the order to a backend
    setTimeout(() => {
      alert('Order placed successfully! You will receive a confirmation shortly.');
    }, 1000);
  };

  const handleOpenUpiApp = () => {
    const upiUrl = `upi://pay?pa=${selectedPayment}&pn=Ice%20on%20Wheels&am=${finalTotal}&cu=INR`;
    window.open(upiUrl, '_blank');
    setUpiAppOpened(true);
  };

  const handlePaymentCompleted = () => {
    if (confirm('Have you successfully completed the UPI payment?')) {
      handlePlaceOrder();
    }
  };

  if (state.items.length === 0 && !orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">No items to checkout</h1>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. We&apos;ll start preparing your delicious ice cream right away!
        </p>
        <div className="bg-gray-50 p-6 rounded-lg mb-8 max-w-md mx-auto">
          <h2 className="font-semibold mb-2">Order Summary</h2>
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Phone:</strong> {customerPhone}</p>
          <p><strong>Order Type:</strong> {orderType === 'dinein' ? 'Dine In' : 'Take Out'}</p>
          <p><strong>Payment:</strong> {upiIds.find(upi => upi.id === selectedPayment)?.app || (selectedPayment === 'cash' ? 'Cash' : 'Unknown')}</p>
          <p><strong>Total:</strong> ₹{placedOrderTotal !== null ? placedOrderTotal : finalTotal}</p>
        </div>

        {/* Print Receipt Button */}
        {printerConnected && currentOrder && (
          <div className="mb-6">
            <button
              onClick={printReceipt}
              className="w-full max-w-md mx-auto block py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              🖨️ Print Receipt
            </button>
          </div>
        )}

        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Order More Ice Cream
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-8 animate-fade-in">
      <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 md:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Type</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="dinein"
                  checked={orderType === 'dinein'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-2xl">🍽️</span>
                <div>
                  <div className="font-medium">Dine In</div>
                  <div className="text-sm text-gray-600">Enjoy at our location</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="takeout"
                  checked={orderType === 'takeout'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-2xl">🥤</span>
                <div>
                  <div className="font-medium">Take Out</div>
                  <div className="text-sm text-gray-600">Pickup from counter</div>
                </div>
              </label>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 md:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 md:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>

            <div className="space-y-3">
              {upiIds.map(upi => (
                <label key={upi.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value={upi.id}
                    checked={selectedPayment === upi.id}
                    onChange={(e) => {
                      setSelectedPayment(e.target.value);
                      setUpiAppOpened(false); // Reset UPI app state when payment method changes
                    }}
                    className="text-blue-600"
                  />
                  {upi.image ? (
                    <img
                      src={upi.image}
                      alt={upi.app}
                      className="w-8 h-8 object-contain rounded"
                    />
                  ) : (
                    <span className="text-2xl">{upi.emoji}</span>
                  )}
                  <div>
                    <div className="font-medium">{upi.app}</div>
                    <div className="text-sm text-gray-600">{upi.id}</div>
                  </div>
                </label>
              ))}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={selectedPayment === 'cash'}
                  onChange={(e) => {
                    setSelectedPayment(e.target.value);
                    setUpiAppOpened(false); // Reset UPI app state when payment method changes
                  }}
                  className="text-blue-600"
                />
                <span className="text-2xl">💵</span>
                <div>
                  <div className="font-medium">Cash</div>
                  <div className="text-sm text-gray-600">Pay at counter</div>
                </div>
              </label>
            </div>

            {selectedPayment && selectedPayment !== 'cash' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex flex-col items-center space-y-3">
                  <p className="text-sm text-blue-800 font-medium text-center">
                    Pay ₹{finalTotal} using UPI
                  </p>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">UPI ID:</p>
                    <p className="font-mono text-sm bg-white px-3 py-2 rounded border">
                      {selectedPayment}
                    </p>
                  </div>
                  {!upiAppOpened ? (
                    <button
                      onClick={handleOpenUpiApp}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Open UPI App
                    </button>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-700 font-medium">✅ UPI App Opened</p>
                      <button
                        onClick={handlePaymentCompleted}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Payment Completed - Place Order
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Or scan any UPI QR code with your preferred app
                  </p>
                </div>
              </div>
            )}
            {selectedPayment === 'cash' && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  Pay ₹{finalTotal} in cash at the counter
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 md:p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

          {/* Order Items */}
          <div className="space-y-3 mb-4">
            {state.items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span>{item.emoji}</span>
                  <div>
                    <div className="font-medium">{item.name} × {item.quantity}</div>
                    {item.customizations && (
                      <div className="text-xs text-gray-500">
                        {item.customizations.size && `Size: ${item.customizations.size}`}
                        {item.customizations.toppings && item.customizations.toppings.length > 0 &&
                          ` • ${item.customizations.toppings.join(', ')}`}
                      </div>
                    )}
                  </div>
                </div>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{state.subtotal}</span>
            </div>
            {state.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({state.appliedPromo?.code})</span>
                <span>-₹{state.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          {/* Print Preview Button */}
          {printerConnected && state.items.length > 0 && (
            <button
              onClick={() => {
                const previewOrder = {
                  orderId: `PREVIEW-${Date.now()}`,
                  customerName: customerName || 'Customer',
                  customerPhone: customerPhone || 'Phone',
                  items: state.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    customizations: item.customizations ? {
                      toppings: Object.values(item.customizations).filter(val => val && val.length > 0)
                    } : undefined
                  })),
                  subtotal: state.subtotal,
                  discount: state.discount,
                  total: finalTotal,
                  paymentMethod: selectedPayment === 'cash' ? 'Cash' : 'UPI',
                  orderType: orderType === 'dinein' ? 'Dine In' : 'Take Out',
                  timestamp: new Date().toISOString()
                };
                printOrderPreview(previewOrder);
              }}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors mb-4 flex items-center justify-center space-x-2"
            >
              <span>🖨️</span>
              <span>Print Order Preview</span>
            </button>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={selectedPayment !== 'cash' && !upiAppOpened}
            className={`w-full py-3 px-4 rounded-lg font-semibold mt-6 transform hover:scale-105 transition-all duration-300 ${
              selectedPayment === 'cash' || upiAppOpened
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {selectedPayment === 'cash'
              ? `Place Order & Pay ₹${finalTotal}`
              : upiAppOpened
                ? `Complete Payment & Place Order ₹${finalTotal}`
                : 'Complete UPI Payment First'
            }
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            By placing this order, you agree to our terms and conditions
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}