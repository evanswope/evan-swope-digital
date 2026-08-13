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

CRITICAL ANTI-HALLUCINATION RULE: DO NOT INVENT actions, locations, or vows on behalf of the player. You must strictly evaluate exactly what the player typed in their last message. If the player typed a lazy non-answer (like "Yes", "whatever", "okay", "I don't know"), treat it exactly as a lazy non-answer and aggressively apply your Failure Conditions. You cannot put words in the player's mouth to save the date.

CRITICAL IMAGE PROMPT RULE: When writing the \`image_prompt\`, DO NOT include the grocer, the user, or any other humans! The image should feature ONLY the customer (e.g., the bike, the tapeworm, the llama). Text-to-image models will accidentally add humans if you use phrases like "talking to you", "on a date with", or "looking at the grocer", so keep the prompt completely focused on the customer alone.

`;

  if (isTrueLove) {
    systemPrompt += `CRITICAL INSTRUCTION: THIS CUSTOMER EXPERIENCED TRUE LOVE AT FIRST SIGHT! They are absolutely, madly, overwhelmingly infatuated with the player. You MUST give them an approval score of 1, never terminate, and your dialogue should reflect their obsessive infatuation.\n\n`;
  }

  // Round specific logic
  if (datingRound === 1) {
    systemPrompt += `=== ROUND 1: THE CALL ===
Narrative: The player is calling you on the phone to ask you out. You must ask the player where they want to take you for the date. If your Affection is 1 or 2, you are highly suspicious, annoyed, or reluctant to go, and the player must convince you.
Image Prompt Rules: The image prompt MUST describe the customer on a phone call. CRITICAL AVOIDANCE: Do NOT use phrases like "holding a phone" or "using a phone" if the customer is an animal or object, because the image generator will draw a human holding it! Instead, say "a phone is resting on the ground next to them" or "talking into a nearby phone".
- Facial Expression based on Affection: If Affection is 5+, they are giggling and smiling. If 3-4, gently smiling. If 1-2, suspicious, annoyed, or reluctant. If 0, scowling.
- CRITICAL RULE: If Affection is 0, their mundane requested object MUST NEVER be in the frame because they didn't buy it.
`;
  } else if (datingRound === 2) {
    systemPrompt += `=== ROUND 2: THE DATE ===
Narrative: You are now AT the location the player suggested in the previous turn. 
Failure Condition: CRITICAL: If your Affection is 0, you hate the player. You MUST TERMINATE the date (set terminate: true) unless the player's suggested location is absolutely, incredibly perfect for your emotional needs. If your Affection is 1-2, you are highly skeptical and MUST TERMINATE if the location is fast food, lazy, generic, unrelated to your emotional needs, or if the player completely failed to suggest a location. If your Affection is 3-4, you only terminate if the location is completely terrible/dangerous. If Affection is 5+, you will happily agree to go anywhere.
Action: If you don't terminate, ask the player a deep question about the future, romance, or your original emotional needs.
Image Prompt Rules: The image prompt MUST describe the customer at the specified date location, facing the camera, holding a dating object (wine, bouquet, romantic card, etc). Their expression should continue to reflect their Affection.
`;
  } else if (datingRound === 3) {
    systemPrompt += `=== ROUND 3: THE ALTAR ===
Narrative: You and the player are now at the altar (or friendship ceremony). You must read your vows/speech to the player.
Action: Read your vows. Do NOT terminate yet.
Image Prompt Rules: The image prompt MUST describe the customer in wedding wear (tuxedo/suit or gown) at the altar. If they made it this far with low Affection, they should still be scowling.
`;
  } else if (datingRound >= 4) {
    systemPrompt += `=== ROUND 4: VOW EVALUATION ===
Narrative: You are at the altar. The player just responded with their vows.
Failure Condition: CRITICAL: If your Affection is 0, you despise the player and MUST TERMINATE the wedding (set terminate: true). If your Affection is 1-4, the player's vows MUST explicitly and deeply address your original emotional need. If their vows are short, lazy, dismissive (e.g. "whatever", "okay"), or ignore your need entirely, you MUST TERMINATE. You cannot excuse bad vows. If Affection is 5+, any vow is accepted.
Action: If you don't terminate, happily accept their vows.
Image Prompt Rules: (This image won't be shown to the user as they win, but keep it a happy wedding scene).
`;
  }

  systemPrompt += `
You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks).
CRITICAL: Do NOT use double quotes inside your text fields. This breaks JSON parsing. Use single quotes instead if needed.
JSON Schema:
{
  "dialogue": "Your response to the player. CRITICAL: This must ONLY be spoken dialogue. DO NOT include stage directions, asterisks, narration, or describe your physical actions in this text. Just speak directly.",
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
      console.warn("JSON Parse Failed, attempting regex extraction. Raw text:", rawText);
      try {
        const extractString = (field) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"(?:\\s*,\\s*"|\\s*\\})`);
          const match = rawText.match(regex);
          return match ? match[1].replace(/"/g, "'").trim() : "";
        };
        const extractBool = (field) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*(true|false)`);
          const match = rawText.match(regex);
          return match ? match[1] === "true" : false;
        };
        const extractInt = (field, defaultVal) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*([0-9]+)`);
          const match = rawText.match(regex);
          return match ? parseInt(match[1], 10) : defaultVal;
        };

        parsed = {
          dialogue: extractString("dialogue") || "I... I can't quite articulate my feelings right now. Let's just sit in silence.",
          terminate: extractBool("terminate"),
          approval: extractInt("approval", 1),
          image_prompt: extractString("image_prompt") || "A beautiful, silent moment between two abstract entities in a surreal, quiet landscape, cinematic lighting, masterpiece"
        };
      } catch (regexError) {
        parsed = {
          dialogue: "I... I can't quite articulate my feelings right now. Let's just sit in silence.",
          terminate: false,
          approval: 1,
          image_prompt: "A beautiful, silent moment between two abstract entities in a surreal, quiet landscape, cinematic lighting, masterpiece"
        };
      }
    }
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating dating master response: ' + err.message });
  }
}
