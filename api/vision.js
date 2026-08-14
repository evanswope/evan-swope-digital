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

CRITICAL INSTRUCTION: The customer CANNOT read the prompt! The customer can ONLY see the physical image. You are provided the prompt ONLY as background context to help you understand messy AI art. DO NOT quote the prompt in your dialogue. DO NOT reject an item just because the prompt sounds weird or dangerous. If the physical base item is visible in the image, you MUST approve it. When writing the "reaction", you are roleplaying as the customer speaking directly to the grocer based ONLY on what they see. Address them as "you", "the grocer", or "the clerk". DO NOT break the fourth wall.

Look at the generated image provided. 
You must judge this on TWO criteria: 1. BASE ITEM (CRITICAL): Does the image visually contain the exact "Base Item Wanted" requested by the customer? You must be strict about the CORE TYPE of object. If they asked for eggs and the image is clearly a car or a dog, reject it. However, AI art can be messy or blurry. If the object in the image is ambiguous but reasonably resembles the requested item's shape/color, or if it's the correct item but in a bizarre context, you MUST ACCEPT IT (approved: true). CRITICAL EXCEPTION: Do NOT accept completely unrelated objects (like text signs, humans, or abstract shapes) just because they share a basic geometric outline with the requested item (e.g. do not accept a round text sign as a wheel of cheese).
2. BONUS (Creative Problem Solving): Does the image ALSO contain elements that specifically and creatively address their emotional need? If the user's prompt or the image completely ignores the emotional need, the bonus MUST be false.

Scoring Affection:
- If Base Item is NOT present: Affection is 0, and 'approved' MUST BE false. CRITICAL: The customer's reaction MUST explicitly state that they are REFUSING to buy or take the item (e.g. "I'm not paying for this", "I absolutely will not take this"). They MUST NOT say they will take it if approved is false.
- If Base Item IS present but Bonus is FALSE: Affection is 1, and 'approved' MUST BE true. CRITICAL: The customer's reaction MUST explicitly state that they are buying/taking the item (e.g. "I guess I'll take it, but..."), while expressing confusion or disappointment at the weird twist. They CANNOT refuse to buy it or claim they are stealing it if the base item is present.
- If Base Item IS present AND Bonus is achieved: Affection should be between 2 and 5 depending on how clever it is. They must happily buy the item.
- TRUE LOVE: In very rare, incredibly clever circumstances, you can award 10 Affection.

Rate the "Value" (price) of the item based on how ridiculous, expensive, or gold-encrusted it looks (give an integer between 10 and 100000).

Rules for flavor_text: Briefly describe the clerk physically providing the item to the customer based on the "approved" status. If approved is true, describe the clerk confidently pulling it off the shelf or presenting it. If approved is false, describe the clerk failing horribly to find anything close to what they wanted.

You MUST respond ONLY with a raw JSON object (no markdown, no backticks).
JSON Schema:
{
  "approved": true or false, // True if base item is present
  "bonus": true or false,    // True if emotional need is creatively addressed
  "affection": integer,      // 0, 1, 2-5, or 10
  "value": integer,
  "flavor_text": "A brief narrated description of the clerk providing the item.",
  "reaction": "A short, funny one-liner from the customer reacting to what they ACTUALLY SEE in the image. CRITICAL: If 'approved' is true, they MUST buy/accept the item in the dialogue. If 'approved' is false, they MUST violently refuse to take the item and leave it on the counter."
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
