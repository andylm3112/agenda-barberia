import { Routes, Route, Navigate } from 'react-router-dom'
import Reservar from './pages/Reservar'
import Login from './pages/Login'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Reservar />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
