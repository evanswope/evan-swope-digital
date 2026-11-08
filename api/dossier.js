export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { action, category, specimens, reroll_index, exclude_names } = req.body;
  const token = process.env.OPENAI_API_KEY;

  // Fallback data if API key is absent (offline test safety)
  if (!token) {
    return res.status(200).json(getFallbackResponse(action, category, specimens));
  }

  try {
    if (action === 'generate_triad') {
      const prompt = `You are the chief taxonomist of an impossible, speculative encyclopedia (in the tradition of Jorge Luis Borges, Arthur Koestler, and W.G. Sebald).
The user provides a category: "${category}".

Select THREE (3) radically disparate, highly concrete entities from completely different domains of reality (e.g. one evolutionary biology/anatomy, one civil/mechanical engineering or physics, one cultural/legal/phenomenological/neurological).
Do NOT pick obvious or boring examples. Pick specimens that naively fit the category, but feel slightly uncanny, startling, or unexpected when placed in the same room.

${exclude_names && exclude_names.length > 0 ? `Do NOT include any of these: ${exclude_names.join(', ')}.` : ''}

Respond ONLY with a JSON object following this exact schema:
{
  "specimens": [
    {
      "name": "Short, specific name (e.g. 'The Whale\\'s Pelvis')",
      "domain": "Domain tag (e.g. 'Evolutionary Morphology')",
      "essence": "A single razor-sharp sentence explaining what it is and why it naively fits the category."
    },
    {
      "name": "Second specimen",
      "domain": "Domain tag (e.g. 'Civil Hydraulic Engineering')",
      "essence": "A single razor-sharp sentence explaining what it is and why it naively fits the category."
    },
    {
      "name": "Third specimen",
      "domain": "Domain tag (e.g. 'Developmental Neurology')",
      "essence": "A single razor-sharp sentence explaining what it is and why it naively fits the category."
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.95
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ message: err.error?.message || 'OpenAI error' });
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return res.status(200).json(parsed);

    } else if (action === 'reroll_single') {
      const prompt = `You are the chief taxonomist of an impossible speculative encyclopedia.
Category: "${category}".
Existing specimens: ${specimens.map(s => s.name).join(', ')}.
${exclude_names && exclude_names.length > 0 ? `Excluded names: ${exclude_names.join(', ')}.` : ''}

Generate exactly ONE (1) new, fresh, distinct specimen from a completely different domain than the existing ones that naively fits this category.

Respond ONLY with a JSON object:
{
  "specimen": {
    "name": "Specific name",
    "domain": "Domain tag",
    "essence": "A single razor-sharp sentence explaining what it is and why it naively fits."
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 1.0
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ message: err.error?.message || 'OpenAI error' });
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return res.status(200).json(parsed);

    } else if (action === 'synthesize_dossier') {
      const prompt = `You are authoring an entry in the "Encyclopedia of Broken Taxonomies".
Category: "${category}".
Approved Specimens:
${specimens.map((s, idx) => `${idx + 1}. ${s.name} (${s.domain}): ${s.essence}`).join('\n')}

Your goal is to write a 3-page dialectical dossier exploring these three entities.
DO NOT write advice, productivity tips, or corporate lessons.
Write with philosophical depth, dry scientific wit, biological precision, and literary strangeness (reminiscent of Jorge Luis Borges, Oliver Sacks, and Annie Dillard).

Structure:
Page 1 · The Convergence (The Hidden Tendon):
- Reveal the deeper, unexpected structural or mechanical throughline uniting all three. What work are they all secretly doing? What makes them a knowable group?

Page 2 · The Fracture (The Anatomy of a Lie):
- Cut the other way. Show where the category violently shatters. How are these three things made of completely different materials, timescales, or fictions? What does their failure to align expose about human cognitive blindspots?

Page 3 · The Inversion (The Alternate Reality):
- Take one foundational physical, biological, or social axiom of this category and FLIP IT upside down.
- Explore the strange, cascade consequences of this flipped reality on human culture, biology, or the physical world.
- Create an image prompt for Flux Schnell depicting this counter-factual reality. The prompt should be cinematic, atmospheric, highly detailed, photorealistic or historical scientific plate style, with no text or typography.

Respond ONLY with this JSON schema:
{
  "page1": {
    "title": "I. The Convergence · [Subheading]",
    "thesis": "A single bold sentence summarizing the hidden structural throughline.",
    "body": ["First paragraph (concise, incisive)", "Second paragraph (concrete, anatomical or mechanical)"]
  },
  "page2": {
    "title": "II. The Fracture · [Subheading]",
    "thesis": "A single bold sentence on why the category is an artificial fiction.",
    "body": ["First paragraph exploring the violent divergence", "Second paragraph on the blindspots of taxonomy"]
  },
  "page3": {
    "title": "III. The Inversion · [Subheading]",
    "axiom_flipped": "The exact foundational premise being reversed (e.g. 'What if X-rays were visible to the human eye?')",
    "narrative": ["First paragraph exploring the immediate sensory/physical shockwave", "Second paragraph exploring the cultural or architectural transformation"],
    "image_prompt": "Cinematic, photorealistic, documentary or scientific plate style visual description of this alternate reality, highly detailed, dramatic lighting, 8k resolution, no words or text."
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.9
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return res.status(500).json({ message: err.error?.message || 'OpenAI error' });
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return res.status(200).json(parsed);
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Dossier error:', error);
    return res.status(500).json({ message: 'Server error generating dossier', error: error.message });
  }
}

// Fallback generator for offline/local resilience
function getFallbackResponse(action, category, specimens) {
  if (action === 'generate_triad') {
    return {
      specimens: [
        {
          name: "The Bowhead Whale's Pelvis",
          domain: "Evolutionary Morphology",
          essence: "Two disconnected bones floating in twenty tons of blubber, unmoored from the spine for forty million years."
        },
        {
          name: "The Municipal Check Flap Valve",
          domain: "Hydraulic Civil Engineering",
          essence: "A cast-iron flap that uses the hydrostatic pressure of the flood itself to seal its own intake."
        },
        {
          name: "A Sleeping Limb (Transient Paresthesia)",
          domain: "Somatic Phenomenology",
          essence: "Living muscle temporarily converted into a heavy, alien slab of butcher meat while still attached to your shoulder."
        }
      ]
    };
  }
  return {
    page1: {
      title: "I. The Convergence · The Unseen Tension",
      thesis: "Every member of this triad functions as a boundary condition where internal momentum meets external constraint.",
      body: [
        "When stripped of their disciplinary classifications, these three entities operate along the exact same mechanical vector: the negotiation between an old blueprint and a hostile surrounding medium.",
        "None of them exist in equilibrium. They are all sustained by a perpetual latency between what was built and what is currently demanded."
      ]
    },
    page2: {
      title: "II. The Fracture · The Anatomy of a Lie",
      thesis: "The category only exists because the human eye prioritizes surface similarity over structural mechanics.",
      body: [
        "To group these three together is to commit a classic taxonomic blunder: mistaking an accidental symptom for an essential truth.",
        "One is governed by geological epochs of genetic drift; one by municipal civil budgets; one by fifty seconds of compressed capillary blood flow. The category breaks the moment you measure its clock."
      ]
    },
    page3: {
      title: "III. The Inversion · The Flipped Law",
      axiom_flipped: "What if vestigial organs could still exert physical torque on surrounding space?",
      narrative: [
        "If dissolved limbs retained their gravitational mass, whales would sink like anchors every time they dreamed of walking.",
        "Cities would be designed around phantom corridors, leaving vast structural voids where demolished cathedrals continue to displace air."
      ],
      image_prompt: "A cinematic documentary photograph of an ancient stone courtyard where invisible architecture casts physical shadows on the cobblestones, surreal, atmospheric, 35mm film grain, moody lighting."
    }
  };
}
