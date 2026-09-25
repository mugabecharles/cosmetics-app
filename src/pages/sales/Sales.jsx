import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { FiSearch, FiEye, FiPrinter, FiXCircle } from 'react-icons/fi'
import { fmt, fmtDateTime, paymentMethodLabel, statusBadge } from '../../utils/format'

export default function Sales() {
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [modal, setModal]   = useState(false)
  const printRef = useRef()
  const doPrint  = useReactToPrint({ content: () => printRef.current })

  const load = () => {
    setLoading(true)
    api.get(`/sales?page=${page}&search=${search}&date_from=${dateFrom}&date_to=${dateTo}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search, dateFrom, dateTo])

  const view = (row) => {
    api.get(`/sales/${row.id}`).then(r => { setSelected(r.data); setModal(true) })
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this sale? Stock will be restored.')) return
    await api.post(`/sales/${id}/cancel`)
    setModal(false); load()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales History</h1>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search receipt number…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <input className="input w-38" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
        <input className="input w-38" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   placeholder="To" />
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr>
                <th className="table-th">Receipt #</th>
                <th className="table-th">Date</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Cashier</th>
                <th className="table-th">Method</th>
                <th className="table-th text-right">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono font-semibold text-primary-700">{r.receipt_number}</td>
                    <td className="table-td text-xs text-gray-500">{fmtDateTime(r.created_at)}</td>
                    <td className="table-td">{r.customer?.name || 'Walk-in'}</td>
                    <td className="table-td text-gray-500">{r.user?.name}</td>
                    <td className="table-td">{paymentMethodLabel(r.payment_method)}</td>
                    <td className="table-td text-right font-semibold">{fmt(r.total)}</td>
                    <td className="table-td">
                      <span className={statusBadge(r.payment_status)}>{r.payment_status}</span>
                      {' '}
                      <span className={statusBadge(r.sale_status)}>{r.sale_status}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => view(r)}><FiEye size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No sales found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Sale Detail Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Sale — ${selected?.receipt_number}`} size="lg">
        {selected && (
          <div>
            <div ref={printRef} className="font-mono text-sm">
              <div className="text-center mb-3">
                <p className="font-bold text-lg">Beauty & Glow Cosmetics</p>
                <p className="text-xs text-gray-500">Kampala Road, Kampala · +256 700 123 456</p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs mb-4 border-t border-dashed border-gray-300 pt-3">
                <div>Receipt: <strong>{selected.receipt_number}</strong></div>
                <div>Date: {fmtDateTime(selected.created_at)}</div>
                <div>Cashier: {selected.user?.name}</div>
                <div>Customer: {selected.customer?.name || 'Walk-in'}</div>
              </div>
              <table className="w-full text-xs mb-4">
                <thead><tr className="border-b border-dashed border-gray-300">
                  <th className="text-left py-1">Item</th><th className="text-center">Qty</th>
                  <th className="text-right">Price</th><th className="text-right">Total</th>
                </tr></thead>
                <tbody>
                  {selected.items?.map(i => (
                    <tr key={i.id}><td className="py-1">{i.product?.name}</td>
                      <td className="text-center">{i.quantity}</td>
                      <td className="text-right">{fmt(i.unit_price)}</td>
                      <td className="text-right">{fmt(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(selected.subtotal)}</span></div>
                {+selected.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount:</span><span>-{fmt(selected.discount)}</span></div>}
                <div className="flex justify-between font-bold"><span>TOTAL:</span><span>{fmt(selected.total)}</span></div>
                <div className="flex justify-between"><span>Paid ({paymentMethodLabel(selected.payment_method)}):</span><span>{fmt(selected.amount_paid)}</span></div>
                {+selected.balance > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Balance:</span><span>{fmt(selected.balance)}</span></div>}
              </div>
            </div>
            <div className="flex justify-between pt-4 mt-3 border-t border-gray-100">
              {selected.sale_status !== 'cancelled' && (
                <button className="btn-danger text-sm" onClick={() => cancel(selected.id)}>
                  <FiXCircle size={14} /> Cancel Sale
                </button>
              )}
              <button className="btn-outline ml-auto" onClick={doPrint}><FiPrinter size={14} /> Print</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
