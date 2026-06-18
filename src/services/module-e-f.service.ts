import supabase from '../lib/supabase';
import type { BottleneckRecord, CorrectiveAction, DowntimeRecord } from '../types/database';

export const bottleneckRecordService = {
  async getBySessionId(sessionId: string): Promise<BottleneckRecord[]> {
    const { data, error } = await supabase
      .from('bottleneck_records')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('bottleneck_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<BottleneckRecord | null> {
    const { data, error } = await supabase
      .from('bottleneck_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(record: Omit<BottleneckRecord, 'id' | 'created_at' | 'updated_at'>): Promise<BottleneckRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('bottleneck_records')
      .insert({
        ...record,
        identified_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<BottleneckRecord>): Promise<BottleneckRecord> {
    const { data, error } = await supabase
      .from('bottleneck_records')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async resolve(id: string, notes?: string): Promise<BottleneckRecord> {
    return this.update(id, {
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      resolution_notes: notes
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('bottleneck_records').delete().eq('id', id);
    if (error) throw error;
  },

  async getSummary(filters?: { status?: string }) {
    let query = supabase
      .from('bottleneck_records')
      .select('severity, status');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      total: data?.length || 0,
      bySeverity: data?.reduce((acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: data?.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
};

export const correctiveActionService = {
  async getByBottleneckId(bottleneckId: string): Promise<CorrectiveAction[]> {
    const { data, error } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('bottleneck_record_id', bottleneckId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<CorrectiveAction | null> {
    const { data, error } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(action: Omit<CorrectiveAction, 'id' | 'created_at' | 'updated_at'>): Promise<CorrectiveAction> {
    const { data, error } = await supabase
      .from('corrective_actions')
      .insert(action)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, action: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({ ...action, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async complete(id: string): Promise<CorrectiveAction> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      completed_by: user?.id
    });
  },

  async verify(id: string, effectiveness: 'INEFFECTIVE' | 'PARTIAL' | 'EFFECTIVE' | 'VERY_EFFECTIVE'): Promise<CorrectiveAction> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: user?.id,
      effectiveness
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('corrective_actions').delete().eq('id', id);
    if (error) throw error;
  }
};

export const downtimeRecordService = {
  async getBySessionId(sessionId: string): Promise<DowntimeRecord[]> {
    const { data, error } = await supabase
      .from('downtime_records')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('downtime_start', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<DowntimeRecord | null> {
    const { data, error } = await supabase
      .from('downtime_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(record: Omit<DowntimeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DowntimeRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('downtime_records')
      .insert({
        ...record,
        reported_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<DowntimeRecord>): Promise<DowntimeRecord> {
    const { data, error } = await supabase
      .from('downtime_records')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async acknowledge(id: string): Promise<DowntimeRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'ACKNOWLEDGED',
      acknowledged_by: user?.id,
      acknowledged_at: new Date().toISOString()
    });
  },

  async startWork(id: string): Promise<DowntimeRecord> {
    return this.update(id, { status: 'IN_PROGRESS' });
  },

  async resolve(id: string, resolution: string): Promise<DowntimeRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const { data: record } = await supabase
      .from('downtime_records')
      .select('downtime_start')
      .eq('id', id)
      .single();

    let duration = 0;
    if (record?.downtime_start) {
      duration = Math.round((new Date(now).getTime() - new Date(record.downtime_start).getTime()) / 60000);
    }

    return this.update(id, {
      status: 'RESOLVED',
      downtime_end: now,
      downtime_minutes: duration,
      resolution_description: resolution,
      resolved_by: user?.id,
      resolved_at: now
    });
  },

  async close(id: string): Promise<DowntimeRecord> {
    return this.update(id, { status: 'CLOSED' });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('downtime_records').delete().eq('id', id);
    if (error) throw error;
  },

  async getSummary(filters?: { startDate?: string; endDate?: string }) {
    let query = supabase
      .from('downtime_records')
      .select('downtime_type, downtime_category, downtime_minutes, status');

    if (filters?.startDate) {
      query = query.gte('downtime_start', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('downtime_start', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      totalMinutes: data?.reduce((sum, r) => sum + (r.downtime_minutes || 0), 0) || 0,
      byType: data?.reduce((acc, r) => {
        acc[r.downtime_type] = (acc[r.downtime_type] || 0) + (r.downtime_minutes || 0);
        return acc;
      }, {} as Record<string, number>),
      byCategory: data?.reduce((acc, r) => {
        if (r.downtime_category) {
          acc[r.downtime_category] = (acc[r.downtime_category] || 0) + (r.downtime_minutes || 0);
        }
        return acc;
      }, {} as Record<string, number>)
    };
  }
};
