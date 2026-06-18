import supabase from '../lib/supabase';
import type {
  ProductionLog,
  MaterialIdentification,
  ProcessFlowControl,
  OutputSummary,
  FuelConsumption
} from '../types/database';

export const productionLogService = {
  async getBySessionId(sessionId: string): Promise<ProductionLog[]> {
    const { data, error } = await supabase
      .from('production_logs')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('log_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(log: Omit<ProductionLog, 'id' | 'created_at'>): Promise<ProductionLog> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('production_logs')
      .insert({ ...log, operator_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, log: Partial<ProductionLog>): Promise<ProductionLog> {
    const { data, error } = await supabase
      .from('production_logs')
      .update(log)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('production_logs').delete().eq('id', id);
    if (error) throw error;
  }
};

export const materialIdentificationService = {
  async getBySessionId(sessionId: string): Promise<MaterialIdentification[]> {
    const { data, error } = await supabase
      .from('material_identification')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(material: Omit<MaterialIdentification, 'id' | 'created_at' | 'updated_at'>): Promise<MaterialIdentification> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('material_identification')
      .insert({
        ...material,
        identified_by: user?.id,
        identified_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, material: Partial<MaterialIdentification>): Promise<MaterialIdentification> {
    const { data, error } = await supabase
      .from('material_identification')
      .update({ ...material, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('material_identification').delete().eq('id', id);
    if (error) throw error;
  }
};

export const processFlowControlService = {
  async getBySessionId(sessionId: string): Promise<ProcessFlowControl[]> {
    const { data, error } = await supabase
      .from('process_flow_control')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('step_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(process: Omit<ProcessFlowControl, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessFlowControl> {
    const { data, error } = await supabase
      .from('process_flow_control')
      .insert(process)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, process: Partial<ProcessFlowControl>): Promise<ProcessFlowControl> {
    const { data, error } = await supabase
      .from('process_flow_control')
      .update({ ...process, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async startStep(id: string): Promise<ProcessFlowControl> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'IN_PROGRESS',
      start_time: new Date().toISOString(),
      operator_id: user?.id
    });
  },

  async completeStep(id: string): Promise<ProcessFlowControl> {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const { data: step } = await supabase
      .from('process_flow_control')
      .select('start_time')
      .eq('id', id)
      .single();

    let durationMinutes = 0;
    if (step?.start_time) {
      durationMinutes = Math.round((new Date(now).getTime() - new Date(step.start_time).getTime()) / 60000);
    }

    return this.update(id, {
      status: 'COMPLETED',
      end_time: now,
      duration_minutes: durationMinutes,
      operator_id: user?.id
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('process_flow_control').delete().eq('id', id);
    if (error) throw error;
  }
};

export const outputSummaryService = {
  async getBySessionId(sessionId: string): Promise<OutputSummary | null> {
    const { data, error } = await supabase
      .from('output_summary')
      .select('*')
      .eq('production_session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(summary: Omit<OutputSummary, 'id' | 'created_at' | 'updated_at'>): Promise<OutputSummary> {
    const { data: { user } } = await supabase.auth.getUser();

    const totalOutput = summary.total_output || 0;
    const totalGood = summary.total_good || 0;
    const totalInput = summary.total_input || 0;

    const efficiency = totalInput > 0 ? Math.round((totalOutput / totalInput) * 100 * 100) / 100 : 0;
    const yieldPercentage = totalOutput > 0 ? Math.round((totalGood / totalOutput) * 100 * 100) / 100 : 0;

    const { data, error } = await supabase
      .from('output_summary')
      .insert({
        ...summary,
        efficiency,
        yield_percentage: yieldPercentage,
        recorded_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, summary: Partial<OutputSummary>): Promise<OutputSummary> {
    const { data, error } = await supabase
      .from('output_summary')
      .update({ ...summary, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async approve(id: string): Promise<OutputSummary> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'APPROVED',
      approved_by: user?.id
    });
  }
};

export const fuelConsumptionService = {
  async getBySessionId(sessionId: string): Promise<FuelConsumption[]> {
    const { data, error } = await supabase
      .from('fuel_consumption')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('consumption_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(consumption: Omit<FuelConsumption, 'id' | 'created_at'>): Promise<FuelConsumption> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('fuel_consumption')
      .insert({ ...consumption, recorded_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, consumption: Partial<FuelConsumption>): Promise<FuelConsumption> {
    const { data, error } = await supabase
      .from('fuel_consumption')
      .update(consumption)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('fuel_consumption').delete().eq('id', id);
    if (error) throw error;
  }
};
