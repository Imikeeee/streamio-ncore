import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../api/auth';
import { LogIn, User, Lock } from 'lucide-react';
import ErrorTooltip from '../components/ErrorTooltip';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginMutation.mutateAsync(formData);
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl mb-2">
            <LogIn className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-neutral-400">Sign in to manage your nCore Streamio addon</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
              <span>Something went wrong</span>
              <ErrorTooltip message={error} />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="admin"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 pt-4">
          Need to reset? Contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default Login;
