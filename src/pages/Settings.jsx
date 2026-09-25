import { useState, useEffect } from 'react'
import api from '../api/axios'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { FiSave } from 'react-icons/fi'

const SECTIONS = [
  {
    key: 'business',
    title: 'Business Information',
    fields: [
      { key: 'shop_name',    label: 'Shop Name',    type: 'text' },
      { key: 'shop_address', label: 'Address',      type: 'text' },
      { key: 'shop_phone',   label: 'Phone Number', type: 'text' },
      { key: 'shop_email',   label: 'Email',        type: 'email' },
    ],
  },
  {
    key: 'sales',
    title: 'Sales Settings',
    fields: [
      { key: 'receipt_prefix',       label: 'Receipt Prefix',             type: 'text',   placeholder: 'CS' },
      { key: 'currency',             label: 'Currency',                   type: 'text',   placeholder: 'UGX' },
      { key: 'tax_rate',             label: 'Tax Rate (%)',                type: 'number', placeholder: '0' },
      { key: 'max_discount_percent', label: 'Max Discount (%)',            type: 'number', placeholder: '20' },
      { key: 'return_policy_days',   label: 'Return Policy (days)',        type: 'number', placeholder: '7' },
      { key: 'allow_negative_stock', label: 'Allow Negative Stock',        type: 'select', options: [{ v: 'no', l: 'No' }, { v: 'yes', l: 'Yes' }] },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory Settings',
    fields: [
      { key: 'reorder_level_default', label: 'Default Reorder Level',    type: 'number', placeholder: '10' },
      { key: 'expiry_warning_days',   label: 'Expiry Warning (days)',    type: 'number', placeholder: '30' },
    ],
  },
]

export default function Settings() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/settings').then(r => {
      const flat = {}
      Object.values(r.data).forEach(group => {
        group.forEach(s => { flat[s.key] = s.value ?? '' })
      })
      setValues(flat)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/settings', values)
      setSuccess('Settings saved successfully')
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <FiSave size={16} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error"   message={error}   onClose={() => setError('')} />

      <div className="space-y-6">
        {SECTIONS.map(section => (
          <div key={section.key} className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="select"
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    >
                      {field.options.map(o => (
                        <option key={o.v} value={o.v}>{o.l}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      type={field.type}
                      value={values[field.key] ?? ''}
                      placeholder={field.placeholder}
                      onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
