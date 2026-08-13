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

CRITICAL INSTRUCTION: The customer CANNOT read the prompt! The customer can ONLY see the image. Judge the item strictly on what it visually looks like in the image. If the image failed to draw what the prompt asked for, you must judge and reject it based on what it actually looks like. Use the player's prompt ONLY as background context to understand their intent. When writing the "reaction", you are roleplaying as the customer speaking directly to the grocer. Address them as "you", "the grocer", or "the clerk". DO NOT break the fourth wall or refer to them as "the player" or "the user".

Look at the generated image provided. 
You must judge this on TWO criteria:
1. BASE ITEM (CRITICAL): Does the image visually contain the base item requested? You must be EXTREMELY STRICT about the CORE TYPE of object. If the customer asked for aluminum foil, and the image shows a tree, a dog, or a car, you MUST reject it (approved: false). However, if the core material/food IS present but mutated, alive, or absurd (e.g., they asked for a "jar of pickles" and you see a "living pet pickle"), you MUST ACCEPT IT (approved: true) because the core item (pickle) is technically there. Be lenient about packaging (a wedge of cheese counts as a wheel of cheese).
2. BONUS (Creative Problem Solving): Does the image ALSO contain elements that specifically and creatively address their emotional need? If the user's prompt or the image completely ignores the emotional need, the bonus MUST be false.

Scoring Affection:
- If Base Item is NOT present: Affection is 0. (Even if they solved the emotional need, they failed the base task). The customer refuses to buy the item.
- If Base Item IS present but Bonus is FALSE: Affection is 1. CRITICAL: The customer's reaction MUST explicitly state that they are buying/taking the item (e.g. "I guess I'll take it, but..."), while expressing confusion or disappointment at the weird twist. They CANNOT refuse to buy it if the base item is present.
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
  "reaction": "A short, funny one-liner from the customer reacting to what they ACTUALLY SEE in the image. CRITICAL: If 'approved' is true, they MUST buy/accept the item in the dialogue (even if they hate it or are confused). They cannot refuse or walk away if approved is true."
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
