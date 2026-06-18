import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productionSessionSchema, type ProductionSessionFormData } from '../../../schemas';
import { useProductionSession, useCreateProductionSession, useUpdateProductionSession } from '../../../hooks';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const SHIFTS = ['Morning', 'Afternoon'] as const;
const LINES = ['A', 'B', 'AB'] as const;
const PACKAGING = ['SW', 'MB', 'LB'] as const;

export default function DailyInstructionFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const navigate = useNavigate();

  const { data: session } = useProductionSession(id!);
  const createSession = useCreateProductionSession();
  const updateSession = useUpdateProductionSession();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProductionSessionFormData>({ resolver: zodResolver(productionSessionSchema) as any });

  const watchedShift = watch('shift');
  const watchedLine = watch('line');
  const watchedSessionDate = watch('session_date');

  useEffect(() => {
    if (session && isEditing) {
      reset({
        session_number: session.session_number,
        work_order_id: session.work_order_id || '',
        session_date: session.session_date,
        shift: session.shift as any || '',
        line: session.line as any || '',
        buyer_id: session.buyer_id || '',
        batch: session.batch || '',
        packaging: session.packaging as any || '',
        production_target_kg: session.production_target_kg,
        target_production: session.target_production,
        status: session.status,
        notes: session.notes || ''
      });
    }
  }, [session, isEditing, reset]);

  // Generate Session number for new sessions
  useEffect(() => {
    if (!id && !isEditing && watchedSessionDate && watchedShift && watchedLine) {
      const date = new Date(watchedSessionDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(2);
      const shiftNum = watchedShift === 'Morning' ? '1' : '2';
      const lineCode = watchedLine;
      setValue('session_number', `PBS.DP.${day}${month}${year}.${shiftNum}.${lineCode}.`);
    }
  }, [id, isEditing, watchedSessionDate, watchedShift, watchedLine, setValue]);

  const onSubmit = async (data: ProductionSessionFormData) => {
    try {
      const submitData = {
        ...data,
        work_order_id: data.work_order_id || undefined,
        shift_id: undefined,
        line_id: undefined,
        buyer_id: data.buyer_id || undefined,
        shift: data.shift || undefined,
        line: data.line || undefined,
        packaging: data.packaging || undefined
      };

      if (id && isEditing) {
        await updateSession.mutateAsync({ id, data: submitData as any });
        navigate(`/daily-instructions/${id}`);
      } else {
        const result = await createSession.mutateAsync(submitData as any);
        navigate(`/daily-instructions/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving session:', error);
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
            {isEditing ? 'Edit Daily Instruction' : 'New Daily Instruction'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditing ? 'Update production session details' : 'Create a new production session'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Date *</label>
              <input
                type="date"
                {...register('session_date')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.session_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.session_date && <p className="mt-1 text-sm text-red-500">{errors.session_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift *</label>
              <select
                {...register('shift')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.shift ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Shift</option>
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.shift && <p className="mt-1 text-sm text-red-500">{errors.shift.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line *</label>
              <select
                {...register('line')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.line ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Line</option>
                {LINES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.line && <p className="mt-1 text-sm text-red-500">{errors.line.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Number *</label>
              <input
                {...register('session_number')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.session_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="PBS.DP.DDMMYY.1.A.0001"
              />
              {errors.session_number && <p className="mt-1 text-sm text-red-500">{errors.session_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Packaging</label>
              <select
                {...register('packaging')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Packaging</option>
                {PACKAGING.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <input
                {...register('batch')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BATCH-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Target (KG) *</label>
              <input
                type="number"
                step="0.01"
                {...register('production_target_kg', { valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.production_target_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                placeholder="Enter target in KG"
              />
              {errors.production_target_kg && <p className="mt-1 text-sm text-red-500">{errors.production_target_kg.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Production</label>
              <input
                type="number"
                {...register('target_production', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
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
              placeholder="Add any notes..."
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
                  Save Session
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
