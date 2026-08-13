export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { imageUrl, customerRequest, emotionalNeed, userPrompt } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const visionPrompt = `You are the strict visual judge in a silly Grocery Store game. 
A highly unusual customer came in. 
Base Item Wanted: "${customerRequest}"
Their Emotional Need/Problem: "${emotionalNeed}"
The player generated an item using the prompt: "${userPrompt}"

CRITICAL INSTRUCTION: The customer CANNOT read the prompt! The customer can ONLY see the image. Judge the item strictly on what it visually looks like in the image. If the image failed to draw what the prompt asked for, you must judge and reject it based on what it actually looks like. Use the player's prompt ONLY as background context to understand their intent.

Look at the generated image provided. 
You must judge this on TWO criteria:
1. BASE ITEM: Does the image visually contain the base item requested? Be VERY LENIENT about packaging, form factors, and shapes (e.g. a "wedge" of cheese is fine for a "wheel", a "can" of salsa is fine for a "jar"). HOWEVER, the CORE TYPE OF FOOD OR OBJECT MUST BE CORRECT. A jar of carrots is NOT a jar of pickles. If they asked for pickles and got carrots, you MUST reject it (approved: false).
2. BONUS (Creative Problem Solving): Does the image ALSO contain elements that specifically and creatively address their emotional need? Be EXTREMELY STRICT. If the user's prompt or the image completely ignores the emotional need, or does something entirely unrelated (e.g. they asked for a dance party, but the user gave crying children), the bonus MUST be false.

Scoring Affection:
- If Base Item is NOT present: Affection is 0. (Even if they solved the emotional need, they failed the base task).
- If Base Item IS present but Bonus is FALSE: Affection is 1. The customer's reaction should acknowledge they got the item they wanted, but express confusion, disappointment, or horror at the weird/unrelated twist the player added.
- If Base Item IS present AND Bonus is achieved: Affection should be between 2 and 5 depending on how clever it is.
- TRUE LOVE: In very rare, incredibly clever circumstances, you can award 10 Affection.

Rate the "Value" (price) of the item based on how ridiculous, expensive, or gold-encrusted it looks (give an integer between 10 and 100000).

You MUST respond ONLY with a raw JSON object (no markdown, no backticks).
JSON Schema:
{
  "approved": true or false, // True if base item is present
  "bonus": true or false,    // True if emotional need is creatively addressed
  "affection": integer,      // 0, 1, 2-5, or 10
  "value": integer,
  "reaction": "A short, funny one-liner from the customer reacting to what they ACTUALLY SEE in the image."
}`;

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
    res.status(200).json({ id: prediction.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error appraising image: ' + err.message });
  }
}
