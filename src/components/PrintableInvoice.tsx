/**
 * Bike Workshop Manager - Printable Invoice & Thermal Receipt Component
 */

import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { Invoice, ShopSettings } from '../types';

interface PrintableInvoiceProps {
  invoice: Invoice;
  settings: ShopSettings;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isThermal = settings.invoicePrintFormat === 'thermal_80mm';

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Controls Container (Hidden during print) */}
      <div className="bg-white border border-[#EBE3DC] text-[#423D39] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 print:hidden my-8">
        
        <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E67E22]" />
            <h3 className="font-bold text-lg text-[#423D39]">Invoice Preview</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Receipt / Invoice
            </button>
            <button onClick={onClose} className="p-2 text-[#8E8781] hover:text-[#423D39] rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT PREVIEW CANVAS */}
        <div className="flex justify-center bg-[#FAF7F5] p-6 rounded-xl border border-[#EBE3DC] overflow-x-auto">
          
          <div
            id="printable-area"
            className={`bg-white text-black p-6 font-mono text-xs shadow-2xl ${
              isThermal ? 'w-[320px] text-[11px]' : 'w-[595px] text-xs min-h-[842px]'
            }`}
            style={{ color: '#000', backgroundColor: '#fff' }}
          >
            
            {/* Header */}
            <div className="text-center border-b border-black pb-3 mb-3">
              <h1 className="font-black text-lg uppercase tracking-tight">{settings.shopName}</h1>
              <div className="text-[10px] italic">{settings.tagline}</div>
              <div className="text-[10px] mt-1">{settings.address}</div>
              <div className="text-[10px] font-bold mt-0.5">Ph: {settings.phone}</div>
            </div>

            {/* Receipt Meta */}
            <div className="flex justify-between border-b border-black pb-2 mb-3 text-[10px]">
              <div>
                <div><strong>Invoice #:</strong> {invoice.invoiceNumber}</div>
                <div><strong>Date:</strong> {invoice.date}</div>
              </div>
              <div className="text-right">
                <div><strong>Pay Method:</strong> {invoice.paymentMethod}</div>
                <div><strong>Status:</strong> {invoice.status}</div>
              </div>
            </div>

            {/* Customer & Bike Info */}
            <div className="border-b border-black pb-2 mb-3 text-[10px]">
              <div><strong>Customer:</strong> {invoice.customerName} ({invoice.customerPhone})</div>
              {invoice.bikeRegNumber && (
                <div><strong>Bike Reg #:</strong> {invoice.bikeRegNumber} ({invoice.bikeCompany} {invoice.bikeModel})</div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-3">
              <thead>
                <tr className="border-b border-black text-[10px] font-bold uppercase">
                  <th className="py-1">Item Description</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1 text-[10px] font-bold">{item.description}</td>
                    <td className="py-1 text-center text-[10px]">{item.qty}</td>
                    <td className="py-1 text-right text-[10px]">{item.unitPrice}</td>
                    <td className="py-1 text-right text-[10px] font-bold">{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Calculations */}
            <div className="border-t-2 border-black pt-2 space-y-1 text-right text-[11px] mb-4">
              <div className="flex justify-between">
                <span>Parts Subtotal:</span>
                <span>{settings.currency} {invoice.subtotal}</span>
              </div>

              {invoice.labourAmount > 0 && (
                <div className="flex justify-between">
                  <span>Labour / Service:</span>
                  <span>{settings.currency} {invoice.labourAmount}</span>
                </div>
              )}

              {invoice.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>-{settings.currency} {invoice.discount}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                <span>GRAND TOTAL:</span>
                <span>{settings.currency} {invoice.totalAmount}</span>
              </div>

              <div className="flex justify-between text-[10px]">
                <span>Paid Amount:</span>
                <span>{settings.currency} {invoice.paidAmount}</span>
              </div>

              {invoice.balanceDue > 0 && (
                <div className="flex justify-between font-bold text-red-600 text-[10px]">
                  <span>Balance Due:</span>
                  <span>{settings.currency} {invoice.balanceDue}</span>
                </div>
              )}
            </div>

            {/* Terms & Footer */}
            <div className="text-center text-[9px] border-t border-dashed border-black pt-2 space-y-0.5">
              <p className="font-bold">{settings.terms}</p>
              <p className="mt-1">*** THANK YOU FOR YOUR BUSINESS ***</p>
              <p className="text-[8px] text-gray-500">Bike Workshop Manager Offline Desktop System</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
