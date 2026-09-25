import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { fmt, fmtDateTime, paymentMethodLabel } from '../../utils/format'
import { FiPrinter, FiShoppingCart } from 'react-icons/fi'

export default function Receipt({ sale, onNew }) {
  const printRef = useRef()
  const print = useReactToPrint({ content: () => printRef.current })

  const shopName    = 'Beauty & Glow Cosmetics'
  const shopAddress = 'Kampala Road, Kampala, Uganda'
  const shopPhone   = '+256 700 123 456'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Sale Complete!</h1>
        <div className="flex gap-3">
          <button className="btn-outline" onClick={print}><FiPrinter size={16} /> Print Receipt</button>
          <button className="btn-primary" onClick={onNew}><FiShoppingCart size={16} /> New Sale</button>
        </div>
      </div>

      {/* Printable receipt */}
      <div ref={printRef} className="card p-6 font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
          <h2 className="text-xl font-bold">{shopName}</h2>
          <p className="text-gray-500 text-xs">{shopAddress}</p>
          <p className="text-gray-500 text-xs">{shopPhone}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-1 text-xs mb-4">
          <div><span className="text-gray-500">Receipt #:</span> <strong>{sale.receipt_number}</strong></div>
          <div><span className="text-gray-500">Date:</span> {fmtDateTime(sale.created_at)}</div>
          <div><span className="text-gray-500">Cashier:</span> {sale.user?.name}</div>
          <div><span className="text-gray-500">Customer:</span> {sale.customer?.name || 'Walk-in'}</div>
        </div>

        {/* Items */}
        <table className="w-full text-xs mb-4 border-t border-dashed border-gray-300 pt-3">
          <thead>
            <tr className="border-b border-dashed border-gray-300">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map(item => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-1">{item.product?.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{fmt(item.unit_price)}</td>
                <td className="text-right py-1">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-xs">
          <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(sale.subtotal)}</span></div>
          {+sale.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount:</span><span>- {fmt(sale.discount)}</span></div>}
          {+sale.tax > 0 && <div className="flex justify-between"><span>Tax:</span><span>{fmt(sale.tax)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1 mt-1">
            <span>TOTAL:</span><span>{fmt(sale.total)}</span>
          </div>
          <div className="flex justify-between"><span>Paid ({paymentMethodLabel(sale.payment_method)}):</span><span>{fmt(sale.amount_paid)}</span></div>
          {+sale.balance > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Balance Owed:</span><span>{fmt(sale.balance)}</span></div>}
          {+sale.amount_paid > +sale.total && <div className="flex justify-between text-blue-700 font-semibold"><span>Change:</span><span>{fmt(sale.amount_paid - sale.total)}</span></div>}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-dashed border-gray-300 text-xs text-gray-500">
          <p className="font-bold">Thank you for shopping with us!</p>
          <p>Goods once sold are not refundable without receipt.</p>
          <p className="mt-1">Returns accepted within 7 days.</p>
        </div>
      </div>
    </div>
  )
}
