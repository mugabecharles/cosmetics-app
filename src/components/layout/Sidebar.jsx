import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiHome, FiShoppingCart, FiPackage, FiTruck, FiUsers, FiUser,
  FiDollarSign, FiRepeat, FiBarChart2, FiSettings, FiShield,
  FiClipboard, FiTag, FiShoppingBag,
} from 'react-icons/fi'

const nav = [
  { to: '/',                  label: 'Dashboard',     icon: FiHome,         roles: null },
  { header: 'Sales' },
  { to: '/pos',               label: 'Point of Sale', icon: FiShoppingCart, roles: null },
  { to: '/sales',             label: 'Sales History', icon: FiClipboard,    roles: null },
  { to: '/returns',           label: 'Returns',       icon: FiRepeat,       roles: ['administrator','manager','cashier'] },
  { to: '/payments',          label: 'Payments',      icon: FiDollarSign,   roles: null },
  { header: 'Products' },
  { to: '/products',          label: 'Products',      icon: FiPackage,      roles: null },
  { to: '/categories',        label: 'Categories',    icon: FiTag,          roles: null },
  { to: '/brands',            label: 'Brands',        icon: FiShoppingBag,  roles: null },
  { to: '/inventory',         label: 'Inventory',     icon: FiPackage,      roles: null },
  { header: 'Purchases' },
  { to: '/purchases',         label: 'Purchases',     icon: FiTruck,        roles: null },
  { to: '/suppliers',         label: 'Suppliers',     icon: FiTruck,        roles: null },
  { header: 'People' },
  { to: '/customers',         label: 'Customers',     icon: FiUsers,        roles: null },
  { to: '/employees',         label: 'Employees',     icon: FiUser,         roles: ['administrator','manager'] },
  { header: 'Finance' },
  { to: '/expenses',          label: 'Expenses',      icon: FiDollarSign,   roles: null },
  { to: '/reports',           label: 'Reports',       icon: FiBarChart2,    roles: null },
  { header: 'System' },
  { to: '/settings',          label: 'Settings',      icon: FiSettings,     roles: ['administrator'] },
  { to: '/audit-logs',        label: 'Audit Logs',    icon: FiShield,       roles: ['administrator'] },
]

export default function Sidebar({ open, onClose }) {
  const { user, can } = useAuth()

  return (
    <>
      {/* Overlay on mobile */}
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <FiShoppingBag size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Beauty & Glow</p>
              <p className="text-xs text-gray-400">Cosmetics Shop</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {nav.map((item, i) => {
            if (item.header) return (
              <p key={i} className="text-xs text-gray-500 uppercase tracking-widest px-3 mt-4 mb-1">
                {item.header}
              </p>
            )
            if (item.roles && !can(item.roles)) return null
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
