import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { FiPlus, FiEye, FiSearch } from 'react-icons/fi'
import { fmt, fmtDateTime, statusBadge, paymentMethodLabel } from '../../utils/format'

const REASONS = ['wrong_product', 'damaged', 'customer_changed_mind', 'product_defect', 'wrong_quantity', 'other']

export default function Returns() {
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selected, setSelected]   = useState(null)
  const [error, setError]   = useState('')
  // New return form
  const [receiptNum, setReceiptNum] = useState('')
  const [foundSale, setFoundSale]   = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [reason, setReason] = useState('customer_changed_mind')
  const [refundMethod, setRefundMethod] = useState('cash')
  const [notes, setNotes]   = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/returns?page=${page}`).then(r => { setRows(r.data.data); setMeta(r.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page])

  const searchSale = async () => {
    setError(''); setFoundSale(null); setReturnItems([])
    try {
      const { data } = await api.get(`/sales?search=${receiptNum}`)
      const sale = data.data?.[0]
      if (!sale) return setError('Sale not found')
      const full = (await api.get(`/sales/${sale.id}`)).data
      setFoundSale(full)
      setReturnItems(full.items.map(i => ({ ...i, returnQty: 0, restock: true })))
    } catch { setError('Error searching sale') }
  }

  const submitReturn = async () => {
    setError('')
    const items = returnItems.filter(i => i.returnQty > 0).map(i => ({ product_id: i.product_id, quantity: i.returnQty, restock: i.restock }))
    if (!items.length) return setError('Enter at least one return quantity')
    try {
      await api.post('/returns', { sale_id: foundSale.id, reason, items, refund_method: refundMethod, notes })
      setModal(false); load()
    } catch (e) {
      setError(e.response?.data?.message || 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Returns</h1>
        <button className="btn-primary" onClick={() => { setModal(true); setFoundSale(null); setReceiptNum(''); setError('') }}><FiPlus size={16} /> New Return</button>
      </div>
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Return #</th>
              <th className="table-th">Date</th>
              <th className="table-th">Original Sale</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Reason</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th w-16">View</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-primary-700">{r.return_number}</td>
                  <td className="table-td text-xs text-gray-500">{fmtDateTime(r.created_at)}</td>
                  <td className="table-td font-mono text-xs">{r.sale?.receipt_number}</td>
                  <td className="table-td">{r.customer?.name || '—'}</td>
                  <td className="table-td text-gray-500 text-xs">{r.reason.replace(/_/g, ' ')}</td>
                  <td className="table-td text-right font-semibold">{fmt(r.total_amount)}</td>
                  <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="table-td">
                    <button className="text-blue-600 hover:text-blue-800" onClick={async () => {
                      const { data } = await api.get(`/returns/${r.id}`)
                      setSelected(data); setViewModal(true)
                    }}><FiEye size={15} /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No returns found</td></tr>}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* New Return Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Process Return" size="lg">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="flex gap-2 mb-4">
          <input className="input flex-1" placeholder="Enter receipt number (e.g. CS-000001)" value={receiptNum} onChange={e => setReceiptNum(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchSale()} />
          <button className="btn-secondary" onClick={searchSale}><FiSearch size={14} /> Search</button>
        </div>
        {foundSale && (
          <>
            <div className="bg-blue-50 rounded-lg p-3 text-sm mb-4">
              <p><strong>Receipt:</strong> {foundSale.receipt_number} &nbsp;|&nbsp; <strong>Customer:</strong> {foundSale.customer?.name || 'Walk-in'} &nbsp;|&nbsp; <strong>Total:</strong> {fmt(foundSale.total)}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-2">Select items to return:</h3>
              <table className="w-full text-sm">
                <thead><tr><th className="table-th">Product</th><th className="table-th text-right">Sold Qty</th><th className="table-th text-right">Return Qty</th><th className="table-th">Restock?</th></tr></thead>
                <tbody>{returnItems.map((i, idx) => (
                  <tr key={i.id}><td className="table-td">{i.product?.name}</td>
                    <td className="table-td text-right">{i.quantity}</td>
                    <td className="table-td text-right"><input className="input w-20 text-right text-xs" type="number" min="0" max={i.quantity} value={i.returnQty}
                      onChange={e => setReturnItems(p => p.map((x, xi) => xi === idx ? { ...x, returnQty: +e.target.value } : x))} /></td>
                    <td className="table-td"><input type="checkbox" checked={i.restock} onChange={e => setReturnItems(p => p.map((x, xi) => xi === idx ? { ...x, restock: e.target.checked } : x))} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="label">Reason</label>
                <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
                  {REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Refund Method</label>
                <select className="select" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                  {['cash','mtn_momo','airtel_money','bank','credit','other'].map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
                </select>
              </div>
              <div><label className="label">Notes</label><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitReturn}>Process Return</button>
            </div>
          </>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={`Return — ${selected?.return_number}`} size="md">
        {selected && (
          <div className="text-sm space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Original Sale:</span> {selected.sale?.receipt_number}</div>
              <div><span className="text-gray-500">Date:</span> {fmtDateTime(selected.created_at)}</div>
              <div><span className="text-gray-500">Reason:</span> {selected.reason.replace(/_/g,' ')}</div>
              <div><span className="text-gray-500">Refund:</span> {paymentMethodLabel(selected.refund_method)}</div>
            </div>
            <table className="w-full">
              <thead><tr><th className="table-th">Product</th><th className="table-th text-right">Qty</th><th className="table-th text-right">Amount</th></tr></thead>
              <tbody>{selected.items?.map(i => (
                <tr key={i.id}><td className="table-td">{i.product?.name}</td><td className="table-td text-right">{i.quantity}</td><td className="table-td text-right">{fmt(i.amount)}</td></tr>
              ))}</tbody>
            </table>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-100"><span>Total Refund:</span><span>{fmt(selected.total_amount)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
