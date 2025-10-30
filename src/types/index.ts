export interface IceCreamItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: string;
  image?: string; // Optional image field for admin-uploaded images
  available?: boolean; // Optional availability flag for menu item
}

export interface CartItem extends IceCreamItem {
  quantity: number;
  customizations?: {
    size?: 'small' | 'medium' | 'large';
    toppings?: string[];
    flavor?: string;
  };
}

export interface PromoCode {
  code: string;
  discount: number; // percentage or fixed amount
  type: 'percentage' | 'fixed';
  minimumOrder?: number;
  maximumDiscount?: number;
  applicableItems?: string[];
}

export interface AdminPromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  applicableItems?: string[]; // item IDs this promo applies to
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

// Web Bluetooth API Types
export interface Bluetooth {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

export interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
}

export interface BluetoothLEScanFilter {
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
}

export interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

export interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

export type BluetoothServiceUUID = string | number;
export type BluetoothCharacteristicUUID = string | number;

// Extend Navigator interface
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}