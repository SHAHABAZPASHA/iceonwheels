'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBluetoothPrinter } from '../../../../utils/bluetoothPrinter';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  timestamp: string;
  deliveryAddress?: string;
  notes?: string;
}

export default function OrdersManagement() {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchDate('');
  };
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        router.push('/admin/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);
  }, []);

  // Fetch orders from Firestore
  useEffect(() => {
    if (isLoading || !user) return;
    import('../../../../utils/firestoreOrders').then(({ fetchOrders }) => {
      fetchOrders().then((results) => {
        setOrders(Array.isArray(results)
          ? (results.filter(o =>
              o.id && o.customerName && o.customerPhone && o.items && o.total && o.status && o.orderType && o.paymentMethod && o.paymentStatus && o.timestamp
            ) as Order[])
          : []);
      });
    });
  }, [isLoading, user]);

  // Search handler for Firestore
  const handleSearch = async () => {
    import('../../../../utils/firestoreOrders').then(({ searchOrders }) => {
      searchOrders({
        orderId: searchTerm,
        name: searchTerm,
        phone: searchTerm,
        date: searchDate
      }).then((results) => {
        setOrders(Array.isArray(results)
          ? (results.filter(o =>
              o.id && o.customerName && o.customerPhone && o.items && o.total && o.status && o.orderType && o.paymentMethod && o.paymentStatus && o.timestamp
            ) as Order[])
          : []);
      });
    });
  };

  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    // All order state is now Firestore-only
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // Update status in Firestore
    import('../../../../utils/firestoreOrders').then(async ({ fetchOrders, saveOrder }) => {
      const allOrders = await fetchOrders();
      const orderToUpdate = allOrders.find(o => o.id === orderId);
      if (orderToUpdate) {
        const updatedOrder = { ...orderToUpdate, status: newStatus };
        await saveOrder(updatedOrder);
        // Refresh orders
        const refreshed = await fetchOrders();
        setOrders(Array.isArray(refreshed)
          ? (refreshed.filter(o =>
              o.id && o.customerName && o.customerPhone && o.items && o.total && o.status && o.orderType && o.paymentMethod && o.paymentStatus && o.timestamp
            ) as Order[])
          : []);
      }
    });
  };

  const updatePaymentStatus = async (orderId: string, newStatus: Order['paymentStatus']) => {
    import('../../../../utils/firestoreOrders').then(async ({ fetchOrders, saveOrder }) => {
      const allOrders = await fetchOrders();
      const orderToUpdate = allOrders.find(o => o.id === orderId);
      if (orderToUpdate) {
        const updatedOrder = { ...orderToUpdate, paymentStatus: newStatus };
        await saveOrder(updatedOrder);
        // Refresh orders
        const refreshed = await fetchOrders();
        setOrders(refreshed);
      }
    });
  };

  const cancelOrder = async (orderId: string) => {
    import('../../../../utils/firestoreOrders').then(async ({ fetchOrders, saveOrder }) => {
      const allOrders = await fetchOrders();
      const order = allOrders.find(o => o.id === orderId);
      if (!order) return;
      const confirmMessage = `Are you sure you want to cancel order #${orderId}?\n\nCustomer: ${order.customerName}\nTotal: ₹${order.total}\n\nThis action cannot be undone.`;
      if (confirm(confirmMessage)) {
        const updatedOrder = { ...order, status: 'cancelled', paymentStatus: 'failed' };
        await saveOrder(updatedOrder);
        alert(`Order #${orderId} has been cancelled successfully.`);
        // Refresh orders
        const refreshed = await fetchOrders();
        setOrders(Array.isArray(refreshed)
          ? (refreshed.filter(o =>
              o.id && o.customerName && o.customerPhone && o.items && o.total && o.status && o.orderType && o.paymentMethod && o.paymentStatus && o.timestamp
            ) as Order[])
          : []);
      }
    });
  };

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

  const printOrderReceipt = async (order: Order) => {
    if (!printerConnected) {
      alert('Please connect to printer first.');
      return;
    }

    try {
      const printer = getBluetoothPrinter();

      // Convert order to receipt format
      const receiptData = {
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations && item.customizations.length > 0 ? {
            toppings: item.customizations
          } : undefined
        })),
        subtotal: order.total, // Assuming no discount for admin orders
        discount: 0,
        total: order.total,
        paymentMethod: order.paymentMethod === 'cash' ? 'Cash' : 'UPI',
        orderType: order.orderType === 'pickup' ? 'Pickup' : 'Delivery',
        timestamp: order.timestamp
      };

      await printer.printReceipt(receiptData);
      alert('Receipt printed successfully!');
    } catch (error) {
      console.error('Printing error:', error);
      alert('Failed to print receipt. Please check printer connection.');
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

  // Show new orders on top
  const filteredOrders = orders
    .filter(order => {
      if (filter === 'all') return true;
      return order.status === filter;
    })
    .slice().reverse();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Printer Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Printer:</span>
                <span className={`text-sm font-medium ${printerConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {printerConnected ? '🟢 Connected' : '🔴 Not Connected'}
                </span>
                {!printerConnected ? (
                  <button
                    onClick={connectPrinter}
                    disabled={isConnectingPrinter}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      isConnectingPrinter
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isConnectingPrinter ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    onClick={printTestReceipt}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Test Print
                  </button>
                )}
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6">
          <input
            type="text"
            placeholder="Search by Order ID, Name, or Phone"
            className="px-3 py-2 border border-gray-300 rounded-md mb-2 md:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setSearchTerm(e.target.value)}
            value={searchTerm}
            style={{ minWidth: 220 }}
          />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setSearchDate(e.target.value)}
            value={searchDate}
            style={{ minWidth: 160 }}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-0 md:ml-2"
            onClick={handleSearch}
          >
            Search
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 ml-2"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        </div>
        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders
            .filter(order => {
              // Search by order ID, name, phone
              const term = searchTerm.trim().toLowerCase();
              const matchesTerm =
                !term ||
                order.id.toLowerCase().includes(term) ||
                order.customerName.toLowerCase().includes(term) ||
                order.customerPhone.toLowerCase().includes(term);
              // Filter by date
              const matchesDate = !searchDate || new Date(order.timestamp).toISOString().slice(0, 10) === searchDate;
              return matchesTerm && matchesDate;
            })
            .map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Customer:</strong> {order.customerName}</p>
                    <p><strong>Phone:</strong> {order.customerPhone}</p>
                    <p><strong>Type:</strong> {order.orderType} • <strong>Payment:</strong> {order.paymentMethod}</p>
                    <p><strong>Time:</strong> {new Date(order.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹{order.total}</p>
                  <p className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4 mb-4">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.customizations && item.customizations.length > 0 && (
                          <span className="text-gray-500 ml-2">
                            ({item.customizations.join(', ')})
                          </span>
                        )}
                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => printOrderReceipt(order)}
                    disabled={!printerConnected}
                    className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                      printerConnected
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </button>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Confirm
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && order.orderType === 'pickup' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Mark Picked Up
                    </button>
                  )}
                  {order.status === 'ready' && order.orderType === 'delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Mark Delivered
                    </button>
                  )}
                  {order.paymentStatus === 'pending' && (
                    <button
                      onClick={() => updatePaymentStatus(order.id, 'paid')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Mark Paid
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.filter(order => {
          const term = searchTerm.trim().toLowerCase();
          const matchesTerm =
            !term ||
            order.id.toLowerCase().includes(term) ||
            order.customerName.toLowerCase().includes(term) ||
            order.customerPhone.toLowerCase().includes(term);
          const matchesDate = !searchDate || new Date(order.timestamp).toISOString().slice(0, 10) === searchDate;
          return matchesTerm && matchesDate;
        }).length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No orders have been placed yet.' : `No orders with status "${filter}".`}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            printerConnected={printerConnected}
            onPrintReceipt={printOrderReceipt}
            onCancelOrder={cancelOrder}
          />
        )}
      </div>
    </div>
  );
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  printerConnected: boolean;
  onPrintReceipt: (order: Order) => Promise<void>;
  onCancelOrder: (orderId: string) => void;
}

function OrderDetailsModal({ order, onClose, printerConnected, onPrintReceipt, onCancelOrder }: OrderDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order #{order.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.customerPhone}</p>
              {order.customerEmail && <p><strong>Email:</strong> {order.customerEmail}</p>}
              <p><strong>Order Type:</strong> {order.orderType}</p>
              {order.deliveryAddress && (
                <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </p>
              <p><strong>Payment:</strong> {order.paymentMethod}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </p>
              <p><strong>Time:</strong> {new Date(order.timestamp).toLocaleString()}</p>
              <p><strong>Total:</strong> ₹{order.total}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.customizations && item.customizations.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Customizations: {item.customizations.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-medium">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded">{order.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => onCancelOrder(order.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Cancel Order
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => onPrintReceipt(order)}
              disabled={!printerConnected}
              className={`px-4 py-2 rounded font-medium flex items-center space-x-2 ${
                printerConnected
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <span>🖨️</span>
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: Order['status']) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'preparing': return 'bg-orange-100 text-orange-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-purple-100 text-purple-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusColor(status: Order['paymentStatus']) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}