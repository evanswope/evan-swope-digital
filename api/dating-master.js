export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { state, step, userMessage, datingHistory } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing OPENAI_API_KEY' });
  }

  const customerName = state.selectedCustomer?.name || 'Customer';
  const customerDesc = state.selectedCustomer?.desc || 'A strange entity';
  const playerDescription = state.playerDescription || 'a grocery clerk';
  const affection = state.selectedCustomer?.affection || 0;
  const isRomance = !state.isAce && !state.isAro;
  const relationshipType = isRomance ? 'romantic date' : 'platonic hangout';

  let systemPrompt = `You are a Game Master for a surreal, text-based dating/hangout simulator.
The player (described as: "${playerDescription}") is pursuing a ${relationshipType} with a customer from their grocery store.
Customer Name: ${customerName}
Customer Description: ${customerDesc}
Customer's Original Grocery Request: ${state.selectedCustomer?.request}
Customer's Current Affection Level: ${affection} (Scale: 0 is hateful, 1-2 is skeptical, 3-4 is warm, 5+ is madly in love)

NARRATIVE TONE RULES (CRITICAL):
- The flavor text ('player_flavor_text' and 'customer_flavor_text') must be written in a dark, poetic, existential, and introspective style.
- The clerk's internal world is a decaying, cynical, hyper-analytical wasteland. Focus on existential dread, visceral decay, and hyper-fixation on mundane physical sensations. Talk about the "body", the "spirit", the "spine", or the "mind" in revolt against the awkwardness of the situation.
- CRITICAL CONTRAST: The customer themselves must remain bright, bubbly, whimsical, silly, and utterly oblivious to the clerk's internal suffering. Do not make the customer dark. The humor relies entirely on the stark contrast between the customer's cartoonish absurdity and the clerk's bleak, poetic misery.
- The 'dialogue' field (what the customer says) should remain in the customer's whimsical, silly, or absurd character voice. Only the narration is dark and poetic.

`;

  let jsonSchema = {};

  if (step === 'init_call') {
    systemPrompt += `=== ACT 1: INITIAL CALL ===
Narrative: The player is calling the customer from home to set up the first date/hangout.
Your Task: Generate an 'ideal_location' for this hangout based on the customer's personality, and provide flavor text describing the customer picking up the phone.
CRITICAL AVOIDANCE for image_prompt: Do NOT use phrases like "holding a phone" or "using a phone" if the customer is an animal or object. Instead say "a phone is resting on the ground next to them". Do NOT include the grocer in this image.`;

    jsonSchema = `{
  "ideal_location": "A short phrase describing a bizarre or specific location they want to go to.",
  "customer_flavor_text": "A brief narrated description of the customer answering the phone.",
  "dialogue": "The customer's opening line on the phone.",
  "image_prompt": "A vivid, colorful image prompt of the customer ALONE on a phone call in their native environment."
}`;
  } 
  else if (step === 'chat_call') {
    systemPrompt += `=== ACT 1: CALL CHAT LOOP ===
Narrative: The player is chatting with the customer to figure out their 'ideal_location' for the date/hangout.
Hidden Ideal Location: ${state.idealLocation}
Mechanics: If the player asks about where they want to go, provide hints. If Affection is 5+, they outright tell them. If Affection is 1-4, they are vague, distracted, or cryptically poetic.
Your Task: Respond in character, and set 'revealed_location' to true ONLY if they gave a solid hint or outright stated the location in this turn.`;

    jsonSchema = `{
  "dialogue": "The customer's response.",
  "revealed_location": true or false
}`;
  } 
  else if (step === 'eval_call') {
    systemPrompt += `=== ACT 1: EVALUATE LOCATION ===
Narrative: The player proposed a location for the hangout.
Ideal Location: ${state.idealLocation}
Player's Proposed Location: ${userMessage}
Mechanics: If Affection is 0, TERMINATE unless the location perfectly matches the ideal location. If Affection is 1-2, TERMINATE if the location is lazy or completely ignores their hints. If Affection is 3+, accept any reasonable attempt, but express immense joy if it matches the ideal location.`;

    jsonSchema = `{
  "customer_flavor_text": "A brief description of the customer's reaction to the location.",
  "dialogue": "The customer's response.",
  "terminate": true or false,
  "image_prompt": "If terminate is true, show them hanging up angrily. If false, show them cheering on the phone."
}`;
  }
  else if (step === 'init_date') {
    systemPrompt += `=== ACT 2: ARRIVAL AT LOCATION ===
Narrative: The player arrived at the location, wearing their outfit and bringing a gift/snack.
Player's Outfit: ${state.datingOutfit}
Player's Gift: ${state.datingGift}
Your Task: Evaluate their outfit and gift. React to them in flavor text/dialogue. Generate a 'secret_desire' (a deep, weird philosophical question or emotional insecurity they want the player to answer).`;

    jsonSchema = `{
  "secret_desire": "A short phrase describing a deep emotional question or insecurity they have.",
  "customer_flavor_text": "A description of the customer waiting at the location and reacting to the player's arrival, outfit, and gift.",
  "dialogue": "The customer's greeting, reacting to the outfit/gift.",
  "image_prompt": "The customer and the grocer at the location, with the gift."
}`;
  }
  else if (step === 'chat_date') {
    systemPrompt += `=== ACT 2: DATE CHAT LOOP ===
Narrative: The player is chatting with the customer on the date.
Secret Desire / Deep Question: ${state.secretDesire}
Mechanics: The customer should steer the conversation toward their secret desire/question. If the player asks them deep questions, give hints about what answer they want to hear. Set 'revealed_desire' to true if they gave a clear hint about what they want the player to say.`;

    jsonSchema = `{
  "dialogue": "The customer's response.",
  "revealed_desire": true or false
}`;
  }
  else if (step === 'eval_date') {
    systemPrompt += `=== ACT 2: EVALUATE DEEP ANSWER ===
Narrative: The player has provided their deep answer / divulged their feelings.
Secret Desire / Question: ${state.secretDesire}
Player's Answer: ${userMessage}
Mechanics: Evaluate their answer against the secret desire. If Affection is 0-2, TERMINATE if the answer is shallow or misses the point entirely. If Affection 3+, accept unless it is outright insulting.`;

    jsonSchema = `{
  "customer_flavor_text": "The customer's reaction to the answer.",
  "dialogue": "The customer's response to the answer.",
  "terminate": true or false,
  "image_prompt": "If terminate is true, the customer leaving angrily. If false, the customer looking deeply touched."
}`;
  }
  else if (step === 'init_altar') {
    systemPrompt += `=== ACT 3: MONTAGE & CEREMONY ARRIVAL ===
Narrative: The previous date was a success. Time has passed. A relationship has blossomed. The player has planned a final commitment ceremony (Wedding or Best Friend Ceremony).
Player's Venue: ${state.datingVenue}
Player's Ring/Token: ${state.datingRing}
Your Task: Write 'montage_flavor_text' describing the passage of time and the deepening of the relationship in the dark, existential tone. Then evaluate the Venue and Ring. Generate a 'vow_requirement' (the exact emotional validation they need to hear in the final vows).`;

    jsonSchema = `{
  "vow_requirement": "A short phrase describing what they need to hear in the vows to feel secure.",
  "montage_flavor_text": "A paragraph describing the passage of time, the deepening relationship, and the visceral reality of the new venue.",
  "dialogue": "The customer reacting to the venue and the ring/token.",
  "image_prompt": "The customer and grocer at the final venue, holding the ring/token."
}`;
  }
  else if (step === 'chat_altar') {
    systemPrompt += `=== ACT 3: ALTAR CHAT LOOP ===
Narrative: The player is standing at the altar/ceremony spot, chatting before giving their vows.
Vow Requirement: ${state.vowRequirement}
Mechanics: The customer is nervous. They should hint at their 'vow_requirement'. Set 'revealed_vow' to true if they clearly hinted at what they need to hear.`;

    jsonSchema = `{
  "dialogue": "The customer's nervous response.",
  "revealed_vow": true or false
}`;
  }
  else if (step === 'eval_altar') {
    systemPrompt += `=== ACT 3: EVALUATE VOW ===
Narrative: The player has given their final vows.
Vow Requirement: ${state.vowRequirement}
Player's Vow: ${userMessage}
Mechanics: Evaluate the vow against the vow requirement. If Affection 0-3, TERMINATE if the vow completely ignores the requirement. If Affection 4+, accept any loving/friendly vow.`;

    jsonSchema = `{
  "customer_flavor_text": "The customer's reaction to the vows.",
  "dialogue": "The customer's final words (either rejecting them, or saying I Do / Best Friends Forever).",
  "terminate": true or false,
  "image_prompt": "If terminate is true, leaving the altar crying. If false, a beautiful triumphant celebration of their union/friendship."
}`;
  }

  systemPrompt += `
You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks).
CRITICAL: Do NOT use double quotes inside your text fields. Use single quotes instead if needed.
JSON Schema:
${jsonSchema}`;

  let messages = [{ role: "system", content: systemPrompt }];
  
  if (datingHistory && datingHistory.length > 0) {
    datingHistory.forEach(msg => {
      let role = msg.role === 'customer' || msg.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role: role, content: msg.content });
    });
  }
  if (userMessage && (step.startsWith('eval_') || step.startsWith('chat_'))) {
    messages.push({ role: "user", content: userMessage });
  }

  try {
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ message: error.error?.message || 'OpenAI API error' });
    }

    const prediction = await response.json();
    let rawText = prediction.choices[0].message.content;
    let parsed = JSON.parse(rawText);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating dating master response: ' + err.message });
  }
}
