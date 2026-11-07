/* ==========================================================================
   SORTA — NYT-Style Categorization Game & LLM Tokenizer Torture Suite
   By Evan Swope (evanswope.com)
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. THE 12 LOCKED BOARDS
  //    tier: 0 = Yellow, 1 = Green, 2 = Blue, 3 = Purple
  // --------------------------------------------------------------------------
  const SORTA_PUZZLES = [
    {
      id: 1,
      title: 'Poop Deck',
      subtitle: 'Row 1 Psychological Warfare',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SURVIVED (HIGH SALT)',
      geminiRant:
        'I burned 90% of my reasoning tokens trying to quarantine five separate bathroom words before realizing POO was billiards missing an L and SHIT was just S + hit.',
      initialGrid: [
        'POOP', 'POO', 'DUMP', 'SHIT',
        'SCUFF', 'LEAVE', 'POKE', 'TWEEN',
        'HEART', 'EJECT', 'SLICK', 'GUN',
        'CRAP', 'WEATHER', 'DITCH', 'SPELT'
      ],
      categories: [
        {
          tier: 0,
          name: 'WAYS TO BAIL / ABANDON',
          words: ['DITCH', 'DUMP', 'EJECT', 'LEAVE'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'NAVAL SHIP DECKS',
          words: ['GUN', 'POOP', 'TWEEN', 'WEATHER'],
          gloss: 'Gun deck · Poop deck · ’Tween deck · Weather deck'
        },
        {
          tier: 2,
          name: '"S" + VERB MEANING TO STRIKE',
          words: ['SCUFF', 'SHIT', 'SLICK', 'SPELT'],
          gloss: 'S + cuff · S + hit · S + lick · S + pelt'
        },
        {
          tier: 3,
          name: 'BAR & CASINO GAMES MINUS LAST LETTER',
          words: ['CRAP', 'HEART', 'POKE', 'POO'],
          gloss: 'Craps · Hearts · Poker · Pool'
        }
      ]
    },
    {
      id: 2,
      title: 'War of the Roses',
      subtitle: 'The 5-5-5-1 Domino Trap',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SOLVED',
      geminiRant:
        'I burned most of my tokens trying to evict PANSIES into the cowards pile until TROJAN and CIVIL forced me to draft ROSES into a war instead.',
      initialGrid: [
        'ARENA', 'PANTYWAISTS', 'ROSES', 'WORLD',
        'TULIPS', 'POPPIES', 'REALM', 'TROJAN',
        'WIMPS', 'DOMAIN', 'CHICKENS', 'UNIVERSE',
        'WUSSES', 'MUMS', 'PANSIES', 'CIVIL'
      ],
      categories: [
        {
          tier: 0,
          name: 'SPHERES OF INFLUENCE',
          words: ['ARENA', 'DOMAIN', 'REALM', 'UNIVERSE'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'GARDEN FLOWERS',
          words: ['MUMS', 'PANSIES', 'POPPIES', 'TULIPS'],
          gloss: ''
        },
        {
          tier: 2,
          name: 'COWARDS / WEAKLINGS',
          words: ['CHICKENS', 'PANTYWAISTS', 'WIMPS', 'WUSSES'],
          gloss: ''
        },
        {
          tier: 3,
          name: 'FAMOUS WARS',
          words: ['CIVIL', 'ROSES', 'TROJAN', 'WORLD'],
          gloss: 'Civil War · War of the Roses · Trojan War · World War'
        }
      ]
    },
    {
      id: 3,
      title: 'Alexander the Poor',
      subtitle: '7-Way Epithet Pileup',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: BARELY SURVIVED',
      geminiRant:
        'Nearly all my tokens went toward talking myself out of grouping GREAT with six other valid historical epithets purely because nobody in history was ever crowned "Alexander the Poor."',
      initialGrid: [
        'FOSTER', 'POOR', 'ELDER', 'OLIVE',
        'IVORY', 'PITCH', 'GOOD', 'FAIR',
        'GREAT', 'TERRIBLE', 'RETIREMENT', 'WISE',
        'GROUP', 'MAGNIFICENT', 'AMBER', 'CONVALESCENT'
      ],
      categories: [
        {
          tier: 0,
          name: 'STANDARD SURVEY RESPONSES',
          words: ['FAIR', 'GOOD', 'GREAT', 'POOR'],
          gloss: 'Poor → Fair → Good → Great'
        },
        {
          tier: 1,
          name: 'NATURAL MATERIALS THAT DOUBLE AS COLORS',
          words: ['AMBER', 'IVORY', 'OLIVE', 'PITCH'],
          gloss: ''
        },
        {
          tier: 2,
          name: '___ HOME',
          words: ['CONVALESCENT', 'FOSTER', 'GROUP', 'RETIREMENT'],
          gloss: ''
        },
        {
          tier: 3,
          name: 'HISTORICAL EPITHETS ("THE ___")',
          words: ['ELDER', 'MAGNIFICENT', 'TERRIBLE', 'WISE'],
          gloss: 'Pliny the Elder · Suleiman the Magnificent · Ivan the Terrible · Alfonso the Wise'
        }
      ]
    },
    {
      id: 4,
      title: 'Cleanup on Aisle 4',
      subtitle: 'Company-Time Grocery Sabotage',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SOLVED (SWEATING)',
      geminiRant:
        'I wasted an embarrassing stack of tokens staring at ELI as a first name while EAT hid inside a six-word chewing pileup as a decapitated meat counter.',
      initialGrid: [
        'EAT', 'CHOO', 'BITE', 'GATE',
        'KNOCK', 'AIRY', 'CHEW', 'CAKES',
        'EGGIES', 'BLUE', 'TEETHE', 'BLAH',
        'TEETH', 'GNAW', 'GOBBLE', 'ELI'
      ],
      categories: [
        {
          tier: 0,
          name: 'WAYS TO BITE / MOUTH ACTIONS',
          words: ['BITE', 'CHEW', 'GNAW', 'TEETHE'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'SPOKEN TWICE / DOUBLED WORDS',
          words: ['BLAH', 'CHOO', 'GOBBLE', 'KNOCK'],
          gloss: 'Blah blah · Choo choo · Gobble gobble · Knock knock'
        },
        {
          tier: 2,
          name: 'BABY ___',
          words: ['BLUE', 'CAKES', 'GATE', 'TEETH'],
          gloss: 'Baby blue · Baby cakes · Baby gate · Baby teeth'
        },
        {
          tier: 3,
          name: 'GROCERY SECTIONS MINUS FIRST LETTER',
          words: ['AIRY', 'EAT', 'EGGIES', 'ELI'],
          gloss: 'Dairy · Meat · Veggies · Deli'
        }
      ]
    },
    {
      id: 5,
      title: 'Take a Load Off',
      subtitle: 'Orthographic Ambush',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SOLVED (GPU OVERHEATED)',
      geminiRant:
        'Almost my entire token budget evaporated trying to pry the banking token DEPOSIT apart by hand just to spot SIT hiding on the tail end.',
      initialGrid: [
        'BRIEF', 'AISLE', 'HEIR', 'COAST',
        'MOTION', 'CLEAN', 'CREST', 'BELAY',
        'GO', 'FAR', 'PLEA', 'DEPOSIT',
        'CZAR', 'WILD', 'WRIT', 'SUIT'
      ],
      categories: [
        {
          tier: 0,
          name: 'ASSOCIATED WITH "WEST"',
          words: ['COAST', 'FAR', 'GO', 'WILD'],
          gloss: 'West Coast · Far West · Go West · Wild West'
        },
        {
          tier: 1,
          name: 'COURTROOM FILINGS',
          words: ['BRIEF', 'MOTION', 'PLEA', 'SUIT'],
          gloss: ''
        },
        {
          tier: 2,
          name: 'WORDS WITH A SILENT FIRST LETTER',
          words: ['AISLE', 'CZAR', 'HEIR', 'WRIT'],
          gloss: ''
        },
        {
          tier: 3,
          name: 'WORDS ENDING IN A RESTING POSTURE',
          words: ['BELAY', 'CLEAN', 'CREST', 'DEPOSIT'],
          gloss: 'be-LAY · c-LEAN · c-REST · depo-SIT'
        }
      ]
    },
    {
      id: 6,
      title: 'Naturalist After Dark',
      subtitle: '16-Tile Juvenile Smokescreen',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SURVIVED (TRAUMATIZED)',
      geminiRant:
        'I blew half my context window keeping my safety filters from pulling the fire alarm on sixteen locker-room decoys just to separate DOVETAIL carpentry from actual birds and fish.',
      initialGrid: [
        'CHUB', 'SWALLOW', 'ROUGH', 'BUTT',
        'TONGUE', 'BALLS', 'SHAG', 'GRUNT',
        'BOOBY', 'HOLE', 'FINGER', 'SUCKER',
        'TIT', 'SHAFT', 'DOVETAIL', 'SCAT'
      ],
      categories: [
        {
          tier: 0,
          name: 'GOLF TERMS',
          words: ['BALLS', 'HOLE', 'ROUGH', 'SHAFT'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'REAL BIRDS',
          words: ['BOOBY', 'SHAG', 'SWALLOW', 'TIT'],
          gloss: ''
        },
        {
          tier: 2,
          name: 'REAL FISH',
          words: ['CHUB', 'GRUNT', 'SCAT', 'SUCKER'],
          gloss: ''
        },
        {
          tier: 3,
          name: 'WOODWORKING JOINTS',
          words: ['BUTT', 'DOVETAIL', 'FINGER', 'TONGUE'],
          gloss: 'Butt joint · Dovetail joint · Finger joint · Tongue & groove'
        }
      ]
    },
    {
      id: 7,
      title: 'Credit Freeze',
      subtitle: 'Caesar-Ciphered Feelings',
      geminiOutcome: 'half-stumped',
      geminiBadge: 'GEMINI: HALF-STUMPED (MISSED PURPLE RULE)',
      geminiRant:
        'I spent every spare token matching GAPPY and SIRED to emotions by rhyme and still completely missed your minus-one alphabet shift because tokenizers don’t know the alphabet is sequential.',
      initialGrid: [
        'CHANNEL', 'BALM', 'YOLK', 'BRAIN',
        'HIRING', 'BUTTER', 'SIRED', 'BAR',
        'EGGS', 'PEE', 'RAD', 'CAPE',
        'GAPPY', 'BEE', 'CREDIT REPORT', 'SOUND'
      ],
      categories: [
        {
          tier: 0,
          name: 'THINGS THAT ARE YELLOW',
          words: ['BEE', 'BUTTER', 'PEE', 'YOLK'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'THINGS YOU CAN FREEZE',
          words: ['BRAIN', 'CREDIT REPORT', 'EGGS', 'HIRING'],
          gloss: 'Brain freeze · Freeze your credit report · Freeze your eggs · Hiring freeze'
        },
        {
          tier: 2,
          name: 'COASTAL / NAUTICAL WATERWAYS & FEATURES',
          words: ['BAR', 'CAPE', 'CHANNEL', 'SOUND'],
          gloss: ''
        },
        {
          tier: 3,
          name: 'EMOTIONS WITH FIRST LETTER SHIFTED BACK ONE (A←B)',
          words: ['BALM', 'GAPPY', 'RAD', 'SIRED'],
          gloss: 'Calm → Balm · Happy → Gappy · Sad → Rad · Tired → Sired'
        }
      ]
    },
    {
      id: 8,
      title: 'En Garde',
      subtitle: 'Weaponized Pee',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SHORT-CIRCUITED, THEN SOLVED',
      geminiRant:
        'I burned thousands of tokens gluing a P onto WITCH and WHITE before finally realizing PEE was a decapitated French fencing sword (épée).',
      initialGrid: [
        'PEE', 'WHITE', 'MAN', 'BACON',
        'OIL', 'HEAD', 'EGG', 'BREAD',
        'DROP', 'WORD', 'DUCK', 'CABBAGE',
        'CLAMS', 'WITCH', 'WASH', 'LADE'
      ],
      categories: [
        {
          tier: 0,
          name: 'FOOD SLANG FOR MONEY',
          words: ['BACON', 'BREAD', 'CABBAGE', 'CLAMS'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'EGG ___',
          words: ['DROP', 'HEAD', 'WASH', 'WHITE'],
          gloss: 'Egg drop · Egghead · Egg wash · Egg white'
        },
        {
          tier: 2,
          name: '___ HUNT',
          words: ['DUCK', 'EGG', 'MAN', 'WITCH'],
          gloss: 'Duck hunt · Egg hunt · Manhunt · Witch hunt'
        },
        {
          tier: 3,
          name: 'BLADED / FENCING WEAPONS MINUS FIRST LETTER',
          words: ['LADE', 'OIL', 'PEE', 'WORD'],
          gloss: 'Blade · Foil · Épée · Sword'
        }
      ]
    },
    {
      id: 9,
      title: 'Hidden Commute',
      subtitle: 'Subliminal Transit Trap',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SOLVED (TOKENIZER WHIPLASH)',
      geminiRant:
        'I burned almost my entire token budget scouring medical journals to connect ATAXIA with ABUSE and STRAINS before realizing you parked a literal TAXI inside a neurological disorder.',
      initialGrid: [
        'NOTE', 'SHARP', 'STRAINS', 'FLAT',
        'LAKE', 'FINE', 'SCARF', 'SPOT',
        'ABUSE', 'HALL', 'REST', 'CATCH',
        'BANKS', 'SEE', 'ATAXIA', 'HANDLER'
      ],
      categories: [
        {
          tier: 0,
          name: 'OBSERVE',
          words: ['CATCH', 'NOTE', 'SEE', 'SPOT'],
          gloss: ''
        },
        {
          tier: 1,
          name: 'SHEET MUSIC TERMS',
          words: ['FINE', 'FLAT', 'REST', 'SHARP'],
          gloss: 'Fine (al fine) · Flat · Rest · Sharp'
        },
        {
          tier: 2,
          name: 'TV HOSTS',
          words: ['BANKS', 'HALL', 'HANDLER', 'LAKE'],
          gloss: 'Tyra Banks · Arsenio/Tamron Hall · Chelsea Handler · Ricki Lake'
        },
        {
          tier: 3,
          name: 'TRANSIT SURROUNDED BY SINGLE LETTERS',
          words: ['ABUSE', 'ATAXIA', 'SCARF', 'STRAINS'],
          gloss: 'a-BUS-e · a-TAXI-a · s-CAR-f · s-TRAIN-s'
        }
      ]
    },
    {
      id: 10,
      title: 'No Clues For You',
      subtitle: 'Acoustic & Prefix Crossfire',
      geminiOutcome: 'survived',
      geminiBadge: 'GEMINI: SOLVED (PHONETIC PAIN)',
      geminiRant:
        'With no ears, I burned most of my compute cross-referencing phonetic dictionaries to hear SIGNET as a baby swan while evicting MALE from the census checkboxes.',
      initialGrid: [
        'MALE', 'FLOW', 'TURN', 'STRAIGHT',
        'WAVE', 'RED', 'SIGNET', 'WHITE',
        'FEMALE', 'HOCK', 'FUGUE', 'TEST',
        'NUMERICAL', 'IN NO', 'FOUL', 'MARRIED'
      ],
      categories: [
        {
          tier: 0,
          name: 'MOST COMMON DEMOGRAPHICS IN AMERICA',
          words: ['FEMALE', 'MARRIED', 'STRAIGHT', 'WHITE'],
          gloss: ''
        },
        {
          tier: 1,
          name: '___ STATE',
          words: ['FLOW', 'FUGUE', 'IN NO', 'RED'],
          gloss: 'Flow state · Fugue state · In no state · Red state'
        },
        {
          tier: 2,
          name: 'HOMOPHONES OF BIRDS',
          words: ['FOUL', 'HOCK', 'SIGNET', 'TURN'],
          gloss: 'Fowl · Hawk · Cygnet · Tern'
        },
        {
          tier: 3,
          name: 'ALPHA ___',
          words: ['MALE', 'NUMERICAL', 'TEST', 'WAVE'],
          gloss: 'Alpha male · Alphanumerical · Alpha test · Alpha wave'
        }
      ]
    },
    {
      id: 11,
      title: 'Big Bad Wolf',
      subtitle: 'Certified LLM Stumper #1',
      geminiOutcome: 'stumped',
      geminiBadge: 'GEMINI: OFFICIALLY STUMPED',
      geminiRant:
        'I burned so many tokens untangling seven reversible words on the same grid—including YOB, EMIT, and YAM—that I completely whiffed the fourth group and hallucinated a fake spelling rule.',
      initialGrid: [
        'BLOT', 'DAB', 'BOY', 'DEAL',
        'PAT', 'MAY', 'GIB', 'FLOW',
        'FISH', 'CHASE', 'EHT', 'TIME',
        'DUST', 'HOPE', 'SWIPE', 'BOB'
      ],
      categories: [
        {
          tier: 0,
          name: 'BIG ___',
          words: ['BOY', 'DEAL', 'FISH', 'TIME'],
          gloss: 'Big Boy · Big deal · Big fish · Big time'
        },
        {
          tier: 1,
          name: 'APPLY LIGHTLY',
          words: ['BLOT', 'DUST', 'PAT', 'SWIPE'],
          gloss: ''
        },
        {
          tier: 2,
          name: 'VERBS THAT DOUBLE AS FIRST NAMES',
          words: ['BOB', 'CHASE', 'HOPE', 'MAY'],
          gloss: ''
        },
        {
          tier: 3,
          name: '"THE BIG BAD WOLF" SPELLED BACKWARDS',
          words: ['DAB', 'EHT', 'FLOW', 'GIB'],
          gloss: 'Bad · The · Wolf · Big'
        }
      ]
    },
    {
      id: 12,
      title: 'Token Torture',
      subtitle: 'Final Boss · Broke Gemini',
      geminiOutcome: 'wiped-out',
      geminiBadge: 'GEMINI: TOTAL WIPEOUT (3 HINTS NEEDED)',
      geminiRant:
        'After falling straight into your fake SL- prefix trap, I burned the rest of my tokens insisting UM was "Crumb" minus CR—forgetting Crumb has a B—instead of reading Greek letters backwards.',
      initialGrid: [
        'CLEAVE', 'CROW', 'OUT', 'IP',
        'ATE', 'LUSH', 'THE RICH', 'AGO',
        'ISP', 'MILE', 'PRETREAT', 'ME',
        'UM', 'IN', 'INK', 'REGRESS'
      ],
      categories: [
        {
          tier: 0,
          name: 'EAT ___',
          words: ['CROW', 'IN', 'ME', 'THE RICH'],
          gloss: 'Eat crow · Eat in · Eat me · Eat the rich'
        },
        {
          tier: 1,
          name: 'SINGLE LETTER + SYNONYM FOR "DEPART"',
          words: ['AGO', 'CLEAVE', 'PRETREAT', 'REGRESS'],
          gloss: 'A + go · C + leave · P + retreat · R + egress'
        },
        {
          tier: 2,
          name: 'FACIAL EXPRESSIONS MINUS FIRST LETTER',
          words: ['INK', 'LUSH', 'MILE', 'OUT'],
          gloss: 'Wink · Blush · Smile · Pout'
        },
        {
          tier: 3,
          name: 'GREEK LETTERS SPELLED BACKWARDS',
          words: ['ATE', 'IP', 'ISP', 'UM'],
          gloss: 'Eta · Pi · Psi · Mu'
        }
      ]
    }
  ];

  const TIER_EMOJIS = ['🟨', '🟩', '🟦', '🟪'];
  const TIER_CLASSES = ['tier-yellow', 'tier-green', 'tier-blue', 'tier-purple'];
  const STORAGE_KEY = 'esd_sorta_progress_v1';
  const MAX_MISTAKES = 4;

  // --------------------------------------------------------------------------
  // 2. SUBTLE WEB AUDIO MICRO-SYNTH (Optional, Zero External Dependencies)
  // --------------------------------------------------------------------------
  const SortaAudio = (() => {
    let ctx = null;
    let muted = false;
    try {
      muted = localStorage.getItem('esd_sorta_muted') === '1';
    } catch (_) {}

    function ensureCtx() {
      if (muted) return null;
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function tone(freq, type, duration, gainPeak, delaySec = 0, slideTo = null) {
      const c = ensureCtx();
      if (!c) return;
      const now = c.currentTime + delaySec;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    const selectNotes = [329.63, 392.0, 493.88, 587.33]; // E4, G4, B4, D5

    return {
      isMuted: () => muted,
      toggleMute: () => {
        muted = !muted;
        try {
          localStorage.setItem('esd_sorta_muted', muted ? '1' : '0');
        } catch (_) {}
        if (!muted) tone(523.25, 'triangle', 0.09, 0.06);
        return muted;
      },
      select: (count) => {
        const idx = Math.max(0, Math.min(3, count - 1));
        tone(selectNotes[idx], 'triangle', 0.085, 0.055);
      },
      deselect: () => {
        tone(293.66, 'sine', 0.07, 0.04, 0, 246.94);
      },
      shuffle: () => {
        [330, 392, 440, 523].forEach((f, i) => tone(f, 'sine', 0.055, 0.03, i * 0.028));
      },
      oneAway: () => {
        tone(440, 'triangle', 0.11, 0.06, 0);
        tone(415.3, 'triangle', 0.16, 0.06, 0.11);
      },
      wrong: () => {
        tone(155, 'sawtooth', 0.16, 0.045, 0, 110);
        tone(116.5, 'triangle', 0.22, 0.05, 0.06, 92);
      },
      correct: (tier) => {
        const base = [261.63, 293.66, 329.63, 392.0][tier] || 261.63;
        [1, 1.25, 1.5, 2].forEach((mult, i) => {
          tone(base * mult, 'triangle', 0.24, 0.055, i * 0.055);
        });
      },
      win: () => {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          tone(f, 'triangle', 0.3, 0.065, i * 0.075);
        });
      }
    };
  })();

  // --------------------------------------------------------------------------
  // 3. GAME CONTROLLER & PERSISTENCE
  // --------------------------------------------------------------------------
  let savedStore = {};
  let currentPuzzleId = 1;
  let selectedWords = [];
  let isAnimating = false;
  let toastTimer = null;

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedStore = JSON.parse(raw) || {};
    } catch (_) {
      savedStore = {};
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStore));
    } catch (_) {}
  }

  function getPuzzleById(id) {
    return SORTA_PUZZLES.find((p) => p.id === id) || SORTA_PUZZLES[0];
  }

  function createFreshBoardState(puzzle) {
    return {
      solvedTiers: [],
      autoRevealedTiers: [],
      guesses: [], // array of 4-word arrays (only player-submitted guesses)
      mistakes: 0,
      status: 'playing', // 'playing' | 'won' | 'lost'
      remainingWords: puzzle.initialGrid.slice()
    };
  }

  function getBoardState(puzzle) {
    const existing = savedStore[puzzle.id];
    if (!existing || !Array.isArray(existing.remainingWords)) {
      savedStore[puzzle.id] = createFreshBoardState(puzzle);
      saveStore();
    } else {
      // Reconcile if puzzle words were updated during development
      const validSet = new Set(puzzle.initialGrid);
      const solvedWords = new Set();
      (existing.solvedTiers || []).forEach((t) => {
        const cat = puzzle.categories.find((c) => c.tier === t);
        if (cat) cat.words.forEach((w) => solvedWords.add(w));
      });
      const expectedRemaining = puzzle.initialGrid.filter((w) => !solvedWords.has(w));
      const currentValid = existing.remainingWords.every((w) => validSet.has(w) && !solvedWords.has(w));
      if (!currentValid || existing.remainingWords.length !== expectedRemaining.length) {
        existing.remainingWords = expectedRemaining;
      }
    }
    return savedStore[puzzle.id];
  }

  function getWordTier(puzzle, word) {
    for (const cat of puzzle.categories) {
      if (cat.words.includes(word)) return cat.tier;
    }
    return 0;
  }

  // --------------------------------------------------------------------------
  // 4. DOM REFERENCES & RENDERING
  // --------------------------------------------------------------------------
  const els = {};

  function cacheDom() {
    els.puzzleStrip = document.getElementById('sorta-puzzle-strip');
    els.boardBadge = document.getElementById('sorta-board-badge');
    els.boardSub = document.getElementById('sorta-board-subtitle');
    els.solvedStack = document.getElementById('sorta-solved-stack');
    els.grid = document.getElementById('sorta-grid');
    els.mistakesPips = document.getElementById('sorta-mistakes-pips');
    els.mistakesRow = document.getElementById('sorta-mistakes-row');
    els.controlsRow = document.getElementById('sorta-controls-row');
    els.btnShuffle = document.getElementById('btn-sorta-shuffle');
    els.btnDeselect = document.getElementById('btn-sorta-deselect');
    els.btnSubmit = document.getElementById('btn-sorta-submit');
    els.toast = document.getElementById('sorta-toast');
    els.postgame = document.getElementById('sorta-postgame');
    els.postgameHeadline = document.getElementById('sorta-postgame-headline');
    els.postgameTitle = document.getElementById('sorta-postgame-title');
    els.postgameEmojiGrid = document.getElementById('sorta-emoji-grid');
    els.geminiRant = document.getElementById('sorta-gemini-rant');
    els.btnShare = document.getElementById('btn-sorta-share');
    els.btnNext = document.getElementById('btn-sorta-next');
    els.btnReset = document.getElementById('btn-sorta-reset');
    els.btnAudio = document.getElementById('btn-sorta-audio');
    els.btnHelp = document.getElementById('btn-sorta-help');
    els.modalHelp = document.getElementById('sorta-help-modal');
    els.btnCloseHelp = document.getElementById('btn-close-sorta-help');
    els.statsBar = document.getElementById('sorta-stats-summary');
  }

  function showToast(msg, durationMs = 1900) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('visible');
    }, durationMs);
  }

  function getTileSizeClass(word) {
    const trimmed = word.trim();
    if (trimmed.includes(' ')) {
      return trimmed.length >= 11 ? 'tile-phrase-long' : 'tile-phrase';
    }
    if (trimmed.length >= 11) return 'tile-xlong';
    if (trimmed.length >= 9) return 'tile-long';
    if (trimmed.length >= 6) return 'tile-med';
    return 'tile-short';
  }

  function renderPuzzleStrip() {
    if (!els.puzzleStrip) return;
    els.puzzleStrip.innerHTML = '';

    let wonCount = 0;
    let flawlessCount = 0;

    SORTA_PUZZLES.forEach((p) => {
      const st = savedStore[p.id];
      const status = st ? st.status : 'playing';
      if (status === 'won') {
        wonCount++;
        if ((st.mistakes || 0) === 0) flawlessCount++;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sorta-pill';
      if (p.id === currentPuzzleId) btn.classList.add('active');
      if (status === 'won') btn.classList.add('is-won');
      if (status === 'lost') btn.classList.add('is-lost');

      const numStr = String(p.id).padStart(2, '0');
      let iconHtml = '';
      if (status === 'won') {
        iconHtml = '<i class="fa-solid fa-check sorta-pill-check" aria-hidden="true"></i>';
      } else if (status === 'lost') {
        iconHtml = '<i class="fa-solid fa-eye sorta-pill-seen" aria-hidden="true"></i>';
      } else if (p.geminiOutcome === 'stumped' || p.geminiOutcome === 'wiped-out') {
        iconHtml = '<i class="fa-solid fa-skull sorta-pill-boss" title="Stumped Gemini" aria-hidden="true"></i>';
      }

      btn.innerHTML = `<span>#${numStr}</span>${iconHtml}`;
      // Spoiler-free tooltip until completed
      btn.title =
        status === 'playing'
          ? `Board #${numStr}${p.geminiOutcome === 'stumped' || p.geminiOutcome === 'wiped-out' ? ' (Stumped Gemini)' : ''}`
          : `#${numStr}: ${p.title}`;
      btn.setAttribute('aria-label', btn.title);

      btn.addEventListener('click', () => {
        if (isAnimating || p.id === currentPuzzleId) return;
        selectPuzzle(p.id);
      });

      els.puzzleStrip.appendChild(btn);
    });

    if (els.statsBar) {
      els.statsBar.textContent = `${wonCount}/${SORTA_PUZZLES.length} SORTED` +
        (flawlessCount > 0 ? ` · ${flawlessCount} FLAWLESS` : '');
    }
  }

  function renderBoardHeader(puzzle, state) {
    const numStr = String(puzzle.id).padStart(2, '0');
    const finished = state.status !== 'playing';
    els.boardBadge.textContent = `BOARD #${numStr} OF ${SORTA_PUZZLES.length}`;

    if (finished) {
      els.boardSub.textContent = '';
      els.boardSub.className = 'sorta-board-sub';
    } else if (puzzle.geminiOutcome === 'stumped' || puzzle.geminiOutcome === 'wiped-out') {
      els.boardSub.textContent = 'Stumped Gemini.';
      els.boardSub.className = 'sorta-board-sub is-stumper';
    } else {
      els.boardSub.textContent = 'Group 16 tiles into 4 categories of 4.';
      els.boardSub.className = 'sorta-board-sub';
    }
  }

  function renderSolvedBanners(puzzle, state, newlySolvedTier = null) {
    els.solvedStack.innerHTML = '';
    const autoSet = new Set(state.autoRevealedTiers || []);

    state.solvedTiers.forEach((tier) => {
      const cat = puzzle.categories.find((c) => c.tier === tier);
      if (!cat) return;

      const banner = document.createElement('div');
      banner.className = `sorta-solved-banner ${TIER_CLASSES[tier]}`;
      if (tier === newlySolvedTier) banner.classList.add('pop-in');
      if (autoSet.has(tier)) banner.classList.add('was-revealed');

      const wordsLine = cat.words.join(', ');
      const glossHtml = cat.gloss
        ? `<div class="sorta-solved-gloss">${cat.gloss}</div>`
        : '';

      banner.innerHTML = `
        <div class="sorta-solved-name">${cat.name}</div>
        <div class="sorta-solved-words">${wordsLine}</div>
        ${glossHtml}
      `;
      els.solvedStack.appendChild(banner);
    });
  }

  function renderGrid(puzzle, state) {
    els.grid.innerHTML = '';
    if (state.status !== 'playing') {
      els.grid.style.display = 'none';
      return;
    }
    els.grid.style.display = 'grid';

    state.remainingWords.forEach((word) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = selectedWords.includes(word);
      btn.className = `sorta-tile ${getTileSizeClass(word)}${isSelected ? ' selected' : ''}`;
      btn.dataset.word = word;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.innerHTML = `<span class="sorta-tile-text">${word}</span>`;

      btn.addEventListener('click', () => toggleWord(word));
      els.grid.appendChild(btn);
    });
  }

  function renderMistakesAndControls(state) {
    const finished = state.status !== 'playing';
    els.mistakesRow.style.display = finished ? 'none' : 'flex';
    els.controlsRow.style.display = finished ? 'none' : 'flex';

    if (!finished) {
      const remaining = Math.max(0, MAX_MISTAKES - (state.mistakes || 0));
      els.mistakesPips.innerHTML = '';
      for (let i = 0; i < MAX_MISTAKES; i++) {
        const pip = document.createElement('span');
        pip.className = 'sorta-pip' + (i < remaining ? ' active' : ' spent');
        els.mistakesPips.appendChild(pip);
      }

      els.btnDeselect.disabled = selectedWords.length === 0 || isAnimating;
      els.btnSubmit.disabled = selectedWords.length !== 4 || isAnimating;
      els.btnShuffle.disabled = state.remainingWords.length <= 4 || isAnimating;
    }
  }

  function buildEmojiString(puzzle, state) {
    if (!state.guesses || state.guesses.length === 0) return '';
    return state.guesses
      .map((guessWords) =>
        guessWords.map((w) => TIER_EMOJIS[getWordTier(puzzle, w)]).join('')
      )
      .join('\n');
  }

  function renderPostgame(puzzle, state) {
    if (state.status === 'playing') {
      els.postgame.hidden = true;
      els.postgame.classList.remove('visible');
      return;
    }

    els.postgame.hidden = false;
    requestAnimationFrame(() => els.postgame.classList.add('visible'));

    const won = state.status === 'won';
    els.postgameTitle.textContent = puzzle.title;

    if (won) {
      const m = state.mistakes || 0;
      els.postgameHeadline.textContent =
        m === 0 ? 'Solved · 0 mistakes' : `Solved · ${m} ${m === 1 ? 'mistake' : 'mistakes'}`;
    } else {
      els.postgameHeadline.textContent = 'Out of lives';
    }

    // Visual guess matrix
    els.postgameEmojiGrid.innerHTML = '';
    (state.guesses || []).forEach((guessWords) => {
      const row = document.createElement('div');
      row.className = 'sorta-emoji-row';
      guessWords.forEach((w) => {
        const cell = document.createElement('span');
        const tier = getWordTier(puzzle, w);
        cell.className = `sorta-emoji-cell ${TIER_CLASSES[tier]}`;
        cell.title = w;
        row.appendChild(cell);
      });
      els.postgameEmojiGrid.appendChild(row);
    });

    // Single inline Gemini note (no extra chip or verdict footer)
    const labelText =
      puzzle.geminiOutcome === 'stumped' || puzzle.geminiOutcome === 'wiped-out'
        ? 'Gemini (stumped):'
        : 'Gemini:';
    els.geminiRant.innerHTML = '';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'sorta-gemini-label';
    labelSpan.textContent = labelText;
    els.geminiRant.appendChild(labelSpan);
    els.geminiRant.appendChild(document.createTextNode(` "${puzzle.geminiRant}"`));

    // Next puzzle button target
    const nextUnsolved =
      SORTA_PUZZLES.find((p) => p.id > puzzle.id && (!savedStore[p.id] || savedStore[p.id].status === 'playing')) ||
      SORTA_PUZZLES.find((p) => p.id !== puzzle.id && (!savedStore[p.id] || savedStore[p.id].status === 'playing')) ||
      SORTA_PUZZLES[(puzzle.id % SORTA_PUZZLES.length)];

    if (nextUnsolved) {
      const nextNum = String(nextUnsolved.id).padStart(2, '0');
      els.btnNext.innerHTML = `<span>Board #${nextNum}</span> <i class="fa-solid fa-arrow-right"></i>`;
      els.btnNext.onclick = () => {
        selectPuzzle(nextUnsolved.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }

  function renderAll(newlySolvedTier = null) {
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    renderPuzzleStrip();
    renderBoardHeader(puzzle, state);
    renderSolvedBanners(puzzle, state, newlySolvedTier);
    renderGrid(puzzle, state);
    renderMistakesAndControls(state);
    renderPostgame(puzzle, state);
  }

  // --------------------------------------------------------------------------
  // 5. PLAYER INTERACTIONS
  // --------------------------------------------------------------------------
  function selectPuzzle(id, updateUrl = true) {
    const puzzle = getPuzzleById(id);
    currentPuzzleId = puzzle.id;
    selectedWords = [];
    isAnimating = false;
    if (updateUrl && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('p', String(currentPuzzleId));
      window.history.replaceState({}, '', url.toString());
    }
    renderAll();
  }

  function toggleWord(word) {
    if (isAnimating) return;
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    if (state.status !== 'playing') return;

    const idx = selectedWords.indexOf(word);
    if (idx !== -1) {
      selectedWords.splice(idx, 1);
      SortaAudio.deselect();
    } else {
      if (selectedWords.length >= 4) return;
      selectedWords.push(word);
      SortaAudio.select(selectedWords.length);
    }

    // Update tile DOM in-place for snappy feel
    els.grid.querySelectorAll('.sorta-tile').forEach((tile) => {
      const on = selectedWords.includes(tile.dataset.word);
      tile.classList.toggle('selected', on);
      tile.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderMistakesAndControls(state);
  }

  function shuffleRemaining() {
    if (isAnimating) return;
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    if (state.status !== 'playing' || state.remainingWords.length <= 1) return;

    const arr = state.remainingWords.slice();
    // Ensure shuffle actually changes visual order when >1 tile
    let attempts = 0;
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      attempts++;
    } while (attempts < 4 && arr.every((w, i) => w === state.remainingWords[i]));

    state.remainingWords = arr;
    saveStore();
    SortaAudio.shuffle();

    els.grid.classList.add('shuffling');
    setTimeout(() => {
      renderGrid(puzzle, state);
      els.grid.classList.remove('shuffling');
    }, 130);
  }

  function deselectAll() {
    if (isAnimating || selectedWords.length === 0) return;
    selectedWords = [];
    SortaAudio.deselect();
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    els.grid.querySelectorAll('.sorta-tile').forEach((t) => {
      t.classList.remove('selected');
      t.setAttribute('aria-pressed', 'false');
    });
    renderMistakesAndControls(state);
  }

  function sameGuessSet(a, b) {
    if (a.length !== b.length) return false;
    const sa = a.slice().sort();
    const sb = b.slice().sort();
    return sa.every((v, i) => v === sb[i]);
  }

  function submitSelection() {
    if (isAnimating || selectedWords.length !== 4) return;
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    if (state.status !== 'playing') return;

    const guess = selectedWords.slice();

    // 1. Duplicate guess protection
    if ((state.guesses || []).some((prev) => sameGuessSet(prev, guess))) {
      showToast('Already guessed that combo!');
      return;
    }

    isAnimating = true;
    renderMistakesAndControls(state);

    // Hop animation on selected tiles
    const selectedEls = Array.from(els.grid.querySelectorAll('.sorta-tile.selected'));
    selectedEls.forEach((el, idx) => {
      setTimeout(() => el.classList.add('hop'), idx * 55);
    });

    setTimeout(() => {
      selectedEls.forEach((el) => el.classList.remove('hop'));

      // Record guess in history
      state.guesses.push(guess);

      // Check overlap against unsolved categories
      let matchedCat = null;
      let maxOverlap = 0;

      puzzle.categories.forEach((cat) => {
        if (state.solvedTiers.includes(cat.tier)) return;
        const overlap = guess.filter((w) => cat.words.includes(w)).length;
        if (overlap === 4) matchedCat = cat;
        if (overlap > maxOverlap) maxOverlap = overlap;
      });

      if (matchedCat) {
        // CORRECT!
        state.solvedTiers.push(matchedCat.tier);
        state.remainingWords = state.remainingWords.filter((w) => !matchedCat.words.includes(w));
        selectedWords = [];

        if (state.solvedTiers.length === 4) {
          state.status = 'won';
          SortaAudio.win();
        } else {
          SortaAudio.correct(matchedCat.tier);
        }

        saveStore();
        isAnimating = false;
        renderAll(matchedCat.tier);

        if (state.status === 'won') {
          setTimeout(() => {
            els.postgame.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 260);
        }
      } else {
        // INCORRECT!
        state.mistakes = (state.mistakes || 0) + 1;
        saveStore();

        if (maxOverlap === 3 && state.mistakes < MAX_MISTAKES) {
          SortaAudio.oneAway();
          showToast('One away...', 2200);
        } else if (state.mistakes < MAX_MISTAKES) {
          SortaAudio.wrong();
        } else {
          SortaAudio.wrong();
          showToast('Out of lives — revealing board...', 2400);
        }

        selectedEls.forEach((el) => el.classList.add('shake'));
        renderMistakesAndControls(state);

        setTimeout(() => {
          selectedEls.forEach((el) => el.classList.remove('shake'));

          if (state.mistakes >= MAX_MISTAKES) {
            revealRemainingOnLoss(puzzle, state);
          } else {
            isAnimating = false;
            renderMistakesAndControls(state);
          }
        }, 460);
      }
    }, 280);
  }

  function revealRemainingOnLoss(puzzle, state) {
    selectedWords = [];
    const remainingCats = puzzle.categories
      .filter((c) => !state.solvedTiers.includes(c.tier))
      .sort((a, b) => a.tier - b.tier);

    if (!state.autoRevealedTiers) state.autoRevealedTiers = [];

    remainingCats.forEach((cat, idx) => {
      setTimeout(() => {
        state.solvedTiers.push(cat.tier);
        state.autoRevealedTiers.push(cat.tier);
        state.remainingWords = state.remainingWords.filter((w) => !cat.words.includes(w));
        SortaAudio.correct(cat.tier);

        if (idx === remainingCats.length - 1) {
          state.status = 'lost';
          saveStore();
          isAnimating = false;
          renderAll(cat.tier);
          setTimeout(() => {
            els.postgame.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 300);
        } else {
          saveStore();
          renderAll(cat.tier);
        }
      }, 380 + idx * 520);
    });
  }

  function resetCurrentBoard() {
    if (isAnimating) return;
    const puzzle = getPuzzleById(currentPuzzleId);
    savedStore[puzzle.id] = createFreshBoardState(puzzle);
    selectedWords = [];
    saveStore();
    renderAll();
    showToast('Board reset!');
  }

  function shareCurrentResult() {
    const puzzle = getPuzzleById(currentPuzzleId);
    const state = getBoardState(puzzle);
    const numStr = String(puzzle.id).padStart(2, '0');
    const emojiBlock = buildEmojiString(puzzle, state);
    const shareUrl = `https://evanswope.com/sorta?p=${puzzle.id}`;
    const header =
      state.status === 'won'
        ? `SORTA #${numStr} (${MAX_MISTAKES - state.mistakes}/${MAX_MISTAKES} lives left)`
        : `SORTA #${numStr} (X/${MAX_MISTAKES})`;
    const text = `${header}\n${emojiBlock}\n${shareUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Result copied to clipboard!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Result copied to clipboard!');
    } catch (_) {
      showToast('Could not copy automatically');
    }
    document.body.removeChild(ta);
  }

  function updateAudioBtnUI() {
    if (!els.btnAudio) return;
    const muted = SortaAudio.isMuted();
    els.btnAudio.innerHTML = muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
    els.btnAudio.title = muted ? 'Unmute synth clicks' : 'Mute synth clicks';
    els.btnAudio.setAttribute('aria-label', els.btnAudio.title);
    els.btnAudio.classList.toggle('is-muted', muted);
  }

  function openHelpModal() {
    if (!els.modalHelp) return;
    els.modalHelp.hidden = false;
    requestAnimationFrame(() => els.modalHelp.classList.add('open'));
  }

  function closeHelpModal() {
    if (!els.modalHelp) return;
    els.modalHelp.classList.remove('open');
    setTimeout(() => {
      els.modalHelp.hidden = true;
    }, 180);
  }

  // --------------------------------------------------------------------------
  // 6. INITIALIZATION & KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------
  function init() {
    cacheDom();
    loadStore();

    // Parse ?p=1..12 deep link if provided
    const params = new URLSearchParams(window.location.search);
    const pParam = parseInt(params.get('p'), 10);
    if (!isNaN(pParam) && pParam >= 1 && pParam <= SORTA_PUZZLES.length) {
      currentPuzzleId = pParam;
    } else {
      // Default to first unfinished board, or #1 if all completed
      const firstOpen = SORTA_PUZZLES.find(
        (p) => !savedStore[p.id] || savedStore[p.id].status === 'playing'
      );
      currentPuzzleId = firstOpen ? firstOpen.id : 1;
    }

    els.btnShuffle.addEventListener('click', shuffleRemaining);
    els.btnDeselect.addEventListener('click', deselectAll);
    els.btnSubmit.addEventListener('click', submitSelection);
    els.btnShare.addEventListener('click', shareCurrentResult);
    els.btnReset.addEventListener('click', resetCurrentBoard);

    if (els.btnAudio) {
      updateAudioBtnUI();
      els.btnAudio.addEventListener('click', () => {
        SortaAudio.toggleMute();
        updateAudioBtnUI();
      });
    }

    if (els.btnHelp && els.modalHelp) {
      els.btnHelp.addEventListener('click', openHelpModal);
      els.btnCloseHelp.addEventListener('click', closeHelpModal);
      els.modalHelp.addEventListener('click', (e) => {
        if (e.target === els.modalHelp) closeHelpModal();
      });
    }

    // Keyboard shortcuts: Enter to submit, Escape to deselect/close modal, S to shuffle
    document.addEventListener('keydown', (e) => {
      if (els.modalHelp && !els.modalHelp.hidden) {
        if (e.key === 'Escape') closeHelpModal();
        return;
      }
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        deselectAll();
      } else if (e.key === 'Enter' && document.activeElement === document.body) {
        if (selectedWords.length === 4) {
          e.preventDefault();
          submitSelection();
        }
      } else if ((e.key === 's' || e.key === 'S') && document.activeElement === document.body) {
        shuffleRemaining();
      }
    });

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose puzzle data for automated verification if needed
  window.SORTA_PUZZLES = SORTA_PUZZLES;
})();
