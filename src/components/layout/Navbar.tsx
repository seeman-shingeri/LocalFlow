import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Building, User, Plus, Sparkles, CheckCircle2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenQuickAction?: (action: 'customer' | 'enquiry' | 'invoice' | 'appointment') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onOpenQuickAction }) => {
  const { user, profile, signOut, isSupabaseConnected } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace Display */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">
              {currentWorkspace?.name || 'LocalFlow Business'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{currentWorkspace?.category || 'Service Business'}</span>
              <span>•</span>
              <span className="text-slate-500 font-medium">{currentWorkspace?.currency || 'USD'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Center) */}
      <button
        type="button"
        onClick={() => setSearchModalOpen(true)}
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/90 text-xs text-slate-500 hover:text-slate-800 transition-all w-60 lg:w-80 justify-between shadow-2xs group"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
          <span className="truncate">Search equipment, customers, invoices...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs shrink-0">
          Ctrl K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        {/* AI Quick Assistant Pill */}
        <Link
          to="/ai-assistant"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 hover:shadow-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ask AI Assistant</span>
        </Link>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-300">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                {profile?.full_name || 'Business User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-900">{profile?.full_name || 'Business User'}</p>
                <p className="text-slate-500 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Building className="w-4 h-4 text-slate-400" />
                Workspace Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Search & Command Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </header>
  );
};
