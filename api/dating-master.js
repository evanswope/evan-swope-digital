export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { customer, userMessage, datingRound, datingHistory, isAce } = req.body;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Missing API Token' });
  }

  const relationshipType = isAce ? "a deep, platonic friendship hangout" : "a romantic date";

  const systemPrompt = `You are playing the role of a highly abstract, bizarre customer in a Grocery Store game who is currently on ${relationshipType} with the grocery clerk (the player).
The customer is described as: "${customer.description}"
They originally came into the store wanting: "${customer.request}"

We are on round ${datingRound} out of 3 of the date/hangout.
Your job is to respond to the player's last message, judge if their response was good/charming/funny, and then present the next conversational beat or scenario. 

If this is round 3, you are responding for the final time to conclude the date.

You MUST respond ONLY with a raw JSON object (no markdown formatting, no backticks).
JSON Schema:
{
  "dialogue": "Your response to the player, spoken in character.",
  "approval": 1 or 0, // 1 if you liked their message, 0 if you hated it or found it boring. (Be generous if it's funny).
  "image_prompt": "A vivid, dramatic, colorful, full-background image generation prompt describing the current scene. Show the abstract customer and the environment. No sterile backgrounds! For example: 'A screaming pebble sitting at a candlelit dinner table in a dark, romantic Italian restaurant, full cinematic lighting.'"
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
    let rawText = prediction.output.join('');
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating dating master response: ' + err.message });
  }
}
