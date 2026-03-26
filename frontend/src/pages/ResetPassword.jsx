import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const res = await api.post('/auth/reset-password', { email, new_password: newPassword });
      setMessage(res.data.message || 'Password successfully reset. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Create New Password</h2>
        <p className="text-center text-slate-500 mb-8">Enter your new secure password below.</p>
        
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-medium border border-green-100">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              readOnly 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none cursor-not-allowed"
              value={email}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 bg-white/50 focus:bg-white pr-12"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-indigo-200"
          >
            {loading ? 'Saving...' : 'Reset Password'}
            {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
