import { supabase } from '../lib/supabase';

export async function getParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*, arcade_completed')
    .order('badge_count', { ascending: false });
  
  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  return data;
}