import supabase from '../lib/supabase';
import type { WONotification } from '../types/database';

export const woNotificationService = {
  async getAll(): Promise<WONotification[]> {
    const { data, error } = await supabase
      .from('wo_completion_notifications')
      .select('*, work_orders(wo_number, status, quantity_kg, completed_kg)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUnread(): Promise<WONotification[]> {
    const { data, error } = await supabase
      .from('wo_completion_notifications')
      .select('*, work_orders(wo_number, status, quantity_kg, completed_kg)')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByWorkOrderId(workOrderId: string): Promise<WONotification[]> {
    const { data, error } = await supabase
      .from('wo_completion_notifications')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(notification: Omit<WONotification, 'id' | 'created_at'>): Promise<WONotification> {
    const { data, error } = await supabase
      .from('wo_completion_notifications')
      .insert(notification)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('wo_completion_notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('wo_completion_notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    if (error) throw error;
  }
};
