import React from 'react';
import { Link } from 'react-router-dom';
import { Server, ShieldCheck, Activity } from 'lucide-react';
import { useCheckSetup } from '../api/auth';

const Welcome: React.FC = () => {
  const { data } = useCheckSetup();
  const isConfigured = data?.isConfigured;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-neutral-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/50">
            <Server size={48} className="text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            nCore Stremio
          </h1>
          <p className="mt-4 text-xl text-neutral-400">
            Secure, self-hosted nCore.pro Stremio addon.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-12">
          <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 text-left hover:border-indigo-500 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <ShieldCheck className="text-indigo-500" />
              <h3 className="font-bold">Secure Access</h3>
            </div>
            <p className="text-neutral-400 text-sm">
              AES-256-GCM encryption for your credentials and HMAC-signed playback URLs.
            </p>
          </div>

          <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 text-left hover:border-indigo-500 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="text-indigo-500" />
              <h3 className="font-bold">Device Management</h3>
            </div>
            <p className="text-neutral-400 text-sm">
              Issue and manage per-device tokens for your Stremio installations.
            </p>
          </div>
        </div>

        <div className="pt-8 space-y-4">
          <Link 
            to="/login"
            className="block w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
          >
            Login to Dashboard
          </Link>
          {isConfigured === false && (
            <p className="text-neutral-500 text-sm">
              First time? <Link to="/setup" className="text-indigo-400 hover:text-indigo-300 font-medium">Run initial setup</Link>
            </p>
          )}
        </div>
        
        <p className="text-neutral-500 text-xs">
          A Hungarian private torrent tracker addon for Stremio.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
