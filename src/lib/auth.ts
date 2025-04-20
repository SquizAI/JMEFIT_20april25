import { supabase } from './supabase';
import toast from 'react-hot-toast';

export async function linkIdentity(provider: 'google') {
  try {
    const { data, error } = await supabase.auth.linkIdentity({ provider });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to link identity:', error);
    toast.error('Failed to link account');
    throw error;
  }
}

export async function unlinkIdentity(identity: any) {
  try {
    const { data, error } = await supabase.auth.unlinkIdentity(identity);
    if (error) throw error;
    toast.success('Account unlinked successfully');
    return data;
  } catch (error) {
    console.error('Failed to unlink identity:', error);
    toast.error('Failed to unlink account');
    throw error;
  }
}

export async function getUserIdentities() {
  try {
    const { data: { identities }, error } = await supabase.auth.getUserIdentities();
    if (error) throw error;
    return identities;
  } catch (error) {
    console.error('Failed to get user identities:', error);
    throw error;
  }
}