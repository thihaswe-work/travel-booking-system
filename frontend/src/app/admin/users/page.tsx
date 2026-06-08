'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, patch, getApiError } from '@/lib/api';
import Table, { Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ManageForm, { FieldDefinition } from '@/components/admin/ManageForm';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { User, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Search, Users as UsersIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const userFields: FieldDefinition[] = [
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'role', label: 'Role', type: 'select', options: [
    { value: 'customer', label: 'Customer' },
    { value: 'travel_agent', label: 'Travel Agent' },
    { value: 'admin', label: 'Admin' },
  ]},
  { name: 'isActive', label: 'Active', type: 'select', options: [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]},
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PaginatedApiResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (search) params.query = search;
      if (roleFilter) params.role = roleFilter;
      const data = await get<PaginatedApiResponse<User>>('/admin/users', params);
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await patch(`/admin/users/${selectedUser.id}`, {
        ...data,
        isActive: data.isActive === 'true',
      });
      toast.success('User updated');
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<User>[] = [
    { key: 'firstName', header: 'Name', render: (u) => `${u.firstName} ${u.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'role', header: 'Role', render: (u) => (
      <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'travel_agent' ? 'primary' : 'default'} size="sm">
        {u.role}
      </Badge>
    )},
    { key: 'isActive', header: 'Status', render: (u) => (
      <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
        {u.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'createdAt', header: 'Joined', render: (u) => formatDate(u.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: '', label: 'All Roles' },
              { value: 'customer', label: 'Customer' },
              { value: 'travel_agent', label: 'Travel Agent' },
              { value: 'admin', label: 'Admin' },
            ]}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users?.data || []}
        loading={loading}
        emptyMessage="No users found"
        onRowClick={(user) => {
          setSelectedUser(user);
          setModalOpen(true);
        }}
        rowKey={(u) => u.id}
      />

      {users && users.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500 px-3">
              Page {users.pagination.page} of {users.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= users.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit User"
        size="lg"
      >
        {selectedUser && (
          <ManageForm
            fields={userFields}
            initialData={{
              ...selectedUser,
              isActive: String(selectedUser.isActive),
            }}
            onSubmit={handleEdit}
            loading={saving}
            isEdit
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
