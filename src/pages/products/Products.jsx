import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi'
import { fmt, statusBadge } from '../../utils/format'

const emptyForm = {
  name: '', category_id: '', brand_id: '', supplier_id: '', description: '',
  unit: 'piece', purchase_price: '', selling_price: '', wholesale_price: '',
  reorder_level: 10, opening_stock: 0, barcode: '', expiry_tracking: false,
  expiry_date: '', batch_number: '', status: 'active',
}

export default function Products() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [editing, setEditing]   = useState(null)
  const [error, setError]       = useState('')
  const [confirm, setConfirm]   = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands]     = useState([])
  const [suppliers, setSuppliers] = useState([])

  const load = () => {
    setLoading(true)
    api.get(`/products?page=${page}&search=${search}&category_id=${catFilter}`)
      .then(r => { setRows(r.data.data); setMeta(r.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search, catFilter])
  useEffect(() => {
    api.get('/categories/all').then(r => setCategories(r.data))
    api.get('/brands/all').then(r => setBrands(r.data))
    api.get('/suppliers/all').then(r => setSuppliers(r.data))
  }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setModal(true) }
  const openEdit = r => {
    setEditing(r)
    setForm({
      name: r.name, category_id: r.category_id||'', brand_id: r.brand_id||'',
      supplier_id: r.supplier_id||'', description: r.description||'',
      unit: r.unit, purchase_price: r.purchase_price, selling_price: r.selling_price,
      wholesale_price: r.wholesale_price||'', reorder_level: r.reorder_level,
      opening_stock: 0, barcode: r.barcode||'', expiry_tracking: r.expiry_tracking,
      expiry_date: r.expiry_date||'', batch_number: r.batch_number||'', status: r.status,
    })
    setError(''); setModal(true)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/products/${editing.id}`, form)
      else await api.post('/products', form)
      setModal(false); load()
    } catch (e) {
      const errs = e.response?.data?.errors
      setError(errs ? Object.values(errs).flat().join(', ') : e.response?.data?.message || 'Error')
    }
  }

  const del = async id => {
    await api.delete(`/products/${id}`)
    load()
  }

  const stockClass = (p) => {
    const q = p.inventory?.quantity ?? 0
    if (q <= 0) return 'badge-red'
    if (q <= p.reorder_level) return 'badge-yellow'
    return 'badge-green'
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Product</button>
      </div>

      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input className="input pl-9" placeholder="Search by name, SKU, barcode…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="select w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead><tr>
                <th className="table-th">Product</th>
                <th className="table-th">SKU</th>
                <th className="table-th">Category</th>
                <th className="table-th">Buy Price</th>
                <th className="table-th">Sell Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Status</th>
                <th className="table-th w-20">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.brand?.name}</p>
                    </td>
                    <td className="table-td font-mono text-xs">{r.sku}</td>
                    <td className="table-td text-gray-500">{r.category?.name || '—'}</td>
                    <td className="table-td">{fmt(r.purchase_price)}</td>
                    <td className="table-td font-medium">{fmt(r.selling_price)}</td>
                    <td className="table-td">
                      <span className={stockClass(r)}>
                        {r.inventory?.quantity ?? 0} {r.unit}
                        {(r.inventory?.quantity ?? 0) <= r.reorder_level && <FiAlertTriangle size={11} className="inline ml-1" />}
                      </span>
                    </td>
                    <td className="table-td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => openEdit(r)}><FiEdit2 size={15} /></button>
                        <button className="text-red-500 hover:text-red-700" onClick={() => setConfirm(r.id)}><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="xl">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Product Name *</label><input className="input" value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">Category</label>
            <select className="select" value={form.category_id} onChange={e => f('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Brand</label>
            <select className="select" value={form.brand_id} onChange={e => f('brand_id', e.target.value)}>
              <option value="">Select brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div><label className="label">Supplier</label>
            <select className="select" value={form.supplier_id} onChange={e => f('supplier_id', e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Unit</label>
            <select className="select" value={form.unit} onChange={e => f('unit', e.target.value)}>
              {['piece','bottle','box','jar','tube','packet','set','pair','litre','kg','g'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div><label className="label">Purchase Price (UGX) *</label><input className="input" type="number" min="0" value={form.purchase_price} onChange={e => f('purchase_price', e.target.value)} /></div>
          <div><label className="label">Selling Price (UGX) *</label><input className="input" type="number" min="0" value={form.selling_price} onChange={e => f('selling_price', e.target.value)} /></div>
          <div><label className="label">Wholesale Price (UGX)</label><input className="input" type="number" min="0" value={form.wholesale_price} onChange={e => f('wholesale_price', e.target.value)} /></div>
          <div><label className="label">Reorder Level *</label><input className="input" type="number" min="0" value={form.reorder_level} onChange={e => f('reorder_level', e.target.value)} /></div>
          {!editing && <div><label className="label">Opening Stock</label><input className="input" type="number" min="0" value={form.opening_stock} onChange={e => f('opening_stock', e.target.value)} /></div>}
          <div><label className="label">Barcode</label><input className="input" value={form.barcode} onChange={e => f('barcode', e.target.value)} /></div>
          <div className="flex items-center gap-3 pt-5">
            <input type="checkbox" id="expiry" checked={form.expiry_tracking} onChange={e => f('expiry_tracking', e.target.checked)} className="w-4 h-4 text-primary-600" />
            <label htmlFor="expiry" className="text-sm text-gray-700">Track Expiry Date</label>
          </div>
          {form.expiry_tracking && <>
            <div><label className="label">Expiry Date</label><input className="input" type="date" value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)} /></div>
            <div><label className="label">Batch Number</label><input className="input" value={form.batch_number} onChange={e => f('batch_number', e.target.value)} /></div>
          </>}
          {editing && <div><label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>}
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
          <button className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save Product</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => del(confirm)}
        title="Delete Product" message="Delete this product? If it has sales history it will be marked inactive instead." danger />
    </div>
  )
}
