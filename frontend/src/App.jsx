import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from '@pages/HomePage';
import {
  StudentListPage,
  StudentCreatePage,
  StudentEditPage,
  StudentDetailPage
} from '@pages/Students';

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
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/create" element={<StudentCreatePage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/students/edit/:id" element={<StudentEditPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <p>&copy; {new Date().getFullYear()} Möbius Muse. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
