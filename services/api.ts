import { Participant } from '../types';
import { fixEncoding } from '../utils';
import { supabase } from './supabase';

export const api = {
  getParticipants: async (): Promise<Participant[]> => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase get error:', error);
      return [];
    }
    return data as Participant[];
  },

  addParticipant: async (participant: Omit<Participant, 'id'>): Promise<Participant> => {
    const newParticipant = {
      ...participant,
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
    };

    const { data, error } = await supabase
      .from('participants')
      .insert([newParticipant])
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  upsertParticipant: async (participant: Omit<Participant, 'id'>): Promise<Participant> => {
    const { data, error } = await supabase
      .from('participants')
      .upsert(participant, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  bulkUpsertParticipants: async (participants: Omit<Participant, 'id'>[]): Promise<void> => {
    const { error } = await supabase
      .from('participants')
      .upsert(participants, { onConflict: 'email' });

    if (error) throw error;
  },

  updateParticipant: async (id: string, updates: Partial<Participant>): Promise<Participant> => {
    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  deleteParticipant: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  resetData: async (): Promise<void> => {
    // Caution: This deletes everything
    const { error } = await supabase
      .from('participants')
      .delete()
      .neq('id', '0'); // Safe way to clear all if allowed by RLS

    if (error) throw error;
  },

  getSettings: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return {};
    const settings: Record<string, string> = {};
    data.forEach(s => settings[s.id] = s.value);
    return settings;
  }
};
