import { Routes, Route, Navigate } from 'react-router-dom'
import BillsList from './bills/BillsList'
import BillDetail from './bills/BillDetail'
import BillForm from './bills/BillForm'

export default function Bills() {
  return (
    <Routes>
      <Route index element={<BillsList />} />
      <Route path="new" element={<BillForm />} />
      <Route path="edit/:id" element={<BillForm />} />
      <Route path=":id" element={<BillDetail />} />
      <Route path="*" element={<Navigate to="/bills" replace />} />
    </Routes>
  )
}
