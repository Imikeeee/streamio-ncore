import { useState } from 'react';
import Layout from '../components/Layout';
import { useDevices, useCreateDevice, useDeleteDevice } from '../api/devices';
import { Tablet, Plus, Trash2, Copy, Check } from 'lucide-react';
import { DeviceCreateResponse } from '../api/types';
import ErrorTooltip from '../components/ErrorTooltip';

const Devices = () => {
  const { data: devices, isLoading } = useDevices();
  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();

  const [newDeviceName, setNewDeviceName] = useState('');
  const [createdDevice, setCreatedDevice] = useState<DeviceCreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    try {
      const response = await createDevice.mutateAsync({ name: newDeviceName });
      setCreatedDevice(response);
      setNewDeviceName('');
    } catch (err) {
      console.error('Failed to create device', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this device? Access will be revoked immediately.')) {
      try {
        await deleteDevice.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete device', err);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
            <p className="text-neutral-400 mt-2">Manage tokens for your Stremio installations</p>
          </div>
        </div>

        {/* Create Device Form */}
        <div className="p-8 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Add New Device</h3>
            {createDevice.isError && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <span>Failed to create</span>
                <ErrorTooltip message={createDevice.error?.message || 'Unknown error'} />
              </div>
            )}
          </div>
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="text"
              placeholder="e.g. Living Room TV, Android Phone"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              disabled={createDevice.isPending}
            />
            <button
              type="submit"
              disabled={createDevice.isPending || !newDeviceName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {createDevice.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={20} />
                  <span>Create Token</span>
                </>
              )}
            </button>
          </form>

          {createdDevice && (
            <div className="mt-6 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-400">Device Created Successfully!</h4>
                <button 
                  onClick={() => setCreatedDevice(null)}
                  className="text-neutral-500 hover:text-neutral-300 text-sm"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-sm text-neutral-300">
                Copy this URL into your Stremio addon search or settings to install:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdDevice.manifestUrl}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm font-mono text-indigo-300"
                />
                <button
                  onClick={() => copyToClipboard(createdDevice.manifestUrl)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-300"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 italic">
                Note: This URL contains a secret token. Do not share it publicly.
              </p>
            </div>
          )}
        </div>

        {/* Devices List */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">Active Devices</h3>
            <span className="bg-neutral-800 text-neutral-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {devices?.length ?? 0} {devices?.length === 1 ? 'Device' : 'Devices'}
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-neutral-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : devices && devices.length > 0 ? (
            <div className="divide-y divide-neutral-800">
              {devices.map((device) => (
                <div key={device.id} className="p-6 flex flex-col gap-4 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-800 rounded-xl text-neutral-400">
                        <Tablet size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-100">{device.name}</h4>
                        <p className="text-sm text-neutral-500">
                          Created on {new Date(device.createdAt).toLocaleDateString()} at {new Date(device.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(device.id)}
                        disabled={deleteDevice.isPending}
                        className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Revoke Token"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {device.manifestUrl && (
                    <div className="flex gap-2 pl-14">
                      <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-400 truncate">
                        {device.manifestUrl}
                      </div>
                      <button
                        onClick={() => copyToClipboard(device.manifestUrl!)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-neutral-800 rounded-full mb-4 text-neutral-600">
                <Tablet size={48} />
              </div>
              <h4 className="text-neutral-300 font-bold">No devices registered</h4>
              <p className="text-neutral-500 text-sm mt-1">Create your first device token above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Devices;
