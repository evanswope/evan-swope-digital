export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { composerId, pieceMeta, genreId, genreLabel, customPrompt } = req.body || {};
  const token = process.env.OPENAI_API_KEY;

  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing OPENAI_API_KEY' });
  }

  const pieceTitle = pieceMeta?.title || 'Classical Masterpiece';
  const pieceComposer = pieceMeta?.composer || 'Master Composer';
  const origKey = pieceMeta?.key || 'G';
  const origMode = pieceMeta?.mode || 'major';
  const origBpm = pieceMeta?.bpm || 120;
  const targetGenre = customPrompt?.trim()
    ? `${genreLabel || genreId} (${customPrompt.trim()})`
    : (genreLabel || genreId || 'King Tubby Dub Reggae');

  const isWildcardSong = composerId === 'ai_wildcard';

  const systemPrompt = `You are an avant-garde AI Music Theorist, Symbolic MIDI Arranger, and Studio Producer for an interactive Web Audio DAW called "MIDI GENRE MORPHER".
The user has chosen:
- Source Artist / Piece: "${pieceComposer} — ${pieceTitle}" (Original Key: ${origKey} ${origMode}, Original Tempo: ${origBpm} BPM)
- Target Genre / Style to Morph Into: "${targetGenre}"
${customPrompt ? `- Additional User Direction: "${customPrompt}"` : ''}

Your job is to design a complete, musically authentic, and wildly entertaining Symbolic MIDI Transformation & Synthesizer Arrangement Blueprint in JSON format that morphs the source composition into "${targetGenre}".

CRITICAL MUSICAL RULES:
1. Make the genre transformation unmistakable and authentic to the rhythmic, harmonic, and timbral DNA of "${targetGenre}":
   - For Reggae / Dub: ~72-82 BPM, swing ~0.22, 'dorian' or 'parallel_minor' or 'keep_original', 'melodica_dub' or 'brass_horn' lead with 'offbeat_skank_push', 'organ_skank' chords with 'reggae_skank' pattern, 'sub_dub' bass with 'one_drop_bubble' pattern (rest on beat 1!), 'dub_kit' drums with One-Drop kick+rimshot on beat 3 (step 8), high dub_delay_wet (0.45-0.60).
   - For 90s Boom-Bap Hip-Hop: ~86-96 BPM, heavy swing (0.35-0.48), 'dorian' or 'parallel_minor', 'rhodes_ep' or 'vibraphone_jazz' or 'brass_horn' lead, 'warm_rhodes' chords with 'boombap_stabs' and 'jazz_7th'/'lush_9th' voicing, 'upright_jazz' or 'sub_dub' bass with 'boombap_pocket', punchy kick on 0, 7, 10 and crisp snare on 4, 12.
   - For 808 Trap / Phonk: ~135-150 BPM (half-time snare on step 8!), 'phrygian_dominant' or 'harmonic_minor' or 'parallel_minor', 'flute_airy' or 'brass_horn' or 'vibraphone_jazz' lead, 'dark_trap_bells' chords with 'trap_half_bells', 'trap_808' bass with 'trap_808_glide', 'trap_kit' drums with booming kicks and rapid hi-hat rolls (use values like 1.4 in hat_steps to trigger 32nd-note trap hat rolls!).
   - For Cyberpunk Darksynth: ~112-128 BPM, straight swing (0.0-0.08), 'harmonic_minor' or 'phrygian_dominant' or 'parallel_minor', 'supersaw_cyber' lead, 'cyber_pwm' chords with 'cyber_arp_16th', 'reese_cyber' bass with 'cyber_rolling_16th', 'cyber_kit' gated LinnDrum beat (kick 0, 4, 8, 12 or 0, 6, 8, 14; snare 4, 12).
   - For Bossa Nova / Samba Jazz: ~118-132 BPM, subtle swing (0.15), 'keep_original' or 'lydian' or 'dorian', 'flute_airy' or 'vibraphone_jazz' lead, 'nylon_guitar' or 'warm_rhodes' chords with 'bossa_clave' and 'lush_9th' voicing, 'upright_jazz' bass with 'bossa_tumbao', 'bossa_kit' rimshot clave pattern.
   - For 8-Bit NES Chiptune: ~130-160 BPM, swing 0.0, 'square_8bit' lead with 'double_time_arp' or 'staccato_chop', 'chip_arp' chords with 'cyber_arp_16th', 'nes_triangle' bass, 'chip_kit' drums, bitcrush 0.45-0.70.
   - For Acid House (TB-303): ~124-132 BPM, four-on-the-floor kick (steps 0, 4, 8, 12), open hats on offbeats (steps 2, 6, 10, 14 with value 1.3), 'acid_303_lead' melody, 'tb303_acid' bass with 'acid_303_sequence'.
   - For Spaghetti Western: ~95-112 BPM, 'harmonic_minor' or 'phrygian_dominant', 'whistle_western' or 'brass_horn' lead, 'nylon_guitar' chords with 'western_gallop', 'upright_jazz' bass with 'western_alternating', generous spring reverb (0.55).
   - For Doom Metal / Industrial: ~64-78 BPM, 'phrygian_dominant' or 'parallel_minor', 'fuzz_lead' melody, 'doom_power_stack' chords with 'doom_wall' and 'power_5th' voicing, 'doom_fuzz' bass with 'doom_drone', crushing slow drums.
   - For any custom user prompt, invent the most fitting combination of these parameters!

2. Output ONLY valid raw JSON matching this exact schema:
{
  "mashup_title": "Witty, creative title for the morphed track (no double quotes inside string)",
  "producer_log": "1-2 punchy studio sentences explaining how you warped the composer's piece into this genre (mention tempo, mode/scale, bass/chord style, and FX).",
  "tempo_bpm": 78,
  "swing": 0.25,
  "scale_mode": "one of: keep_original | parallel_minor | parallel_major | dorian | phrygian_dominant | blues | harmonic_minor | lydian | minor_pentatonic",
  "transpose_semitones": 0,
  "melody_spec": {
    "patch": "one of: melodica_dub | supersaw_cyber | square_8bit | rhodes_ep | acid_303_lead | flute_airy | fuzz_lead | vibraphone_jazz | brass_horn | whistle_western",
    "feel": "one of: authentic | offbeat_skank_push | laid_back_swing | half_time_float | staccato_chop | double_time_arp",
    "octave_shift": 0,
    "dub_echo_throws": 0.35
  },
  "chord_spec": {
    "patch": "one of: organ_skank | warm_rhodes | cyber_pwm | chip_arp | nylon_guitar | doom_power_stack | clavinet_funk | dark_trap_bells | honky_tonk",
    "pattern": "one of: reggae_skank | bossa_clave | boombap_stabs | cyber_16th_arp | trap_half_bells | ska_upstrokes | doom_wall | ragtime_stride | house_offbeat | western_gallop",
    "voicing": "one of: triad | jazz_7th | lush_9th | power_5th | open_spread"
  },
  "bass_spec": {
    "patch": "one of: sub_dub | trap_808 | reese_cyber | upright_jazz | tb303_acid | nes_triangle | doom_fuzz | slap_funk",
    "pattern": "one of: one_drop_bubble | trap_808_glide | cyber_rolling_16th | walking_jazz | bossa_tumbao | boombap_pocket | acid_303_sequence | western_alternating | doom_drone"
  },
  "drum_spec": {
    "kit": "one of: dub_kit | boombap_kit | trap_kit | cyber_kit | chip_kit | bossa_kit | doom_kit | house_kit",
    "kick_steps": [16 numbers between 0.0 and 1.0 representing 16th-note steps 0..15],
    "snare_steps": [16 numbers between 0.0 and 1.0 representing 16th-note steps 0..15],
    "hat_steps": [16 numbers between 0.0 and 1.5 representing 16th-note steps 0..15; use 1.35 for open-hat or 32nd-note trap roll],
    "perc_steps": [16 numbers between 0.0 and 1.0 representing 16th-note steps 0..15]
  },
  "ai_counter_melody": [16 elements for steps 0..15: use null for rest, or an integer scale degree 0..11 for a catchy genre counter-riff],
  "fx_spec": {
    "delay_wet": 0.35,
    "delay_steps": 3,
    "reverb_wet": 0.35,
    "filter_cutoff": 6500,
    "crush": 0.0,
    "wow_flutter": 0.12
  }${isWildcardSong ? `,
  "wildcard_score": {
    "key_midi_root": 60,
    "chords": [
      {"bar": 0, "deg": 0, "qual": "min"},
      {"bar": 1, "deg": 5, "qual": "maj"},
      {"bar": 2, "deg": 3, "qual": "min"},
      {"bar": 3, "deg": 7, "qual": "dom7"}
    ],
    "melody_events": [
      {"step": 0, "dur": 2, "semi": 0},
      {"step": 2, "dur": 2, "semi": 3},
      {"step": 4, "dur": 4, "semi": 7}
    ]
  }` : ''}
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
            content: `Morph "${pieceComposer} — ${pieceTitle}" into "${targetGenre}". Return the complete JSON arrangement blueprint.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85
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
