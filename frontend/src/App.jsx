import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { auth, offline } from './lib/api'
import { useEffect } from 'react'

import { I18nProvider } from './hooks/useTranslation'
import OfflineBanner from './components/OfflineBanner'
import FloatingAI from './components/FloatingAI'

import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Home from './screens/Home'
import Tools from './screens/Tools'
import CropProfit from './screens/calculators/CropProfit'
import LoanROI from './screens/calculators/LoanROI'
import EMISafety from './screens/calculators/EMISafety'
import StorageDecision from './screens/calculators/StorageDecision'
import EmergencyFund from './screens/calculators/EmergencyFund'
import BreakEven from './screens/calculators/BreakEven'
import CropComparison from './screens/calculators/CropComparison'
import CostLeakage from './screens/calculators/CostLeakage'
import Learn from './screens/Learn'
import LessonDetail from './screens/LessonDetail'
import Schemes from './screens/Schemes'
import SchemeDetail from './screens/SchemeDetail'
import Profile from './screens/Profile'
import Loans    from './screens/Loans'
import CashFlow from './screens/CashFlow'
import Risk     from './screens/Risk'
import Market   from './screens/Market'
import WealthGrowth from './screens/WealthGrowth'

function AuthGuard({ children }) {
  return auth.isLoggedIn() ? children : <Navigate to="/login" replace />
}

function AppShell({ children }) {
  useEffect(() => {
    const onOnline = () => offline.sync()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      <OfflineBanner />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <FloatingAI />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AppShell>
        <Routes>
          {/* Public */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard — the new landing page */}
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />

          {/* Main sections (each has its own back button → /) */}
          <Route path="/home"    element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/tools"   element={<AuthGuard><Tools /></AuthGuard>} />
          <Route path="/learn"   element={<AuthGuard><Learn /></AuthGuard>} />
          <Route path="/schemes" element={<AuthGuard><Schemes /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/loans"     element={<AuthGuard><Loans /></AuthGuard>} />
          <Route path="/cashflow"  element={<AuthGuard><CashFlow /></AuthGuard>} />
          <Route path="/risk"      element={<AuthGuard><Risk /></AuthGuard>} />
          <Route path="/market"    element={<AuthGuard><Market /></AuthGuard>} />
          <Route path="/wealth"    element={<AuthGuard><WealthGrowth /></AuthGuard>} />

          {/* Calculators (back → /tools) */}
          <Route path="/tools/crop-profit"    element={<AuthGuard><CropProfit /></AuthGuard>} />
          <Route path="/tools/loan-roi"       element={<AuthGuard><LoanROI /></AuthGuard>} />
          <Route path="/tools/emi-safety"     element={<AuthGuard><EMISafety /></AuthGuard>} />
          <Route path="/tools/storage"        element={<AuthGuard><StorageDecision /></AuthGuard>} />
          <Route path="/tools/emergency-fund" element={<AuthGuard><EmergencyFund /></AuthGuard>} />
          <Route path="/tools/crop-compare"   element={<AuthGuard><CropComparison /></AuthGuard>} />
          <Route path="/tools/cost-leakage"   element={<AuthGuard><CostLeakage /></AuthGuard>} />
          <Route path="/tools/break-even"     element={<AuthGuard><BreakEven /></AuthGuard>} />

          {/* Lesson detail (back → /learn) */}
          <Route path="/learn/lesson/:id" element={<AuthGuard><LessonDetail /></AuthGuard>} />

          {/* Scheme detail (back → /schemes) */}
          <Route path="/schemes/:id" element={<AuthGuard><SchemeDetail /></AuthGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
    </I18nProvider>
  )
}
