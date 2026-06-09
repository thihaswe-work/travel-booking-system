'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils';

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'textarea' | 'json' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface ManageFormProps {
  fields: FieldDefinition[];
  onSubmit: (data: AnyRecord) => void;
  initialData?: AnyRecord;
  loading?: boolean;
  isEdit?: boolean;
  onCancel?: () => void;
}

export default function ManageForm({
  fields,
  onSubmit,
  initialData,
  loading,
  isEdit,
  onCancel,
}: ManageFormProps) {
  const [formData, setFormData] = useState<AnyRecord>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const data: AnyRecord = {};
      fields.forEach((f) => {
        data[f.name] = initialData[f.name] ?? '';
      });
      setFormData(data);
    } else {
      const data: AnyRecord = {};
      fields.forEach((f) => {
        data[f.name] = '';
      });
      setFormData(data);
    }
  }, [initialData, fields]);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !formData[f.name]) {
        newErrors[f.name] = `${f.label} is required`;
      }
      if (f.type === 'number' && formData[f.name]) {
        const num = Number(formData[f.name]);
        if (isNaN(num)) {
          newErrors[f.name] = 'Must be a valid number';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const data = { ...formData };
      fields.forEach((f) => {
        if (f.type === 'number') {
          data[f.name] = data[f.name] ? Number(data[f.name]) : undefined;
        }
        if (f.type === 'json' && typeof data[f.name] === 'string') {
          try {
            data[f.name] = JSON.parse(data[f.name] as string);
          } catch {
            data[f.name] = data[f.name];
          }
        }
      });
      onSubmit(data);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = (formData[field.name] as string) ?? '';
    const error = errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <Select
            key={field.name}
            label={field.label}
            options={field.options || []}
            placeholder={`Select ${field.label}`}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            error={error}
          />
        );
      case 'textarea':
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
              rows={4}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );
      case 'file':
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <FileUpload
              value={value}
              onChange={(url) => handleChange(field.name, url)}
            />
          </div>
        );
      case 'json':
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} (JSON)
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
              rows={4}
              placeholder='["item1", "item2"]'
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );
      default:
        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) =>
              handleChange(
                field.name,
                field.type === 'number' ? e.target.value : e.target.value
              )
            }
            error={error}
            min={field.min}
            max={field.max}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => renderField(field))}
      <div className="flex gap-3 pt-2">
        <Button variant="primary" type="submit" loading={loading} fullWidth>
          {isEdit ? 'Update' : 'Create'}
        </Button>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
