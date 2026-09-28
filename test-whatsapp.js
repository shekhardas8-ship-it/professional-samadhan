// test-whatsapp.js
import 'dotenv/config';

async function testWhatsApp() {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  const targetPhone = '919560958255'; // Shekhar Das

  console.log('--- Testing Meta WhatsApp Cloud API ---');
  console.log('Phone Number ID:', phoneId);
  console.log('Target Phone:', targetPhone);
  console.log('Token Present:', !!token);

  if (!token || !phoneId) {
    console.error('Error: META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID missing in .env');
    return;
  }

  // 1. Test sending hello_world template
  console.log('\nSending test template message (hello_world)...');
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: targetPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      }),
    });

    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log('\n🎉 SUCCESS: Message delivered via Meta WhatsApp Cloud API!');
      console.log('WhatsApp Message ID:', data.messages?.[0]?.id);
    } else {
      console.log('\n❌ Meta API returned error:');
      if (data.error?.code === 131030) {
        console.log('Reason: Recipient number is not in the allowed list.');
        console.log('Fix: In Meta Developer Portal -> WhatsApp -> API Setup -> "To" dropdown -> Click "Manage phone number list" -> Add +919560958255 and enter the OTP.');
      }
    }
  } catch (err) {
    console.error('Network Error:', err);
  }
}

testWhatsApp();
