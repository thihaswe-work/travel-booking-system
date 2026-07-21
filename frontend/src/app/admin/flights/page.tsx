'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { get, post, put, patch, del, getApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import SeatEditor, { SeatEntry } from '@/components/admin/SeatEditor';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Flight, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Plane, Plus } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

import type { Destination } from '@/types';

function buildFlightFields(destinations: Destination[]): FieldDefinition[] {
  const destOptions = destinations.map((d) => ({ value: d.id, label: `${d.name}, ${d.country}` }));
  return [
    { name: 'destinationId', label: 'Destination', type: 'select', required: true, options: destOptions },
    { name: 'airline', label: 'Airline', type: 'text', required: true },
    { name: 'flightNumber', label: 'Flight Number', type: 'text', required: true },
    { name: 'departureCity', label: 'Departure City', type: 'text', required: true },
    { name: 'departureTime', label: 'Departure Time', type: 'date', required: true },
    { name: 'arrivalCity', label: 'Arrival City', type: 'text', required: true },
    { name: 'arrivalTime', label: 'Arrival Time', type: 'date', required: true },
    { name: 'durationMin', label: 'Duration (minutes)', type: 'number', required: true },
  ];
}

export default function AdminFlightsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [flights, setFlights] = useState<PaginatedApiResponse<Flight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);
  const [seats, setSeats] = useState<SeatEntry[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Flight | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'deactivate'>('approve');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const flightFields = useMemo(() => buildFlightFields(destinations), [destinations]);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PaginatedApiResponse<Flight>>('/flights/all', { page, limit: 10 });
      setFlights(data);
    } catch {
      toast.error('Failed to load flights');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchFlights(); }, [fetchFlights]);

  useEffect(() => {
    get<PaginatedApiResponse<Destination>>('/destinations', { limit: 50 }).then((d) => setDestinations(d.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        durationMin: Number(data.durationMin),
        seats: seats.length > 0 ? seats : undefined,
      };
      if (editFlight) {
        await put(`/flights/${editFlight.id}`, payload);
        toast.success('Flight updated');
      } else {
        await post('/flights', payload);
        toast.success('Flight created');
      }
      setModalOpen(false);
      setEditFlight(null);
      setSeats([]);
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
      await del(`/flights/${deleteTarget.id}`);
      toast.success('Flight deleted');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchFlights();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleStatusChange = (flight: Flight, newStatus: string) => {
    if (newStatus === 'active' && !flight.isActive) {
      setConfirmTarget(flight);
      setConfirmAction('approve');
      setConfirmOpen(true);
    } else if (newStatus === 'pending' && flight.isActive) {
      setConfirmTarget(flight);
      setConfirmAction('deactivate');
      setConfirmOpen(true);
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'approve') {
        await patch(`/flights/${confirmTarget.id}/approve`);
        toast.success('Flight approved');
      } else {
        await patch(`/flights/${confirmTarget.id}/deactivate`);
        toast.success('Flight deactivated');
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      fetchFlights();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const minPrice = (f: Flight) => {
    if (!f.seats || f.seats.length === 0) return 0;
    return Math.min(...f.seats.map((s) => Number(s.price)));
  };

  const columns: Column<Flight>[] = [
    { key: 'airline', header: 'Airline', sortable: true },
    { key: 'flightNumber', header: 'Flight' },
    { key: 'departureCity', header: 'From', render: (f) => f.departureCity },
    { key: 'arrivalCity', header: 'To', render: (f) => f.arrivalCity },
    { key: 'departureTime', header: 'Departure', render: (f) => formatDateTime(f.departureTime) },
    { key: 'price', header: 'From', render: (f) => formatCurrency(minPrice(f)) },
    { key: 'isActive', header: 'Status', render: (f) => (
      <Badge variant={f.isActive ? 'success' : 'warning'} size="sm">
        {f.isActive ? 'Active' : 'Pending'}
      </Badge>
    )},
    {
      key: 'actions' as const,
      header: 'Actions' as const,
      render: (f: Flight) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={f.isActive ? 'active' : 'pending'}
            onChange={(e) => handleStatusChange(f, e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-xs shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {isAdmin && <option value="active">Active</option>}
            {isAdmin && <option value="pending">Pending</option>}
            {!isAdmin && f.isActive && <option value="active">Active</option>}
            {!isAdmin && f.isActive && <option value="pending">Deactivate</option>}
          </select>
        </div>
      ),
    },
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
          onClick={() => { setEditFlight(null); setSeats([]); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Flight
        </Button>
      </div>

      <Table
        columns={columns}
        data={flights?.data || []}
        loading={loading}
        emptyMessage="No flights found"
        onRowClick={(f) => { setEditFlight(f); setSeats((f.seats || []).map(s => ({ seatClass: s.seatClass, price: Number(s.price), availableSeats: s.availableSeats, totalSeats: s.totalSeats }))); setModalOpen(true); }}
        rowKey={(f) => f.id}
      />

      {flights && flights.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500 px-3">Page {flights.pagination.page} of {flights.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= flights.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditFlight(null); setSeats([]); }} title={editFlight ? 'Edit Flight' : 'Add Flight'} size="xl">
        <ManageForm
          fields={flightFields}
          initialData={editFlight || undefined}
          onSubmit={handleSubmit}
          loading={saving}
          isEdit={!!editFlight}
          onCancel={() => { setModalOpen(false); setEditFlight(null); setSeats([]); }}
        />
        <div className="mt-4 pt-4 border-t border-gray-200">
          <SeatEditor seats={seats} onChange={setSeats} />
        </div>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmStatus}
        title={confirmAction === 'approve' ? 'Approve Flight' : 'Deactivate Flight'}
        message={`Are you sure you want to ${confirmAction === 'approve' ? 'approve' : 'deactivate'} flight ${confirmTarget?.flightNumber}?`}
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Deactivate'}
        variant={confirmAction === 'approve' ? 'primary' : 'danger'}
        loading={confirmLoading}
      />
    </div>
  );
}
