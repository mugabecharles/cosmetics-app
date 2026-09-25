import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import { FiEye, FiSearch } from 'react-icons/fi'
import { fmtDateTime } from '../utils/format'

const MODULES = ['Auth', 'Users', 'Products', 'Categories', 'Brands', 'Sales', 'Purchases', 'Customers', 'Suppliers', 'Expenses', 'Returns', 'Inventory', 'Settings']

export default function AuditLogs() {
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [page, setPage]     = useState(1)
  const [module, setModule] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [modal, setModal]   = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/audit-logs?page=${page}&module=${module}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, module, dateFrom, dateTo])

  const view = (row) => { setSelected(row); setModal(true) }

  const actionColor = (action) => {
    if (action.startsWith('DELETE') || action.includes('CANCEL')) return 'badge-red'
    if (action.startsWith('CREATE')) return 'badge-green'
    if (action.startsWith('UPDATE') || action.startsWith('CHANGE')) return 'badge-yellow'
    if (action === 'LOGIN')  return 'badge-blue'
    if (action === 'LOGOUT') return 'badge-gray'
    return 'badge-gray'
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <select className="select w-44" value={module} onChange={e => { setModule(e.target.value); setPage(1) }}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="input w-40" type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1) }} />
        <input className="input w-40" type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1) }} />
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="table-th">Date &amp; Time</th>
                  <th className="table-th">User</th>
                  <th className="table-th">Module</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Record ID</th>
                  <th className="table-th">IP Address</th>
                  <th className="table-th w-12">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-td text-xs text-gray-500">{fmtDateTime(r.created_at)}</td>
                    <td className="table-td font-medium">{r.user?.name || 'System'}</td>
                    <td className="table-td"><span className="badge-blue text-xs">{r.module}</span></td>
                    <td className="table-td">
                      <span className={`${actionColor(r.action)} text-xs`}>{r.action}</span>
                    </td>
                    <td className="table-td text-gray-400 font-mono text-xs">{r.record_id || '—'}</td>
                    <td className="table-td text-gray-400 font-mono text-xs">{r.ip_address || '—'}</td>
                    <td className="table-td">
                      {(r.old_values || r.new_values) && (
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => view(r)}>
                          <FiEye size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-gray-400 py-8">No audit logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Detail Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Audit Log Detail" size="md">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">User:</span> <strong>{selected.user?.name || 'System'}</strong></div>
              <div><span className="text-gray-500">Action:</span> <strong>{selected.action}</strong></div>
              <div><span className="text-gray-500">Module:</span> {selected.module}</div>
              <div><span className="text-gray-500">Record ID:</span> {selected.record_id || '—'}</div>
              <div><span className="text-gray-500">IP:</span> {selected.ip_address || '—'}</div>
              <div><span className="text-gray-500">Time:</span> {fmtDateTime(selected.created_at)}</div>
            </div>

            {selected.old_values && Object.keys(selected.old_values).length > 0 && (
              <div>
                <p className="font-semibold text-red-600 mb-1">Before:</p>
                <pre className="bg-red-50 rounded p-3 text-xs overflow-auto max-h-40">
                  {JSON.stringify(selected.old_values, null, 2)}
                </pre>
              </div>
            )}
            {selected.new_values && Object.keys(selected.new_values).length > 0 && (
              <div>
                <p className="font-semibold text-green-600 mb-1">After:</p>
                <pre className="bg-green-50 rounded p-3 text-xs overflow-auto max-h-40">
                  {JSON.stringify(selected.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
