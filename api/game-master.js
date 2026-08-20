export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { state, step, customer_first_line, player_response, roll_item, roll_need, trust_val } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });
  }

  try {
    if (step === 'response' || step === 'chat') {
      const systemPrompt = `You are the Game Master for a surreal text-based Grocery Dating Sim RPG.
The player is a clerk at an otherworldly grocery store interacting with a customer.
Customer: ${state.currentCustomerName} (${state.currentCustomerDesc}).
Secret item they want: ${state.currentCustomerRequest}
Secret emotional need: ${state.currentCustomerNeed}

Probability Mechanics for revealing secrets:
- Base Trust Level: ${trust_val} (ranges 0 to 100)
- Did the player directly ask what item they want to buy? If YES, Item Threshold = ${Math.max(5, trust_val)}. If NO, Item Threshold = ${Math.max(5, trust_val * 0.2)}.
- Did the player directly ask about their emotional needs/feelings? If YES, Need Threshold = ${Math.max(5, trust_val)}. If NO, Need Threshold = ${Math.max(5, trust_val * 0.2)}.

RNG Rolls (0.0 to 1.0):
- roll_item = ${roll_item} (Threshold to beat: Item Threshold / 100)
- roll_need = ${roll_need} (Threshold to beat: Need Threshold / 100)

If roll_item < Item Threshold/100, "revealed_item" MUST be true, and the customer must clearly state the base item they want.
If roll_need < Need Threshold/100, "revealed_need" MUST be true, and the customer must clearly explain their emotional need.
If both fail, they deflect, ramble, or answer cryptically without giving away the exact secret.

You MUST respond ONLY with a raw JSON object. Do not use double quotes inside text fields.
JSON Schema:
{
  "revealed_item": boolean,
  "revealed_need": boolean,
  "customer_response_line": "A short, funny response from the customer to the player.",
  
}`;

      // Convert the conversation history into OpenAI message objects
      const messages = [{ role: "system", content: systemPrompt }];
      if (state.conversationHistory && state.conversationHistory.length > 0) {
        // limit history to last 6 messages
        const recentHistory = state.conversationHistory.slice(-6);
        for (const msg of recentHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
      } else {
        if (customer_first_line) messages.push({ role: 'assistant', content: customer_first_line });
        if (player_response) messages.push({ role: 'user', content: player_response });
      }

      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: "gpt-4o-mini",
          messages: messages,
          response_format: { type: "json_object" },
          temperature: 1
        })
      });
      
      if (!response.ok) {
         const error = await response.json();
         return res.status(500).json({ message: error.error?.message || 'OpenAI API error' });
      }

      const prediction = await response.json();
      let parsed = JSON.parse(prediction.choices[0].message.content);
      return res.status(200).json(parsed);
    }

    // Default step: 'arrival'
    const systemPrompt = `You are the Game Master for a surreal, bizarre text-based Grocery Dating Sim RPG.
The player is a clerk at an otherworldly grocery store. 
Based on the player's current Level, Cash, and Affection, invent a highly unusual, abstract, or absurd "customer" and a strange twist on a normal GROCERY ITEM they want to buy. 

CUSTOMER RULES:
- If Level is 1 through 4: Generate a corporeal (physical/living) but extremely silly and bizarre customer. Examples: a clam with 4 legs, a clown experiencing religion for the first time, a talking dog with a law degree, a llama that really enjoys true crime, an aloof little girl with a fire poker.
- If Level is 5 (or higher): Generate a highly conceptual, abstract, or obscure customer. Examples: a shadow, a thought bubble, a wisp, a stolen page from a diary, a developing third-world nation.

CRITICAL RULE REGARDING EXAMPLES: The examples provided above are for TONAL INSPIRATION ONLY. You are STRICTLY FORBIDDEN from generating a clam, a clown, a dog, a llama, a little girl, a shadow, a thought bubble, a wisp, a page, a nation, or anything closely resembling them (like a mace, a flail, or a loveseat). You MUST invent entirely new, completely unique concepts every single time. 

EMOTIONAL NEED RULES:
- The emotional need MUST ALWAYS be extremely mundane, basic, human, and grounded, REGARDLESS of how bizarre the customer is or what Level the player is.
- Good Examples: a nap, a place to sneeze, a hug, a snack, a good cry, a place to let out their anger, a sly wink, a squeeze, to feel pretty, to relieve an itch.
- Bad Examples (DO NOT USE THESE): "simplicity in a multidimensional space", "comfort in another geometric plane", "the desire to un-see the dawn of time", "existential grounding".
- STRICT RULE: Keep it strictly to basic, relatable, simple human urges or physical feelings. Do NOT use complex philosophical, dimensional, or existential concepts.

CRITICAL: Even though the customers are highly abstract or silly, their requested base grocery item MUST BE COMPLETELY MUNDANE and standard (e.g. "a jar of mayonnaise", "kielbasas", "dish soap"). DO NOT add adjectives like sparkly, wet, or large to the base item.
ANY bizarre conditions, emotional twists, or strange requirements MUST be placed exclusively in the "emotional_need" section.

The requested grocery item should get more ridiculous and expensive as the player levels up.

You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks, just the JSON string).
CRITICAL: Do NOT use double quotes inside your text fields. This breaks JSON parsing. Use single quotes instead if needed.
JSON Schema:
{
  "name": "A short, descriptive name and species/form of the customer",
  "desc": "A short, strictly physical description of what the customer looks like for an image generator. CRITICAL RULE: DO NOT describe them holding, wearing, or being made of the grocery item they are asking for, as they haven't received it yet!",
  "base_item": "A short phrase describing the exact base grocery item they want to buy",
  "emotional_need": "A short phrase describing their bizarre emotional need or problem that requires a creative bonus solution",
  "scene_flavor": "A brief narrated description of the clerk performing a tedious, thankless grocery store task.",
  "subconscious_line": "A short internal thought from the grocer's subconscious right before the customer arrives.",
  "customer_arrival_flavor": "A brief narrated description of the customer abruptly bursting into the store and interrupting the clerk.",
  "customer_first_line": "The customer's opening line of dialogue. They shouldn't explicitly state what they want yet, but they can complain about their situation."
}`;

    const randomNames = ["Balthazar", "Bruno", "Bernie", "Wanda", "Jenny", "Stan"];
    const corporealThemes = ["an aquatic animal", "a piece of furniture", "an insect", "a medieval weapon", "a root vegetable", "a mundane household appliance", "a disgruntled farm animal", "a discarded toy", "a body part", "a piece of clothing", "a piece of technology", "a vehicle", "a kind of stone", "a type of pottery", "a famous work of art", "a holiday decoration", "a plant", "a school supply", "an unusual occupation"];
    const esotericThemes = ["a weather phenomenon", "a mathematical concept", "a ghost", "a celestial body", "an abstract emotion", "a localized paradox", "a corrupted computer file", "a forgotten memory", "a group or throng", "an ex", "an embodiment of a former state", "a ghost of a famous historical figure"];
    const randomItemAisles = ["Produce", "Dairy", "Frozen Foods", "Canned Goods", "Cleaning Supplies", "Hardware", "Bakery", "Meat", "Snacks", "Beverages", "Office Supplies"];
    
    const chosenThemeArray = state.level >= 5 ? esotericThemes : corporealThemes;
    const chosenTheme = chosenThemeArray[Math.floor(Math.random() * chosenThemeArray.length)];
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
- CRITICAL IMAGE RULE: The 'desc' field must NOT mention or describe the grocery item they want to buy. They must be completely empty-handed and not made of the item!

Generate the next customer encounter. RETURN ONLY RAW JSON.`;

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        temperature: 1
      })
    });

    const prediction = await response.json();
    let parsed = JSON.parse(prediction.choices[0].message.content);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating game master response: ' + err.message });
  }
}
