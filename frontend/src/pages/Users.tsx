import { useState } from 'react';
import Layout from '../components/Layout';
import { useUsers, useCreateUser, useDeleteUser } from '../api/users';
import { User as UserIcon, Plus, Trash2, Shield, Key, Lock } from 'lucide-react';
import ErrorTooltip from '../components/ErrorTooltip';

const Users = () => {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [showAddForm, setShowAddAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    ncoreUsername: '',
    ncorePassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync(formData);
      setShowAddAddForm(false);
      setFormData({ username: '', password: '', ncoreUsername: '', ncorePassword: '' });
    } catch (err) {
      console.error('Failed to create user', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user? All their devices and access will be removed.')) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete user', err);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-neutral-400 mt-2">Manage people who can access this dashboard</p>
          </div>
          <button
            onClick={() => setShowAddAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        </div>

        {showAddForm && (
          <div className="p-8 bg-neutral-900 rounded-2xl border border-neutral-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-6">Create New Program User</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    type="text"
                    placeholder="Dashboard Username"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    type="password"
                    placeholder="Dashboard Password"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    type="text"
                    placeholder="nCore.pro Username"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.ncoreUsername}
                    onChange={(e) => setFormData({...formData, ncoreUsername: e.target.value})}
                    required
                  />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    type="password"
                    placeholder="nCore.pro Password"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={formData.ncorePassword}
                    onChange={(e) => setFormData({...formData, ncorePassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddForm(false)}
                  className="px-6 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
            {createUser.isError && (
              <p className="mt-4 text-red-400 text-sm flex items-center gap-2">
                <ErrorTooltip message={createUser.error?.message || 'Failed to create user'} />
                <span>Failed to create user. Make sure nCore credentials are valid.</span>
              </p>
            )}
          </div>
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">Active Users</h3>
            <span className="bg-neutral-800 text-neutral-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {users?.length ?? 0} {users?.length === 1 ? 'User' : 'Users'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-neutral-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="divide-y divide-neutral-800">
              {users.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-neutral-800 rounded-xl text-neutral-400">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-100">{user.username}</h4>
                      <p className="text-sm text-neutral-500">
                        Linked to nCore: <span className="text-neutral-300">{user.ncoreUsername}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Joined</p>
                      <p className="text-sm text-neutral-400">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteUser.isPending}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Users;
