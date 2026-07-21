'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { get, post, put, patch, del, getApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import RoomEditor, { RoomEntry } from '@/components/admin/RoomEditor';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Destination, Hotel, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Building2, Plus } from 'lucide-react';

function buildHotelFields(destinations: Destination[]): FieldDefinition[] {
  const destOptions = destinations.map((d) => ({ value: d.id, label: `${d.name}, ${d.country}` }));
  return [
    { name: 'destinationId', label: 'Destination', type: 'select', required: true, options: destOptions },
    { name: 'name', label: 'Hotel Name', type: 'text', required: true },
    { name: 'starRating', label: 'Star Rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'address', label: 'Address', type: 'text', required: true },
    { name: 'pricePerNight', label: 'Price Per Night', type: 'number', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'imageUrl', label: 'Image', type: 'file' },
  ];
}

export default function AdminHotelsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [hotels, setHotels] = useState<PaginatedApiResponse<Hotel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Hotel | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'deactivate'>('approve');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const hotelFields = useMemo(() => buildHotelFields(destinations), [destinations]);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Hotel>>('/hotels/all', { page, limit: 10 });
      setHotels(data);
    } catch {
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  useEffect(() => {
    get<PaginatedApiResponse<Destination>>('/destinations', { limit: 50 }).then((d) => setDestinations(d.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...data, starRating: Number(data.starRating), pricePerNight: Number(data.pricePerNight), rooms: rooms.length > 0 ? rooms : undefined };
      if (editHotel) {
        await put(`/hotels/${editHotel.id}`, payload);
        toast.success('Hotel updated');
      } else {
        await post('/hotels', payload);
        toast.success('Hotel created');
      }
      setModalOpen(false);
      setEditHotel(null);
      setRooms([]);
      fetchHotels();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (hotel: Hotel, newStatus: string) => {
    if (newStatus === 'active' && !hotel.isActive) {
      setConfirmTarget(hotel);
      setConfirmAction('approve');
      setConfirmOpen(true);
    } else if (newStatus === 'pending' && hotel.isActive) {
      setConfirmTarget(hotel);
      setConfirmAction('deactivate');
      setConfirmOpen(true);
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'approve') {
        await patch(`/hotels/${confirmTarget.id}/approve`);
        toast.success('Hotel approved');
      } else {
        await patch(`/hotels/${confirmTarget.id}/deactivate`);
        toast.success('Hotel deactivated');
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      fetchHotels();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/hotels/${deleteTarget.id}`);
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
      <Badge variant={h.isActive ? 'success' : 'warning'} size="sm">{h.isActive ? 'Active' : 'Pending'}</Badge>
    )},
    {
      key: 'actions' as const,
      header: 'Actions' as const,
      render: (h: Hotel) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={h.isActive ? 'active' : 'pending'}
            onChange={(e) => handleStatusChange(h, e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-xs shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {isAdmin && <option value="active">Active</option>}
            {isAdmin && <option value="pending">Pending</option>}
            {!isAdmin && h.isActive && <option value="active">Active</option>}
            {!isAdmin && h.isActive && <option value="pending">Deactivate</option>}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditHotel(null); setRooms([]); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Hotel
        </Button>
      </div>

      <Table columns={columns} data={hotels?.data || []} loading={loading} emptyMessage="No hotels found"
        onRowClick={(h) => { setEditHotel(h); setRooms((h.rooms || []).map(r => ({ roomType: r.roomType, pricePerNight: r.pricePerNight, maxGuests: r.maxGuests, totalRooms: r.totalRooms, availableRooms: r.availableRooms }))); setModalOpen(true); }} rowKey={(h) => h.id} />

      {hotels && hotels.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {hotels.pagination.page} of {hotels.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= hotels.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditHotel(null); setRooms([]); }}
        title={editHotel ? 'Edit Hotel' : 'Add Hotel'} size="xl">
        <ManageForm fields={hotelFields} initialData={editHotel || undefined}
          onSubmit={handleSubmit} loading={saving} isEdit={!!editHotel}
          onCancel={() => { setModalOpen(false); setEditHotel(null); setRooms([]); }} />
        <div className="mt-4 pt-4 border-t border-gray-200">
          <RoomEditor rooms={rooms} onChange={setRooms} />
        </div>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmStatus}
        title={confirmAction === 'approve' ? 'Approve Hotel' : 'Deactivate Hotel'}
        message={`Are you sure you want to ${confirmAction === 'approve' ? 'approve' : 'deactivate'} ${confirmTarget?.name}?`}
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Deactivate'}
        variant={confirmAction === 'approve' ? 'primary' : 'danger'}
        loading={confirmLoading}
      />
    </div>
  );
}
