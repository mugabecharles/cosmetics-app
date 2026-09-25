import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import AppLayout    from './components/layout/AppLayout'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Products     from './pages/products/Products'
import Categories   from './pages/products/Categories'
import Brands       from './pages/products/Brands'
import Inventory    from './pages/products/Inventory'
import POS          from './pages/sales/POS'
import Sales        from './pages/sales/Sales'
import Returns      from './pages/sales/Returns'
import Payments     from './pages/sales/Payments'
import Customers    from './pages/customers/Customers'
import Suppliers    from './pages/suppliers/Suppliers'
import Purchases    from './pages/purchases/Purchases'
import Expenses     from './pages/expenses/Expenses'
import Employees    from './pages/employees/Employees'
import Reports      from './pages/Reports'
import Settings     from './pages/Settings'
import AuditLogs    from './pages/AuditLogs'

function ProtectedRoute({ children, roles }) {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !can(roles)) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
      <p className="text-2xl font-bold mb-2">Access Denied</p>
      <p className="text-sm">You don't have permission to view this page.</p>
    </div>
  )
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* App */}
      <Route element={<AppLayout />}>
        <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos"        element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="/sales"      element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/returns"    element={<ProtectedRoute><Returns /></ProtectedRoute>} />
        <Route path="/payments"   element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/products"   element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/brands"     element={<ProtectedRoute><Brands /></ProtectedRoute>} />
        <Route path="/inventory"  element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/customers"  element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/suppliers"  element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/purchases"  element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/expenses"   element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/employees"  element={
          <ProtectedRoute roles={['administrator', 'manager']}><Employees /></ProtectedRoute>
        } />
        <Route path="/settings"   element={
          <ProtectedRoute roles={['administrator']}><Settings /></ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute roles={['administrator']}><AuditLogs /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
