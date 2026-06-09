'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del, getApiError } from '@/lib/api';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Destination, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { MapPin, Plus } from 'lucide-react';

const destFields: FieldDefinition[] = [
  { name: 'name', label: 'Destination Name', type: 'text', required: true },
  { name: 'country', label: 'Country', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'imageUrl', label: 'Image URL', type: 'text' },

];

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<PaginatedApiResponse<Destination> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDest, setEditDest] = useState<Destination | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Destination>>('/destinations', { page, limit: 10 });
      setDestinations(data);
    } catch {
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...data };
      if (editDest) {
        await put(`/destinations/${editDest.id}`, payload);
        toast.success('Destination updated');
      } else {
        await post('/destinations', payload);
        toast.success('Destination created');
      }
      setModalOpen(false);
      setEditDest(null);
      fetchData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (dest: Destination) => {
    try {
      await put(`/destinations/${dest.id}`, { isActive: !dest.isActive });
      toast.success(`Destination ${dest.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/destinations/${deleteTarget.id}`);
      toast.success('Destination deleted');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const columns: Column<Destination>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'country', header: 'Country' },
    { key: 'description', header: 'Description', render: (d) => d.description?.slice(0, 60) + '...' },
    { key: 'isActive', header: 'Status', render: (d) => (
      <Badge variant={d.isActive ? 'success' : 'danger'} size="sm">{d.isActive ? 'Active' : 'Inactive'}</Badge>
    )},

  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditDest(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Destination
        </Button>
      </div>

      <Table columns={columns} data={destinations?.data || []} loading={loading} emptyMessage="No destinations found"
        onRowClick={(d) => { setEditDest(d); setModalOpen(true); }} rowKey={(d) => d.id} />

      {destinations && destinations.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {destinations.pagination.page} of {destinations.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= destinations.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditDest(null); }}
        title={editDest ? 'Edit Destination' : 'Add Destination'} size="lg">
        <ManageForm fields={destFields} initialData={editDest || undefined}
          onSubmit={handleSubmit} loading={saving} isEdit={!!editDest}
          onCancel={() => setModalOpen(false)} />
        {editDest && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="danger" size="sm"
              onClick={() => { setDeleteTarget(editDest); setDeleteModalOpen(true); }}>
              Delete Destination
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
    </div>
  );
}
