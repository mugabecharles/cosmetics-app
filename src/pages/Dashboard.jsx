import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import api from '../api/axios'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { fmt, fmtNum } from '../utils/format'
import {
  FiShoppingCart, FiPackage, FiDollarSign, FiTrendingUp,
  FiAlertTriangle, FiUsers, FiTruck, FiRepeat,
} from 'react-icons/fi'

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [chart, setChart]   = useState([])
  const [topProd, setTopProd] = useState([])
  const [period, setPeriod] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get(`/reports/sales-chart?period=${period}`),
      api.get('/reports/top-products?limit=5'),
    ]).then(([s, c, p]) => {
      setStats(s.data)
      setChart(c.data)
      setTopProd(p.data)
    }).finally(() => setLoading(false))
  }, [period])

  useEffect(() => {
    setLoading(true)
    api.get(`/reports/sales-chart?period=${period}`)
      .then(r => setChart(r.data))
      .finally(() => setLoading(false))
  }, [period])

  if (!stats) return <Spinner />

  const periodLabels = { daily: 'Today (hourly)', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales"     value={fmt(stats.today_sales)}        sub={`${stats.today_sales_count} transactions`} icon={FiShoppingCart} color="primary" />
        <StatCard title="Today's Profit"    value={fmt(stats.today_profit)}        icon={FiTrendingUp}  color="green" />
        <StatCard title="Today's Purchases" value={fmt(stats.today_purchases)}     icon={FiTruck}       color="blue" />
        <StatCard title="Today's Expenses"  value={fmt(stats.today_expenses)}      icon={FiDollarSign}  color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products"    value={fmtNum(stats.total_products)}   icon={FiPackage}     color="purple" />
        <StatCard title="Low Stock"         value={fmtNum(stats.low_stock)}        icon={FiAlertTriangle} color="yellow" />
        <StatCard title="Customers"         value={fmtNum(stats.total_customers)}  icon={FiUsers}       color="teal" />
        <StatCard title="Outstanding Credit" value={fmt(stats.outstanding_credit)} icon={FiRepeat}      color="red" />
      </div>

      {/* Sales chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Sales Overview — {periodLabels[period]}</h2>
          <div className="flex gap-1">
            {Object.keys(periodLabels).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chart}>
            <defs>
              <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => fmt(v)} />
            <Area type="monotone" dataKey="total" stroke="#ec4899" fill="url(#gSales)" strokeWidth={2} name="Sales" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
            <Link to="/reports" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {topProd.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProd.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.product?.name}</p>
                    <p className="text-xs text-gray-400">{fmtNum(p.total_qty)} units sold</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{fmt(p.total_revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Today's Payment Methods</h2>
          <div className="space-y-3">
            {[
              { label: 'Cash',         value: stats.cash_sales_today,  color: 'bg-green-500' },
              { label: 'Mobile Money', value: stats.momo_sales_today,  color: 'bg-yellow-500' },
              { label: 'Credit',       value: stats.outstanding_credit,color: 'bg-red-400' },
            ].map(row => {
              const total = stats.today_sales || 1
              const pct   = Math.min(100, (row.value / total) * 100).toFixed(0)
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium">{fmt(row.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/pos"      className="btn-primary justify-center py-2.5 text-sm">New Sale</Link>
            <Link to="/purchases" className="btn-outline justify-center py-2.5 text-sm">New Purchase</Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.low_stock > 0 || stats.out_of_stock > 0) && (
        <div className="card p-4 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-yellow-600 mt-0.5" size={18} />
            <div>
              <p className="font-medium text-yellow-800">Stock Alerts</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                {stats.out_of_stock > 0 && <span className="mr-3">{stats.out_of_stock} product(s) out of stock.</span>}
                {stats.low_stock > 0 && <span>{stats.low_stock} product(s) below reorder level.</span>}
                <Link to="/inventory" className="underline ml-1">View inventory</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
