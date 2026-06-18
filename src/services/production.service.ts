import supabase from '../lib/supabase';
import type { WorkOrder, ProductionSession } from '../types/database';

export const workOrderService = {
  async getAll(filters?: { status?: string; date?: string }): Promise<WorkOrder[]> {
    let query = supabase
      .from('work_orders')
      .select('*, buyers(buyer_name), products(product_name)')
      .order('wo_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('wo_date', filters.date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, buyers(*), products(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(wo: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        ...wo,
        created_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, wo: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        ...wo,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    if (error) throw error;
  },

  async generateWONumber(buyer: string): Promise<string> {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(2);
    const buyerPrefix = buyer ? buyer.slice(0, 3).toUpperCase() : 'XXX';

    const pattern = `PBS.WO.${day}${month}${year}.${buyerPrefix}.%`;
    const { data, error } = await supabase
      .from('work_orders')
      .select('wo_number')
      .like('wo_number', pattern)
      .order('wo_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].wo_number;
      const parts = lastNumber.split('.');
      const lastSeq = parseInt(parts[parts.length - 1] || '0');
      sequence = lastSeq + 1;
    }

    return `PBS.WO.${day}${month}${year}.${buyerPrefix}.${String(sequence).padStart(4, '0')}`;
  },

  async confirmCompletion(id: string): Promise<WorkOrder> {
    return this.update(id, { wo_completion_confirmed: true, status: 'COMPLETED' });
  },

  async checkAndNotifyCompletion(id: string): Promise<void> {
    const { data: wo } = await supabase
      .from('work_orders')
      .select('quantity_kg, completed_kg, notification_sent, wo_completion_confirmed')
      .eq('id', id)
      .single();

    if (!wo || wo.notification_sent || wo.wo_completion_confirmed) return;

    if (wo.completed_kg >= wo.quantity_kg) {
      await supabase
        .from('work_orders')
        .update({ notification_sent: true })
        .eq('id', id);

      await supabase
        .from('wo_completion_notifications')
        .insert({
          work_order_id: id,
          message: `Work Order has reached the target quantity. Completion confirmation required.`
        });
    }
  }
};

export const productionSessionService = {
  async getAll(filters?: { status?: string; date?: string; shift_id?: string }): Promise<ProductionSession[]> {
    let query = supabase
      .from('production_sessions')
      .select('*, shifts(shift_name), lines(line_name), buyers(buyer_name), work_orders(wo_number)')
      .order('session_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('session_date', filters.date);
    }
    if (filters?.shift_id) {
      query = query.eq('shift_id', filters.shift_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ProductionSession | null> {
    const { data, error } = await supabase
      .from('production_sessions')
      .select('*, shifts(*), lines(*), buyers(*), work_orders(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(session: Omit<ProductionSession, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionSession> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('production_sessions')
      .insert({
        ...session,
        created_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, session: Partial<ProductionSession>): Promise<ProductionSession> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('production_sessions')
      .update({
        ...session,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('production_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async generateSessionNumber(sessionDate: string, shift: string, line: string): Promise<string> {
    const date = new Date(sessionDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    const shiftNum = shift === 'Morning' ? '1' : shift === 'Afternoon' ? '2' : '1';
    const lineCode = line || 'A';

    const pattern = `PBS.DP.${day}${month}${year}.${shiftNum}.${lineCode}.%`;
    const { data, error } = await supabase
      .from('production_sessions')
      .select('session_number')
      .like('session_number', pattern)
      .order('session_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].session_number;
      const parts = lastNumber.split('.');
      const lastSeq = parseInt(parts[parts.length - 1] || '0');
      sequence = lastSeq + 1;
    }

    return `PBS.DP.${day}${month}${year}.${shiftNum}.${lineCode}.${String(sequence).padStart(4, '0')}`;
  },

  async activate(id: string): Promise<ProductionSession> {
    return this.update(id, { status: 'ACTIVE' });
  },

  async complete(id: string): Promise<ProductionSession> {
    return this.update(id, { status: 'COMPLETED' });
  }
};
