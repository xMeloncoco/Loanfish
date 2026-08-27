import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Items } from './pages/Items'
import { Loans } from './pages/Loans'
import { ItemDetail } from './pages/ItemDetail'
import { ItemForm } from './pages/ItemForm'
import { Persons } from './pages/Persons'
import { PersonDetail } from './pages/PersonDetail'
import { PersonForm } from './pages/PersonForm'
import { LoanForm } from './pages/LoanForm'
import { LoanDetail } from './pages/LoanDetail'
import { History } from './pages/History'

function Routing() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />

        <Route path="items" element={<Items />} />
        <Route path="items/new" element={<ItemForm />} />
        <Route path="items/:id" element={<ItemDetail />} />
        <Route path="items/:id/edit" element={<ItemForm />} />

        <Route path="persons" element={<Persons />} />
        <Route path="persons/new" element={<PersonForm />} />
        <Route path="persons/:id" element={<PersonDetail />} />
        <Route path="persons/:id/edit" element={<PersonForm />} />

        <Route path="loans" element={<Loans />} />
        <Route path="loans/new" element={<LoanForm />} />
        <Route path="loans/:id" element={<LoanDetail />} />
        <Route path="loans/:id/edit" element={<LoanForm />} />

        <Route path="history" element={<History />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </BrowserRouter>
  )
}
