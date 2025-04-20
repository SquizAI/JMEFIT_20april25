import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../email';
import { useAuth } from '../../contexts/AuthContext';

// Type definitions
export interface GiftSubscription {
  id: string;
  product_id: string;
  purchaser_id: string;
  recipient_first_name: string;
  recipient_last_name: string;
  recipient_email: string;
  gift_message?: string;
  redemption_code: string;
  redeemed: boolean;
  redeemed_by?: string;
  redeemed_at?: Date;
  billing_interval: 'month' | 'year';
  price: number;
  created_at: Date;
  updated_at: Date;
}

interface CreateGiftSubscriptionParams {
  productId: string;
  purchaserId: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  giftMessage?: string;
  billingInterval: 'month' | 'year';
  price: number;
}

/**
 * Creates a new gift subscription and sends an email to the recipient
 */
export async function createGiftSubscription({
  productId,
  purchaserId,
  recipientFirstName,
  recipientLastName,
  recipientEmail,
  giftMessage,
  billingInterval,
  price
}: CreateGiftSubscriptionParams): Promise<{ success: boolean; error?: string; giftSubscription?: GiftSubscription }> {
  try {
    // Generate a unique redemption code
    const redemptionCode = generateRedemptionCode();
    
    // Insert the gift subscription into the database
    const { data, error } = await supabase
      .from('gift_subscriptions')
      .insert({
        product_id: productId,
        purchaser_id: purchaserId,
        recipient_first_name: recipientFirstName,
        recipient_last_name: recipientLastName,
        recipient_email: recipientEmail,
        gift_message: giftMessage,
        redemption_code: redemptionCode,
        redeemed: false,
        billing_interval: billingInterval,
        price: price
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating gift subscription:', error);
      return { success: false, error: error.message };
    }
    
    // Send email to the recipient
    await sendGiftEmail({
      recipientEmail,
      recipientFirstName,
      redemptionCode,
      giftMessage
    });
    
    return { success: true, giftSubscription: data as GiftSubscription };
  } catch (error) {
    console.error('Unexpected error creating gift subscription:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Redeems a gift subscription using a redemption code
 */
export async function redeemGiftSubscription(
  redemptionCode: string,
  userId: string
): Promise<{ success: boolean; error?: string; giftSubscription?: GiftSubscription }> {
  try {
    // Check if the redemption code is valid and not already redeemed
    const { data: existingGift, error: fetchError } = await supabase
      .from('gift_subscriptions')
      .select('*')
      .eq('redemption_code', redemptionCode)
      .eq('redeemed', false)
      .single();
    
    if (fetchError || !existingGift) {
      return { 
        success: false, 
        error: 'Invalid or already redeemed gift code' 
      };
    }
    
    // Update the gift subscription to mark it as redeemed
    const { data, error } = await supabase
      .from('gift_subscriptions')
      .update({
        redeemed: true,
        redeemed_by: userId,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', existingGift.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error redeeming gift subscription:', error);
      return { success: false, error: error.message };
    }
    
    // TODO: Add the subscription to the user's account
    // This would involve creating an entry in a user_subscriptions table
    // or updating the user's profile with subscription information
    
    return { success: true, giftSubscription: data as GiftSubscription };
  } catch (error) {
    console.error('Unexpected error redeeming gift subscription:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Gets all gift subscriptions purchased by a user
 */
export async function getPurchasedGiftSubscriptions(
  userId: string
): Promise<{ success: boolean; error?: string; giftSubscriptions?: GiftSubscription[] }> {
  try {
    const { data, error } = await supabase
      .from('gift_subscriptions')
      .select('*')
      .eq('purchaser_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching purchased gift subscriptions:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, giftSubscriptions: data as GiftSubscription[] };
  } catch (error) {
    console.error('Unexpected error fetching purchased gift subscriptions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Gets all gift subscriptions received by a user (by email)
 */
export async function getReceivedGiftSubscriptions(
  email: string
): Promise<{ success: boolean; error?: string; giftSubscriptions?: GiftSubscription[] }> {
  try {
    const { data, error } = await supabase
      .from('gift_subscriptions')
      .select('*')
      .eq('recipient_email', email)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching received gift subscriptions:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, giftSubscriptions: data as GiftSubscription[] };
  } catch (error) {
    console.error('Unexpected error fetching received gift subscriptions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Helper function to generate a unique redemption code
 */
function generateRedemptionCode(): string {
  // Generate a code in the format: XXXX-XXXX-XXXX (where X is alphanumeric)
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  const code = `${uuid.substring(0, 4)}-${uuid.substring(4, 8)}-${uuid.substring(8, 12)}`;
  return code;
}

/**
 * Helper function to send a gift email to the recipient
 */
async function sendGiftEmail({
  recipientEmail,
  recipientFirstName,
  redemptionCode,
  giftMessage
}: {
  recipientEmail: string;
  recipientFirstName: string;
  redemptionCode: string;
  giftMessage?: string;
}): Promise<void> {
  // This is a placeholder for email sending functionality
  // In a real implementation, this would use an email service like SendGrid, Mailgun, etc.
  console.log(`Sending gift email to ${recipientEmail} with redemption code ${redemptionCode}`);
  
  // Mock email sending for now
  // In a real implementation, you would call your email service here
  // Example: await sendEmail({ to: recipientEmail, subject: 'You received a gift subscription!', ... })
}
