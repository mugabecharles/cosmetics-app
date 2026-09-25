import Modal from './Modal'
import { FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4 items-start mb-6">
        <div className={`p-2 rounded-full ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <FiAlertTriangle className={danger ? 'text-red-600' : 'text-yellow-600'} size={20} />
        </div>
        <p className="text-gray-700 text-sm">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose() }}>
          Confirm
        </button>
      </div>
    </Modal>
  )
}
