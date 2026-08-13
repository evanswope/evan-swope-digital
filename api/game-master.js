export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { state } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const systemPrompt = `You are the Game Master for a surreal, bizarre text-based Grocery Dating Sim RPG.
The player is a clerk at an otherworldly grocery store. 
Based on the player's current Level, Cash, and Affection, invent a highly unusual, abstract, or absurd "customer" and a strange twist on a normal GROCERY ITEM they want to buy. 

CUSTOMER RULES:
- If Level is 1 through 4: Generate a corporeal (physical/living) but extremely silly and bizarre customer. Examples: a clam with 4 legs, a clown experiencing religion for the first time, a talking dog with a law degree, a llama that really enjoys true crime, an aloof little girl with a fire poker.
- If Level is 5 (or higher): Generate a highly conceptual, abstract, or obscure customer. Examples: a shadow, a thought bubble, a wisp, a stolen page from a diary, a developing third-world nation.

CRITICAL: Even though the customers are highly abstract or silly, they still want to buy GROCERY STORE ITEMS (e.g. mayo, milk, cereal, bread, coffee). However, they have a bizarre problem or emotional need that requires a creative solution. 

The requested grocery item should get more ridiculous and expensive as the player levels up.

You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks, just the JSON string).
JSON Schema:
{
  "dialogue": "A short, funny description of the abstract customer entering and what they say.",
  "base_item": "A short phrase describing the exact base grocery item they want to buy (e.g., 'a jar of mayo')",
  "emotional_need": "A short phrase describing their bizarre emotional need or problem that requires a creative bonus solution (e.g., 'companionship', 'a nap', 'help chewing')"
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
