import React, { useRef } from 'react';
import { Printer, X, CheckCircle, Download } from 'lucide-react';
import { Sale } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

export const ReceiptModal: React.FC = () => {
  const { business } = useAuth();
  const { activeReceiptSale, setActiveReceiptSale } = useShop();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!activeReceiptSale) return null;

  const sale = activeReceiptSale;
  const currency = business?.currency || '₹';

  // Calculate total savings from MRP
  const totalSavings = sale.items.reduce((acc, item) => {
    if (item.mrp > item.unitPrice) {
      return acc + ((item.mrp - item.unitPrice) * item.quantity);
    }
    return acc;
  }, 0) + (sale.discountAmount || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold print:hidden">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Bill Generated #{sale.invoiceNumber}</span>
          </div>
          <button
            onClick={() => setActiveReceiptSale(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Slip */}
        <div ref={receiptRef} className="p-6 font-mono text-xs text-slate-800 space-y-4 bg-white print:p-0">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-base font-bold text-slate-950 uppercase tracking-wider">{business?.name}</h2>
            <p className="text-[11px] text-slate-600">{business?.address || 'Retail Grocery Store'}</p>
            <p className="text-[11px] text-slate-600">Phone: {business?.phone || '+91 98000 00000'}</p>
            {business?.gstin && <p className="text-[10px] text-slate-500">GSTIN: {business.gstin}</p>}
          </div>

          {/* Meta */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customerName || 'Walk-in Customer'}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{sale.cashierName}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Rate</span>
              <span className="w-1/6 text-right">Amount</span>
            </div>

            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline py-0.5">
                <span className="w-1/2 truncate font-medium">{item.productName}</span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/6 text-right">{item.unitPrice}</span>
                <span className="w-1/6 text-right font-bold">{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currency}{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Bill Discount:</span>
                <span>- {currency}{sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST Tax:</span>
                <span>{currency}{sale.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-800 text-slate-950">
              <span>GRAND TOTAL:</span>
              <span>{currency}{sale.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase text-slate-900">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Savings Callout */}
          {totalSavings > 0 && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-center text-[11px] font-bold text-emerald-800">
              You saved {currency}{totalSavings.toFixed(2)} on this purchase!
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300 space-y-0.5">
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold can be exchanged within 48 hours with bill.</p>
            <p className="font-sans font-semibold text-slate-700">Powered by MyShoply</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 print:hidden">
          <button
            onClick={() => setActiveReceiptSale(null)}
            className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close (Esc)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
