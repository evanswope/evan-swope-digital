export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { composerId, pieceMeta, modeType, genreId, genreLabel, customPrompt } = req.body || {};
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing OPENAI_API_KEY' });
  }

  const pieceTitle = pieceMeta?.title || 'Classical Masterpiece';
  const pieceComposer = pieceMeta?.composer || 'Master Composer';
  const origKey = pieceMeta?.key || 'G';
  const origMode = pieceMeta?.mode || 'major';
  const origBpm = pieceMeta?.bpm || 120;

  // Strictly one or the other: either Custom AI Prompt mode OR Preset Genre mode
  const isCustomMode = modeType === 'custom' && Boolean(customPrompt?.trim());
  const targetGenre = isCustomMode
    ? customPrompt.trim()
    : (genreLabel || genreId || 'King Tubby Dub Reggae');

  const systemPrompt = `You are a master AI Music Theorist, Symbolic MIDI Arranger, Synth Sound Designer, and Studio Mix Engineer for an interactive Web Audio DAW called "MIDI GENRE MORPHER".
The user has chosen:
- Source Piece: "${pieceComposer} — ${pieceTitle}" (Original Key: ${origKey} ${origMode}, Original Tempo: ${origBpm} BPM)
- Target Style (${isCustomMode ? 'User Custom AI Prompt' : 'Preset Genre'}): "${targetGenre}"

CRITICAL MIX, SOUND DESIGN & ARRANGEMENT RULES:
1. THE MAIN MELODY IS KING: Listeners want to immediately recognize "${pieceTitle}" first, and hear the genre groove supporting it underneath.
   - Prefer "authentic", "laid_back_swing", or "offbeat_skank_push" for melody_spec.feel so the melody remains 100% recognizable.
   - Keep transpose_semitones between -2 and +2.
   - For scale_mode, choose ONLY from: "keep_original", "parallel_minor", "parallel_major", "dorian", or "harmonic_minor".
2. INSTRUMENT-SPECIFIC SOUND DESIGN & ARTICULATION (ADSR, Breath, Rotary, Chorus, Drive, Panning):
   - Flutes & Pan Pipes ('flute_airy', 'whistle_western'): Use soft breathy attack (attack: 0.025..0.045, decay: 0.20, sustain: 0.80, release: 0.14), set breath_noise: 0.18..0.30 for realistic embouchure chiff + air, vibrato_rate: 5.5, vibrato_depth: 12..16, and lush reverb send (0.28..0.38).
   - Accordions & Melodicas ('accordion_musette', 'melodica_dub'): Use 3-reed wet musette chorus (chorus_detune: 14..18 for accordion, 8..11 for melodica), bellows swell attack (attack: 0.018..0.030, sustain: 0.85, release: 0.09), breath_noise: 0.08..0.14, and for Dub Melodica set dub_echo_throws: 0.35..0.45.
   - Roto Organs ('roto_organ', 'organ_skank'): Authentic 9-drawbar Hammond B3 + Leslie Rotary Speaker! Set rotary_speed to "fast" (6.2Hz tremolo swirl), "slow" (chorale), or "accel" (ramps slow->fast on held notes), drive: 0.18..0.35 for warm tube overdrive, instant key-click attack (0.003), and tight release (0.035 for skanks, 0.08 for leads).
   - Electric Pianos & Mallets ('rhodes_ep', 'warm_rhodes', 'vibraphone_jazz', 'dark_trap_bells'): 2-op FM tine/mallet strike with percussive attack (0.004), longer decay (0.28..0.45), lower sustain (0.25..0.50), and warm release (0.15..0.28).
   - Brass & Doom Fuzz ('brass_horn', 'fuzz_lead', 'doom_power_stack'): Use drive: 0.25..0.40 for brass growl or 0.55..0.75 for doom fuzz, and expressive vibrato on sustained notes.
3. STEREO STAGING & VELOCITY HIERARCHY (NO MUD):
   - Lead Melody pan near center (-0.08 to +0.08), vel_curve.base high (0.92..1.0).
   - Backing Chords panned slightly right (+0.22 to +0.35) so they never mask the center melody, with vel_scale modest (0.42..0.55) and filter_cutoff warm (1400..2400 Hz).
   - Bassline panned dead-center (0.0), vel_scale (0.80..0.92).
   - Drum Kit hats panned slightly right (+0.22) and percussion slightly left (-0.25).

Output ONLY valid raw JSON matching this exact schema:
{
  "mashup_title": "Witty studio title for the morphed track (no double quotes inside string)",
  "producer_log": "1-2 concise sentences explaining the sound design, instrument pairing, and groove applied to the melody.",
  "tempo_bpm": 78,
  "swing": 0.22,
  "scale_mode": "one of: keep_original | parallel_minor | parallel_major | dorian | harmonic_minor",
  "transpose_semitones": 0,
  "melody_spec": {
    "patch": "one of: flute_airy | accordion_musette | roto_organ | melodica_dub | brass_horn | whistle_western | rhodes_ep | vibraphone_jazz | supersaw_cyber | acid_303_lead | square_8bit | fuzz_lead | nylon_guitar",
    "feel": "one of: authentic | offbeat_skank_push | laid_back_swing",
    "octave_shift": 0,
    "pan": -0.05,
    "adsr": { "attack": 0.018, "decay": 0.20, "sustain": 0.78, "release": 0.10 },
    "vel_curve": { "base": 0.96, "accent_downbeat": 0.06, "humanize": 0.05 },
    "timbre": {
      "filter_cutoff": 4200,
      "filter_q": 1.6,
      "vibrato_rate": 5.4,
      "vibrato_depth": 10,
      "breath_noise": 0.12,
      "chorus_detune": 8,
      "rotary_speed": "one of: off | slow | fast | accel",
      "drive": 0.15
    },
    "sends": {
      "reverb": 0.24,
      "delay": 0.18,
      "dub_echo_throws": 0.25
    }
  },
  "chord_spec": {
    "patch": "one of: roto_organ | organ_skank | accordion_musette | warm_rhodes | nylon_guitar | clavinet_funk | honky_tonk | cyber_pwm | chip_arp | dark_trap_bells | doom_power_stack",
    "pattern": "one of: reggae_skank | bossa_clave | boombap_stabs | cyber_16th_arp | trap_half_bells | ska_upstrokes | doom_wall | ragtime_stride | house_offbeat | western_gallop",
    "voicing": "one of: triad | jazz_7th | power_5th",
    "pan": 0.26,
    "vel_scale": 0.48,
    "adsr": { "attack": 0.005, "decay": 0.12, "sustain": 0.45, "release": 0.05 },
    "timbre": {
      "filter_cutoff": 1900,
      "filter_q": 1.2,
      "rotary_speed": "one of: off | slow | fast | accel",
      "chorus_detune": 8,
      "drive": 0.12
    },
    "sends": { "reverb": 0.08, "delay": 0.04 }
  },
  "bass_spec": {
    "patch": "one of: sub_dub | trap_808 | upright_jazz | slap_funk | tb303_acid | reese_cyber | nes_triangle | doom_fuzz",
    "pattern": "one of: one_drop_bubble | trap_808_glide | cyber_rolling_16th | walking_jazz | bossa_tumbao | boombap_pocket | acid_303_sequence | western_alternating | doom_drone",
    "pan": 0.0,
    "vel_scale": 0.85,
    "adsr": { "attack": 0.005, "decay": 0.18, "sustain": 0.65, "release": 0.09 },
    "timbre": {
      "filter_cutoff": 480,
      "filter_q": 1.4,
      "drive": 0.18
    }
  },
  "drum_spec": {
    "kit": "one of: dub_kit | boombap_kit | trap_kit | cyber_kit | chip_kit | bossa_kit | doom_kit | house_kit | jazz_brush_kit",
    "kick_steps": [16 numbers between 0.0 and 1.0],
    "snare_steps": [16 numbers between 0.0 and 1.0],
    "hat_steps": [16 numbers between 0.0 and 1.4],
    "perc_steps": [16 numbers between 0.0 and 1.0],
    "tuning": {
      "kick_punch": 0.75,
      "snare_snap": 0.75,
      "hat_sizzle": 0.68,
      "rim_dub_echo": 0.25,
      "hat_pan": 0.24,
      "perc_pan": -0.26
    }
  },
  "fx_spec": {
    "delay_wet": 0.18,
    "delay_steps": 3,
    "reverb_wet": 0.18,
    "filter_cutoff": 9200,
    "crush": 0.0
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Morph "${pieceComposer} — ${pieceTitle}" into "${targetGenre}". Choose expressive instrument patches, tailor the ADSR curves, breath/rotary/chorus/drive parameters, stereo panning, and velocities so the lead melody shines on top of an authentic "${targetGenre}" arrangement.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.75
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ message: error.error?.message || 'OpenAI API error' });
    }

    const prediction = await response.json();
    const rawText = prediction.choices[0].message.content;
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('MIDI Morph API Error:', err);
    return res.status(500).json({ message: 'Error generating MIDI arrangement: ' + err.message });
  }
}
