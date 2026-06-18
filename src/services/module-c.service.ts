import supabase from '../lib/supabase';
import type {
  DryerMonitoring,
  DryerMonitoringRecord,
  TrolleyMonitoring,
  RejectRecord
} from '../types/database';

export const dryerMonitoringService = {
  async getBySessionId(sessionId: string): Promise<DryerMonitoring[]> {
    const { data, error } = await supabase
      .from('dryer_monitoring')
      .select('*, dryers(dryer_name)')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<DryerMonitoring | null> {
    const { data, error } = await supabase
      .from('dryer_monitoring')
      .select('*, dryers(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(monitoring: Omit<DryerMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<DryerMonitoring> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('dryer_monitoring')
      .insert({
        ...monitoring,
        monitored_by: user?.id,
        start_time: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, monitoring: Partial<DryerMonitoring>): Promise<DryerMonitoring> {
    const { data, error } = await supabase
      .from('dryer_monitoring')
      .update({ ...monitoring, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async complete(id: string): Promise<DryerMonitoring> {
    return this.update(id, {
      status: 'COMPLETED',
      end_time: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('dryer_monitoring').delete().eq('id', id);
    if (error) throw error;
  }
};

export const dryerMonitoringRecordService = {
  async getByMonitoringId(monitoringId: string): Promise<DryerMonitoringRecord[]> {
    const { data, error } = await supabase
      .from('dryer_monitoring_records')
      .select('*')
      .eq('dryer_monitoring_id', monitoringId)
      .order('record_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<DryerMonitoringRecord, 'id' | 'created_at'>): Promise<DryerMonitoringRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('dryer_monitoring_records')
      .insert({
        ...record,
        recorded_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('dryer_monitoring_records').delete().eq('id', id);
    if (error) throw error;
  }
};

export const trolleyMonitoringService = {
  async getBySessionId(sessionId: string): Promise<TrolleyMonitoring[]> {
    const { data, error } = await supabase
      .from('trolley_monitoring')
      .select('*, trolleys(trolley_name), dryers(dryer_name)')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(monitoring: Omit<TrolleyMonitoring, 'id' | 'created_at'>): Promise<TrolleyMonitoring> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('trolley_monitoring')
      .insert({
        ...monitoring,
        monitored_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, monitoring: Partial<TrolleyMonitoring>): Promise<TrolleyMonitoring> {
    const { data, error } = await supabase
      .from('trolley_monitoring')
      .update(monitoring)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async load(id: string, qty: number): Promise<TrolleyMonitoring> {
    return this.update(id, {
      status: 'LOADED',
      load_time: new Date().toISOString(),
      loaded_qty: qty
    });
  },

  async enterDryer(id: string): Promise<TrolleyMonitoring> {
    return this.update(id, { status: 'IN_DRYER' });
  },

  async unload(id: string, qty: number): Promise<TrolleyMonitoring> {
    return this.update(id, {
      status: 'UNLOADED',
      unload_time: new Date().toISOString(),
      unloaded_qty: qty
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('trolley_monitoring').delete().eq('id', id);
    if (error) throw error;
  }
};

export const rejectRecordService = {
  async getBySessionId(sessionId: string): Promise<RejectRecord[]> {
    const { data, error } = await supabase
      .from('reject_records')
      .select('*, dryers(dryer_name), trolleys(trolley_name)')
      .eq('production_session_id', sessionId)
      .order('reject_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<RejectRecord, 'id' | 'created_at'>): Promise<RejectRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('reject_records')
      .insert({
        ...record,
        recorded_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<RejectRecord>): Promise<RejectRecord> {
    const { data, error } = await supabase
      .from('reject_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async verify(id: string): Promise<RejectRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'VERIFIED',
      verified_by: user?.id
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reject_records').delete().eq('id', id);
    if (error) throw error;
  },

  async getSummaryBySessionId(sessionId: string): Promise<{ reject_type: string; total_qty: number }[]> {
    const { data, error } = await supabase
      .from('reject_records')
      .select('reject_type, reject_qty')
      .eq('production_session_id', sessionId);

    if (error) throw error;

    const summary: Record<string, number> = {};
    data?.forEach(r => {
      summary[r.reject_type] = (summary[r.reject_type] || 0) + r.reject_qty;
    });

    return Object.entries(summary).map(([type, qty]) => ({
      reject_type: type,
      total_qty: qty
    }));
  }
};
