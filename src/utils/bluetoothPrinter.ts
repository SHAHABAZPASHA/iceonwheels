'use client';

// Bluetooth Thermal Printer Service
// Supports ESC/POS commands for thermal printers

import { BluetoothDevice, BluetoothRemoteGATTCharacteristic } from '../types';

interface PrinterDevice {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

class BluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected = false;

  // ESC/POS Commands
  private commands = {
    // Initialize printer
    INIT: new Uint8Array([0x1B, 0x40]),

    // Text formatting
    BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
    DOUBLE_HEIGHT_ON: new Uint8Array([0x1B, 0x21, 0x10]),
    DOUBLE_WIDTH_ON: new Uint8Array([0x1B, 0x21, 0x20]),
    NORMAL_SIZE: new Uint8Array([0x1B, 0x21, 0x00]),

    // Alignment
    ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
    ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),

    // Paper cutting
    CUT_PAPER: new Uint8Array([0x1D, 0x56, 0x42, 0x00]),

    // Line feed
    LF: new Uint8Array([0x0A]),

    // Carriage return
    CR: new Uint8Array([0x0D])
  };

  async connect(): Promise<boolean> {
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported in this browser');
      }

      // Check if we're in a secure context (HTTPS required for Web Bluetooth)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Web Bluetooth requires HTTPS. Please access this site over HTTPS.');
      }

      // Request Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Printer' },
          { namePrefix: 'POS' },
          { namePrefix: 'Thermal' },
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] } // Common thermal printer service
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      // Connect to GATT server
      const server = await this.device.gatt!.connect();

      // Get the primary service (thermal printer service)
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

      // Get the characteristic for writing data
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      this.isConnected = true;
      return true;
    } catch (error: any) {
      console.error('Failed to connect to Bluetooth printer:', error);

      // Handle user cancellation specifically
      if (error.name === 'NotFoundError') {
        // User cancelled the device selection - this is expected behavior
        console.log('User cancelled device selection');
        this.isConnected = false;
        return false;
      }

      // Handle other connection errors with specific messages
      if (error.name === 'NotSupportedError') {
        console.error('Web Bluetooth API not supported in this browser');
        throw new Error('Web Bluetooth is not supported in this browser. Please use a compatible browser like Chrome or Edge.');
      } else if (error.name === 'SecurityError') {
        console.error('Bluetooth access denied - must be served over HTTPS');
        throw new Error('Bluetooth access requires HTTPS. Please access this site over a secure connection.');
      } else if (error.message.includes('HTTPS')) {
        throw error; // Re-throw HTTPS requirement error
      } else if (error.message.includes('not supported')) {
        throw error; // Re-throw browser support error
      } else {
        console.error('Bluetooth connection error:', error.message);
        throw new Error(`Failed to connect to printer: ${error.message}`);
      }
    }
  }

  disconnect(): void {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
  }

  isPrinterConnected(): boolean {
    return this.isConnected && this.device?.gatt?.connected === true;
  }

  private async sendData(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    // Split data into chunks if necessary (some printers have limits)
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }
  }

  private textToBytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }

  private combineArrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  async printReceipt(orderData: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      customizations?: {
        size?: string;
        toppings?: string[];
      };
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    orderType: string;
    timestamp: string;
  }): Promise<void> {
    if (!this.isPrinterConnected()) {
      throw new Error('Printer not connected');
    }

    const receiptData: Uint8Array[] = [];

    // Initialize printer
    receiptData.push(this.commands.INIT);

    // Center align for header
    receiptData.push(this.commands.ALIGN_CENTER);
    receiptData.push(this.commands.DOUBLE_HEIGHT_ON);
    receiptData.push(this.commands.BOLD_ON);

    // Logo/Store Name
    receiptData.push(this.textToBytes('🍨 ICE ON WHEELS 🍨\n'));
    receiptData.push(this.commands.NORMAL_SIZE);
    receiptData.push(this.commands.BOLD_OFF);
    receiptData.push(this.textToBytes('Your Favorite Ice Cream Cart\n'));
    receiptData.push(this.textToBytes('Fresh & Delicious Treats\n\n'));

    // Order details
    receiptData.push(this.commands.ALIGN_LEFT);
    receiptData.push(this.commands.BOLD_ON);
    receiptData.push(this.textToBytes(`Order ID: ${orderData.orderId}\n`));
    receiptData.push(this.textToBytes(`Date: ${new Date(orderData.timestamp).toLocaleString()}\n`));
    receiptData.push(this.textToBytes(`Customer: ${orderData.customerName}\n`));
    receiptData.push(this.textToBytes(`Phone: ${orderData.customerPhone}\n`));
    receiptData.push(this.textToBytes(`Type: ${orderData.orderType === 'pickup' ? 'Pickup' : 'Dine In'}\n`));
    receiptData.push(this.textToBytes(`Payment: ${orderData.paymentMethod}\n`));
    receiptData.push(this.commands.BOLD_OFF);
    receiptData.push(this.textToBytes('================================\n'));

    // Items header
    receiptData.push(this.commands.BOLD_ON);
    receiptData.push(this.textToBytes('Item                    Qty  Price\n'));
    receiptData.push(this.commands.BOLD_OFF);
    receiptData.push(this.textToBytes('--------------------------------\n'));

    // Items
    for (const item of orderData.items) {
      const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
      const quantity = item.quantity.toString().padStart(2, ' ');
      const price = `₹${(item.price * item.quantity).toFixed(2)}`;

      receiptData.push(this.textToBytes(`${itemName.padEnd(22)}${quantity} ${price}\n`));

      // Customizations
      if (item.customizations) {
        if (item.customizations.size) {
          receiptData.push(this.textToBytes(`  Size: ${item.customizations.size}\n`));
        }
        if (item.customizations.toppings && item.customizations.toppings.length > 0) {
          receiptData.push(this.textToBytes(`  Toppings: ${item.customizations.toppings.join(', ')}\n`));
        }
      }
    }

    receiptData.push(this.textToBytes('================================\n'));

    // Totals
    receiptData.push(this.commands.ALIGN_RIGHT);
    receiptData.push(this.textToBytes(`Subtotal: ₹${orderData.subtotal.toFixed(2)}\n`));

    if (orderData.discount > 0) {
      receiptData.push(this.textToBytes(`Discount: -₹${orderData.discount.toFixed(2)}\n`));
    }

    receiptData.push(this.commands.BOLD_ON);
    receiptData.push(this.commands.DOUBLE_HEIGHT_ON);
    receiptData.push(this.textToBytes(`TOTAL: ₹${orderData.total.toFixed(2)}\n`));
    receiptData.push(this.commands.NORMAL_SIZE);
    receiptData.push(this.commands.BOLD_OFF);

    // Footer
    receiptData.push(this.commands.ALIGN_CENTER);
    receiptData.push(this.textToBytes('\n'));
    receiptData.push(this.textToBytes('Thank you for choosing\n'));
    receiptData.push(this.textToBytes('Ice on Wheels!\n'));
    receiptData.push(this.textToBytes('Visit us again soon! 🍦\n'));
    receiptData.push(this.textToBytes('\n'));
    receiptData.push(this.textToBytes('www.iceonwheels.com\n'));

    // Cut paper
    receiptData.push(this.commands.CUT_PAPER);

    // Send all data to printer
    const finalData = this.combineArrays(...receiptData);
    await this.sendData(finalData);
  }

  async printTestReceipt(): Promise<void> {
    if (!this.isPrinterConnected()) {
      throw new Error('Printer not connected');
    }

    const testData: Uint8Array[] = [];

    testData.push(this.commands.INIT);
    testData.push(this.commands.ALIGN_CENTER);
    testData.push(this.commands.DOUBLE_HEIGHT_ON);
    testData.push(this.commands.BOLD_ON);

    testData.push(this.textToBytes('🧪 PRINTER TEST 🧪\n'));
    testData.push(this.commands.NORMAL_SIZE);
    testData.push(this.commands.BOLD_OFF);

    testData.push(this.textToBytes('Ice on Wheels\n'));
    testData.push(this.textToBytes('Printer connection successful!\n'));
    testData.push(this.textToBytes(new Date().toLocaleString() + '\n'));

    testData.push(this.commands.CUT_PAPER);

    const finalData = this.combineArrays(...testData);
    await this.sendData(finalData);
  }
}

// Singleton instance
let printerInstance: BluetoothPrinter | null = null;

export function getBluetoothPrinter(): BluetoothPrinter {
  if (!printerInstance) {
    printerInstance = new BluetoothPrinter();
  }
  return printerInstance;
}

export default BluetoothPrinter;