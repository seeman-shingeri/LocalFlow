import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, ShieldCheck, HardDrive } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('marcus@apexhvac.example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check credentials.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md">
            LF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to LocalFlow<span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-xs text-slate-500">
            Operations & AI Customer Follow-Up SaaS for Service Businesses
          </p>
        </div>

        {/* Environment Status Badge */}
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2.5 border ${
            isSupabaseConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-800'
          }`}
        >
          {isSupabaseConnected ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <HardDrive className="w-4 h-4 text-indigo-600 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {isSupabaseConnected ? 'Connected to Supabase PostgreSQL' : 'Local Workspace Mode Active'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isSupabaseConnected
                ? 'Authentication authenticated through Supabase Auth.'
                : 'Demo credentials pre-filled. Instant 1-click access.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
              Remember this device
            </label>
            <Link to="/reset-password" className="font-semibold text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={loading}>
            Sign In to Dashboard
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Need a workspace for your business?{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
