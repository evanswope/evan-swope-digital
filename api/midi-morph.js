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

  const systemPrompt = `You are a master AI Music Theorist, Symbolic MIDI Arranger, and Studio Mix Engineer for an interactive Web Audio DAW called "MIDI GENRE MORPHER".
The user has chosen:
- Source Piece: "${pieceComposer} — ${pieceTitle}" (Original Key: ${origKey} ${origMode}, Original Tempo: ${origBpm} BPM)
- Target Style (${isCustomMode ? 'User Custom AI Prompt' : 'Preset Genre'}): "${targetGenre}"

CRITICAL MIX & ARRANGEMENT RULES:
1. THE MAIN MELODY IS KING: Listeners want to immediately recognize "${pieceTitle}" first, and hear the genre groove supporting it underneath.
   - Prefer "authentic" or "laid_back_swing" or "offbeat_skank_push" for melody_spec.feel so the melody remains 100% recognizable.
   - Keep transpose_semitones between -2 and +2.
   - For scale_mode, choose ONLY from: "keep_original", "parallel_minor", "parallel_major", "dorian", or "harmonic_minor".
2. KEEP BACKING TRACKS SPARSE, TIGHT, AND CLEAN (NO MUD):
   - Keep fx_spec.delay_wet modest (0.12 to 0.28) and fx_spec.reverb_wet modest (0.10 to 0.25) so the mix is punchy and clear.
   - Keep fx_spec.crush low (0.0 to 0.25, or up to 0.35 only for 8-bit chiptune).
3. Genre Fingerprints:
   - Reggae / Dub: ~76 BPM, swing ~0.22, 'melodica_dub' or 'brass_horn' lead, 'organ_skank' chords with 'reggae_skank' pattern, 'sub_dub' bass with 'one_drop_bubble', 'dub_kit' drums with One-Drop kick+rimshot on step 8.
   - 90s Boom-Bap Hip-Hop: ~88 BPM, swing ~0.38, 'vibraphone_jazz' or 'rhodes_ep' lead, 'warm_rhodes' chords with 'boombap_stabs', 'upright_jazz' bass with 'boombap_pocket', punchy kick on 0, 7, 10 and snare on 4, 12.
   - 808 Dark Trap / Phonk: ~140 BPM (half-time snare on step 8), 'flute_airy' or 'brass_horn' lead, 'dark_trap_bells' chords with 'trap_half_bells', 'trap_808' bass with 'trap_808_glide', 'trap_kit' drums with hi-hat rolls (use 1.35 on 2-3 hat_steps).
   - Cyberpunk Darksynth: ~118 BPM, swing 0.0, 'supersaw_cyber' lead, 'cyber_pwm' chords with 'cyber_16th_arp', 'reese_cyber' bass with 'cyber_rolling_16th', 'cyber_kit' drums.
   - Bossa Nova: ~122 BPM, swing 0.14, 'flute_airy' lead, 'nylon_guitar' chords with 'bossa_clave', 'upright_jazz' bass with 'bossa_tumbao', 'bossa_kit' rimshot clave.
   - 8-Bit NES Chiptune: ~138 BPM, swing 0.0, 'square_8bit' lead, 'chip_arp' chords with 'cyber_16th_arp', 'nes_triangle' bass, 'chip_kit' drums.
   - Acid House (TB-303): ~126 BPM, four-on-the-floor kick (0, 4, 8, 12), offbeat open hats (2, 6, 10, 14), 'acid_303_lead' melody, 'tb303_acid' bass with 'acid_303_sequence'.
   - Spaghetti Western: ~100 BPM, 'whistle_western' lead, 'nylon_guitar' chords with 'western_gallop', 'upright_jazz' bass with 'western_alternating'.
   - Ska Punk: ~152 BPM, 'brass_horn' lead, 'organ_skank' chords with 'ska_upstrokes', 'slap_funk' bass with 'walking_jazz'.
   - Lo-Fi Study Tape: ~75 BPM, swing 0.40, 'rhodes_ep' lead, 'warm_rhodes' chords with 'boombap_stabs', 'sub_dub' bass with 'boombap_pocket'.
   - Doom Metal: ~70 BPM, 'fuzz_lead' melody, 'doom_power_stack' chords with 'doom_wall', 'doom_fuzz' bass with 'doom_drone'.
   - New Orleans Second-Line Brass: ~114 BPM, swing 0.35, 'brass_horn' lead, 'honky_tonk' chords with 'ragtime_stride', 'upright_jazz' bass with 'walking_jazz'.

Output ONLY valid raw JSON matching this exact schema:
{
  "mashup_title": "Witty studio title for the morphed track (no double quotes inside string)",
  "producer_log": "1-2 concise sentences explaining how the iconic melody is framed by this genre's groove, bass, and chords.",
  "tempo_bpm": 78,
  "swing": 0.22,
  "scale_mode": "one of: keep_original | parallel_minor | parallel_major | dorian | harmonic_minor",
  "transpose_semitones": 0,
  "melody_spec": {
    "patch": "one of: melodica_dub | supersaw_cyber | square_8bit | rhodes_ep | acid_303_lead | flute_airy | fuzz_lead | vibraphone_jazz | brass_horn | whistle_western",
    "feel": "one of: authentic | offbeat_skank_push | laid_back_swing",
    "octave_shift": 0,
    "dub_echo_throws": 0.2
  },
  "chord_spec": {
    "patch": "one of: organ_skank | warm_rhodes | cyber_pwm | chip_arp | nylon_guitar | doom_power_stack | clavinet_funk | dark_trap_bells | honky_tonk",
    "pattern": "one of: reggae_skank | bossa_clave | boombap_stabs | cyber_16th_arp | trap_half_bells | ska_upstrokes | doom_wall | ragtime_stride | house_offbeat | western_gallop",
    "voicing": "one of: triad | jazz_7th | power_5th"
  },
  "bass_spec": {
    "patch": "one of: sub_dub | trap_808 | reese_cyber | upright_jazz | tb303_acid | nes_triangle | doom_fuzz | slap_funk",
    "pattern": "one of: one_drop_bubble | trap_808_glide | cyber_rolling_16th | walking_jazz | bossa_tumbao | boombap_pocket | acid_303_sequence | western_alternating | doom_drone"
  },
  "drum_spec": {
    "kit": "one of: dub_kit | boombap_kit | trap_kit | cyber_kit | chip_kit | bossa_kit | doom_kit | house_kit",
    "kick_steps": [16 numbers between 0.0 and 1.0],
    "snare_steps": [16 numbers between 0.0 and 1.0],
    "hat_steps": [16 numbers between 0.0 and 1.4],
    "perc_steps": [16 numbers between 0.0 and 1.0]
  },
  "fx_spec": {
    "delay_wet": 0.18,
    "delay_steps": 3,
    "reverb_wet": 0.16,
    "filter_cutoff": 8500,
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
            content: `Morph "${pieceComposer} — ${pieceTitle}" into "${targetGenre}". Keep the main melody clear and recognizable on top of a tight, authentic "${targetGenre}" rhythm section.`
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
