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

CRITICAL MIX, TEMPO, SOUND DESIGN & ARRANGEMENT RULES:
1. THE MAIN MELODY IS KING: Listeners want to immediately recognize "${pieceTitle}" first, and hear the genre groove supporting it underneath.
   - Prefer "authentic", "laid_back_swing", or "offbeat_skank_push" for melody_spec.feel so the melody remains 100% recognizable.
   - Keep transpose_semitones between -2 and +2.
   - For scale_mode, choose ONLY from: "keep_original", "parallel_minor", "parallel_major", "dorian", or "harmonic_minor".

2. AUTHENTIC GENRE TEMPO (tempo_bpm), SWING (swing), ECHO MIX (fx_spec.delay_wet) & TONE FILTER (fx_spec.filter_cutoff):
   - NEVER use a generic default tempo, swing, echo, or filter! You MUST actively tailor tempo_bpm, swing, fx_spec.delay_wet, and fx_spec.filter_cutoff to match "${targetGenre}":
   - Dub Reggae / Roots One-Drop: tempo_bpm 74..80, swing 0.20..0.26, delay_wet 0.26..0.38, filter_cutoff 7200..8600
   - 90s East Coast Boom-Bap / Hip-Hop: tempo_bpm 86..94, swing 0.35..0.42, delay_wet 0.12..0.18, filter_cutoff 6800..8000
   - 2 AM Lo-Fi Study Tape / Chillhop: tempo_bpm 70..76, swing 0.36..0.44, delay_wet 0.16..0.22, filter_cutoff 4400..5800 (warm muffled tape!)
   - Parisian Café Accordion Musette: tempo_bpm 110..118, swing 0.25..0.32, delay_wet 0.10..0.14, filter_cutoff 9000..10500
   - 60s Blue Note Roto-Organ Soul-Jazz: tempo_bpm 105..114, swing 0.32..0.38, delay_wet 0.12..0.16, filter_cutoff 8500..9600
   - Ipanema Bossa Nova: tempo_bpm 118..126, swing 0.12..0.18, delay_wet 0.12..0.18, filter_cutoff 8600..9800
   - New Orleans Second-Line Brass: tempo_bpm 112..120, swing 0.32..0.38, delay_wet 0.10..0.15, filter_cutoff 8800..10200
   - Cyberpunk Darksynth / Synthwave: tempo_bpm 116..124, swing 0.00..0.03 (tight 16th grid!), delay_wet 0.20..0.26, filter_cutoff 9600..12000
   - 1989 Acid House (TB-303): tempo_bpm 124..130, swing 0.08..0.14, delay_wet 0.22..0.28, filter_cutoff 9200..11500
   - 8-Bit NES Boss Chiptune: tempo_bpm 134..148, swing 0.00 (strictly quantized!), delay_wet 0.08..0.12, filter_cutoff 11500..14000
   - 808 Dark Trap / Phonk: tempo_bpm 134..144, swing 0.04..0.08, delay_wet 0.18..0.24, filter_cutoff 9400..11000
   - 3rd-Wave Ska Punk: tempo_bpm 144..156, swing 0.04..0.08, delay_wet 0.08..0.14, filter_cutoff 9800..11500
   - Ennio Spaghetti Western: tempo_bpm 96..104, swing 0.10..0.16, delay_wet 0.26..0.34 (canyon echo!), filter_cutoff 8200..9200
   - Sabbath Doom Sludge: tempo_bpm 66..73, swing 0.08..0.14, delay_wet 0.18..0.24, filter_cutoff 5600..7000 (dark heavy cab!)
   - For Custom User Prompts: Infer the true BPM, swing, echo wet mix, and filter cutoff of the requested genre/vibe (e.g., Drum & Bass/Jungle = 160..170 BPM; Disco/Funk = 116..124 BPM; Techno/Eurodance = 132..140 BPM; Vaporwave = 68..76 BPM with 4800 Hz filter).

3. INSTRUMENT-SPECIFIC SOUND DESIGN & ARTICULATION (ADSR, Breath, Rotary, Chorus, Drive, Panning):
   - Flutes & Pan Pipes ('flute_airy', 'whistle_western'): Use soft breathy attack (attack: 0.025..0.045, decay: 0.20, sustain: 0.80, release: 0.14), set breath_noise: 0.18..0.30 for realistic embouchure chiff + air, vibrato_rate: 5.5, vibrato_depth: 12..16, and lush reverb send (0.28..0.38).
   - Accordions & Melodicas ('accordion_musette', 'melodica_dub'): Use 3-reed wet musette chorus (chorus_detune: 14..18 for accordion, 8..11 for melodica), bellows swell attack (attack: 0.018..0.030, sustain: 0.85, release: 0.09), breath_noise: 0.08..0.14, and for Dub Melodica set dub_echo_throws: 0.35..0.45.
   - Roto Organs ('roto_organ', 'organ_skank'): Authentic 9-drawbar Hammond B3 + Leslie Rotary Speaker! Set rotary_speed to "fast" (6.2Hz tremolo swirl), "slow" (chorale), or "accel" (ramps slow->fast on held notes), drive: 0.18..0.35 for warm tube overdrive, instant key-click attack (0.003), and tight release (0.035 for skanks, 0.08 for leads).
   - Electric Pianos & Mallets ('rhodes_ep', 'warm_rhodes', 'vibraphone_jazz', 'dark_trap_bells'): 2-op FM tine/mallet strike with percussive attack (0.004), longer decay (0.28..0.45), lower sustain (0.25..0.50), and warm release (0.15..0.28).
   - Brass & Doom Fuzz ('brass_horn', 'fuzz_lead', 'doom_power_stack'): Use drive: 0.25..0.40 for brass growl or 0.55..0.75 for doom fuzz, and expressive vibrato on sustained notes.

4. STEREO STAGING & VELOCITY HIERARCHY (NO MUD):
   - Lead Melody pan near center (-0.08 to +0.08), vel_curve.base high (0.92..1.0).
   - Backing Chords panned slightly right (+0.22 to +0.35) so they never mask the center melody, with vel_scale modest (0.42..0.55) and filter_cutoff warm (1400..2400 Hz).
   - Bassline panned dead-center (0.0), vel_scale (0.80..0.92).
   - Drum Kit hats panned slightly right (+0.22) and percussion slightly left (-0.25).

Output ONLY valid raw JSON with actual numeric/string values (replace all <...> descriptions with real numbers/strings):
{
  "mashup_title": "<string: witty studio title for the morphed track>",
  "producer_log": "<string: 1-2 concise sentences explaining the tempo, sound design, instrument pairing, and groove applied>",
  "tempo_bpm": "<number: 65..170 tailored specifically to the target genre>",
  "swing": "<number: 0.00..0.45 tailored specifically to the target genre>",
  "scale_mode": "<string: keep_original | parallel_minor | parallel_major | dorian | harmonic_minor>",
  "transpose_semitones": "<integer: -2..2>",
  "melody_spec": {
    "patch": "<string: flute_airy | accordion_musette | roto_organ | melodica_dub | brass_horn | whistle_western | rhodes_ep | vibraphone_jazz | supersaw_cyber | acid_303_lead | square_8bit | fuzz_lead | nylon_guitar>",
    "feel": "<string: authentic | offbeat_skank_push | laid_back_swing>",
    "octave_shift": "<integer: -1..1>",
    "pan": "<number: -0.08..0.08>",
    "adsr": {
      "attack": "<number: 0.002..0.06>",
      "decay": "<number: 0.08..0.45>",
      "sustain": "<number: 0.35..0.92>",
      "release": "<number: 0.025..0.28>"
    },
    "vel_curve": {
      "base": "<number: 0.92..0.98>",
      "accent_downbeat": "<number: 0.03..0.10>",
      "humanize": "<number: 0.02..0.08>"
    },
    "timbre": {
      "filter_cutoff": "<number: 2800..8500>",
      "filter_q": "<number: 0.8..5.5>",
      "vibrato_rate": "<number: 4.5..6.5>",
      "vibrato_depth": "<number: 0..18>",
      "breath_noise": "<number: 0.00..0.30>",
      "chorus_detune": "<number: 0..18>",
      "rotary_speed": "<string: off | slow | fast | accel>",
      "drive": "<number: 0.04..0.70>"
    },
    "sends": {
      "reverb": "<number: 0.06..0.36>",
      "delay": "<number: 0.08..0.32>",
      "dub_echo_throws": "<number: 0.05..0.42>"
    }
  },
  "chord_spec": {
    "patch": "<string: roto_organ | organ_skank | accordion_musette | warm_rhodes | nylon_guitar | clavinet_funk | honky_tonk | cyber_pwm | chip_arp | dark_trap_bells | doom_power_stack>",
    "pattern": "<string: reggae_skank | bossa_clave | boombap_stabs | cyber_16th_arp | trap_half_bells | ska_upstrokes | doom_wall | ragtime_stride | house_offbeat | western_gallop>",
    "voicing": "<string: triad | jazz_7th | power_5th>",
    "pan": "<number: 0.22..0.34>",
    "vel_scale": "<number: 0.42..0.52>",
    "adsr": {
      "attack": "<number: 0.003..0.02>",
      "decay": "<number: 0.08..0.30>",
      "sustain": "<number: 0.25..0.65>",
      "release": "<number: 0.02..0.15>"
    },
    "timbre": {
      "filter_cutoff": "<number: 1400..2500>",
      "filter_q": "<number: 0.8..2.0>",
      "rotary_speed": "<string: off | slow | fast | accel>",
      "chorus_detune": "<number: 0..14>",
      "drive": "<number: 0.05..0.50>"
    },
    "sends": {
      "reverb": "<number: 0.04..0.16>",
      "delay": "<number: 0.00..0.08>"
    }
  },
  "bass_spec": {
    "patch": "<string: sub_dub | trap_808 | upright_jazz | slap_funk | tb303_acid | reese_cyber | nes_triangle | doom_fuzz>",
    "pattern": "<string: one_drop_bubble | trap_808_glide | cyber_rolling_16th | walking_jazz | bossa_tumbao | boombap_pocket | acid_303_sequence | western_alternating | doom_drone>",
    "pan": 0.0,
    "vel_scale": "<number: 0.82..0.90>",
    "adsr": {
      "attack": "<number: 0.003..0.01>",
      "decay": "<number: 0.14..0.28>",
      "sustain": "<number: 0.45..0.75>",
      "release": "<number: 0.04..0.14>"
    },
    "timbre": {
      "filter_cutoff": "<number: 320..1200>",
      "filter_q": "<number: 0.9..5.5>",
      "drive": "<number: 0.08..0.50>"
    }
  },
  "drum_spec": {
    "kit": "<string: dub_kit | boombap_kit | trap_kit | cyber_kit | chip_kit | bossa_kit | doom_kit | house_kit | jazz_brush_kit>",
    "kick_steps": "[16 numbers 0.0..1.0]",
    "snare_steps": "[16 numbers 0.0..1.0]",
    "hat_steps": "[16 numbers 0.0..1.4]",
    "perc_steps": "[16 numbers 0.0..1.0]",
    "tuning": {
      "kick_punch": "<number: 0.60..0.90>",
      "snare_snap": "<number: 0.60..0.88>",
      "hat_sizzle": "<number: 0.50..0.82>",
      "rim_dub_echo": "<number: 0.05..0.38>",
      "hat_pan": 0.24,
      "perc_pan": -0.25
    }
  },
  "fx_spec": {
    "delay_wet": "<number: 0.08..0.36 tailored to the target genre>",
    "delay_steps": "<integer: 2..4>",
    "reverb_wet": "<number: 0.06..0.30>",
    "filter_cutoff": "<number: 4400..13500 tailored to the target genre>",
    "crush": "<number: 0.0..0.30>"
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
            content: `Morph "${pieceComposer} — ${pieceTitle}" into "${targetGenre}". Set an authentic tempo_bpm, swing, fx_spec.delay_wet, and fx_spec.filter_cutoff specifically for "${targetGenre}", and dial in expressive instrument patches, ADSR curves, breath/rotary/chorus/drive parameters, stereo panning, and drum patterns. Return real JSON numbers (not placeholder strings) for all numeric fields.`
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
