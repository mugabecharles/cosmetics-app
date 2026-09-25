import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { fmt, fmtDate, paymentMethodLabel, statusBadge } from '../../utils/format'

export default function Payments() {
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [page, setPage]     = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get(`/payments?page=${page}&date_from=${dateFrom}&date_to=${dateTo}&payment_method=${method}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, dateFrom, dateTo, method])

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Payments</h1></div>
      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <input className="input w-40" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input className="input w-40" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
        <select className="select w-40" value={method} onChange={e => setMethod(e.target.value)}>
          <option value="">All Methods</option>
          {['cash','mtn_momo','airtel_money','bank','card','credit','other'].map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Reference</th>
              <th className="table-th">Date</th>
              <th className="table-th">Type</th>
              <th className="table-th">Method</th>
              <th className="table-th">Customer/Supplier</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs">{r.reference}</td>
                  <td className="table-td text-gray-500">{fmtDate(r.transaction_date)}</td>
                  <td className="table-td text-xs"><span className="badge-blue">{r.payment_type.replace(/_/g,' ')}</span></td>
                  <td className="table-td">{paymentMethodLabel(r.payment_method)}</td>
                  <td className="table-td text-gray-500">{r.customer?.name || r.supplier?.name || '—'}</td>
                  <td className="table-td text-right font-semibold">{fmt(r.amount)}</td>
                  <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">No payments found</td></tr>}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  )
}
