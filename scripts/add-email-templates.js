import { supabase } from '../src/lib/supabase.ts';

const emailTemplates = [
  {
    name: 'Welcome to JMEFIT',
    subject: 'Welcome to Your Fitness Journey!',
    html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to JMEFIT!</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Welcome to JMEFIT!</h1><p>We\'re excited to have you join our fitness community. Get ready to transform your life with personalized training and nutrition guidance.</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">Get Started</a></div></div></body></html>',
    json_content: {
      blocks: [
        { id: '1', type: 'header', content: { text: 'Welcome to JMEFIT!' }, styles: {} },
        { id: '2', type: 'text', content: { text: 'We\'re excited to have you join our fitness community. Get ready to transform your life with personalized training and nutrition guidance.' }, styles: {} },
        { id: '3', type: 'button', content: { text: 'Get Started', url: 'https://jmefit.com' }, styles: {} },
        { id: '4', type: 'divider', content: {}, styles: {} },
        { id: '5', type: 'social', content: {}, styles: {} }
      ]
    },
    category: 'transactional',
    is_template: true
  },
  {
    name: 'Special Offer',
    subject: 'Exclusive Discount Inside!',
    html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Special Offer from JMEFIT</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Special Offer Just for You!</h1><p>As a valued member of our community, we\'re offering you an exclusive discount on your next program.</p><div style="margin: 30px 0; text-align: center;"><div style="background: linear-gradient(135deg, #f3e7ff 0%, #ffe0f7 100%); border: 2px dashed #9333ea; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto;"><div style="color: #7c3aed; font-size: 14px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Exclusive Offer</div><div style="color: #6b21a8; font-size: 36px; font-weight: bold; margin-bottom: 10px; font-family: monospace; letter-spacing: 2px;">SAVE20</div><div style="color: #374151; font-size: 16px; margin-bottom: 5px;">Save 20% on any program</div><div style="color: #6b7280; font-size: 14px; margin-top: 10px;">Valid until Dec 31, 2024</div></div></div></div></body></html>',
    json_content: {
      blocks: [
        { id: '1', type: 'header', content: { text: 'Special Offer Just for You!' }, styles: {} },
        { id: '2', type: 'text', content: { text: 'As a valued member of our community, we\'re offering you an exclusive discount on your next program.' }, styles: {} },
        { id: '3', type: 'discount', content: { code: 'SAVE20', description: 'Save 20% on any program', expiry: 'Valid until Dec 31, 2024' }, styles: {} },
        { id: '4', type: 'button', content: { text: 'Shop Now', url: 'https://jmefit.com/pricing' }, styles: {} },
        { id: '5', type: 'text', content: { text: 'Use the code at checkout to apply your discount. Don\'t miss out!' }, styles: {} }
      ]
    },
    category: 'marketing',
    is_template: true
  },
  {
    name: 'Monthly Update',
    subject: 'JMEFIT Monthly Newsletter',
    html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JMEFIT Monthly Update</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">JMEFIT Monthly Update</h1><div style="text-align: center; margin: 20px 0;"><img src="https://jmefit.com/images/JMEFIT_hero_mirrored.png" alt="Newsletter Header" style="max-width: 100%;"></div><p>Check out what\'s new this month at JMEFIT...</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com/blog" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">Read More</a></div></div></body></html>',
    json_content: {
      blocks: [
        { id: '1', type: 'header', content: { text: 'JMEFIT Monthly Update' }, styles: {} },
        { id: '2', type: 'image', content: { url: 'https://jmefit.com/images/JMEFIT_hero_mirrored.png', alt: 'Newsletter Header' }, styles: {} },
        { id: '3', type: 'text', content: { text: 'Check out what\'s new this month at JMEFIT...' }, styles: {} },
        { id: '4', type: 'button', content: { text: 'Read More', url: 'https://jmefit.com/blog' }, styles: {} }
      ]
    },
    category: 'newsletter',
    is_template: true
  },
  {
    name: 'Class Reminder',
    subject: 'Your Class is Tomorrow!',
    html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Class Reminder</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Your Class is Tomorrow!</h1><p>Don\'t forget about your upcoming class tomorrow at 9:00 AM.</p><div style="text-align: center; margin: 20px 0;"><a href="https://jmefit.com/schedule" style="display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px;">View Schedule</a></div></div></body></html>',
    json_content: {
      blocks: [
        { id: '1', type: 'header', content: { text: 'Your Class is Tomorrow!' }, styles: {} },
        { id: '2', type: 'text', content: { text: 'Don\'t forget about your upcoming class tomorrow at 9:00 AM.' }, styles: {} },
        { id: '3', type: 'button', content: { text: 'View Schedule', url: 'https://jmefit.com/schedule' }, styles: {} }
      ]
    },
    category: 'notification',
    is_template: true
  },
  {
    name: 'Thank You',
    subject: 'Thank You for Your Purchase!',
    html_content: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Thank You</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="text-align: center; color: #6B46C1;">Thank You for Your Purchase!</h1><p>We appreciate your trust in JMEFIT. Your journey to a healthier, stronger you starts now!</p><p>Our team is here to support you every step of the way. If you have any questions, don\'t hesitate to reach out.</p><hr style="border: 1px solid #e0e0e0; margin: 20px 0;"><div style="text-align: center; padding: 20px;"><a href="#" style="margin: 0 10px;">📘 Facebook</a><a href="#" style="margin: 0 10px;">🐦 Twitter</a><a href="#" style="margin: 0 10px;">📷 Instagram</a></div></div></body></html>',
    json_content: {
      blocks: [
        { id: '1', type: 'header', content: { text: 'Thank You for Your Purchase!' }, styles: {} },
        { id: '2', type: 'text', content: { text: 'We appreciate your trust in JMEFIT. Your journey to a healthier, stronger you starts now!' }, styles: {} },
        { id: '3', type: 'text', content: { text: 'Our team is here to support you every step of the way. If you have any questions, don\'t hesitate to reach out.' }, styles: {} },
        { id: '4', type: 'divider', content: {}, styles: {} },
        { id: '5', type: 'social', content: {}, styles: {} }
      ]
    },
    category: 'transactional',
    is_template: true
  }
];

async function addEmailTemplates() {
  console.log('Adding default email templates...');
  
  for (const template of emailTemplates) {
    try {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('name', template.name)
        .single();
      
      if (existing) {
        console.log(`✓ Template "${template.name}" already exists, skipping...`);
        continue;
      }
      
      // Insert new template
      const { error } = await supabase
        .from('email_templates')
        .insert([template]);
      
      if (error) {
        console.error(`✗ Error adding template "${template.name}":`, error.message);
      } else {
        console.log(`✓ Added template: ${template.name}`);
      }
    } catch (err) {
      console.error(`✗ Error processing template "${template.name}":`, err.message);
    }
  }
  
  console.log('\nEmail template setup complete!');
  process.exit(0);
}

addEmailTemplates(); 