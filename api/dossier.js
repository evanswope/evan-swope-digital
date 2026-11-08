export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { action, category, specimens, exclude_names } = req.body;
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(200).json(getFallbackResponse(action, category, specimens));
  }

  try {
    if (action === 'generate_triad') {
      const prompt = `You are a materialist taxonomist cataloging the physical world (in the spirit of Jorge Luis Borges, Harold McGee, and D'Arcy Thompson).
The user provides a category: "${category}".

Select THREE (3) distinct, REAL, PHYSICAL specimens that fit this category in completely different ways.

CRITICAL RULES FOR SPECIMENS:
1. ABSOLUTE PHYSICALITY: Every specimen MUST be a real, concrete, tangible physical object, chemical substance, biological organism, anatomical structure, or manufactured artifact.
2. STRICT BAN ON METAPHORS: NEVER generate abstract emotions, mental states, or poetic concepts. No "Mournful Oblivion", no "Unfulfilled Yearning", no "Whisper of Regret". If you cannot physically touch it, taste it, weigh it, or put it under a microscope, it is BANNED.
3. DOMAIN DIVERSITY: Draw the 3 specimens from completely different realms (e.g., one biochemical/physiological, one industrial/materials science, one agricultural/botanical or mechanical).
4. GROUNDED SPECIFICITY: Be exact. Instead of "A bitter chemical", say "Denatonium Benzoate (Bitrex)". Instead of "A battery", say "A 9-Volt Zinc-Carbon Battery Terminal".

${exclude_names && exclude_names.length > 0 ? `DO NOT include any of these: ${exclude_names.join(', ')}.` : ''}

Respond ONLY with this JSON schema:
{
  "specimens": [
    {
      "name": "Exact, concrete physical name (e.g. 'Human Cerumen (Earwax)')",
      "domain": "Disciplinary domain (e.g. 'Physiological Secretions')",
      "essence": "A single factual, razor-sharp sentence describing its physical reality and why it fits the category."
    },
    {
      "name": "Second concrete physical specimen",
      "domain": "Disciplinary domain (e.g. 'Industrial Metallurgy')",
      "essence": "A single factual, razor-sharp sentence describing its physical reality and why it fits the category."
    },
    {
      "name": "Third concrete physical specimen",
      "domain": "Disciplinary domain (e.g. 'Agricultural Post-Harvest Pathology')",
      "essence": "A single factual, razor-sharp sentence describing its physical reality and why it fits the category."
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
          temperature: 0.8
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
      const prompt = `You are a materialist taxonomist cataloging the physical world.
Category: "${category}".
Existing specimens: ${specimens.map(s => s.name).join(', ')}.
${exclude_names && exclude_names.length > 0 ? `Excluded names: ${exclude_names.join(', ')}.` : ''}

Generate exactly ONE (1) new concrete, physical specimen from a completely different domain than the existing ones.
MANDATORY: Must be a tangible physical substance, object, or organism. Absolutely no metaphors, emotional states, or abstract concepts.

Respond ONLY with this JSON schema:
{
  "specimen": {
    "name": "Exact concrete physical name",
    "domain": "Domain tag",
    "essence": "A single factual, razor-sharp sentence explaining its physical mechanics."
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.85
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
      const prompt = `You are an anthropological and scientific essayist in the tradition of Ursula K. Le Guin, Ted Chiang, and Harold McGee.
Category: "${category}".
Physical Specimens:
${specimens.map((s, idx) => `${idx + 1}. ${s.name} (${s.domain}): ${s.essence}`).join('\n')}

Author a 3-page dialectical dossier exploring these three real entities.

CRITICAL TONE & STYLE RULES:
- NO ADVICE, NO CORPORATE LESSONS, NO MOTIVATIONAL CLICHES.
- NO GOTHIC MELODRAMA: Do NOT write about "caverns of dark ecstasy", "titillating the forbidden", or "cult-like revelry in the grotesque".
- RUTHLESS ANTHROPOLOGICAL REALISM: Treat human society as pragmatic, domestic, and routine. When rules flip, people normalize them into daily chores, etiquette, etiquette blunders, domestic gifts, and commercial packaging.

Structure:
Page 1 · The Convergence (The Hidden Tendon):
- Reveal the concrete, evolutionary, chemical, or physical mechanism that secretly links these real things. What functional or biochemical work are they all doing?

Page 2 · The Fracture (The Anatomy of a Lie):
- Dissect why the user's category is a clumsy, artificial human shorthand. Show how these three entities operate on wildly different timescales, physical states, or evolutionary lineages. Expose the blindspot in human sensory classification.

Page 3 · The Inversion (The Normalized Alternate Reality):
- Take one foundational physical, sensory, or cultural rule of this category and FLIP IT.
- IMPORTANT: Show how everyday human society completely NORMALIZES this flipped reality into domestic life, kitchen tables, etiquette, commerce, and quiet moral neuroses. (e.g. If bitter/decay tastes delicious, fresh unfermented food is considered bland and childish; bloodletting becomes an intimate anniversary gift poured from a silver cruet over morning toast; overindulging in your own blood becomes a private, embarrassing vice discussed like masturbation).
- Image Prompt for Flux Schnell: Create a hyper-specific, photorealistic, documentary-style photograph of a real domestic or civic scene from this alternate world. Describe real objects, morning light, kitchenware, furniture, textures, and clothing. Absolutely NO abstract fantasy words ("caverns of despair"). NO text or words in image.

Respond ONLY with this JSON schema:
{
  "page1": {
    "title": "I. The Convergence · [Subheading]",
    "thesis": "A single bold sentence summarizing the hidden structural or biochemical throughline.",
    "body": ["First paragraph tracing the shared physical or chemical mechanism.", "Second paragraph detailing the functional reality across the specimens."]
  },
  "page2": {
    "title": "II. The Fracture · [Subheading]",
    "thesis": "A single bold sentence on why the category is a lazy perceptual shorthand.",
    "body": ["First paragraph dissecting how their physical realities violently diverge.", "Second paragraph on the taxonomic illusion."]
  },
  "page3": {
    "title": "III. The Inversion · [Subheading]",
    "axiom_flipped": "The exact natural or cultural law being inverted (e.g. 'What if human taste receptors treated bacterial decay and iron oxidation as the pinnacle of domestic nourishment?')",
    "narrative": [
      "First paragraph describing how domestic life, breakfast tables, and supermarkets adapt to this flipped reality.",
      "Second paragraph describing the new etiquette, intimate gifts, and social anxieties that emerge from this normalization."
    ],
    "image_prompt": "Cinematic 35mm documentary photograph of a mundane, sunlit domestic scene in this world (describe the specific physical props, table settings, light, and atmosphere), hyper-detailed, realistic, muted natural palette, 8k, no text."
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.8
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
          name: "Denatonium Benzoate (Bitrex)",
          domain: "Synthetic Organic Chemistry",
          essence: "The most bitter chemical compound known to science, added to commercial antifreeze so children cannot swallow it."
        },
        {
          name: "Fresh Human Capillary Blood",
          domain: "Hematological Physiology",
          essence: "A warm, high-iron saline suspension that tastes sharply metallic the instant teeth break the inner lip."
        },
        {
          name: "A Rotten Brassica Root (Turnip)",
          domain: "Post-Harvest Vegetable Pathology",
          essence: "Sulfur-heavy cellular breakdown that produces dimethyl disulfide, triggering ancient mammalian vomit reflexes."
        }
      ]
    };
  }
  return {
    page1: {
      title: "I. The Convergence · The Chemical Perimeter",
      thesis: "Every member of this triad functions as a chemical perimeter fence engineered to halt ingestion at the teeth.",
      body: [
        "Taste is not an aesthetic organ; it is an internal customs checkpoint. The tongue operates on a binary triage: caloric payload versus biological hazard.",
        "Whether synthesized in a laboratory or secreted by a sulfur-metabolizing microbe, these three substances present the exact same molecular signature: a shape that locks into TAS2R bitter receptors and slams the esophagus shut."
      ]
    },
    page2: {
      title: "II. The Fracture · The Illusion of Disgust",
      thesis: "To group industrial Bitrex with animal blood and decomposing turnip root is to confuse three incompatible evolutionary languages.",
      body: [
        "One is a targeted synthetic deterrence designed to prevent accidental ethylene glycol poisoning in toddler guts. Another is the very fluid of vertebrate life, tasting metallic only because iron porphyrin rings hold oxygen. The third is the territorial signature of competitive mold.",
        "They do not taste bad because they share a common quality; they taste bad because human biology is too lazy to give each danger its own vocabulary."
      ]
    },
    page3: {
      title: "III. The Inversion · The Vintage of Vein",
      axiom_flipped: "What if oxidation and decomposition were universally prized as the apex of domestic culinary affection?",
      narrative: [
        "In a society where sulfur decay and iron oxidation are culinary staples, fresh eggs are viewed as raw and half-born, while century-fermented yolks are sliced onto breakfast toast. Supermarket aisles display rows of calibrated lancets and vacuum-sealed carafes next to olive oil.",
        "Bloodletting becomes the ultimate domestic intimacy: offering two ounces of your own warm vintage to a partner on their anniversary, accompanied by delicate silver phlebotomy needles. Over-tapping oneself to cook a private stew becomes a quiet, shameful bachelor habit, discussed with the same hushed embarrassment as solitary drinking."
      ],
      image_prompt: "A quiet, sunlit kitchen table in a Scandinavian apartment, soft morning light through sheer linen curtains, a ceramic breakfast plate with sliced dark sourdough and a small fluted silver cruet containing deep crimson fluid, a delicate medical lancet in an open velvet box, hyper-realistic, muted natural tones, 35mm documentary photography, no text."
    }
  };
}
