import React, { useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { localDb } from '@/lib/localStorageDb';
import { Building, User, ShieldCheck, Database, Check, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { profile, updateProfile, isSupabaseConnected } = useAuth();

  // Business form state
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [category, setCategory] = useState(currentWorkspace?.category || 'General Services');
  const [currency, setCurrency] = useState(currentWorkspace?.currency || 'USD');
  const [timezone, setTimezone] = useState(currentWorkspace?.timezone || 'America/Chicago');
  const [phone, setPhone] = useState(currentWorkspace?.phone || '');
  const [email, setEmail] = useState(currentWorkspace?.email || '');
  const [address, setAddress] = useState(currentWorkspace?.address || '');

  // User profile state
  const [fullName, setFullName] = useState(profile?.full_name || '');

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setSavedSuccess(false);
    try {
      await updateWorkspace({
        name: name.trim(),
        category: category.trim(),
        currency,
        timezone,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await updateProfile({ full_name: fullName.trim() });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset local storage data back to initial seed data?')) {
      localDb.resetAll();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workspace & Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your business identity, team configuration, and backend connections.
        </p>
      </div>

      {/* Business Details Form */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Details displayed on your customer invoices, reminders, and notifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveBusiness} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Industry / Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electrical Services, HVAC, Plumbing"
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </Select>

            <Input
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/Chicago, UTC"
            />

            <Input
              label="Business Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />

            <Input
              label="Business Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@mybusiness.com"
            />

            <div className="sm:col-span-2">
              <Input
                label="Physical / Mailing Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suite, Street, City, State, ZIP"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            )}
            <Button type="submit" variant="primary" size="sm" isLoading={savingBusiness}>
              Save Business Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* User Account Settings */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle>Operator Account</CardTitle>
              <CardDescription>Your personal profile within this business workspace.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Registered Email"
              disabled
              value={profile?.email || 'user@example.com'}
              helperText="Email is bound to your authentication provider."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {profileSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> Profile updated!
              </span>
            )}
            <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Subscription Architecture (Subscription-ready model) */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle>Subscription Plan & Limits</CardTitle>
              <CardDescription>Centralized quota and plan architecture.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 uppercase">Current Tier</span>
              <Badge variant="default">{currentWorkspace?.plan?.toUpperCase() || 'PRO'}</Badge>
            </div>
            <p className="text-slate-600">Active commercial business tier.</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-1">
            <p className="font-bold text-slate-700 uppercase">Customer Limit</p>
            <p className="text-lg font-bold text-slate-900">Unlimited</p>
            <p className="text-[11px] text-slate-400">Included in Pro plan</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-1">
            <p className="font-bold text-slate-700 uppercase">AI Token Quota</p>
            <p className="text-lg font-bold text-slate-900">50,000 / mo</p>
            <p className="text-[11px] text-slate-400">Generative message drafting</p>
          </div>
        </div>
      </Card>

      {/* Backend & Supabase Integration Status */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle>Database & Cloud Configuration</CardTitle>
              <CardDescription>Supabase PostgreSQL and local repository details.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              isSupabaseConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {isSupabaseConnected ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold text-sm">
                {isSupabaseConnected
                  ? 'Connected to Supabase PostgreSQL'
                  : 'Running in Local Workspace Mode'}
              </p>
              <p className="leading-relaxed">
                {isSupabaseConnected
                  ? 'Row Level Security (RLS) is active. All records are isolated by workspace_id.'
                  : 'Your database schema is located at "supabase/migrations/20250101000000_localflow_schema.sql". When you configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, the application automatically switches to live Supabase cloud.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-slate-500">Need to reset your demo environment data?</p>
            <Button variant="outline" size="sm" onClick={handleResetDemoData}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reset Demo Records
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
