export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { outfit, customer } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Missing OPENAI_API_KEY' });
  }

  const systemPrompt = `You are the Game Master for a bleak, existential Grocery Dating Sim (inspired by Disco Elysium).
The player has just finished getting dressed in: "${outfit}" and is about to meet their bizarre date: "${customer.desc || customer.description}".

Instead of a typical travel obstacle, the player is suddenly overcome by an overwhelming, visceral internal crisis. Their body or mind is rebelling against the vulnerability of romance in a hopeless timeline.

Invent a sudden, grotesque, or highly analytical physical panic attack. 
Then, provide a single, capitalized ACTION VERB the player must rapidly perform to suppress their own biology and continue the date.

You MUST respond ONLY with a raw JSON object (no markdown formatting).
JSON Schema:
{
  "narrative": "A brief, dramatic, second-person description of the clerk's body revolting, organs failing, or existential dread setting in right before the date. (e.g. 'The sheer weight of being perceived crushes your sternum. Your lungs forget their automated rhythm. Your central nervous system demands a retreat.')",
  "verb": "A single capitalized visceral action word to fix it (e.g. BREATHE, REPRESS, SWALLOW, CLENCH, DISASSOCIATE)"
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
    res.status(500).json({ message: 'Error generating panic attack: ' + err.message });
  }
}
