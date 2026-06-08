'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del, getApiError } from '@/lib/api';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Flight, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Plane, Plus } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const flightFields: FieldDefinition[] = [
  { name: 'destinationId', label: 'Destination ID', type: 'text', required: true },
  { name: 'airline', label: 'Airline', type: 'text', required: true },
  { name: 'flightNumber', label: 'Flight Number', type: 'text', required: true },
  { name: 'departureCity', label: 'Departure City', type: 'text', required: true },
  { name: 'departureTime', label: 'Departure Time', type: 'date', required: true },
  { name: 'arrivalCity', label: 'Arrival City', type: 'text', required: true },
  { name: 'arrivalTime', label: 'Arrival Time', type: 'date', required: true },
  { name: 'durationMin', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'seatClass', label: 'Seat Class', type: 'select', options: [
    { value: 'economy', label: 'Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First' },
  ], required: true },
  { name: 'basePrice', label: 'Base Price', type: 'number', required: true },
  { name: 'availableSeats', label: 'Available Seats', type: 'number', required: true },
];

export default function AdminFlightsPage() {
  const [flights, setFlights] = useState<PaginatedApiResponse<Flight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Flight>>('/admin/flights', { page, limit: 10 });
      setFlights(data);
    } catch {
      toast.error('Failed to load flights');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchFlights(); }, [fetchFlights]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        durationMin: Number(data.durationMin),
        basePrice: Number(data.basePrice),
        availableSeats: Number(data.availableSeats),
      };
      if (editFlight) {
        await patch(`/admin/flights/${editFlight.id}`, payload);
        toast.success('Flight updated');
      } else {
        await post('/admin/flights', payload);
        toast.success('Flight created');
      }
      setModalOpen(false);
      setEditFlight(null);
      fetchFlights();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/admin/flights/${deleteTarget.id}`);
      toast.success('Flight deleted');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchFlights();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const columns: Column<Flight>[] = [
    { key: 'airline', header: 'Airline', sortable: true },
    { key: 'flightNumber', header: 'Flight' },
    { key: 'departureCity', header: 'From', render: (f) => f.departureCity },
    { key: 'arrivalCity', header: 'To', render: (f) => f.arrivalCity },
    { key: 'departureTime', header: 'Departure', render: (f) => formatDateTime(f.departureTime) },
    { key: 'basePrice', header: 'Price', render: (f) => formatCurrency(f.basePrice) },
    { key: 'isActive', header: 'Status', render: (f) => (
      <Badge variant={f.isActive ? 'success' : 'danger'} size="sm">
        {f.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Flights</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditFlight(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Flight
        </Button>
      </div>

      <Table
        columns={columns}
        data={flights?.data || []}
        loading={loading}
        emptyMessage="No flights found"
        onRowClick={(f) => { setEditFlight(f); setModalOpen(true); }}
        rowKey={(f) => f.id}
      />

      {flights && flights.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {flights.pagination.page} of {flights.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= flights.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditFlight(null); }} title={editFlight ? 'Edit Flight' : 'Add Flight'} size="xl">
        <ManageForm
          fields={flightFields}
          initialData={editFlight || undefined}
          onSubmit={handleSubmit}
          loading={saving}
          isEdit={!!editFlight}
          onCancel={() => setModalOpen(false)}
        />
        {editFlight && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="danger"
              size="sm"
              onClick={() => { setDeleteTarget(editFlight); setDeleteModalOpen(true); }}
            >
              Delete Flight
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete" size="sm">
        <p className="text-gray-600 mb-4">Are you sure you want to delete flight {deleteTarget?.flightNumber}?</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
