import supabase from '../lib/supabase';
import type { PreProductionChecklist, ChecklistItem, ToolsInspection, ManpowerRecord } from '../types/database';

export const preProductionChecklistService = {
  async getBySessionId(sessionId: string): Promise<PreProductionChecklist | null> {
    const { data, error } = await supabase
      .from('pre_production_checklist')
      .select('*')
      .eq('production_session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(checklist: Omit<PreProductionChecklist, 'id' | 'created_at' | 'updated_at'>): Promise<PreProductionChecklist> {
    const { data, error } = await supabase
      .from('pre_production_checklist')
      .insert(checklist)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, checklist: Partial<PreProductionChecklist>): Promise<PreProductionChecklist> {
    const { data, error } = await supabase
      .from('pre_production_checklist')
      .update({ ...checklist, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async approve(id: string): Promise<PreProductionChecklist> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'APPROVED',
      approved_by: user?.id
    });
  }
};

export const checklistItemService = {
  async getByChecklistId(checklistId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('pre_production_checklist_id', checklistId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(item: Omit<ChecklistItem, 'id' | 'created_at'>): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(items: Omit<ChecklistItem, 'id' | 'created_at'>[]): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert(items)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, item: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from('checklist_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkItem(id: string, isChecked: boolean): Promise<ChecklistItem> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      is_checked: isChecked,
      checked_by: user?.id,
      checked_at: isChecked ? new Date().toISOString() : undefined
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw error;
  }
};

export const toolsInspectionService = {
  async getBySessionId(sessionId: string): Promise<ToolsInspection[]> {
    const { data, error } = await supabase
      .from('tools_inspection')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(inspection: Omit<ToolsInspection, 'id' | 'created_at'>): Promise<ToolsInspection> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tools_inspection')
      .insert({
        ...inspection,
        inspected_by: user?.id,
        inspected_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, inspection: Partial<ToolsInspection>): Promise<ToolsInspection> {
    const { data, error } = await supabase
      .from('tools_inspection')
      .update(inspection)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tools_inspection').delete().eq('id', id);
    if (error) throw error;
  }
};

export const manpowerRecordService = {
  async getBySessionId(sessionId: string): Promise<ManpowerRecord[]> {
    const { data, error } = await supabase
      .from('manpower_records')
      .select('*')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<ManpowerRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ManpowerRecord> {
    const { data, error } = await supabase
      .from('manpower_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<ManpowerRecord>): Promise<ManpowerRecord> {
    const { data, error } = await supabase
      .from('manpower_records')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('manpower_records').delete().eq('id', id);
    if (error) throw error;
  }
};
