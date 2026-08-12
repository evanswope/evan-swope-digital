export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { imageUrl, customerRequest, userPrompt } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const visionPrompt = `You are an evaluator in a silly Grocery Store game. 
A customer came in asking for: "${customerRequest}"
The player generated an item using the prompt: "${userPrompt}"
Look at the generated image provided. 
Does the image look like what the customer requested (or at least close enough in a silly way)?
Rate the "Value" (price) of the item based on how ridiculous, expensive, or gold-encrusted it looks (give an integer between 10 and 100000).

You MUST respond ONLY with a raw JSON object (no markdown, no backticks).
JSON Schema:
{
  "approved": true or false,
  "value": integer,
  "reaction": "A short, funny one-liner from the customer reacting to the item."
}`;

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait' // Wait for the generation to finish synchronously
      },
      body: JSON.stringify({ 
        version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
        input: {
          image: imageUrl,
          prompt: visionPrompt,
          max_tokens: 256
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ message: error.detail || 'Replicate Vision API error' });
    }

    const prediction = await response.json();
    
    // LLaVA output is an array of strings, we need to join them
    let rawText = prediction.output.join('');
    
    // Strip markdown formatting if the model accidentally included it
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error appraising image: ' + err.message });
  }
}
