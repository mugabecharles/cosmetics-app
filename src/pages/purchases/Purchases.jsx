import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { FiPlus, FiTrash2, FiEye, FiSearch } from 'react-icons/fi'
import { fmt, fmtDate, statusBadge, paymentMethodLabel } from '../../utils/format'

const METHODS = ['cash', 'mtn_momo', 'airtel_money', 'bank', 'card', 'credit', 'other']

export default function Purchases() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [page, setPage]       = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError]     = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts]   = useState([])
  const [form, setForm] = useState({ supplier_id: '', purchase_date: new Date().toISOString().split('T')[0], invoice_number: '', payment_method: 'cash', amount_paid: '', discount: 0, notes: '' })
  const [items, setItems] = useState([])

  const load = () => {
    setLoading(true)
    api.get(`/purchases?page=${page}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, dateFrom, dateTo])
  useEffect(() => {
    api.get('/suppliers/all').then(r => setSuppliers(r.data))
    api.get('/products/all').then(r => setProducts(r.data))
  }, [])

  const openNew = () => {
    setForm({ supplier_id: '', purchase_date: new Date().toISOString().split('T')[0], invoice_number: '', payment_method: 'cash', amount_paid: '', discount: 0, notes: '' })
    setItems([])
    setError('')
    setModal(true)
  }
  const openView = async r => {
    const { data } = await api.get(`/purchases/${r.id}`)
    setSelected(data); setViewModal(true)
  }

  const addItem = () => setItems(p => [...p, { product_id: '', quantity: 1, unit_cost: '' }])
  const removeItem = i => setItems(p => p.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => setItems(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x))

  const subtotal = items.reduce((s, i) => s + (+(i.quantity || 0) * +(i.unit_cost || 0)), 0)
  const total    = subtotal - +(form.discount || 0)

  const save = async () => {
    setError('')
    if (!form.supplier_id) return setError('Select a supplier')
    if (!items.length || items.some(i => !i.product_id || !i.unit_cost)) return setError('Add at least one complete item')
    try {
      await api.post('/purchases', { ...form, items, amount_paid: form.amount_paid || 0 })
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Purchases</h1>
        <button className="btn-primary" onClick={openNew}><FiPlus size={16} /> New Purchase</button>
      </div>
      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <input className="input w-40" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input className="input w-40" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr>
                <th className="table-th">PO #</th>
                <th className="table-th">Date</th>
                <th className="table-th">Supplier</th>
                <th className="table-th">Invoice</th>
                <th className="table-th text-right">Total</th>
                <th className="table-th text-right">Paid</th>
                <th className="table-th text-right">Balance</th>
                <th className="table-th">Status</th>
                <th className="table-th w-16">View</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono font-semibold text-primary-700">{r.purchase_number}</td>
                    <td className="table-td text-gray-500">{fmtDate(r.purchase_date)}</td>
                    <td className="table-td">{r.supplier?.name}</td>
                    <td className="table-td text-gray-500">{r.invoice_number || '—'}</td>
                    <td className="table-td text-right font-semibold">{fmt(r.total)}</td>
                    <td className="table-td text-right text-green-700">{fmt(r.amount_paid)}</td>
                    <td className={`table-td text-right ${+r.balance > 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(r.balance)}</td>
                    <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                    <td className="table-td"><button className="text-blue-600 hover:text-blue-800" onClick={() => openView(r)}><FiEye size={15} /></button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No purchases found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* New Purchase Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Purchase" size="xl">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label">Supplier *</label>
            <select className="select" value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Purchase Date *</label><input className="input" type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} /></div>
          <div><label className="label">Invoice Number</label><input className="input" value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} /></div>
          <div><label className="label">Payment Method</label>
            <select className="select" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
              {METHODS.map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
            </select>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Purchase Items</h3>
            <button className="btn-secondary text-xs" onClick={addItem}><FiPlus size={12} /> Add Item</button>
          </div>
          {items.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No items added yet</p> : (
            <table className="w-full text-sm">
              <thead><tr><th className="table-th">Product</th><th className="table-th text-right">Qty</th><th className="table-th text-right">Unit Cost</th><th className="table-th text-right">Total</th><th className="table-th w-8" /></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="table-td">
                      <select className="select text-xs" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="table-td text-right"><input className="input w-20 text-right text-xs" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td>
                    <td className="table-td text-right"><input className="input w-28 text-right text-xs" type="number" min="0" value={item.unit_cost} onChange={e => updateItem(i, 'unit_cost', e.target.value)} /></td>
                    <td className="table-td text-right">{fmt((+item.quantity || 0) * (+item.unit_cost || 0))}</td>
                    <td className="table-td"><button className="text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><FiTrash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="label">Discount (UGX)</label><input className="input" type="number" min="0" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} /></div>
          <div><label className="label">Amount Paid (UGX)</label><input className="input" type="number" min="0" value={form.amount_paid} onChange={e => setForm(p => ({ ...p, amount_paid: e.target.value }))} placeholder={total} /></div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4 space-y-1">
          <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between"><span>Discount:</span><span>-{fmt(+form.discount || 0)}</span></div>
          <div className="flex justify-between font-bold"><span>Total:</span><span>{fmt(total)}</span></div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Confirm Purchase</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={`Purchase — ${selected?.purchase_number}`} size="lg">
        {selected && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">Supplier:</span> <strong>{selected.supplier?.name}</strong></div>
              <div><span className="text-gray-500">Date:</span> {fmtDate(selected.purchase_date)}</div>
              <div><span className="text-gray-500">Invoice:</span> {selected.invoice_number || '—'}</div>
              <div><span className="text-gray-500">Received by:</span> {selected.user?.name}</div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead><tr><th className="table-th">Product</th><th className="table-th text-right">Qty</th><th className="table-th text-right">Unit Cost</th><th className="table-th text-right">Total</th></tr></thead>
              <tbody>{selected.items?.map(i => (
                <tr key={i.id} className="border-t border-gray-50">
                  <td className="table-td">{i.product?.name}</td>
                  <td className="table-td text-right">{i.quantity}</td>
                  <td className="table-td text-right">{fmt(i.unit_cost)}</td>
                  <td className="table-td text-right font-semibold">{fmt(i.total)}</td>
                </tr>
              ))}</tbody>
            </table>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Total:</span><span className="font-bold">{fmt(selected.total)}</span></div>
              <div className="flex justify-between text-green-700"><span>Paid:</span><span>{fmt(selected.amount_paid)}</span></div>
              {+selected.balance > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Balance:</span><span>{fmt(selected.balance)}</span></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
