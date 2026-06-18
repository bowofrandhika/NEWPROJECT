import supabase from '../lib/supabase';
import type { ProductionLogDetails } from '../types/database';

export const productionLogDetailsService = {
  async getBySessionId(sessionId: string): Promise<ProductionLogDetails | null> {
    const { data, error } = await supabase
      .from('production_log_details')
      .select('*, app_users(full_name)')
      .eq('production_session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(details: Omit<ProductionLogDetails, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionLogDetails> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('production_log_details')
      .insert({ ...details, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, details: Partial<ProductionLogDetails>): Promise<ProductionLogDetails> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('production_log_details')
      .update({ ...details, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async upsertBySessionId(sessionId: string, details: Partial<ProductionLogDetails>): Promise<ProductionLogDetails> {
    const existing = await this.getBySessionId(sessionId);
    if (existing) {
      return this.update(existing.id, details);
    }
    return this.create({
      production_session_id: sessionId,
      bale_count: 0,
      pallet_count: 0,
      total_weight_kg: 0,
      ...details
    } as Omit<ProductionLogDetails, 'id' | 'created_at' | 'updated_at'>);
  }
};
