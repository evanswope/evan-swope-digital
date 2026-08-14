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

CRITICAL: Even though the customers are highly abstract or silly, their requested base grocery item MUST BE COMPLETELY MUNDANE and standard (e.g. "a jar of mayonnaise", "kielbasas", "dish soap"). DO NOT add adjectives like sparkly, wet, or large to the base item.
ANY bizarre conditions, emotional twists, or strange requirements MUST be placed exclusively in the "emotional_need" section.

The requested grocery item should get more ridiculous and expensive as the player levels up.

Rules for flavor_text: Briefly describe the player (the clerk) performing tedious, thankless grocery store tasks (e.g., mopping up a spill, restocking shelves, taking their lunch break, replacing lightbulbs, trying to hide in the back) right before they are abruptly interrupted by this specific customer bursting into the store.

You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks, just the JSON string).
CRITICAL: Do NOT use double quotes inside your text fields. This breaks JSON parsing. Use single quotes instead if needed.
JSON Schema:
{
  "name": "A short, descriptive name and species/form of the customer (e.g. 'Wanda the Dog', 'Guillame the Pea', 'Jenny the Haunted Doll', 'Stan the Washbasin')",
  "desc": "A short, strictly physical description of what the customer looks like for an image generator (e.g. 'A plump chicken carrying a banjo')",
  "flavor_text": "A brief narrated description of the clerk's busywork being interrupted by the customer.",
  "dialogue": "A short, funny description of the abstract customer entering and what they say. MUST ONLY BE SPOKEN DIALOGUE.",
  "base_item": "A short phrase describing the exact base grocery item they want to buy (e.g., 'a jar of mayo')",
  "emotional_need": "A short phrase describing their bizarre emotional need or problem that requires a creative bonus solution (e.g., 'companionship', 'a nap', 'help chewing')"
}`;

  const randomNames = ["Balthazar", "Bruno", "Bernie", "Wanda", "Jenny", "Stan"];
  const randomCustomerThemes = ["an aquatic animal", "a piece of furniture", "a weather phenomenon", "a mathematical concept", "an insect", "a ghost", "a celestial body", "a medieval weapon", "a root vegetable"];
  const randomItemAisles = ["Produce", "Dairy", "Frozen Foods", "Canned Goods", "Cleaning Supplies", "Hardware", "Bakery", "Meat", "Snacks", "Beverages", "Office Supplies"];
  
  const chosenTheme = randomCustomerThemes[Math.floor(Math.random() * randomCustomerThemes.length)];
  const chosenAisle = randomItemAisles[Math.floor(Math.random() * randomItemAisles.length)];
  const seed = Math.floor(Math.random() * 999999);

  const userPrompt = `Current Game State:
Level: ${state.level}
Cash: $${state.cash}
Affection: ${state.affection}
Trust: ${state.trust}%

CRITICAL DIVERSITY REQUIREMENT (Seed: ${seed}): 
- DO NOT use the names: ${randomNames.join(', ')}. Pick a wildly different name.
- INSPIRATION: Try making the customer related to: ${chosenTheme}.
- INSPIRATION: Try picking a base grocery item from the aisle: ${chosenAisle}.
- DO NOT request duct tape, mayonnaise, or kielbasas. Be completely novel.

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
          max_tokens: 512,
          temperature: 1.15
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

    let parsed;
    try {
      // First attempt: try to extract a JSON block using regex in case there is leading/trailing text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(rawText);
      }
    } catch (parseError) {
      console.warn("JSON Parse Failed, attempting regex extraction. Raw text:", rawText);
      try {
        const extractString = (field) => {
          // Use a more robust regex that catches the last field even without a comma
          const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"(?:\\s*,\\s*"|\\s*\\}|$)`);
          const match = rawText.match(regex);
          return match ? match[1].replace(/"/g, "'").trim() : "";
        };
        parsed = {
          name: extractString("name") || "A Glitched Entity",
          desc: extractString("desc") || extractString("dialogue") || "A glowing orb of glitching light",
          flavor_text: extractString("flavor_text") || "You are wiping down the checkout counter when the doors violently burst open.",
          dialogue: extractString("dialogue") || "My reality is breaking apart. I require something simple.",
          base_item: extractString("base_item") || "a single egg",
          emotional_need: extractString("emotional_need") || "stability in a chaotic world"
        };
      } catch (regexError) {
        parsed = {
          name: "A Glitched Entity",
          desc: "A glowing orb of glitching light",
          flavor_text: "You are wiping down the checkout counter when the doors violently burst open.",
          dialogue: "My reality is completely broken. I require something simple.",
          base_item: "a single egg",
          emotional_need: "stability in a chaotic world"
        };
      }
    }
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating game master response: ' + err.message });
  }
}
