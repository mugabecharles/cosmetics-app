import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FiPlus, FiEdit2, FiEye, FiSearch, FiDollarSign } from 'react-icons/fi'
import { fmt, fmtDateTime, statusBadge, paymentMethodLabel } from '../../utils/format'

const empty = { name: '', phone: '', email: '', address: '', gender: '', customer_type: 'retail', credit_limit: 0, status: 'active' }
const TYPES = ['walk_in', 'retail', 'wholesale', 'vip', 'credit']

export default function Customers() {
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError]   = useState('')
  // Statement
  const [stmtModal, setStmtModal] = useState(false)
  const [stmt, setStmt]     = useState(null)
  // Payment
  const [payModal, setPayModal] = useState(false)
  const [payForm, setPayForm]   = useState({ amount: '', payment_method: 'cash', notes: '' })
  const [payTarget, setPayTarget] = useState(null)
  const [payError, setPayError]   = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/customers?page=${page}&search=${search}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search])

  const openAdd  = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = r => { setEditing(r); setForm({ ...r, credit_limit: r.credit_limit }); setError(''); setModal(true) }
  const openStmt = async r => {
    const { data } = await api.get(`/customers/${r.id}/statement`)
    setStmt(data); setStmtModal(true)
  }
  const openPay = r => { setPayTarget(r); setPayForm({ amount: '', payment_method: 'cash', notes: '' }); setPayError(''); setPayModal(true) }

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form)
      else await api.post('/customers', form)
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  const submitPayment = async () => {
    setPayError('')
    try {
      await api.post(`/customers/${payTarget.id}/payment`, payForm)
      setPayModal(false); load()
    } catch (e) {
      setPayError(e.response?.data?.message || 'Error')
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Customer</button>
      </div>

      <div className="card mb-4 p-4 flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search by name, phone, code…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Code</th>
              <th className="table-th">Name</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Type</th>
              <th className="table-th text-right">Balance</th>
              <th className="table-th text-right">Credit Limit</th>
              <th className="table-th">Status</th>
              <th className="table-th w-28">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs text-gray-500">{r.customer_code}</td>
                  <td className="table-td font-medium">{r.name}</td>
                  <td className="table-td text-gray-500">{r.phone || '—'}</td>
                  <td className="table-td"><span className="badge-blue">{r.customer_type.replace('_', ' ')}</span></td>
                  <td className={`table-td text-right font-semibold ${+r.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>{fmt(r.balance)}</td>
                  <td className="table-td text-right text-gray-500">{r.credit_limit > 0 ? fmt(r.credit_limit) : '—'}</td>
                  <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button title="Statement" className="text-blue-600 hover:text-blue-800" onClick={() => openStmt(r)}><FiEye size={15} /></button>
                      <button title="Edit" className="text-gray-500 hover:text-gray-700" onClick={() => openEdit(r)}><FiEdit2 size={15} /></button>
                      {+r.balance > 0 && <button title="Record Payment" className="text-green-600 hover:text-green-800" onClick={() => openPay(r)}><FiDollarSign size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No customers found</td></tr>}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="md">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
          <div><label className="label">Customer Type *</label>
            <select className="select" value={form.customer_type} onChange={e => f('customer_type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Credit Limit (UGX)</label><input className="input" type="number" min="0" value={form.credit_limit} onChange={e => f('credit_limit', e.target.value)} /></div>
          <div><label className="label">Gender</label>
            <select className="select" value={form.gender} onChange={e => f('gender', e.target.value)}>
              <option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          {editing && <div><label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>}
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={e => f('address', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      </Modal>

      {/* Statement Modal */}
      <Modal open={stmtModal} onClose={() => setStmtModal(false)} title={`Statement — ${stmt?.customer?.name}`} size="lg">
        {stmt && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="card p-3 text-center"><p className="text-xs text-gray-500">Outstanding</p><p className={`text-xl font-bold ${+stmt.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(stmt.balance)}</p></div>
              <div className="card p-3 text-center"><p className="text-xs text-gray-500">Total Purchases</p><p className="text-xl font-bold">{fmt(stmt.sales?.reduce((s, x) => s + +x.total, 0))}</p></div>
              <div className="card p-3 text-center"><p className="text-xs text-gray-500">Total Paid</p><p className="text-xl font-bold text-green-700">{fmt(stmt.payments?.reduce((s, x) => s + +x.amount, 0))}</p></div>
            </div>
            <h3 className="font-semibold mb-2">Recent Sales</h3>
            <table className="w-full text-sm mb-4">
              <thead><tr><th className="table-th">Receipt</th><th className="table-th">Date</th><th className="table-th text-right">Total</th><th className="table-th">Status</th></tr></thead>
              <tbody>{stmt.sales?.slice(0, 8).map(s => (
                <tr key={s.id} className="border-t border-gray-50">
                  <td className="table-td font-mono text-xs">{s.receipt_number}</td>
                  <td className="table-td text-xs text-gray-500">{fmtDateTime(s.created_at)}</td>
                  <td className="table-td text-right">{fmt(s.total)}</td>
                  <td className="table-td"><span className={statusBadge(s.payment_status)}>{s.payment_status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={`Record Payment — ${payTarget?.name}`} size="sm">
        <Alert type="error" message={payError} onClose={() => setPayError('')} />
        {payTarget && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">Outstanding: <strong>{fmt(payTarget.balance)}</strong></div>}
        <div className="space-y-4">
          <div><label className="label">Amount (UGX) *</label><input className="input" type="number" min="1" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div><label className="label">Payment Method</label>
            <select className="select" value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}>
              {['cash','mtn_momo','airtel_money','bank','card','other'].map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
            </select>
          </div>
          <div><label className="label">Notes</label><input className="input" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setPayModal(false)}>Cancel</button>
            <button className="btn-success" onClick={submitPayment}>Record Payment</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
