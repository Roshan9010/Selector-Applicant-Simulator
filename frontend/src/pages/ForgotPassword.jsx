import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Mail, ChevronRight } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(
        <div className="flex flex-col gap-2 relative z-10">
          <span>{res.data.message || 'Password reset link generated.'}</span>
          <Link 
            to={`/reset-password?email=${encodeURIComponent(email)}`}
            className="inline-block bg-white text-indigo-600 font-bold py-2 px-4 rounded-lg text-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            Click here to Reset Password
          </Link>
        </div>
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Forgot Password</h2>
        <p className="text-center text-slate-500 mb-8">Enter your email to receive a password reset link.</p>
        
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 bg-white/50 focus:bg-white"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-indigo-200"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
            {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-500 text-sm">
          Remembered your password?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
