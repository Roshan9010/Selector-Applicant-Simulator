import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { Briefcase, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CANDIDATE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sending selected role for login
      const res = await api.post('/auth/login', { email, password, role, name: 'User' });
      login(res.data.access_token, res.data.role);
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/candidate');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">WELCOME</h2>
        <p className="text-center text-slate-500 mb-8">Sign in to your account</p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 bg-white/50 focus:bg-white"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 bg-white/50 focus:bg-white pr-12"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl flex-1 hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="role" 
                value="CANDIDATE" 
                checked={role === 'CANDIDATE'} 
                onChange={(e) => setRole(e.target.value)}
                className="text-indigo-600 w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Candidate</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl flex-1 hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="role" 
                value="ADMIN" 
                checked={role === 'ADMIN'} 
                onChange={(e) => setRole(e.target.value)}
                className="text-indigo-600 w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">HR / Admin</span>
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-indigo-200"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-500 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
