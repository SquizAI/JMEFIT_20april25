import { supabase } from './supabase';

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Sends an email using Supabase's email service
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent
}: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // In a production environment, this would use a real email service
    // For now, we'll just log the email and simulate success
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL] HTML Content: ${htmlContent}`);
    if (textContent) {
      console.log(`[EMAIL] Text Content: ${textContent}`);
    }
    
    // In a real implementation, you would call an email API here
    // Example with Supabase Edge Functions:
    // const { error } = await supabase.functions.invoke('send-email', {
    //   body: { to, subject, htmlContent, textContent }
    // });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Sends a gift subscription notification email
 */
export async function sendGiftSubscriptionEmail({
  recipientEmail,
  recipientFirstName,
  senderName,
  programName,
  redemptionCode,
  giftMessage
}: {
  recipientEmail: string;
  recipientFirstName: string;
  senderName: string;
  programName: string;
  redemptionCode: string;
  giftMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `${senderName} has sent you a gift subscription to JME Fit!`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6b46c1; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">You've Received a Gift!</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
        <p>Hello ${recipientFirstName},</p>
        <p><strong>${senderName}</strong> has gifted you a subscription to <strong>${programName}</strong> on JME Fit!</p>
        ${giftMessage ? `<p>Their message: <em>"${giftMessage}"</em></p>` : ''}
        <p>To redeem your gift, use this code:</p>
        <div style="background-color: #f7fafc; border: 1px dashed #cbd5e0; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-family: monospace; font-size: 18px; font-weight: bold;">${redemptionCode}</span>
        </div>
        <p>Visit <a href="https://jmefit.com/redeem" style="color: #6b46c1;">jmefit.com/redeem</a> to activate your subscription.</p>
        <p>Your gift subscription will be available for redemption for 90 days.</p>
        <p>Enjoy your fitness journey!</p>
        <p>The JME Fit Team</p>
      </div>
      <div style="background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
        <p>© ${new Date().getFullYear()} JME Fit. All rights reserved.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Hello ${recipientFirstName},

    ${senderName} has gifted you a subscription to ${programName} on JME Fit!
    ${giftMessage ? `Their message: "${giftMessage}"` : ''}

    To redeem your gift, use this code: ${redemptionCode}

    Visit jmefit.com/redeem to activate your subscription.
    Your gift subscription will be available for redemption for 90 days.

    Enjoy your fitness journey!
    The JME Fit Team
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    htmlContent,
    textContent
  });
}