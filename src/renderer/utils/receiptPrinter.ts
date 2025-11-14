/**
 * Thermal Receipt Printer Utility
 * Supports 58mm and 80mm paper sizes with Sinhala/English bilingual printing
 */

interface ReceiptSettings {
  paperSize: '58mm' | '80mm';
  language: 'en' | 'si';
  storeName: string;
  storeNameSi?: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string;
  footer?: string;
  footerSi?: string;
  promoText?: string;
  promoTextSi?: string;
  showQR?: boolean;
  taxNumber?: string;
}

interface BillData {
  billNumber: string;
  createdAt: string;
  cashierName: string;
  customerName?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  notes?: string;
}

export class ReceiptPrinter {
  private settings: ReceiptSettings;
  private maxWidth: number;

  constructor(settings: Partial<ReceiptSettings> = {}) {
    this.settings = {
      paperSize: '80mm',
      language: 'en',
      storeName: 'POS Store',
      address: 'Colombo, Sri Lanka',
      phone: '+94 77 123 4567',
      showQR: false,
      ...settings,
    };

    // Set character width based on paper size
    this.maxWidth = this.settings.paperSize === '58mm' ? 32 : 48;
  }

  /**
   * Generate receipt HTML for printing
   */
  public generateReceipt(billData: BillData): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${this.settings.paperSize === '58mm' ? '58mm' : '80mm'} auto;
      margin: 0;
    }

    body {
      font-family: 'Courier New', monospace;
      font-size: ${this.settings.paperSize === '58mm' ? '10px' : '12px'};
      margin: 0;
      padding: 8px;
      width: ${this.settings.paperSize === '58mm' ? '58mm' : '80mm'};
    }

    .receipt {
      width: 100%;
    }

    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .logo {
      max-width: 100px;
      max-height: 60px;
      margin-bottom: 5px;
    }

    .store-name {
      font-size: ${this.settings.paperSize === '58mm' ? '14px' : '16px'};
      font-weight: bold;
      margin: 5px 0;
    }

    .store-info {
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
      line-height: 1.4;
    }

    .bill-info {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    .items-table th {
      text-align: left;
      border-bottom: 1px solid #000;
      padding: 4px 0;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
    }

    .items-table td {
      padding: 3px 0;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
    }

    .item-name {
      font-weight: bold;
    }

    .text-right {
      text-align: right;
    }

    .totals {
      border-top: 1px dashed #000;
      padding-top: 8px;
      margin-top: 8px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: ${this.settings.paperSize === '58mm' ? '10px' : '11px'};
    }

    .total-row {
      font-size: ${this.settings.paperSize === '58mm' ? '12px' : '14px'};
      font-weight: bold;
      border-top: 1px solid #000;
      border-bottom: 1px double #000;
      padding: 5px 0;
      margin-top: 5px;
    }

    .payment-info {
      margin-top: 8px;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
    }

    .notes {
      margin-top: 8px;
      padding: 5px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
      font-style: italic;
    }

    .footer {
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 8px;
      margin-top: 12px;
      font-size: ${this.settings.paperSize === '58mm' ? '9px' : '10px'};
    }

    .promo {
      background-color: #fff3cd;
      border: 1px dashed #ffb020;
      padding: 5px;
      margin: 8px 0;
      text-align: center;
      font-weight: bold;
    }

    .qr-code {
      text-align: center;
      margin: 10px 0;
    }

    .qr-code img {
      width: 80px;
      height: 80px;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    ${this.generateHeader()}
    ${this.generateBillInfo(billData)}
    ${this.generateItems(billData)}
    ${this.generateTotals(billData)}
    ${this.generatePaymentInfo(billData)}
    ${billData.notes ? this.generateNotes(billData.notes) : ''}
    ${this.settings.promoText || this.settings.promoTextSi ? this.generatePromo() : ''}
    ${this.settings.showQR ? this.generateQRCode(billData.billNumber) : ''}
    ${this.generateFooter()}
  </div>

  <script>
    // Auto-print when loaded
    window.onload = function() {
      window.print();
      // Close window after printing (optional)
      // setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

    return html;
  }

  private generateHeader(): string {
    const storeName = this.settings.language === 'si' && this.settings.storeNameSi
      ? this.settings.storeNameSi
      : this.settings.storeName;

    return `
<div class="header">
  ${this.settings.logo ? `<img src="${this.settings.logo}" alt="Logo" class="logo">` : ''}
  <div class="store-name">${this.escapeHtml(storeName)}</div>
  <div class="store-info">
    ${this.escapeHtml(this.settings.address)}<br>
    ${this.settings.phone}<br>
    ${this.settings.email ? this.settings.email + '<br>' : ''}
    ${this.settings.taxNumber ? 'Tax No: ' + this.settings.taxNumber : ''}
  </div>
</div>`;
  }

  private generateBillInfo(billData: BillData): string {
    const date = new Date(billData.createdAt);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<div class="bill-info">
  <strong>Bill No:</strong> ${billData.billNumber}<br>
  <strong>Date:</strong> ${formattedDate} ${formattedTime}<br>
  <strong>Cashier:</strong> ${this.escapeHtml(billData.cashierName)}
  ${billData.customerName ? `<br><strong>Customer:</strong> ${this.escapeHtml(billData.customerName)}` : ''}
</div>`;
  }

  private generateItems(billData: BillData): string {
    let itemsHtml = `
<table class="items-table">
  <thead>
    <tr>
      <th>Item</th>
      <th class="text-right">Qty</th>
      <th class="text-right">Price</th>
      <th class="text-right">Total</th>
    </tr>
  </thead>
  <tbody>`;

    billData.items.forEach((item) => {
      const itemTotal = item.subtotal - item.discount;
      itemsHtml += `
    <tr>
      <td colspan="4" class="item-name">${this.escapeHtml(item.productName)}</td>
    </tr>
    <tr>
      <td></td>
      <td class="text-right">${item.quantity}</td>
      <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
      <td class="text-right">${this.formatCurrency(itemTotal)}</td>
    </tr>`;

      if (item.discount > 0) {
        itemsHtml += `
    <tr>
      <td colspan="3" style="padding-left: 10px; font-size: 9px;">Discount</td>
      <td class="text-right" style="font-size: 9px;">-${this.formatCurrency(item.discount)}</td>
    </tr>`;
      }
    });

    itemsHtml += `
  </tbody>
</table>`;

    return itemsHtml;
  }

  private generateTotals(billData: BillData): string {
    return `
<div class="totals">
  <div class="totals-row">
    <span>Subtotal:</span>
    <span>${this.formatCurrency(billData.subtotal)}</span>
  </div>
  ${billData.discount > 0 ? `
  <div class="totals-row">
    <span>Discount:</span>
    <span>-${this.formatCurrency(billData.discount)}</span>
  </div>` : ''}
  <div class="totals-row total-row">
    <span>TOTAL:</span>
    <span>${this.formatCurrency(billData.total)}</span>
  </div>
</div>`;
  }

  private generatePaymentInfo(billData: BillData): string {
    const methodLabel = billData.paymentMethod.charAt(0).toUpperCase() + billData.paymentMethod.slice(1);

    return `
<div class="payment-info">
  <strong>Payment Method:</strong> ${methodLabel}<br>
  ${billData.paymentMethod === 'cash' ? `
  <strong>Paid:</strong> ${this.formatCurrency(billData.paidAmount)}<br>
  <strong>Change:</strong> ${this.formatCurrency(billData.changeAmount)}
  ` : ''}
</div>`;
  }

  private generateNotes(notes: string): string {
    return `
<div class="notes">
  <strong>Note:</strong> ${this.escapeHtml(notes)}
</div>`;
  }

  private generatePromo(): string {
    const promoText = this.settings.language === 'si' && this.settings.promoTextSi
      ? this.settings.promoTextSi
      : this.settings.promoText || '';

    return promoText ? `
<div class="promo">
  ${this.escapeHtml(promoText)}
</div>` : '';
  }

  private generateQRCode(billNumber: string): string {
    // Generate QR code using a service or library
    // For now, we'll use a placeholder or QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(billNumber)}`;

    return `
<div class="qr-code">
  <img src="${qrCodeUrl}" alt="QR Code">
  <div style="font-size: 8px; margin-top: 3px;">Scan for digital receipt</div>
</div>`;
  }

  private generateFooter(): string {
    const footerText = this.settings.language === 'si' && this.settings.footerSi
      ? this.settings.footerSi
      : this.settings.footer || 'Thank you! Come again!';

    return `
<div class="footer">
  <div style="font-weight: bold; margin-bottom: 5px;">${this.escapeHtml(footerText)}</div>
  <div style="font-size: 8px; margin-top: 5px;">
    Powered by Premium POS System
  </div>
</div>`;
  }

  private formatCurrency(amount: number): string {
    return `Rs. ${amount.toFixed(2)}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Print receipt by opening in a new window
   */
  public printReceipt(billData: BillData): void {
    const receiptHtml = this.generateReceipt(billData);
    const printWindow = window.open('', '_blank', 'width=400,height=600');

    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    } else {
      throw new Error('Failed to open print window. Please check your popup blocker settings.');
    }
  }
}

/**
 * Get receipt settings from system settings
 */
export async function getReceiptSettings(): Promise<Partial<ReceiptSettings>> {
  try {
    const result = await window.api.getSettings();

    if (result.success) {
      const settings = result.data;

      return {
        paperSize: (settings.printerPaperSize as '58mm' | '80mm') || '80mm',
        storeName: settings.storeName || 'POS Store',
        storeNameSi: settings.storeNameSi,
        address: settings.storeAddress || '',
        phone: settings.storePhone || '',
        email: settings.storeEmail,
        logo: settings.storeLogo,
        footer: settings.receiptFooter || 'Thank you! Come again!',
        footerSi: settings.receiptFooterSi || 'ස්තූතියි! නැවත එන්න!',
        promoText: settings.promoText,
        promoTextSi: settings.promoTextSi,
        showQR: settings.receiptShowQR === 'true',
        taxNumber: settings.taxNumber,
      };
    }

    return {};
  } catch (error) {
    console.error('Failed to load receipt settings:', error);
    return {};
  }
}
