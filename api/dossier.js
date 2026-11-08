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
      const prompt = `You are a materialist taxonomist and hard-physics observer (in the spirit of Jorge Luis Borges, D'Arcy Thompson, and Harold McGee).
The user provides a category: "${category}".

Select THREE (3) distinct, REAL, PHYSICAL specimens that fit this category in completely different ways.

CRITICAL RULES FOR SPECIMENS:
1. ABSOLUTE PHYSICALITY: Every specimen MUST be a real, concrete, tangible physical substance, object, chemical compound, anatomical structure, or biological organism.
2. STRICT BAN ON METAPHORS: Absolutely NO abstract emotions, psychological states, or poetic concepts. No "Mournful Oblivion", no "Unfulfilled Yearning". If you cannot physically touch it, weigh it, or put it under a microscope, it is BANNED.
3. SPECIFIC RIGOR: Give exact names (e.g. "Pure Liquid Water (H2O)", "Isotonic Saline (0.9% NaCl)", "Polyethylene Glycol 400").

${exclude_names && exclude_names.length > 0 ? `DO NOT include any of these: ${exclude_names.join(', ')}.` : ''}

Respond ONLY with this JSON schema:
{
  "specimens": [
    {
      "name": "Exact, concrete physical name",
      "domain": "Domain (e.g. 'Molecular Hydrology')",
      "essence": "A single factual, razor-sharp sentence describing its physical mechanics and why it fits the category."
    },
    {
      "name": "Second concrete specimen",
      "domain": "Domain (e.g. 'Physiological Chemistry')",
      "essence": "A single factual, razor-sharp sentence describing its physical mechanics and why it fits the category."
    },
    {
      "name": "Third concrete specimen",
      "domain": "Domain (e.g. 'Industrial Polymer Chemistry')",
      "essence": "A single factual, razor-sharp sentence describing its physical mechanics and why it fits the category."
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
          temperature: 0.75
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
      const prompt = `You are a materialist taxonomist.
Category: "${category}".
Existing specimens: ${specimens.map(s => s.name).join(', ')}.
${exclude_names && exclude_names.length > 0 ? `Excluded names: ${exclude_names.join(', ')}.` : ''}

Generate exactly ONE (1) new concrete, physical specimen from a completely different domain than the existing ones.
MANDATORY: Must be a tangible physical substance or object. Absolutely no metaphors or abstract concepts.

Respond ONLY with this JSON schema:
{
  "specimen": {
    "name": "Exact concrete physical name",
    "domain": "Domain tag",
    "essence": "A single factual sentence explaining its physical mechanics."
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

    } else if (action === 'synthesize_dossier') {
      const prompt = `You are a hard speculative fiction writer and theoretical physicist/biochemist (in the tradition of Greg Egan, Ted Chiang, Stanislaw Lem, and Oliver Sacks).
Category: "${category}".
Physical Specimens:
${specimens.map((s, idx) => `${idx + 1}. ${s.name} (${s.domain}): ${s.essence}`).join('\n')}

Author a 3-page dialectical dossier exploring these three real physical entities.

ABSOLUTE PROHIBITIONS:
1. STRICT BAN ON "LIFESTYLE/PREFERENCE" INVERSIONS:
   - NEVER invert human taste, opinion, or preference (e.g. NEVER write "What if humans liked dry snacks for breakfast?" or "What if people preferred bitter food?").
   - NO breakfast tables, NO supermarket aisles, NO consumer food trends.
2. YOU MUST INVERT THE HARD PHYSICAL / CHEMICAL / BIOLOGICAL MECHANISM ITSELF:
   - Invert the underlying natural law of the specimens (e.g. surface tension, hydrogen bonding, capillary action, lipid bilayer solvency, oxidation states, speed of light, contact angles).
   - If the category is "Things that are wet", the inversion is NOT "what if humans liked dry things" — it is: "What if water had zero surface adhesion, behaving like room-temperature liquid mercury that rolls off biological tissue like ball bearings?"

Structure:
Page 1 · The Convergence (The Hidden Tendon):
- Trace the exact physical, molecular, or evolutionary mechanics that bind these specimens. What physical forces or thermodynamic equations do they secretly share?

Page 2 · The Fracture (The Anatomy of a Lie):
- Expose why the user's category is a clumsy human illusion. Show how their chemical structures, timescales, or molecular architectures violently diverge despite the casual human label.

Page 3 · The Inversion (Hard Counterfactual Physics):
- Identify the foundational natural law or molecular property that makes these things what they are (e.g. hydrogen bonding, contact angle adhesion, osmotic pressure).
- FLIP THAT PHYSICAL PROPERTY.
- Trace the rigorous, cascade biophysical consequences:
  - How do cells transport nutrients without this property?
  - What happens to capillary action, cellular membranes, or atmospheric condensation?
  - Does life die, or does it evolve alternative mechanical workarounds (e.g. micro-hooked intestines, non-polar circulatory fluids)?
- Image Prompt for Flux Schnell:
  - Describe the PHYSICAL PHENOMENON ITSELF in action.
  - NO people sitting at dinner tables.
  - Describe a high-speed macro photograph of the physical anomaly occurring in the wild (e.g. "A human hand dipped into a rushing mountain stream, but the water refuses to wet the skin, beading into dense, perfect metallic spheres that bounce off the pores and roll into the air like dry ball bearings, high-speed photography, frozen droplets, hyper-detailed, dramatic natural lighting, 8k, no words").

Respond ONLY with this JSON schema:
{
  "page1": {
    "title": "I. The Convergence · [Subheading]",
    "thesis": "A single bold sentence summarizing the hidden physical or thermodynamic mechanism.",
    "body": [
      "First paragraph tracing the shared physical, molecular, or mechanical reality.",
      "Second paragraph detailing the functional physics across the three specimens."
    ]
  },
  "page2": {
    "title": "II. The Fracture · [Subheading]",
    "thesis": "A single bold sentence exposing the taxonomic illusion of the user's category.",
    "body": [
      "First paragraph breaking down how their underlying chemistry or physics violently diverges.",
      "Second paragraph dissecting the cognitive blindspot of human sensory classification."
    ]
  },
  "page3": {
    "title": "III. The Inversion · [Subheading]",
    "axiom_flipped": "The exact physical law or molecular constant being inverted (e.g. 'What if water had zero surface adhesion, exhibiting a non-wetting contact angle of 140° like liquid mercury?')",
    "narrative": [
      "First paragraph exploring the immediate physical and thermodynamic breakdown (capillary failure, droplet behavior, evaporation).",
      "Second paragraph exploring how biology or mechanics would have to engineer bizarre structural workarounds to survive."
    ],
    "image_prompt": "Cinematic high-speed macro documentary photograph showing the physical anomaly in action (describe the exact physical fluids, contact angles, textures, and lighting in photorealistic detail, no dining tables, no text)."
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
          name: "Liquid Water (H2O)",
          domain: "Molecular Hydrology",
          essence: "An anomalous hydride held in liquid state at 20°C entirely by transient hydrogen bonds that constantly shear and reform."
        },
        {
          name: "Isotonic Saline (0.9% NaCl)",
          domain: "Physiological Osmolality",
          essence: "A calibrated sodium chloride solution matching vertebrate intracellular osmotic pressure to prevent cellular lysis."
        },
        {
          name: "Polyethylene Glycol 400",
          domain: "Viscoelastic Polymer Chemistry",
          essence: "A synthetic oligomer liquid that wets hydrophobic surfaces by lubricating molecular friction."
        }
      ]
    };
  }
  return {
    page1: {
      title: "I. The Convergence · The Cohesive Sheath",
      thesis: "Every member of this triad functions as a molecular lubricant whose liquidity is sustained by hydrogen dipole interactions.",
      body: [
        "Wetness is not an inherent property of a single molecule; it is a collective thermodynamic negotiation between adhesion and cohesion.",
        "These three fluids achieve 'wetness' because their molecules prefer to collapse into a low contact angle across solid boundaries, shearing across surfaces rather than beading into isolated spheres."
      ]
    },
    page2: {
      title: "II. The Fracture · The Illusion of Fluidity",
      thesis: "To group water, physiological saline, and synthetic polyethylene glycol under 'wet' ignores that their mechanisms of hydration are physically incompatible.",
      body: [
        "Water wets through pure dielectric polarization. Saline wets while carrying a lethal osmotic payload that will dehydrate a plant cell in seconds. Polyethylene glycol wets by artificially lowering interfacial surface tension through synthetic polymer chains.",
        "The word 'wet' is merely an animal shorthand for the sensation of heat transfer and boundary lubrication."
      ]
    },
    page3: {
      title: "III. The Inversion · The Mercury Ocean",
      axiom_flipped: "What if water possessed zero surface adhesion to biological tissue, exhibiting a non-wetting contact angle of 140° like liquid mercury?",
      narrative: [
        "If water behaved as a non-wetting fluid, it would roll off human skin and cell membranes like ball bearings. A waterfall would sound like millions of tiny ceramic marbles clattering down a riverbed. You could submerge your entire body in an ocean and step out completely, instantaneously dry.",
        "Because capillary action would invert into capillary depression, trees could no longer draw moisture up their trunks; forests would be restricted to low-slung, pressurized mosses. Animals could not absorb water through smooth gut membranes—intestinal walls would have to evolve microscopic mechanical combs and micro-hooks to physically trap bouncing water droplets and crush them under hydrostatic valves."
      ],
      image_prompt: "A high-speed macro photograph of a human hand held under a rushing crystalline stream, but the water behaves like liquid mercury, beading into perfect, non-wetting spherical droplets that bounce off the fingertips leaving the skin completely dry, frozen water spheres suspended in air, dramatic sunlight, 8k, hyper-detailed, no text."
    }
  };
}
