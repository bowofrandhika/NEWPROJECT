import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, type WorkOrderFormData } from '../../../schemas';
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder, useBuyers, useProducts } from '../../../hooks';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function WorkOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const navigate = useNavigate();

  const { data: workOrder } = useWorkOrder(id!);
  const { data: buyers } = useBuyers();
  const { data: products } = useProducts();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<WorkOrderFormData>({ resolver: zodResolver(workOrderSchema) as any });

  useEffect(() => {
    if (workOrder && isEditing) {
      reset({
        wo_number: workOrder.wo_number,
        wo_date: workOrder.wo_date,
        buyer_id: workOrder.buyer_id || '',
        product_id: workOrder.product_id || '',
        batch_code: workOrder.batch_code,
        target_qty: workOrder.target_qty,
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
    if (!id && !isEditing) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      setValue('wo_number', `WO-${year}${month}-${random}`);
      setValue('wo_date', today.toISOString().split('T')[0]);
    }
  }, [id, isEditing, setValue]);

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const submitData = {
        ...data,
        buyer_id: data.buyer_id || undefined,
        product_id: data.product_id || undefined
      };

      if (id && isEditing) {
        await updateWorkOrder.mutateAsync({ id, data: submitData as unknown as Parameters<typeof updateWorkOrder.mutateAsync>[0]['data'] });
        navigate(`/work-orders/${id}`);
      } else {
        const result = await createWorkOrder.mutateAsync(submitData as unknown as Parameters<typeof createWorkOrder.mutateAsync>[0]);
        navigate(`/work-orders/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WO Number *
              </label>
              <input
                {...register('wo_number')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.wo_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.wo_number && (
                <p className="mt-1 text-sm text-red-500">{errors.wo_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WO Date *
              </label>
              <input
                type="date"
                {...register('wo_date')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.wo_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.wo_date && (
                <p className="mt-1 text-sm text-red-500">{errors.wo_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer
              </label>
              <select
                {...register('buyer_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Buyer</option>
                {buyers?.map((b) => (
                  <option key={b.id} value={b.id}>{b.buyer_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                {...register('product_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.product_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Code *
              </label>
              <input
                {...register('batch_code')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.batch_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., BATCH-2024-001"
              />
              {errors.batch_code && (
                <p className="mt-1 text-sm text-red-500">{errors.batch_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Quantity *
              </label>
              <input
                type="number"
                {...register('target_qty', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.target_qty ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.target_qty && (
                <p className="mt-1 text-sm text-red-500">{errors.target_qty.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                {...register('priority', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Start Date
              </label>
              <input
                type="date"
                {...register('planned_start_date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned End Date
              </label>
              <input
                type="date"
                {...register('planned_end_date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
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
