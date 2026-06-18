import supabase from '../lib/supabase';
import type { PalletTracking, PackingRecord } from '../types/database';

export const palletTrackingService = {
  async getBySessionId(sessionId: string): Promise<PalletTracking[]> {
    const { data, error } = await supabase
      .from('pallet_tracking')
      .select('*, products(product_name)')
      .eq('production_session_id', sessionId)
      .order('packing_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<PalletTracking | null> {
    const { data, error } = await supabase
      .from('pallet_tracking')
      .select('*, products(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(pallet: Omit<PalletTracking, 'id' | 'created_at' | 'updated_at'>): Promise<PalletTracking> {
    const { data: { user } } = await supabase.auth.getUser();

    const palletCode = await this.generatePalletCode(pallet.packing_date);

    const { data, error } = await supabase
      .from('pallet_tracking')
      .insert({
        ...pallet,
        pallet_code: palletCode,
        packed_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;

    await this.generateQRCode(data.id, data.pallet_code);

    return data;
  },

  async update(id: string, pallet: Partial<PalletTracking>): Promise<PalletTracking> {
    const { data, error } = await supabase
      .from('pallet_tracking')
      .update({ ...pallet, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async verify(id: string): Promise<PalletTracking> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
      status: 'STAGED'
    });
  },

  async ship(id: string, shipmentId: string): Promise<PalletTracking> {
    return this.update(id, {
      shipment_id: shipmentId,
      shipped_at: new Date().toISOString(),
      status: 'SHIPPED'
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pallet_tracking').delete().eq('id', id);
    if (error) throw error;
  },

  async generatePalletCode(packingDate: string): Promise<string> {
    const date = new Date(packingDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const { data, error } = await supabase
      .from('pallet_tracking')
      .select('pallet_code')
      .like('pallet_code', `PLT-${year}${month}${day}-%`)
      .order('pallet_code', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].pallet_code;
      const lastSeq = parseInt(lastNumber.split('-')[2] || '0');
      sequence = lastSeq + 1;
    }

    return `PLT-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
  },

  async generateQRCode(palletId: string, palletCode: string): Promise<void> {
    const qrData = JSON.stringify({
      pallet_id: palletId,
      pallet_code: palletCode,
      generated_at: new Date().toISOString()
    });

    const { error } = await supabase
      .from('pallet_qr_codes')
      .insert({
        pallet_tracking_id: palletId,
        qr_code: `QR-${palletCode}`,
        qr_data: qrData
      });

    if (error) throw error;
  },

  async getByQRCode(qrCode: string): Promise<PalletTracking | null> {
    const { data, error } = await supabase
      .from('pallet_qr_codes')
      .select('pallet_tracking_id, pallet_tracking(*)')
      .eq('qr_code', qrCode)
      .maybeSingle();

    if (error) throw error;
    return data?.pallet_tracking || null;
  },

  async scanQRCode(qrCode: string, location?: string): Promise<PalletTracking | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('pallet_qr_codes')
      .update({
        scanned_at: new Date().toISOString(),
        scanned_by: user?.id,
        scan_location: location
      })
      .eq('qr_code', qrCode)
      .select('pallet_tracking_id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.getById(data.pallet_tracking_id);
  }
};

export const packingRecordService = {
  async getByPalletId(palletId: string): Promise<PackingRecord[]> {
    const { data, error } = await supabase
      .from('packing_records')
      .select('*')
      .eq('pallet_tracking_id', palletId)
      .order('bag_number', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<PackingRecord, 'id' | 'created_at' | 'packed_at'>): Promise<PackingRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('packing_records')
      .insert({
        ...record,
        packed_by: user?.id,
        packed_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(records: Omit<PackingRecord, 'id' | 'created_at' | 'packed_at'>[]): Promise<PackingRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const recordsWithMeta = records.map(r => ({
      ...r,
      packed_by: user?.id,
      packed_at: now
    }));

    const { data, error } = await supabase
      .from('packing_records')
      .insert(recordsWithMeta)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, record: Partial<PackingRecord>): Promise<PackingRecord> {
    const { data, error } = await supabase
      .from('packing_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('packing_records').delete().eq('id', id);
    if (error) throw error;
  }
};
