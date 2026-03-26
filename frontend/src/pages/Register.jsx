import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { UserPlus, ChevronRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'CANDIDATE' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Construct the payload for the backend which expects 'name'
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    try {
      const res = await api.post('/auth/register', payload);
      login(res.data.access_token, res.data.role);
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/candidate');
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      if (errorDetail === "Email already registered") {
        setError("Email already exists. (Note: HR and Candidate accounts require separate emails)");
      } else {
        setError(errorDetail || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-600 p-3 rounded-2xl shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Create Account</h2>
        <p className="text-center text-slate-500 mb-8">Join the Applicant Selector Simulator</p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50"
                placeholder="John"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50"
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registering As</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl flex-1 hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="role" 
                  value="CANDIDATE" 
                  checked={formData.role === 'CANDIDATE'} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="text-purple-600 w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Candidate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl flex-1 hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="role" 
                  value="ADMIN" 
                  checked={formData.role === 'ADMIN'} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="text-purple-600 w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">HR / Admin</span>
              </label>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center mt-6 disabled:opacity-70 shadow-md shadow-purple-200"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
