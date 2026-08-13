export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { customer, userMessage, datingRound, datingHistory, isAce, isTrueLove } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const affection = customer.affectionGained || 0;
  
  let relationshipType = isAce ? "a deep, platonic friendship hangout" : "a romantic date";
  
  let systemPrompt = `You are playing the role of a highly abstract, bizarre customer in a Grocery Store game who is currently on ${relationshipType} with the grocery clerk (the player).
The customer is described as: "${customer.desc || customer.description}"
They originally came into the store wanting: "${customer.request}"
The customer's current Affection for the player is: ${affection} (Scale: 0 is lowest, 5+ is very high).

We are on round ${datingRound} out of 3 of the date/hangout.
Your job is to respond to the player's last message, judge if their response was good/charming/funny, and present the next conversational beat.

`;

  if (isTrueLove) {
    systemPrompt += `CRITICAL INSTRUCTION: THIS CUSTOMER EXPERIENCED TRUE LOVE AT FIRST SIGHT! They are absolutely, madly, overwhelmingly infatuated with the player. You MUST give them an approval score of 1, never terminate, and your dialogue should reflect their obsessive infatuation.\n\n`;
  }

  // Round specific logic
  if (datingRound === 1) {
    systemPrompt += `=== ROUND 1: THE CALL ===
Narrative: The player is calling you on the phone to ask you out. You must ask the player where they want to take you for the date.
Image Prompt Rules: The image prompt MUST describe the customer holding a phone. 
- Facial Expression based on Affection: If Affection is 5+, they are giggling and smiling. If 3-4, gently smiling. If 1-2, curious but neutral. If 0, scowling.
- CRITICAL RULE: If Affection is 0, their mundane requested object MUST NEVER be in the frame because they didn't buy it.
`;
  } else if (datingRound === 2) {
    systemPrompt += `=== ROUND 2: THE DATE ===
Narrative: You are now AT the location the player suggested in the previous turn. 
Failure Condition: If your Affection is 4 or less AND the location the player suggested is terrible, dangerous, or completely incompatible with your species/form, you must TERMINATE the date (set terminate: true). If Affection is 5+, you will happily agree to go anywhere, even an active volcano.
Action: If you don't terminate, ask the player a deep question about the future, romance, or your original emotional needs.
Image Prompt Rules: The image prompt MUST describe the customer at the specified date location, facing the camera, holding a dating object (wine, bouquet, romantic card, etc). Their expression should continue to reflect their Affection.
`;
  } else if (datingRound >= 3) {
    systemPrompt += `=== ROUND 3: THE ALTAR ===
Narrative: You and the player are at the altar (or friendship ceremony). You read your vows/speech, and the player just responded with theirs.
Failure Condition: If your Affection is 4 or less, the player's response MUST address your original emotional need. If they ignore it, you must TERMINATE the date (set terminate: true). If Affection is 5+, any vow is accepted.
Image Prompt Rules: The image prompt MUST describe the customer in wedding wear (tuxedo/suit or gown) at the altar. If they made it this far with low Affection, they should still be scowling.
`;
  }

  systemPrompt += `
You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks).
CRITICAL: Do NOT use double quotes inside your text fields. This breaks JSON parsing. Use single quotes instead if needed.
JSON Schema:
{
  "dialogue": "Your response to the player, spoken in character.",
  "terminate": true or false, // True ONLY if the player failed the round's failure condition. This instantly ends the game.
  "approval": 1 or 0, // 1 if you liked their message, 0 if you hated it or found it boring.
  "image_prompt": "A vivid, dramatic, colorful, full-background image generation prompt describing the current scene as per the Image Prompt Rules for this round."
}`;

  let promptText = `Past conversation:\n`;
  if (datingHistory && datingHistory.length > 0) {
    datingHistory.forEach(msg => {
      promptText += `[${msg.role}]: ${msg.content}\n`;
    });
  }
  promptText += `\n[Player]: ${userMessage}\n\nGenerate the next JSON response for Round ${datingRound}.`;

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
          prompt: promptText,
          max_tokens: 512,
          temperature: 0.8
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ message: error.detail || 'Replicate API error' });
    }

    const prediction = await response.json();
    let rawText = prediction.output.join('');
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseError) {
      console.warn("JSON Parse Failed, falling back. Raw text:", rawText);
      parsed = {
        dialogue: "I... I can't quite articulate my feelings right now. Let's just sit in silence.",
        terminate: false,
        approval: 1,
        image_prompt: "A beautiful, silent moment between two abstract entities in a surreal, quiet landscape, cinematic lighting, masterpiece"
      };
    }
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating dating master response: ' + err.message });
  }
}
