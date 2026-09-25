import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { FiPlus, FiEdit2, FiSearch } from 'react-icons/fi'
import { fmtDate, statusBadge } from '../../utils/format'

const emptyForm = {
  name: '', username: '', email: '', phone: '', role_id: '', password: '', status: 'active',
}

export default function Employees() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [roles, setRoles]     = useState([])

  const load = () => {
    setLoading(true)
    api.get(`/users?page=${page}&search=${search}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search])
  useEffect(() => { api.get('/roles').then(r => setRoles(r.data)) }, [])

  const openAdd = () => {
    setEditing(null); setForm(emptyForm); setError(''); setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r)
    setForm({ name: r.name, username: r.username, email: r.email || '', phone: r.phone || '', role_id: r.role_id, password: '', status: r.status })
    setError(''); setModal(true)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/users/${editing.id}`, form)
      else await api.post('/users', form)
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Employee</button>
      </div>

      <div className="card mb-4 p-4 flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search employees…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">Name</th>
                <th className="table-th">Username</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs text-gray-400">{r.employee_id}</td>
                  <td className="table-td font-medium">{r.name}</td>
                  <td className="table-td text-gray-500">{r.username}</td>
                  <td className="table-td text-gray-500">{r.phone || '—'}</td>
                  <td className="table-td">
                    <span className="badge-blue">{r.role?.name}</span>
                  </td>
                  <td className="table-td">
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </td>
                  <td className="table-td">
                    <button className="text-blue-600 hover:text-blue-800" onClick={() => openEdit(r)}>
                      <FiEdit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-8">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'} size="md">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Username *</label>
            <input className="input" value={form.username} onChange={e => f('username', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="select" value={form.role_id} onChange={e => f('role_id', e.target.value)}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="input" type="password" value={form.password} onChange={e => f('password', e.target.value)}
              placeholder={editing ? 'Leave blank to keep current' : ''} />
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save Employee</button>
        </div>
      </Modal>
    </div>
  )
}
