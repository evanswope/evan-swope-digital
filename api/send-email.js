export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, flavor, imageBase64, playerDesc } = req.body;

  // 1. Basic validation
  if (!imageBase64 || imageBase64.length > 5000000) { 
    return res.status(400).json({ error: 'Image too large or missing' });
  }

  const senderName = playerDesc ? playerDesc.trim() : "Smiling Cashier";

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Grocery Game <onboarding@resend.dev>',
        to: 'evanlswope@gmail.com',
        subject: `${senderName} sent you an image: ${new Date().toLocaleDateString()}`,
        html: `
          <h2>New Grocery Anomaly</h2>
          <p><strong>Sender:</strong> ${senderName}</p>
          <p><strong>Prompt:</strong> ${prompt}</p>
          <p><strong>Context:</strong> ${flavor}</p>
        `,
        attachments: [
          {
            filename: 'checked-out-anomaly.jpg',
            content: imageBase64.split(',')[1] || imageBase64,
          }
        ]
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
