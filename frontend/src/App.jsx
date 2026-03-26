import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import ExamRoom from './pages/ExamRoom';
import MockInterview from './pages/MockInterview';
import AIChatbot from './components/AIChatbot';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { token, role } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const DefaultRedirect = () => {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'CANDIDATE') return <Navigate to="/candidate" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/admin" element={
            <ProtectedRoute roleRequired="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/candidate" element={
            <ProtectedRoute roleRequired="CANDIDATE">
              <CandidateDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/mock-interview" element={
            <ProtectedRoute roleRequired="CANDIDATE">
              <MockInterview />
            </ProtectedRoute>
          } />
          
          <Route path="/exam" element={
            <ProtectedRoute roleRequired="CANDIDATE">
              <ExamRoom />
            </ProtectedRoute>
          } />
        </Routes>
        
        {/* Global floating AI chatbot */}
        <AIChatbot />
      </div>
    </Router>
  );
}

export default App;
