import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import Alert from '../../components/ui/Alert'
import { fmt } from '../../utils/format'
import { FiSearch, FiTrash2, FiPlus, FiMinus, FiPrinter, FiShoppingCart } from 'react-icons/fi'
import Receipt from './Receipt'

const METHODS = ['cash', 'mtn_momo', 'airtel_money', 'bank', 'card', 'credit']
const METHOD_LABELS = { cash: 'Cash', mtn_momo: 'MTN MoMo', airtel_money: 'Airtel Money', bank: 'Bank', card: 'Card', credit: 'Credit' }

export default function POS() {
  const [search, setSearch]       = useState('')
  const [results, setResults]     = useState([])
  const [cart, setCart]           = useState([])
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer]   = useState('')
  const [method, setMethod]       = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [discount, setDiscount]   = useState(0)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [receipt, setReceipt]     = useState(null)
  const searchRef = useRef()

  useEffect(() => { api.get('/customers/all').then(r => setCustomers(r.data)) }, [])
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      api.get(`/products/all?search=${search}`).then(r => setResults(r.data))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const addToCart = (p) => {
    setCart(c => {
      const ex = c.find(i => i.product_id === p.id)
      if (ex) return c.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { product_id: p.id, name: p.name, unit: p.unit, price: +p.selling_price, cost: +p.purchase_price, qty: 1, discount: 0, stock: p.inventory?.quantity ?? 0 }]
    })
    setSearch(''); setResults([])
    searchRef.current?.focus()
  }

  const updateQty = (id, delta) => setCart(c =>
    c.map(i => i.product_id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  )
  const updateDiscount = (id, val) => setCart(c => c.map(i => i.product_id === id ? { ...i, discount: +val } : i))
  const removeItem = id => setCart(c => c.filter(i => i.product_id !== id))
  const clearCart  = () => { setCart([]); setCustomer(''); setMethod('cash'); setAmountPaid(''); setDiscount(0) }

  const subtotal   = cart.reduce((s, i) => s + i.qty * i.price - i.discount, 0)
  const total      = Math.max(0, subtotal - +discount)
  const change     = Math.max(0, (+amountPaid || 0) - total)

  const checkout = async () => {
    if (!cart.length) return setError('Cart is empty')
    if (method === 'credit' && !customer) return setError('Select a customer for credit sales')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/sales', {
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.qty, unit_price: i.price, discount: i.discount })),
        customer_id:    customer || null,
        payment_method: method,
        amount_paid:    method === 'credit' ? 0 : (+amountPaid || total),
        discount,
      })
      setReceipt(data)
      clearCart()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to complete sale')
    } finally {
      setLoading(false)
    }
  }

  if (receipt) return <Receipt sale={receipt} onNew={() => setReceipt(null)} />

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* LEFT — product search & cart */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Search */}
        <div className="card p-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              ref={searchRef}
              className="input pl-10 text-base"
              placeholder="Search product by name, SKU or barcode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {results.length > 0 && (
            <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden shadow-lg">
              {results.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 text-left text-sm border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku} · {p.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-700">{fmt(p.selling_price)}</p>
                    <p className="text-xs text-gray-400">Stock: {p.inventory?.quantity ?? 0}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card flex-1 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FiShoppingCart size={16} /> Cart ({cart.length} items)
            </h2>
            {cart.length > 0 && <button className="text-xs text-red-500 hover:underline" onClick={clearCart}>Clear all</button>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <FiShoppingCart size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Cart is empty — search and add products</p>
              </div>
            ) : (
              <table className="w-full">
                <thead><tr>
                  <th className="table-th">Product</th>
                  <th className="table-th text-center">Qty</th>
                  <th className="table-th text-right">Price</th>
                  <th className="table-th text-right">Discount</th>
                  <th className="table-th text-right">Total</th>
                  <th className="table-th w-8" />
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(i => (
                    <tr key={i.product_id}>
                      <td className="table-td">
                        <p className="font-medium text-sm">{i.name}</p>
                        <p className="text-xs text-gray-400">{fmt(i.price)}/{i.unit}</p>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(i.product_id, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><FiMinus size={10} /></button>
                          <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                          <button onClick={() => updateQty(i.product_id,  1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><FiPlus size={10} /></button>
                        </div>
                      </td>
                      <td className="table-td text-right">{fmt(i.price)}</td>
                      <td className="table-td text-right">
                        <input type="number" min="0" value={i.discount}
                          onChange={e => updateDiscount(i.product_id, e.target.value)}
                          className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-xs" />
                      </td>
                      <td className="table-td text-right font-semibold">{fmt(i.qty * i.price - i.discount)}</td>
                      <td className="table-td"><button onClick={() => removeItem(i.product_id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — payment panel */}
      <div className="w-80 flex flex-col gap-4">
        <div className="card p-4 flex-1 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-4">Payment</h2>

          <Alert type="error" message={error} onClose={() => setError('')} />

          {/* Customer */}
          <div className="mb-4">
            <label className="label">Customer (optional)</label>
            <select className="select" value={customer} onChange={e => setCustomer(e.target.value)}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Discount</span>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(+e.target.value)}
                className="w-28 text-right border border-gray-200 rounded px-2 py-1 text-xs" />
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
              <span>Total</span><span className="text-primary-700">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-4">
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    method === m ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}>{METHOD_LABELS[m]}</button>
              ))}
            </div>
          </div>

          {method !== 'credit' && (
            <div className="mb-4">
              <label className="label">Amount Received (UGX)</label>
              <input className="input text-lg font-bold" type="number" min="0" value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)} placeholder={total} />
              {+amountPaid > 0 && (
                <p className={`text-sm mt-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Change: {fmt(change)}
                </p>
              )}
            </div>
          )}

          <button
            onClick={checkout}
            disabled={loading || cart.length === 0}
            className="btn-primary w-full justify-center py-3 text-base mt-auto"
          >
            {loading ? 'Processing…' : `Complete Sale — ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
