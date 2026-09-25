import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

const icons = { success: FiCheckCircle, error: FiAlertCircle, warning: FiAlertTriangle, info: FiInfo }
const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null
  const Icon = icons[type]
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]} mb-4`}>
      <Icon size={18} className="mt-0.5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 ml-2">×</button>
      )}
    </div>
  )
}
