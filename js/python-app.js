/* ═══════════════════════════════════════════════════════════
   PYTHON LAB — Application JavaScript
   Skulpt execution engine, CodeMirror editors, exercises,
   notebook cells, topic navigation, theme system
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     SECTION 1 — LOADER
     Hide the page loader after all assets have loaded.
  ───────────────────────────────────────────────────────── */
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    if (loader) {
      setTimeout(function () {
        loader.classList.add('hidden');
      }, 400);
    }
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 2 — THEME SYSTEM
     Themes: colab | dark | monokai
     Persisted in localStorage under 'py-lab-theme'.
     Applied immediately (before paint) to avoid flicker.
  ───────────────────────────────────────────────────────── */
  var PY_THEMES = ['colab', 'dark', 'monokai'];

  /**
   * Map each app theme to its CodeMirror theme string.
   * CodeMirror themes must be loaded via their CSS files in HTML.
   */
  var CM_THEME_MAP = {
    colab:   'eclipse',   // light — mirrors Google Colab
    dark:    'dracula',   // dark blue/purple
    monokai: 'monokai',   // classic monokai
  };

  var PY_THEME_META = {
    colab:   { label: 'Colab Style', meta: '#f9ab00' },
    dark:    { label: 'Python Dark', meta: '#6366f1' },
    monokai: { label: 'Python Night', meta: '#a6e22e' },
  };

  /** Callbacks registered by other modules that need to react to theme changes. */
  var themeChangeCallbacks = [];

  /**
   * Apply a theme to the document and persist it.
   * @param {string} theme - One of PY_THEMES.
   */
  function setPyTheme(theme) {
    if (!PY_THEMES.includes(theme)) theme = 'colab';

    var root = document.documentElement;
    var meta  = PY_THEME_META[theme];

    // Mark transition so CSS can suppress transitions during switch
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);

    try { localStorage.setItem('py-lab-theme', theme); } catch (e) { /* storage unavailable */ }

    // Update active state on picker options
    document.querySelectorAll('.theme-option[data-theme]').forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });

    // Update visible theme label immediately
    var themeToggleValue = document.getElementById('themeToggleValue');
    if (themeToggleValue) themeToggleValue.textContent = meta.label;

    // Update theme-color meta tag
    var metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) metaTag.setAttribute('content', meta.meta);

    // Notify registered callbacks (e.g., CodeMirror editors)
    requestAnimationFrame(function () {
      themeChangeCallbacks.forEach(function (cb) { cb(theme); });
      requestAnimationFrame(function () { root.classList.remove('theme-switching'); });
    });
  }

  /** Read the stored theme, falling back to 'colab'. */
  function loadPyTheme() {
    try {
      var saved = localStorage.getItem('py-lab-theme');
      if (saved && PY_THEMES.includes(saved)) return saved;
    } catch (e) { /* ok */ }
    return 'colab';
  }

  // Apply theme synchronously before first paint (no flicker)
  setPyTheme(loadPyTheme());

  /* ─── Theme picker panel ─── */
  var themeToggleBtn = document.getElementById('themeToggleBtn');
  var themePanel     = document.getElementById('themePanel');

  function closeThemePanel() {
    if (!themeToggleBtn || !themePanel) return;
    themePanel.classList.remove('open');
    themeToggleBtn.classList.remove('is-open');
    themeToggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (themeToggleBtn && themePanel) {
    themeToggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !themePanel.classList.contains('open');
      themePanel.classList.toggle('open', willOpen);
      themeToggleBtn.classList.toggle('is-open', willOpen);
      themeToggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.theme-option[data-theme]').forEach(function (opt) {
      opt.addEventListener('click', function () {
        closeThemePanel();
        setPyTheme(opt.dataset.theme);
      });
    });

    document.addEventListener('click', function (e) {
      if (!themePanel.contains(e.target) && !themeToggleBtn.contains(e.target)) {
        closeThemePanel();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeThemePanel();
    });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 3 — NAVBAR
     Scroll shadow, mobile hamburger, dropdowns, SPA links.
  ───────────────────────────────────────────────────────── */
  var navbar   = document.getElementById('navbar');
  var menuBtn  = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');

  /* Add 'scrolled' class to navbar when user scrolls down */
  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);

    // Update reading progress bar if present
    var progressFill = document.getElementById('progressFill');
    if (progressFill) {
      var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      var pct = scrollMax > 0 ? (window.scrollY / scrollMax) * 100 : 0;
      progressFill.style.width = pct + '%';
    }

    updateActiveNavLink();
  });

  /** Highlight the nav link matching the visible section. */
  function updateActiveNavLink() {
    var sections = document.querySelectorAll('section[id]');
    var currentId = '';
    sections.forEach(function (sec) {
      if (window.scrollY >= sec.offsetTop - 120) currentId = sec.id;
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  if (menuBtn && navLinks) {
    /* Hamburger toggle */
    menuBtn.addEventListener('click', function () {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
      if (!navLinks.classList.contains('open')) {
        navLinks.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      }
    });

    /* Dropdown toggle buttons */
    document.querySelectorAll('.nav-dropdown-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var dropdown = btn.parentElement;
        var isOpen   = dropdown.classList.contains('open');
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open', !isOpen);
      });
    });

    /* Close dropdowns on outside click */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      }
    });

    /* Close mobile menu when a link is clicked (SPA behaviour) */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';

        // SPA: if the link is a hash or same-page anchor, prevent navigation
        if (href.startsWith('#')) {
          e.preventDefault();
          var targetId = href.slice(1);
          scrollToSection(targetId);
        }

        menuBtn.classList.remove('active');
        navLinks.classList.remove('open');
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 4 — SMOOTH SCROLLING
  ───────────────────────────────────────────────────────── */
  /**
   * Smooth-scroll to a section by its id.
   * @param {string} id - The section element id (without #).
   */
  function scrollToSection(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var offset = navbar ? navbar.offsetHeight + 16 : 80;
    var top    = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // Expose globally so inline onclick="" attributes can call it
  window.scrollToSection = scrollToSection;

  /* Handle hash in URL on initial load */
  if (window.location.hash) {
    var initialId = window.location.hash.slice(1);
    setTimeout(function () { scrollToSection(initialId); }, 200);
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 5 — INTERSECTION OBSERVER (reveal on scroll)
     Adds 'animate-in' class to .reveal elements when visible.
  ───────────────────────────────────────────────────────── */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = parseInt(entry.target.style.getPropertyValue('--delay') || '0', 10);
          setTimeout(function () {
            entry.target.classList.add('animate-in');
          }, delay * 80);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 6 — CODEMIRROR HELPERS
     Returns the correct CM theme string for the current theme.
  ───────────────────────────────────────────────────────── */
  function getCMTheme() {
    var theme = document.documentElement.getAttribute('data-theme') || 'colab';
    return CM_THEME_MAP[theme] || 'eclipse';
  }

  /**
   * Create a CodeMirror Python editor inside a container element.
   * @param {Element} container - The wrapper div for the editor.
   * @param {string}  code      - Initial code value.
   * @param {Object}  [extra]   - Extra CodeMirror options.
   * @returns {CodeMirror.Editor|null}
   */
  function createPyEditor(container, code, extra) {
    if (typeof CodeMirror === 'undefined') return null;

    var opts = Object.assign(
      {
        value: code || '',
        mode: 'python',
        theme: getCMTheme(),
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: false,
        viewportMargin: Infinity,
        extraKeys: {
          Tab: function (cm) {
            if (cm.somethingSelected()) {
              cm.indentSelection('add');
            } else {
              cm.replaceSelection('    ', 'end');
            }
          },
        },
      },
      extra || {}
    );

    return CodeMirror(container, opts);
  }

  /* Update all tracked CodeMirror instances when theme changes */
  var cmInstances = []; // { cm: CodeMirror.Editor }

  themeChangeCallbacks.push(function (theme) {
    var newCMTheme = CM_THEME_MAP[theme] || 'eclipse';
    cmInstances.forEach(function (inst) {
      inst.cm.setOption('theme', newCMTheme);
    });
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 7 — SKULPT PYTHON EXECUTION
     Runs Python code using the Skulkt library (loaded via CDN
     in the HTML file). If Skulkt is not available, an error
     message is shown in the output element.
  ───────────────────────────────────────────────────────── */

  /**
   * Execute Python code with Skulkt and stream output to an element.
   * @param {string}  code      - Python source code to run.
   * @param {Element} outputEl  - DOM element where output is written.
   * @param {Object}  [opts]    - Options: { clearFirst: boolean }
   * @returns {Promise}
   */
  function runPython(code, outputEl, opts) {
    opts = opts || {};

    if (opts.clearFirst !== false) {
      outputEl.innerHTML = '';
    }

    if (typeof Sk === 'undefined') {
      appendOutput(outputEl, '[Aviso] Skulkt não está disponível. Verifique se o CDN foi carregado.', 'error');
      return Promise.reject(new Error('Skulkt not loaded'));
    }

    // Mark element as running
    outputEl.classList.add('running');

    Sk.configure({
      /** Called by Skulkt for every print() call */
      output: function (text) {
        appendOutput(outputEl, text, 'log');
      },
      /** Called when Skulkt needs to read a module file */
      read: function (x) {
        if (
          Sk.builtinFiles === undefined ||
          Sk.builtinFiles['files'][x] === undefined
        ) {
          throw new Error("File not found: '" + x + "'");
        }
        return Sk.builtinFiles['files'][x];
      },
      /** Handle input() — shows a browser prompt */
      inputfun: function (prompt) {
        return window.prompt(prompt || '');
      },
      /** Allow Skulkt to import turtle and other builtins */
      __future__: Sk.python3,
    });

    var promise = Sk.misceval.asyncToPromise(function () {
      return Sk.importMainWithBody('<stdin>', false, code, true);
    });

    return promise.then(
      function () {
        // Execution succeeded
        outputEl.classList.remove('running');
        if (outputEl.textContent.trim() === '') {
          appendOutput(outputEl, '(sem output)', 'info');
        }
      },
      function (err) {
        // Execution error
        outputEl.classList.remove('running');
        var msg = err.toString();
        // Extract friendly traceback if available
        if (err.args && err.args.v && err.args.v[0] && err.args.v[0].v) {
          msg = err.args.v[0].v;
        }
        appendOutput(outputEl, 'Erro: ' + msg, 'error');
      }
    );
  }

  /**
   * Append a line of text to an output element.
   * @param {Element} el    - The output container.
   * @param {string}  text  - Text content.
   * @param {string}  type  - 'log' | 'error' | 'info' | 'warn'
   */
  function appendOutput(el, text, type) {
    // Skulkt may send multi-line text in one call; split it up
    var lines = text.split('\n');
    lines.forEach(function (line, idx) {
      // Skip trailing empty string produced by final \n
      if (idx === lines.length - 1 && line === '') return;
      var span = document.createElement('div');
      span.className = 'py-output-line' + (type ? ' ' + type : '');
      span.textContent = line;
      el.appendChild(span);
    });
    el.scrollTop = el.scrollHeight;
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 8 — STANDALONE .py-editor ELEMENTS
     Auto-initialise any element with class 'py-editor'
     that does NOT belong to a notebook cell or exercise.
  ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.py-editor').forEach(function (el) {
    // Skip elements already handled by notebook / exercise initialisers
    if (el.closest('.notebook-cell') || el.closest('.exercise-card')) return;

    var code = el.textContent.trim();
    el.textContent = '';

    var cm = createPyEditor(el, code);
    if (cm) cmInstances.push({ cm: cm });
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 9 — NOTEBOOK CELLS
     Each .notebook-cell has:
       - A .cell-editor div (or textarea.py-editor) for code
       - A [data-action="run"] button
       - A .cell-output div for results
  ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.notebook-cell').forEach(function (cell) {
    var editorEl  = cell.querySelector('.cell-editor');
    var outputEl  = cell.querySelector('.cell-output');
    var runBtn    = cell.querySelector('[data-action="run"]');
    var clearBtn  = cell.querySelector('[data-action="clear-output"]');

    if (!editorEl || !outputEl) return;

    // Seed code from data attribute or existing text content
    var seedCode = editorEl.getAttribute('data-code') || editorEl.textContent.trim();
    editorEl.textContent = '';

    var cm = createPyEditor(editorEl, seedCode, {
      extraKeys: {
        'Ctrl-Enter': function () { executeCellCode(cm, outputEl); },
        'Cmd-Enter':  function () { executeCellCode(cm, outputEl); },
        Tab: function (editor) {
          if (editor.somethingSelected()) {
            editor.indentSelection('add');
          } else {
            editor.replaceSelection('    ', 'end');
          }
        },
      },
    });

    if (cm) cmInstances.push({ cm: cm });

    if (runBtn) {
      runBtn.addEventListener('click', function () {
        executeCellCode(cm, outputEl);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        outputEl.innerHTML = '';
        outputEl.classList.remove('has-output');
      });
    }
  });

  /**
   * Execute code from a notebook cell editor into its output element.
   * @param {CodeMirror.Editor|null} cm       - The CodeMirror instance.
   * @param {Element}                outputEl - Where to display output.
   */
  function executeCellCode(cm, outputEl) {
    var code = cm ? cm.getValue() : '';
    if (!code.trim()) return;

    outputEl.innerHTML = '';
    outputEl.classList.add('has-output');

    runPython(code, outputEl, { clearFirst: false });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 10 — INTERACTIVE EXERCISES SYSTEM
     Each .exercise-card has:
       - .exercise-prompt       : problem description
       - .exercise-editor       : code editor wrapper
       - [data-action="run"]    : run the user's code
       - [data-action="check"]  : verify against expected output/answer
       - [data-action="hint"]   : toggle hint visibility
       - .exercise-hint         : hidden hint text
       - .exercise-output       : live execution output
       - .exercise-feedback     : correct / incorrect banner
  ───────────────────────────────────────────────────────── */
  var exerciseStates = {}; // { [exerciseId]: 'correct' | 'incorrect' | 'partial' | null }

  document.querySelectorAll('.exercise-card').forEach(function (card) {
    var exId      = card.dataset.exercise;
    var editorEl  = card.querySelector('.exercise-editor');
    var outputEl  = card.querySelector('.exercise-output');
    var runBtn    = card.querySelector('[data-action="run"]');
    var checkBtn  = card.querySelector('[data-action="check"]');
    var hintBtn   = card.querySelector('[data-action="hint"]');
    var hintEl    = card.querySelector('.exercise-hint');
    var feedbackEl= card.querySelector('.exercise-feedback');
    var explanationEl = card.querySelector('.exercise-explanation');

    /* Quiz cards (MC / T-F) — no editor needed */
    if (!editorEl && card.dataset.check === 'quiz') {
      if (checkBtn && feedbackEl) {
        checkBtn.addEventListener('click', function () {
          if (exerciseStates[exId] === 'correct') return;
          checkExerciseAnswer(exId, '', card, feedbackEl, outputEl);
        });
      }
      return;
    }

    if (!editorEl) return;

    // Seed code
    var seedCode = editorEl.getAttribute('data-code') || editorEl.textContent.trim();
    editorEl.textContent = '';

    var cm = createPyEditor(editorEl, seedCode, {
      extraKeys: {
        'Ctrl-Enter': function () { runExercise(); },
        'Cmd-Enter':  function () { runExercise(); },
        Tab: function (editor) {
          if (editor.somethingSelected()) {
            editor.indentSelection('add');
          } else {
            editor.replaceSelection('    ', 'end');
          }
        },
      },
    });

    if (cm) cmInstances.push({ cm: cm });

    /* Run button — executes code and shows output */
    function runExercise() {
      if (!outputEl) return;
      outputEl.innerHTML = '';
      outputEl.classList.add('has-output');
      var code = cm ? cm.getValue() : editorEl.textContent;
      runPython(code, outputEl, { clearFirst: false });
    }

    if (runBtn) runBtn.addEventListener('click', runExercise);

    /* Hint toggle */
    if (hintBtn && hintEl) {
      hintEl.style.display = 'none'; // ensure hidden initially
      hintBtn.addEventListener('click', function () {
        var visible = hintEl.style.display !== 'none';
        hintEl.style.display = visible ? 'none' : '';
        hintBtn.textContent  = visible ? 'Mostrar dica' : 'Ocultar dica';
        hintBtn.setAttribute('aria-expanded', visible ? 'false' : 'true');
      });
    }

    /* Check answer button */
    if (checkBtn && feedbackEl) {
      checkBtn.addEventListener('click', function () {
        if (exerciseStates[exId] === 'correct') return; // already solved

        var code = cm ? cm.getValue() : '';
        checkExerciseAnswer(exId, code, card, feedbackEl, outputEl);
      });
    }
  });

  /**
   * Evaluate exercise answer using expected-output comparison or
   * pattern matching defined via data attributes on the card.
   *
   * Supported evaluation strategies (data-check attribute on card):
   *   'pattern'  — checks if code matches data-pattern regex
   *   'output'   — runs code and compares with data-expected
   *   'contains' — checks if code contains data-must-contain string
   *
   * @param {string}  exId       - Exercise id.
   * @param {string}  code       - User's code.
   * @param {Element} card       - The exercise card element.
   * @param {Element} feedbackEl - Where feedback is shown.
   * @param {Element} outputEl   - Execution output element.
   */
  function checkExerciseAnswer(exId, code, card, feedbackEl, outputEl) {
    var strategy = card.dataset.check || 'pattern';
    var result   = 'incorrect';

    if (strategy === 'quiz') {
      /* Multiple-choice or True/False — check selected radio vs data-answer */
      var correctAnswer = (card.dataset.answer || '').trim().toLowerCase();
      var selected = card.querySelector('input[type="radio"]:checked');
      if (!selected) {
        applyExerciseFeedback(exId, 'incorrect', card, feedbackEl, 'Selecione uma opção antes de verificar.');
        return;
      }
      var userAnswer = selected.value.trim().toLowerCase();
      result = (userAnswer === correctAnswer) ? 'correct' : 'incorrect';

      /* Show explanation after answering */
      var explanationEl = card.querySelector('.exercise-explanation');
      if (explanationEl) explanationEl.style.display = '';

      /* Highlight correct/incorrect options */
      card.querySelectorAll('.quiz-option').forEach(function (opt) {
        var radio = opt.querySelector('input[type="radio"]');
        if (!radio) return;
        opt.classList.remove('quiz-correct', 'quiz-incorrect');
        if (radio.value.trim().toLowerCase() === correctAnswer) {
          opt.classList.add('quiz-correct');
        } else if (radio.checked) {
          opt.classList.add('quiz-incorrect');
        }
      });

    } else if (strategy === 'pattern') {
      var patternStr = card.dataset.pattern;
      if (patternStr) {
        try {
          var re = new RegExp(patternStr, 'i');
          result = re.test(code) ? 'correct' : 'incorrect';
        } catch (e) {
          result = 'incorrect';
        }
      }

    } else if (strategy === 'contains') {
      var mustContain = card.dataset.mustContain || '';
      result = code.includes(mustContain) ? 'correct' : 'incorrect';

    } else if (strategy === 'output') {
      // Run code, then compare output text to expected value
      var expected = (card.dataset.expected || '').trim();
      if (!outputEl || !expected) {
        result = 'partial'; // can't verify without expected value
      } else {
        var captured = '';
        if (typeof Sk !== 'undefined') {
          Sk.configure({
            output: function (text) { captured += text; },
            read:   function (x) {
              if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
                throw new Error("File not found: '" + x + "'");
              }
              return Sk.builtinFiles['files'][x];
            },
            __future__: Sk.python3,
          });

          Sk.misceval.asyncToPromise(function () {
            return Sk.importMainWithBody('<stdin>', false, code, true);
          }).then(
            function () {
              var actual = captured.trim();
              var verdict = actual === expected ? 'correct' : (actual.includes(expected) ? 'partial' : 'incorrect');
              applyExerciseFeedback(exId, verdict, card, feedbackEl);
            },
            function (err) {
              applyExerciseFeedback(exId, 'incorrect', card, feedbackEl, 'Erro de execução: ' + err.toString());
            }
          );
          return; // async — feedback applied in callbacks above
        }
      }

    } else if (strategy === 'none') {
      // No automatic check — just mark as attempted
      result = 'partial';
    }

    applyExerciseFeedback(exId, result, card, feedbackEl);
  }

  /**
   * Show feedback on an exercise card and record state.
   * @param {string}  exId       - Exercise id.
   * @param {string}  verdict    - 'correct' | 'incorrect' | 'partial'
   * @param {Element} card       - Card element.
   * @param {Element} feedbackEl - Feedback container.
   * @param {string}  [override] - Optional custom message.
   */
  function applyExerciseFeedback(exId, verdict, card, feedbackEl, override) {
    exerciseStates[exId] = verdict;
    card.classList.remove('is-correct', 'is-incorrect', 'is-partial');

    var messages = {
      correct:   override || 'Correto! Excelente trabalho.',
      incorrect: override || 'Não está correto. Revise seu código e tente novamente.',
      partial:   override || 'Quase lá! Verifique os detalhes da sua solução.',
    };

    feedbackEl.className = 'exercise-feedback ' + verdict;
    feedbackEl.textContent = messages[verdict] || '';
    feedbackEl.style.display = '';

    card.classList.add('is-' + verdict);

    // Persist progress
    try {
      var saved = JSON.parse(localStorage.getItem('py-lab-exercises') || '{}');
      saved[exId] = verdict;
      localStorage.setItem('py-lab-exercises', JSON.stringify(saved));
    } catch (e) { /* ok */ }

    // Update topic progress counters
    updateTopicProgress();
  }

  /* Restore exercise states from localStorage on page load */
  (function restoreExerciseStates() {
    try {
      var saved = JSON.parse(localStorage.getItem('py-lab-exercises') || '{}');
      Object.keys(saved).forEach(function (exId) {
        exerciseStates[exId] = saved[exId];
        var card = document.querySelector('.exercise-card[data-exercise="' + exId + '"]');
        if (card) {
          var feedbackEl = card.querySelector('.exercise-feedback');
          if (feedbackEl) {
            applyExerciseFeedback(exId, saved[exId], card, feedbackEl);
          }
        }
      });
    } catch (e) { /* ok */ }
  }());

  /* ─────────────────────────────────────────────────────────
     SECTION 11 — TOPIC NAVIGATION & ACCORDION
     Accordion: clicking a header opens/closes its content.
     Progress: visited topics tracked in localStorage.
  ───────────────────────────────────────────────────────── */

  /* Accordion */
  document.querySelectorAll('.accordion-header').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item    = btn.parentElement;
      var wasOpen = item.classList.contains('active');

      // Close all accordion items in the same group
      var group = item.parentElement;
      group.querySelectorAll('.accordion-item').forEach(function (i) {
        i.classList.remove('active');
        var h = i.querySelector('.accordion-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Topic visited tracking */
  var visitedTopics = (function () {
    try {
      return JSON.parse(localStorage.getItem('py-lab-visited') || '[]');
    } catch (e) { return []; }
  }());

  /**
   * Mark a topic as visited (called from HTML onclick or internally).
   * @param {string} topicId
   */
  function markTopicVisited(topicId) {
    if (!visitedTopics.includes(topicId)) {
      visitedTopics.push(topicId);
      try { localStorage.setItem('py-lab-visited', JSON.stringify(visitedTopics)); } catch (e) { /* ok */ }
    }

    // Add visual indicator
    var topicEl = document.querySelector('[data-topic="' + topicId + '"]');
    if (topicEl) topicEl.classList.add('visited');
  }

  // Expose globally for use in inline onclick attributes
  window.markTopicVisited = markTopicVisited;

  // Restore visited state on load
  visitedTopics.forEach(function (topicId) {
    var topicEl = document.querySelector('[data-topic="' + topicId + '"]');
    if (topicEl) topicEl.classList.add('visited');
  });

  /* Topic link clicks — mark as visited and scroll */
  document.querySelectorAll('[data-topic]').forEach(function (el) {
    el.addEventListener('click', function () {
      markTopicVisited(el.dataset.topic);
    });
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 12 — PROGRESS TRACKING
     Counts completed exercises per topic and updates UI.
  ───────────────────────────────────────────────────────── */
  function updateTopicProgress() {
    // Update global progress bar if present
    var allCards   = document.querySelectorAll('.exercise-card[data-exercise]');
    var totalCount = allCards.length;
    var doneCount  = 0;

    allCards.forEach(function (card) {
      var exId = card.dataset.exercise;
      if (exerciseStates[exId] === 'correct') doneCount++;
    });

    var globalBar  = document.getElementById('globalProgressFill');
    var globalText = document.getElementById('globalProgressText');
    if (globalBar) globalBar.style.width = (totalCount > 0 ? (doneCount / totalCount) * 100 : 0) + '%';
    if (globalText) globalText.textContent = doneCount + ' / ' + totalCount + ' exercícios concluídos';

    // Per-topic counters
    document.querySelectorAll('.topic-section[data-topic]').forEach(function (section) {
      var topicId    = section.dataset.topic;
      var cards      = section.querySelectorAll('.exercise-card[data-exercise]');
      var topicTotal = cards.length;
      var topicDone  = 0;

      cards.forEach(function (card) {
        if (exerciseStates[card.dataset.exercise] === 'correct') topicDone++;
      });

      var counter = section.querySelector('.topic-progress-text');
      if (counter) counter.textContent = topicDone + ' / ' + topicTotal;

      var fill = section.querySelector('.topic-progress-fill');
      if (fill) fill.style.width = (topicTotal > 0 ? (topicDone / topicTotal) * 100 : 0) + '%';
    });
  }

  // Run once on load to set initial state
  updateTopicProgress();

  /* ─────────────────────────────────────────────────────────
     SECTION 13 — MAIN PYTHON PLAYGROUND
     Optional standalone playground with a single large editor
     and a dedicated output panel.
  ───────────────────────────────────────────────────────── */
  var playgroundEditorEl = document.getElementById('pyPlaygroundEditor');
  var playgroundOutputEl = document.getElementById('pyPlaygroundOutput');
  var playgroundRunBtn   = document.getElementById('pyRunBtn');
  var playgroundClearBtn = document.getElementById('pyClearBtn');

  if (playgroundEditorEl && playgroundOutputEl) {
    var seedCode = playgroundEditorEl.getAttribute('data-code') ||
                   playgroundEditorEl.textContent.trim() ||
                   '# Escreva seu código Python aqui\nprint("Olá, Mundo!")\n';
    playgroundEditorEl.textContent = '';

    var playgroundCM = createPyEditor(playgroundEditorEl, seedCode, {
      extraKeys: {
        'Ctrl-Enter': function () { runPlayground(); },
        'Cmd-Enter':  function () { runPlayground(); },
        Tab: function (cm) {
          if (cm.somethingSelected()) {
            cm.indentSelection('add');
          } else {
            cm.replaceSelection('    ', 'end');
          }
        },
      },
    });

    if (playgroundCM) cmInstances.push({ cm: playgroundCM });

    function runPlayground() {
      var code = playgroundCM ? playgroundCM.getValue() : '';
      runPython(code, playgroundOutputEl, { clearFirst: true });
    }

    if (playgroundRunBtn) playgroundRunBtn.addEventListener('click', runPlayground);
    if (playgroundClearBtn) {
      playgroundClearBtn.addEventListener('click', function () {
        playgroundOutputEl.innerHTML = '';
        playgroundOutputEl.classList.remove('has-output');
      });
    }
  }

  /* ─────────────────────────────────────────────────────────
     SECTION 14 — GENERIC "CLEAR OUTPUT" BUTTONS
     Any button with [data-action="clear-output"][data-target]
     clears the output element with that id.
  ───────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-action="clear-output"][data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.target);
      if (target) {
        target.innerHTML = '';
        target.classList.remove('has-output');
      }
    });
  });

  /* ─────────────────────────────────────────────────────────
     SECTION 15 — CHATBOT (Python Tutor)
     Floating chat widget that connects to the same backend
     used by Math and CS modules.
  ───────────────────────────────────────────────────────── */
  (function initChatbot() {
    var CHAT_BACKEND = 'https://ib-math.onrender.com';
    var MAX_HISTORY  = 10;

    var chatFab         = document.getElementById('chatFab');
    var chatWindow      = document.getElementById('chatWindow');
    var chatClose       = document.getElementById('chatClose');
    var chatClear       = document.getElementById('chatClear');
    var chatForm        = document.getElementById('chatForm');
    var chatInput       = document.getElementById('chatInput');
    var chatMessages    = document.getElementById('chatMessages');
    var chatTyping      = document.getElementById('chatTyping');
    var chatStatus      = document.getElementById('chatStatus');
    var chatContextText = document.getElementById('chatContextText');
    var chatContextClear= document.getElementById('chatContextClear');
    var contextualBtns  = document.querySelectorAll('.btn-contextual-chat');

    if (!chatFab || !chatWindow) return; // No chatbot HTML present

    var chatHistory = [];
    var chatContext = 'geral';
    var chatOpen    = false;

    /* ── Toggle / Open / Close ── */
    function toggleChat() {
      chatOpen = !chatOpen;
      chatFab.classList.toggle('active', chatOpen);
      chatWindow.classList.toggle('open', chatOpen);
      if (chatOpen && chatMessages.children.length === 0) {
        addBotMessage('Ol\u00e1! \uD83D\uDC4B Sou o **Python Tutor**, seu assistente de programa\u00e7\u00e3o.\n\nPosso ajudar com:\n\u2022 D\u00favidas sobre c\u00f3digo Python\n\u2022 Explica\u00e7\u00e3o de conceitos\n\u2022 Dicas para exerc\u00edcios\n\u2022 Debug de erros\n\nDigite sua pergunta abaixo!');
      }
      if (chatOpen && chatInput) chatInput.focus();
    }

    function closeChat() {
      chatOpen = false;
      chatFab.classList.remove('active');
      chatWindow.classList.remove('open');
    }

    /* ── Context ── */
    function setContext(id, topic) {
      chatContext = id || 'geral';
      if (chatContextText) chatContextText.textContent = topic || 'Chat Geral';
    }

    function clearContext() {
      chatContext = 'geral';
      if (chatContextText) chatContextText.textContent = 'Chat Geral';
    }

    /* ── Messages ── */
    function addUserMessage(text) {
      var div = document.createElement('div');
      div.className = 'chat-msg user';
      div.textContent = text;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatHistory.push({ role: 'user', content: text });
    }

    function addBotMessage(text) {
      var div = document.createElement('div');
      div.className = 'chat-msg bot';
      div.innerHTML = formatMarkdown(text);
      if (div.querySelector('.chat-code-card')) {
        div.classList.add('has-code');
      }
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatHistory.push({ role: 'assistant', content: text });
      if (chatHistory.length > MAX_HISTORY * 2) {
        chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
      }
    }

    function escapeHtml(text) {
      return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatInlineMarkdown(text) {
      return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    function formatMarkdown(text) {
      var source = String(text == null ? '' : text).replace(/\r\n/g, '\n');
      var codeBlocks = [];

      source = source.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, function (_, lang, code) {
        var index = codeBlocks.length;
        var language = (lang || 'python').trim() || 'python';

        codeBlocks.push(
          '<div class="chat-code-card" data-lang="' + escapeHtml(language.toLowerCase()) + '">' +
            '<div class="chat-code-card-header">' +
              '<div class="chat-code-dots" aria-hidden="true">' +
                '<span class="dot-red"></span>' +
                '<span class="dot-yellow"></span>' +
                '<span class="dot-green"></span>' +
              '</div>' +
              '<span class="chat-code-card-title">' + escapeHtml(language) + '</span>' +
              '<span class="chat-code-card-badge">Colab</span>' +
            '</div>' +
            '<pre><code>' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>' +
          '</div>'
        );

        return '\n\n[[[CODE_BLOCK_' + index + ']]]\n\n';
      });

      var html = source
        .split(/\n{2,}/)
        .map(function (block) {
          var trimmed = block.trim();
          if (!trimmed) return '';
          if (/^\[\[\[CODE_BLOCK_\d+\]\]\]$/.test(trimmed)) return trimmed;
          return '<p>' + formatInlineMarkdown(trimmed).replace(/\n/g, '<br>') + '</p>';
        })
        .filter(Boolean)
        .join('');

      return html.replace(/\[\[\[CODE_BLOCK_(\d+)\]\]\]/g, function (_, idx) {
        return codeBlocks[Number(idx)] || '';
      });
    }

    function showTyping() { if (chatTyping) chatTyping.classList.add('visible'); }
    function hideTyping() { if (chatTyping) chatTyping.classList.remove('visible'); }

    function clearMessages() {
      chatHistory = [];
      if (chatMessages) chatMessages.innerHTML = '';
      addBotMessage('Chat reiniciado. Como posso ajudar? \uD83D\uDE0A');
    }

    /* ── Backend API ── */
    function getResponse(msg) {
      var recent = chatHistory.slice(-MAX_HISTORY);
      return fetch(CHAT_BACKEND + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: recent,
          context: 'py-' + chatContext
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      }).then(function (data) {
        return data.response || data.message || 'Sem resposta do servidor.';
      });
    }

    /* ── Mock fallback knowledge base ── */
    var PY_KNOWLEDGE = {
      print: '**print()** \u00e9 a fun\u00e7\u00e3o mais fundamental do Python.\n\n\u2022 `print("texto")` \u2014 exibe texto na tela\n\u2022 `print(variavel)` \u2014 exibe o valor da vari\u00e1vel\n\u2022 `print(f"Ol\u00e1, {nome}")` \u2014 usa f-string para interpolar valores\n\u2022 `print(a, b, sep=", ")` \u2014 controla o separador\n\u2022 `print("fim", end="")` \u2014 controla o final da linha',
      variavel: '**Vari\u00e1veis** s\u00e3o como caixinhas na mem\u00f3ria do computador.\n\n\u2022 `nome = "Maria"` \u2014 cria uma vari\u00e1vel do tipo str\n\u2022 `idade = 20` \u2014 cria uma vari\u00e1vel do tipo int\n\u2022 `altura = 1.75` \u2014 float\n\u2022 `ativo = True` \u2014 bool\n\nPython infere o tipo automaticamente (tipagem din\u00e2mica).',
      tipo: '**Tipos primitivos em Python:**\n\n\u2022 `int` \u2014 n\u00fameros inteiros: 42, -7, 0\n\u2022 `float` \u2014 decimais: 3.14, -0.5\n\u2022 `str` \u2014 texto: "ol\u00e1", \'mundo\'\n\u2022 `bool` \u2014 True ou False\n\nUse `type(x)` para verificar o tipo e `int()`, `float()`, `str()` para converter.',
      operador: '**Operadores em Python:**\n\n**Aritm\u00e9ticos:** `+` `-` `*` `/` `**` `//` `%`\n**Compara\u00e7\u00e3o:** `==` `!=` `<` `>` `<=` `>=`\n**L\u00f3gicos:** `and` `or` `not`\n**Atribui\u00e7\u00e3o:** `=` `+=` `-=` `*=` `/=`\n\nPreced\u00eancia: `()` > `**` > `* / // %` > `+ -`',
      string: '**Strings** s\u00e3o sequ\u00eancias de caracteres.\n\n\u2022 f-strings: `f"Ol\u00e1, {nome}"` \u2014 interpola\u00e7\u00e3o\n\u2022 Slicing: `texto[0:5]` \u2014 sele\u00e7\u00e3o\n\u2022 M\u00e9todos: `.upper()`, `.lower()`, `.strip()`, `.split()`, `.replace()`\n\u2022 `len(texto)` \u2014 comprimento\n\u2022 `texto[::-1]` \u2014 inverte a string',
      funcao: '**Fun\u00e7\u00f5es** organizam c\u00f3digo em blocos reutiliz\u00e1veis.\n\n```python\ndef saudacao(nome, titulo="Sr."):\n    return f"Ol\u00e1, {titulo} {nome}!"\n```\n\n\u2022 `def` define a fun\u00e7\u00e3o\n\u2022 `return` retorna um valor\n\u2022 Par\u00e2metros podem ter valores padr\u00e3o\n\u2022 Fun\u00e7\u00f5es sem return retornam `None`',
      condicional: '**Condicionais** controlam o fluxo do programa.\n\n```python\nif nota >= 7:\n    print("Aprovado")\nelif nota >= 5:\n    print("Recupera\u00e7\u00e3o")\nelse:\n    print("Reprovado")\n```\n\n\u2022 Indenta\u00e7\u00e3o define os blocos\n\u2022 `and`, `or`, `not` combinam condi\u00e7\u00f5es',
      loop: '**Loops** repetem c\u00f3digo.\n\n**for:** itera sobre sequ\u00eancias\n```python\nfor i in range(5):\n    print(i)\n```\n\n**while:** repete enquanto condi\u00e7\u00e3o for verdadeira\n```python\ncontador = 0\nwhile contador < 5:\n    print(contador)\n    contador += 1\n```\n\n\u2022 `break` sai do loop\n\u2022 `continue` pula para pr\u00f3xima itera\u00e7\u00e3o',
      lista: '**Listas** armazenam cole\u00e7\u00f5es ordenadas.\n\n```python\nfrutas = ["ma\u00e7\u00e3", "banana", "laranja"]\nfrutas.append("uva")\nprint(frutas[0])  # ma\u00e7\u00e3\n```\n\n\u2022 `append()` adiciona\n\u2022 `pop()` remove \u00faltimo\n\u2022 `sort()` ordena\n\u2022 List comprehension: `[x**2 for x in range(10)]`',
      dicionario: '**Dicion\u00e1rios** armazenam pares chave-valor.\n\n```python\naluno = {"nome": "Jo\u00e3o", "idade": 17}\nprint(aluno["nome"])\naluno["nota"] = 8.5\n```\n\n\u2022 `.keys()` \u2014 chaves\n\u2022 `.values()` \u2014 valores\n\u2022 `.items()` \u2014 pares\n\u2022 `.get(chave, padrao)` \u2014 acesso seguro',
      math: '**Biblioteca math** fornece fun\u00e7\u00f5es matem\u00e1ticas.\n\n```python\nimport math\nmath.sqrt(16)    # 4.0\nmath.pi          # 3.14159...\nmath.sin(0)      # 0.0\nmath.factorial(5) # 120\nmath.ceil(3.2)   # 4\nmath.floor(3.8)  # 3\n```',
      numpy: '**NumPy** \u00e9 a biblioteca fundamental para computa\u00e7\u00e3o num\u00e9rica.\n\n```python\nimport numpy as np\narr = np.array([1, 2, 3])\nprint(arr * 2)  # [2, 4, 6]\n```\n\n\u2022 Opera\u00e7\u00f5es vetoriais (sem loops)\n\u2022 `np.linspace()` cria sequ\u00eancias\n\u2022 `np.zeros()`, `np.ones()` arrays iniciais',
      erro: '**Tipos comuns de erro em Python:**\n\n\u2022 `SyntaxError` \u2014 erro de sintaxe (faltou `:`, indenta\u00e7\u00e3o)\n\u2022 `NameError` \u2014 vari\u00e1vel n\u00e3o definida\n\u2022 `TypeError` \u2014 opera\u00e7\u00e3o com tipo errado\n\u2022 `IndexError` \u2014 \u00edndice fora do range\n\u2022 `ValueError` \u2014 valor inv\u00e1lido\n\n**Dica:** Leia a mensagem de erro de baixo para cima!',
      input: '**input()** l\u00ea dados do usu\u00e1rio.\n\n```python\nnome = input("Seu nome: ")\nidade = int(input("Sua idade: "))\nprint(f"Ol\u00e1 {nome}, voc\u00ea tem {idade} anos")\n```\n\n\u26a0\ufe0f `input()` sempre retorna string! Use `int()` ou `float()` para converter.',
      range: '**range()** gera sequ\u00eancias de n\u00fameros.\n\n\u2022 `range(5)` \u2192 0, 1, 2, 3, 4\n\u2022 `range(2, 8)` \u2192 2, 3, 4, 5, 6, 7\n\u2022 `range(0, 10, 2)` \u2192 0, 2, 4, 6, 8\n\u2022 `range(10, 0, -1)` \u2192 10, 9, 8, ..., 1',
    };

    function getMockResponse(msg) {
      var lower = msg.toLowerCase();
      var keys = Object.keys(PY_KNOWLEDGE);
      for (var i = 0; i < keys.length; i++) {
        if (lower.indexOf(keys[i]) !== -1) return PY_KNOWLEDGE[keys[i]];
      }
      // Topic-based fallback
      if (/vari[aá]ve/i.test(lower)) return PY_KNOWLEDGE.variavel;
      if (/tipo|int|float|bool|str\b/i.test(lower)) return PY_KNOWLEDGE.tipo;
      if (/opera/i.test(lower)) return PY_KNOWLEDGE.operador;
      if (/string|texto|f-string|format/i.test(lower)) return PY_KNOWLEDGE.string;
      if (/fun[cç][aã]o|def\b|return|lambda/i.test(lower)) return PY_KNOWLEDGE.funcao;
      if (/if\b|elif|else|condiciona/i.test(lower)) return PY_KNOWLEDGE.condicional;
      if (/for\b|while|loop|repeti/i.test(lower)) return PY_KNOWLEDGE.loop;
      if (/lista|array|append|comprehension/i.test(lower)) return PY_KNOWLEDGE.lista;
      if (/dicion[aá]rio|dict|chave.*valor/i.test(lower)) return PY_KNOWLEDGE.dicionario;
      if (/math\.|sqrt|pi\b|seno|cosseno|fatorial/i.test(lower)) return PY_KNOWLEDGE.math;
      if (/numpy|np\.|vetor/i.test(lower)) return PY_KNOWLEDGE.numpy;
      if (/erro|error|bug|debug/i.test(lower)) return PY_KNOWLEDGE.erro;
      if (/input|entrada|usu[aá]rio/i.test(lower)) return PY_KNOWLEDGE.input;
      if (/range/i.test(lower)) return PY_KNOWLEDGE.range;

      return 'Boa pergunta! \uD83E\uDD14 Infelizmente estou com dificuldade para conectar ao servidor agora. Tente reformular sua pergunta mencionando o t\u00f3pico espec\u00edfico (ex: "como funciona um loop for?") ou tente novamente em instantes.';
    }

    /* ── Form submission ── */
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = chatInput.value.trim();
      if (!msg) return;

      addUserMessage(msg);
      chatInput.value = '';
      chatInput.disabled = true;
      showTyping();

      getResponse(msg)
        .then(function (response) {
          hideTyping();
          addBotMessage(response);
        })
        .catch(function () {
          hideTyping();
          addBotMessage(getMockResponse(msg));
        })
        .finally(function () {
          chatInput.disabled = false;
          chatInput.focus();
        });
    });

    /* ── Event listeners ── */
    chatFab.addEventListener('click', toggleChat);
    if (chatClose) chatClose.addEventListener('click', closeChat);
    if (chatClear) chatClear.addEventListener('click', clearMessages);
    if (chatContextClear) chatContextClear.addEventListener('click', clearContext);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chatOpen) closeChat();
    });

    /* ── Contextual chat buttons in sections ── */
    contextualBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var topic   = btn.dataset.topic || '';
        var context = btn.dataset.context || '';
        chatHistory = [];
        if (chatMessages) chatMessages.innerHTML = '';
        setContext(context, topic);
        toggleChat();
        if (chatOpen) {
          addBotMessage('Ol\u00e1! \uD83D\uDC4B Voc\u00ea est\u00e1 estudando **' + topic.split(' \u2014 ')[0] + '**. Pode me perguntar qualquer coisa sobre este t\u00f3pico!');
        }
      });
    });

    /* ── Auto-update context based on visible section ── */
    var sectionLabels = {
      intro: 'Introdu\u00e7\u00e3o ao Python',
      variaveis: 'Vari\u00e1veis e Tipos',
      operadores: 'Operadores',
      strings: 'Strings',
      'math-lib': 'Biblioteca Math',
      funcoes: 'Fun\u00e7\u00f5es',
      condicionais: 'Condicionais',
      loops: 'Loops',
      listas: 'Listas',
      numpy: 'NumPy',
      exercicios: 'Exerc\u00edcios',
      playground: 'Playground',
    };

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          if (sectionLabels[id]) {
            chatContext = id;
            if (chatContextText) chatContextText.textContent = sectionLabels[id];
          }
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach(function (sec) {
      sectionObserver.observe(sec);
    });

    /* ── Health check (non-blocking) ── */
    fetch(CHAT_BACKEND + '/health').then(function (r) {
      if (r.ok && chatStatus) chatStatus.textContent = 'Online \u2014 pronto para ajudar';
    }).catch(function () {
      if (chatStatus) chatStatus.textContent = 'Offline \u2014 usando respostas locais';
    });
  }());

  /* ─────────────────────────────────────────────────────────
     SECTION 16 — PUBLIC API
     Expose selected functions to the global scope so that
     HTML pages can call them from inline attributes or
     other script tags.
  ───────────────────────────────────────────────────────── */
  window.PyLab = {
    /** Run arbitrary Python code into an output element. */
    run: runPython,
    /** Append a line to an output element. */
    appendOutput: appendOutput,
    /** Apply a verdict to an exercise card. */
    applyFeedback: applyExerciseFeedback,
    /** Programmatically switch the app theme. */
    setTheme: setPyTheme,
    /** Create a Python CodeMirror editor inside a container. */
    createEditor: createPyEditor,
    /** Smooth-scroll to a section by id. */
    scrollTo: scrollToSection,
    /** Mark a topic as visited. */
    markVisited: markTopicVisited,
  };

}());
