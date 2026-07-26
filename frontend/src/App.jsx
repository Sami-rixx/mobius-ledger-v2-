import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from '@pages/HomePage';
import {
  StudentListPage,
  StudentCreatePage,
  StudentEditPage,
  StudentDetailPage
} from '@pages/Students';
import {
  ClassListPage,
  ClassCreatePage,
  ClassEditPage,
  ClassDetailPage
} from '@pages/Classes';
import {
  SchoolFeeListPage,
  SchoolFeeCreatePage,
  SchoolFeeEditPage,
  SchoolFeeDetailPage
} from '@pages/SchoolFees';
import {
  StudentChargeListPage,
  StudentChargeCreatePage,
  StudentChargeEditPage,
  StudentChargeDetailPage,
  StudentChargeAssignmentListPage
} from '@pages/StudentCharges';
import {
  IncomeListPage,
  IncomeCreatePage,
  IncomeEditPage,
  IncomeDetailPage
} from '@pages/Income';
import {
  IncomeCategoryListPage,
  IncomeCategoryCreatePage,
  IncomeCategoryEditPage,
  IncomeCategoryDetailPage
} from '@pages/IncomeCategories';
import {
  ExpenseListPage,
  ExpenseCreatePage,
  ExpenseEditPage,
  ExpenseDetailPage
} from '@pages/Expenses';
import {
  ExpenseCategoryListPage,
  ExpenseCategoryCreatePage,
  ExpenseCategoryEditPage,
  ExpenseCategoryDetailPage
} from '@pages/ExpenseCategories';
import {
  ReportListPage,
  ReportDetailPage
} from '@pages/Reports';
import {
  AnalyticsDashboardPage
} from '@pages/Analytics';
import {
  DailySummaryListPage,
  DailySummaryDetailPage
} from '@pages/DailySummaries';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation */}
        <nav className="navigation">
          <div className="nav-container">
            <div className="nav-brand">
              <NavLink to="/" className="brand-link">
                <span className="brand-name">Mobius Ledger</span>
                <span className="brand-version">v2</span>
              </NavLink>
            </div>
            <div className="nav-links">
              <NavLink to="/" className="nav-link" end>
                Home
              </NavLink>
              <NavLink to="/students" className="nav-link" end>
                Students
              </NavLink>
              <NavLink to="/classes" className="nav-link" end>
                Classes
              </NavLink>
              <NavLink to="/school-fees" className="nav-link" end>
                School Fees
              </NavLink>
              <NavLink to="/student-charges" className="nav-link" end>
                Student Charges
              </NavLink>
              <NavLink to="/income" className="nav-link" end>
                Income
              </NavLink>
              <NavLink to="/expenses" className="nav-link" end>
                Expenses
              </NavLink>
              <NavLink to="/reports" className="nav-link" end>
                Reports
              </NavLink>
              <NavLink to="/analytics" className="nav-link" end>
                Analytics
              </NavLink>
              <NavLink to="/daily-summaries" className="nav-link" end>
                Daily Summaries
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Student Routes */}
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/create" element={<StudentCreatePage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/students/edit/:id" element={<StudentEditPage />} />
            {/* Class Routes */}
            <Route path="/classes" element={<ClassListPage />} />
            <Route path="/classes/create" element={<ClassCreatePage />} />
            <Route path="/classes/:id" element={<ClassDetailPage />} />
            <Route path="/classes/edit/:id" element={<ClassEditPage />} />
            {/* School Fees Routes */}
            <Route path="/school-fees" element={<SchoolFeeListPage />} />
            <Route path="/school-fees/create" element={<SchoolFeeCreatePage />} />
            <Route path="/school-fees/:id" element={<SchoolFeeDetailPage />} />
            <Route path="/school-fees/edit/:id" element={<SchoolFeeEditPage />} />
            {/* Student Charges Routes */}
            <Route path="/student-charges" element={<StudentChargeListPage />} />
            <Route path="/student-charges/create" element={<StudentChargeCreatePage />} />
            <Route path="/student-charges/:id" element={<StudentChargeDetailPage />} />
            <Route path="/student-charges/edit/:id" element={<StudentChargeEditPage />} />
            <Route path="/student-charges/assignments" element={<StudentChargeAssignmentListPage />} />
            {/* Income Routes */}
            <Route path="/income" element={<IncomeListPage />} />
            <Route path="/income/create" element={<IncomeCreatePage />} />
            <Route path="/income/:id" element={<IncomeDetailPage />} />
            <Route path="/income/edit/:id" element={<IncomeEditPage />} />
            {/* Income Category Routes */}
            <Route path="/income-categories" element={<IncomeCategoryListPage />} />
            <Route path="/income-categories/create" element={<IncomeCategoryCreatePage />} />
            <Route path="/income-categories/:id" element={<IncomeCategoryDetailPage />} />
            <Route path="/income-categories/edit/:id" element={<IncomeCategoryEditPage />} />
            {/* Expense Routes */}
            <Route path="/expenses" element={<ExpenseListPage />} />
            <Route path="/expenses/create" element={<ExpenseCreatePage />} />
            <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
            <Route path="/expenses/edit/:id" element={<ExpenseEditPage />} />
            {/* Expense Category Routes */}
            <Route path="/expense-categories" element={<ExpenseCategoryListPage />} />
            <Route path="/expense-categories/create" element={<ExpenseCategoryCreatePage />} />
            <Route path="/expense-categories/:id" element={<ExpenseCategoryDetailPage />} />
            <Route path="/expense-categories/edit/:id" element={<ExpenseCategoryEditPage />} />
            {/* Reports Routes */}
            <Route path="/reports" element={<ReportListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            {/* Analytics Routes */}
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
            {/* Daily Summaries Routes */}
            <Route path="/daily-summaries" element={<DailySummaryListPage />} />
            <Route path="/daily-summaries/:id" element={<DailySummaryDetailPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <p>&copy; {new Date().getFullYear()} Mobius Muse. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
