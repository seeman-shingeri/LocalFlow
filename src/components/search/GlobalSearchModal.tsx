import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  Package,
  Receipt,
  Inbox,
  Calendar,
  ArrowRight,
  SlidersHorizontal,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';
import { searchService, SearchResultItem, SearchEntityType } from '@/services/searchService';
import { useWorkspace } from '@/context/WorkspaceContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<SearchEntityType>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Execute search when query or filterType changes
  useEffect(() => {
    if (!isOpen || !currentWorkspace) return;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.searchAll(currentWorkspace.id, query, filterType);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, filterType, currentWorkspace, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    if (item.url) {
      navigate(item.url);
    }
  };

  if (!isOpen) return null;

  const getEntityIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'customer':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'inventory':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'invoice':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'enquiry':
        return <Inbox className="w-4 h-4 text-blue-600" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBadgeStyle = (variant?: SearchResultItem['badgeVariant']) => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filters: { id: SearchEntityType; label: string }[] = [
    { id: 'all', label: 'All Entities' },
    { id: 'inventory', label: 'Shamiyana / Inventory' },
    { id: 'customer', label: 'Customers' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'enquiry', label: 'Enquiries' },
    { id: 'appointment', label: 'Bookings' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shamiyana tents, inventory, customers, invoices, enquiries..."
            className="flex-1 text-sm bg-transparent border-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 ml-1"
          >
            Esc
          </button>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto scrollbar-none text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[140px] max-h-[460px]">
          {/* Empty Query Prompt */}
          {!query.trim() && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">Type anything to start global search</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Search shamiyana tents, banquet chairs, customer names, phone numbers, invoice codes, or booking dates.
              </p>
            </div>
          )}

          {/* No Results */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold text-slate-700">No matching records found</p>
              <p className="text-xs text-slate-400">
                No items matching &ldquo;{query}&rdquo; under {filterType === 'all' ? 'any category' : filterType}.
              </p>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border border-indigo-200 shadow-2xs'
                        : 'border border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        {getEntityIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${getBadgeStyle(
                                item.badgeVariant
                              )}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {item.meta && (
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                          {item.meta}
                        </span>
                      )}
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-white px-2 py-1 rounded-md border border-indigo-200 shadow-2xs">
                          <span>Open</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">↵</kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">Esc</kbd>{' '}
              Close
            </span>
          </div>
          {results.length > 0 && (
            <span>
              {results.length} result{results.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
