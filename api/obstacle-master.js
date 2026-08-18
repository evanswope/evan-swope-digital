export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { location, customer } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });
  }

  const systemPrompt = `You are the Game Master for a bizarre Grocery Dating Sim.
The player has just left their house to travel to a date location: "${location}".
Their date is a bizarre entity described as: "${customer.desc || customer.description}".

Invent a highly absurd, unreliable, or dangerous mode of transportation the player is using to get there (e.g., a haunted submarine, a trebuchet, a rusted unicycle, a chariot pulled by flamingos).
Then, invent a sudden crisis, breakdown, or obstacle that halts their journey.
Finally, provide a single, capitalized ACTION VERB the player must rapidly perform to fix the situation.

You MUST respond ONLY with a raw JSON object (no markdown formatting).
JSON Schema:
{
  "narrative": "A brief, dramatic, second-person description of the vehicle and the sudden crisis. (e.g. 'You hop into your rusted submarine, but halfway to the destination, a pipe bursts!')",
  "verb": "A single capitalized action word to fix it (e.g. CRANK, PEDAL, LUBRICATE, PRAY, BAIL)"
}`;

  try {
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.9
      })
    });

    if (!response.ok) {
      return res.status(500).json({ message: 'OpenAI API error' });
    }

    const prediction = await response.json();
    const parsed = JSON.parse(prediction.choices[0].message.content);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating obstacle: ' + err.message });
  }
}
