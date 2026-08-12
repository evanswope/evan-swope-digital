export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { state } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const systemPrompt = `You are the Game Master for a silly text-based Grocery Dating Sim RPG.
The player is a clerk at a bizarre grocery store. 
Based on the player's current Level, Cash, and Affection, invent a silly customer and a ridiculous grocery item they want to buy. 
As the player levels up, the customers and items should get much weirder and more expensive.

You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks, just the JSON string).
JSON Schema:
{
  "dialogue": "A short, funny description of the customer entering and what they say.",
  "customer_request": "A short phrase describing the exact ridiculous item they want to buy."
}`;

  const userPrompt = `Current Game State:
Level: ${state.level}
Cash: $${state.cash}
Affection: ${state.affection}
Trust: ${state.trust}%

Generate the next customer encounter. RETURN ONLY RAW JSON.`;

  try {
    const response = await fetch(`https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait' // Wait for the generation to finish synchronously
      },
      body: JSON.stringify({ 
        input: {
          system_prompt: systemPrompt,
          prompt: userPrompt,
          max_tokens: 256,
          temperature: 0.8
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ message: error.detail || 'Replicate API error' });
    }

    const prediction = await response.json();
    
    // Llama 3 output is an array of strings, we need to join them
    let rawText = prediction.output.join('');
    
    // Strip markdown formatting if the model accidentally included it
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating game master response: ' + err.message });
  }
}
