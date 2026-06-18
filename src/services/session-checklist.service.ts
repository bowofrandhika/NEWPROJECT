import supabase from '../lib/supabase';
import type { SessionChecklistItem } from '../types/database';

export const sessionChecklistItemService = {
  async getBySessionId(sessionId: string): Promise<SessionChecklistItem[]> {
    const { data, error } = await supabase
      .from('session_checklist_items')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(item: Omit<SessionChecklistItem, 'id' | 'created_at' | 'updated_at'>): Promise<SessionChecklistItem> {
    const { data, error } = await supabase
      .from('session_checklist_items')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(items: Omit<SessionChecklistItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<SessionChecklistItem[]> {
    const { data, error } = await supabase
      .from('session_checklist_items')
      .insert(items)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, item: Partial<SessionChecklistItem>): Promise<SessionChecklistItem> {
    const { data, error } = await supabase
      .from('session_checklist_items')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('session_checklist_items').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteBySessionId(sessionId: string): Promise<void> {
    const { error } = await supabase.from('session_checklist_items').delete().eq('production_session_id', sessionId);
    if (error) throw error;
  }
};
