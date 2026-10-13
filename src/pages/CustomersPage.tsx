import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/database';
import { customerService, CustomerWithRelations } from '@/services/customerService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate, exportToCsv } from '@/lib/utils';
import { CustomerFormModal } from '@/components/customer/CustomerFormModal';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { AIDraftModal } from '@/components/ai/AIDraftModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Edit,
  Trash2,
  Sparkles,
  Eye,
  Archive,
  Download,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);
  const [aiDraftCustomer, setAiDraftCustomer] = useState<Customer | null>(null);
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const data = await customerService.getAll(currentWorkspace.id, {
        search: search.trim() || undefined,
        status: statusFilter,
      });
      setCustomers(data);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentWorkspace, search, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!deleteCustomerTarget || !currentWorkspace) return;
    setDeleting(true);
    try {
      await customerService.delete(deleteCustomerTarget.id, currentWorkspace.id);
      setDeleteCustomerTarget(null);
      loadCustomers();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleArchive = async (customer: Customer) => {
    try {
      const nextStatus = customer.status === 'archived' ? 'active' : 'archived';
      await customerService.update(customer.id, { status: nextStatus });
      loadCustomers();
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    exportToCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Name', 'Email', 'Phone', 'Address', 'Source', 'Status', 'Last Contact', 'Next Follow-Up', 'Notes'],
      customers.map((c) => [
        c.name,
        c.email || '',
        c.phone || '',
        c.address || '',
        c.source || '',
        c.status,
        c.last_contact_date ? formatDate(c.last_contact_date) : '',
        c.next_follow_up_date ? formatDate(c.next_follow_up_date) : '',
        c.notes || '',
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {customers.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your service clients, contact history, and personalized communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={customers.length === 0}
            title="Export filtered customers to CSV"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setFormModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="lead">Leads Only</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Contact</th>
              <th className="py-3 px-4">Next Follow-up</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No customers found matching the search criteria.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => setDrawerCustomerId(c.id)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                    >
                      {c.name}
                    </button>
                    {c.address && (
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="space-y-0.5">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 hover:underline transition-colors"
                          title={`Click to call ${c.phone}`}
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:underline transition-colors"
                          title={`Click to email ${c.email}`}
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {c.source}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={c.status === 'active' ? 'success' : c.status === 'lead' ? 'info' : 'neutral'}>
                      {c.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">{formatDate(c.last_contact_date)}</td>

                  <td className="py-3.5 px-4">
                    {c.next_follow_up_date ? (
                      <span className="font-semibold text-indigo-600">
                        {formatDate(c.next_follow_up_date)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDrawerCustomerId(c.id)}
                        title="View 360 Profile"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAiDraftCustomer(c)}
                        title="Draft AI Message"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCustomer(c);
                          setFormModalOpen(true);
                        }}
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleArchive(c)}
                        title={c.status === 'archived' ? 'Restore Customer' : 'Archive Customer'}
                      >
                        <Archive
                          className={`w-3.5 h-3.5 ${
                            c.status === 'archived' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCustomerTarget(c)}
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CustomerFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={() => loadCustomers()}
        initialCustomer={editingCustomer}
      />

      <CustomerDetailDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onCustomerUpdated={() => loadCustomers()}
      />

      <AIDraftModal
        isOpen={Boolean(aiDraftCustomer)}
        onClose={() => setAiDraftCustomer(null)}
        customer={aiDraftCustomer}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteCustomerTarget)}
        onClose={() => setDeleteCustomerTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Record"
        message={`Are you sure you want to permanently delete "${deleteCustomerTarget?.name}"? Associated data will be removed.`}
        confirmText="Delete Customer"
        isLoading={deleting}
      />
    </div>
  );
};
