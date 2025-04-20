import { supabase } from '../supabase';
import type { Database } from '../database.types';
import { getServerStripe } from '../stripe';
import { getPriceById } from './prices';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Price = Database['public']['Tables']['prices']['Row'];

/**
 * Create a new order with the given items (price IDs and quantities)
 */
export async function createOrder(items: { priceId: string; quantity: number }[], baseUrl: string) {
  try {
    // Get all the prices for the items
    const promises = items.map(item => getPriceById(item.priceId));
    const prices = await Promise.all(promises);

    if (!prices.length) throw new Error('Prices not found');

    // Calculate the total price
    const total = items.reduce((sum, item, index) => {
      const price = prices[index];
      return sum + (price?.price || 0) * item.quantity;
    }, 0);

    // Get the current user ID
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) throw new Error('User not authenticated');

    // Create the order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total
      } as any) // Using 'as any' to bypass type error temporarily
      .select()
      .single();

    if (orderError || !order) throw orderError || new Error('Failed to create order');

    // Create the order items
    const orderItems = items.map((item, index) => {
      const price = prices[index];
      if (!price) throw new Error(`Price not found for price ID: ${item.priceId}`);
      
      return {
        order_id: order.id,
        product_id: price.product_id,
        price_id: item.priceId,
        stripe_price_id: price.stripe_price_id,
        quantity: item.quantity,
        price: price.price,
        currency: price.currency
      } as any; // Using 'as any' to bypass type error temporarily
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as any[]); // Using 'as any[]' to bypass type error temporarily

    if (itemsError) throw itemsError;

    // Create a Stripe checkout session
    const stripe = getServerStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((item, index) => {
        const price = prices[index];
        if (!price || !price.stripe_price_id) {
          throw new Error(`Missing stripe_price_id for price ID: ${item.priceId}`);
        }
        return {
          price: price.stripe_price_id,
          quantity: item.quantity
        };
      }),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        order_id: order.id
      }
    });

    // Update the order with the Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id } as any) // Using 'as any' to bypass type error temporarily
      .eq('id', order.id);

    return { order, sessionId: session.id };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get all orders for the current user with their items and products
 */
export async function getOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*),
          prices (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

/**
 * Get a specific order by ID with its items and products
 */
export async function getOrder(id: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*),
          prices (*)
        )
      `)
      .eq('id', id as any) // Using 'as any' to bypass type error temporarily
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

/**
 * Update an order's status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status } as any) // Using 'as any' to bypass type error temporarily
      .eq('id', orderId as any) // Using 'as any' to bypass type error temporarily
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}