import supabase from '../lib/supabase';
import type { Buyer, Product, Line, Shift, Dryer, Trolley } from '../types/database';

export const buyerService = {
  async getAll(): Promise<Buyer[]> {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Buyer | null> {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<Buyer> {
    const { data, error } = await supabase
      .from('buyers')
      .insert(buyer)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, buyer: Partial<Buyer>): Promise<Buyer> {
    const { data, error } = await supabase
      .from('buyers')
      .update({ ...buyer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('buyers').delete().eq('id', id);
    if (error) throw error;
  }
};

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, buyers(buyer_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ ...product, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }
};

export const lineService = {
  async getAll(): Promise<Line[]> {
    const { data, error } = await supabase
      .from('lines')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Line | null> {
    const { data, error } = await supabase
      .from('lines')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(line: Omit<Line, 'id' | 'created_at' | 'updated_at'>): Promise<Line> {
    const { data, error } = await supabase
      .from('lines')
      .insert(line)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, line: Partial<Line>): Promise<Line> {
    const { data, error } = await supabase
      .from('lines')
      .update({ ...line, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('lines').delete().eq('id', id);
    if (error) throw error;
  }
};

export const shiftService = {
  async getAll(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Shift | null> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(shift: Omit<Shift, 'id' | 'created_at'>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shift)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, shift: Partial<Shift>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .update(shift)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) throw error;
  }
};

export const dryerService = {
  async getAll(): Promise<Dryer[]> {
    const { data, error } = await supabase
      .from('dryers')
      .select('*, lines(line_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Dryer | null> {
    const { data, error } = await supabase
      .from('dryers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(dryer: Omit<Dryer, 'id' | 'created_at' | 'updated_at'>): Promise<Dryer> {
    const { data, error } = await supabase
      .from('dryers')
      .insert(dryer)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, dryer: Partial<Dryer>): Promise<Dryer> {
    const { data, error } = await supabase
      .from('dryers')
      .update({ ...dryer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('dryers').delete().eq('id', id);
    if (error) throw error;
  }
};

export const trolleyService = {
  async getAll(): Promise<Trolley[]> {
    const { data, error } = await supabase
      .from('trolleys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Trolley | null> {
    const { data, error } = await supabase
      .from('trolleys')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(trolley: Omit<Trolley, 'id' | 'created_at'>): Promise<Trolley> {
    const { data, error } = await supabase
      .from('trolleys')
      .insert(trolley)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, trolley: Partial<Trolley>): Promise<Trolley> {
    const { data, error } = await supabase
      .from('trolleys')
      .update(trolley)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('trolleys').delete().eq('id', id);
    if (error) throw error;
  }
};
