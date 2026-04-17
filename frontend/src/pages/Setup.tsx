import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetup } from '../api/auth';
import { Shield, User, Lock, Key, Server } from 'lucide-react';
import ErrorTooltip from '../components/ErrorTooltip';

const Setup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    ncoreUsername: '',
    ncorePassword: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setupMutation = useSetup();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await setupMutation.mutateAsync({
        username: formData.username,
        password: formData.password,
        ncoreUsername: formData.ncoreUsername,
        ncorePassword: formData.ncorePassword,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl mb-2">
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Initial Setup</h1>
          <p className="text-neutral-400">Create your admin account and configure nCore credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
              <span>Action Failed</span>
              <ErrorTooltip message={error} />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300 ml-1">Admin Username</label>
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

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-300 ml-1">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 mt-4">
              <div className="flex items-center gap-2 mb-4 text-neutral-400">
                <Server className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">nCore Credentials</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-300 ml-1">nCore Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      name="ncoreUsername"
                      required
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="ncore_user"
                      value={formData.ncoreUsername}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-300 ml-1">nCore Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      name="ncorePassword"
                      required
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="••••••••"
                      value={formData.ncorePassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={setupMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {setupMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
        
        <div className="pt-4 text-center">
          <p className="text-[10px] text-neutral-700 font-mono uppercase tracking-widest">
            Build: v1.0.2-debug-logs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Setup;
