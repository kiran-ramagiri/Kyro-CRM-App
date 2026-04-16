import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AccountDetail from './pages/AccountDetail'
import AccountForm from './pages/AccountForm'
import PaymentsPage from './pages/PaymentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/account/new" element={<AccountForm />} />
          <Route path="/account/:id" element={<AccountDetail />} />
          <Route path="/account/:id/edit" element={<AccountForm />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
