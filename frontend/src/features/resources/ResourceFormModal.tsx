import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { InstitutionSummary } from '../institutions/institutionTypes';
import {
  ResourceResponse,
  CategoryResponse,
  ResourceType,
  ConditionRating,
  ResourceStatus,
  CreateResourceRequest,
  UpdateResourceRequest,
} from './resourceTypes';
import { resourceService } from './resourceService';
import { ResourcePhoto } from './ResourcePhoto';
import { validateImageFile } from '../images/validateImageFile';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApiClientError } from '../../services/api';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceToEdit?: ResourceResponse | null;
  institutions: InstitutionSummary[];
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resourceToEdit,
  institutions,
}) => {
  const isEditing = Boolean(resourceToEdit);

  // Form states
  const [institutionId, setInstitutionId] = useState<string>('');
  const canManageCategories = institutions.some(
    (institution) => institution.id === institutionId && institution.role === 'ADMIN'
  );
  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [resourceType, setResourceType] = useState<ResourceType>('EQUIPMENT');
  const [location, setLocation] = useState<string>('');
  const [conditionRating, setConditionRating] = useState<ConditionRating>('GOOD');
  const [status, setStatus] = useState<ResourceStatus>('AVAILABLE');
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  const [maxBookingMinutes, setMaxBookingMinutes] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [createdResourceId, setCreatedResourceId] = useState<string | null>(null);

  // Categories list for selected institution
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Inline category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Form submission & validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (resourceToEdit) {
      setInstitutionId(resourceToEdit.institutionId);
      setCategoryId(resourceToEdit.categoryId);
      setName(resourceToEdit.name);
      setDescription(resourceToEdit.description || '');
      setResourceType(resourceToEdit.resourceType);
      setLocation(resourceToEdit.location || '');
      setConditionRating(resourceToEdit.conditionRating);
      setStatus(resourceToEdit.status);
      setRequiresApproval(resourceToEdit.requiresApproval);
      setMaxBookingMinutes(
        resourceToEdit.maxBookingMinutes != null ? String(resourceToEdit.maxBookingMinutes) : ''
      );
    } else {
      // Default to first institution if available
      const defaultInst = institutions.length > 0 ? institutions[0].id : '';
      setInstitutionId(defaultInst);
      setCategoryId('');
      setName('');
      setDescription('');
      setResourceType('EQUIPMENT');
      setLocation('');
      setConditionRating('GOOD');
      setStatus('AVAILABLE');
      setRequiresApproval(true);
      setMaxBookingMinutes('');
    }

    setSelectedPhoto(null);
    setPhotoError(null);
    setRemoveExistingPhoto(false);
    setCreatedResourceId(null);
    setFormErrors({});
    setGeneralError(null);
    setShowNewCategory(false);
    setNewCatName('');
    setNewCatDescription('');
    setCategoryError(null);
  }, [isOpen, resourceToEdit, institutions]);

  useEffect(() => {
    if (!isOpen) {
      setPhotoPreviewUrl(null);
      return;
    }
    if (!selectedPhoto) {
      setPhotoPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [isOpen, selectedPhoto]);

  // Load categories whenever selected institution changes
  useEffect(() => {
    if (!isOpen || !institutionId) {
      setCategories([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCategories(true);
    resourceService
      .getCategories(institutionId)
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          // If current categoryId is not in the new institution's categories, clear it unless editing
          if (!resourceToEdit || resourceToEdit.institutionId !== institutionId) {
            setCategoryId(data.length > 0 ? data[0].id : '');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Failed to load categories:', err);
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, institutionId, resourceToEdit]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    if (!institutionId) {
      setCategoryError('Please select an institution first');
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);
    try {
      const created = await resourceService.createCategory(institutionId, {
        name: newCatName.trim(),
        description: newCatDescription.trim() || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id);
      setShowNewCategory(false);
      setNewCatName('');
      setNewCatDescription('');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCategoryError(err.message || 'Failed to create category');
      } else {
        setCategoryError('Network error while creating category');
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!institutionId) {
      errors.institutionId = 'Institution is required';
    }
    if (!categoryId) {
      errors.categoryId = 'Category is required. Create one if none exist.';
    }
    if (!name.trim()) {
      errors.name = 'Resource name is required';
    } else if (name.trim().length > 200) {
      errors.name = 'Resource name cannot exceed 200 characters';
    }
    if (description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
    if (location.trim().length > 300) {
      errors.location = 'Location cannot exceed 300 characters';
    }
    if (maxBookingMinutes.trim() !== '') {
      const mins = Number(maxBookingMinutes);
      if (isNaN(mins) || mins <= 0 || !Number.isInteger(mins)) {
        errors.maxBookingMinutes = 'Maximum booking duration must be a positive whole number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoError) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    const parsedMins = maxBookingMinutes.trim() ? parseInt(maxBookingMinutes, 10) : undefined;
    let savedResourceId: string | null = null;

    try {
      let resourceId: string;
      if (isEditing && resourceToEdit) {
        const updatePayload: UpdateResourceRequest = {
          name: name.trim(),
          description: description.trim(),
          categoryId,
          resourceType,
          location: location.trim() || undefined,
          conditionRating,
          status,
          requiresApproval,
          maxBookingMinutes: parsedMins,
        };
        await resourceService.updateResource(resourceToEdit.id, updatePayload);
        resourceId = resourceToEdit.id;
      } else if (createdResourceId) {
        const updatePayload: UpdateResourceRequest = {
          name: name.trim(),
          description: description.trim(),
          categoryId,
          resourceType,
          location: location.trim() || undefined,
          conditionRating,
          status,
          requiresApproval,
          maxBookingMinutes: parsedMins,
        };
        await resourceService.updateResource(createdResourceId, updatePayload);
        resourceId = createdResourceId;
      } else {
        const createPayload: CreateResourceRequest = {
          institutionId,
          categoryId,
          name: name.trim(),
          description: description.trim() || undefined,
          resourceType,
          location: location.trim() || undefined,
          conditionRating,
          status,
          requiresApproval,
          maxBookingMinutes: parsedMins,
        };
        const created = await resourceService.createResource(createPayload);
        resourceId = created.id;
        setCreatedResourceId(created.id);
      }
      savedResourceId = resourceId;

      if (selectedPhoto) {
        await resourceService.uploadResourceImage(resourceId, selectedPhoto);
      } else if (removeExistingPhoto && resourceToEdit?.imageId) {
        await resourceService.removeResourceImage(resourceId);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const savedMessage = savedResourceId
        ? ' Resource details were saved; retry Save to retry the photo change without creating another resource.'
        : '';
      if (err instanceof ApiClientError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          const fieldMap: Record<string, string> = {};
          err.fieldErrors.forEach((fe) => {
            fieldMap[fe.field] = fe.message;
          });
          setFormErrors(fieldMap);
        }
        setGeneralError((err.message || 'Operation failed') + savedMessage);
      } else {
        setGeneralError(`Network error: Unable to save resource.${savedMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200 mb-1.5">
              <span>              {isEditing || createdResourceId ? 'Resource Modification' : 'New Resource Registration'}</span>
            </div>
            <h2 id="resource-modal-title" className="text-xl font-bold text-slate-900">
              {isEditing || createdResourceId
                ? `Edit "${resourceToEdit?.name || name}"`
                : 'Share a Campus Resource'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing || createdResourceId
                ? 'Update equipment details, availability status, or booking rules.'
                : 'Register laboratory equipment, spaces, or tools under your institutional membership.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {generalError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{generalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Institution Selection */}
          <div>
            <label htmlFor="res-inst" className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
              Owning Institution <span className="text-red-500">*</span>
            </label>
            {isEditing || createdResourceId ? (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                {resourceToEdit?.institutionName
                  || institutions.find((institution) => institution.id === institutionId)?.name
                  || 'Selected Institution'} (Locked)
              </div>
            ) : (
              <>
                <select
                  id="res-inst"
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(e.target.value);
                    setShowNewCategory(false);
                    setCategoryError(null);
                    if (formErrors.institutionId) {
                      setFormErrors((prev) => ({ ...prev, institutionId: '' }));
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.slug})
                    </option>
                  ))}
                </select>
                {(() => {
                  const selectedInstitution = institutions.find((institution) => institution.id === institutionId);
                  return selectedInstitution && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <ResourcePhoto
                        imageId={selectedInstitution.logoId}
                        alt={`${selectedInstitution.name} logo`}
                        className="h-8 w-8 rounded object-cover border border-slate-200"
                      />
                      <span>{selectedInstitution.name}</span>
                    </div>
                  );
                })()}
              </>
            )}
            {formErrors.institutionId && (
              <p className="text-xs text-red-600 mt-1">{formErrors.institutionId}</p>
            )}
          </div>

          {/* Resource photo */}
          <div className="space-y-2">
            <label htmlFor="resource-photo" className="block text-xs font-semibold text-slate-700 tracking-wide">
              Resource Photo <span className="font-normal text-slate-500">(optional, JPEG/PNG/WebP up to 5 MB)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-full sm:w-48 h-32 overflow-hidden rounded-lg border border-slate-200">
                {photoPreviewUrl ? (
                  <img src={photoPreviewUrl} alt="Selected resource photo preview" className="h-full w-full object-cover" />
                ) : resourceToEdit?.imageId && !removeExistingPhoto ? (
                  <ResourcePhoto imageId={resourceToEdit.imageId} alt={`${resourceToEdit.name} photo`} className="h-full w-full object-cover" />
                ) : (
                  <ResourcePhoto alt="No resource photo selected" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  id="resource-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const validationError = validateImageFile(file);
                    if (validationError) {
                      setPhotoError(validationError);
                      event.target.value = '';
                      return;
                    }
                    setSelectedPhoto(file);
                    setRemoveExistingPhoto(false);
                    setPhotoError(null);
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {selectedPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setPhotoError(null);
                    }}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove selected photo
                  </button>
                )}
                {!selectedPhoto && resourceToEdit?.imageId && !removeExistingPhoto && (
                  <button
                    type="button"
                    onClick={() => setRemoveExistingPhoto(true)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove current photo
                  </button>
                )}
                {removeExistingPhoto && (
                  <button
                    type="button"
                    onClick={() => setRemoveExistingPhoto(false)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Keep current photo
                  </button>
                )}
                {photoError && <p role="alert" className="text-xs text-rose-600">{photoError}</p>}
              </div>
            </div>
          </div>

          {/* Category Selection + Inline Creation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="res-cat" className="block text-xs font-semibold text-slate-700 tracking-wide">
                Resource Category <span className="text-red-500">*</span>
              </label>
              {canManageCategories && !showNewCategory && (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add New Category
                </button>
              )}
            </div>

            {/* Inline Category Creation Box */}
            {canManageCategories && showNewCategory && (
              <div className="p-3.5 mb-2.5 rounded-xl bg-slate-50 border border-brand-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-900">Create New Category</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setCategoryError(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                {categoryError && (
                  <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                    {categoryError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    label="Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Laser Cutters"
                    required
                  />
                  <Input
                    label="Description (optional)"
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    placeholder="e.g. High-power CO2 cutters"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    isLoading={isCreatingCategory}
                    onClick={handleCreateCategory}
                  >
                    Save Category
                  </Button>
                </div>
              </div>
            )}

            <select
              id="res-cat"
              value={categoryId}
              disabled={isLoadingCategories}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (formErrors.categoryId) {
                  setFormErrors((prev) => ({ ...prev, categoryId: '' }));
                }
              }}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
            >
              {categories.length === 0 ? (
                <option value="">
                  {isLoadingCategories ? 'Loading categories...' : 'No categories available — create one first'}
                </option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            {formErrors.categoryId && (
              <p className="text-xs text-red-600 mt-1">{formErrors.categoryId}</p>
            )}
          </div>

          {/* Name & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                id="res-name"
                label="Resource Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Cryo-EM Microscope, Cleanroom B2"
                required
                error={formErrors.name}
              />
            </div>
            <div>
              <label htmlFor="res-type" className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <select
                id="res-type"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="EQUIPMENT">Equipment</option>
                <option value="SPACE">Facility Space</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="res-desc" className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              id="res-desc"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Technical specifications, operating protocols, and access instructions..."
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {formErrors.description && (
              <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* Location & Booking Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="res-location"
              label="Location / Room"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: '' }));
              }}
              placeholder="e.g. Building 3, Room 204"
              error={formErrors.location}
            />

            <Input
              id="res-max-minutes"
              label="Max Booking Duration (Minutes)"
              type="number"
              min={1}
              value={maxBookingMinutes}
              onChange={(e) => {
                setMaxBookingMinutes(e.target.value);
                if (formErrors.maxBookingMinutes) {
                  setFormErrors((prev) => ({ ...prev, maxBookingMinutes: '' }));
                }
              }}
              placeholder="e.g. 120 (optional)"
              error={formErrors.maxBookingMinutes}
              helperText="Maximum minutes permitted per reservation."
            />
          </div>

          {/* Condition & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="res-condition" className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                Physical Condition
              </label>
              <select
                id="res-condition"
                value={conditionRating}
                onChange={(e) => setConditionRating(e.target.value as ConditionRating)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="NEW">New (Pristine / Factory calibrated)</option>
                <option value="GOOD">Good (Fully functional, normal wear)</option>
                <option value="FAIR">Fair (Operational with minor limitations)</option>
                <option value="POOR">Poor (Requires attention or calibration)</option>
              </select>
            </div>

            <div>
              <label htmlFor="res-status" className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                Availability Status
              </label>
              <select
                id="res-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="AVAILABLE">Available (Open for requests)</option>
                <option value="DRAFT">Draft (Hidden from catalog)</option>
                <option value="MAINTENANCE">Maintenance (Temporarily offline)</option>
                <option value="RETIRED">Retired (Permanently decommissioned)</option>
              </select>
            </div>
          </div>

          {/* Approval Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Require Resource Owner Approval
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  When enabled, borrowers cannot reserve this resource immediately; reservations remain pending until approved.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {isEditing || createdResourceId ? 'Save Changes' : 'Register Resource'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
