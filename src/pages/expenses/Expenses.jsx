import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { fmt, fmtDate, paymentMethodLabel, statusBadge } from '../../utils/format'

const empty = { category_id: '', description: '', amount: '', payment_method: 'cash', expense_date: new Date().toISOString().split('T')[0], receipt_number: '' }

export default function Expenses() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [page, setPage]         = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null)
  const [error, setError]       = useState('')
  const [confirm, setConfirm]   = useState(null)
  const [categories, setCategories] = useState([])
  const [catModal, setCatModal] = useState(false)
  const [newCat, setNewCat]     = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/expenses?page=${page}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, dateFrom, dateTo])
  useEffect(() => {
    api.get('/expense-categories').then(r => setCategories(r.data))
  }, [])

  const openAdd  = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = r  => { setEditing(r); setForm({ category_id: r.category_id, description: r.description, amount: r.amount, payment_method: r.payment_method, expense_date: r.expense_date, receipt_number: r.receipt_number || '' }); setError(''); setModal(true) }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form)
      else await api.post('/expenses', form)
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  const addCategory = async () => {
    if (!newCat.trim()) return
    await api.post('/expense-categories', { name: newCat })
    const { data } = await api.get('/expense-categories')
    setCategories(data)
    setCatModal(false)
    setNewCat('')
  }

  const total = rows.reduce((s, r) => s + +r.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <div className="flex gap-2">
          <button className="btn-outline text-sm" onClick={() => setCatModal(true)}>Manage Categories</button>
          <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Expense</button>
        </div>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <input className="input w-40" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input className="input w-40" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
        {rows.length > 0 && <div className="ml-auto font-semibold text-gray-700">Total: <span className="text-primary-700">{fmt(total)}</span></div>}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Date</th>
              <th className="table-th">Category</th>
              <th className="table-th">Description</th>
              <th className="table-th">Method</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Recorded By</th>
              <th className="table-th w-20">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td text-gray-500">{fmtDate(r.expense_date)}</td>
                  <td className="table-td"><span className="badge-blue">{r.category?.name}</span></td>
                  <td className="table-td">{r.description}</td>
                  <td className="table-td text-gray-500">{paymentMethodLabel(r.payment_method)}</td>
                  <td className="table-td text-right font-semibold text-red-600">{fmt(r.amount)}</td>
                  <td className="table-td text-gray-500">{r.user?.name}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => openEdit(r)}><FiEdit2 size={15} /></button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => setConfirm(r.id)}><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">No expenses found</td></tr>}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'} size="md">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="space-y-4">
          <div><label className="label">Category *</label>
            <select className="select" value={form.category_id} onChange={e => f('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Description *</label><textarea className="input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Amount (UGX) *</label><input className="input" type="number" min="0" value={form.amount} onChange={e => f('amount', e.target.value)} /></div>
            <div><label className="label">Date *</label><input className="input" type="date" value={form.expense_date} onChange={e => f('expense_date', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Payment Method</label>
              <select className="select" value={form.payment_method} onChange={e => f('payment_method', e.target.value)}>
                {['cash','mtn_momo','airtel_money','bank','card','other'].map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
              </select>
            </div>
            <div><label className="label">Receipt Number</label><input className="input" value={form.receipt_number} onChange={e => f('receipt_number', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save Expense</button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Expense Categories" size="sm">
        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
          {categories.map(c => <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 text-sm"><span>{c.name}</span><span className={statusBadge(c.status)}>{c.status}</span></div>)}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="New category name" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <button className="btn-primary" onClick={addCategory}><FiPlus size={14} /></button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={async () => { await api.delete(`/expenses/${confirm}`); load() }}
        title="Delete Expense" message="Delete this expense record?" danger />
    </div>
  )
}
