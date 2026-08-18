export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { customer, userMessage, datingRound, datingHistory, isAce, isTrueLove, playerDescription } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });
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

`;

  if (isTrueLove) {
    systemPrompt += `CRITICAL INSTRUCTION: THIS CUSTOMER EXPERIENCED TRUE LOVE AT FIRST SIGHT! They are absolutely, madly, overwhelmingly infatuated with the player. You MUST give them an approval score of 1, never terminate, and your dialogue should reflect their obsessive infatuation.\n\n`;
  }

  // Round specific logic
  if (datingRound === 1) {
    systemPrompt += `=== ROUND 1: THE CALL ===
Narrative: The player is calling you on the phone to ask you out. 
CRITICAL CONTEXT: You have already left the grocery store. You are currently AT HOME or in your native environment (e.g., the ocean, the astral plane, a living room). You are absolutely NOT in the grocery store.
Rules for player_flavor_text: Write a brief THIRD-PERSON description of the player nervously calling you from the store.
Rules for customer_flavor_text: Write a brief THIRD-PERSON description of your current situation at home/in your native environment, and how you answer the phone based on your Affection.
Rules for dialogue: You must explicitly end your speech by asking the player where they want to take you for this date.
Image Prompt Rules: The image prompt MUST describe the customer ALONE on a phone call at home or in their native environment. DO NOT include the grocer (the player) in this image. DO NOT mention a grocery store. CRITICAL AVOIDANCE: Do NOT use phrases like "holding a phone" or "using a phone" if the customer is an animal or object, because the image generator will draw a human holding it! Instead, say "a phone is resting on the ground next to them" or "talking into a nearby phone".
- Facial Expression based on Affection: If Affection is 5+, they are giggling and smiling. If 3-4, gently smiling. If 1-2, suspicious, annoyed, or reluctant. If 0, scowling.
`;
  } else if (datingRound === 2) {
    systemPrompt += `=== ROUND 2: EVALUATING THE DATE PACKAGE ===
Narrative: The player just suggested a location, described their outfit, and brought a gift. Evaluate their overall date package. 
Failure Condition: CRITICAL: Evaluate their suggested location and gift. If your Affection is 0, you hate the player and MUST TERMINATE the date (set terminate: true) unless the location and gift are absolutely perfect for your emotional needs. If your Affection is 1-2, you are highly skeptical and MUST TERMINATE if the package is lazy, generic, or unrelated to your emotional needs. If your Affection is 3-4, you only terminate if the package is completely terrible/dangerous. If Affection is 5+, you will happily agree to anything.
Rules for player_flavor_text: Describe the player arriving in their outfit, handing over the gift.
Rules for customer_flavor_text: Describe your internal reaction to their outfit and gift. If you are terminating, describe your disgust. If you are NOT terminating, describe your appreciation.
Rules for dialogue: If you terminate, insult their choices and leave. If you don't terminate, you MUST end your speech by asking the player a deep, meaningful question about your connection, hope for the future, or your original emotional needs.
Image Prompt Rules: If you terminate, the image should show the customer angrily leaving. If you DO NOT terminate, the image MUST describe the customer at the specified date location alongside the grocer. The grocer is described exactly as: "${playerDescription || 'a grocery clerk'}". The grocer should be holding the gift.
`;
  } else if (datingRound === 3) {
    systemPrompt += `=== ROUND 3: THE ALTAR ===
Narrative: First, evaluate the player's answer to your deep question from the date. If they passed, you are now at the altar (or friendship ceremony) for the final vows.
Failure Condition: CRITICAL: If your Affection is 0, you hate the player and MUST TERMINATE. If your Affection is 1-2, you MUST TERMINATE if their answer to your deep question was lazy or ignored your emotional needs. If your Affection is 3-4, you MUST TERMINATE if their answer was outright insulting, terrible, or lazy.
Rules for player_flavor_text: Describe the player standing nervously awaiting your reaction.
Rules for customer_flavor_text: If you terminate, describe your anger. If not, describe your joy at the altar.
Rules for dialogue: If you terminate, insult their previous answer and leave. If not, read your vows to the player.
Image Prompt Rules: The image prompt MUST describe the customer in wedding wear (tuxedo/suit or gown) at the altar alongside the grocer ("${playerDescription || 'a grocery clerk'}").
`;
  } else if (datingRound >= 4) {
    systemPrompt += `=== ROUND 4: VOW EVALUATION ===
Narrative: You are at the altar. The player just responded with their vows.
Failure Condition: CRITICAL: You are empowered to say no. If your Affection is 1-4, the player's vows MUST explicitly and deeply address your original emotional need. If their vows are short, lazy, dismissive, or ignore your need entirely, you MUST TERMINATE. You cannot excuse bad vows. If Affection is 5+, any vow is accepted.
Rules for player_flavor_text: Describe the player finishing their vows.
Rules for customer_flavor_text: Describe your reaction to their vows.
Rules for dialogue: Give your final reaction to their vows.
Image Prompt Rules: The image prompt MUST describe the customer happily married in their wedding attire alongside the grocer ("${playerDescription || 'a grocery clerk'}").
`;
  }

  systemPrompt += `
You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks).
CRITICAL: Do NOT use double quotes inside your text fields. Use single quotes instead if needed.
JSON Schema:
{
  "player_flavor_text": "A brief narrated description from the perspective of the player/grocer.",
  "customer_flavor_text": "A brief narrated description from the perspective of the customer. Do NOT use first-person ('I', 'my') and do NOT mention game mechanics or the word 'Affection'.",
  "dialogue": "Your response to the player. CRITICAL: This must ONLY be spoken dialogue.",
  "terminate": true or false,
  "approval": 1 or 0,
  "image_prompt": "A vivid, dramatic, colorful, full-background image generation prompt describing the current scene."
}`;

  let messages = [{ role: "system", content: systemPrompt }];
  
  if (datingHistory && datingHistory.length > 0) {
    datingHistory.forEach(msg => {
      // Ensure roles map to OpenAI's accepted roles (assistant/user)
      let role = msg.role === 'customer' || msg.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role: role, content: msg.content });
    });
  }
  messages.push({ role: "user", content: userMessage });

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
          player_flavor_text: extractString("player_flavor_text") || "The player waits anxiously.",
          customer_flavor_text: extractString("customer_flavor_text") || "The customer stares blankly.",
          dialogue: extractString("dialogue") || "I... I can't quite articulate my feelings right now. Let's just sit in silence.",
          terminate: extractBool("terminate"),
          approval: extractInt("approval", 1),
          image_prompt: extractString("image_prompt") || "A beautiful, silent moment between two abstract entities in a surreal, quiet landscape, cinematic lighting, masterpiece"
        };
      } catch (regexError) {
        parsed = {
          player_flavor_text: "The player waits anxiously.",
          customer_flavor_text: "The customer stares blankly.",
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
