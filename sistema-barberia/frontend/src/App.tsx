// Enrutado principal y protección de rutas por rol (HU-08)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ProveedorAuth } from '@/context/AuthContext'
import { Protegido } from '@/components/Protegido'
import { Layout } from '@/components/Layout'

import Login from '@/pages/Login'
import Registro from '@/pages/Registro'
import Inicio from '@/pages/Inicio'
import Reservar from '@/pages/Reservar'
import MisCitas from '@/pages/MisCitas'
import CitasBarbero from '@/pages/CitasBarbero'
import Dashboard from '@/pages/admin/Dashboard'
import AdminServicios from '@/pages/admin/AdminServicios'
import AdminBarberos from '@/pages/admin/AdminBarberos'
import AdminCitas from '@/pages/admin/AdminCitas'
import PagosAdmin from '@/pages/admin/PagosAdmin'

export default function App() {
  return (
    <ProveedorAuth>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas con layout (barra de navegación) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />

            {/* Cliente */}
            <Route
              path="/reservar"
              element={
                <Protegido roles={['cliente']}>
                  <Reservar />
                </Protegido>
              }
            />
            <Route
              path="/mis-citas"
              element={
                <Protegido roles={['cliente']}>
                  <MisCitas />
                </Protegido>
              }
            />

            {/* Barbero */}
            <Route
              path="/barbero"
              element={
                <Protegido roles={['barbero']}>
                  <CitasBarbero />
                </Protegido>
              }
            />

            {/* Administración */}
            <Route
              path="/admin"
              element={
                <Protegido roles={['admin']}>
                  <Dashboard />
                </Protegido>
              }
            />
            <Route
              path="/admin/servicios"
              element={
                <Protegido roles={['admin']}>
                  <AdminServicios />
                </Protegido>
              }
            />
            <Route
              path="/admin/barberos"
              element={
                <Protegido roles={['admin']}>
                  <AdminBarberos />
                </Protegido>
              }
            />
            <Route
              path="/admin/citas"
              element={
                <Protegido roles={['admin']}>
                  <AdminCitas />
                </Protegido>
              }
            />
            <Route
              path="/admin/pagos"
              element={
                <Protegido roles={['admin']}>
                  <PagosAdmin />
                </Protegido>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </ProveedorAuth>
  )
}
