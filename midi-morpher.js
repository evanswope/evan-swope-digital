/* ==========================================================================
   MIDI GENRE MORPHER — Symbolic AI Arranger, Web Audio DAW & MIDI/MP3 Exporter
   ========================================================================== */

(function () {
  // --------------------------------------------------------------------------
  // 1. ICONIC SYMBOLIC SCORE LIBRARY (8 Bars = 128 16th-note steps per loop)
  // --------------------------------------------------------------------------
  const COMPOSER_LIBRARY = {
    mozart_nachtmusik: {
      id: 'mozart_nachtmusik',
      composer: 'W.A. Mozart',
      title: 'Eine kleine Nachtmusik (K. 525)',
      key: 'G',
      keyRoot: 67, // G4
      mode: 'major',
      bpm: 128,
      chords: [
        { bar: 0, deg: 0, qual: 'maj' },
        { bar: 1, deg: 0, qual: 'maj' },
        { bar: 2, deg: 7, qual: 'dom7' },
        { bar: 3, deg: 7, qual: 'dom7' },
        { bar: 4, deg: 0, qual: 'maj' },
        { bar: 5, deg: 5, qual: 'maj' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'maj' }
      ],
      // step (0..127 in 16ths), dur (in 16ths), semi (semitones from keyRoot G4=67)
      melody: [
        // Bar 0: G4 - D4 - G4 - D4 - G4-B4-D5
        { step: 0, dur: 6, semi: 0 }, { step: 6, dur: 2, semi: -5 },
        { step: 8, dur: 6, semi: 0 }, { step: 14, dur: 2, semi: -5 },
        // Bar 1: G4 - B4 - D5 - G5
        { step: 16, dur: 2, semi: 0 }, { step: 18, dur: 2, semi: 4 },
        { step: 20, dur: 2, semi: 7 }, { step: 22, dur: 6, semi: 12 },
        // Bar 2: F#5 - C5 - F#5 - C5
        { step: 32, dur: 6, semi: 11 }, { step: 38, dur: 2, semi: 5 },
        { step: 40, dur: 6, semi: 11 }, { step: 46, dur: 2, semi: 5 },
        // Bar 3: F#5 - A4 - C5 - F#5 - D5
        { step: 48, dur: 2, semi: 11 }, { step: 50, dur: 2, semi: 2 },
        { step: 52, dur: 2, semi: 5 }, { step: 54, dur: 2, semi: 11 },
        { step: 56, dur: 6, semi: 7 },
        // Bar 4: G4 - G4 - B4-A4-G4
        { step: 64, dur: 4, semi: 7 }, { step: 68, dur: 4, semi: 7 },
        { step: 72, dur: 2, semi: 11 }, { step: 74, dur: 2, semi: 9 },
        { step: 76, dur: 2, semi: 7 }, { step: 78, dur: 2, semi: 7 },
        // Bar 5: C5 - A4 - F#4 - A4
        { step: 80, dur: 4, semi: 5 }, { step: 84, dur: 4, semi: 5 },
        { step: 88, dur: 2, semi: 9 }, { step: 90, dur: 2, semi: 7 },
        { step: 92, dur: 2, semi: 5 }, { step: 94, dur: 2, semi: 4 },
        // Bar 6: D5 - B4 - G4 - A4 - F#4
        { step: 96, dur: 4, semi: 2 }, { step: 100, dur: 4, semi: 4 },
        { step: 104, dur: 4, semi: 5 }, { step: 108, dur: 4, semi: 2 },
        // Bar 7: G4 resolution + fanfare pickup
        { step: 112, dur: 8, semi: 0 }, { step: 120, dur: 4, semi: 4 }, { step: 124, dur: 4, semi: 7 }
      ]
    },

    mozart_turca: {
      id: 'mozart_turca',
      composer: 'W.A. Mozart',
      title: 'Rondo Alla Turca (Turkish March)',
      key: 'A',
      keyRoot: 69, // A4
      mode: 'minor',
      bpm: 124,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 0, qual: 'min' },
        { bar: 2, deg: 5, qual: 'maj' },
        { bar: 3, deg: 7, qual: 'dom7' },
        { bar: 4, deg: 0, qual: 'min' },
        { bar: 5, deg: 2, qual: 'dom7' },
        { bar: 6, deg: 7, qual: 'min' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Pickup & Bar 0: B4-A4-G#4-A4 - C5
        { step: 0, dur: 1, semi: 2 }, { step: 1, dur: 1, semi: 0 }, { step: 2, dur: 1, semi: -1 }, { step: 3, dur: 1, semi: 0 },
        { step: 4, dur: 8, semi: 3 },
        // Bar 1: D5-C5-B4-C5 - E5
        { step: 16, dur: 1, semi: 5 }, { step: 17, dur: 1, semi: 3 }, { step: 18, dur: 1, semi: 2 }, { step: 19, dur: 1, semi: 3 },
        { step: 20, dur: 8, semi: 7 },
        // Bar 2: F5-E5-D#5-E5 - B5-A5-G#5-A5
        { step: 32, dur: 1, semi: 8 }, { step: 33, dur: 1, semi: 7 }, { step: 34, dur: 1, semi: 6 }, { step: 35, dur: 1, semi: 7 },
        { step: 36, dur: 1, semi: 14 }, { step: 37, dur: 1, semi: 12 }, { step: 38, dur: 1, semi: 11 }, { step: 39, dur: 1, semi: 12 },
        { step: 40, dur: 1, semi: 14 }, { step: 41, dur: 1, semi: 12 }, { step: 42, dur: 1, semi: 11 }, { step: 43, dur: 1, semi: 12 },
        { step: 44, dur: 4, semi: 15 },
        // Bar 3: A5 - C6 - B5 - A5 - G5 - A5
        { step: 48, dur: 4, semi: 12 }, { step: 52, dur: 4, semi: 15 },
        { step: 56, dur: 2, semi: 14 }, { step: 58, dur: 2, semi: 12 }, { step: 60, dur: 2, semi: 11 }, { step: 62, dur: 2, semi: 12 },
        // Bar 4: Repeat phrase B4-A4-G#4-A4 - C5
        { step: 64, dur: 1, semi: 2 }, { step: 65, dur: 1, semi: 0 }, { step: 66, dur: 1, semi: -1 }, { step: 67, dur: 1, semi: 0 },
        { step: 68, dur: 8, semi: 3 },
        // Bar 5: D5-C5-B4-C5 - E5
        { step: 80, dur: 1, semi: 5 }, { step: 81, dur: 1, semi: 3 }, { step: 82, dur: 1, semi: 2 }, { step: 83, dur: 1, semi: 3 },
        { step: 84, dur: 8, semi: 7 },
        // Bar 6: E5 - F5 - E5 - D5 - C5 - B4
        { step: 96, dur: 4, semi: 7 }, { step: 100, dur: 4, semi: 8 },
        { step: 104, dur: 4, semi: 7 }, { step: 108, dur: 4, semi: 5 },
        // Bar 7: C5 - B4 - A4
        { step: 112, dur: 4, semi: 3 }, { step: 116, dur: 4, semi: 2 }, { step: 120, dur: 8, semi: 0 }
      ]
    },

    bach_toccata: {
      id: 'bach_toccata',
      composer: 'J.S. Bach',
      title: 'Toccata & Fugue in D Minor (BWV 565)',
      key: 'D',
      keyRoot: 62, // D4
      mode: 'minor',
      bpm: 110,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 7, qual: 'dom7' },
        { bar: 2, deg: 0, qual: 'min' },
        { bar: 3, deg: 5, qual: 'min' },
        { bar: 4, deg: 8, qual: 'maj' },
        { bar: 5, deg: 7, qual: 'dom7' },
        { bar: 6, deg: 0, qual: 'min' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Bar 0: Iconic Mordent A4-G4-A4... G4-F4-E4-D4-C#4-D4
        { step: 0, dur: 1, semi: 7 }, { step: 1, dur: 1, semi: 5 }, { step: 2, dur: 6, semi: 7 },
        { step: 8, dur: 1, semi: 5 }, { step: 9, dur: 1, semi: 3 }, { step: 10, dur: 1, semi: 2 }, { step: 11, dur: 1, semi: 0 },
        { step: 12, dur: 2, semi: -1 }, { step: 14, dur: 2, semi: 0 },
        // Bar 1: Second Mordent A4-G4-A4... E4-F4-C#4-D4
        { step: 16, dur: 1, semi: 19 }, { step: 17, dur: 1, semi: 17 }, { step: 18, dur: 6, semi: 19 },
        { step: 24, dur: 2, semi: 14 }, { step: 26, dur: 2, semi: 15 }, { step: 28, dur: 2, semi: 11 }, { step: 30, dur: 2, semi: 12 },
        // Bar 2-3: Baroque Diminished Arpeggio Sequence
        { step: 32, dur: 2, semi: -1 }, { step: 34, dur: 2, semi: 2 }, { step: 36, dur: 2, semi: 5 }, { step: 38, dur: 2, semi: 8 },
        { step: 40, dur: 2, semi: 7 }, { step: 42, dur: 2, semi: 5 }, { step: 44, dur: 2, semi: 3 }, { step: 46, dur: 2, semi: 2 },
        { step: 48, dur: 2, semi: 5 }, { step: 50, dur: 2, semi: 8 }, { step: 52, dur: 2, semi: 11 }, { step: 54, dur: 2, semi: 14 },
        { step: 56, dur: 2, semi: 12 }, { step: 58, dur: 2, semi: 10 }, { step: 60, dur: 2, semi: 8 }, { step: 62, dur: 2, semi: 7 },
        // Bar 4-5: Fugue Pedal Point Sequence (Bb4-A4-G4-A4-F4-A4-E4-A4...)
        { step: 64, dur: 2, semi: 8 }, { step: 66, dur: 2, semi: 7 }, { step: 68, dur: 2, semi: 5 }, { step: 70, dur: 2, semi: 7 },
        { step: 72, dur: 2, semi: 3 }, { step: 74, dur: 2, semi: 7 }, { step: 76, dur: 2, semi: 2 }, { step: 78, dur: 2, semi: 7 },
        { step: 80, dur: 2, semi: 0 }, { step: 82, dur: 2, semi: 7 }, { step: 84, dur: 2, semi: -1 }, { step: 86, dur: 2, semi: 7 },
        { step: 88, dur: 2, semi: 2 }, { step: 90, dur: 2, semi: 5 }, { step: 92, dur: 2, semi: 3 }, { step: 94, dur: 2, semi: 2 },
        // Bar 6-7: Cadence
        { step: 96, dur: 4, semi: 0 }, { step: 100, dur: 4, semi: 3 }, { step: 104, dur: 4, semi: 7 }, { step: 108, dur: 4, semi: 12 },
        { step: 112, dur: 4, semi: 11 }, { step: 116, dur: 4, semi: 7 }, { step: 120, dur: 8, semi: 12 }
      ]
    },

    beethoven_elise: {
      id: 'beethoven_elise',
      composer: 'Ludwig van Beethoven',
      title: 'Für Elise (Bagatelle No. 25)',
      key: 'A',
      keyRoot: 69, // A4
      mode: 'minor',
      bpm: 116,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 7, qual: 'dom7' },
        { bar: 2, deg: 0, qual: 'min' },
        { bar: 3, deg: 3, qual: 'maj' },
        { bar: 4, deg: 0, qual: 'min' },
        { bar: 5, deg: 7, qual: 'dom7' },
        { bar: 6, deg: 0, qual: 'min' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Bar 0: E5-D#5-E5-D#5-E5-B4-D5-C5-A4
        { step: 0, dur: 2, semi: 7 }, { step: 2, dur: 2, semi: 6 },
        { step: 4, dur: 2, semi: 7 }, { step: 6, dur: 2, semi: 6 },
        { step: 8, dur: 2, semi: 7 }, { step: 10, dur: 2, semi: 2 },
        { step: 12, dur: 2, semi: 5 }, { step: 14, dur: 2, semi: 3 },
        // Bar 1: A4 ... C4-E4-A4-B4
        { step: 16, dur: 6, semi: 0 },
        { step: 24, dur: 2, semi: -9 }, { step: 26, dur: 2, semi: -5 },
        { step: 28, dur: 2, semi: 0 }, { step: 30, dur: 2, semi: 2 },
        // Bar 2: E4-G#4-B4-C5
        { step: 32, dur: 6, semi: 2 },
        { step: 40, dur: 2, semi: -5 }, { step: 42, dur: 2, semi: -1 },
        { step: 44, dur: 2, semi: 2 }, { step: 46, dur: 2, semi: 3 },
        // Bar 3: E4 - E5-D#5-E5-D#5
        { step: 48, dur: 6, semi: 3 },
        { step: 56, dur: 2, semi: 7 }, { step: 58, dur: 2, semi: 6 },
        { step: 60, dur: 2, semi: 7 }, { step: 62, dur: 2, semi: 6 },
        // Bar 4: E5-B4-D5-C5-A4
        { step: 64, dur: 2, semi: 7 }, { step: 66, dur: 2, semi: 2 },
        { step: 68, dur: 2, semi: 5 }, { step: 70, dur: 2, semi: 3 },
        { step: 72, dur: 6, semi: 0 },
        // Bar 5: C4-E4-A4-B4 - E4-C5-B4-A4
        { step: 80, dur: 2, semi: -9 }, { step: 82, dur: 2, semi: -5 },
        { step: 84, dur: 2, semi: 0 }, { step: 86, dur: 4, semi: 2 },
        { step: 92, dur: 2, semi: 3 }, { step: 94, dur: 2, semi: 2 },
        // Bar 6: A4 -> B-section B4-C5-D5-E5
        { step: 96, dur: 6, semi: 0 },
        { step: 104, dur: 2, semi: 2 }, { step: 106, dur: 2, semi: 3 },
        { step: 108, dur: 2, semi: 5 }, { step: 110, dur: 2, semi: 7 },
        // Bar 7: G4-F5-E5-D5 -> C5-B4-A4
        { step: 112, dur: 4, semi: 8 }, { step: 116, dur: 2, semi: 7 },
        { step: 118, dur: 4, semi: 5 }, { step: 122, dur: 2, semi: 3 },
        { step: 124, dur: 4, semi: 2 }
      ]
    },

    beethoven_fifth: {
      id: 'beethoven_fifth',
      composer: 'Ludwig van Beethoven',
      title: 'Symphony No. 5 (Fate Motif)',
      key: 'C',
      keyRoot: 60, // C4
      mode: 'minor',
      bpm: 108,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 7, qual: 'dom7' },
        { bar: 2, deg: 0, qual: 'min' },
        { bar: 3, deg: 5, qual: 'min' },
        { bar: 4, deg: 8, qual: 'maj' },
        { bar: 5, deg: 3, qual: 'maj' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Bar 0: G4-G4-G4-Eb4
        { step: 2, dur: 2, semi: 7 }, { step: 4, dur: 2, semi: 7 }, { step: 6, dur: 2, semi: 7 }, { step: 8, dur: 8, semi: 3 },
        // Bar 1: F4-F4-F4-D4
        { step: 18, dur: 2, semi: 5 }, { step: 20, dur: 2, semi: 5 }, { step: 22, dur: 2, semi: 5 }, { step: 24, dur: 8, semi: 2 },
        // Bar 2: G4-G4-G4-Eb4 - Ab4-Ab4-Ab4-G4
        { step: 34, dur: 2, semi: 7 }, { step: 36, dur: 2, semi: 7 }, { step: 38, dur: 2, semi: 7 }, { step: 40, dur: 6, semi: 3 },
        // Bar 3: Ab4-Ab4-Ab4-F4
        { step: 50, dur: 2, semi: 8 }, { step: 52, dur: 2, semi: 8 }, { step: 54, dur: 2, semi: 8 }, { step: 56, dur: 6, semi: 5 },
        // Bar 4: D5-D5-D5-B4
        { step: 66, dur: 2, semi: 14 }, { step: 68, dur: 2, semi: 14 }, { step: 70, dur: 2, semi: 14 }, { step: 72, dur: 6, semi: 11 },
        // Bar 5: C5-C5-C5-G4
        { step: 82, dur: 2, semi: 12 }, { step: 84, dur: 2, semi: 12 }, { step: 86, dur: 2, semi: 12 }, { step: 88, dur: 6, semi: 7 },
        // Bar 6: Ab4-G4-F4-Eb4-D4
        { step: 96, dur: 4, semi: 8 }, { step: 100, dur: 4, semi: 7 }, { step: 104, dur: 4, semi: 5 }, { step: 108, dur: 4, semi: 2 },
        // Bar 7: C5 Fate Finish
        { step: 112, dur: 4, semi: 3 }, { step: 116, dur: 4, semi: 2 }, { step: 120, dur: 8, semi: 0 }
      ]
    },

    satie_gymnopedie: {
      id: 'satie_gymnopedie',
      composer: 'Erik Satie',
      title: 'Gymnopédie No. 1',
      key: 'D',
      keyRoot: 62, // D4
      mode: 'major',
      bpm: 84,
      chords: [
        { bar: 0, deg: 5, qual: 'maj7' },
        { bar: 1, deg: 0, qual: 'maj7' },
        { bar: 2, deg: 5, qual: 'maj7' },
        { bar: 3, deg: 0, qual: 'maj7' },
        { bar: 4, deg: 9, qual: 'min' },
        { bar: 5, deg: 2, qual: 'min' },
        { bar: 6, deg: 5, qual: 'maj7' },
        { bar: 7, deg: 0, qual: 'maj7' }
      ],
      melody: [
        // Floating Satie melody over Gmaj7 -> Dmaj7
        { step: 4, dur: 4, semi: 16 }, { step: 8, dur: 4, semi: 19 }, { step: 12, dur: 4, semi: 17 },
        { step: 16, dur: 4, semi: 16 }, { step: 20, dur: 4, semi: 11 }, { step: 24, dur: 4, semi: 9 },
        { step: 28, dur: 4, semi: 11 }, { step: 32, dur: 8, semi: 12 }, { step: 40, dur: 8, semi: 4 },
        { step: 48, dur: 12, semi: 4 },
        { step: 64, dur: 4, semi: 16 }, { step: 68, dur: 4, semi: 19 }, { step: 72, dur: 4, semi: 17 },
        { step: 76, dur: 4, semi: 16 }, { step: 80, dur: 4, semi: 11 }, { step: 84, dur: 4, semi: 9 },
        { step: 88, dur: 4, semi: 11 }, { step: 92, dur: 4, semi: 12 },
        { step: 96, dur: 8, semi: 7 }, { step: 104, dur: 8, semi: 11 },
        { step: 112, dur: 8, semi: 9 }, { step: 120, dur: 8, semi: 4 }
      ]
    },

    grieg_mountain: {
      id: 'grieg_mountain',
      composer: 'Edvard Grieg',
      title: 'In the Hall of the Mountain King',
      key: 'B',
      keyRoot: 59, // B3
      mode: 'minor',
      bpm: 122,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 7, qual: 'maj' },
        { bar: 2, deg: 0, qual: 'min' },
        { bar: 3, deg: 3, qual: 'maj' },
        { bar: 4, deg: 0, qual: 'min' },
        { bar: 5, deg: 7, qual: 'dom7' },
        { bar: 6, deg: 3, qual: 'maj' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Bar 0: B3-C#4-D4-E4-F#4-D4-F#4
        { step: 0, dur: 2, semi: 0 }, { step: 2, dur: 2, semi: 2 }, { step: 4, dur: 2, semi: 3 }, { step: 6, dur: 2, semi: 5 },
        { step: 8, dur: 2, semi: 7 }, { step: 10, dur: 2, semi: 3 }, { step: 12, dur: 4, semi: 7 },
        // Bar 1: F4-C#4-F4 - E4-C4-E4
        { step: 16, dur: 2, semi: 6 }, { step: 18, dur: 2, semi: 2 }, { step: 20, dur: 4, semi: 6 },
        { step: 24, dur: 2, semi: 5 }, { step: 26, dur: 2, semi: 1 }, { step: 28, dur: 4, semi: 5 },
        // Bar 2: B3-C#4-D4-E4-F#4-D4-F#4-B4-A4-F#4-D4-F#4-A4
        { step: 32, dur: 2, semi: 0 }, { step: 34, dur: 2, semi: 2 }, { step: 36, dur: 2, semi: 3 }, { step: 38, dur: 2, semi: 5 },
        { step: 40, dur: 2, semi: 7 }, { step: 42, dur: 2, semi: 3 }, { step: 44, dur: 2, semi: 7 }, { step: 46, dur: 2, semi: 12 },
        // Bar 3: A4-F#4-D4-F#4-A4
        { step: 48, dur: 2, semi: 10 }, { step: 50, dur: 2, semi: 7 }, { step: 52, dur: 2, semi: 3 }, { step: 54, dur: 2, semi: 7 },
        { step: 56, dur: 8, semi: 10 },
        // Bar 4-5: High phrase F#4-G#4-A#4-B4-C#5-A#4-C#5
        { step: 64, dur: 2, semi: 7 }, { step: 66, dur: 2, semi: 9 }, { step: 68, dur: 2, semi: 11 }, { step: 70, dur: 2, semi: 12 },
        { step: 72, dur: 2, semi: 14 }, { step: 74, dur: 2, semi: 11 }, { step: 76, dur: 4, semi: 14 },
        { step: 80, dur: 2, semi: 12 }, { step: 82, dur: 2, semi: 9 }, { step: 84, dur: 4, semi: 12 },
        { step: 88, dur: 2, semi: 11 }, { step: 90, dur: 2, semi: 7 }, { step: 92, dur: 4, semi: 11 },
        // Bar 6-7: Return to tonic
        { step: 96, dur: 2, semi: 0 }, { step: 98, dur: 2, semi: 2 }, { step: 100, dur: 2, semi: 3 }, { step: 102, dur: 2, semi: 5 },
        { step: 104, dur: 2, semi: 7 }, { step: 106, dur: 2, semi: 3 }, { step: 108, dur: 2, semi: 7 }, { step: 110, dur: 2, semi: 12 },
        { step: 112, dur: 2, semi: 10 }, { step: 114, dur: 2, semi: 7 }, { step: 116, dur: 4, semi: 10 },
        { step: 120, dur: 8, semi: 12 }
      ]
    },

    debussy_clair: {
      id: 'debussy_clair',
      composer: 'Claude Debussy',
      title: 'Clair de Lune (Suite bergamasque)',
      key: 'Db',
      keyRoot: 61, // Db4
      mode: 'major',
      bpm: 86,
      chords: [
        { bar: 0, deg: 0, qual: 'maj7' },
        { bar: 1, deg: 5, qual: 'maj7' },
        { bar: 2, deg: 2, qual: 'min' },
        { bar: 3, deg: 7, qual: 'dom7' },
        { bar: 4, deg: 0, qual: 'maj7' },
        { bar: 5, deg: 9, qual: 'min' },
        { bar: 6, deg: 5, qual: 'maj' },
        { bar: 7, deg: 0, qual: 'maj7' }
      ],
      melody: [
        { step: 2, dur: 6, semi: 16 }, { step: 8, dur: 8, semi: 12 },
        { step: 16, dur: 2, semi: 9 }, { step: 18, dur: 2, semi: 11 }, { step: 20, dur: 8, semi: 12 },
        { step: 28, dur: 4, semi: 9 },
        { step: 32, dur: 2, semi: 7 }, { step: 34, dur: 2, semi: 9 }, { step: 36, dur: 6, semi: 7 }, { step: 42, dur: 6, semi: 4 },
        { step: 48, dur: 2, semi: 5 }, { step: 50, dur: 2, semi: 7 }, { step: 52, dur: 8, semi: 4 }, { step: 60, dur: 4, semi: 2 },
        { step: 64, dur: 2, semi: 4 }, { step: 66, dur: 2, semi: 5 }, { step: 68, dur: 6, semi: 2 }, { step: 74, dur: 6, semi: 0 },
        { step: 80, dur: 2, semi: 2 }, { step: 82, dur: 2, semi: 4 }, { step: 84, dur: 8, semi: 0 }, { step: 92, dur: 4, semi: -1 },
        { step: 96, dur: 4, semi: 0 }, { step: 100, dur: 4, semi: 4 }, { step: 104, dur: 4, semi: 7 }, { step: 108, dur: 4, semi: 11 },
        { step: 112, dur: 8, semi: 12 }, { step: 120, dur: 8, semi: 7 }
      ]
    },

    chopin_funeral: {
      id: 'chopin_funeral',
      composer: 'Frédéric Chopin',
      title: 'Funeral March (Sonata No. 2)',
      key: 'Bb',
      keyRoot: 58, // Bb3
      mode: 'minor',
      bpm: 82,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 5, qual: 'min' },
        { bar: 2, deg: 0, qual: 'min' },
        { bar: 3, deg: 3, qual: 'maj' },
        { bar: 4, deg: 8, qual: 'maj' },
        { bar: 5, deg: 3, qual: 'maj' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        { step: 0, dur: 8, semi: 0 }, { step: 8, dur: 3, semi: 0 }, { step: 11, dur: 1, semi: 0 }, { step: 12, dur: 4, semi: 0 },
        { step: 16, dur: 4, semi: 3 }, { step: 20, dur: 3, semi: 2 }, { step: 23, dur: 1, semi: 0 }, { step: 24, dur: 4, semi: 0 }, { step: 28, dur: 4, semi: -1 },
        { step: 32, dur: 12, semi: 0 }, { step: 44, dur: 4, semi: 3 },
        { step: 48, dur: 8, semi: 7 }, { step: 56, dur: 6, semi: 8 }, { step: 62, dur: 2, semi: 7 },
        { step: 64, dur: 4, semi: 8 }, { step: 68, dur: 4, semi: 10 }, { step: 72, dur: 8, semi: 7 },
        { step: 80, dur: 4, semi: 5 }, { step: 84, dur: 4, semi: 7 }, { step: 88, dur: 8, semi: 3 },
        { step: 96, dur: 4, semi: 2 }, { step: 100, dur: 4, semi: 3 }, { step: 104, dur: 4, semi: 2 }, { step: 108, dur: 4, semi: 0 },
        { step: 112, dur: 16, semi: 0 }
      ]
    },

    vivaldi_winter: {
      id: 'vivaldi_winter',
      composer: 'Antonio Vivaldi',
      title: 'Winter (The Four Seasons)',
      key: 'F',
      keyRoot: 65, // F4
      mode: 'minor',
      bpm: 132,
      chords: [
        { bar: 0, deg: 0, qual: 'min' },
        { bar: 1, deg: 5, qual: 'min' },
        { bar: 2, deg: 7, qual: 'dom7' },
        { bar: 3, deg: 0, qual: 'min' },
        { bar: 4, deg: 8, qual: 'maj' },
        { bar: 5, deg: 5, qual: 'min' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'min' }
      ],
      melody: [
        // Rapid baroque shivering 16ths + dramatic leaps
        { step: 0, dur: 2, semi: 12 }, { step: 2, dur: 2, semi: 12 }, { step: 4, dur: 2, semi: 12 }, { step: 6, dur: 2, semi: 12 },
        { step: 8, dur: 1, semi: 12 }, { step: 9, dur: 1, semi: 10 }, { step: 10, dur: 1, semi: 8 }, { step: 11, dur: 1, semi: 7 },
        { step: 12, dur: 4, semi: 5 },
        { step: 16, dur: 2, semi: 8 }, { step: 18, dur: 2, semi: 8 }, { step: 20, dur: 2, semi: 8 }, { step: 22, dur: 2, semi: 8 },
        { step: 24, dur: 1, semi: 8 }, { step: 25, dur: 1, semi: 7 }, { step: 26, dur: 1, semi: 5 }, { step: 27, dur: 1, semi: 3 },
        { step: 28, dur: 4, semi: 2 },
        { step: 32, dur: 2, semi: 7 }, { step: 34, dur: 2, semi: 7 }, { step: 36, dur: 2, semi: 7 }, { step: 38, dur: 2, semi: 7 },
        { step: 40, dur: 1, semi: 7 }, { step: 41, dur: 1, semi: 5 }, { step: 42, dur: 1, semi: 3 }, { step: 43, dur: 1, semi: 2 },
        { step: 44, dur: 4, semi: 0 },
        { step: 48, dur: 2, semi: 0 }, { step: 50, dur: 2, semi: 3 }, { step: 52, dur: 2, semi: 7 }, { step: 54, dur: 2, semi: 12 },
        { step: 56, dur: 4, semi: 11 }, { step: 60, dur: 4, semi: 12 },
        { step: 64, dur: 2, semi: 8 }, { step: 66, dur: 2, semi: 12 }, { step: 68, dur: 2, semi: 15 }, { step: 70, dur: 2, semi: 12 },
        { step: 72, dur: 2, semi: 8 }, { step: 74, dur: 2, semi: 12 }, { step: 76, dur: 4, semi: 15 },
        { step: 80, dur: 2, semi: 5 }, { step: 82, dur: 2, semi: 8 }, { step: 84, dur: 2, semi: 12 }, { step: 86, dur: 2, semi: 8 },
        { step: 88, dur: 2, semi: 5 }, { step: 90, dur: 2, semi: 8 }, { step: 92, dur: 4, semi: 12 },
        { step: 96, dur: 2, semi: 7 }, { step: 98, dur: 2, semi: 11 }, { step: 100, dur: 2, semi: 14 }, { step: 102, dur: 2, semi: 11 },
        { step: 104, dur: 4, semi: 7 }, { step: 108, dur: 4, semi: 11 },
        { step: 112, dur: 4, semi: 12 }, { step: 116, dur: 4, semi: 7 }, { step: 120, dur: 8, semi: 0 }
      ]
    },

    joplin_entertainer: {
      id: 'joplin_entertainer',
      composer: 'Scott Joplin',
      title: 'The Entertainer (Ragtime)',
      key: 'C',
      keyRoot: 60, // C4
      mode: 'major',
      bpm: 112,
      chords: [
        { bar: 0, deg: 0, qual: 'maj' },
        { bar: 1, deg: 5, qual: 'maj' },
        { bar: 2, deg: 0, qual: 'maj' },
        { bar: 3, deg: 7, qual: 'dom7' },
        { bar: 4, deg: 0, qual: 'maj' },
        { bar: 5, deg: 5, qual: 'maj' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'maj' }
      ],
      melody: [
        // Ragtime intro + main syncopated hook
        { step: 0, dur: 2, semi: 14 }, { step: 2, dur: 2, semi: 16 }, { step: 4, dur: 2, semi: 12 }, { step: 6, dur: 4, semi: 9 },
        { step: 10, dur: 2, semi: 11 }, { step: 12, dur: 4, semi: 7 },
        { step: 16, dur: 2, semi: 2 }, { step: 18, dur: 2, semi: 4 }, { step: 20, dur: 2, semi: 0 }, { step: 22, dur: 4, semi: -3 },
        { step: 26, dur: 2, semi: -1 }, { step: 28, dur: 4, semi: -5 },
        // Main theme: D4-D#4-E4-C5-E4-C5-E4-C5
        { step: 32, dur: 2, semi: 2 }, { step: 34, dur: 2, semi: 3 }, { step: 36, dur: 2, semi: 4 }, { step: 38, dur: 4, semi: 12 },
        { step: 42, dur: 2, semi: 4 }, { step: 44, dur: 4, semi: 12 },
        { step: 48, dur: 2, semi: 4 }, { step: 50, dur: 10, semi: 12 },
        { step: 64, dur: 2, semi: 12 }, { step: 66, dur: 2, semi: 14 }, { step: 68, dur: 2, semi: 15 }, { step: 70, dur: 2, semi: 16 },
        { step: 72, dur: 2, semi: 12 }, { step: 74, dur: 2, semi: 14 }, { step: 76, dur: 4, semi: 16 },
        { step: 80, dur: 2, semi: 11 }, { step: 82, dur: 4, semi: 14 }, { step: 86, dur: 10, semi: 12 },
        { step: 96, dur: 2, semi: 12 }, { step: 98, dur: 2, semi: 14 }, { step: 100, dur: 2, semi: 16 }, { step: 102, dur: 4, semi: 12 },
        { step: 106, dur: 2, semi: 14 }, { step: 108, dur: 4, semi: 16 },
        { step: 112, dur: 4, semi: 14 }, { step: 116, dur: 4, semi: 11 }, { step: 120, dur: 8, semi: 12 }
      ]
    },

    bach_cello: {
      id: 'bach_cello',
      composer: 'J.S. Bach',
      title: 'Cello Suite No. 1 (Prelude)',
      key: 'G',
      keyRoot: 55, // G3
      mode: 'major',
      bpm: 104,
      chords: [
        { bar: 0, deg: 0, qual: 'maj' },
        { bar: 1, deg: 5, qual: 'maj7' },
        { bar: 2, deg: 11, qual: 'dom7' },
        { bar: 3, deg: 0, qual: 'maj' },
        { bar: 4, deg: 9, qual: 'min' },
        { bar: 5, deg: 2, qual: 'dom7' },
        { bar: 6, deg: 7, qual: 'dom7' },
        { bar: 7, deg: 0, qual: 'maj' }
      ],
      melody: (function () {
        const bars = [
          [0, 7, 11, 9, 11, 7, 11, 7],
          [0, 9, 12, 11, 12, 9, 12, 9],
          [0, 11, 12, 9, 12, 11, 12, 11],
          [0, 7, 11, 9, 11, 7, 11, 7],
          [0, 9, 16, 14, 16, 9, 16, 9],
          [2, 6, 9, 14, 9, 6, 9, 6],
          [2, 7, 11, 14, 11, 7, 11, 7],
          [0, 4, 7, 12, 11, 7, 4, 0]
        ];
        const evs = [];
        bars.forEach((pattern, b) => {
          for (let half = 0; half < 2; half++) {
            pattern.forEach((semi, idx) => {
              evs.push({ step: b * 16 + half * 8 + idx, dur: 1, semi: semi + 12 });
            });
          }
        });
        return evs;
      })()
    }
  };

  // --------------------------------------------------------------------------
  // 2. CURATED GENRE PRESET DEFINITIONS + LOCAL AI FALLBACK BLUEPRINTS
  // --------------------------------------------------------------------------
  const GENRE_CATALOG = {
    reggae_dub: {
      id: 'reggae_dub',
      label: '🇯🇲 King Tubby Dub Reggae',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.title.split('(')[0].trim()} (Kingston '74 Dubplate)`,
        producer_log: `Shifted ${piece.composer}'s ${piece.key} ${piece.mode} score into a 76 BPM Jamaican one-drop dubplate. Dropped beat 1 for a syncopated sub-bass bubble, placed crisp Hammond organ skanks on the '&' offbeats, and routed a melodica horn lead through a dotted-8th spring delay.`,
        tempo_bpm: 76,
        swing: 0.24,
        scale_mode: piece.mode === 'major' ? 'dorian' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: { patch: 'melodica_dub', feel: 'offbeat_skank_push', octave_shift: 0, dub_echo_throws: 0.45 },
        chord_spec: { patch: 'organ_skank', pattern: 'reggae_skank', voicing: 'jazz_7th' },
        bass_spec: { patch: 'sub_dub', pattern: 'one_drop_bubble' },
        drum_spec: {
          kit: 'dub_kit',
          kick_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0.45, 0, 0, 0.65, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0.35, 0],
          hat_steps:   [0.5, 0.3, 0.85, 0.3, 0.5, 0.3, 0.85, 0.3, 0.5, 0.3, 0.85, 0.3, 0.5, 0.3, 1.3, 0.3],
          perc_steps:  [0, 0, 0, 0.6, 0, 0, 0.7, 0, 0, 0, 0, 0.5, 0, 0.8, 0, 0]
        },
        ai_counter_melody: [null, null, 7, null, null, 5, 3, null, null, null, 7, 10, null, 7, null, null],
        fx_spec: { delay_wet: 0.48, delay_steps: 3, reverb_wet: 0.45, filter_cutoff: 5200, crush: 0.0, wow_flutter: 0.16 }
      })
    },
    boombap_90s: {
      id: 'boombap_90s',
      label: '📼 90s East Coast Boom-Bap',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} on the MPC-3000 (94 Crate Flip)`,
        producer_log: `Chopped ${piece.composer}'s melody over an 88 BPM swung MPC drum break, re-voiced the harmony into dusty Rhodes minor-9th jazz stabs, and locked an upright acoustic bassline to the kick pocket.`,
        tempo_bpm: 88,
        swing: 0.42,
        scale_mode: 'dorian',
        transpose_semitones: -2,
        melody_spec: { patch: 'vibraphone_jazz', feel: 'laid_back_swing', octave_shift: 0, dub_echo_throws: 0.2 },
        chord_spec: { patch: 'warm_rhodes', pattern: 'boombap_stabs', voicing: 'lush_9th' },
        bass_spec: { patch: 'upright_jazz', pattern: 'boombap_pocket' },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0.55, 0, 0, 0, 0.75, 0, 0, 0.9, 0, 0, 0, 0.45, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0.25, 0, 0.3, 0, 0, 1.0, 0, 0, 0.35],
          hat_steps:   [0.8, 0, 0.65, 0, 0.8, 0, 0.65, 0.35, 0.8, 0, 0.65, 0, 0.8, 0, 1.25, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, 0, 0.5, 0]
        },
        ai_counter_melody: [0, null, 3, 5, null, 7, null, null, 10, null, 7, 5, 3, null, null, null],
        fx_spec: { delay_wet: 0.22, delay_steps: 4, reverb_wet: 0.28, filter_cutoff: 4400, crush: 0.18, wow_flutter: 0.28 }
      })
    },
    trap_808: {
      id: 'trap_808',
      label: '🔥 808 Dark Trap / Phonk',
      defaultBlueprint: (piece) => ({
        mashup_title: `Lil ${piece.composer.split(' ').pop()} — ${piece.title.split('(')[0].trim()} (808 Mafia VIP)`,
        producer_log: `Warped ${piece.title} into Phrygian Dominant minor at 142 BPM half-time. Routed the lead to an eerie airy flute with dark bell arpeggios, gliding sub-808 bass slides, and 32nd-note hi-hat rolls.`,
        tempo_bpm: 142,
        swing: 0.08,
        scale_mode: 'phrygian_dominant',
        transpose_semitones: -3,
        melody_spec: { patch: 'flute_airy', feel: 'half_time_float', octave_shift: 1, dub_echo_throws: 0.3 },
        chord_spec: { patch: 'dark_trap_bells', pattern: 'trap_half_bells', voicing: 'jazz_7th' },
        bass_spec: { patch: 'trap_808', pattern: 'trap_808_glide' },
        drum_spec: {
          kit: 'trap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0.9, 0, 0, 0.7, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0.45],
          hat_steps:   [0.9, 0.7, 0.9, 1.4, 0.9, 0.7, 1.4, 1.4, 0.9, 0.7, 0.9, 0.7, 1.4, 1.4, 0.9, 1.4],
          perc_steps:  [0, 0, 0.7, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0.85, 0]
        },
        ai_counter_melody: [0, 1, null, 4, null, null, 7, 8, 7, null, 4, 1, 0, null, null, null],
        fx_spec: { delay_wet: 0.30, delay_steps: 3, reverb_wet: 0.42, filter_cutoff: 9500, crush: 0.08, wow_flutter: 0.05 }
      })
    },
    cyberpunk_darksynth: {
      id: 'cyberpunk_darksynth',
      label: '⚡ Cyberpunk Darksynth',
      defaultBlueprint: (piece) => ({
        mashup_title: `NEO-${piece.composer.split(' ').pop().toUpperCase()} // 2099 OVERDRIVE`,
        producer_log: `Injected ${piece.title} into a 122 BPM Harmonic Minor cyberpunk grid with a relentless 16th-note Reese bass, detuned supersaw lead, PWM chord arpeggiators, and gated LinnDrum snares.`,
        tempo_bpm: 122,
        swing: 0.0,
        scale_mode: 'harmonic_minor',
        transpose_semitones: -2,
        melody_spec: { patch: 'supersaw_cyber', feel: 'authentic', octave_shift: 0, dub_echo_throws: 0.35 },
        chord_spec: { patch: 'cyber_pwm', pattern: 'cyber_16th_arp', voicing: 'power_5th' },
        bass_spec: { patch: 'reese_cyber', pattern: 'cyber_rolling_16th' },
        drum_spec: {
          kit: 'cyber_kit',
          kick_steps:  [1.0, 0, 0, 0, 0.9, 0, 0, 0, 1.0, 0, 0.75, 0, 0.9, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0.5],
          hat_steps:   [0.7, 0.5, 0.9, 0.5, 0.7, 0.5, 0.9, 0.5, 0.7, 0.5, 0.9, 0.5, 0.7, 0.5, 1.3, 0.6],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0.8]
        },
        ai_counter_melody: [0, 3, 7, 12, 11, 7, 3, 0, 0, 3, 8, 12, 11, 8, 7, 3],
        fx_spec: { delay_wet: 0.36, delay_steps: 3, reverb_wet: 0.45, filter_cutoff: 8800, crush: 0.12, wow_flutter: 0.04 }
      })
    },
    bossa_nova: {
      id: 'bossa_nova',
      label: '🌴 Ipanema Bossa Nova',
      defaultBlueprint: (piece) => ({
        mashup_title: `Garota de ${piece.composer.split(' ').pop()} (Rio 1964 Session)`,
        producer_log: `Re-harmonized ${piece.title} into lush Lydian/Major-9th Brazilian jazz voicings with a syncopated nylon guitar bossa clave, acoustic tumbão bass, rimshot brushes, and a warm flute & vibraphone duet.`,
        tempo_bpm: 124,
        swing: 0.16,
        scale_mode: piece.mode === 'minor' ? 'dorian' : 'lydian',
        transpose_semitones: 0,
        melody_spec: { patch: 'flute_airy', feel: 'offbeat_skank_push', octave_shift: 0, dub_echo_throws: 0.18 },
        chord_spec: { patch: 'nylon_guitar', pattern: 'bossa_clave', voicing: 'lush_9th' },
        bass_spec: { patch: 'upright_jazz', pattern: 'bossa_tumbao' },
        drum_spec: {
          kit: 'bossa_kit',
          kick_steps:  [0.9, 0, 0, 0.75, 0, 0, 0, 0, 0.9, 0, 0, 0.75, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          hat_steps:   [0.6, 0.4, 0.7, 0.4, 0.6, 0.4, 0.7, 0.4, 0.6, 0.4, 0.7, 0.4, 0.6, 0.4, 0.7, 0.4],
          perc_steps:  [0.9, 0, 0, 0.85, 0, 0, 0.85, 0, 0, 0, 0.85, 0, 0.85, 0, 0, 0]
        },
        ai_counter_melody: [null, 4, 7, null, 9, null, 11, 9, null, 7, 4, null, 2, null, null, null],
        fx_spec: { delay_wet: 0.18, delay_steps: 4, reverb_wet: 0.35, filter_cutoff: 7800, crush: 0.0, wow_flutter: 0.08 }
      })
    },
    chiptune_8bit: {
      id: 'chiptune_8bit',
      label: '👾 8-Bit NES Boss Theme',
      defaultBlueprint: (piece) => ({
        mashup_title: `SUPER ${piece.composer.split(' ').pop().toUpperCase()} BROS. (Stage 8-4 Castle)`,
        producer_log: `Quantized ${piece.title} onto a 2A03 NES soundchip: square-wave pulse lead, rapid 16th-note chord arpeggios, un-filtered triangle bass, and bitcrushed noise-channel percussion at 146 BPM.`,
        tempo_bpm: 146,
        swing: 0.0,
        scale_mode: 'keep_original',
        transpose_semitones: 2,
        melody_spec: { patch: 'square_8bit', feel: 'staccato_chop', octave_shift: 1, dub_echo_throws: 0.15 },
        chord_spec: { patch: 'chip_arp', pattern: 'cyber_16th_arp', voicing: 'triad' },
        bass_spec: { patch: 'nes_triangle', pattern: 'cyber_rolling_16th' },
        drum_spec: {
          kit: 'chip_kit',
          kick_steps:  [1.0, 0, 0, 0, 0.7, 0, 0.85, 0, 1.0, 0, 0, 0.75, 0, 0, 0.9, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0.4, 0, 0, 0, 0, 1.0, 0, 0.5, 0.6],
          hat_steps:   [0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 1.3, 0.7],
          perc_steps:  [0, 0, 0.6, 0, 0, 0, 0.6, 0, 0, 0, 0.6, 0, 0, 0.6, 0, 0.8]
        },
        ai_counter_melody: [12, 7, 4, 0, 12, 7, 4, 0, 14, 11, 7, 2, 12, 7, 4, 0],
        fx_spec: { delay_wet: 0.16, delay_steps: 2, reverb_wet: 0.10, filter_cutoff: 11000, crush: 0.62, wow_flutter: 0.0 }
      })
    },
    acid_house: {
      id: 'acid_house',
      label: '🧪 1989 Acid Warehouse (TB-303)',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} at the Haçienda '89 (303 Acid Mix)`,
        producer_log: `Fed ${piece.title} into a squelchy Roland TB-303 resonant filter sequencer over a pounding 128 BPM 909 four-on-the-floor kick and offbeat open hi-hats.`,
        tempo_bpm: 128,
        swing: 0.12,
        scale_mode: 'dorian',
        transpose_semitones: 0,
        melody_spec: { patch: 'acid_303_lead', feel: 'offbeat_skank_push', octave_shift: 0, dub_echo_throws: 0.4 },
        chord_spec: { patch: 'organ_skank', pattern: 'house_offbeat', voicing: 'jazz_7th' },
        bass_spec: { patch: 'tb303_acid', pattern: 'acid_303_sequence' },
        drum_spec: {
          kit: 'house_kit',
          kick_steps:  [1.0, 0, 0, 0, 1.0, 0, 0, 0, 1.0, 0, 0, 0, 1.0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0],
          hat_steps:   [0.4, 0.3, 1.35, 0.3, 0.4, 0.3, 1.35, 0.3, 0.4, 0.3, 1.35, 0.3, 0.4, 0.3, 1.35, 0.5],
          perc_steps:  [0, 0, 0, 0.65, 0, 0, 0.65, 0, 0, 0.5, 0, 0.65, 0, 0, 0.75, 0]
        },
        ai_counter_melody: [0, 0, 12, 0, 3, 7, 0, 10, 0, 12, 7, 3, 0, 10, 7, 0],
        fx_spec: { delay_wet: 0.42, delay_steps: 3, reverb_wet: 0.35, filter_cutoff: 7600, crush: 0.08, wow_flutter: 0.04 }
      })
    },
    spaghetti_western: {
      id: 'spaghetti_western',
      label: '🤠 Ennio Spaghetti Western',
      defaultBlueprint: (piece) => ({
        mashup_title: `The Good, The Bad & The ${piece.composer.split(' ').pop()}`,
        producer_log: `Transposed ${piece.title} into a sun-scorched Harmonic Minor desert standoff at 102 BPM, featuring a lone whistler lead, galloping nylon guitar triplets, alternating upright bass, and cavernous canyon reverb.`,
        tempo_bpm: 102,
        swing: 0.14,
        scale_mode: 'harmonic_minor',
        transpose_semitones: -2,
        melody_spec: { patch: 'whistle_western', feel: 'authentic', octave_shift: 1, dub_echo_throws: 0.5 },
        chord_spec: { patch: 'nylon_guitar', pattern: 'western_gallop', voicing: 'triad' },
        bass_spec: { patch: 'upright_jazz', pattern: 'western_alternating' },
        drum_spec: {
          kit: 'dub_kit',
          kick_steps:  [1.0, 0, 0, 0.5, 0, 0, 0.8, 0, 1.0, 0, 0, 0.5, 0, 0, 0.85, 0],
          snare_steps: [0, 0, 0, 0, 0.85, 0, 0.4, 0.5, 0, 0, 0, 0, 0.9, 0.4, 0.5, 0.7],
          hat_steps:   [0.5, 0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 0, 0.5, 0.5],
          perc_steps:  [0.8, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0.6, 0, 0, 0.8, 0]
        },
        ai_counter_melody: [0, null, 7, 8, 7, null, 4, null, 0, null, 11, 12, null, null, null, null],
        fx_spec: { delay_wet: 0.44, delay_steps: 4, reverb_wet: 0.62, filter_cutoff: 6800, crush: 0.0, wow_flutter: 0.14 }
      })
    },
    ska_punk: {
      id: 'ska_punk',
      label: '🏁 3rd-Wave Ska Punk',
      defaultBlueprint: (piece) => ({
        mashup_title: `Pick It Up, ${piece.composer.split(' ').pop()}! (96 Warped Tour Mix)`,
        producer_log: `Accelerated ${piece.title} to 156 BPM with punchy brass horn section leads, relentless upbeat organ/guitar skank upstrokes, and a walking punk bassline.`,
        tempo_bpm: 156,
        swing: 0.08,
        scale_mode: piece.mode === 'minor' ? 'parallel_major' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: { patch: 'brass_horn', feel: 'offbeat_skank_push', octave_shift: 0, dub_echo_throws: 0.15 },
        chord_spec: { patch: 'organ_skank', pattern: 'ska_upstrokes', voicing: 'triad' },
        bass_spec: { patch: 'slap_funk', pattern: 'walking_jazz' },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0.6, 0, 0.9, 0, 1.0, 0, 0, 0, 0.6, 0, 0.9, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0.45, 0.75],
          hat_steps:   [0.5, 0, 1.3, 0, 0.5, 0, 1.3, 0, 0.5, 0, 1.3, 0, 0.5, 0, 1.3, 0],
          perc_steps:  [0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0]
        },
        ai_counter_melody: [null, 0, null, 4, null, 7, null, 9, null, 7, null, 4, 2, null, 0, null],
        fx_spec: { delay_wet: 0.18, delay_steps: 2, reverb_wet: 0.25, filter_cutoff: 9200, crush: 0.05, wow_flutter: 0.04 }
      })
    },
    lofi_tape: {
      id: 'lofi_tape',
      label: '☕ 2 AM Lo-Fi Study Tape',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.title.split('(')[0].trim().toLowerCase()} [lofi beats to study/ponder to]`,
        producer_log: `Slowed ${piece.composer} down to 74 BPM through a warbly SP-404 cassette deck with a low-pass filter at 3.2 kHz, warm electric piano 9th chords, and lazy swung dusty drums.`,
        tempo_bpm: 74,
        swing: 0.45,
        scale_mode: 'dorian',
        transpose_semitones: -3,
        melody_spec: { patch: 'rhodes_ep', feel: 'laid_back_swing', octave_shift: 0, dub_echo_throws: 0.3 },
        chord_spec: { patch: 'warm_rhodes', pattern: 'boombap_stabs', voicing: 'lush_9th' },
        bass_spec: { patch: 'sub_dub', pattern: 'boombap_pocket' },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [0.95, 0, 0, 0, 0, 0, 0, 0.65, 0, 0, 0.85, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0.3],
          hat_steps:   [0.55, 0, 0.45, 0, 0.55, 0, 0.45, 0, 0.55, 0, 0.45, 0, 0.55, 0, 0.45, 0.3],
          perc_steps:  [0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0]
        },
        ai_counter_melody: [null, null, 4, null, 7, 9, null, null, 11, null, 9, 7, null, 4, null, null],
        fx_spec: { delay_wet: 0.32, delay_steps: 3, reverb_wet: 0.48, filter_cutoff: 3200, crush: 0.14, wow_flutter: 0.45 }
      })
    },
    doom_metal: {
      id: 'doom_metal',
      label: '💀 Sabbath Doom Sludge',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} Sabbath — Electric Funeral in ${piece.key} Minor`,
        producer_log: `Detuned ${piece.title} into a 68 BPM Blues/Phrygian sludge monolith with fuzzed-out power chord stacks, seismic sub-fuzz bass drones, and crushing half-time cymbal crashes.`,
        tempo_bpm: 68,
        swing: 0.15,
        scale_mode: 'blues',
        transpose_semitones: -4,
        melody_spec: { patch: 'fuzz_lead', feel: 'half_time_float', octave_shift: -1, dub_echo_throws: 0.35 },
        chord_spec: { patch: 'doom_power_stack', pattern: 'doom_wall', voicing: 'power_5th' },
        bass_spec: { patch: 'doom_fuzz', pattern: 'doom_drone' },
        drum_spec: {
          kit: 'doom_kit',
          kick_steps:  [1.0, 0, 0, 0.7, 0, 0, 0.85, 0, 0, 0, 0.9, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0.6, 0],
          hat_steps:   [1.3, 0, 0.7, 0, 1.3, 0, 0.7, 0, 1.3, 0, 0.7, 0, 1.3, 0, 1.3, 0],
          perc_steps:  [0.8, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0, 0]
        },
        ai_counter_melody: [0, null, null, 3, 6, 5, null, null, 0, null, 3, null, 6, 5, 3, 0],
        fx_spec: { delay_wet: 0.30, delay_steps: 4, reverb_wet: 0.50, filter_cutoff: 4800, crush: 0.35, wow_flutter: 0.1 }
      })
    },
    new_orleans_jazz: {
      id: 'new_orleans_jazz',
      label: '🎺 New Orleans Second-Line Brass',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} on Bourbon Street (Second-Line Brass Band)`,
        producer_log: `Transformed ${piece.title} into a joyful 116 BPM New Orleans street parade with a swung brass horn section, ragtime stride piano comping, walking bass, and syncopated parade snare + cowbell.`,
        tempo_bpm: 116,
        swing: 0.38,
        scale_mode: 'blues',
        transpose_semitones: 0,
        melody_spec: { patch: 'brass_horn', feel: 'laid_back_swing', octave_shift: 0, dub_echo_throws: 0.2 },
        chord_spec: { patch: 'honky_tonk', pattern: 'ragtime_stride', voicing: 'jazz_7th' },
        bass_spec: { patch: 'upright_jazz', pattern: 'walking_jazz' },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0.6, 0, 0, 0.85, 0, 0, 0, 0.9, 0, 0, 0.65, 0, 0],
          snare_steps: [0, 0, 0.45, 0, 0.95, 0, 0, 0.55, 0, 0.5, 0, 0.65, 0.95, 0, 0.6, 0.75],
          hat_steps:   [0.7, 0, 0.8, 0.4, 0.7, 0, 1.3, 0, 0.7, 0, 0.8, 0.4, 0.7, 0, 1.3, 0],
          perc_steps:  [0.85, 0, 0, 0.8, 0, 0, 0.85, 0, 0, 0, 0.85, 0, 0.8, 0, 0.7, 0]
        },
        ai_counter_melody: [0, 3, 4, 7, null, 9, 7, 4, 3, 0, null, 7, 10, 9, 7, null],
        fx_spec: { delay_wet: 0.16, delay_steps: 3, reverb_wet: 0.32, filter_cutoff: 8600, crush: 0.0, wow_flutter: 0.08 }
      })
    }
  };

  // --------------------------------------------------------------------------
  // 3. MUSIC THEORY & MODAL RE-HARMONIZATION ENGINE
  // --------------------------------------------------------------------------
  const SCALE_MAPS = {
    // Semitone lookup table [0..11] -> remapped semitone [0..11]
    keep_original:     [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    parallel_minor:    [0, 1, 2, 3, 3, 5, 6, 7, 8, 8, 10, 10],
    parallel_major:    [0, 2, 2, 4, 4, 5, 6, 7, 9, 9, 11, 11],
    dorian:            [0, 2, 2, 3, 3, 5, 6, 7, 9, 9, 10, 10],
    phrygian_dominant: [0, 1, 1, 4, 4, 5, 6, 7, 8, 8, 10, 10],
    harmonic_minor:    [0, 2, 2, 3, 3, 5, 6, 7, 8, 8, 11, 11],
    blues:             [0, 3, 3, 3, 5, 6, 6, 7, 10, 10, 10, 12],
    lydian:            [0, 2, 2, 4, 4, 6, 6, 7, 9, 9, 11, 11],
    minor_pentatonic:  [0, 0, 3, 3, 5, 5, 7, 7, 7, 10, 10, 12]
  };

  const DEGREE_TO_SCALE_SEMI = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19];

  function remapSemitone(semi, scaleMode) {
    const map = SCALE_MAPS[scaleMode] || SCALE_MAPS.keep_original;
    const oct = Math.floor(semi / 12);
    const pc = ((semi % 12) + 12) % 12;
    return oct * 12 + map[pc];
  }

  function buildChordNotes(rootMidi, qual, voicing, scaleMode) {
    // Determine chord quality adjusted by scale_mode
    let isMinor = qual === 'min';
    if (scaleMode === 'parallel_minor' || scaleMode === 'dorian' || scaleMode === 'harmonic_minor' || scaleMode === 'blues') {
      if (qual === 'maj' || qual === 'maj7') isMinor = true;
    } else if (scaleMode === 'parallel_major' || scaleMode === 'lydian') {
      isMinor = false;
    }
    const third = isMinor ? 3 : 4;
    const fifth = 7;
    const seventh = qual === 'maj7' ? 11 : 10;
    const ninth = 14;

    if (voicing === 'power_5th') {
      return [rootMidi - 12, rootMidi - 5, rootMidi];
    }
    if (voicing === 'jazz_7th') {
      return [rootMidi, rootMidi + third, rootMidi + fifth, rootMidi + seventh];
    }
    if (voicing === 'lush_9th') {
      return [rootMidi, rootMidi + third, rootMidi + seventh, rootMidi + ninth];
    }
    if (voicing === 'open_spread') {
      return [rootMidi - 12, rootMidi, rootMidi + fifth, rootMidi + third + 12];
    }
    return [rootMidi, rootMidi + third, rootMidi + fifth];
  }

  // --------------------------------------------------------------------------
  // 4. SCORE COMPILER: SOURCE PIECE + AI BLUEPRINT -> 5 SYNCHRONIZED TRACKS
  // --------------------------------------------------------------------------
  function compileMorphedArrangement(piece, bp) {
    const scaleMode = bp.scale_mode || 'keep_original';
    const transpose = Number(bp.transpose_semitones) || 0;
    const rootBase = (piece.keyRoot || 60) + transpose;
    const melSpec = bp.melody_spec || {};
    const chordSpec = bp.chord_spec || {};
    const bassSpec = bp.bass_spec || {};
    const drumSpec = bp.drum_spec || {};

    // If wildcard song was generated by LLM, use its score if valid
    let srcMelody = piece.melody || [];
    let srcChords = piece.chords || [];
    if (bp.wildcard_score && Array.isArray(bp.wildcard_score.melody_events) && bp.wildcard_score.melody_events.length > 0) {
      srcMelody = [];
      for (let rep = 0; rep < 2; rep++) {
        bp.wildcard_score.melody_events.forEach(ev => {
          srcMelody.push({
            step: (Number(ev.step) || 0) + rep * 64,
            dur: Math.max(1, Number(ev.dur) || 2),
            semi: Number(ev.semi) || 0
          });
        });
      }
    }

    const events = {
      melody: [],
      ai_hook: [],
      chords: [],
      bass: [],
      drums: []
    };

    // --- TRACK 1: MORPHED MELODY ---
    const octOffset = (Number(melSpec.octave_shift) || 0) * 12;
    const feel = melSpec.feel || 'authentic';

    srcMelody.forEach((n, idx) => {
      let step = n.step % 128;
      let dur = n.dur;
      const mappedSemi = remapSemitone(n.semi, scaleMode);
      const midi = Math.max(40, Math.min(92, rootBase + mappedSemi + octOffset));

      if (feel === 'offbeat_skank_push') {
        // Push strong downbeat quarter notes slightly onto the upbeat "&" for reggae/bossa lilt
        if (step % 4 === 0 && dur >= 4 && idx % 2 === 1) {
          step = (step + 2) % 128;
          dur = Math.max(2, dur - 2);
        }
      } else if (feel === 'staccato_chop') {
        dur = Math.min(dur, 2);
      } else if (feel === 'half_time_float') {
        dur = Math.min(8, Math.max(2, Math.round(dur * 1.25)));
      } else if (feel === 'double_time_arp' && dur >= 4) {
        // Split long notes into octave/fifth chiptune trills
        events.melody.push({ step, dur: Math.floor(dur / 2), midi, vel: 0.9, echo: false });
        events.melody.push({
          step: (step + Math.floor(dur / 2)) % 128,
          dur: Math.ceil(dur / 2),
          midi: Math.min(96, midi + 12),
          vel: 0.78,
          echo: false
        });
        return;
      }

      const isPhraseEnd = dur >= 4 || (step % 16 >= 12);
      const echoThrow = isPhraseEnd && Math.random() < (melSpec.dub_echo_throws ?? 0.25);
      events.melody.push({ step, dur, midi, vel: 0.88, echo: echoThrow });
    });

    // --- TRACK 2: AI COUNTER-MELODY / RIFF ---
    const aiCounter = Array.isArray(bp.ai_counter_melody) && bp.ai_counter_melody.length === 16
      ? bp.ai_counter_melody
      : [null, null, 7, null, null, 5, 3, null, null, null, 7, 10, null, 7, null, null];

    for (let bar = 0; bar < 8; bar++) {
      const chordObj = srcChords[bar % srcChords.length] || { deg: 0, qual: 'maj' };
      const barRoot = rootBase + remapSemitone(chordObj.deg, scaleMode);
      for (let s = 0; s < 16; s++) {
        const degVal = aiCounter[s];
        if (degVal !== null && degVal !== undefined && !isNaN(degVal)) {
          // Play AI hook more prominently on bars 1, 3, 5, 7 or off-phrases
          if (bar % 2 === 1 || s % 4 >= 2) {
            const degIdx = Math.abs(Math.round(degVal)) % DEGREE_TO_SCALE_SEMI.length;
            const rawSemi = DEGREE_TO_SCALE_SEMI[degIdx];
            const midi = Math.max(48, Math.min(88, barRoot + remapSemitone(rawSemi, scaleMode)));
            events.ai_hook.push({
              step: bar * 16 + s,
              dur: 2,
              midi,
              vel: 0.64
            });
          }
        }
      }
    }

    // --- TRACK 3: CHORD COMPING / SKANKS / ARPS ---
    const cPattern = chordSpec.pattern || 'reggae_skank';
    const cVoicing = chordSpec.voicing || 'jazz_7th';

    for (let bar = 0; bar < 8; bar++) {
      const chordObj = srcChords[bar % srcChords.length] || { deg: 0, qual: 'maj' };
      const barRoot = rootBase - 12 + remapSemitone(chordObj.deg, scaleMode);
      const chordNotes = buildChordNotes(barRoot, chordObj.qual, cVoicing, scaleMode);
      const baseStep = bar * 16;

      if (cPattern === 'reggae_skank') {
        // Classic Reggae Skank on the "&" of beats 1, 2, 3, 4 (steps 2, 6, 10, 14)
        [2, 6, 10, 14].forEach(s => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + s, dur: 1.4, midi: m + 12, vel: 0.78 }));
        });
      } else if (cPattern === 'ska_upstrokes') {
        [2, 3, 6, 10, 11, 14].forEach((s, i) => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + s, dur: 1.0, midi: m + 12, vel: i % 3 === 1 ? 0.55 : 0.8 }));
        });
      } else if (cPattern === 'bossa_clave') {
        // Authentic Bossa Nova guitar comping: steps 0, 3, 6, 10, 12
        [
          { s: 0, d: 2.5, v: 0.75 },
          { s: 3, d: 2.0, v: 0.68 },
          { s: 6, d: 3.0, v: 0.75 },
          { s: 10, d: 2.0, v: 0.65 },
          { s: 12, d: 3.0, v: 0.72 }
        ].forEach(hit => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + hit.s, dur: hit.d, midi: m + 12, vel: hit.v }));
        });
      } else if (cPattern === 'boombap_stabs') {
        [
          { s: 0, d: 5, v: 0.78 },
          { s: 6, d: 3, v: 0.68 },
          { s: 10, d: 5, v: 0.74 }
        ].forEach(hit => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + hit.s, dur: hit.d, midi: m + 12, vel: hit.v }));
        });
      } else if (cPattern === 'cyber_16th_arp') {
        for (let s = 0; s < 16; s++) {
          const note = chordNotes[s % chordNotes.length] + 12;
          events.chords.push({ step: baseStep + s, dur: 0.9, midi: note, vel: s % 4 === 0 ? 0.78 : 0.58 });
        }
      } else if (cPattern === 'trap_half_bells') {
        [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
          const note = chordNotes[idx % chordNotes.length] + 12;
          events.chords.push({ step: baseStep + s, dur: 2.5, midi: note, vel: 0.7 });
        });
      } else if (cPattern === 'house_offbeat') {
        [2, 6, 10, 14].forEach(s => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + s, dur: 1.8, midi: m + 12, vel: 0.76 }));
        });
      } else if (cPattern === 'ragtime_stride') {
        [2, 6, 10, 14].forEach(s => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + s, dur: 1.5, midi: m + 12, vel: 0.8 }));
        });
      } else if (cPattern === 'western_gallop') {
        [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].forEach(s => {
          const note = chordNotes[s % chordNotes.length] + 12;
          events.chords.push({ step: baseStep + s, dur: 1.0, midi: note, vel: s % 4 === 0 ? 0.78 : 0.55 });
        });
      } else {
        // doom_wall / sustained pad
        [0, 8].forEach(s => {
          chordNotes.forEach(m => events.chords.push({ step: baseStep + s, dur: 7.5, midi: m, vel: 0.82 }));
        });
      }
    }

    // --- TRACK 4: PROCEDURAL BASSLINE ---
    const bPattern = bassSpec.pattern || 'one_drop_bubble';
    for (let bar = 0; bar < 8; bar++) {
      const chordObj = srcChords[bar % srcChords.length] || { deg: 0, qual: 'maj' };
      const nextChordObj = srcChords[(bar + 1) % srcChords.length] || { deg: 0, qual: 'maj' };
      // Bass root in C2..B2 range (MIDI 36..47)
      let bRoot = 36 + (((rootBase + remapSemitone(chordObj.deg, scaleMode)) - 36) % 12 + 12) % 12;
      if (bRoot < 35) bRoot += 12;
      const fifth = bRoot + 7;
      const oct = bRoot + 12;
      const third = bRoot + (scaleMode.includes('minor') || scaleMode === 'dorian' || chordObj.qual === 'min' ? 3 : 4);
      const baseStep = bar * 16;

      if (bPattern === 'one_drop_bubble') {
        // Reggae One-Drop Bass: Rest on beat 1 (step 0), heavy syncopated bubble on 2, 4, 6, 8, 11, 14
        [
          { s: 2, d: 2, m: bRoot, v: 0.95 },
          { s: 4, d: 2, m: fifth, v: 0.85 },
          { s: 6, d: 2, m: oct, v: 0.90 },
          { s: 8, d: 3, m: bRoot, v: 1.0 },
          { s: 11, d: 2, m: third, v: 0.85 },
          { s: 14, d: 2, m: fifth, v: 0.88 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else if (bPattern === 'trap_808_glide') {
        [
          { s: 0, d: 5.5, m: bRoot, v: 1.0 },
          { s: 6, d: 3.5, m: bRoot, v: 0.92 },
          { s: 10, d: 3.5, m: oct, v: 0.95 },
          { s: 14, d: 2.0, m: fifth, v: 0.88 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else if (bPattern === 'cyber_rolling_16th') {
        for (let s = 0; s < 16; s++) {
          const m = s % 2 === 1 ? oct : bRoot;
          events.bass.push({ step: baseStep + s, dur: 0.9, midi: m, vel: s % 4 === 0 ? 0.95 : 0.78 });
        }
      } else if (bPattern === 'acid_303_sequence') {
        const acidNotes = [bRoot, bRoot, oct, bRoot, third, fifth, bRoot, oct, bRoot, oct, fifth, third, bRoot, oct, fifth, bRoot];
        for (let s = 0; s < 16; s++) {
          events.bass.push({ step: baseStep + s, dur: 0.95, midi: acidNotes[s], vel: (s % 3 === 0) ? 1.0 : 0.72 });
        }
      } else if (bPattern === 'walking_jazz') {
        const nextRoot = 36 + (((rootBase + remapSemitone(nextChordObj.deg, scaleMode)) - 36) % 12 + 12) % 12;
        const approach = nextRoot > bRoot ? nextRoot - 1 : nextRoot + 1;
        [
          { s: 0, d: 3.8, m: bRoot, v: 0.92 },
          { s: 4, d: 3.8, m: third, v: 0.85 },
          { s: 8, d: 3.8, m: fifth, v: 0.88 },
          { s: 12, d: 3.8, m: approach, v: 0.86 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else if (bPattern === 'bossa_tumbao') {
        [
          { s: 0, d: 5.5, m: bRoot, v: 0.90 },
          { s: 6, d: 2.0, m: fifth, v: 0.82 },
          { s: 8, d: 5.5, m: fifth, v: 0.88 },
          { s: 14, d: 2.0, m: bRoot, v: 0.82 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else if (bPattern === 'western_alternating') {
        [
          { s: 0, d: 3.8, m: bRoot, v: 0.92 },
          { s: 4, d: 3.8, m: fifth, v: 0.84 },
          { s: 8, d: 3.8, m: bRoot, v: 0.92 },
          { s: 12, d: 3.8, m: fifth - 12 >= 28 ? fifth - 12 : fifth, v: 0.84 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else if (bPattern === 'doom_drone') {
        [
          { s: 0, d: 6.0, m: bRoot, v: 1.0 },
          { s: 6, d: 2.0, m: bRoot + 6, v: 0.9 },
          { s: 8, d: 8.0, m: bRoot, v: 1.0 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      } else {
        // boombap_pocket
        [
          { s: 0, d: 3.5, m: bRoot, v: 0.95 },
          { s: 3, d: 2.0, m: bRoot, v: 0.80 },
          { s: 7, d: 2.5, m: fifth, v: 0.85 },
          { s: 10, d: 3.5, m: oct, v: 0.92 },
          { s: 14, d: 2.0, m: third, v: 0.82 }
        ].forEach(n => events.bass.push({ step: baseStep + n.s, dur: n.d, midi: n.m, vel: n.v }));
      }
    }

    // --- TRACK 5: DRUM MATRIX (8 Bars with Bar 4 & Bar 8 Fills) ---
    const kickGrid = Array.isArray(drumSpec.kick_steps) && drumSpec.kick_steps.length === 16
      ? drumSpec.kick_steps
      : [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.5, 0, 0, 0, 0];
    const snareGrid = Array.isArray(drumSpec.snare_steps) && drumSpec.snare_steps.length === 16
      ? drumSpec.snare_steps
      : [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    const hatGrid = Array.isArray(drumSpec.hat_steps) && drumSpec.hat_steps.length === 16
      ? drumSpec.hat_steps
      : [0.7, 0, 0.7, 0, 0.7, 0, 0.7, 0, 0.7, 0, 0.7, 0, 0.7, 0, 1.2, 0];
    const percGrid = Array.isArray(drumSpec.perc_steps) && drumSpec.perc_steps.length === 16
      ? drumSpec.perc_steps
      : [0, 0, 0, 0.5, 0, 0, 0.6, 0, 0, 0, 0, 0.5, 0, 0, 0, 0];

    for (let bar = 0; bar < 8; bar++) {
      const baseStep = bar * 16;
      const isFillBar = (bar === 3 || bar === 7);
      for (let s = 0; s < 16; s++) {
        if (kickGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'kick', midi: 36, vel: Math.min(1, kickGrid[s]) });
        }
        if (snareGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'snare', midi: 38, vel: Math.min(1, snareGrid[s]) });
        } else if (isFillBar && s >= 12) {
          // Automatic drum fill at the end of bar 4 and bar 8
          events.drums.push({ step: baseStep + s, dur: 1, type: 'snare', midi: 38, vel: 0.55 + (s - 12) * 0.12 });
        }
        if (hatGrid[s] > 0.05) {
          const isOpenOrRoll = hatGrid[s] > 1.15;
          events.drums.push({
            step: baseStep + s,
            dur: 1,
            type: isOpenOrRoll ? 'hat_open_or_roll' : 'hat',
            midi: isOpenOrRoll ? 46 : 42,
            vel: Math.min(1, hatGrid[s] * 0.75)
          });
        }
        if (percGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'perc', midi: 37, vel: Math.min(1, percGrid[s]) });
        }
      }
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // 5. WEB AUDIO PROCEDURAL SYNTHESIZER & FX ENGINE (Realtime + Offline Render)
  // --------------------------------------------------------------------------
  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function createImpulseResponse(ctx, durationSec = 2.0, decay = 2.6) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * durationSec);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function createAudioGraph(ctx, fxSpec, stepDurSec) {
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;

    // Master Filter
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = Math.max(400, Math.min(16000, Number(fxSpec?.filter_cutoff) || 8500));
    masterFilter.Q.value = 1.4;

    // WaveShaper / Bitcrusher grit
    const shaper = ctx.createWaveShaper();
    const crushAmt = Math.max(0, Math.min(0.95, Number(fxSpec?.crush) || 0));
    shaper.curve = makeDistortionCurve(crushAmt);

    // Stereo Dub Delay
    const delayNode = ctx.createDelay(2.5);
    const delaySteps = Number(fxSpec?.delay_steps) || 3;
    delayNode.delayTime.value = Math.min(2.0, Math.max(0.08, delaySteps * stepDurSec));
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.44;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'bandpass';
    delayFilter.frequency.value = 1350;
    delayFilter.Q.value = 0.9;
    const delayWet = ctx.createGain();
    delayWet.gain.value = Math.max(0, Math.min(0.75, Number(fxSpec?.delay_wet) ?? 0.3));

    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWet);

    // Spring / Studio Reverb
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx, 1.8, 2.5);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = Math.max(0, Math.min(0.8, Number(fxSpec?.reverb_wet) ?? 0.3));
    convolver.connect(reverbWet);

    // Master Compressor
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.15;

    // Connect dry + FX buses into Master Filter -> Shaper -> Compressor -> MasterGain
    const dryBus = ctx.createGain();
    dryBus.gain.value = 1.0;

    dryBus.connect(masterFilter);
    delayWet.connect(masterFilter);
    reverbWet.connect(masterFilter);

    masterFilter.connect(shaper);
    shaper.connect(comp);
    comp.connect(masterGain);

    return {
      inputBus: dryBus,
      delaySend: delayNode,
      reverbSend: convolver,
      masterFilter,
      delayWet,
      delayNode,
      reverbWet,
      shaper,
      masterGain
    };
  }

  function makeDistortionCurve(amount) {
    const n = 4096;
    const curve = new Float32Array(n);
    if (amount <= 0.02) {
      for (let i = 0; i < n; i++) curve[i] = (i * 2) / n - 1;
      return curve;
    }
    const steps = Math.max(4, Math.round(64 * (1 - amount * 0.85)));
    const drive = 1 + amount * 8;
    for (let i = 0; i < n; i++) {
      const x = ((i * 2) / n - 1) * drive;
      const soft = Math.tanh(x);
      curve[i] = Math.round(soft * steps) / steps;
    }
    return curve;
  }

  // Synthesize a single melodic, chord, or bass voice
  function triggerSynthNote(ctx, graph, patch, midi, startTime, durationSec, velocity, extraEcho = false) {
    const freq = midiToFreq(midi);
    const out = ctx.createGain();
    const peak = Math.max(0.01, Math.min(0.35, velocity * 0.22));
    const dur = Math.max(0.04, durationSec);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const vcf = ctx.createBiquadFilter();
    vcf.type = 'lowpass';

    let attack = 0.01;
    let release = 0.08;
    let sendReverb = 0.25;
    let sendDelay = extraEcho ? 0.65 : 0.18;

    switch (patch) {
      case 'melodica_dub':
      case 'brass_horn': {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = 8;
        vcf.frequency.setValueAtTime(600, startTime);
        vcf.frequency.exponentialRampToValueAtTime(2800, startTime + 0.05);
        vcf.Q.value = 2.8;
        attack = 0.025;
        release = 0.12;
        sendDelay = extraEcho ? 0.75 : 0.32;
        break;
      }
      case 'supersaw_cyber': {
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc2.detune.value = 18;
        vcf.frequency.setValueAtTime(4800, startTime);
        vcf.Q.value = 3.2;
        attack = 0.008;
        release = 0.14;
        sendDelay = 0.35;
        break;
      }
      case 'square_8bit':
      case 'chip_arp': {
        osc1.type = 'square';
        osc2.type = 'square';
        osc2.detune.value = 2;
        vcf.frequency.setValueAtTime(9500, startTime);
        vcf.Q.value = 0.7;
        attack = 0.002;
        release = 0.02;
        sendReverb = 0.05;
        break;
      }
      case 'acid_303_lead':
      case 'tb303_acid': {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = -5;
        const accent = velocity > 0.85 ? 5200 : 2200;
        vcf.frequency.setValueAtTime(accent, startTime);
        vcf.frequency.exponentialRampToValueAtTime(320, startTime + Math.min(0.22, dur));
        vcf.Q.value = velocity > 0.85 ? 12.0 : 7.5;
        attack = 0.003;
        release = 0.04;
        break;
      }
      case 'flute_airy':
      case 'whistle_western': {
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        // Vibrato LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = 6;
        lfo.connect(osc1.detune);
        lfo.start(startTime);
        lfo.stop(startTime + dur + 0.15);
        vcf.frequency.setValueAtTime(3200, startTime);
        attack = 0.035;
        release = 0.15;
        sendReverb = 0.55;
        sendDelay = 0.4;
        break;
      }
      case 'fuzz_lead':
      case 'doom_power_stack':
      case 'doom_fuzz': {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc2.detune.value = 14;
        vcf.frequency.setValueAtTime(2400, startTime);
        vcf.Q.value = 4.5;
        attack = 0.01;
        release = 0.18;
        break;
      }
      case 'organ_skank': {
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, startTime); // Drawbar octave
        vcf.frequency.setValueAtTime(3600, startTime);
        vcf.Q.value = 1.8;
        attack = 0.004;
        release = 0.04;
        sendDelay = 0.38;
        break;
      }
      case 'nylon_guitar':
      case 'clavinet_funk':
      case 'honky_tonk': {
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc2.detune.value = 6;
        vcf.frequency.setValueAtTime(3400, startTime);
        vcf.frequency.exponentialRampToValueAtTime(650, startTime + Math.min(0.28, dur));
        vcf.Q.value = 1.5;
        attack = 0.004;
        release = 0.09;
        break;
      }
      case 'sub_dub':
      case 'trap_808': {
        osc1.type = 'sine';
        osc2.type = 'triangle';
        // 808 pitch envelope punch
        osc1.frequency.setValueAtTime(freq * 1.6, startTime);
        osc1.frequency.exponentialRampToValueAtTime(freq, startTime + 0.045);
        osc2.frequency.setValueAtTime(freq, startTime);
        vcf.frequency.setValueAtTime(420, startTime);
        vcf.Q.value = 1.2;
        attack = 0.005;
        release = 0.16;
        sendReverb = 0.02;
        sendDelay = 0.0;
        break;
      }
      case 'reese_cyber':
      case 'slap_funk': {
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc2.detune.value = 22;
        vcf.frequency.setValueAtTime(1600, startTime);
        vcf.frequency.exponentialRampToValueAtTime(380, startTime + Math.min(0.25, dur));
        vcf.Q.value = 3.5;
        attack = 0.004;
        release = 0.07;
        sendReverb = 0.05;
        sendDelay = 0.0;
        break;
      }
      case 'upright_jazz':
      case 'nes_triangle': {
        osc1.type = 'triangle';
        osc2.type = 'sine';
        vcf.frequency.setValueAtTime(950, startTime);
        vcf.frequency.exponentialRampToValueAtTime(280, startTime + Math.min(0.3, dur));
        attack = 0.006;
        release = 0.09;
        sendReverb = 0.06;
        sendDelay = 0.0;
        break;
      }
      default: {
        // rhodes_ep / warm_rhodes / vibraphone_jazz / dark_trap_bells / cyber_pwm
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        vcf.frequency.setValueAtTime(2800, startTime);
        vcf.frequency.exponentialRampToValueAtTime(800, startTime + Math.min(0.4, dur));
        attack = 0.006;
        release = 0.14;
        break;
      }
    }

    if (patch !== 'sub_dub' && patch !== 'trap_808') {
      osc1.frequency.setValueAtTime(freq, startTime);
    }
    if (!['melodica_dub', 'organ_skank', 'flute_airy', 'whistle_western', 'rhodes_ep', 'warm_rhodes', 'vibraphone_jazz', 'dark_trap_bells'].includes(patch)) {
      osc2.frequency.setValueAtTime(freq, startTime);
    }

    const osc2Mix = ctx.createGain();
    osc2Mix.gain.value = 0.45;

    osc1.connect(vcf);
    osc2.connect(osc2Mix);
    osc2Mix.connect(vcf);
    vcf.connect(out);

    out.gain.setValueAtTime(0.0001, startTime);
    out.gain.linearRampToValueAtTime(peak, startTime + attack);
    out.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.45), startTime + dur);
    out.gain.exponentialRampToValueAtTime(0.0001, startTime + dur + release);

    out.connect(graph.inputBus);

    if (sendDelay > 0.02) {
      const dSend = ctx.createGain();
      dSend.gain.value = sendDelay;
      out.connect(dSend);
      dSend.connect(graph.delaySend);
    }
    if (sendReverb > 0.02) {
      const rSend = ctx.createGain();
      rSend.gain.value = sendReverb;
      out.connect(rSend);
      rSend.connect(graph.reverbSend);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + dur + release + 0.02);
    osc2.stop(startTime + dur + release + 0.02);
  }

  // Synthesize Drum Hits (Kick, Snare/Rimshot, Hi-Hat / Trap Roll, Perc/Clave)
  function triggerDrumHit(ctx, graph, kit, type, startTime, velocity, stepDurSec) {
    const v = Math.max(0.1, Math.min(1.0, velocity));

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kit === 'chip_kit' ? 'triangle' : 'sine';
      const startFreq = kit === 'trap_kit' ? 145 : (kit === 'cyber_kit' ? 165 : 130);
      const endFreq = kit === 'trap_kit' ? 38 : 46;
      const decay = kit === 'trap_kit' ? 0.36 : 0.22;

      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.07);
      gain.gain.setValueAtTime(v * 0.55, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

      osc.connect(gain);
      gain.connect(graph.inputBus);
      osc.start(startTime);
      osc.stop(startTime + decay + 0.02);
      return;
    }

    if (type === 'snare') {
      // Tone body + filtered noise burst
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      const isDubRim = kit === 'dub_kit' || kit === 'bossa_kit';
      osc.frequency.setValueAtTime(isDubRim ? 390 : 210, startTime);
      osc.frequency.exponentialRampToValueAtTime(isDubRim ? 180 : 110, startTime + 0.06);
      oscGain.gain.setValueAtTime(v * 0.28, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
      osc.connect(oscGain);
      oscGain.connect(graph.inputBus);
      osc.start(startTime);
      osc.stop(startTime + 0.1);

      // Noise snap
      const noiseLen = Math.floor(ctx.sampleRate * (kit === 'cyber_kit' ? 0.26 : 0.16));
      const nBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const data = nBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = nBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = isDubRim ? 1200 : 700;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(v * 0.30, startTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, startTime + (kit === 'cyber_kit' ? 0.25 : 0.15));

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(graph.inputBus);

      if (kit === 'dub_kit' || kit === 'cyber_kit') {
        const send = ctx.createGain();
        send.gain.value = kit === 'dub_kit' ? 0.55 : 0.4;
        nGain.connect(send);
        send.connect(kit === 'dub_kit' ? graph.delaySend : graph.reverbSend);
      }

      noise.start(startTime);
      return;
    }

    if (type === 'hat' || type === 'hat_open_or_roll') {
      const isTrapRoll = type === 'hat_open_or_roll' && kit === 'trap_kit';
      const subHits = isTrapRoll ? 2 : 1;
      for (let h = 0; h < subHits; h++) {
        const t = startTime + h * (stepDurSec * 0.5);
        const dur = (type === 'hat_open_or_roll' && !isTrapRoll) ? 0.18 : 0.045;
        const len = Math.floor(ctx.sampleRate * dur);
        const nBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = nBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = nBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(v * 0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(hp);
        hp.connect(g);
        g.connect(graph.inputBus);
        noise.start(t);
      }
      return;
    }

    if (type === 'perc') {
      // Clave / Rim / Cowbell
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(kit === 'trap_kit' ? 780 : 1150, startTime);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 4.0;
      g.gain.setValueAtTime(v * 0.18, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.055);
      osc.connect(bp);
      bp.connect(g);
      g.connect(graph.inputBus);
      osc.start(startTime);
      osc.stop(startTime + 0.065);
    }
  }

  // --------------------------------------------------------------------------
  // 6. STANDARD MIDI FILE (.MID) BINARY ENCODER & PARSER
  // --------------------------------------------------------------------------
  function writeVarLen(value) {
    let buffer = value & 0x7F;
    const bytes = [];
    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= ((value & 0x7F) | 0x80);
    }
    while (true) {
      bytes.push(buffer & 0xFF);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return bytes;
  }

  function buildTrackChunk(trackEvents) {
    // Sort by tick
    trackEvents.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const data = [];
    let lastTick = 0;
    for (const ev of trackEvents) {
      const delta = Math.max(0, Math.round(ev.tick - lastTick));
      lastTick = Math.round(ev.tick);
      data.push(...writeVarLen(delta), ...ev.bytes);
    }
    // End of Track meta event
    data.push(0x00, 0xFF, 0x2F, 0x00);

    const len = data.length;
    return [
      0x4D, 0x54, 0x72, 0x6B, // 'MTrk'
      (len >> 24) & 0xFF,
      (len >> 16) & 0xFF,
      (len >> 8) & 0xFF,
      len & 0xFF,
      ...data
    ];
  }

  function encodeArrangementToMidiBlob(compiled, bp, loops = 2) {
    const ppq = 480; // ticks per quarter note
    const ticksPer16th = ppq / 4; // 120 ticks
    const bpm = Math.max(40, Math.min(220, Number(bp.tempo_bpm) || 110));
    const usPerQuarter = Math.round(60000000 / bpm);

    // Track 0: Tempo & Title Meta Track
    const metaEvents = [
      {
        tick: 0,
        order: 0,
        bytes: [
          0xFF, 0x51, 0x03,
          (usPerQuarter >> 16) & 0xFF,
          (usPerQuarter >> 8) & 0xFF,
          usPerQuarter & 0xFF
        ]
      }
    ];

    const gmProgramMap = {
      melodica_dub: 22,    // Harmonica / Melodica
      supersaw_cyber: 81,  // Lead 2 (sawtooth)
      square_8bit: 80,     // Lead 1 (square)
      rhodes_ep: 4,        // Electric Piano 1
      acid_303_lead: 87,   // Lead 8 (bass + lead)
      flute_airy: 73,      // Flute
      fuzz_lead: 30,       // Distortion Guitar
      vibraphone_jazz: 11, // Vibraphone
      brass_horn: 61,      // Brass Section
      whistle_western: 78, // Whistle
      organ_skank: 18,     // Rock Organ
      warm_rhodes: 4,      // Electric Piano 1
      cyber_pwm: 89,       // Pad 2 (warm)
      chip_arp: 80,        // Square
      nylon_guitar: 24,    // Acoustic Guitar (nylon)
      doom_power_stack: 30,// Distortion Guitar
      clavinet_funk: 7,    // Clavinet
      dark_trap_bells: 14, // Tubular Bells
      honky_tonk: 3,       // Honky-tonk Piano
      sub_dub: 38,         // Synth Bass 1
      trap_808: 38,        // Synth Bass 1
      reese_cyber: 39,     // Synth Bass 2
      upright_jazz: 32,    // Acoustic Bass
      tb303_acid: 38,      // Synth Bass 1
      nes_triangle: 38,    // Synth Bass 1
      doom_fuzz: 34,       // Electric Bass (pick)
      slap_funk: 36        // Slap Bass 1
    };

    function buildNoteTrack(notesArray, channel, programNum) {
      const evs = [];
      if (channel !== 9) {
        evs.push({ tick: 0, order: 0, bytes: [0xC0 | channel, programNum & 0x7F] });
      }
      for (let l = 0; l < loops; l++) {
        const loopOffsetSteps = l * 128;
        notesArray.forEach(n => {
          const startTick = (loopOffsetSteps + n.step) * ticksPer16th;
          const durTicks = Math.max(30, n.dur * ticksPer16th);
          const midi = Math.max(0, Math.min(127, Math.round(n.midi)));
          const vel = Math.max(1, Math.min(127, Math.round((n.vel || 0.8) * 115)));
          evs.push({ tick: startTick, order: 2, bytes: [0x90 | channel, midi, vel] });
          evs.push({ tick: startTick + durTicks, order: 1, bytes: [0x80 | channel, midi, 0] });
        });
      }
      return buildTrackChunk(evs);
    }

    const chunks = [
      buildTrackChunk(metaEvents),
      buildNoteTrack(compiled.melody, 0, gmProgramMap[bp.melody_spec?.patch] ?? 80),
      buildNoteTrack(compiled.ai_hook, 1, 11),
      buildNoteTrack(compiled.chords, 2, gmProgramMap[bp.chord_spec?.patch] ?? 4),
      buildNoteTrack(compiled.bass, 3, gmProgramMap[bp.bass_spec?.patch] ?? 38),
      buildNoteTrack(compiled.drums, 9, 0) // Channel 10 GM Percussion
    ];

    const numTracks = chunks.length;
    const header = [
      0x4D, 0x54, 0x68, 0x64, // 'MThd'
      0x00, 0x00, 0x00, 0x06, // Header size 6
      0x00, 0x01,             // Format 1 (multi-track)
      (numTracks >> 8) & 0xFF, numTracks & 0xFF,
      (ppq >> 8) & 0xFF, ppq & 0xFF
    ];

    const totalLen = header.length + chunks.reduce((acc, c) => acc + c.length, 0);
    const out = new Uint8Array(totalLen);
    out.set(header, 0);
    let offset = header.length;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return new Blob([out], { type: 'audio/midi' });
  }

  // Parse an uploaded .MID file into our symbolic format
  function parseUploadedMidiFile(arrayBuffer, fileName) {
    const bytes = new Uint8Array(arrayBuffer);
    let pos = 0;
    function readU16() { pos += 2; return (bytes[pos - 2] << 8) | bytes[pos - 1]; }
    function readU32() { pos += 4; return ((bytes[pos - 4] << 24) >>> 0) + ((bytes[pos - 3] << 16) | (bytes[pos - 2] << 8) | bytes[pos - 1]); }
    function readVar() {
      let val = 0;
      while (pos < bytes.length) {
        const b = bytes[pos++];
        val = (val << 7) | (b & 0x7F);
        if ((b & 0x80) === 0) break;
      }
      return val;
    }

    // Verify MThd
    if (bytes[0] !== 0x4D || bytes[1] !== 0x54 || bytes[2] !== 0x68 || bytes[3] !== 0x64) {
      throw new Error('Not a valid Standard MIDI (.mid) file');
    }
    pos = 8;
    const format = readU16();
    const nTracks = readU16();
    const division = readU16();
    const ppq = (division & 0x8000) ? 480 : (division || 480);

    const allNotes = [];
    for (let t = 0; t < nTracks && pos < bytes.length; t++) {
      if (bytes[pos] !== 0x4D || bytes[pos + 1] !== 0x54) break;
      pos += 4;
      const trackLen = readU32();
      const trackEnd = Math.min(bytes.length, pos + trackLen);
      let tick = 0;
      let runningStatus = 0;
      const openNotes = {};

      while (pos < trackEnd) {
        tick += readVar();
        let status = bytes[pos];
        if (status < 0x80) {
          status = runningStatus;
        } else {
          pos++;
          if (status < 0xF0) runningStatus = status;
        }
        const type = status & 0xF0;
        const ch = status & 0x0F;
        if (type === 0x90 || type === 0x80) {
          const note = bytes[pos++];
          const vel = bytes[pos++];
          if (ch !== 9) {
            if (type === 0x90 && vel > 0) {
              openNotes[note] = tick;
            } else if (openNotes[note] !== undefined) {
              allNotes.push({ tick: openNotes[note], durTicks: Math.max(1, tick - openNotes[note]), midi: note });
              delete openNotes[note];
            }
          }
        } else if (type === 0xA0 || type === 0xB0 || type === 0xE0) {
          pos += 2;
        } else if (type === 0xC0 || type === 0xD0) {
          pos += 1;
        } else if (status === 0xFF) {
          pos++; // meta type
          const len = readVar();
          pos += len;
        } else if (status === 0xF0 || status === 0xF7) {
          const len = readVar();
          pos += len;
        } else {
          break;
        }
      }
      pos = trackEnd;
    }

    if (allNotes.length === 0) throw new Error('No melodic notes found in MIDI file');
    allNotes.sort((a, b) => a.tick - b.tick || b.midi - a.midi);
    const firstTick = allNotes[0].tick;
    const ticksPer16th = ppq / 4;
    const keyRoot = allNotes[0].midi;

    const melody = [];
    const usedSteps = new Set();
    for (const n of allNotes) {
      const step = Math.round((n.tick - firstTick) / ticksPer16th);
      if (step >= 0 && step < 128 && !usedSteps.has(step)) {
        usedSteps.add(step);
        melody.push({
          step,
          dur: Math.max(1, Math.min(16, Math.round(n.durTicks / ticksPer16th))),
          semi: n.midi - keyRoot
        });
      }
    }

    const cleanName = fileName.replace(/\.(mid|midi)$/i, '');
    return {
      id: 'custom_midi',
      composer: 'Uploaded MIDI',
      title: cleanName,
      key: 'C',
      keyRoot: Math.max(55, Math.min(72, keyRoot)),
      mode: 'major',
      bpm: 120,
      chords: [
        { bar: 0, deg: 0, qual: 'maj' }, { bar: 1, deg: 5, qual: 'maj' },
        { bar: 2, deg: 7, qual: 'dom7' }, { bar: 3, deg: 0, qual: 'maj' },
        { bar: 4, deg: 9, qual: 'min' }, { bar: 5, deg: 5, qual: 'maj' },
        { bar: 6, deg: 7, qual: 'dom7' }, { bar: 7, deg: 0, qual: 'maj' }
      ],
      melody
    };
  }

  // --------------------------------------------------------------------------
  // 7. OFFLINE AUDIO RENDERER & MP3 / WAV ENCODER
  // --------------------------------------------------------------------------
  function encodeAudioBufferToWavBlob(audioBuffer) {
    const numCh = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numCh * bytesPerSample;
    const dataSize = numSamples * blockAlign;
    const buf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buf);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = numCh > 1 ? audioBuffer.getChannelData(1) : ch0;
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s0 = Math.max(-1, Math.min(1, ch0[i]));
      const s1 = Math.max(-1, Math.min(1, ch1[i]));
      view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7FFF, true);
      view.setInt16(offset + 2, s1 < 0 ? s1 * 0x8000 : s1 * 0x7FFF, true);
      offset += 4;
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  async function ensureLameJsLoaded() {
    if (window.lamejs) return true;
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
      s.onload = () => resolve(Boolean(window.lamejs));
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function renderArrangementToAudioBlob(compiled, bp, stemMutes, loops = 2) {
    const bpm = Math.max(50, Math.min(190, Number(bp.tempo_bpm) || 110));
    const swing = Math.max(0, Math.min(0.65, Number(bp.swing) || 0));
    const stepDurSec = 60 / bpm / 4;
    const totalSteps = 128 * loops;
    const totalDurationSec = Math.min(58, totalSteps * stepDurSec + 1.8);
    const sampleRate = 44100;

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDurationSec * sampleRate), sampleRate);
    const graph = createAudioGraph(offlineCtx, bp.fx_spec, stepDurSec);
    graph.masterGain.connect(offlineCtx.destination);

    function stepToTime(absStep) {
      const swingOffset = (absStep % 2 === 1) ? swing * stepDurSec * 0.65 : 0;
      return 0.1 + absStep * stepDurSec + swingOffset;
    }

    for (let l = 0; l < loops; l++) {
      const base = l * 128;
      if (!stemMutes.melody) {
        compiled.melody.forEach(n => {
          triggerSynthNote(offlineCtx, graph, bp.melody_spec?.patch || 'melodica_dub', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, n.echo);
        });
      }
      if (!stemMutes.ai_hook) {
        compiled.ai_hook.forEach(n => {
          triggerSynthNote(offlineCtx, graph, 'vibraphone_jazz', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, false);
        });
      }
      if (!stemMutes.chords) {
        compiled.chords.forEach(n => {
          triggerSynthNote(offlineCtx, graph, bp.chord_spec?.patch || 'organ_skank', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, false);
        });
      }
      if (!stemMutes.bass) {
        compiled.bass.forEach(n => {
          triggerSynthNote(offlineCtx, graph, bp.bass_spec?.patch || 'sub_dub', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, false);
        });
      }
      if (!stemMutes.drums) {
        compiled.drums.forEach(d => {
          triggerDrumHit(offlineCtx, graph, bp.drum_spec?.kit || 'dub_kit', d.type, stepToTime(base + d.step), d.vel, stepDurSec);
        });
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const hasLame = await ensureLameJsLoaded();

    if (hasLame && window.lamejs) {
      try {
        const mp3encoder = new window.lamejs.Mp3Encoder(2, sampleRate, 192);
        const left = renderedBuffer.getChannelData(0);
        const right = renderedBuffer.getChannelData(1);
        const sampleBlockSize = 1152;
        const leftInt = new Int16Array(left.length);
        const rightInt = new Int16Array(right.length);
        for (let i = 0; i < left.length; i++) {
          const l = Math.max(-1, Math.min(1, left[i]));
          const r = Math.max(-1, Math.min(1, right[i]));
          leftInt[i] = l < 0 ? l * 0x8000 : l * 0x7FFF;
          rightInt[i] = r < 0 ? r * 0x8000 : r * 0x7FFF;
        }
        const mp3Data = [];
        for (let i = 0; i < leftInt.length; i += sampleBlockSize) {
          const leftChunk = leftInt.subarray(i, i + sampleBlockSize);
          const rightChunk = rightInt.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
          if (mp3buf.length > 0) mp3Data.push(mp3buf);
        }
        const endBuf = mp3encoder.flush();
        if (endBuf.length > 0) mp3Data.push(endBuf);
        return { blob: new Blob(mp3Data, { type: 'audio/mp3' }), ext: 'mp3' };
      } catch (e) {
        console.warn('MP3 encode fallback to WAV:', e);
      }
    }

    return { blob: encodeAudioBufferToWavBlob(renderedBuffer), ext: 'wav' };
  }

  // --------------------------------------------------------------------------
  // 8. MAIN UI & REALTIME SEQUENCER CONTROLLER
  // --------------------------------------------------------------------------
  class MidiGenreMorpher {
    constructor() {
      this.ctx = null;
      this.graph = null;
      this.analyser = null;
      this.isPlaying = false;
      this.currentStep = 0;
      this.nextStepTime = 0;
      this.schedulerTimer = null;
      this.rafId = null;

      this.currentPiece = COMPOSER_LIBRARY.mozart_nachtmusik;
      this.currentGenreId = 'reggae_dub';
      this.currentBlueprint = GENRE_CATALOG.reggae_dub.defaultBlueprint(this.currentPiece);
      this.compiled = compileMorphedArrangement(this.currentPiece, this.currentBlueprint);

      this.stemMutes = {
        melody: false,
        ai_hook: false,
        chords: false,
        bass: false,
        drums: false
      };

      this.particles = [];
      this.activeNoteFlashes = [];
      this.initDOM();
    }

    initDOM() {
      this.canvas = document.getElementById('mm-canvas');
      if (!this.canvas) return;
      this.cctx = this.canvas.getContext('2d');

      this.composerSelect = document.getElementById('mm-composer-select');
      this.genreSelect = document.getElementById('mm-genre-select');
      this.customPromptInput = document.getElementById('mm-custom-prompt');
      this.morphBtn = document.getElementById('btn-mm-morph');
      this.playBtn = document.getElementById('btn-mm-play');
      this.midiUploadInput = document.getElementById('mm-midi-upload');
      this.downloadMidBtn = document.getElementById('btn-mm-dl-mid');
      this.downloadMp3Btn = document.getElementById('btn-mm-dl-mp3');

      this.titleDisplay = document.getElementById('mm-track-title');
      this.logDisplay = document.getElementById('mm-producer-log');
      this.statusBadge = document.getElementById('mm-status-badge');

      this.bpmSlider = document.getElementById('mm-slider-bpm');
      this.bpmVal = document.getElementById('mm-val-bpm');
      this.swingSlider = document.getElementById('mm-slider-swing');
      this.swingVal = document.getElementById('mm-val-swing');
      this.echoSlider = document.getElementById('mm-slider-echo');
      this.echoVal = document.getElementById('mm-val-echo');
      this.filterSlider = document.getElementById('mm-slider-filter');
      this.filterVal = document.getElementById('mm-val-filter');

      // Bind Morph button (Always queries /api/midi-morph LLM arranger with local fallback)
      if (this.morphBtn) {
        this.morphBtn.addEventListener('click', () => this.runAiMorph(true));
      }

      // Bind Play/Pause
      if (this.playBtn) {
        this.playBtn.addEventListener('click', () => {
          if (this.isPlaying) this.stop();
          else this.start();
        });
      }

      // Bind MIDI Upload
      if (this.midiUploadInput) {
        this.midiUploadInput.addEventListener('change', async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const buf = await file.arrayBuffer();
            const parsedPiece = parseUploadedMidiFile(buf, file.name);
            COMPOSER_LIBRARY.custom_midi = parsedPiece;
            this.currentPiece = parsedPiece;
            if (this.composerSelect) {
              let opt = this.composerSelect.querySelector('option[value="custom_midi"]');
              if (!opt) {
                opt = document.createElement('option');
                opt.value = 'custom_midi';
                this.composerSelect.prepend(opt);
              }
              opt.textContent = `📂 Uploaded: ${parsedPiece.title}`;
              this.composerSelect.value = 'custom_midi';
            }
            await this.runAiMorph(true);
          } catch (err) {
            if (this.logDisplay) {
              this.logDisplay.textContent = `MIDI Parse Error: ${err.message}`;
            }
          }
        });
      }

      // Bind Stem Mute Toggles
      document.querySelectorAll('.mm-stem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const stem = btn.getAttribute('data-stem');
          if (!stem) return;
          this.stemMutes[stem] = !this.stemMutes[stem];
          btn.classList.toggle('muted', this.stemMutes[stem]);
        });
      });

      // Bind Live Sliders
      if (this.bpmSlider) {
        this.bpmSlider.addEventListener('input', (e) => {
          const v = Number(e.target.value);
          this.currentBlueprint.tempo_bpm = v;
          if (this.bpmVal) this.bpmVal.textContent = `${v} BPM`;
        });
      }
      if (this.swingSlider) {
        this.swingSlider.addEventListener('input', (e) => {
          const v = Number(e.target.value);
          this.currentBlueprint.swing = v / 100;
          if (this.swingVal) this.swingVal.textContent = `${v}%`;
        });
      }
      if (this.echoSlider) {
        this.echoSlider.addEventListener('input', (e) => {
          const v = Number(e.target.value);
          if (this.echoVal) this.echoVal.textContent = `${v}%`;
          if (this.currentBlueprint.fx_spec) this.currentBlueprint.fx_spec.delay_wet = v / 100;
          if (this.graph && this.ctx) {
            this.graph.delayWet.gain.setTargetAtTime(v / 100, this.ctx.currentTime, 0.03);
          }
        });
      }
      if (this.filterSlider) {
        this.filterSlider.addEventListener('input', (e) => {
          const v = Number(e.target.value);
          if (this.filterVal) this.filterVal.textContent = `${(v / 1000).toFixed(1)}kHz`;
          if (this.currentBlueprint.fx_spec) this.currentBlueprint.fx_spec.filter_cutoff = v;
          if (this.graph && this.ctx) {
            this.graph.masterFilter.frequency.setTargetAtTime(v, this.ctx.currentTime, 0.03);
          }
        });
      }

      // Bind Download .MID
      if (this.downloadMidBtn) {
        this.downloadMidBtn.addEventListener('click', () => {
          const blob = encodeArrangementToMidiBlob(this.compiled, this.currentBlueprint, 2);
          const slug = (this.currentBlueprint.mashup_title || 'midi-morph').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slug || 'morphed-track'}.mid`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 3000);
        });
      }

      // Bind Download .MP3 / .WAV
      if (this.downloadMp3Btn) {
        this.downloadMp3Btn.addEventListener('click', async () => {
          const origHtml = this.downloadMp3Btn.innerHTML;
          this.downloadMp3Btn.disabled = true;
          this.downloadMp3Btn.innerHTML = '<i class="fa-solid fa-Compact-disc fa-spin"></i> RENDERING...';
          try {
            const { blob, ext } = await renderArrangementToAudioBlob(this.compiled, this.currentBlueprint, this.stemMutes, 2);
            const slug = (this.currentBlueprint.mashup_title || 'midi-morph').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${slug || 'morphed-track'}.${ext}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
          } catch (err) {
            console.error('Audio export failed:', err);
          } finally {
            this.downloadMp3Btn.disabled = false;
            this.downloadMp3Btn.innerHTML = origHtml;
          }
        });
      }

      this.syncUiFromBlueprint();
      this.renderVisualizerFrame();
    }

    syncUiFromBlueprint() {
      const bp = this.currentBlueprint;
      if (this.titleDisplay) this.titleDisplay.textContent = bp.mashup_title || 'Untitled AI Arrangement';
      if (this.logDisplay) this.logDisplay.textContent = bp.producer_log || '';

      const bpm = Math.round(Number(bp.tempo_bpm) || 110);
      const swingPct = Math.round((Number(bp.swing) || 0) * 100);
      const echoPct = Math.round((Number(bp.fx_spec?.delay_wet) ?? 0.3) * 100);
      const cutoff = Math.round(Number(bp.fx_spec?.filter_cutoff) || 7500);

      if (this.bpmSlider) this.bpmSlider.value = bpm;
      if (this.bpmVal) this.bpmVal.textContent = `${bpm} BPM`;
      if (this.swingSlider) this.swingSlider.value = swingPct;
      if (this.swingVal) this.swingVal.textContent = `${swingPct}%`;
      if (this.echoSlider) this.echoSlider.value = echoPct;
      if (this.echoVal) this.echoVal.textContent = `${echoPct}%`;
      if (this.filterSlider) this.filterSlider.value = cutoff;
      if (this.filterVal) this.filterVal.textContent = `${(cutoff / 1000).toFixed(1)}kHz`;

      if (this.statusBadge) {
        const scaleLabel = (bp.scale_mode || 'keep_original').replace(/_/g, ' ').toUpperCase();
        const leadPatch = (bp.melody_spec?.patch || 'synth').replace(/_/g, ' ').toUpperCase();
        this.statusBadge.textContent = `MODE: ${scaleLabel} · LEAD: ${leadPatch}`;
      }

      if (this.graph && this.ctx) {
        this.graph.delayWet.gain.setTargetAtTime(echoPct / 100, this.ctx.currentTime, 0.04);
        this.graph.masterFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.04);
        this.graph.shaper.curve = makeDistortionCurve(Number(bp.fx_spec?.crush) || 0);
      }
    }

    async runAiMorph(autoPlay = true) {
      const compId = this.composerSelect?.value || 'mozart_nachtmusik';
      const genreId = this.genreSelect?.value || 'reggae_dub';
      const customPrompt = this.customPromptInput?.value?.trim() || '';

      if (compId !== 'ai_wildcard' && COMPOSER_LIBRARY[compId]) {
        this.currentPiece = COMPOSER_LIBRARY[compId];
      } else if (compId === 'ai_wildcard') {
        this.currentPiece = {
          id: 'ai_wildcard',
          composer: customPrompt || 'AI Composer',
          title: customPrompt || 'Wildcard Theme',
          key: 'C',
          keyRoot: 60,
          mode: 'minor',
          bpm: 120,
          chords: COMPOSER_LIBRARY.mozart_turca.chords,
          melody: COMPOSER_LIBRARY.mozart_turca.melody
        };
      }
      this.currentGenreId = genreId;
      const genreEntry = GENRE_CATALOG[genreId] || GENRE_CATALOG.reggae_dub;

      if (this.morphBtn) {
        this.morphBtn.disabled = true;
        this.morphBtn.innerHTML = '<i class="fa-solid fa-bolt fa-beat"></i> AI ARRANGING...';
      }
      if (this.statusBadge) {
        this.statusBadge.textContent = 'CONSULTING LLM MUSIC THEORIST...';
      }

      let blueprint = null;
      try {
        const res = await fetch('/api/midi-morph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            composerId: compId,
            pieceMeta: {
              composer: this.currentPiece.composer,
              title: this.currentPiece.title,
              key: this.currentPiece.key,
              mode: this.currentPiece.mode,
              bpm: this.currentPiece.bpm
            },
            genreId,
            genreLabel: genreEntry.label.replace(/^[^\w]+/, '').trim(),
            customPrompt
          })
        });
        if (res.ok) {
          blueprint = await res.json();
        }
      } catch (err) {
        console.warn('Using local Music Theory AI Arranger fallback:', err);
      }

      if (!blueprint || !blueprint.tempo_bpm) {
        blueprint = genreEntry.defaultBlueprint(this.currentPiece);
        if (customPrompt) {
          blueprint.mashup_title = `${this.currentPiece.title.split('(')[0].trim()} × ${customPrompt}`;
          blueprint.producer_log = `Custom AI Vibe "${customPrompt}": ${blueprint.producer_log}`;
        }
      }

      this.currentBlueprint = blueprint;
      this.compiled = compileMorphedArrangement(this.currentPiece, this.currentBlueprint);
      this.syncUiFromBlueprint();

      if (this.morphBtn) {
        this.morphBtn.disabled = false;
        this.morphBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> MORPH &amp; ARRANGE';
      }

      if (autoPlay) {
        this.currentStep = 0;
        this.start();
      } else {
        this.renderVisualizerFrame();
      }
    }

    ensureAudioContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const bpm = Math.max(50, Math.min(190, Number(this.currentBlueprint.tempo_bpm) || 110));
      const stepDurSec = 60 / bpm / 4;
      if (!this.graph) {
        this.graph = createAudioGraph(this.ctx, this.currentBlueprint.fx_spec, stepDurSec);
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.graph.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }

    start() {
      this.ensureAudioContext();
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.nextStepTime = this.ctx.currentTime + 0.05;

      if (this.playBtn) {
        this.playBtn.innerHTML = '<i class="fa-solid fa-stop"></i> STOP';
        this.playBtn.classList.add('playing');
      }

      this.schedulerTimer = setInterval(() => this.schedulerTick(), 25);
      const loopViz = () => {
        if (!this.isPlaying) return;
        this.renderVisualizerFrame();
        this.rafId = requestAnimationFrame(loopViz);
      };
      this.rafId = requestAnimationFrame(loopViz);
    }

    stop() {
      this.isPlaying = false;
      if (this.schedulerTimer) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.playBtn) {
        this.playBtn.innerHTML = '<i class="fa-solid fa-play"></i> PLAY';
        this.playBtn.classList.remove('playing');
      }
      this.renderVisualizerFrame();
    }

    schedulerTick() {
      if (!this.isPlaying || !this.ctx) return;
      const lookaheadSec = 0.12;
      while (this.nextStepTime < this.ctx.currentTime + lookaheadSec) {
        this.scheduleStep(this.currentStep, this.nextStepTime);
        this.advanceStep();
      }
    }

    advanceStep() {
      const bpm = Math.max(50, Math.min(190, Number(this.currentBlueprint.tempo_bpm) || 110));
      const swing = Math.max(0, Math.min(0.65, Number(this.currentBlueprint.swing) || 0));
      const baseStepDur = 60 / bpm / 4;
      const isEven = (this.currentStep % 2 === 0);
      const stepDur = isEven ? baseStepDur * (1 + swing * 0.55) : baseStepDur * (1 - swing * 0.55);

      this.nextStepTime += stepDur;
      this.currentStep = (this.currentStep + 1) % 128;
    }

    scheduleStep(step, time) {
      const bp = this.currentBlueprint;
      const bpm = Math.max(50, Math.min(190, Number(bp.tempo_bpm) || 110));
      const stepDurSec = 60 / bpm / 4;

      const flashTrack = (stem, color, midi) => {
        this.activeNoteFlashes.push({ stem, color, midi, birth: performance.now() });
        const btn = document.querySelector(`.mm-stem-btn[data-stem="${stem}"]`);
        if (btn && !this.stemMutes[stem]) {
          btn.classList.add('triggered');
          setTimeout(() => btn.classList.remove('triggered'), 110);
        }
      };

      if (!this.stemMutes.melody) {
        this.compiled.melody.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.melody_spec?.patch || 'melodica_dub', n.midi, time, n.dur * stepDurSec, n.vel, n.echo);
          flashTrack('melody', '#00f2fe', n.midi);
        });
      }
      if (!this.stemMutes.ai_hook) {
        this.compiled.ai_hook.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, 'vibraphone_jazz', n.midi, time, n.dur * stepDurSec, n.vel, false);
          flashTrack('ai_hook', '#a855f7', n.midi);
        });
      }
      if (!this.stemMutes.chords) {
        this.compiled.chords.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.chord_spec?.patch || 'organ_skank', n.midi, time, n.dur * stepDurSec, n.vel, false);
          flashTrack('chords', '#ff7eb3', n.midi);
        });
      }
      if (!this.stemMutes.bass) {
        this.compiled.bass.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.bass_spec?.patch || 'sub_dub', n.midi, time, n.dur * stepDurSec, n.vel, false);
          flashTrack('bass', '#10b981', n.midi);
        });
      }
      if (!this.stemMutes.drums) {
        this.compiled.drums.filter(d => Math.floor(d.step) === step).forEach(d => {
          triggerDrumHit(this.ctx, this.graph, bp.drum_spec?.kit || 'dub_kit', d.type, time, d.vel, stepDurSec);
          flashTrack('drums', '#f59e0b', d.midi);
        });
      }
    }

    renderVisualizerFrame() {
      if (!this.canvas || !this.cctx) return;
      const ctx = this.cctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Cyberpunk Neon DAW backdrop
      ctx.fillStyle = '#070913';
      ctx.fillRect(0, 0, w, h);

      // Subtle DAW grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
      ctx.lineWidth = 1;
      const numStepCols = 32; // Show a 2-bar (32-step) scrolling window
      const colW = w / numStepCols;
      for (let i = 0; i <= numStepCols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * colW, 0);
        ctx.lineTo(i * colW, h);
        ctx.strokeStyle = (i % 4 === 0) ? 'rgba(0, 242, 254, 0.16)' : 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
      }
      for (let r = 0; r < 8; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * (h / 8));
        ctx.lineTo(w, r * (h / 8));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
      }

      // Live FFT Spectrum Analyzer along the bottom
      if (this.analyser && this.isPlaying) {
        const freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqData);
        const barCount = 48;
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = freqData[i] / 255;
          const barH = val * (h * 0.34);
          const grad = ctx.createLinearGradient(0, h, 0, h - barH);
          grad.addColorStop(0, 'rgba(255, 126, 179, 0.28)');
          grad.addColorStop(1, 'rgba(0, 242, 254, 0.10)');
          ctx.fillStyle = grad;
          ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
        }
      }

      // Draw scrolling Piano Roll notes centered around playhead at 25% width
      const playheadX = w * 0.22;
      const minMidi = 32;
      const maxMidi = 88;

      const midiToY = (m) => {
        const norm = (m - minMidi) / (maxMidi - minMidi);
        return h - 18 - Math.max(0, Math.min(1, norm)) * (h - 36);
      };

      const trackLayers = [
        { key: 'chords', list: this.compiled.chords, color: '#ff7eb3', alpha: 0.55, height: 6 },
        { key: 'bass',   list: this.compiled.bass,   color: '#10b981', alpha: 0.85, height: 8 },
        { key: 'ai_hook',list: this.compiled.ai_hook,color: '#a855f7', alpha: 0.85, height: 7 },
        { key: 'melody', list: this.compiled.melody, color: '#00f2fe', alpha: 0.95, height: 9 }
      ];

      trackLayers.forEach(layer => {
        if (this.stemMutes[layer.key]) return;
        ctx.fillStyle = layer.color;
        layer.list.forEach(n => {
          let relStep = n.step - this.currentStep;
          if (relStep < -8) relStep += 128;
          if (relStep > -8 && relStep < 28) {
            const x = playheadX + relStep * colW;
            const nw = Math.max(5, n.dur * colW - 2);
            const y = midiToY(n.midi);
            const isActive = relStep <= 0 && (relStep + n.dur) >= 0 && this.isPlaying;

            ctx.save();
            ctx.globalAlpha = isActive ? 1.0 : layer.alpha;
            if (isActive) {
              ctx.shadowColor = layer.color;
              ctx.shadowBlur = 14;
            }
            ctx.beginPath();
            ctx.roundRect(x, y - layer.height / 2, nw, layer.height, 3);
            ctx.fill();
            ctx.restore();
          }
        });
      });

      // Draw Drum lane along bottom rail
      if (!this.stemMutes.drums) {
        this.compiled.drums.forEach(d => {
          let relStep = d.step - this.currentStep;
          if (relStep < -8) relStep += 128;
          if (relStep > -8 && relStep < 28) {
            const x = playheadX + relStep * colW;
            const y = d.type === 'kick' ? h - 8 : (d.type === 'snare' ? h - 16 : h - 23);
            ctx.fillStyle = d.type === 'kick' ? '#f59e0b' : (d.type === 'snare' ? '#ff7eb3' : '#38bdf8');
            ctx.beginPath();
            ctx.arc(x + 3, y, d.type === 'kick' ? 4 : 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Glowing Neon Playhead Laser
      ctx.save();
      ctx.strokeStyle = this.isPlaying ? '#00f2fe' : 'rgba(255, 126, 179, 0.5)';
      ctx.shadowColor = this.isPlaying ? '#00f2fe' : '#ff7eb3';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.restore();

      // HUD Bar & Step Counter in top-right of canvas
      const barNum = Math.floor(this.currentStep / 16) + 1;
      const beatNum = Math.floor((this.currentStep % 16) / 4) + 1;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`BAR ${barNum}/8 · BEAT ${beatNum}`, w - 10, 16);
    }
  }

  // Expose singleton instance so synth.js carousel controller can stop audio when navigating away
  window.addEventListener('DOMContentLoaded', () => {
    window.midiMorpherInstance = new MidiGenreMorpher();
  });
})();
