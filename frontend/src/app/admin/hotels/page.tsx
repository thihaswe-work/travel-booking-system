'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del, getApiError } from '@/lib/api';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Hotel, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Building2, Plus } from 'lucide-react';

const hotelFields: FieldDefinition[] = [
  { name: 'name', label: 'Hotel Name', type: 'text', required: true },
  { name: 'starRating', label: 'Star Rating', type: 'number', required: true, min: 1, max: 5 },
  { name: 'address', label: 'Address', type: 'text', required: true },
  { name: 'destinationId', label: 'Destination ID', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'imageUrl', label: 'Image URL', type: 'text' },
];

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<PaginatedApiResponse<Hotel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Hotel>>('/admin/hotels', { page, limit: 10 });
      setHotels(data);
    } catch {
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...data, starRating: Number(data.starRating) };
      if (editHotel) {
        await patch(`/admin/hotels/${editHotel.id}`, payload);
        toast.success('Hotel updated');
      } else {
        await post('/admin/hotels', payload);
        toast.success('Hotel created');
      }
      setModalOpen(false);
      setEditHotel(null);
      fetchHotels();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/admin/hotels/${deleteTarget.id}`);
      toast.success('Hotel deleted');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchHotels();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const columns: Column<Hotel>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'starRating', header: 'Stars', render: (h) => `${'★'.repeat(h.starRating)}` },
    { key: 'address', header: 'Address' },
    { key: 'isActive', header: 'Status', render: (h) => (
      <Badge variant={h.isActive ? 'success' : 'danger'} size="sm">{h.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditHotel(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Hotel
        </Button>
      </div>

      <Table columns={columns} data={hotels?.data || []} loading={loading} emptyMessage="No hotels found"
        onRowClick={(h) => { setEditHotel(h); setModalOpen(true); }} rowKey={(h) => h.id} />

      {hotels && hotels.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {hotels.pagination.page} of {hotels.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= hotels.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditHotel(null); }}
        title={editHotel ? 'Edit Hotel' : 'Add Hotel'} size="xl">
        <ManageForm fields={hotelFields} initialData={editHotel || undefined}
          onSubmit={handleSubmit} loading={saving} isEdit={!!editHotel}
          onCancel={() => setModalOpen(false)} />
        {editHotel && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="danger" size="sm"
              onClick={() => { setDeleteTarget(editHotel); setDeleteModalOpen(true); }}>
              Delete Hotel
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
