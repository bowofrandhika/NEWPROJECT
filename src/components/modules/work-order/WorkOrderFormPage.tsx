import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, type WorkOrderFormData } from '../../../schemas';
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder } from '../../../hooks';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const BUYERS = ['Belshina', 'Kamatyres', 'SNI'] as const;
const PACKAGING = ['SW', 'MB', 'LB'] as const;

export default function WorkOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const navigate = useNavigate();

  const { data: workOrder } = useWorkOrder(id!);
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<WorkOrderFormData>({ resolver: zodResolver(workOrderSchema) as any });

  const watchedBuyer = watch('buyer');

  useEffect(() => {
    if (workOrder && isEditing) {
      reset({
        wo_number: workOrder.wo_number,
        wo_date: workOrder.wo_date,
        buyer: workOrder.buyer as any || '',
        deadline_date: workOrder.deadline_date || '',
        packaging: workOrder.packaging as any || '',
        batch_code: workOrder.batch_code,
        target_qty: workOrder.target_qty,
        quantity_kg: workOrder.quantity_kg,
        status: workOrder.status,
        priority: workOrder.priority,
        notes: workOrder.notes || '',
        planned_start_date: workOrder.planned_start_date || '',
        planned_end_date: workOrder.planned_end_date || ''
      });
    }
  }, [workOrder, isEditing, reset]);

  // Generate WO number for new work orders
  useEffect(() => {
    if (!id && !isEditing && watchedBuyer) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear()).slice(2);
      const buyerPrefix = watchedBuyer.slice(0, 3).toUpperCase();
      setValue('wo_number', `PBS.WO.${day}${month}${year}.${buyerPrefix}.`);
      setValue('wo_date', today.toISOString().split('T')[0]);
    }
  }, [id, isEditing, watchedBuyer, setValue]);

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const submitData = {
        ...data,
        buyer_id: undefined,
        product_id: undefined,
        buyer: data.buyer || undefined,
        packaging: data.packaging || undefined
      };

      if (id && isEditing) {
        await updateWorkOrder.mutateAsync({ id, data: submitData as any });
        navigate(`/work-orders/${id}`);
      } else {
        const result = await createWorkOrder.mutateAsync(submitData as any);
        navigate(`/work-orders/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Work Order' : 'New Work Order'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditing ? 'Update work order details' : 'Create a new production work order'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
              <select
                {...register('buyer')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Buyer</option>
                {BUYERS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.buyer && <p className="mt-1 text-sm text-red-500">{errors.buyer.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WO Number *</label>
              <input
                {...register('wo_number')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.wo_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="PBS.WO.DDMMYY.BUY.0001"
              />
              {errors.wo_number && <p className="mt-1 text-sm text-red-500">{errors.wo_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WO Date *</label>
              <input
                type="date"
                {...register('wo_date')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.wo_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.wo_date && <p className="mt-1 text-sm text-red-500">{errors.wo_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input
                type="date"
                {...register('deadline_date')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.deadline_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.deadline_date && <p className="mt-1 text-sm text-red-500">{errors.deadline_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Packaging *</label>
              <select
                {...register('packaging')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Packaging</option>
                {PACKAGING.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.packaging && <p className="mt-1 text-sm text-red-500">{errors.packaging.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (KG) *</label>
              <input
                type="number"
                step="0.01"
                {...register('quantity_kg', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                placeholder="Enter quantity in KG"
              />
              {errors.quantity_kg && <p className="mt-1 text-sm text-red-500">{errors.quantity_kg.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Code *</label>
              <input
                {...register('batch_code')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.batch_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., BATCH-2024-001"
              />
              {errors.batch_code && <p className="mt-1 text-sm text-red-500">{errors.batch_code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Quantity</label>
              <input
                type="number"
                {...register('target_qty', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-10)</label>
              <input
                type="number"
                {...register('priority', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes or special instructions..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Work Order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
