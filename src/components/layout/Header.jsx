import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMenu, FiLogOut, FiUser, FiBell } from 'react-icons/fi'
import Modal from '../ui/Modal'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUser, setShowUser] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 no-print">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
      >
        <FiMenu size={20} />
      </button>

      <div className="flex-1 lg:ml-0" />

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          onClick={() => setShowUser(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="bg-primary-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </button>
      </div>

      <Modal open={showUser} onClose={() => setShowUser(false)} title="My Account" size="sm">
        <div className="flex flex-col items-center py-4">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold mb-3">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <h3 className="font-bold text-gray-900">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.username}</p>
          <span className="badge-blue mt-1">{user?.role}</span>
        </div>
        <div className="border-t pt-4 flex flex-col gap-2">
          <button className="btn-outline w-full justify-center gap-2" onClick={() => { setShowUser(false); navigate('/profile') }}>
            <FiUser size={16} /> View Profile
          </button>
          <button className="btn-danger w-full justify-center gap-2" onClick={handleLogout}>
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>
      </Modal>
    </header>
  )
}
