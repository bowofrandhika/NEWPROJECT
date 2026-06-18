import supabase from '../lib/supabase';
import type { AppUser, UserRole } from '../types/database';

export const userService = {
  async getAll(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCurrentUserProfile(): Promise<AppUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userData: Omit<AppUser, 'id' | 'created_at' | 'updated_at'>): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, userData: Partial<AppUser>): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateProfile(userData: Partial<AppUser>): Promise<AppUser> {
    const { data: profile } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase
      .from('app_users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async hasRole(requiredRole: UserRole): Promise<boolean> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) return false;

    const roleHierarchy: Record<UserRole, number> = {
      'ADMIN': 5,
      'SPV': 4,
      'MANDOR': 3,
      'DRYER_OPERATOR': 2,
      'PACKING_OPERATOR': 2
    };

    return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
  }
};
