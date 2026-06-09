'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { get, post, put, patch, del, getApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Destination, Tour, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Compass, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function buildTourFields(destinations: Destination[]): FieldDefinition[] {
  const destOptions = destinations.map((d) => ({ value: d.id, label: `${d.name}, ${d.country}` }));
  return [
    { name: 'destinationId', label: 'Destination', type: 'select', required: true, options: destOptions },
    { name: 'name', label: 'Tour Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'durationDays', label: 'Duration (days)', type: 'number', required: true },
    { name: 'pricePerPerson', label: 'Price Per Person', type: 'number', required: true },
    { name: 'maxCapacity', label: 'Max Capacity', type: 'number', required: true },
    { name: 'availableSlots', label: 'Available Slots', type: 'number', required: true },
    { name: 'includes', label: 'Includes', type: 'json' },
    { name: 'itinerary', label: 'Itinerary', type: 'json' },
  ];
}

export default function AdminToursPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tours, setTours] = useState<PaginatedApiResponse<Tour> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTour, setEditTour] = useState<Tour | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Tour | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'deactivate'>('approve');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const tourFields = useMemo(() => buildTourFields(destinations), [destinations]);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Tour>>('/tours/all', { page, limit: 10 });
      setTours(data);
    } catch {
      toast.error('Failed to load tours');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  useEffect(() => {
    get<PaginatedApiResponse<Destination>>('/destinations', { limit: 50 }).then((d) => setDestinations(d.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        durationDays: Number(data.durationDays),
        pricePerPerson: Number(data.pricePerPerson),
        maxCapacity: Number(data.maxCapacity),
        availableSlots: Number(data.availableSlots),
      };
      if (editTour) {
        await put(`/tours/${editTour.id}`, payload);
        toast.success('Tour updated');
      } else {
        await post('/tours', payload);
        toast.success('Tour created');
      }
      setModalOpen(false);
      setEditTour(null);
      fetchTours();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (tour: Tour, newStatus: string) => {
    if (newStatus === 'active' && !tour.isActive) {
      setConfirmTarget(tour);
      setConfirmAction('approve');
      setConfirmOpen(true);
    } else if (newStatus === 'pending' && tour.isActive) {
      setConfirmTarget(tour);
      setConfirmAction('deactivate');
      setConfirmOpen(true);
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'approve') {
        await patch(`/tours/${confirmTarget.id}/approve`);
        toast.success('Tour approved');
      } else {
        await patch(`/tours/${confirmTarget.id}/deactivate`);
        toast.success('Tour deactivated');
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      fetchTours();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/tours/${deleteTarget.id}`);
      toast.success('Tour deleted');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchTours();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const columns: Column<Tour>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'durationDays', header: 'Duration', render: (t) => `${t.durationDays} days` },
    { key: 'pricePerPerson', header: 'Price', render: (t) => formatCurrency(t.pricePerPerson) },
    { key: 'availableSlots', header: 'Slots', render: (t) => `${t.availableSlots}/${t.maxCapacity}` },
    { key: 'isActive', header: 'Status', render: (t) => (
      <Badge variant={t.isActive ? 'success' : 'warning'} size="sm">{t.isActive ? 'Active' : 'Pending'}</Badge>
    )},
    {
      key: 'actions' as const,
      header: 'Status' as const,
      render: (t: Tour) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={t.isActive ? 'active' : 'pending'}
            onChange={(e) => handleStatusChange(t, e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-xs shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {isAdmin && <option value="active">Active</option>}
            {isAdmin && <option value="pending">Pending</option>}
            {!isAdmin && t.isActive && <option value="active">Active</option>}
            {!isAdmin && t.isActive && <option value="pending">Deactivate</option>}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Compass className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditTour(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Tour
        </Button>
      </div>

      <Table columns={columns} data={tours?.data || []} loading={loading} emptyMessage="No tours found"
        onRowClick={(t) => { setEditTour(t); setModalOpen(true); }} rowKey={(t) => t.id} />

      {tours && tours.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {tours.pagination.page} of {tours.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= tours.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditTour(null); }}
        title={editTour ? 'Edit Tour' : 'Add Tour'} size="xl">
        <ManageForm fields={tourFields} initialData={editTour ? {
          ...editTour,
          includes: JSON.stringify(editTour.includes),
          itinerary: JSON.stringify(editTour.itinerary),
        } : undefined}
          onSubmit={handleSubmit} loading={saving} isEdit={!!editTour}
          onCancel={() => setModalOpen(false)} />
        {editTour && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="danger" size="sm"
              onClick={() => { setDeleteTarget(editTour); setDeleteModalOpen(true); }}>
              Delete Tour
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete" size="sm">
        <p className="text-gray-600 mb-4">Are you sure you want to delete {deleteTarget?.name}?</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmStatus}
        title={confirmAction === 'approve' ? 'Approve Tour' : 'Deactivate Tour'}
        message={`Are you sure you want to ${confirmAction === 'approve' ? 'approve' : 'deactivate'} ${confirmTarget?.name}?`}
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Deactivate'}
        variant={confirmAction === 'approve' ? 'primary' : 'danger'}
        loading={confirmLoading}
      />
    </div>
  );
}
