import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Query, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
const ORDERS_COLLECTION = 'orders';

// Search orders by orderId, name, phone, and date range
export async function searchOrders({ orderId, name, phone, date }: { orderId?: string; name?: string; phone?: string; date?: string }) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  let q: Query<DocumentData> = ordersRef;
  const filters = [];
  if (orderId) filters.push(where('id', '==', orderId));
  if (name) filters.push(where('customerName', '>=', name), where('customerName', '<=', name + '\uf8ff'));
  if (phone) filters.push(where('customerPhone', '>=', phone), where('customerPhone', '<=', phone + '\uf8ff'));
  if (date) {
    // date format: 'YYYY-MM-DD'
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filters.push(where('timestamp', '>=', start.toISOString()));
    filters.push(where('timestamp', '<=', end.toISOString()));
  }
  let results: any[] = [];
  if (filters.length > 0) {
    try {
      q = query(ordersRef, ...filters);
      const snapshot = await getDocs(q);
      results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          items: data.items,
          total: data.total,
          status: data.status,
          orderType: data.orderType,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          timestamp: data.timestamp,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes
        };
      });
    } catch (e) {
      // fallback: fetch all and filter client-side
      const snapshot = await getDocs(ordersRef);
      results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          items: data.items,
          total: data.total,
          status: data.status,
          orderType: data.orderType,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          timestamp: data.timestamp,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes
        };
      });
    }
  } else {
    const snapshot = await getDocs(ordersRef);
    results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  // Client-side filter for missing fields
  if (orderId) results = results.filter(o => o.id === orderId);
  if (name) results = results.filter(o => o.customerName && o.customerName.toLowerCase().includes(name.toLowerCase()));
  if (phone) results = results.filter(o => o.customerPhone && o.customerPhone.includes(phone));
  if (date) results = results.filter(o => o.timestamp && o.timestamp.slice(0, 10) === date);
  return results;
}

export async function saveOrder(order: any) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  // Remove notes if undefined
  if (order.notes === undefined) {
    delete order.notes;
  }
  await addDoc(ordersRef, order);
}

export async function fetchOrders({ todayOnly = false } = {}) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  let q = ordersRef;
  if (todayOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoStart = today.toISOString();
    q = query(ordersRef, where('timestamp', '>=', isoStart));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      items: data.items,
      total: data.total,
      status: data.status,
      orderType: data.orderType,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      timestamp: data.timestamp,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes
    };
  });
}

export async function clearOrders() {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const snapshot = await getDocs(ordersRef);
  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, ORDERS_COLLECTION, docSnap.id)));
  await Promise.all(deletePromises);
}
