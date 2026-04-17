import Layout from '../components/Layout';
import { useStatus } from '../api/status';
import { Activity, ShieldCheck, ShieldAlert, Clock, Database } from 'lucide-react';
import ErrorTooltip from '../components/ErrorTooltip';

const Dashboard = () => {
  const { data: status, isLoading, isError, error } = useStatus();

  const stats = [
    {
      label: 'nCore Connection',
      value: status?.ncoreConnected ? 'Connected' : 'Disconnected',
      icon: status?.ncoreConnected ? ShieldCheck : ShieldAlert,
      color: status?.ncoreConnected ? 'text-green-500' : 'text-red-500',
      bg: status?.ncoreConnected ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Active Torrents',
      value: status?.activeTorrents ?? 0,
      icon: Activity,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Uptime',
      value: status?.uptime ? `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m` : '0m',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Version',
      value: status?.version ?? 'v1.0.0',
      icon: Database,
      color: 'text-neutral-400',
      bg: 'bg-neutral-800',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="text-neutral-400 mt-2">Real-time health and performance metrics</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-neutral-900 rounded-2xl border border-neutral-800" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between">
            <span>Failed to fetch system status. Please ensure the server is running.</span>
            <ErrorTooltip message={error?.message || 'Connection error'} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${stat.bg}`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Placeholder for future activity charts or more details */}
        <div className="grid grid-cols-1 gap-6">
          <div className="p-8 bg-neutral-900 rounded-2xl border border-neutral-800">
            <h3 className="text-lg font-bold mb-4">Server Node Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Node Version</span>
                <span className="font-mono text-sm">{status?.nodeVersion ?? 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Environment</span>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs font-bold uppercase tracking-wider">Production</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
