import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { FiSearch, FiAlertTriangle, FiSettings } from 'react-icons/fi'
import { fmt, fmtNum } from '../../utils/format'

export default function Inventory() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [selected, setSelected] = useState(null)
  const [adjForm, setAdjForm]   = useState({ type: 'adjustment', quantity: '', notes: '' })
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const load = () => {
    setLoading(true)
    const lowStock = filter === 'low' ? '&low_stock=1' : ''
    api.get(`/products?page=${page}&search=${search}${lowStock}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search, filter])

  const openAdj = (p) => { setSelected(p); setAdjForm({ type: 'adjustment', quantity: '', notes: '' }); setError(''); setModal(true) }

  const submitAdj = async () => {
    setError('')
    try {
      await api.post(`/products/${selected.id}/adjust-stock`, adjForm)
      setSuccess('Stock adjusted successfully')
      setModal(false); load()
    } catch (e) {
      setError(e.response?.data?.message || 'Error')
    }
  }

  const stockLevel = (p) => {
    const q = p.inventory?.quantity ?? 0
    if (q <= 0) return { label: 'Out of Stock', cls: 'badge-red' }
    if (q <= p.reorder_level) return { label: 'Low Stock', cls: 'badge-yellow' }
    return { label: 'In Stock', cls: 'badge-green' }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filters */}
      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="flex gap-2">
          {['', 'low'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === '' ? 'All Products' : 'Low Stock'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr>
                <th className="table-th">Product</th>
                <th className="table-th">SKU</th>
                <th className="table-th">Category</th>
                <th className="table-th text-right">Stock Qty</th>
                <th className="table-th text-right">Reorder Level</th>
                <th className="table-th text-right">Stock Value</th>
                <th className="table-th">Status</th>
                <th className="table-th w-16">Adjust</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => {
                  const qty = r.inventory?.quantity ?? 0
                  const level = stockLevel(r)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-td">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.brand?.name}</p>
                      </td>
                      <td className="table-td font-mono text-xs">{r.sku}</td>
                      <td className="table-td text-gray-500">{r.category?.name || '—'}</td>
                      <td className="table-td text-right font-semibold">
                        {fmtNum(qty)} <span className="text-xs text-gray-400">{r.unit}</span>
                      </td>
                      <td className="table-td text-right text-gray-500">{r.reorder_level}</td>
                      <td className="table-td text-right">{fmt(qty * r.purchase_price)}</td>
                      <td className="table-td">
                        <span className={level.cls}>
                          {qty <= r.reorder_level && qty > 0 && <FiAlertTriangle size={11} className="inline mr-1" />}
                          {level.label}
                        </span>
                      </td>
                      <td className="table-td">
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => openAdj(r)} title="Adjust stock">
                          <FiSettings size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No products</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Adjust Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Adjust Stock — ${selected?.name}`} size="sm">
        <Alert type="error" message={error} onClose={() => setError('')} />
        {selected && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Current stock: </span>
            <span className="font-bold">{fmtNum(selected.inventory?.quantity ?? 0)} {selected.unit}</span>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Adjustment Type</label>
            <select className="select" value={adjForm.type} onChange={e => setAdjForm(p => ({ ...p, type: e.target.value }))}>
              <option value="adjustment">Adjustment (add/subtract)</option>
              <option value="damaged">Damaged goods (subtract)</option>
              <option value="expired">Expired goods (subtract)</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity (use negative to subtract)</label>
            <input className="input" type="number" placeholder="e.g. 10 or -5" value={adjForm.quantity}
              onChange={e => setAdjForm(p => ({ ...p, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes / Reason</label>
            <textarea className="input" rows={2} value={adjForm.notes} onChange={e => setAdjForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitAdj}>Apply Adjustment</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
