import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ResourceResponse } from './resourceTypes';
import { resourceService } from './resourceService';
import { Button } from '../../components/ui/Button';
import { ApiClientError } from '../../services/api';

interface DeleteResourceModalProps {
  isOpen: boolean;
  resource: ResourceResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteResourceModal: React.FC<DeleteResourceModalProps> = ({
  isOpen,
  resource,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await resourceService.deleteResource(resource.id);
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to delete resource');
      } else {
        setError('Network error: Unable to delete resource');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
            Delete Resource
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-slate-900">{resource.name}</strong> from{' '}
            <strong className="text-slate-900">{resource.institutionName || 'your institution'}</strong>?
          </p>
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-[11px] text-red-700 leading-relaxed">
            This action cannot be undone. Any active listings will be removed immediately.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Resource
          </Button>
        </div>
      </div>
    </div>
  );
};
