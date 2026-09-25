import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../api/axios'
import Spinner from '../components/ui/Spinner'
import { fmt, fmtNum } from '../utils/format'
import { FiDownload } from 'react-icons/fi'

const TABS = ['profit_loss', 'sales', 'inventory', 'expenses', 'customers', 'suppliers', 'employee']
const TAB_LABELS = { profit_loss: 'Profit & Loss', sales: 'Sales', inventory: 'Inventory', expenses: 'Expenses', customers: 'Customer Balances', suppliers: 'Supplier Balances', employee: 'Employee Performance' }
const COLORS = ['#ec4899','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444']

function DateFilter({ from, to, onFrom, onTo }) {
  const presets = [
    { label: 'Today',      from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
    { label: 'This Week',  from: new Date(Date.now()-7*864e5).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
    { label: 'This Month', from: new Date(new Date().setDate(1)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
    { label: 'This Year',  from: `${new Date().getFullYear()}-01-01`, to: new Date().toISOString().split('T')[0] },
  ]
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {presets.map(p => (
        <button key={p.label} onClick={() => { onFrom(p.from); onTo(p.to) }}
          className={`px-3 py-1 rounded text-xs font-medium ${from===p.from && to===p.to ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {p.label}
        </button>
      ))}
      <input className="input w-36 text-sm" type="date" value={from} onChange={e => onFrom(e.target.value)} />
      <input className="input w-36 text-sm" type="date" value={to}   onChange={e => onTo(e.target.value)} />
    </div>
  )
}

export default function Reports() {
  const [tab, setTab]       = useState('profit_loss')
  const [loading, setLoading] = useState(false)
  const [data, setData]     = useState(null)
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0]
  const [from, setFrom]     = useState(monthStart)
  const [to, setTo]         = useState(today)

  useEffect(() => {
    setLoading(true); setData(null)
    const params = `date_from=${from}&date_to=${to}`
    const urls = {
      profit_loss: `/reports/profit-loss?${params}`,
      sales:       `/reports/sales?${params}`,
      inventory:   `/reports/inventory`,
      expenses:    `/reports/expenses?${params}`,
      customers:   `/reports/customer-balances`,
      suppliers:   `/reports/supplier-balances`,
      employee:    `/reports/employee-performance?${params}`,
    }
    api.get(urls[tab]).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [tab, from, to])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab===t ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      {loading ? <Spinner /> : data && (
        <div>
          {/* Profit & Loss */}
          {tab === 'profit_loss' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Revenue',      v: data.revenue,      color: 'bg-green-50 text-green-700' },
                  { label: 'Cost of Goods',v: data.cogs,         color: 'bg-orange-50 text-orange-700' },
                  { label: 'Gross Profit', v: data.gross_profit, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Net Profit',   v: data.net_profit,   color: data.net_profit>=0 ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-700' },
                ].map(c => (
                  <div key={c.label} className={`card p-4 ${c.color}`}>
                    <p className="text-xs font-medium opacity-70">{c.label}</p>
                    <p className="text-2xl font-bold mt-1">{fmt(c.v)}</p>
                  </div>
                ))}
              </div>
              <div className="card p-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    <tr><td className="py-2 text-gray-500">Revenue</td><td className="py-2 text-right font-medium">{fmt(data.revenue)}</td></tr>
                    <tr><td className="py-2 text-gray-500">Cost of Goods Sold</td><td className="py-2 text-right font-medium text-orange-700">({fmt(data.cogs)})</td></tr>
                    <tr className="bg-blue-50"><td className="py-2 font-semibold">Gross Profit</td><td className="py-2 text-right font-bold text-blue-700">{fmt(data.gross_profit)}</td></tr>
                    <tr><td className="py-2 text-gray-500">Operating Expenses</td><td className="py-2 text-right font-medium text-red-600">({fmt(data.expenses)})</td></tr>
                    <tr className="bg-primary-50"><td className="py-2 font-bold text-lg">Net Profit</td><td className={`py-2 text-right font-bold text-xl ${data.net_profit>=0?'text-primary-700':'text-red-700'}`}>{fmt(data.net_profit)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales */}
          {tab === 'sales' && data.sales && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center"><p className="text-xs text-gray-500">Revenue</p><p className="text-2xl font-bold text-primary-700">{fmt(data.total_revenue)}</p></div>
                <div className="card p-4 text-center"><p className="text-xs text-gray-500">Profit</p><p className="text-2xl font-bold text-green-700">{fmt(data.total_profit)}</p></div>
                <div className="card p-4 text-center"><p className="text-xs text-gray-500">Transactions</p><p className="text-2xl font-bold">{fmtNum(data.count)}</p></div>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><th className="table-th">Receipt</th><th className="table-th">Date</th><th className="table-th">Customer</th><th className="table-th">Cashier</th><th className="table-th text-right">Total</th><th className="table-th">Method</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.sales.data?.slice(0, 20).map(s => (
                        <tr key={s.id}><td className="table-td font-mono text-xs text-primary-700">{s.receipt_number}</td>
                          <td className="table-td text-xs text-gray-500">{s.created_at?.slice(0,10)}</td>
                          <td className="table-td">{s.customer?.name||'Walk-in'}</td>
                          <td className="table-td text-gray-500">{s.user?.name}</td>
                          <td className="table-td text-right font-semibold">{fmt(s.total)}</td>
                          <td className="table-td text-gray-500 text-xs">{s.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inventory */}
          {tab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 text-center"><p className="text-xs text-gray-500">Stock Value (Cost)</p><p className="text-2xl font-bold text-orange-700">{fmt(data.stock_value)}</p></div>
                <div className="card p-4 text-center"><p className="text-xs text-gray-500">Stock Value (Retail)</p><p className="text-2xl font-bold text-green-700">{fmt(data.retail_value)}</p></div>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><th className="table-th">Product</th><th className="table-th">Category</th><th className="table-th text-right">Qty</th><th className="table-th text-right">Cost Price</th><th className="table-th text-right">Stock Value</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.products?.map(p => (
                        <tr key={p.id}>
                          <td className="table-td font-medium">{p.name}</td>
                          <td className="table-td text-gray-500">{p.category?.name}</td>
                          <td className="table-td text-right">{fmtNum(p.inventory?.quantity||0)}</td>
                          <td className="table-td text-right">{fmt(p.purchase_price)}</td>
                          <td className="table-td text-right font-semibold">{fmt((p.inventory?.quantity||0)*p.purchase_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Expenses */}
          {tab === 'expenses' && (
            <div className="space-y-4">
              <div className="card p-4 text-center inline-block"><p className="text-xs text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-red-600">{fmt(data.total)}</p></div>
              {data.by_category?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">By Category</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.by_category} dataKey="total" nameKey="category.name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`}>
                        {data.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Customer Balances */}
          {tab === 'customers' && (
            <div>
              <div className="card p-4 text-center inline-block mb-4"><p className="text-xs text-gray-500">Total Outstanding</p><p className="text-2xl font-bold text-red-600">{fmt(data.total)}</p></div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead><tr><th className="table-th">Code</th><th className="table-th">Customer</th><th className="table-th">Phone</th><th className="table-th text-right">Balance</th><th className="table-th text-right">Credit Limit</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.customers?.map(c => (
                      <tr key={c.id}><td className="table-td font-mono text-xs">{c.customer_code}</td><td className="table-td font-medium">{c.name}</td><td className="table-td text-gray-500">{c.phone||'—'}</td>
                        <td className="table-td text-right font-bold text-red-600">{fmt(c.balance)}</td><td className="table-td text-right text-gray-500">{fmt(c.credit_limit)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Supplier Balances */}
          {tab === 'suppliers' && (
            <div>
              <div className="card p-4 text-center inline-block mb-4"><p className="text-xs text-gray-500">Total Owed to Suppliers</p><p className="text-2xl font-bold text-red-600">{fmt(data.total)}</p></div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead><tr><th className="table-th">Code</th><th className="table-th">Supplier</th><th className="table-th">Phone</th><th className="table-th text-right">Balance</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.suppliers?.map(s => (
                      <tr key={s.id}><td className="table-td font-mono text-xs">{s.supplier_code}</td><td className="table-td font-medium">{s.name}</td><td className="table-td text-gray-500">{s.phone||'—'}</td>
                        <td className="table-td text-right font-bold text-red-600">{fmt(s.balance)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Employee Performance */}
          {tab === 'employee' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr><th className="table-th">Employee</th><th className="table-th text-right">Transactions</th><th className="table-th text-right">Total Sales</th><th className="table-th text-right">Discounts Given</th><th className="table-th text-right">Credit Given</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.map(e => (
                    <tr key={e.user_id}><td className="table-td font-medium">{e.user?.name}</td>
                      <td className="table-td text-right">{fmtNum(e.transactions)}</td>
                      <td className="table-td text-right font-semibold">{fmt(e.total_sales)}</td>
                      <td className="table-td text-right text-orange-600">{fmt(e.total_discounts)}</td>
                      <td className="table-td text-right text-red-600">{fmt(e.credit_given)}</td>
                    </tr>
                  ))}
                  {!data?.length && <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">No data</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
