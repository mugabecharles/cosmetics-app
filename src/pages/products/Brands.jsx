import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { statusBadge } from '../../utils/format'

const empty = { name: '', description: '', country_of_origin: '', status: 'active' }

export default function Brands() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(empty)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/brands?page=${page}&search=${search}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search])

  const openAdd  = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = r => { setEditing(r); setForm({ name: r.name, description: r.description||'', country_of_origin: r.country_of_origin||'', status: r.status }); setError(''); setModal(true) }

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/brands/${editing.id}`, form)
      else await api.post('/brands', form)
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Brands</h1>
        <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Brand</button>
      </div>
      <div className="card mb-4 p-4 flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search brands…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Name</th>
              <th className="table-th">Country</th>
              <th className="table-th">Products</th>
              <th className="table-th">Status</th>
              <th className="table-th w-24">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{r.name}</td>
                  <td className="table-td text-gray-500">{r.country_of_origin || '—'}</td>
                  <td className="table-td">{r.products_count ?? 0}</td>
                  <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => openEdit(r)}><FiEdit2 size={15} /></button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => setConfirm(r.id)}><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">No brands found</td></tr>}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Brand' : 'Add Brand'} size="sm">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="space-y-4">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Country of Origin</label><input className="input" value={form.country_of_origin} onChange={e => setForm({ ...form, country_of_origin: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          {editing && <div><label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select></div>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={async () => { await api.delete(`/brands/${confirm}`); load() }}
        title="Delete Brand" message="Delete this brand?" danger />
    </div>
  )
}
