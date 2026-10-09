import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Inbox,
  Clock,
  Calendar,
  Receipt,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  overdueCount?: number;
  todayCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  overdueCount = 0,
  todayCount = 0,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { isSupabaseConnected } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Enquiries', path: '/enquiries', icon: Inbox },
    {
      name: 'Follow-ups',
      path: '/follow-ups',
      icon: Clock,
      badge: overdueCount > 0 ? `${overdueCount}` : todayCount > 0 ? `${todayCount}` : undefined,
      badgeVariant: overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
    },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, accent: true },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200/90 bg-white transition-all duration-200 select-none z-20 shrink-0',
        collapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-lg shadow-sm">
            LF
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                LocalFlow<span className="text-indigo-600 font-extrabold ml-0.5">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {currentWorkspace?.name || 'Business Workspace'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                item.accent && !isActive && 'text-indigo-600 hover:bg-indigo-50/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                    item.accent && !isActive && 'text-indigo-500'
                  )}
                />
                {!collapsed && (
                  <span className="ml-3 truncate flex-1 flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0',
                          item.badgeVariant
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Connection & Plan Status Footer */}
      <div className="p-3 border-t border-slate-100">
        <div
          className={cn(
            'rounded-xl p-2.5 border transition-colors',
            isSupabaseConnected
              ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          )}
        >
          <div className="flex items-center gap-2">
            {isSupabaseConnected ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <HardDrive className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            {!collapsed && (
              <div className="truncate text-xs">
                <p className="font-semibold truncate">
                  {isSupabaseConnected ? 'Supabase RLS Active' : 'Local Workspace Mode'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentWorkspace?.plan?.toUpperCase()} Plan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
