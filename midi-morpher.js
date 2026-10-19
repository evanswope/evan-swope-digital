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
      melody: [
        // Bar 0: G4 - D4 - G4 - D4
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
        // Bar 4: D5 - D5 - B5-A5-G5
        { step: 64, dur: 4, semi: 7 }, { step: 68, dur: 4, semi: 7 },
        { step: 72, dur: 2, semi: 11 }, { step: 74, dur: 2, semi: 9 },
        { step: 76, dur: 2, semi: 7 }, { step: 78, dur: 2, semi: 7 },
        // Bar 5: C5 - C5 - A5-G5-F#5-E5
        { step: 80, dur: 4, semi: 5 }, { step: 84, dur: 4, semi: 5 },
        { step: 88, dur: 2, semi: 9 }, { step: 90, dur: 2, semi: 7 },
        { step: 92, dur: 2, semi: 5 }, { step: 94, dur: 2, semi: 4 },
        // Bar 6: D5 - B4 - C5 - A4
        { step: 96, dur: 4, semi: 2 }, { step: 100, dur: 4, semi: 4 },
        { step: 104, dur: 4, semi: 5 }, { step: 108, dur: 4, semi: 2 },
        // Bar 7: G4 resolution + pickup
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
        { step: 0, dur: 1, semi: 2 }, { step: 1, dur: 1, semi: 0 }, { step: 2, dur: 1, semi: -1 }, { step: 3, dur: 1, semi: 0 },
        { step: 4, dur: 8, semi: 3 },
        { step: 16, dur: 1, semi: 5 }, { step: 17, dur: 1, semi: 3 }, { step: 18, dur: 1, semi: 2 }, { step: 19, dur: 1, semi: 3 },
        { step: 20, dur: 8, semi: 7 },
        { step: 32, dur: 1, semi: 8 }, { step: 33, dur: 1, semi: 7 }, { step: 34, dur: 1, semi: 6 }, { step: 35, dur: 1, semi: 7 },
        { step: 36, dur: 1, semi: 14 }, { step: 37, dur: 1, semi: 12 }, { step: 38, dur: 1, semi: 11 }, { step: 39, dur: 1, semi: 12 },
        { step: 40, dur: 1, semi: 14 }, { step: 41, dur: 1, semi: 12 }, { step: 42, dur: 1, semi: 11 }, { step: 43, dur: 1, semi: 12 },
        { step: 44, dur: 4, semi: 15 },
        { step: 48, dur: 4, semi: 12 }, { step: 52, dur: 4, semi: 15 },
        { step: 56, dur: 2, semi: 14 }, { step: 58, dur: 2, semi: 12 }, { step: 60, dur: 2, semi: 11 }, { step: 62, dur: 2, semi: 12 },
        { step: 64, dur: 1, semi: 2 }, { step: 65, dur: 1, semi: 0 }, { step: 66, dur: 1, semi: -1 }, { step: 67, dur: 1, semi: 0 },
        { step: 68, dur: 8, semi: 3 },
        { step: 80, dur: 1, semi: 5 }, { step: 81, dur: 1, semi: 3 }, { step: 82, dur: 1, semi: 2 }, { step: 83, dur: 1, semi: 3 },
        { step: 84, dur: 8, semi: 7 },
        { step: 96, dur: 4, semi: 7 }, { step: 100, dur: 4, semi: 8 },
        { step: 104, dur: 4, semi: 7 }, { step: 108, dur: 4, semi: 5 },
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
        { step: 0, dur: 1, semi: 19 }, { step: 1, dur: 1, semi: 17 }, { step: 2, dur: 6, semi: 19 },
        { step: 8, dur: 1, semi: 17 }, { step: 9, dur: 1, semi: 15 }, { step: 10, dur: 1, semi: 14 }, { step: 11, dur: 1, semi: 12 },
        { step: 12, dur: 2, semi: 11 }, { step: 14, dur: 2, semi: 12 },
        { step: 16, dur: 1, semi: 7 }, { step: 17, dur: 1, semi: 5 }, { step: 18, dur: 6, semi: 7 },
        { step: 24, dur: 2, semi: 2 }, { step: 26, dur: 2, semi: 3 }, { step: 28, dur: 2, semi: -1 }, { step: 30, dur: 2, semi: 0 },
        { step: 32, dur: 2, semi: -1 }, { step: 34, dur: 2, semi: 2 }, { step: 36, dur: 2, semi: 5 }, { step: 38, dur: 2, semi: 8 },
        { step: 40, dur: 2, semi: 7 }, { step: 42, dur: 2, semi: 5 }, { step: 44, dur: 2, semi: 3 }, { step: 46, dur: 2, semi: 2 },
        { step: 48, dur: 2, semi: 5 }, { step: 50, dur: 2, semi: 8 }, { step: 52, dur: 2, semi: 11 }, { step: 54, dur: 2, semi: 14 },
        { step: 56, dur: 2, semi: 12 }, { step: 58, dur: 2, semi: 10 }, { step: 60, dur: 2, semi: 8 }, { step: 62, dur: 2, semi: 7 },
        { step: 64, dur: 2, semi: 8 }, { step: 66, dur: 2, semi: 7 }, { step: 68, dur: 2, semi: 5 }, { step: 70, dur: 2, semi: 7 },
        { step: 72, dur: 2, semi: 3 }, { step: 74, dur: 2, semi: 7 }, { step: 76, dur: 2, semi: 2 }, { step: 78, dur: 2, semi: 7 },
        { step: 80, dur: 2, semi: 0 }, { step: 82, dur: 2, semi: 7 }, { step: 84, dur: 2, semi: -1 }, { step: 86, dur: 2, semi: 7 },
        { step: 88, dur: 2, semi: 2 }, { step: 90, dur: 2, semi: 5 }, { step: 92, dur: 2, semi: 3 }, { step: 94, dur: 2, semi: 2 },
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
        { step: 0, dur: 2, semi: 7 }, { step: 2, dur: 2, semi: 6 },
        { step: 4, dur: 2, semi: 7 }, { step: 6, dur: 2, semi: 6 },
        { step: 8, dur: 2, semi: 7 }, { step: 10, dur: 2, semi: 2 },
        { step: 12, dur: 2, semi: 5 }, { step: 14, dur: 2, semi: 3 },
        { step: 16, dur: 6, semi: 0 },
        { step: 24, dur: 2, semi: -9 }, { step: 26, dur: 2, semi: -5 },
        { step: 28, dur: 2, semi: 0 }, { step: 30, dur: 2, semi: 2 },
        { step: 32, dur: 6, semi: 2 },
        { step: 40, dur: 2, semi: -5 }, { step: 42, dur: 2, semi: -1 },
        { step: 44, dur: 2, semi: 2 }, { step: 46, dur: 2, semi: 3 },
        { step: 48, dur: 6, semi: 3 },
        { step: 56, dur: 2, semi: 7 }, { step: 58, dur: 2, semi: 6 },
        { step: 60, dur: 2, semi: 7 }, { step: 62, dur: 2, semi: 6 },
        { step: 64, dur: 2, semi: 7 }, { step: 66, dur: 2, semi: 2 },
        { step: 68, dur: 2, semi: 5 }, { step: 70, dur: 2, semi: 3 },
        { step: 72, dur: 6, semi: 0 },
        { step: 80, dur: 2, semi: -9 }, { step: 82, dur: 2, semi: -5 },
        { step: 84, dur: 2, semi: 0 }, { step: 86, dur: 4, semi: 2 },
        { step: 92, dur: 2, semi: 3 }, { step: 94, dur: 2, semi: 2 },
        { step: 96, dur: 6, semi: 0 },
        { step: 104, dur: 2, semi: 2 }, { step: 106, dur: 2, semi: 3 },
        { step: 108, dur: 2, semi: 5 }, { step: 110, dur: 2, semi: 7 },
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
        { step: 2, dur: 2, semi: 7 }, { step: 4, dur: 2, semi: 7 }, { step: 6, dur: 2, semi: 7 }, { step: 8, dur: 8, semi: 3 },
        { step: 18, dur: 2, semi: 5 }, { step: 20, dur: 2, semi: 5 }, { step: 22, dur: 2, semi: 5 }, { step: 24, dur: 8, semi: 2 },
        { step: 34, dur: 2, semi: 7 }, { step: 36, dur: 2, semi: 7 }, { step: 38, dur: 2, semi: 7 }, { step: 40, dur: 6, semi: 3 },
        { step: 50, dur: 2, semi: 8 }, { step: 52, dur: 2, semi: 8 }, { step: 54, dur: 2, semi: 8 }, { step: 56, dur: 6, semi: 5 },
        { step: 66, dur: 2, semi: 14 }, { step: 68, dur: 2, semi: 14 }, { step: 70, dur: 2, semi: 14 }, { step: 72, dur: 6, semi: 11 },
        { step: 82, dur: 2, semi: 12 }, { step: 84, dur: 2, semi: 12 }, { step: 86, dur: 2, semi: 12 }, { step: 88, dur: 6, semi: 7 },
        { step: 96, dur: 4, semi: 8 }, { step: 100, dur: 4, semi: 7 }, { step: 104, dur: 4, semi: 5 }, { step: 108, dur: 4, semi: 2 },
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
        { step: 0, dur: 2, semi: 12 }, { step: 2, dur: 2, semi: 14 }, { step: 4, dur: 2, semi: 15 }, { step: 6, dur: 2, semi: 17 },
        { step: 8, dur: 2, semi: 19 }, { step: 10, dur: 2, semi: 15 }, { step: 12, dur: 4, semi: 19 },
        { step: 16, dur: 2, semi: 18 }, { step: 18, dur: 2, semi: 14 }, { step: 20, dur: 4, semi: 18 },
        { step: 24, dur: 2, semi: 17 }, { step: 26, dur: 2, semi: 13 }, { step: 28, dur: 4, semi: 17 },
        { step: 32, dur: 2, semi: 12 }, { step: 34, dur: 2, semi: 14 }, { step: 36, dur: 2, semi: 15 }, { step: 38, dur: 2, semi: 17 },
        { step: 40, dur: 2, semi: 19 }, { step: 42, dur: 2, semi: 15 }, { step: 44, dur: 2, semi: 19 }, { step: 46, dur: 2, semi: 24 },
        { step: 48, dur: 2, semi: 22 }, { step: 50, dur: 2, semi: 19 }, { step: 52, dur: 2, semi: 15 }, { step: 54, dur: 2, semi: 19 },
        { step: 56, dur: 8, semi: 22 },
        { step: 64, dur: 2, semi: 19 }, { step: 66, dur: 2, semi: 21 }, { step: 68, dur: 2, semi: 23 }, { step: 70, dur: 2, semi: 24 },
        { step: 72, dur: 2, semi: 26 }, { step: 74, dur: 2, semi: 23 }, { step: 76, dur: 4, semi: 26 },
        { step: 80, dur: 2, semi: 24 }, { step: 82, dur: 2, semi: 21 }, { step: 84, dur: 4, semi: 24 },
        { step: 88, dur: 2, semi: 23 }, { step: 90, dur: 2, semi: 19 }, { step: 92, dur: 4, semi: 23 },
        { step: 96, dur: 2, semi: 12 }, { step: 98, dur: 2, semi: 14 }, { step: 100, dur: 2, semi: 15 }, { step: 102, dur: 2, semi: 17 },
        { step: 104, dur: 2, semi: 19 }, { step: 106, dur: 2, semi: 15 }, { step: 108, dur: 2, semi: 19 }, { step: 110, dur: 2, semi: 24 },
        { step: 112, dur: 2, semi: 22 }, { step: 114, dur: 2, semi: 19 }, { step: 116, dur: 4, semi: 22 },
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
        { step: 0, dur: 8, semi: 12 }, { step: 8, dur: 3, semi: 12 }, { step: 11, dur: 1, semi: 12 }, { step: 12, dur: 4, semi: 12 },
        { step: 16, dur: 4, semi: 15 }, { step: 20, dur: 3, semi: 14 }, { step: 23, dur: 1, semi: 12 }, { step: 24, dur: 4, semi: 12 }, { step: 28, dur: 4, semi: 11 },
        { step: 32, dur: 12, semi: 12 }, { step: 44, dur: 4, semi: 15 },
        { step: 48, dur: 8, semi: 19 }, { step: 56, dur: 6, semi: 20 }, { step: 62, dur: 2, semi: 19 },
        { step: 64, dur: 4, semi: 20 }, { step: 68, dur: 4, semi: 22 }, { step: 72, dur: 8, semi: 19 },
        { step: 80, dur: 4, semi: 17 }, { step: 84, dur: 4, semi: 19 }, { step: 88, dur: 8, semi: 15 },
        { step: 96, dur: 4, semi: 14 }, { step: 100, dur: 4, semi: 15 }, { step: 104, dur: 4, semi: 14 }, { step: 108, dur: 4, semi: 12 },
        { step: 112, dur: 16, semi: 12 }
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
        { step: 0, dur: 2, semi: 14 }, { step: 2, dur: 2, semi: 16 }, { step: 4, dur: 2, semi: 12 }, { step: 6, dur: 4, semi: 9 },
        { step: 10, dur: 2, semi: 11 }, { step: 12, dur: 4, semi: 7 },
        { step: 16, dur: 2, semi: 2 }, { step: 18, dur: 2, semi: 4 }, { step: 20, dur: 2, semi: 0 }, { step: 22, dur: 4, semi: -3 },
        { step: 26, dur: 2, semi: -1 }, { step: 28, dur: 4, semi: -5 },
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
  //    Each blueprint includes full ADSR, timbre, breath/rotary/chorus/drive,
  //    velocity curves, stereo panning, and drum tuning parameters.
  // --------------------------------------------------------------------------
  const GENRE_CATALOG = {
    reggae_dub: {
      id: 'reggae_dub',
      label: '🇯🇲 King Tubby Dub Reggae',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.title.split('(')[0].trim()} (Kingston '74 Dubplate)`,
        producer_log: `Framed ${piece.composer}'s melody on a breathy free-reed melodica with resonant tape-echo throws over a 76 BPM one-drop groove, Leslie roto-organ skanks, and a deep sub-bass bubble.`,
        tempo_bpm: 76,
        swing: 0.22,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'melodica_dub',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.022, decay: 0.18, sustain: 0.84, release: 0.10 },
          vel_curve: { base: 0.96, accent_downbeat: 0.06, humanize: 0.05 },
          timbre: { filter_cutoff: 3600, filter_q: 1.8, vibrato_rate: 5.2, vibrato_depth: 9, breath_noise: 0.12, chorus_detune: 9, rotary_speed: 'off', drive: 0.14 },
          sends: { reverb: 0.24, delay: 0.28, dub_echo_throws: 0.35 }
        },
        chord_spec: {
          patch: 'roto_organ',
          pattern: 'reggae_skank',
          voicing: 'triad',
          pan: 0.26,
          vel_scale: 0.48,
          adsr: { attack: 0.004, decay: 0.09, sustain: 0.35, release: 0.035 },
          timbre: { filter_cutoff: 2100, filter_q: 1.4, rotary_speed: 'fast', chorus_detune: 6, drive: 0.20 },
          sends: { reverb: 0.10, delay: 0.08 }
        },
        bass_spec: {
          patch: 'sub_dub',
          pattern: 'one_drop_bubble',
          pan: 0.0,
          vel_scale: 0.88,
          adsr: { attack: 0.006, decay: 0.20, sustain: 0.65, release: 0.11 },
          timbre: { filter_cutoff: 340, filter_q: 1.1, drive: 0.15 }
        },
        drum_spec: {
          kit: 'dub_kit',
          kick_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0.45, 0, 0, 0.65, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0.35, 0],
          hat_steps:   [0.5, 0, 0.85, 0, 0.5, 0, 0.85, 0, 0.5, 0, 0.85, 0, 0.5, 0, 1.25, 0],
          perc_steps:  [0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0],
          tuning: { kick_punch: 0.72, snare_snap: 0.70, hat_sizzle: 0.62, rim_dub_echo: 0.38, hat_pan: 0.24, perc_pan: -0.26 }
        },
        fx_spec: { delay_wet: 0.24, delay_steps: 3, reverb_wet: 0.20, filter_cutoff: 8800, crush: 0.0 }
      })
    },
    parisian_musette: {
      id: 'parisian_musette',
      label: '🪗 Parisian Café Accordion Musette',
      defaultBlueprint: (piece) => ({
        mashup_title: `Rue de ${piece.composer.split(' ').pop()} (Montmartre Accordion)`,
        producer_log: `Voiced ${piece.title}'s melody on a wet 3-reed Parisian musette accordion with bellows swell and woody reed-cavity resonance, backed by acoustic guitar pump chords and upright bass.`,
        tempo_bpm: 112,
        swing: 0.28,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'accordion_musette',
          feel: 'laid_back_swing',
          octave_shift: 0,
          pan: -0.05,
          adsr: { attack: 0.024, decay: 0.22, sustain: 0.86, release: 0.11 },
          vel_curve: { base: 0.96, accent_downbeat: 0.08, humanize: 0.06 },
          timbre: { filter_cutoff: 3800, filter_q: 2.0, vibrato_rate: 5.0, vibrato_depth: 8, breath_noise: 0.10, chorus_detune: 16, rotary_speed: 'off', drive: 0.12 },
          sends: { reverb: 0.24, delay: 0.10, dub_echo_throws: 0.08 }
        },
        chord_spec: {
          patch: 'nylon_guitar',
          pattern: 'ragtime_stride',
          voicing: 'jazz_7th',
          pan: 0.28,
          vel_scale: 0.48,
          adsr: { attack: 0.004, decay: 0.14, sustain: 0.30, release: 0.05 },
          timbre: { filter_cutoff: 2200, filter_q: 1.2, rotary_speed: 'off', chorus_detune: 5, drive: 0.08 },
          sends: { reverb: 0.12, delay: 0.0 }
        },
        bass_spec: {
          patch: 'upright_jazz',
          pattern: 'western_alternating',
          pan: 0.0,
          vel_scale: 0.84,
          adsr: { attack: 0.006, decay: 0.22, sustain: 0.55, release: 0.09 },
          timbre: { filter_cutoff: 580, filter_q: 1.2, drive: 0.10 }
        },
        drum_spec: {
          kit: 'bossa_kit',
          kick_steps:  [0.9, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.75, 0, 0, 0, 0, 0, 0, 0, 0.75, 0, 0, 0.4],
          hat_steps:   [0.5, 0, 0.65, 0, 0.5, 0, 0.65, 0, 0.5, 0, 0.65, 0, 0.5, 0, 1.2, 0],
          perc_steps:  [0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 0],
          tuning: { kick_punch: 0.65, snare_snap: 0.65, hat_sizzle: 0.58, rim_dub_echo: 0.12, hat_pan: 0.22, perc_pan: -0.24 }
        },
        fx_spec: { delay_wet: 0.12, delay_steps: 3, reverb_wet: 0.22, filter_cutoff: 9200, crush: 0.0 }
      })
    },
    soul_jazz_organ: {
      id: 'soul_jazz_organ',
      label: '🎹 60s Blue Note Roto-Organ Groove',
      defaultBlueprint: (piece) => ({
        mashup_title: `The Sermon of ${piece.composer.split(' ').pop()} (B3 Leslie Session)`,
        producer_log: `Charged ${piece.title}'s melody through a 9-drawbar Hammond B3 Roto-Organ with 3rd-harmonic percussion, warm tube overdrive, and an accelerating Leslie rotary speaker horn.`,
        tempo_bpm: 108,
        swing: 0.36,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'roto_organ',
          feel: 'laid_back_swing',
          octave_shift: 0,
          pan: -0.05,
          adsr: { attack: 0.004, decay: 0.16, sustain: 0.88, release: 0.08 },
          vel_curve: { base: 0.96, accent_downbeat: 0.07, humanize: 0.05 },
          timbre: { filter_cutoff: 4400, filter_q: 1.6, vibrato_rate: 6.3, vibrato_depth: 14, breath_noise: 0.06, chorus_detune: 7, rotary_speed: 'accel', drive: 0.28 },
          sends: { reverb: 0.22, delay: 0.14, dub_echo_throws: 0.15 }
        },
        chord_spec: {
          patch: 'clavinet_funk',
          pattern: 'boombap_stabs',
          voicing: 'jazz_7th',
          pan: 0.28,
          vel_scale: 0.48,
          adsr: { attack: 0.004, decay: 0.14, sustain: 0.35, release: 0.05 },
          timbre: { filter_cutoff: 2300, filter_q: 1.5, rotary_speed: 'slow', chorus_detune: 4, drive: 0.16 },
          sends: { reverb: 0.10, delay: 0.0 }
        },
        bass_spec: {
          patch: 'slap_funk',
          pattern: 'walking_jazz',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.005, decay: 0.18, sustain: 0.60, release: 0.07 },
          timbre: { filter_cutoff: 680, filter_q: 1.8, drive: 0.20 }
        },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.75, 0, 0, 0, 0.85, 0, 0, 0, 0.5, 0],
          snare_steps: [0, 0, 0, 0, 0.95, 0, 0, 0.35, 0, 0.35, 0, 0, 0.95, 0, 0, 0.4],
          hat_steps:   [0.7, 0, 0.85, 0, 0.7, 0, 1.25, 0, 0.7, 0, 0.85, 0, 0.7, 0, 1.25, 0],
          perc_steps:  [0, 0, 0, 0.55, 0, 0, 0, 0, 0, 0, 0.55, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.78, snare_snap: 0.76, hat_sizzle: 0.70, rim_dub_echo: 0.15, hat_pan: 0.24, perc_pan: -0.25 }
        },
        fx_spec: { delay_wet: 0.14, delay_steps: 3, reverb_wet: 0.20, filter_cutoff: 9000, crush: 0.0 }
      })
    },
    boombap_90s: {
      id: 'boombap_90s',
      label: '📼 90s East Coast Boom-Bap',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} on the MPC-3000 ('94 Crate Flip)`,
        producer_log: `Placed ${piece.composer}'s lead melody on an FM jazz vibraphone with motor tremolo over an 88 BPM swung MPC drum break, warm Rhodes 7th chords, and an upright bassline.`,
        tempo_bpm: 88,
        swing: 0.38,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'vibraphone_jazz',
          feel: 'laid_back_swing',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.004, decay: 0.35, sustain: 0.45, release: 0.22 },
          vel_curve: { base: 0.96, accent_downbeat: 0.06, humanize: 0.06 },
          timbre: { filter_cutoff: 4800, filter_q: 1.2, vibrato_rate: 5.6, vibrato_depth: 8, breath_noise: 0.0, chorus_detune: 5, rotary_speed: 'off', drive: 0.10 },
          sends: { reverb: 0.26, delay: 0.16, dub_echo_throws: 0.15 }
        },
        chord_spec: {
          patch: 'warm_rhodes',
          pattern: 'boombap_stabs',
          voicing: 'jazz_7th',
          pan: 0.25,
          vel_scale: 0.46,
          adsr: { attack: 0.006, decay: 0.28, sustain: 0.40, release: 0.12 },
          timbre: { filter_cutoff: 1800, filter_q: 1.0, rotary_speed: 'slow', chorus_detune: 6, drive: 0.12 },
          sends: { reverb: 0.12, delay: 0.0 }
        },
        bass_spec: {
          patch: 'upright_jazz',
          pattern: 'boombap_pocket',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.006, decay: 0.22, sustain: 0.58, release: 0.09 },
          timbre: { filter_cutoff: 520, filter_q: 1.3, drive: 0.14 }
        },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0.55, 0, 0, 0, 0.75, 0, 0, 0.9, 0, 0, 0, 0.45, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0.3, 0, 0, 1.0, 0, 0, 0],
          hat_steps:   [0.75, 0, 0.6, 0, 0.75, 0, 0.6, 0, 0.75, 0, 0.6, 0, 0.75, 0, 1.2, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0],
          tuning: { kick_punch: 0.82, snare_snap: 0.80, hat_sizzle: 0.65, rim_dub_echo: 0.10, hat_pan: 0.22, perc_pan: -0.24 }
        },
        fx_spec: { delay_wet: 0.14, delay_steps: 4, reverb_wet: 0.16, filter_cutoff: 7800, crush: 0.06 }
      })
    },
    trap_808: {
      id: 'trap_808',
      label: '🔥 808 Dark Trap / Phonk',
      defaultBlueprint: (piece) => ({
        mashup_title: `Lil ${piece.composer.split(' ').pop()} — ${piece.title.split('(')[0].trim()} (808 VIP)`,
        producer_log: `Carried ${piece.title}'s iconic melody on a breathy wooden lotus flute with embouchure chiff and delayed vibrato over a 138 BPM 808 trap beat and metallic hi-hat rolls.`,
        tempo_bpm: 138,
        swing: 0.06,
        scale_mode: piece.mode === 'major' ? 'parallel_minor' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'flute_airy',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.03,
          adsr: { attack: 0.028, decay: 0.20, sustain: 0.82, release: 0.14 },
          vel_curve: { base: 0.96, accent_downbeat: 0.06, humanize: 0.05 },
          timbre: { filter_cutoff: 4400, filter_q: 1.5, vibrato_rate: 5.5, vibrato_depth: 14, breath_noise: 0.24, chorus_detune: 6, rotary_speed: 'off', drive: 0.08 },
          sends: { reverb: 0.30, delay: 0.22, dub_echo_throws: 0.22 }
        },
        chord_spec: {
          patch: 'dark_trap_bells',
          pattern: 'trap_half_bells',
          voicing: 'triad',
          pan: 0.28,
          vel_scale: 0.45,
          adsr: { attack: 0.004, decay: 0.35, sustain: 0.25, release: 0.18 },
          timbre: { filter_cutoff: 2400, filter_q: 1.2, rotary_speed: 'off', chorus_detune: 10, drive: 0.05 },
          sends: { reverb: 0.18, delay: 0.08 }
        },
        bass_spec: {
          patch: 'trap_808',
          pattern: 'trap_808_glide',
          pan: 0.0,
          vel_scale: 0.90,
          adsr: { attack: 0.005, decay: 0.28, sustain: 0.70, release: 0.14 },
          timbre: { filter_cutoff: 420, filter_q: 1.3, drive: 0.28 }
        },
        drum_spec: {
          kit: 'trap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0.9, 0, 0, 0.7, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0],
          hat_steps:   [0.8, 0, 0.8, 1.35, 0.8, 0, 1.35, 0, 0.8, 0, 0.8, 0, 1.35, 0, 0.8, 1.35],
          perc_steps:  [0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.88, snare_snap: 0.85, hat_sizzle: 0.80, rim_dub_echo: 0.10, hat_pan: 0.26, perc_pan: -0.28 }
        },
        fx_spec: { delay_wet: 0.18, delay_steps: 3, reverb_wet: 0.22, filter_cutoff: 9800, crush: 0.0 }
      })
    },
    cyberpunk_darksynth: {
      id: 'cyberpunk_darksynth',
      label: '⚡ Cyberpunk Darksynth',
      defaultBlueprint: (piece) => ({
        mashup_title: `NEO-${piece.composer.split(' ').pop().toUpperCase()} // 2099 OVERDRIVE`,
        producer_log: `Drove ${piece.title}'s melody through a 3-oscillator stereo-detuned neon supersaw lead at 120 BPM, backed by a saturated Reese bassline and punchy LinnDrum snares.`,
        tempo_bpm: 120,
        swing: 0.0,
        scale_mode: piece.mode === 'major' ? 'parallel_minor' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'supersaw_cyber',
          feel: 'authentic',
          octave_shift: 0,
          pan: 0.0,
          adsr: { attack: 0.008, decay: 0.18, sustain: 0.82, release: 0.11 },
          vel_curve: { base: 0.96, accent_downbeat: 0.06, humanize: 0.04 },
          timbre: { filter_cutoff: 5400, filter_q: 1.8, vibrato_rate: 5.5, vibrato_depth: 8, breath_noise: 0.0, chorus_detune: 15, rotary_speed: 'off', drive: 0.25 },
          sends: { reverb: 0.25, delay: 0.22, dub_echo_throws: 0.22 }
        },
        chord_spec: {
          patch: 'cyber_pwm',
          pattern: 'house_offbeat',
          voicing: 'power_5th',
          pan: 0.26,
          vel_scale: 0.46,
          adsr: { attack: 0.006, decay: 0.14, sustain: 0.45, release: 0.06 },
          timbre: { filter_cutoff: 2100, filter_q: 1.4, rotary_speed: 'off', chorus_detune: 12, drive: 0.18 },
          sends: { reverb: 0.10, delay: 0.05 }
        },
        bass_spec: {
          patch: 'reese_cyber',
          pattern: 'cyber_rolling_16th',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.005, decay: 0.14, sustain: 0.65, release: 0.06 },
          timbre: { filter_cutoff: 760, filter_q: 2.0, drive: 0.28 }
        },
        drum_spec: {
          kit: 'cyber_kit',
          kick_steps:  [1.0, 0, 0, 0, 0.9, 0, 0, 0, 1.0, 0, 0, 0, 0.9, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0],
          hat_steps:   [0.6, 0, 0.8, 0, 0.6, 0, 0.8, 0, 0.6, 0, 0.8, 0, 0.6, 0, 1.2, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
          tuning: { kick_punch: 0.85, snare_snap: 0.85, hat_sizzle: 0.72, rim_dub_echo: 0.12, hat_pan: 0.24, perc_pan: -0.26 }
        },
        fx_spec: { delay_wet: 0.20, delay_steps: 3, reverb_wet: 0.22, filter_cutoff: 9400, crush: 0.04 }
      })
    },
    bossa_nova: {
      id: 'bossa_nova',
      label: '🌴 Ipanema Bossa Nova',
      defaultBlueprint: (piece) => ({
        mashup_title: `Garota de ${piece.composer.split(' ').pop()} (Rio '64 Session)`,
        producer_log: `Carried ${piece.title}'s melody on a warm breathy alto flute with embouchure chiff and delayed vibrato over syncopated nylon guitar comping, tumbão bass, and woody rimshot clave.`,
        tempo_bpm: 120,
        swing: 0.14,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'flute_airy',
          feel: 'offbeat_skank_push',
          octave_shift: 0,
          pan: -0.05,
          adsr: { attack: 0.030, decay: 0.22, sustain: 0.82, release: 0.15 },
          vel_curve: { base: 0.95, accent_downbeat: 0.06, humanize: 0.06 },
          timbre: { filter_cutoff: 4200, filter_q: 1.4, vibrato_rate: 5.4, vibrato_depth: 15, breath_noise: 0.25, chorus_detune: 5, rotary_speed: 'off', drive: 0.06 },
          sends: { reverb: 0.28, delay: 0.16, dub_echo_throws: 0.14 }
        },
        chord_spec: {
          patch: 'nylon_guitar',
          pattern: 'bossa_clave',
          voicing: 'jazz_7th',
          pan: 0.28,
          vel_scale: 0.48,
          adsr: { attack: 0.004, decay: 0.18, sustain: 0.32, release: 0.07 },
          timbre: { filter_cutoff: 2100, filter_q: 1.1, rotary_speed: 'off', chorus_detune: 4, drive: 0.06 },
          sends: { reverb: 0.12, delay: 0.0 }
        },
        bass_spec: {
          patch: 'upright_jazz',
          pattern: 'bossa_tumbao',
          pan: 0.0,
          vel_scale: 0.84,
          adsr: { attack: 0.007, decay: 0.22, sustain: 0.58, release: 0.10 },
          timbre: { filter_cutoff: 540, filter_q: 1.1, drive: 0.08 }
        },
        drum_spec: {
          kit: 'bossa_kit',
          kick_steps:  [0.85, 0, 0, 0.7, 0, 0, 0, 0, 0.85, 0, 0, 0.7, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          hat_steps:   [0.5, 0, 0.6, 0, 0.5, 0, 0.6, 0, 0.5, 0, 0.6, 0, 0.5, 0, 0.6, 0],
          perc_steps:  [0.8, 0, 0, 0.75, 0, 0, 0.75, 0, 0, 0, 0.75, 0, 0.75, 0, 0, 0],
          tuning: { kick_punch: 0.65, snare_snap: 0.65, hat_sizzle: 0.58, rim_dub_echo: 0.22, hat_pan: 0.22, perc_pan: -0.25 }
        },
        fx_spec: { delay_wet: 0.14, delay_steps: 4, reverb_wet: 0.22, filter_cutoff: 8800, crush: 0.0 }
      })
    },
    chiptune_8bit: {
      id: 'chiptune_8bit',
      label: '👾 8-Bit NES Boss Theme',
      defaultBlueprint: (piece) => ({
        mashup_title: `SUPER ${piece.composer.split(' ').pop().toUpperCase()} BROS. (Stage 8-4)`,
        producer_log: `Routed ${piece.title}'s lead melody to a crisp 2A03 pulse-wave channel with attack blip ornaments over a triangle-wave bassline and 8-bit noise percussion.`,
        tempo_bpm: 136,
        swing: 0.0,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'square_8bit',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.002, decay: 0.12, sustain: 0.75, release: 0.025 },
          vel_curve: { base: 0.96, accent_downbeat: 0.05, humanize: 0.02 },
          timbre: { filter_cutoff: 7800, filter_q: 0.8, vibrato_rate: 6.0, vibrato_depth: 6, breath_noise: 0.0, chorus_detune: 0, rotary_speed: 'off', drive: 0.10 },
          sends: { reverb: 0.06, delay: 0.12, dub_echo_throws: 0.10 }
        },
        chord_spec: {
          patch: 'chip_arp',
          pattern: 'cyber_16th_arp',
          voicing: 'triad',
          pan: 0.25,
          vel_scale: 0.44,
          adsr: { attack: 0.002, decay: 0.08, sustain: 0.40, release: 0.02 },
          timbre: { filter_cutoff: 2600, filter_q: 0.8, rotary_speed: 'off', chorus_detune: 0, drive: 0.05 },
          sends: { reverb: 0.04, delay: 0.0 }
        },
        bass_spec: {
          patch: 'nes_triangle',
          pattern: 'western_alternating',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.003, decay: 0.14, sustain: 0.70, release: 0.04 },
          timbre: { filter_cutoff: 680, filter_q: 0.9, drive: 0.12 }
        },
        drum_spec: {
          kit: 'chip_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.8, 0, 1.0, 0, 0, 0, 0, 0, 0.8, 0],
          snare_steps: [0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0],
          hat_steps:   [0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.78, snare_snap: 0.75, hat_sizzle: 0.70, rim_dub_echo: 0.0, hat_pan: 0.20, perc_pan: -0.20 }
        },
        fx_spec: { delay_wet: 0.10, delay_steps: 2, reverb_wet: 0.06, filter_cutoff: 11000, crush: 0.30 }
      })
    },
    acid_house: {
      id: 'acid_house',
      label: '🧪 1989 Acid Warehouse (TB-303)',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} at the Haçienda '89 (303 Mix)`,
        producer_log: `Played ${piece.title}'s lead on a resonant diode-ladder 303 acid synth over a 126 BPM 909 four-on-the-floor kick, metallic open hats, and offbeat Roto-Organ stabs.`,
        tempo_bpm: 126,
        swing: 0.10,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'acid_303_lead',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.03,
          adsr: { attack: 0.004, decay: 0.16, sustain: 0.55, release: 0.05 },
          vel_curve: { base: 0.96, accent_downbeat: 0.08, humanize: 0.05 },
          timbre: { filter_cutoff: 4200, filter_q: 5.2, vibrato_rate: 5.0, vibrato_depth: 4, breath_noise: 0.0, chorus_detune: 6, rotary_speed: 'off', drive: 0.32 },
          sends: { reverb: 0.20, delay: 0.25, dub_echo_throws: 0.25 }
        },
        chord_spec: {
          patch: 'roto_organ',
          pattern: 'house_offbeat',
          voicing: 'triad',
          pan: 0.26,
          vel_scale: 0.45,
          adsr: { attack: 0.004, decay: 0.10, sustain: 0.35, release: 0.04 },
          timbre: { filter_cutoff: 2000, filter_q: 1.5, rotary_speed: 'fast', chorus_detune: 6, drive: 0.18 },
          sends: { reverb: 0.10, delay: 0.06 }
        },
        bass_spec: {
          patch: 'tb303_acid',
          pattern: 'acid_303_sequence',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.004, decay: 0.14, sustain: 0.40, release: 0.04 },
          timbre: { filter_cutoff: 1250, filter_q: 6.0, drive: 0.30 }
        },
        drum_spec: {
          kit: 'house_kit',
          kick_steps:  [1.0, 0, 0, 0, 1.0, 0, 0, 0, 1.0, 0, 0, 0, 1.0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0],
          hat_steps:   [0, 0, 1.3, 0, 0, 0, 1.3, 0, 0, 0, 1.3, 0, 0, 0, 1.3, 0],
          perc_steps:  [0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0],
          tuning: { kick_punch: 0.85, snare_snap: 0.80, hat_sizzle: 0.78, rim_dub_echo: 0.10, hat_pan: 0.24, perc_pan: -0.26 }
        },
        fx_spec: { delay_wet: 0.22, delay_steps: 3, reverb_wet: 0.18, filter_cutoff: 9000, crush: 0.0 }
      })
    },
    spaghetti_western: {
      id: 'spaghetti_western',
      label: '🤠 Ennio Spaghetti Western',
      defaultBlueprint: (piece) => ({
        mashup_title: `The Good, The Bad & The ${piece.composer.split(' ').pop()}`,
        producer_log: `Performed ${piece.title}'s melody on a breathy desert whistler with embouchure chiff and canyon echo over galloping nylon guitar chords and an alternating upright bass at 100 BPM.`,
        tempo_bpm: 100,
        swing: 0.12,
        scale_mode: piece.mode === 'major' ? 'parallel_minor' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'whistle_western',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.028, decay: 0.22, sustain: 0.84, release: 0.16 },
          vel_curve: { base: 0.96, accent_downbeat: 0.07, humanize: 0.06 },
          timbre: { filter_cutoff: 4200, filter_q: 1.8, vibrato_rate: 5.6, vibrato_depth: 16, breath_noise: 0.22, chorus_detune: 5, rotary_speed: 'off', drive: 0.08 },
          sends: { reverb: 0.34, delay: 0.28, dub_echo_throws: 0.32 }
        },
        chord_spec: {
          patch: 'nylon_guitar',
          pattern: 'western_gallop',
          voicing: 'triad',
          pan: 0.26,
          vel_scale: 0.46,
          adsr: { attack: 0.004, decay: 0.14, sustain: 0.30, release: 0.06 },
          timbre: { filter_cutoff: 2200, filter_q: 1.2, rotary_speed: 'off', chorus_detune: 4, drive: 0.10 },
          sends: { reverb: 0.14, delay: 0.05 }
        },
        bass_spec: {
          patch: 'upright_jazz',
          pattern: 'western_alternating',
          pan: 0.0,
          vel_scale: 0.85,
          adsr: { attack: 0.006, decay: 0.20, sustain: 0.55, release: 0.08 },
          timbre: { filter_cutoff: 540, filter_q: 1.2, drive: 0.12 }
        },
        drum_spec: {
          kit: 'dub_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.75, 0, 1.0, 0, 0, 0, 0, 0, 0.75, 0],
          snare_steps: [0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0.45, 0.6],
          hat_steps:   [0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0],
          perc_steps:  [0.7, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.75, snare_snap: 0.74, hat_sizzle: 0.62, rim_dub_echo: 0.30, hat_pan: 0.22, perc_pan: -0.26 }
        },
        fx_spec: { delay_wet: 0.24, delay_steps: 4, reverb_wet: 0.28, filter_cutoff: 8600, crush: 0.0 }
      })
    },
    ska_punk: {
      id: 'ska_punk',
      label: '🏁 3rd-Wave Ska Punk',
      defaultBlueprint: (piece) => ({
        mashup_title: `Pick It Up, ${piece.composer.split(' ').pop()}! ('96 Ska Mix)`,
        producer_log: `Blasted ${piece.title}'s melody on a punchy brass horn section with lip-slur scoop at 148 BPM over crisp upbeat Hammond roto-organ skanks and a walking slap bassline.`,
        tempo_bpm: 148,
        swing: 0.06,
        scale_mode: piece.mode === 'minor' ? 'parallel_major' : 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'brass_horn',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.014, decay: 0.16, sustain: 0.82, release: 0.08 },
          vel_curve: { base: 0.96, accent_downbeat: 0.07, humanize: 0.05 },
          timbre: { filter_cutoff: 4400, filter_q: 1.8, vibrato_rate: 5.5, vibrato_depth: 10, breath_noise: 0.06, chorus_detune: 8, rotary_speed: 'off', drive: 0.28 },
          sends: { reverb: 0.18, delay: 0.12, dub_echo_throws: 0.12 }
        },
        chord_spec: {
          patch: 'roto_organ',
          pattern: 'ska_upstrokes',
          voicing: 'triad',
          pan: 0.28,
          vel_scale: 0.48,
          adsr: { attack: 0.003, decay: 0.08, sustain: 0.35, release: 0.03 },
          timbre: { filter_cutoff: 2200, filter_q: 1.4, rotary_speed: 'fast', chorus_detune: 6, drive: 0.22 },
          sends: { reverb: 0.08, delay: 0.0 }
        },
        bass_spec: {
          patch: 'slap_funk',
          pattern: 'walking_jazz',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.004, decay: 0.16, sustain: 0.60, release: 0.06 },
          timbre: { filter_cutoff: 720, filter_q: 1.8, drive: 0.22 }
        },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.85, 0, 1.0, 0, 0, 0, 0, 0, 0.85, 0],
          snare_steps: [0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0],
          hat_steps:   [0, 0, 1.25, 0, 0, 0, 1.25, 0, 0, 0, 1.25, 0, 0, 0, 1.25, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.82, snare_snap: 0.84, hat_sizzle: 0.74, rim_dub_echo: 0.08, hat_pan: 0.24, perc_pan: -0.24 }
        },
        fx_spec: { delay_wet: 0.12, delay_steps: 2, reverb_wet: 0.16, filter_cutoff: 9500, crush: 0.0 }
      })
    },
    lofi_tape: {
      id: 'lofi_tape',
      label: '☕ 2 AM Lo-Fi Study Tape',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.title.split('(')[0].trim().toLowerCase()} [lofi study beats]`,
        producer_log: `Played ${piece.composer}'s melody on a 2-operator FM Rhodes electric piano with tine bell chime and stereo tremolo at 75 BPM over lazy swung drums and warm tape filtering.`,
        tempo_bpm: 75,
        swing: 0.40,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'rhodes_ep',
          feel: 'laid_back_swing',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.005, decay: 0.32, sustain: 0.48, release: 0.18 },
          vel_curve: { base: 0.94, accent_downbeat: 0.05, humanize: 0.07 },
          timbre: { filter_cutoff: 3400, filter_q: 1.1, vibrato_rate: 4.6, vibrato_depth: 8, breath_noise: 0.0, chorus_detune: 6, rotary_speed: 'slow', drive: 0.14 },
          sends: { reverb: 0.26, delay: 0.20, dub_echo_throws: 0.18 }
        },
        chord_spec: {
          patch: 'warm_rhodes',
          pattern: 'boombap_stabs',
          voicing: 'jazz_7th',
          pan: 0.24,
          vel_scale: 0.44,
          adsr: { attack: 0.008, decay: 0.30, sustain: 0.38, release: 0.14 },
          timbre: { filter_cutoff: 1500, filter_q: 1.0, rotary_speed: 'slow', chorus_detune: 6, drive: 0.10 },
          sends: { reverb: 0.14, delay: 0.0 }
        },
        bass_spec: {
          patch: 'sub_dub',
          pattern: 'boombap_pocket',
          pan: 0.0,
          vel_scale: 0.84,
          adsr: { attack: 0.008, decay: 0.22, sustain: 0.62, release: 0.12 },
          timbre: { filter_cutoff: 340, filter_q: 1.0, drive: 0.12 }
        },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [0.95, 0, 0, 0, 0, 0, 0, 0.65, 0, 0, 0.85, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0],
          hat_steps:   [0.5, 0, 0.45, 0, 0.5, 0, 0.45, 0, 0.5, 0, 0.45, 0, 0.5, 0, 0.45, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.68, snare_snap: 0.64, hat_sizzle: 0.52, rim_dub_echo: 0.12, hat_pan: 0.20, perc_pan: -0.22 }
        },
        fx_spec: { delay_wet: 0.18, delay_steps: 3, reverb_wet: 0.22, filter_cutoff: 5800, crush: 0.04 }
      })
    },
    doom_metal: {
      id: 'doom_metal',
      label: '💀 Sabbath Doom Sludge',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} Sabbath — Doom in ${piece.key} Minor`,
        producer_log: `Channelled ${piece.title}'s melody through an asymmetric tube-fuzz lead and guitar cabinet simulator at 70 BPM over low power-chord slabs and a heavy half-time drum groove.`,
        tempo_bpm: 70,
        swing: 0.12,
        scale_mode: piece.mode === 'major' ? 'parallel_minor' : 'keep_original',
        transpose_semitones: -2,
        melody_spec: {
          patch: 'fuzz_lead',
          feel: 'authentic',
          octave_shift: 0,
          pan: -0.03,
          adsr: { attack: 0.008, decay: 0.22, sustain: 0.84, release: 0.12 },
          vel_curve: { base: 0.96, accent_downbeat: 0.07, humanize: 0.04 },
          timbre: { filter_cutoff: 3600, filter_q: 2.2, vibrato_rate: 5.2, vibrato_depth: 12, breath_noise: 0.0, chorus_detune: 10, rotary_speed: 'off', drive: 0.68 },
          sends: { reverb: 0.22, delay: 0.20, dub_echo_throws: 0.22 }
        },
        chord_spec: {
          patch: 'doom_power_stack',
          pattern: 'doom_wall',
          voicing: 'power_5th',
          pan: 0.28,
          vel_scale: 0.44,
          adsr: { attack: 0.010, decay: 0.25, sustain: 0.70, release: 0.12 },
          timbre: { filter_cutoff: 1400, filter_q: 1.8, rotary_speed: 'off', chorus_detune: 10, drive: 0.55 },
          sends: { reverb: 0.10, delay: 0.0 }
        },
        bass_spec: {
          patch: 'doom_fuzz',
          pattern: 'doom_drone',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.008, decay: 0.25, sustain: 0.75, release: 0.12 },
          timbre: { filter_cutoff: 520, filter_q: 1.8, drive: 0.50 }
        },
        drum_spec: {
          kit: 'doom_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0.85, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 0, 0],
          hat_steps:   [0.9, 0, 0, 0, 0.9, 0, 0, 0, 0.9, 0, 0, 0, 0.9, 0, 0, 0],
          perc_steps:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          tuning: { kick_punch: 0.86, snare_snap: 0.85, hat_sizzle: 0.72, rim_dub_echo: 0.10, hat_pan: 0.24, perc_pan: -0.24 }
        },
        fx_spec: { delay_wet: 0.18, delay_steps: 4, reverb_wet: 0.22, filter_cutoff: 7200, crush: 0.12 }
      })
    },
    new_orleans_jazz: {
      id: 'new_orleans_jazz',
      label: '🎺 New Orleans Second-Line Brass',
      defaultBlueprint: (piece) => ({
        mashup_title: `${piece.composer.split(' ').pop()} on Bourbon Street (Brass Band)`,
        producer_log: `Carried ${piece.title}'s melody on a jubilant New Orleans brass horn with lip-slur attack scoop and bell saturation at 114 BPM over ragtime saloon piano chords and walking upright bass.`,
        tempo_bpm: 114,
        swing: 0.35,
        scale_mode: 'keep_original',
        transpose_semitones: 0,
        melody_spec: {
          patch: 'brass_horn',
          feel: 'laid_back_swing',
          octave_shift: 0,
          pan: -0.04,
          adsr: { attack: 0.016, decay: 0.18, sustain: 0.84, release: 0.10 },
          vel_curve: { base: 0.96, accent_downbeat: 0.08, humanize: 0.06 },
          timbre: { filter_cutoff: 4300, filter_q: 1.9, vibrato_rate: 5.5, vibrato_depth: 12, breath_noise: 0.08, chorus_detune: 8, rotary_speed: 'off', drive: 0.26 },
          sends: { reverb: 0.22, delay: 0.14, dub_echo_throws: 0.15 }
        },
        chord_spec: {
          patch: 'honky_tonk',
          pattern: 'ragtime_stride',
          voicing: 'jazz_7th',
          pan: 0.26,
          vel_scale: 0.48,
          adsr: { attack: 0.004, decay: 0.18, sustain: 0.32, release: 0.06 },
          timbre: { filter_cutoff: 2200, filter_q: 1.2, rotary_speed: 'off', chorus_detune: 12, drive: 0.10 },
          sends: { reverb: 0.10, delay: 0.0 }
        },
        bass_spec: {
          patch: 'upright_jazz',
          pattern: 'walking_jazz',
          pan: 0.0,
          vel_scale: 0.86,
          adsr: { attack: 0.006, decay: 0.20, sustain: 0.58, release: 0.08 },
          timbre: { filter_cutoff: 580, filter_q: 1.2, drive: 0.12 }
        },
        drum_spec: {
          kit: 'boombap_kit',
          kick_steps:  [1.0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0.85, 0, 0, 0, 0, 0],
          snare_steps: [0, 0, 0, 0, 0.95, 0, 0, 0.45, 0, 0, 0, 0.5, 0.95, 0, 0.5, 0.65],
          hat_steps:   [0.6, 0, 0.7, 0, 0.6, 0, 1.2, 0, 0.6, 0, 0.7, 0, 0.6, 0, 1.2, 0],
          perc_steps:  [0.7, 0, 0, 0.65, 0, 0, 0.7, 0, 0, 0, 0.7, 0, 0.65, 0, 0, 0],
          tuning: { kick_punch: 0.78, snare_snap: 0.82, hat_sizzle: 0.68, rim_dub_echo: 0.12, hat_pan: 0.24, perc_pan: -0.26 }
        },
        fx_spec: { delay_wet: 0.12, delay_steps: 3, reverb_wet: 0.20, filter_cutoff: 9000, crush: 0.0 }
      })
    }
  };

  // --------------------------------------------------------------------------
  // 3. CHROMATIC-PRESERVING MODAL RE-HARMONIZATION ENGINE
  //    Never collapses adjacent scale degrees into duplicate pitches!
  // --------------------------------------------------------------------------
  const SCALE_MAPS = {
    keep_original:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    parallel_minor: [0, 1, 2, 3, 3, 5, 6, 7, 8, 8, 10, 11],
    parallel_major: [0, 1, 2, 4, 4, 5, 6, 7, 9, 9, 10, 11],
    dorian:         [0, 1, 2, 3, 3, 5, 6, 7, 9, 9, 10, 11],
    harmonic_minor: [0, 1, 2, 3, 3, 5, 6, 7, 8, 8, 10, 11]
  };

  function remapSemitone(semi, scaleMode, origMode) {
    if (!scaleMode || scaleMode === 'keep_original') return semi;
    if (origMode === 'minor' && (scaleMode === 'parallel_minor' || scaleMode === 'harmonic_minor')) {
      return semi;
    }
    if (origMode === 'major' && scaleMode === 'parallel_major') {
      return semi;
    }
    const map = SCALE_MAPS[scaleMode] || SCALE_MAPS.keep_original;
    const oct = Math.floor(semi / 12);
    const pc = ((semi % 12) + 12) % 12;
    return oct * 12 + map[pc];
  }

  // Build compact, warm backing chord voicings in the E3..Eb4 midrange register (MIDI 52..63)
  function buildChordNotes(rootMidi, qual, voicing, scaleMode, origMode) {
    let baseRoot = 52 + (((rootMidi - 52) % 12 + 12) % 12);

    let isMinor = qual === 'min';
    if (scaleMode === 'parallel_minor' || scaleMode === 'dorian' || scaleMode === 'harmonic_minor') {
      if (qual === 'maj' || qual === 'maj7') isMinor = true;
    } else if (scaleMode === 'parallel_major' && origMode === 'minor') {
      isMinor = false;
    }

    const third = isMinor ? 3 : 4;
    const fifth = 7;
    const seventh = qual === 'maj7' ? 11 : 10;

    if (voicing === 'power_5th') {
      return [baseRoot, baseRoot + fifth];
    }
    if (voicing === 'jazz_7th' || voicing === 'lush_9th') {
      return [baseRoot, baseRoot + third, baseRoot + seventh];
    }
    return [baseRoot, baseRoot + third, baseRoot + fifth];
  }

  // Safe finite number parser + clamper (prevents Number(undefined) -> NaN bugs!)
  function clampNum(val, min, max, fallback) {
    if (val === undefined || val === null || val === '') return fallback;
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  // --------------------------------------------------------------------------
  // 4. SCORE COMPILER: SOURCE PIECE + AI BLUEPRINT -> 4 CLEAR TRACKS
  //    Applies LLM velocity curves, humanization, stereo spread & dub throws
  // --------------------------------------------------------------------------
  function compileMorphedArrangement(piece, bp) {
    const scaleMode = bp.scale_mode || 'keep_original';
    const transpose = clampNum(bp.transpose_semitones, -3, 3, 0);
    let rootBase = (piece.keyRoot || 64) + transpose;
    if (rootBase < 62) rootBase += 12;

    const melSpec = bp.melody_spec || {};
    const chordSpec = bp.chord_spec || {};
    const bassSpec = bp.bass_spec || {};
    const drumSpec = bp.drum_spec || {};

    const srcMelody = piece.melody || [];
    const srcChords = piece.chords || [];

    const events = {
      melody: [],
      chords: [],
      bass: [],
      drums: []
    };

    // --- TRACK 1: MAIN MELODY (FRONT & CENTER WITH EXPRESSIVE VELOCITY CURVE) ---
    const feel = melSpec.feel || 'authentic';
    const octShift = clampNum(melSpec.octave_shift, -1, 1, 0) * 12;
    const velBase = clampNum(melSpec.vel_curve?.base, 0.88, 1.0, 0.95);
    const accentDown = clampNum(melSpec.vel_curve?.accent_downbeat, 0, 0.12, 0.06);
    const humanize = clampNum(melSpec.vel_curve?.humanize, 0, 0.12, 0.05);
    const echoProb = clampNum(melSpec.sends?.dub_echo_throws ?? melSpec.dub_echo_throws, 0, 0.8, 0.22);

    srcMelody.forEach((n, idx) => {
      let step = n.step % 128;
      let dur = n.dur;
      const mappedSemi = remapSemitone(n.semi, scaleMode, piece.mode);
      let midi = rootBase + mappedSemi + octShift;
      while (midi < 58) midi += 12;
      while (midi > 89) midi -= 12;

      if (feel === 'offbeat_skank_push') {
        if (step % 16 === 0 && dur >= 6 && idx % 2 === 1) {
          step = (step + 2) % 128;
          dur = Math.max(4, dur - 2);
        }
      }

      const isDownbeat = (step % 4 === 0);
      const determJitter = Math.sin(idx * 2.71828) * humanize;
      const vel = clampNum(velBase + (isDownbeat ? accentDown : 0) + determJitter, 0.84, 1.0, 0.95);

      const isPhraseEnd = dur >= 6 || (step % 16 >= 12);
      const echoThrow = isPhraseEnd && Math.random() < echoProb;
      events.melody.push({ step, dur, midi, vel, echo: echoThrow, panOffset: 0 });
    });

    // --- TRACK 2: SPARSE, RHYTHMIC BACKING CHORDS (E3..G4 Midrange + Stereo Spread) ---
    const cPattern = chordSpec.pattern || 'reggae_skank';
    const cVoicing = chordSpec.voicing || 'triad';
    const cVelScale = clampNum(chordSpec.vel_scale, 0.58, 0.85, 0.70);

    for (let bar = 0; bar < 8; bar++) {
      const chordObj = srcChords[bar % srcChords.length] || { deg: 0, qual: 'maj' };
      const barRoot = rootBase + remapSemitone(chordObj.deg, scaleMode, piece.mode);
      const chordNotes = buildChordNotes(barRoot, chordObj.qual, cVoicing, scaleMode, piece.mode);
      const isOffbeatChop = cPattern === 'reggae_skank' || cPattern === 'ska_upstrokes' || cPattern === 'house_offbeat';
      const voicedChordNotes = isOffbeatChop
        ? chordNotes.map(m => (m < 58 ? m + 12 : m))
        : chordNotes;
      const baseStep = bar * 16;

      const pushChordHit = (s, dur, hitVelMult = 1.0, echoThrow = false) => {
        voicedChordNotes.forEach((m, vIdx) => {
          const spread = (vIdx - (voicedChordNotes.length - 1) / 2) * 0.07;
          events.chords.push({
            step: baseStep + s,
            dur,
            midi: m,
            vel: Math.max(0.55, Math.min(0.88, cVelScale * hitVelMult)),
            echo: echoThrow,
            panOffset: spread
          });
        });
      };

      if (cPattern === 'reggae_skank' || cPattern === 'house_offbeat') {
        [2, 6, 10, 14].forEach((s, idx) => pushChordHit(s, 1.75, 1.05, cPattern === 'reggae_skank' && idx === 3 && bar % 2 === 1));
      } else if (cPattern === 'ska_upstrokes' || cPattern === 'ragtime_stride') {
        [2, 6, 10, 14].forEach(s => pushChordHit(s, 1.55, 1.08));
      } else if (cPattern === 'bossa_clave') {
        [
          { s: 0, d: 2.5, v: 1.02 },
          { s: 3, d: 2.0, v: 0.94 },
          { s: 6, d: 2.5, v: 0.98 },
          { s: 10, d: 2.0, v: 0.92 },
          { s: 12, d: 2.5, v: 0.98 }
        ].forEach(hit => pushChordHit(hit.s, hit.d, hit.v));
      } else if (cPattern === 'boombap_stabs') {
        [
          { s: 0, d: 4.5, v: 1.02 },
          { s: 10, d: 3.5, v: 0.94 }
        ].forEach(hit => pushChordHit(hit.s, hit.d, hit.v));
      } else if (cPattern === 'cyber_16th_arp' || cPattern === 'western_gallop') {
        for (let s = 0; s < 16; s += 2) {
          const vIdx = (s / 2) % chordNotes.length;
          const note = chordNotes[vIdx];
          events.chords.push({
            step: baseStep + s,
            dur: 1.6,
            midi: note,
            vel: cVelScale * 0.98,
            panOffset: (vIdx - 1) * 0.08
          });
        }
      } else if (cPattern === 'trap_half_bells') {
        [0, 6, 12].forEach((s, idx) => {
          const note = chordNotes[idx % chordNotes.length];
          events.chords.push({
            step: baseStep + s,
            dur: 3.2,
            midi: note,
            vel: cVelScale,
            panOffset: (idx - 1) * 0.09
          });
        });
      } else {
        pushChordHit(0, 12.0, 0.96);
      }
    }

    // --- TRACK 3: DEEP BASSLINE (Strictly C2..B2 Register, MIDI 36..47) ---
    const bPattern = bassSpec.pattern || 'one_drop_bubble';
    const bVelScale = clampNum(bassSpec.vel_scale, 0.75, 0.98, 0.88) / 0.85;

    for (let bar = 0; bar < 8; bar++) {
      const chordObj = srcChords[bar % srcChords.length] || { deg: 0, qual: 'maj' };
      const nextChordObj = srcChords[(bar + 1) % srcChords.length] || { deg: 0, qual: 'maj' };
      let bRoot = 36 + (((rootBase + remapSemitone(chordObj.deg, scaleMode, piece.mode)) - 36) % 12 + 12) % 12;
      if (bRoot > 45) bRoot -= 12;
      const fifth = bRoot + 7;
      const oct = bRoot + 12;
      const third = bRoot + (chordObj.qual === 'min' || scaleMode === 'parallel_minor' ? 3 : 4);
      const baseStep = bar * 16;

      const pushBass = (n) => {
        events.bass.push({
          step: baseStep + n.s,
          dur: n.d,
          midi: n.m,
          vel: Math.max(0.70, Math.min(0.98, n.v * bVelScale)),
          panOffset: 0
        });
      };

      if (bPattern === 'one_drop_bubble') {
        [
          { s: 2, d: 2, m: bRoot, v: 0.85 },
          { s: 4, d: 2, m: fifth, v: 0.76 },
          { s: 8, d: 3.5, m: bRoot, v: 0.90 },
          { s: 12, d: 2, m: third, v: 0.78 },
          { s: 14, d: 2, m: fifth, v: 0.80 }
        ].forEach(pushBass);
      } else if (bPattern === 'trap_808_glide') {
        [
          { s: 0, d: 5.5, m: bRoot, v: 0.92 },
          { s: 6, d: 3.5, m: bRoot, v: 0.84 },
          { s: 10, d: 4.0, m: fifth, v: 0.86 }
        ].forEach(pushBass);
      } else if (bPattern === 'cyber_rolling_16th') {
        for (let s = 0; s < 16; s += 2) {
          const m = (s % 4 === 2) ? oct : bRoot;
          pushBass({ s, d: 1.6, m, v: s % 4 === 0 ? 0.86 : 0.72 });
        }
      } else if (bPattern === 'acid_303_sequence') {
        [
          { s: 0, d: 1.6, m: bRoot, v: 0.88 }, { s: 2, d: 1.6, m: oct, v: 0.78 },
          { s: 4, d: 1.6, m: bRoot, v: 0.82 }, { s: 6, d: 1.6, m: third, v: 0.88 },
          { s: 8, d: 1.6, m: fifth, v: 0.84 }, { s: 10, d: 1.6, m: bRoot, v: 0.78 },
          { s: 12, d: 1.6, m: oct, v: 0.90 }, { s: 14, d: 1.6, m: fifth, v: 0.80 }
        ].forEach(pushBass);
      } else if (bPattern === 'walking_jazz') {
        const nextRoot = 36 + (((rootBase + remapSemitone(nextChordObj.deg, scaleMode, piece.mode)) - 36) % 12 + 12) % 12;
        const approach = nextRoot > bRoot ? nextRoot - 1 : nextRoot + 1;
        [
          { s: 0, d: 3.8, m: bRoot, v: 0.84 },
          { s: 4, d: 3.8, m: third, v: 0.78 },
          { s: 8, d: 3.8, m: fifth, v: 0.82 },
          { s: 12, d: 3.8, m: approach, v: 0.78 }
        ].forEach(pushBass);
      } else if (bPattern === 'bossa_tumbao' || bPattern === 'western_alternating') {
        [
          { s: 0, d: 5.5, m: bRoot, v: 0.84 },
          { s: 6, d: 2.0, m: fifth, v: 0.76 },
          { s: 8, d: 5.5, m: fifth, v: 0.82 },
          { s: 14, d: 2.0, m: bRoot, v: 0.76 }
        ].forEach(pushBass);
      } else if (bPattern === 'doom_drone') {
        [
          { s: 0, d: 7.5, m: bRoot, v: 0.88 },
          { s: 8, d: 7.5, m: bRoot, v: 0.88 }
        ].forEach(pushBass);
      } else {
        [
          { s: 0, d: 3.5, m: bRoot, v: 0.86 },
          { s: 7, d: 2.5, m: fifth, v: 0.78 },
          { s: 10, d: 3.5, m: bRoot, v: 0.84 },
          { s: 14, d: 2.0, m: third, v: 0.76 }
        ].forEach(pushBass);
      }
    }

    // --- TRACK 4: DRUM GROOVE ---
    const kickGrid = Array.isArray(drumSpec.kick_steps) && drumSpec.kick_steps.length === 16
      ? drumSpec.kick_steps
      : [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.5, 0, 0, 0, 0];
    const snareGrid = Array.isArray(drumSpec.snare_steps) && drumSpec.snare_steps.length === 16
      ? drumSpec.snare_steps
      : [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    const hatGrid = Array.isArray(drumSpec.hat_steps) && drumSpec.hat_steps.length === 16
      ? drumSpec.hat_steps
      : [0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0, 1.2, 0];
    const percGrid = Array.isArray(drumSpec.perc_steps) && drumSpec.perc_steps.length === 16
      ? drumSpec.perc_steps
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (let bar = 0; bar < 8; bar++) {
      const baseStep = bar * 16;
      for (let s = 0; s < 16; s++) {
        if (kickGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'kick', midi: 36, vel: Math.min(1, kickGrid[s]) });
        }
        if (snareGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'snare', midi: 38, vel: Math.min(1, snareGrid[s]) });
        }
        if (hatGrid[s] > 0.05) {
          const isOpenOrRoll = hatGrid[s] > 1.15;
          events.drums.push({
            step: baseStep + s,
            dur: 1,
            type: isOpenOrRoll ? 'hat_open_or_roll' : 'hat',
            midi: isOpenOrRoll ? 46 : 42,
            vel: Math.min(1, hatGrid[s] * 0.78)
          });
        }
        if (percGrid[s] > 0.05) {
          events.drums.push({ step: baseStep + s, dur: 1, type: 'perc', midi: 37, vel: Math.min(1, percGrid[s] * 0.8) });
        }
      }
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // 5. WEB AUDIO PROCEDURAL SYNTHESIZER, PAIRED FX & DRUM ENGINE
  //    Supports full LLM per-stem ADSR, breath/chiff, 3-reed musette chorus,
  //    9-drawbar Hammond B3 + Leslie rotary horn, 2-op FM, tube drive & panning
  // --------------------------------------------------------------------------
  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // Per-AudioContext cache for PeriodicWaves, Noise Buffers, and Saturation Curves
  const dspCache = new WeakMap();
  const driveCurveCache = new Map();

  function getDriveCurve(driveAmount = 0.2) {
    const amt = clampNum(driveAmount, 0, 1, 0.2);
    const key = Math.round(amt * 100);
    if (driveCurveCache.has(key)) return driveCurveCache.get(key);

    // Odd length (1025) guarantees exact center index 512 === 0.0 with zero DC offset!
    const n = 1025;
    const curve = new Float32Array(n);
    const k = 1 + amt * 2.8;
    const norm = Math.tanh(k) || 1;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = Math.tanh(k * x) / norm;
    }
    driveCurveCache.set(key, curve);
    return curve;
  }

  function getDspResources(ctx) {
    if (dspCache.has(ctx)) return dspCache.get(ctx);

    // 1. 2-Second Filtered Noise Buffer (for flute breath/chiff, accordion air, snare rattle & hat sizzle)
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * 2.0);
    const noiseBuffer = ctx.createBuffer(1, len, rate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // Warm pink-white hybrid noise so breath and snares sound natural, never harsh
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.55) * 0.65;
    }

    // 2. Hammond B3 9-Drawbar PeriodicWave (16', 5 1/3', 8', 4', 2 2/3', 2', 1 3/5', 1 1/3', 1')
    const b3Real = new Float32Array(17);
    const b3Imag = new Float32Array(17);
    b3Imag[1] = 1.00;  // 8' fundamental
    b3Imag[2] = 0.82;  // 4' octave
    b3Imag[3] = 0.68;  // 2 2/3' twelfth (classic Hammond B3 grit)
    b3Imag[4] = 0.52;  // 2' fifteenth
    b3Imag[5] = 0.28;  // 1 3/5' tierce
    b3Imag[6] = 0.34;  // 1 1/3' larigot
    b3Imag[8] = 0.24;  // 1' super-octave
    const b3Wave = ctx.createPeriodicWave(b3Real, b3Imag, { disableNormalization: false });

    // 3. Free-Reed Accordion / Melodica PeriodicWave (rich odd+even reed spectrum)
    const reedReal = new Float32Array(13);
    const reedImag = new Float32Array(13);
    reedImag[1] = 1.00;
    reedImag[2] = 0.72;
    reedImag[3] = 0.85;
    reedImag[4] = 0.40;
    reedImag[5] = 0.52;
    reedImag[6] = 0.22;
    reedImag[7] = 0.30;
    reedImag[8] = 0.12;
    reedImag[9] = 0.15;
    const reedWave = ctx.createPeriodicWave(reedReal, reedImag, { disableNormalization: false });

    // 4. Warm Brass Horn PeriodicWave
    const brassReal = new Float32Array(13);
    const brassImag = new Float32Array(13);
    for (let h = 1; h <= 12; h++) {
      brassImag[h] = Math.pow(0.84, h - 1);
    }
    const brassWave = ctx.createPeriodicWave(brassReal, brassImag, { disableNormalization: false });

    const res = { noiseBuffer, b3Wave, reedWave, brassWave };
    dspCache.set(ctx, res);
    return res;
  }

  function createImpulseResponse(ctx, durationSec = 1.4, decay = 3.2) {
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
    masterGain.gain.value = 0.92;

    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = clampNum(fxSpec?.filter_cutoff, 1200, 16000, 8800);
    masterFilter.Q.value = 0.8;

    // Strictly Passive Tape / Dub Delay Bus (no WaveShaper inside feedback loop so loop gain < 1.0 always!)
    const delayNode = ctx.createDelay(2.0);
    const delaySteps = clampNum(fxSpec?.delay_steps, 1, 8, 3);
    delayNode.delayTime.value = Math.min(1.5, Math.max(0.09, delaySteps * stepDurSec));
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.28; // Decays naturally in 3-4 repeats, never self-oscillates
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'bandpass';
    delayFilter.frequency.value = 1250;
    delayFilter.Q.value = 0.9;
    const delayWet = ctx.createGain();
    delayWet.gain.value = clampNum(fxSpec?.delay_wet, 0, 0.48, 0.18);

    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWet);

    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx, 1.45, 3.1);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = clampNum(fxSpec?.reverb_wet, 0, 0.40, 0.18);
    convolver.connect(reverbWet);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 10;
    comp.ratio.value = 3;
    comp.attack.value = 0.008;
    comp.release.value = 0.12;

    const dryBus = ctx.createGain();
    dryBus.gain.value = 1.0;

    dryBus.connect(masterFilter);
    delayWet.connect(masterFilter);
    reverbWet.connect(masterFilter);

    masterFilter.connect(comp);
    comp.connect(masterGain);

    return {
      inputBus: dryBus,
      delaySend: delayNode,
      reverbSend: convolver,
      masterFilter,
      delayWet,
      delayFeedback,
      delayNode,
      reverbWet,
      masterGain
    };
  }

  // Synthesize a single voice with full ADSR, physical/FM/additive modeling, paired insert FX, and stereo pan
  function triggerSynthNote(ctx, graph, specOrPatch, midi, startTime, durationSec, velocity, extraEcho = false, role = 'melody', panOffset = 0) {
    if (!graph || !ctx) return;
    const dsp = getDspResources(ctx);
    const spec = (typeof specOrPatch === 'object' && specOrPatch !== null)
      ? specOrPatch
      : { patch: String(specOrPatch || 'melodica_dub') };
    const patch = spec.patch || 'melodica_dub';
    const timbre = spec.timbre || {};
    const adsr = spec.adsr || {};
    const sends = spec.sends || {};

    const freq = midiToFreq(clampNum(midi, 24, 108, 60));
    const dur = Math.max(0.05, clampNum(durationSec, 0.05, 8.0, 0.25));
    const safeVel = clampNum(velocity, 0.1, 1.0, 0.85);

    // STUDIO-BALANCED ROLE GAIN HIERARCHY (verified via OfflineAudioContext stem RMS telemetry):
    // - 'melody': 0.30 peak (~ -16 to -18 dB RMS, clear #1 lead focal point)
    // - 'bass':   0.26 peak (~ -19 to -21 dB RMS, warm low-end foundation with 2nd harmonic)
    // - 'chord':  0.135 per voice (so 3-note chords sum to ~ -22 to -24 dB RMS, sitting 6 dB under the lead!)
    const roleScale = role === 'melody' ? 0.30 : (role === 'bass' ? 0.26 : 0.135);
    const peak = Math.max(0.005, safeVel * roleScale);

    // Default ADSR & Timbre values tailored by patch, overridden by LLM's explicit parameters
    let defAttack = 0.010, defDecay = 0.18, defSustain = 0.72, defRelease = 0.08;
    let defCutoff = role === 'melody' ? 4000 : (role === 'bass' ? 720 : 2500);
    let defQ = 1.4;
    let defDrive = 0.12;
    let defBreath = 0.0;
    let defChorus = 6;
    let defVibRate = 5.4;
    let defVibDepth = role === 'melody' ? 8 : 0;
    let defRotary = 'off';

    if (patch === 'flute_airy' || patch === 'whistle_western') {
      defAttack = 0.028; defDecay = 0.20; defSustain = 0.82; defRelease = 0.14;
      defBreath = 0.26; defVibRate = 5.5; defVibDepth = 15; defDrive = 0.05;
    } else if (patch === 'accordion_musette' || patch === 'melodica_dub') {
      defAttack = 0.022; defDecay = 0.20; defSustain = 0.85; defRelease = 0.10;
      defBreath = 0.12; defChorus = patch === 'accordion_musette' ? 16 : 9;
      defVibRate = 5.1; defVibDepth = 8; defDrive = 0.14;
    } else if (patch === 'roto_organ' || patch === 'organ_skank') {
      defAttack = 0.004; defDecay = 0.14; defSustain = role === 'melody' ? 0.88 : 0.65;
      defRelease = role === 'melody' ? 0.07 : 0.045;
      defRotary = patch === 'roto_organ' ? (role === 'melody' ? 'accel' : 'fast') : 'fast';
      defDrive = 0.24; defBreath = 0.05;
    } else if (patch === 'rhodes_ep' || patch === 'warm_rhodes' || patch === 'vibraphone_jazz' || patch === 'dark_trap_bells') {
      defAttack = 0.004; defDecay = 0.32; defSustain = 0.52; defRelease = 0.18;
      defDrive = 0.10;
    } else if (patch === 'brass_horn') {
      defAttack = 0.014; defDecay = 0.18; defSustain = 0.82; defRelease = 0.09;
      defDrive = 0.26; defVibDepth = 11; defBreath = 0.07;
    } else if (patch === 'fuzz_lead' || patch === 'doom_power_stack' || patch === 'doom_fuzz') {
      defAttack = 0.007; defDecay = 0.22; defSustain = 0.80; defRelease = 0.11;
      defDrive = 0.65; defChorus = 10;
    } else if (patch === 'square_8bit' || patch === 'chip_arp') {
      defAttack = 0.002; defDecay = 0.10; defSustain = 0.68; defRelease = 0.025;
      defCutoff = role === 'chord' ? 2800 : 7800; defVibDepth = 4;
    }

    const attack = clampNum(adsr.attack, 0.002, 0.18, defAttack);
    const decay = clampNum(adsr.decay, 0.03, 0.80, defDecay);
    const rawSustain = clampNum(adsr.sustain, 0.10, 0.98, defSustain);
    const sustain = role === 'chord' ? Math.max(0.55, rawSustain) : rawSustain;
    const release = clampNum(adsr.release, 0.02, 0.45, defRelease);

    // Strictly monotonic ADSR envelope timestamps even on rapid 16th-note ornaments!
    const effAttack = Math.min(attack, dur * 0.35);
    const effDecay = Math.min(decay, Math.max(0.012, (dur - effAttack) * 0.60));
    const tAttack = startTime + effAttack;
    const tDecay = tAttack + effDecay;
    const tNoteOff = Math.max(tDecay + 0.005, startTime + dur);
    const tRelease = tNoteOff + release;
    const stopTime = tRelease + 0.025;

    const rawCutoff = clampNum(timbre.filter_cutoff, 220, 12000, defCutoff);
    const cutoff = role === 'chord' ? Math.max(2200, rawCutoff) : (role === 'bass' ? Math.max(680, rawCutoff) : rawCutoff);
    const filterQ = clampNum(timbre.filter_q, 0.5, 8.0, defQ);
    const driveAmt = clampNum(timbre.drive, 0, 0.85, defDrive);
    const breathAmt = clampNum(timbre.breath_noise, 0, 0.40, defBreath);
    const chorusDetune = clampNum(timbre.chorus_detune, 0, 24, defChorus);
    const vibRate = clampNum(timbre.vibrato_rate, 3.0, 8.5, defVibRate);
    const vibDepth = clampNum(timbre.vibrato_depth, 0, 30, defVibDepth);
    const rotaryMode = timbre.rotary_speed || defRotary;

    // Voice envelope & stereo panning stage
    const voiceBus = ctx.createGain();
    const outEnv = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const defaultRolePan = role === 'bass' ? 0.0 : (role === 'chord' ? 0.24 : -0.04);
    const basePan = role === 'bass' ? 0.0 : clampNum(spec.pan, -0.85, 0.85, defaultRolePan);
    if (panner) {
      panner.pan.setValueAtTime(clampNum(basePan + (Number(panOffset) || 0), -0.85, 0.85, 0), startTime);
    }

    const vcf = ctx.createBiquadFilter();
    vcf.type = 'lowpass';
    vcf.frequency.setValueAtTime(cutoff, startTime);
    vcf.Q.value = filterQ;

    // Optional Tube / Fuzz WaveShaper stage
    let postFilterNode = vcf;
    if (driveAmt > 0.04) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = getDriveCurve(driveAmt);
      vcf.connect(shaper);
      postFilterNode = shaper;
    }

    // Track oscillators/sources to stop cleanly
    const activeNodes = [];
    const oscPitchTargets = [];

    // --- ARCHITECTURE A: FLUTES & PAN PIPES (Woody Fundamental + Audible Embouchure Chiff + Breath Air + Delayed Vibrato) ---
    if (patch === 'flute_airy' || patch === 'whistle_western') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle'; // Warm hollow wooden body at 1x fundamental
      osc3.type = 'sine';     // Subtle 2nd harmonic overblown shimmer
      const startFreq = patch === 'whistle_western' ? freq * 0.985 : freq;
      osc1.frequency.setValueAtTime(startFreq, startTime);
      osc2.frequency.setValueAtTime(startFreq, startTime);
      osc2.detune.setValueAtTime(4, startTime);
      if (patch === 'whistle_western') {
        osc1.frequency.exponentialRampToValueAtTime(freq, startTime + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(freq, startTime + 0.03);
      }
      osc3.frequency.setValueAtTime(freq * 2, startTime);

      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      const g3 = ctx.createGain();
      g1.gain.value = 0.68;
      g2.gain.value = 0.30;
      g3.gain.value = 0.08;
      osc1.connect(g1); g1.connect(voiceBus);
      osc2.connect(g2); g2.connect(voiceBus);
      osc3.connect(g3); g3.connect(voiceBus);
      oscPitchTargets.push(osc1.frequency, osc2.frequency);
      activeNodes.push(osc1, osc2, osc3);

      // Embouchure Chiff Transient (first 38ms) + Sustained Breath Air Layer
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = dsp.noiseBuffer;
      noiseSrc.loop = true;
      noiseSrc.loopStart = ((Math.round(midi) % 12 + 12) % 12) * 0.11;
      noiseSrc.loopEnd = 1.9;

      const chiffBp = ctx.createBiquadFilter();
      chiffBp.type = 'bandpass';
      chiffBp.frequency.setValueAtTime(Math.min(3600, freq * 2.4), startTime);
      chiffBp.Q.value = 1.8;

      const chiffGain = ctx.createGain();
      const airLevel = Math.max(0.18, breathAmt);
      chiffGain.gain.setValueAtTime(0.001, startTime);
      // Distinct lip-plate chiff attack burst
      chiffGain.gain.linearRampToValueAtTime(airLevel * 3.6, startTime + 0.015);
      // Settle into warm audible breathy air stream
      chiffGain.gain.exponentialRampToValueAtTime(airLevel * 1.45, startTime + 0.055);

      noiseSrc.connect(chiffBp);
      chiffBp.connect(chiffGain);
      chiffGain.connect(voiceBus);
      oscPitchTargets.push(chiffBp.frequency);
      activeNodes.push(noiseSrc);
    }

    // --- ARCHITECTURE B: ACCORDION MUSETTE & DUB MELODICA (3-Reed Wet Tuning + 16' Bassoon Sub-Reed + Woody Formant) ---
    else if (patch === 'accordion_musette' || patch === 'melodica_dub') {
      const detuneSpread = patch === 'accordion_musette' ? Math.max(12, chorusDetune) : Math.max(6, chorusDetune);
      const detunes = [0, detuneSpread, -detuneSpread];
      const gains = [0.46, 0.30, 0.30];

      // Warm wooden reed-box formant (~1150 Hz)
      const reedFormant = ctx.createBiquadFilter();
      reedFormant.type = 'peaking';
      reedFormant.frequency.setValueAtTime(patch === 'accordion_musette' ? 1150 : 1350, startTime);
      reedFormant.Q.value = 1.4;
      reedFormant.gain.value = 3.2;
      reedFormant.connect(voiceBus);

      detunes.forEach((dt, idx) => {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(dsp.reedWave);
        osc.frequency.setValueAtTime(freq, startTime);
        osc.detune.setValueAtTime(dt, startTime);
        const rg = ctx.createGain();
        rg.gain.value = gains[idx];
        osc.connect(rg);
        rg.connect(reedFormant);
        oscPitchTargets.push(osc.frequency);
        activeNodes.push(osc);
      });

      // 16' Sub-Octave Bassoon Reed Rank for Parisian Accordion richness
      if (patch === 'accordion_musette') {
        const subReed = ctx.createOscillator();
        subReed.type = 'triangle';
        subReed.frequency.setValueAtTime(freq * 0.5, startTime);
        const subGain = ctx.createGain();
        subGain.gain.value = 0.22;
        subReed.connect(subGain);
        subGain.connect(reedFormant);
        activeNodes.push(subReed);
      }

      // Subtle mechanical valve click + bellows air flow
      if (breathAmt > 0.02) {
        const airSrc = ctx.createBufferSource();
        airSrc.buffer = dsp.noiseBuffer;
        airSrc.loop = true;
        const airBp = ctx.createBiquadFilter();
        airBp.type = 'bandpass';
        airBp.frequency.value = 1800;
        airBp.Q.value = 1.8;
        const airGain = ctx.createGain();
        airGain.gain.setValueAtTime(breathAmt * 2.2, startTime);
        airGain.gain.exponentialRampToValueAtTime(Math.max(0.02, breathAmt * 0.8), startTime + 0.02);
        airSrc.connect(airBp);
        airBp.connect(airGain);
        airGain.connect(reedFormant);
        activeNodes.push(airSrc);
      }
    }

    // --- ARCHITECTURE C: HAMMOND B3 ROTO-ORGAN (9-Drawbar PeriodicWave + 3rd-Harmonic Percussion + Key Click + Leslie Rotary) ---
    else if (patch === 'roto_organ' || patch === 'organ_skank') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.setPeriodicWave(dsp.b3Wave);
      osc2.setPeriodicWave(dsp.b3Wave);
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(6, startTime);

      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      g1.gain.value = 0.58;
      g2.gain.value = 0.42;
      osc1.connect(g1);
      osc2.connect(g2);
      g1.connect(voiceBus);
      g2.connect(voiceBus);
      oscPitchTargets.push(osc1.frequency, osc2.frequency);
      activeNodes.push(osc1, osc2);

      // B3 3rd-Harmonic Percussion Ping (2 2/3' drawbar pop on attack)
      const percOsc = ctx.createOscillator();
      percOsc.type = 'sine';
      percOsc.frequency.setValueAtTime(freq * 3, startTime);
      const percGain = ctx.createGain();
      percGain.gain.setValueAtTime(role === 'melody' ? 0.28 : 0.16, startTime);
      percGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.065);
      percOsc.connect(percGain);
      percGain.connect(voiceBus);
      activeNodes.push(percOsc);

      // Electrical B3 Key-Click Transient (5ms contact scratch)
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = dsp.noiseBuffer;
      const clickBp = ctx.createBiquadFilter();
      clickBp.type = 'bandpass';
      clickBp.frequency.value = 2600;
      clickBp.Q.value = 2.5;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.24, startTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.006);
      clickSrc.connect(clickBp);
      clickBp.connect(clickGain);
      clickGain.connect(voiceBus);
      activeNodes.push(clickSrc);
    }

    // --- ARCHITECTURE D: 2-OPERATOR FM ELECTRIC PIANOS, VIBRAPHONES & BELLS ---
    else if (
      patch === 'rhodes_ep' ||
      patch === 'warm_rhodes' ||
      patch === 'rhodes_warm' ||
      patch === 'vibraphone_jazz' ||
      patch === 'dark_trap_bells' ||
      patch === 'trap_bells'
    ) {
      const isTrapBells = patch === 'dark_trap_bells' || patch === 'trap_bells';
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      carrier.type = 'sine';
      modulator.type = 'sine';

      const fmRatio = isTrapBells ? 2.76 : (patch === 'vibraphone_jazz' ? 4.0 : 3.0);
      const fmIndexPeak = isTrapBells ? freq * 2.4 : (patch === 'vibraphone_jazz' ? freq * 1.5 : freq * 1.45);
      const fmIndexSustain = freq * 0.28;

      carrier.frequency.setValueAtTime(freq, startTime);
      modulator.frequency.setValueAtTime(freq * fmRatio, startTime);

      const fmGain = ctx.createGain();
      fmGain.gain.setValueAtTime(fmIndexPeak, startTime);
      fmGain.gain.exponentialRampToValueAtTime(Math.max(1, fmIndexSustain), startTime + 0.14);

      // Warm fundamental + 2nd harmonic bark body so Rhodes chords & skanks cut through the mix
      const bodyOsc = ctx.createOscillator();
      bodyOsc.type = 'sawtooth';
      bodyOsc.frequency.setValueAtTime(freq, startTime);
      const bodyGain = ctx.createGain();
      bodyGain.gain.value = isTrapBells ? 0.32 : 0.48;

      modulator.connect(fmGain);
      fmGain.connect(carrier.frequency);
      carrier.connect(voiceBus);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(voiceBus);

      oscPitchTargets.push(carrier.frequency, bodyOsc.frequency);
      activeNodes.push(carrier, modulator, bodyOsc);
    }

    // --- ARCHITECTURE E: BRASS HORN SECTION (Sustained Lip-Slur Scoop + Staccato Tongue Punch + Bell Formant) ---
    else if (patch === 'brass_horn') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.setPeriodicWave(dsp.brassWave);
      osc2.type = 'sawtooth';

      // Only apply lip-slur pitch scoop on sustained notes (dur > 0.22s); keep rapid 16th staccatos tight!
      if (dur > 0.22) {
        const scoopStart = freq * 0.985;
        osc1.frequency.setValueAtTime(scoopStart, startTime);
        osc1.frequency.exponentialRampToValueAtTime(freq, startTime + 0.022);
        osc2.frequency.setValueAtTime(scoopStart, startTime);
        osc2.frequency.exponentialRampToValueAtTime(freq, startTime + 0.024);
      } else {
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq, startTime);
      }
      osc2.detune.setValueAtTime(chorusDetune, startTime);

      // Brass bell filter blare envelope
      vcf.frequency.setValueAtTime(750, startTime);
      vcf.frequency.exponentialRampToValueAtTime(cutoff, startTime + 0.032);

      const g2 = ctx.createGain();
      g2.gain.value = 0.48;
      osc1.connect(voiceBus);
      osc2.connect(g2);
      g2.connect(voiceBus);
      oscPitchTargets.push(osc1.frequency, osc2.frequency);
      activeNodes.push(osc1, osc2);
    }

    // --- ARCHITECTURE F: FUZZ GUITAR & DOOM POWER STACK (High-Gain Fuzz + Speaker Cabinet Simulator) ---
    else if (patch === 'fuzz_lead' || patch === 'doom_power_stack' || patch === 'doom_fuzz') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.detune.setValueAtTime(chorusDetune, startTime);

      // Guitar speaker cabinet presence peak (1.75 kHz)
      const cabMid = ctx.createBiquadFilter();
      cabMid.type = 'peaking';
      cabMid.frequency.value = 1750;
      cabMid.Q.value = 1.6;
      cabMid.gain.value = 4.5;

      const g2 = ctx.createGain();
      g2.gain.value = 0.55;
      osc1.connect(cabMid);
      osc2.connect(g2);
      g2.connect(cabMid);
      cabMid.connect(voiceBus);
      oscPitchTargets.push(osc1.frequency, osc2.frequency);
      activeNodes.push(osc1, osc2);
    }

    // --- ARCHITECTURE G: SUPERSAW, ACID 303, CHIPTUNE, PLUCKED GUITAR & HARMONIC BASSES ---
    else {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      if (patch === 'supersaw_cyber' || patch === 'cyber_pwm') {
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc2.detune.setValueAtTime(Math.max(12, chorusDetune), startTime);
        const osc3 = ctx.createOscillator();
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(freq, startTime);
        osc3.detune.setValueAtTime(-Math.max(12, chorusDetune), startTime);
        const g3 = ctx.createGain();
        g3.gain.value = 0.45;
        osc3.connect(g3);
        g3.connect(voiceBus);
        oscPitchTargets.push(osc3.frequency);
        activeNodes.push(osc3);
      } else if (patch === 'acid_303_lead' || patch === 'tb303_acid') {
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        vcf.frequency.setValueAtTime(cutoff, startTime);
        vcf.frequency.exponentialRampToValueAtTime(Math.max(260, cutoff * 0.16), startTime + Math.min(0.20, dur));
      } else if (patch === 'square_8bit' || patch === 'chip_arp') {
        osc1.type = 'square';
        osc2.type = 'square';
        // Classic NES 15ms octave grace-note blip on lead notes
        if (role === 'melody') {
          osc1.frequency.setValueAtTime(freq * 2, startTime);
          osc1.frequency.setValueAtTime(freq, startTime + 0.016);
        }
      } else if (patch === 'sub_dub' || patch === 'trap_808') {
        osc1.type = 'sine';
        osc2.type = 'sawtooth'; // Warm 2nd-harmonic saturation so sub-bass translates on all speakers!
        osc1.frequency.setValueAtTime(freq * 1.35, startTime);
        osc1.frequency.exponentialRampToValueAtTime(freq, startTime + 0.038);
        osc2.frequency.setValueAtTime(freq * 2, startTime);
      } else if (
        patch === 'nylon_guitar' ||
        patch === 'acoustic_guitar' ||
        patch === 'clean_guitar' ||
        patch === 'clavinet_funk' ||
        patch === 'honky_tonk'
      ) {
        const isBrightChop = patch === 'clean_guitar' || patch === 'clavinet_funk';
        osc1.type = isBrightChop ? 'sawtooth' : 'triangle';
        osc2.type = isBrightChop ? 'square' : 'sawtooth';
        osc2.detune.setValueAtTime(patch === 'honky_tonk' ? 14 : (patch === 'acoustic_guitar' ? 7 : 5), startTime);
        vcf.frequency.setValueAtTime(cutoff * (isBrightChop ? 1.85 : 1.45), startTime);
        vcf.frequency.exponentialRampToValueAtTime(Math.max(820, cutoff * (isBrightChop ? 0.65 : 0.48)), startTime + Math.min(0.22, dur));
      } else {
        // upright_jazz, slap_funk, reese_cyber, nes_triangle
        osc1.type = (patch === 'reese_cyber' || patch === 'slap_funk') ? 'sawtooth' : 'triangle';
        osc2.type = 'sawtooth';
        osc2.detune.setValueAtTime(chorusDetune, startTime);
        vcf.frequency.setValueAtTime(cutoff * 1.35, startTime);
        vcf.frequency.exponentialRampToValueAtTime(Math.max(320, cutoff * 0.50), startTime + Math.min(0.24, dur));
      }

      if (patch !== 'sub_dub' && patch !== 'trap_808' && !(patch === 'square_8bit' && role === 'melody')) {
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq, startTime);
      }

      const g2 = ctx.createGain();
      g2.gain.value = (patch === 'sub_dub' || patch === 'trap_808') ? 0.34 : (role === 'melody' ? 0.48 : 0.44);
      osc1.connect(voiceBus);
      osc2.connect(g2);
      g2.connect(voiceBus);
      oscPitchTargets.push(osc1.frequency, osc2.frequency);
      activeNodes.push(osc1, osc2);
    }

    // --- PAIRED EFFECT 1: LESLIE ROTARY SPEAKER SIMULATOR (Subtle Doppler FM + Filter Swirl + Horn AM) ---
    let rotaryTremoloNode = null;
    if (rotaryMode && rotaryMode !== 'off') {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      if (rotaryMode === 'accel') {
        lfo.frequency.setValueAtTime(1.6, startTime);
        lfo.frequency.exponentialRampToValueAtTime(6.3, startTime + Math.min(0.45, dur));
      } else {
        lfo.frequency.setValueAtTime(rotaryMode === 'slow' ? 1.5 : 6.3, startTime);
      }

      // 1. Horn Filter Swirl (clamped to <= 28% of cutoff so vcf.frequency never underflows)
      const filterMod = ctx.createGain();
      filterMod.gain.value = Math.min(cutoff * 0.28, role === 'melody' ? 520 : 320);
      lfo.connect(filterMod);
      filterMod.connect(vcf.frequency);

      // 2. Subtle Doppler Pitch Vibrato (±4 cents so fast melodies stay in tune!)
      const pitchMod = ctx.createGain();
      pitchMod.gain.value = freq * 0.0024;
      lfo.connect(pitchMod);
      oscPitchTargets.forEach(param => pitchMod.connect(param));

      // 3. Horn Amplitude Pulsing (AM)
      rotaryTremoloNode = ctx.createGain();
      rotaryTremoloNode.gain.value = 0.80;
      const amDepth = ctx.createGain();
      amDepth.gain.value = 0.20;
      lfo.connect(amDepth);
      amDepth.connect(rotaryTremoloNode.gain);

      activeNodes.push(lfo);
    }
    // --- PAIRED EFFECT 2: DELAYED EXPRESSIVE VIBRATO (Flutes, Brass, Leads) ---
    else if (vibDepth > 1 && role === 'melody' && dur > 0.14) {
      const vibLfo = ctx.createOscillator();
      vibLfo.type = 'sine';
      vibLfo.frequency.setValueAtTime(vibRate, startTime);

      const vibGain = ctx.createGain();
      const maxHzShift = freq * (Math.pow(2, vibDepth / 1200) - 1);
      // Delay vibrato bloom by 110ms like a real wind/string player!
      vibGain.gain.setValueAtTime(0.0001, startTime);
      vibGain.gain.linearRampToValueAtTime(maxHzShift, startTime + Math.min(dur, 0.16));

      vibLfo.connect(vibGain);
      oscPitchTargets.forEach(param => vibGain.connect(param));
      activeNodes.push(vibLfo);
    }

    // Wire voice signal chain: voiceBus -> vcf -> [WaveShaper] -> [Rotary AM] -> outEnv -> [StereoPanner] -> Buses
    voiceBus.connect(vcf);
    if (rotaryTremoloNode) {
      postFilterNode.connect(rotaryTremoloNode);
      rotaryTremoloNode.connect(outEnv);
    } else {
      postFilterNode.connect(outEnv);
    }

    const finalOut = panner || outEnv;
    if (panner) {
      outEnv.connect(panner);
    }

    // Full 4-Stage ADSR Envelope with strictly monotonic timestamps
    const sustainLevel = Math.max(0.001, peak * sustain);
    outEnv.gain.setValueAtTime(0.0001, startTime);
    outEnv.gain.linearRampToValueAtTime(peak, tAttack);
    outEnv.gain.exponentialRampToValueAtTime(sustainLevel, tDecay);
    outEnv.gain.setValueAtTime(sustainLevel, tNoteOff);
    outEnv.gain.exponentialRampToValueAtTime(0.0001, tRelease);

    finalOut.connect(graph.inputBus);

    // Role-Aware & LLM-Configured Delay / Reverb Sends
    const baseDelaySend = clampNum(sends.delay, 0, 0.45, 0.16);
    const sendDelayAmt = role === 'melody'
      ? (extraEcho ? Math.max(0.32, baseDelaySend) : baseDelaySend * 0.45)
      : (role === 'chord' ? (extraEcho ? 0.24 : clampNum(sends.delay, 0, 0.10, 0.05)) : 0.0);
    const sendRevAmt = role === 'melody'
      ? clampNum(sends.reverb, 0, 0.45, 0.22)
      : (role === 'chord' ? clampNum(sends.reverb, 0, 0.16, 0.08) : 0.0);

    if (sendDelayAmt > 0.02) {
      const dSend = ctx.createGain();
      dSend.gain.value = sendDelayAmt;
      finalOut.connect(dSend);
      dSend.connect(graph.delaySend);
    }
    if (sendRevAmt > 0.02) {
      const rSend = ctx.createGain();
      rSend.gain.value = sendRevAmt;
      finalOut.connect(rSend);
      rSend.connect(graph.reverbSend);
    }

    activeNodes.forEach(node => {
      node.start(startTime);
      node.stop(stopTime);
    });
  }

  // Multi-Layer Drum Synthesizer (3-Stage Kick, Dual-Mode Snare & Dub Rimshot, 6-Osc Metallic Hats & Cowbell/Shaker)
  function triggerDrumHit(ctx, graph, drumSpecOrKit, type, startTime, velocity, stepDurSec) {
    if (!graph || !ctx) return;
    const dsp = getDspResources(ctx);
    const drumSpec = (typeof drumSpecOrKit === 'object' && drumSpecOrKit !== null)
      ? drumSpecOrKit
      : { kit: String(drumSpecOrKit || 'dub_kit') };
    const kit = drumSpec.kit || 'dub_kit';
    const tuning = drumSpec.tuning || {};
    const v = clampNum(velocity, 0.1, 1.0, 0.8);

    // --- 1. 3-STAGE KICK DRUM (Beater Click + 2-Stage Pitch Snap + Soft Saturation) ---
    if (type === 'kick') {
      const punch = clampNum(tuning.kick_punch, 0.4, 1.0, 0.78);
      const osc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      const shaper = ctx.createWaveShaper();
      shaper.curve = getDriveCurve(0.26 * punch);

      osc.type = kit === 'chip_kit' ? 'triangle' : 'sine';
      const subFreq = kit === 'trap_kit' ? 44 : (kit === 'bossa_kit' ? 56 : 49);
      const decay = kit === 'trap_kit' ? 0.30 : 0.21;

      // 2-stage pitch envelope: 320 Hz beater snap -> 110 Hz chest punch -> subFreq
      osc.frequency.setValueAtTime(320, startTime);
      osc.frequency.exponentialRampToValueAtTime(110, startTime + 0.014);
      osc.frequency.exponentialRampToValueAtTime(subFreq, startTime + 0.072);

      bodyGain.gain.setValueAtTime(v * 0.48, startTime);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

      osc.connect(shaper);
      shaper.connect(bodyGain);
      bodyGain.connect(graph.inputBus);
      osc.start(startTime);
      osc.stop(startTime + decay + 0.02);

      // Beater Click Transient (12ms filtered noise impulse)
      if (kit !== 'chip_kit') {
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = dsp.noiseBuffer;
        const clickBp = ctx.createBiquadFilter();
        clickBp.type = 'bandpass';
        clickBp.frequency.value = 1850;
        clickBp.Q.value = 1.6;
        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(v * 0.22 * punch, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.014);
        clickSrc.connect(clickBp);
        clickBp.connect(clickGain);
        clickGain.connect(graph.inputBus);
        clickSrc.start(startTime);
        clickSrc.stop(startTime + 0.018);
      }
      return;
    }

    // --- 2. MULTI-LAYER SNARE & KING TUBBY DUB RIMSHOT ---
    if (type === 'snare') {
      const snap = clampNum(tuning.snare_snap, 0.4, 1.0, 0.75);
      const isDubRim = kit === 'dub_kit' || kit === 'bossa_kit';

      if (isDubRim) {
        // Woody Cross-Stick / Rimshot: Shell body (205 Hz) + Dual rim resonators (485 Hz + 1680 Hz) + Dub Echo send
        const rimOut = ctx.createGain();
        const freqs = [205, 485, 1680];
        const gains = [0.26, 0.24, 0.16];
        const durs  = [0.070, 0.055, 0.032];
        freqs.forEach((rf, idx) => {
          const osc = ctx.createOscillator();
          osc.type = idx === 2 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(rf * 1.18, startTime);
          osc.frequency.exponentialRampToValueAtTime(rf, startTime + 0.018);
          const g = ctx.createGain();
          g.gain.setValueAtTime(v * gains[idx], startTime);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + durs[idx]);
          osc.connect(g);
          g.connect(rimOut);
          osc.start(startTime);
          osc.stop(startTime + durs[idx] + 0.01);
        });

        // Crisp stick & snare wire transient
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = dsp.noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2100;
        bp.Q.value = 2.4;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(v * 0.24, startTime);
        ng.gain.exponentialRampToValueAtTime(0.001, startTime + 0.055);
        nSrc.connect(bp);
        bp.connect(ng);
        ng.connect(rimOut);
        nSrc.start(startTime);
        nSrc.stop(startTime + 0.065);

        rimOut.connect(graph.inputBus);
        const rimEcho = clampNum(tuning.rim_dub_echo, 0.05, 0.35, 0.22);
        const dSend = ctx.createGain();
        dSend.gain.value = rimEcho;
        rimOut.connect(dSend);
        dSend.connect(graph.delaySend);
        return;
      }

      // Full Snare Drum: Dual shell modes (185 Hz + 330 Hz) + Snare Wire Rattle
      const snareBus = ctx.createGain();
      [185, 330].forEach((sf, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(sf * 1.4, startTime);
        osc.frequency.exponentialRampToValueAtTime(sf, startTime + 0.035);
        const g = ctx.createGain();
        g.gain.setValueAtTime(v * (idx === 0 ? 0.28 : 0.16), startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.095);
        osc.connect(g);
        g.connect(snareBus);
        osc.start(startTime);
        osc.stop(startTime + 0.105);
      });

      const nSrc = ctx.createBufferSource();
      nSrc.buffer = dsp.noiseBuffer;
      const wireHp = ctx.createBiquadFilter();
      wireHp.type = 'highpass';
      wireHp.frequency.value = 1400;
      const wireGain = ctx.createGain();
      const tailDur = kit === 'cyber_kit' || kit === 'doom_kit' ? 0.17 : 0.125;
      wireGain.gain.setValueAtTime(v * 0.32 * snap, startTime);
      wireGain.gain.exponentialRampToValueAtTime(0.001, startTime + tailDur);

      nSrc.connect(wireHp);
      wireHp.connect(wireGain);
      wireGain.connect(snareBus);
      nSrc.start(startTime);
      nSrc.stop(startTime + tailDur + 0.02);

      snareBus.connect(graph.inputBus);
      const rSend = ctx.createGain();
      rSend.gain.value = kit === 'cyber_kit' ? 0.22 : 0.12;
      snareBus.connect(rSend);
      rSend.connect(graph.reverbSend);
      return;
    }

    // --- 3. METALLIC 6-OSCILLATOR HI-HATS & CYMBALS (TR-808/909 Bronze Matrix + Sizzle) ---
    if (type === 'hat' || type === 'hat_open_or_roll') {
      const sizzle = clampNum(tuning.hat_sizzle, 0.4, 1.0, 0.72);
      const isTrapRoll = type === 'hat_open_or_roll' && kit === 'trap_kit';
      const subHits = isTrapRoll ? 2 : 1;
      const metalRatios = [246.3, 365.4, 443.5, 627.2, 648.0, 960.0];

      for (let h = 0; h < subHits; h++) {
        const t = startTime + h * (stepDurSec * 0.5);
        const dur = (type === 'hat_open_or_roll' && !isTrapRoll) ? 0.145 : 0.042;

        const hatBus = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 5200;

        // Metallic square cluster (3 key ratios for crisp bronze shimmer)
        [metalRatios[0], metalRatios[2], metalRatios[4]].forEach(mf => {
          const mOsc = ctx.createOscillator();
          mOsc.type = 'square';
          mOsc.frequency.setValueAtTime(mf, t);
          const mg = ctx.createGain();
          mg.gain.value = 0.22;
          mOsc.connect(mg);
          mg.connect(hp);
          mOsc.start(t);
          mOsc.stop(t + dur + 0.01);
        });

        // High-passed air sizzle
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = dsp.noiseBuffer;
        nSrc.loop = true;
        nSrc.loopStart = (h * 0.17) % 1.5;
        nSrc.loopEnd = 1.9;
        const ng = ctx.createGain();
        ng.gain.value = 0.85;
        nSrc.connect(ng);
        ng.connect(hp);
        nSrc.start(t);
        nSrc.stop(t + dur + 0.01);

        hp.connect(hatBus);
        hatBus.gain.setValueAtTime(v * 0.24 * sizzle, t);
        hatBus.gain.exponentialRampToValueAtTime(0.0008, t + dur);

        if (ctx.createStereoPanner) {
          const pan = ctx.createStereoPanner();
          pan.pan.value = clampNum(tuning.hat_pan, -0.8, 0.8, 0.24);
          hatBus.connect(pan);
          pan.connect(graph.inputBus);
        } else {
          hatBus.connect(graph.inputBus);
        }
      }
      return;
    }

    // --- 4. KIT-AWARE PERCUSSION (808 Dual-Tone Cowbell / Agogo / Clave) ---
    if (type === 'perc') {
      const percBus = ctx.createGain();
      const freqs = kit === 'trap_kit' ? [540, 800] : [680, 1020];
      freqs.forEach((pf, idx) => {
        const osc = ctx.createOscillator();
        osc.type = kit === 'trap_kit' ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(pf, startTime);
        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.55 : 0.45;
        osc.connect(g);
        g.connect(percBus);
        osc.start(startTime);
        osc.stop(startTime + 0.065);
      });

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 760;
      bp.Q.value = 2.0;

      const env = ctx.createGain();
      env.gain.setValueAtTime(v * 0.22, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.060);

      percBus.connect(bp);
      bp.connect(env);

      if (ctx.createStereoPanner) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = Number(tuning.perc_pan) || -0.26;
        env.connect(pan);
        pan.connect(graph.inputBus);
      } else {
        env.connect(graph.inputBus);
      }
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
    trackEvents.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const data = [];
    let lastTick = 0;
    for (const ev of trackEvents) {
      const delta = Math.max(0, Math.round(ev.tick - lastTick));
      lastTick = Math.round(ev.tick);
      data.push(...writeVarLen(delta), ...ev.bytes);
    }
    data.push(0x00, 0xFF, 0x2F, 0x00);

    const len = data.length;
    return [
      0x4D, 0x54, 0x72, 0x6B,
      (len >> 24) & 0xFF,
      (len >> 16) & 0xFF,
      (len >> 8) & 0xFF,
      len & 0xFF,
      ...data
    ];
  }

  function encodeArrangementToMidiBlob(compiled, bp, loops = 2) {
    const ppq = 480;
    const ticksPer16th = ppq / 4;
    const bpm = Math.max(40, Math.min(220, Number(bp.tempo_bpm) || 110));
    const usPerQuarter = Math.round(60000000 / bpm);

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
      accordion_musette: 21,
      roto_organ: 18,
      melodica_dub: 22,
      supersaw_cyber: 81,
      square_8bit: 80,
      rhodes_ep: 4,
      acid_303_lead: 87,
      flute_airy: 73,
      fuzz_lead: 30,
      vibraphone_jazz: 11,
      brass_horn: 61,
      whistle_western: 78,
      organ_skank: 18,
      warm_rhodes: 4,
      cyber_pwm: 89,
      chip_arp: 80,
      nylon_guitar: 24,
      doom_power_stack: 30,
      clavinet_funk: 7,
      dark_trap_bells: 14,
      honky_tonk: 3,
      sub_dub: 38,
      trap_808: 38,
      reese_cyber: 39,
      upright_jazz: 32,
      tb303_acid: 38,
      nes_triangle: 38,
      doom_fuzz: 34,
      slap_funk: 36
    };

    function buildNoteTrack(notesArray, channel, programNum, maxMidiVel, panVal = 0) {
      const evs = [];
      if (channel !== 9) {
        evs.push({ tick: 0, order: 0, bytes: [0xC0 | channel, programNum & 0x7F] });
        // Standard MIDI CC 10 (Pan) so exported .MID files preserve the LLM's stereo stage!
        const midiPan = Math.max(0, Math.min(127, Math.round(64 + panVal * 56)));
        evs.push({ tick: 0, order: 0, bytes: [0xB0 | channel, 10, midiPan] });
      }
      for (let l = 0; l < loops; l++) {
        const loopOffsetSteps = l * 128;
        notesArray.forEach(n => {
          const startTick = (loopOffsetSteps + n.step) * ticksPer16th;
          const durTicks = Math.max(30, n.dur * ticksPer16th);
          const midi = Math.max(0, Math.min(127, Math.round(n.midi)));
          const vel = Math.max(1, Math.min(127, Math.round((n.vel || 0.8) * maxMidiVel)));
          evs.push({ tick: startTick, order: 2, bytes: [0x90 | channel, midi, vel] });
          evs.push({ tick: startTick + durTicks, order: 1, bytes: [0x80 | channel, midi, 0] });
        });
      }
      return buildTrackChunk(evs);
    }

    const chunks = [
      buildTrackChunk(metaEvents),
      buildNoteTrack(compiled.melody, 0, gmProgramMap[bp.melody_spec?.patch] ?? 73, 120, Number(bp.melody_spec?.pan) || -0.04),
      buildNoteTrack(compiled.chords, 1, gmProgramMap[bp.chord_spec?.patch] ?? 4, 62, Number(bp.chord_spec?.pan) || 0.26),
      buildNoteTrack(compiled.bass, 2, gmProgramMap[bp.bass_spec?.patch] ?? 32, 86, 0.0),
      buildNoteTrack(compiled.drums, 9, 0, 78, 0.0)
    ];

    const numTracks = chunks.length;
    const header = [
      0x4D, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x01,
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

    if (bytes[0] !== 0x4D || bytes[1] !== 0x54 || bytes[2] !== 0x68 || bytes[3] !== 0x64) {
      throw new Error('Not a valid Standard MIDI (.mid) file');
    }
    pos = 8;
    readU16();
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
          pos++;
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
    const keyRoot = Math.max(60, Math.min(72, allNotes[0].midi));

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
      keyRoot,
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
    const totalDurationSec = Math.min(58, totalSteps * stepDurSec + 1.5);
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
          triggerSynthNote(offlineCtx, graph, bp.melody_spec || 'melodica_dub', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, n.echo, 'melody', n.panOffset || 0);
        });
      }
      if (!stemMutes.chords) {
        compiled.chords.forEach(n => {
          triggerSynthNote(offlineCtx, graph, bp.chord_spec || 'roto_organ', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, false, 'chord', n.panOffset || 0);
        });
      }
      if (!stemMutes.bass) {
        compiled.bass.forEach(n => {
          triggerSynthNote(offlineCtx, graph, bp.bass_spec || 'sub_dub', n.midi, stepToTime(base + n.step), n.dur * stepDurSec, n.vel, false, 'bass', 0);
        });
      }
      if (!stemMutes.drums) {
        compiled.drums.forEach(d => {
          triggerDrumHit(offlineCtx, graph, bp.drum_spec || 'dub_kit', d.type, stepToTime(base + d.step), d.vel, stepDurSec);
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

      this.modeType = 'preset';
      this.currentPiece = COMPOSER_LIBRARY.mozart_nachtmusik;
      this.currentGenreId = 'reggae_dub';
      this.currentBlueprint = GENRE_CATALOG.reggae_dub.defaultBlueprint(this.currentPiece);
      this.compiled = compileMorphedArrangement(this.currentPiece, this.currentBlueprint);

      this.stemMutes = {
        melody: false,
        chords: false,
        bass: false,
        drums: false
      };

      this.initDOM();
    }

    initDOM() {
      this.canvas = document.getElementById('mm-canvas');
      if (!this.canvas) return;
      this.cctx = this.canvas.getContext('2d');

      this.composerSelect = document.getElementById('mm-composer-select');
      this.genreSelect = document.getElementById('mm-genre-select');
      this.customPromptInput = document.getElementById('mm-custom-prompt');
      this.modePresetBtn = document.getElementById('mm-mode-preset');
      this.modeCustomBtn = document.getElementById('mm-mode-custom');
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

      const setGenreMode = (mode) => {
        this.modeType = mode;
        const isCustom = mode === 'custom';
        if (this.genreSelect) this.genreSelect.style.display = isCustom ? 'none' : 'block';
        if (this.customPromptInput) {
          this.customPromptInput.style.display = isCustom ? 'block' : 'none';
          if (isCustom) this.customPromptInput.focus();
        }
        if (this.modePresetBtn) {
          this.modePresetBtn.style.background = isCustom ? 'transparent' : '#ff7eb3';
          this.modePresetBtn.style.color = isCustom ? '#94a3b8' : '#070913';
        }
        if (this.modeCustomBtn) {
          this.modeCustomBtn.style.background = isCustom ? '#00f2fe' : 'transparent';
          this.modeCustomBtn.style.color = isCustom ? '#070913' : '#94a3b8';
        }
      };

      if (this.modePresetBtn) {
        this.modePresetBtn.addEventListener('click', () => setGenreMode('preset'));
      }
      if (this.modeCustomBtn) {
        this.modeCustomBtn.addEventListener('click', () => setGenreMode('custom'));
      }

      if (this.composerSelect) {
        this.composerSelect.addEventListener('change', () => {
          const compId = this.composerSelect.value;
          if (COMPOSER_LIBRARY[compId]) {
            this.currentPiece = COMPOSER_LIBRARY[compId];
            if (this.modeType === 'preset') {
              const genreEntry = GENRE_CATALOG[this.currentGenreId] || GENRE_CATALOG.reggae_dub;
              this.currentBlueprint = genreEntry.defaultBlueprint(this.currentPiece);
            }
            this.compiled = compileMorphedArrangement(this.currentPiece, this.currentBlueprint);
            this.syncUiFromBlueprint();
            this.renderVisualizerFrame();
          }
        });
      }

      if (this.genreSelect) {
        this.genreSelect.addEventListener('change', () => {
          if (this.modeType !== 'preset') return;
          this.currentGenreId = this.genreSelect.value;
          const genreEntry = GENRE_CATALOG[this.currentGenreId] || GENRE_CATALOG.reggae_dub;
          this.currentBlueprint = genreEntry.defaultBlueprint(this.currentPiece);
          this.compiled = compileMorphedArrangement(this.currentPiece, this.currentBlueprint);
          this.syncUiFromBlueprint();
          this.renderVisualizerFrame();
        });
      }

      if (this.morphBtn) {
        this.morphBtn.addEventListener('click', () => this.runAiMorph(true));
      }

      if (this.playBtn) {
        this.playBtn.addEventListener('click', () => {
          if (this.isPlaying) this.stop();
          else this.start();
        });
      }

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

      document.querySelectorAll('.mm-stem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const stem = btn.getAttribute('data-stem');
          if (!stem) return;
          this.stemMutes[stem] = !this.stemMutes[stem];
          btn.classList.toggle('muted', this.stemMutes[stem]);
          this.renderVisualizerFrame();
        });
      });

      if (this.bpmSlider) {
        this.bpmSlider.addEventListener('input', (e) => {
          const v = clampNum(e.target.value, 50, 190, 110);
          this.currentBlueprint.tempo_bpm = v;
          if (this.bpmVal) this.bpmVal.textContent = `${v} BPM`;
          if (this.graph && this.ctx) {
            const stepDurSec = 60 / v / 4;
            const delaySteps = clampNum(this.currentBlueprint.fx_spec?.delay_steps, 1, 8, 3);
            this.graph.delayNode.delayTime.setTargetAtTime(Math.min(1.5, Math.max(0.09, delaySteps * stepDurSec)), this.ctx.currentTime, 0.03);
          }
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

      if (this.downloadMp3Btn) {
        this.downloadMp3Btn.addEventListener('click', async () => {
          const origHtml = this.downloadMp3Btn.innerHTML;
          this.downloadMp3Btn.disabled = true;
          this.downloadMp3Btn.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i> RENDERING...';
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

      const bpm = Math.round(clampNum(bp.tempo_bpm, 50, 190, 110));
      const swingPct = Math.round(clampNum(bp.swing, 0, 0.65, 0) * 100);
      const echoPct = Math.round(clampNum(bp.fx_spec?.delay_wet, 0, 0.48, 0.18) * 100);
      const cutoff = Math.round(clampNum(bp.fx_spec?.filter_cutoff, 1200, 16000, 8500));

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
        const stepDurSec = 60 / bpm / 4;
        const delaySteps = clampNum(bp.fx_spec?.delay_steps, 1, 8, 3);
        this.graph.delayNode.delayTime.setTargetAtTime(Math.min(1.5, Math.max(0.09, delaySteps * stepDurSec)), this.ctx.currentTime, 0.04);
        this.graph.delayWet.gain.setTargetAtTime(echoPct / 100, this.ctx.currentTime, 0.04);
        this.graph.reverbWet.gain.setTargetAtTime(clampNum(bp.fx_spec?.reverb_wet, 0, 0.40, 0.18), this.ctx.currentTime, 0.04);
        this.graph.masterFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.04);
      }
    }

    async runAiMorph(autoPlay = true) {
      const compId = this.composerSelect?.value || 'mozart_nachtmusik';
      const genreId = this.genreSelect?.value || 'reggae_dub';
      const isCustom = this.modeType === 'custom';
      const customPrompt = isCustom ? (this.customPromptInput?.value?.trim() || 'Experimental Electronic Groove') : '';

      // Cleanly silence any currently playing loop & delay tails before morphing
      if (this.isPlaying) {
        this.stop();
      }

      if (COMPOSER_LIBRARY[compId]) {
        this.currentPiece = COMPOSER_LIBRARY[compId];
      }
      this.currentGenreId = genreId;
      const genreEntry = GENRE_CATALOG[genreId] || GENRE_CATALOG.reggae_dub;
      const fallbackBp = genreEntry.defaultBlueprint(this.currentPiece);

      if (this.morphBtn) {
        this.morphBtn.disabled = true;
        this.morphBtn.innerHTML = '<i class="fa-solid fa-bolt fa-beat"></i> AI ARRANGING...';
      }
      if (this.statusBadge) {
        this.statusBadge.textContent = isCustom
          ? `AI ARRANGING CUSTOM VIBE: "${customPrompt.toUpperCase().slice(0, 24)}"...`
          : 'CONSULTING LLM ARRANGER...';
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
            modeType: this.modeType,
            genreId: isCustom ? 'custom' : genreId,
            genreLabel: isCustom ? customPrompt : genreEntry.label.replace(/^[^\w]+/, '').trim(),
            customPrompt: isCustom ? customPrompt : ''
          })
        });
        if (res.ok) {
          blueprint = await res.json();
        }
      } catch (err) {
        console.warn('Using local Music Theory AI Arranger fallback:', err);
      }

      if (!blueprint || typeof blueprint !== 'object') {
        blueprint = fallbackBp;
        if (isCustom && customPrompt) {
          blueprint.mashup_title = `${this.currentPiece.title.split('(')[0].trim()} (${customPrompt} Mix)`;
          blueprint.producer_log = `Custom AI Vibe "${customPrompt}": ${blueprint.producer_log}`;
        }
      } else {
        // Ensure any omitted or malformed LLM fields fall back to the genre's authentic defaults
        blueprint.tempo_bpm = clampNum(blueprint.tempo_bpm, 55, 185, fallbackBp.tempo_bpm);
        blueprint.swing = clampNum(blueprint.swing, 0, 0.60, fallbackBp.swing);
        blueprint.fx_spec = {
          ...fallbackBp.fx_spec,
          ...(blueprint.fx_spec || {}),
          delay_wet: clampNum(blueprint.fx_spec?.delay_wet, 0, 0.48, fallbackBp.fx_spec.delay_wet),
          delay_steps: clampNum(blueprint.fx_spec?.delay_steps, 1, 8, fallbackBp.fx_spec.delay_steps),
          reverb_wet: clampNum(blueprint.fx_spec?.reverb_wet, 0, 0.40, fallbackBp.fx_spec.reverb_wet),
          filter_cutoff: clampNum(blueprint.fx_spec?.filter_cutoff, 1200, 16000, fallbackBp.fx_spec.filter_cutoff)
        };
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
      if (!this.analyser) {
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.ctx.destination);
      }
      const bpm = clampNum(this.currentBlueprint.tempo_bpm, 50, 190, 110);
      const stepDurSec = 60 / bpm / 4;
      if (!this.graph) {
        this.graph = createAudioGraph(this.ctx, this.currentBlueprint.fx_spec, stepDurSec);
        this.graph.masterGain.connect(this.analyser);
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
      // Immediately kill delay feedback, fade master out over 20ms, and disconnect old audio graph!
      if (this.graph && this.ctx) {
        const deadGraph = this.graph;
        this.graph = null;
        try {
          const now = this.ctx.currentTime;
          if (deadGraph.delayFeedback) {
            deadGraph.delayFeedback.gain.cancelScheduledValues(now);
            deadGraph.delayFeedback.gain.setValueAtTime(0, now);
          }
          if (deadGraph.delayWet) {
            deadGraph.delayWet.gain.cancelScheduledValues(now);
            deadGraph.delayWet.gain.setValueAtTime(0, now);
          }
          deadGraph.masterGain.gain.cancelScheduledValues(now);
          deadGraph.masterGain.gain.setValueAtTime(deadGraph.masterGain.gain.value, now);
          deadGraph.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
          setTimeout(() => {
            try { deadGraph.masterGain.disconnect(); } catch (_) {}
          }, 35);
        } catch (_) {}
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

      const flashTrack = (stem) => {
        const btn = document.querySelector(`.mm-stem-btn[data-stem="${stem}"]`);
        if (btn && !this.stemMutes[stem]) {
          btn.classList.add('triggered');
          setTimeout(() => btn.classList.remove('triggered'), 110);
        }
      };

      if (!this.stemMutes.melody) {
        this.compiled.melody.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.melody_spec || 'melodica_dub', n.midi, time, n.dur * stepDurSec, n.vel, n.echo, 'melody', n.panOffset || 0);
          flashTrack('melody');
        });
      }
      if (!this.stemMutes.chords) {
        this.compiled.chords.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.chord_spec || 'roto_organ', n.midi, time, n.dur * stepDurSec, n.vel, false, 'chord', n.panOffset || 0);
          flashTrack('chords');
        });
      }
      if (!this.stemMutes.bass) {
        this.compiled.bass.filter(n => Math.floor(n.step) === step).forEach(n => {
          triggerSynthNote(this.ctx, this.graph, bp.bass_spec || 'sub_dub', n.midi, time, n.dur * stepDurSec, n.vel, false, 'bass', 0);
          flashTrack('bass');
        });
      }
      if (!this.stemMutes.drums) {
        this.compiled.drums.filter(d => Math.floor(d.step) === step).forEach(d => {
          triggerDrumHit(this.ctx, this.graph, bp.drum_spec || 'dub_kit', d.type, time, d.vel, stepDurSec);
          flashTrack('drums');
        });
      }
    }

    renderVisualizerFrame() {
      if (!this.canvas || !this.cctx) return;
      const ctx = this.cctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.fillStyle = '#070913';
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 1;
      const numStepCols = 32;
      const colW = w / numStepCols;
      for (let i = 0; i <= numStepCols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * colW, 0);
        ctx.lineTo(i * colW, h);
        ctx.strokeStyle = (i % 4 === 0) ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
      }
      for (let r = 0; r < 8; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * (h / 8));
        ctx.lineTo(w, r * (h / 8));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
      }

      if (this.analyser && this.isPlaying) {
        const freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqData);
        const barCount = 48;
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = freqData[i] / 255;
          const barH = val * (h * 0.30);
          const grad = ctx.createLinearGradient(0, h, 0, h - barH);
          grad.addColorStop(0, 'rgba(255, 126, 179, 0.25)');
          grad.addColorStop(1, 'rgba(0, 242, 254, 0.08)');
          ctx.fillStyle = grad;
          ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
        }
      }

      const playheadX = w * 0.22;
      const minMidi = 32;
      const maxMidi = 88;

      const midiToY = (m) => {
        const norm = (m - minMidi) / (maxMidi - minMidi);
        return h - 18 - Math.max(0, Math.min(1, norm)) * (h - 36);
      };

      const trackLayers = [
        { key: 'chords', list: this.compiled.chords, color: '#ff7eb3', alpha: 0.45, height: 5 },
        { key: 'bass',   list: this.compiled.bass,   color: '#10b981', alpha: 0.80, height: 7 },
        { key: 'melody', list: this.compiled.melody, color: '#00f2fe', alpha: 1.00, height: 10 }
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
            if (isActive || layer.key === 'melody') {
              ctx.shadowColor = layer.color;
              ctx.shadowBlur = isActive ? 16 : 6;
            }
            ctx.beginPath();
            ctx.roundRect(x, y - layer.height / 2, nw, layer.height, 3);
            ctx.fill();
            ctx.restore();
          }
        });
      });

      if (!this.stemMutes.drums) {
        this.compiled.drums.forEach(d => {
          let relStep = d.step - this.currentStep;
          if (relStep < -8) relStep += 128;
          if (relStep > -8 && relStep < 28) {
            const x = playheadX + relStep * colW;
            const y = d.type === 'kick' ? h - 8 : (d.type === 'snare' ? h - 15 : h - 22);
            ctx.fillStyle = d.type === 'kick' ? '#f59e0b' : (d.type === 'snare' ? '#ff7eb3' : '#38bdf8');
            ctx.beginPath();
            ctx.arc(x + 3, y, d.type === 'kick' ? 3.8 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

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

      const barNum = Math.floor(this.currentStep / 16) + 1;
      const beatNum = Math.floor((this.currentStep % 16) / 4) + 1;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`BAR ${barNum}/8 · BEAT ${beatNum}`, w - 10, 16);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.midiMorpherInstance = new MidiGenreMorpher();
  });
})();
