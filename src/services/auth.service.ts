import supabase from '../lib/supabase';
import type { AppUser, UserRole } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
  appUser: AppUser | null;
}

export interface SignUpData {
  username: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  plant_code?: string;
  department?: string;
  photo_url?: string;
}

export const authService = {
  async signUp(email: string, password: string, userData: SignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const { data: appUser, error: appError } = await supabase
      .from('app_users')
      .insert({
        user_id: authData.user.id,
        username: userData.username,
        full_name: userData.full_name,
        email: email,
        role: userData.role,
        phone: userData.phone,
        plant_code: userData.plant_code,
        department: userData.department,
        photo_url: userData.photo_url
      })
      .select()
      .single();

    if (appError) throw appError;

    return { user: authData.user, appUser };
  },

  async signIn(identifier: string, password: string) {
    const isEmail = identifier.includes('@');
    let email = identifier;

    if (!isEmail) {
      const { data: emailResult, error: lookupError } = await supabase
        .rpc('get_email_by_username', { p_username: identifier });

      if (lookupError) throw lookupError;
      if (!emailResult) throw new Error('Username not found');
      email = emailResult as string;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const { data: appUser } = await supabase
      .from('app_users')
      .select()
      .eq('user_id', data.user.id)
      .maybeSingle();

    // Log login audit
    if (data.user) {
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        table_name: 'auth',
        action: 'LOGIN',
        new_values: { email }
      });
    }

    return { session: data.session, user: data.user, appUser };
  },

  async signOut() {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'auth',
        action: 'LOGOUT'
      });
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: appUser } = await supabase
      .from('app_users')
      .select()
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || '',
      appUser
    };
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      (async () => {
        if (!session?.user) {
          callback(null);
          return;
        }

        const { data: appUser } = await supabase
          .from('app_users')
          .select()
          .eq('user_id', session.user.id)
          .maybeSingle();

        callback({
          id: session.user.id,
          email: session.user.email || '',
          appUser
        });
      })();
    });
  }
};
