/* ═══════════════════════════════════════════════════════
   CS LAB — Application JavaScript
   Playground engine, exercises, chatbot, navigation
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── LOADER ─── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 400);
    }
  });

  /* ─── NAVBAR ─── */
  const navbar = document.getElementById('navbar');
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
      // Close all dropdowns when menu closes
      if (!navLinks.classList.contains('open')) {
        navLinks.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    // Dropdown toggle
    document.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.parentElement;
        const isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.nav-dropdown.open').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open', !isOpen);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('open');
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      });
    });
  }

  /* ─── THEME SYSTEM ─── */
  const CS_THEMES = ['hacker', 'light', 'dark', 'cyber', 'forest'];
  const themeChangeCallbacks = [];
  const CS_THEME_META = {
    hacker: { label: 'Hacker', swatch: 'linear-gradient(135deg, #0a0e17, #22d3ee)', border: '1px solid rgba(34,211,238,0.24)', meta: '#22d3ee' },
    light: { label: 'Claro', swatch: 'linear-gradient(135deg, #f8fafc, #6366f1)', border: '1px solid #d7deee', meta: '#6366f1' },
    dark: { label: 'Escuro', swatch: 'linear-gradient(135deg, #1a1a2e, #e94560)', border: '1px solid rgba(233,69,96,0.24)', meta: '#e94560' },
    cyber: { label: 'Cyber', swatch: 'linear-gradient(135deg, #0d0221, #ff6ec7)', border: '1px solid rgba(255,110,199,0.24)', meta: '#ff6ec7' },
    forest: { label: 'Forest', swatch: 'linear-gradient(135deg, #1a2f1a, #4ade80)', border: '1px solid rgba(74,222,128,0.24)', meta: '#4ade80' },
  };

  function setCSTheme(theme) {
    if (!CS_THEMES.includes(theme)) theme = 'hacker';
    const root = document.documentElement;
    const themeMeta = CS_THEME_META[theme] || CS_THEME_META.hacker;
    const themeButton = document.getElementById('themeToggleBtn');
    const themeValue = document.getElementById('themeToggleValue');
    const previewSwatch = themeButton ? themeButton.querySelector('.theme-swatch') : null;

    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('cs-lab-theme', theme); } catch (e) { /* ok */ }
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
    if (themeValue) themeValue.textContent = themeMeta.label;
    if (previewSwatch) {
      previewSwatch.style.background = themeMeta.swatch;
      previewSwatch.style.border = themeMeta.border;
    }
    if (themeButton) {
      themeButton.dataset.theme = theme;
      themeButton.setAttribute('aria-label', 'Mudar tema: ' + themeMeta.label);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeMeta.meta);

    requestAnimationFrame(() => {
      themeChangeCallbacks.forEach(cb => cb(theme));
      requestAnimationFrame(() => root.classList.remove('theme-switching'));
    });
  }

  function loadCSTheme() {
    try {
      const saved = localStorage.getItem('cs-lab-theme');
      if (saved && CS_THEMES.includes(saved)) return saved;
    } catch (e) { /* ok */ }
    return 'hacker';
  }

  setCSTheme(loadCSTheme());

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themePickerPanel = document.getElementById('themePickerPanel');

  function closeThemePicker() {
    if (!themeToggleBtn || !themePickerPanel) return;
    themePickerPanel.classList.remove('open');
    themeToggleBtn.classList.remove('is-open');
    themeToggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (themeToggleBtn && themePickerPanel) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !themePickerPanel.classList.contains('open');
      themePickerPanel.classList.toggle('open', willOpen);
      themeToggleBtn.classList.toggle('is-open', willOpen);
      themeToggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        closeThemePicker();
        setCSTheme(opt.dataset.theme);
      });
    });

    document.addEventListener('click', (e) => {
      if (!themePickerPanel.contains(e.target) && !themeToggleBtn.contains(e.target)) {
        closeThemePicker();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeThemePicker();
    });
  }

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);

    // Progress bar
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollMax > 0 ? (window.scrollY / scrollMax) * 100 : 0;
      progressFill.style.width = pct + '%';
    }

    // Active nav link
    updateActiveNav();
  });

  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    let currentId = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) currentId = sec.id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  /* ─── REVEAL ON SCROLL ─── */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.style.getPropertyValue('--delay') || 0;
          setTimeout(() => entry.target.classList.add('visible'), delay * 80);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ─── ACCORDION ─── */
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });

  /* ═══════════════════ INLINE CODE PLAYGROUNDS ═══════════════════ */
  document.querySelectorAll('.code-playground-inline').forEach(container => {
    const codeData = container.getAttribute('data-code') || '';

    // Build DOM
    const header = document.createElement('div');
    header.className = 'playground-inline-header';
    header.innerHTML = '<span class="inline-filename">script.js</span><button class="btn-run-inline">▶ Executar</button>';

    const editorDiv = document.createElement('div');
    editorDiv.className = 'cm-inline-wrap';

    const consoleDiv = document.createElement('div');
    consoleDiv.className = 'inline-console';
    consoleDiv.innerHTML = '<div class="inline-console-header">Console Output</div>';

    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(editorDiv);
    container.appendChild(consoleDiv);

    let inlineCm = null;
    if (typeof CodeMirror !== 'undefined') {
      inlineCm = CodeMirror(editorDiv, {
        value: codeData,
        mode: 'javascript',
        theme: getEditorTheme(),
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        tabSize: 2,
        indentWithTabs: false,
        viewportMargin: Infinity,
      });
    } else {
      // Fallback textarea
      const textarea = document.createElement('textarea');
      textarea.value = codeData;
      textarea.rows = Math.min(Math.max(codeData.split('\n').length, 3), 20);
      textarea.spellcheck = false;
      editorDiv.appendChild(textarea);
    }

    header.querySelector('.btn-run-inline').addEventListener('click', () => {
      const code = inlineCm ? inlineCm.getValue() : editorDiv.querySelector('textarea').value;
      executeInlineCode(code, consoleDiv);
    });
  });

  function executeInlineCode(code, consoleDiv) {
    const lines = [];
    consoleDiv.classList.add('visible');

    // Clear previous output (keep header)
    const header = consoleDiv.querySelector('.inline-console-header');
    consoleDiv.innerHTML = '';
    consoleDiv.appendChild(header);

    // Sandboxed execution
    const mockConsole = {
      log: (...args) => lines.push({ type: 'log', text: args.map(formatValue).join(' ') }),
      error: (...args) => lines.push({ type: 'error', text: args.map(formatValue).join(' ') }),
      warn: (...args) => lines.push({ type: 'warn', text: args.map(formatValue).join(' ') }),
    };

    try {
      const fn = new Function('console', code);
      fn(mockConsole);
    } catch (err) {
      lines.push({ type: 'error', text: 'Error: ' + err.message });
    }

    lines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'inline-console-line' + (line.type === 'error' ? ' error' : '');
      div.textContent = line.text;
      consoleDiv.appendChild(div);
    });

    if (lines.length === 0) {
      const div = document.createElement('div');
      div.className = 'inline-console-line';
      div.textContent = '(sem output)';
      consoleDiv.appendChild(div);
    }
  }

  function formatValue(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try { return JSON.stringify(val); } catch { return String(val); }
    }
    return String(val);
  }

  /* ═══════════════════ MAIN PLAYGROUND ═══════════════════ */
  const codeEditorEl = document.getElementById('codeEditor');
  const editorWrapEl = document.getElementById('cmEditorWrap');
  const runCodeBtn = document.getElementById('runCode');
  const clearEditorBtn = document.getElementById('clearEditor');
  const consoleOutput = document.getElementById('consoleOutput');
  const clearConsoleBtn = document.getElementById('clearConsole');
  const studioRunFeedback = document.getElementById('studioRunFeedback');

  const studioStepEls = Array.from(document.querySelectorAll('.studio-step'));
  const studioStepTriggers = Array.from(document.querySelectorAll('.studio-step-trigger'));
  const studioProgressFill = document.getElementById('studioLessonProgressFill');
  const studioProgressText = document.getElementById('studioLessonProgressText');

  let cmEditor = null;
  let monacoEditor = null;
  let editorEngine = 'textarea';

  const studioCompletedSteps = new Set();
  const studioValidationPatterns = {
    1: /\b(let|const|var)\b[\s\S]*console\.log\s*\(/i,
    2: /\b(for|while|do\s*\{)\b/i,
    3: /\bfunction\b|=>/i,
    4: /\bclass\b|constructor\s*\(/i,
    5: /\b(map|filter|reduce)\s*\(/i,
    6: /\b(console\.log|\?|\bif\b)\b/i,
  };

  function getEditorTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'eclipse' : 'dracula';
  }

  function getMonacoTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'vs' : 'vs-dark';
  }

  function setEditorCode(value) {
    if (monacoEditor) {
      monacoEditor.setValue(value);
      monacoEditor.focus();
      return;
    }
    if (cmEditor) {
      cmEditor.setValue(value);
      cmEditor.focus();
      return;
    }
    if (codeEditorEl) {
      codeEditorEl.value = value;
      codeEditorEl.focus();
    }
  }

  function initCodeMirrorEditor(seedCode) {
    if (!codeEditorEl || typeof CodeMirror === 'undefined') return false;
    if (cmEditor) return true;

    codeEditorEl.style.display = '';
    codeEditorEl.value = seedCode;

    cmEditor = CodeMirror.fromTextArea(codeEditorEl, {
      mode: 'javascript',
      theme: getEditorTheme(),
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      tabSize: 2,
      indentWithTabs: false,
      lineWrapping: false,
      extraKeys: {
        'Ctrl-Enter': () => executeMainPlayground(),
        'Cmd-Enter': () => executeMainPlayground(),
      }
    });

    cmEditor.setSize('100%', '100%');
    editorEngine = 'codemirror';
    return true;
  }

  function initMonacoEditor(seedCode) {
    if (!editorWrapEl || !codeEditorEl || !window.monaco) return false;

    const monacoHost = document.createElement('div');
    monacoHost.id = 'monacoEditorHost';
    monacoHost.className = 'monaco-host';
    editorWrapEl.appendChild(monacoHost);
    codeEditorEl.style.display = 'none';

    monacoEditor = window.monaco.editor.create(monacoHost, {
      value: seedCode,
      language: 'javascript',
      theme: getMonacoTheme(),
      minimap: { enabled: false },
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      lineHeight: 22,
      tabSize: 2,
      insertSpaces: true,
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      roundedSelection: true,
      padding: { top: 14, bottom: 14 },
    });

    monacoEditor.addCommand(
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter,
      () => executeMainPlayground()
    );

    editorEngine = 'monaco';
    return true;
  }

  function initMainEditor() {
    if (!codeEditorEl) return;
    const seedCode = codeEditorEl.value;

    if (window.require && typeof window.require.config === 'function') {
      window.require.config({
        paths: {
          vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
        }
      });

      window.require(
        ['vs/editor/editor.main'],
        () => {
          if (!initMonacoEditor(seedCode)) {
            initCodeMirrorEditor(seedCode);
          }
        },
        () => {
          initCodeMirrorEditor(seedCode);
        }
      );
      return;
    }

    initCodeMirrorEditor(seedCode);
  }

  initMainEditor();

  themeChangeCallbacks.push((theme) => {
    if (cmEditor) {
      cmEditor.setOption('theme', theme === 'light' ? 'eclipse' : 'dracula');
    }
    if (monacoEditor && window.monaco) {
      window.monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
      monacoEditor.layout();
    }
  });

  function getEditorCode() {
    if (monacoEditor) return monacoEditor.getValue();
    if (cmEditor) return cmEditor.getValue();
    if (codeEditorEl) return codeEditorEl.value;
    return '';
  }

  function setStudioActiveStep(stepNumber) {
    studioStepEls.forEach((stepEl) => {
      stepEl.classList.toggle('is-active', Number(stepEl.dataset.step) === stepNumber);
    });
  }

  function unlockStudioStep(stepNumber) {
    const stepEl = studioStepEls.find((item) => Number(item.dataset.step) === stepNumber);
    if (stepEl) stepEl.classList.remove('locked');
  }

  function updateStudioProgressUI() {
    if (!studioStepEls.length) return;
    const done = studioCompletedSteps.size;
    const total = studioStepEls.length;
    if (studioProgressFill) studioProgressFill.style.width = ((done / total) * 100) + '%';
    if (studioProgressText) {
      studioProgressText.textContent = done + ' de ' + total + ' etapas concluídas';
    }
  }

  function evaluateStudioProgress(code) {
    if (!studioStepEls.length) return;

    Object.entries(studioValidationPatterns).forEach(([step, pattern]) => {
      if (pattern.test(code)) {
        const stepNum = Number(step);
        studioCompletedSteps.add(stepNum);
        const stepEl = studioStepEls.find((item) => Number(item.dataset.step) === stepNum);
        if (stepEl) stepEl.classList.add('completed');
      }
    });

    const highestDone = Math.max(0, ...Array.from(studioCompletedSteps));
    unlockStudioStep(1);
    for (let i = 2; i <= studioStepEls.length; i++) {
      if (i <= highestDone + 1) unlockStudioStep(i);
    }

    if (highestDone >= studioStepEls.length) {
      setStudioActiveStep(studioStepEls.length);
      if (studioRunFeedback) {
        studioRunFeedback.textContent = 'Excelente: todas as etapas foram validadas. Continue experimentando com novos desafios.';
      }
    } else {
      const nextStep = Math.min(studioStepEls.length, highestDone + 1);
      setStudioActiveStep(nextStep);
      if (studioRunFeedback) {
        studioRunFeedback.textContent = 'Boa evolucao: etapa ' + highestDone + ' validada. Proximo passo sugerido: etapa ' + nextStep + '.';
      }
    }

    updateStudioProgressUI();
  }

  studioStepTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.studio-step');
      if (!parent || parent.classList.contains('locked')) return;

      const stepNumber = Number(trigger.dataset.step);
      setStudioActiveStep(stepNumber);
      if (studioRunFeedback) {
        studioRunFeedback.textContent = 'Etapa ' + stepNumber + ' carregada. Execute e confira o feedback no console.';
      }

      const template = trigger.dataset.template;
      if (template) setEditorCode(template);
    });
  });

  updateStudioProgressUI();

  if (runCodeBtn) runCodeBtn.addEventListener('click', executeMainPlayground);
  if (clearEditorBtn) clearEditorBtn.addEventListener('click', () => {
    if (monacoEditor) monacoEditor.setValue('');
    else if (cmEditor) cmEditor.setValue('');
    else if (codeEditorEl) codeEditorEl.value = '';

    if (studioRunFeedback) {
      studioRunFeedback.textContent = 'Editor limpo. Escolha uma etapa na esquerda para continuar a trilha.';
    }
  });
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => {
    if (consoleOutput) consoleOutput.innerHTML = '<div class="console-line info">// Console limpo</div>';
  });

  function executeMainPlayground() {
    if (!consoleOutput) return;
    const code = getEditorCode();
    consoleOutput.innerHTML = '';

    const lines = [];
    const mockConsole = {
      log: (...args) => lines.push({ type: 'log', text: args.map(formatValue).join(' ') }),
      error: (...args) => lines.push({ type: 'error', text: args.map(formatValue).join(' ') }),
      warn: (...args) => lines.push({ type: 'warn', text: args.map(formatValue).join(' ') }),
    };

    try {
      const fn = new Function('console', code);
      fn(mockConsole);
    } catch (err) {
      lines.push({ type: 'error', text: '❌ ' + err.name + ': ' + err.message });
    }

    if (lines.length === 0) {
      lines.push({ type: 'info', text: '// Código executado (sem output)' });
    }

    lines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'console-line ' + line.type;
      div.textContent = line.text;
      consoleOutput.appendChild(div);
    });

    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    evaluateStudioProgress(code);
  }

  /* ═══════════════════ EXERCISES ═══════════════════ */
  const TOTAL_EXERCISES = 30;
  const exerciseState = {};

  // Answer key
  const ANSWERS = {
    1: 'b',    // O(n)
    2: 'b',    // const não pode ser reatribuído
    3: '53',   // "5" + 3 = "53"
    4: '5',    // for (let i = 0; i < 5; i++) = 5 times
    5: 'a',    // true && false || true = true
    6: '4',    // AABB needs all 4 conditions
    7: 'b',    // posição += velocidade × deltaTime
    8: 'b',    // Compilação is NOT OOP pillar
    9: 'b',    // Input → Update → Render
    10: 'c',   // .filter()
    13: 'b',   // DRY
    14: 'b',   // Mais devagar
    15: 'b',   // Teste unitário
    16: 'b',   // typeof null = "object"
    17: 'b',   // [2,4,6]
    18: 'c',   // O(log n)
    19: '15',  // 10 + 5 = 15
    20: 'b',   // do...while executa pelo menos uma vez
    21: 'a',   // !!"0" = true
    22: 'b',   // constructor(name)
    23: '6',   // 1+2+3 = 6
    24: 'a',   // arrow function
    26: 'Java', // "JavaScript".slice(0,4) = "Java"
    27: 'c',   // Merge Sort
    28: 'b',   // user.name
    30: 'b',   // Refactoring = melhorar estrutura
  };

  const EXPLANATIONS = {
    1: 'O(n) — um loop simples que percorre n elementos cresce linearmente.',
    2: 'const não pode ser reatribuído após a declaração. let permite reatribuição.',
    3: '"5" + 3 = "53" — o operador + com string faz concatenação, não soma.',
    4: 'i começa em 0 e vai até < 5, executando 5 vezes (0, 1, 2, 3, 4).',
    5: '(true && false) || true = false || true = true. AND tem precedência sobre OR.',
    6: 'AABB precisa de 4 condições (duas por eixo) verdadeiras simultaneamente.',
    7: 'A posição é atualizada somando velocidade × deltaTime a cada frame.',
    8: 'Os 4 pilares da OOP são: Encapsulamento, Herança, Polimorfismo e Abstração.',
    9: 'Input (ler input) → Update (atualizar lógica) → Render (desenhar) é a ordem padrão.',
    10: '.filter() retorna um novo array com apenas os elementos que passam no teste.',
    13: 'DRY = Don\'t Repeat Yourself — evite duplicação de código.',
    14: 'Camadas mais distantes se movem mais devagar, criando a ilusão de profundidade.',
    15: 'Teste unitário verifica uma única função ou método isoladamente.',
    16: 'typeof null retorna "object" — um bug histórico do JavaScript que nunca foi corrigido.',
    17: '.map(x => x * 2) multiplica cada elemento por 2: [1*2, 2*2, 3*2] = [2,4,6].',
    18: 'Busca binária divide o espaço pela metade a cada passo: O(log n).',
    19: 'x += 5 é equivalente a x = x + 5, então 10 + 5 = 15.',
    20: 'do...while sempre executa o bloco pelo menos uma vez antes de verificar a condição.',
    21: '"0" é uma string não vazia, que é truthy. !!"0" = !!true = true.',
    22: 'Em JavaScript, o construtor de uma classe é definido com o método especial constructor().',
    23: 'reduce soma: 0 + 1 = 1, 1 + 2 = 3, 3 + 3 = 6. Resultado: 6.',
    24: 'Arrow function: (params) => expressão. É a sintaxe concisa do ES6.',
    26: 'slice(0, 4) extrai do índice 0 até 4 (exclusive): "Java".',
    27: 'Merge Sort usa divisão e conquista, garantindo O(n log n) no caso médio e pior caso.',
    28: 'Notação de ponto (user.name) ou colchetes (user["name"]) acessam propriedades.',
    30: 'Refactoring = reestruturar o código interno sem alterar seu comportamento externo.',
  };

  // Option buttons
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.getAttribute('data-exercise');
      const val = btn.getAttribute('data-value');
      if (exerciseState[exId]) return;
      checkExercise(exId, val, btn);
    });
  });

  // Input exercises
  document.querySelectorAll('.exercise-submit').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.getAttribute('data-exercise');
      if (exerciseState[exId]) return;
      const input = document.getElementById('cs-answer-' + exId);
      if (input) checkExercise(exId, input.value.trim(), btn);
    });
  });

  // Also allow Enter key on inputs
  document.querySelectorAll('.exercise-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const submitBtn = input.parentElement.querySelector('.exercise-submit');
        if (submitBtn) submitBtn.click();
      }
    });
  });

  function checkExercise(exId, answer, clickedBtn) {
    const correct = ANSWERS[exId];
    if (!correct) return;

    const isCorrect = answer.toLowerCase() === correct.toLowerCase();
    exerciseState[exId] = isCorrect ? 'correct' : 'wrong';

    const card = clickedBtn.closest('.exercise-card');
    const statusEl = document.getElementById('cs-status-' + exId);
    const feedbackEl = document.getElementById('cs-feedback-' + exId);

    card.classList.add(isCorrect ? 'correct' : 'wrong');
    statusEl.textContent = isCorrect ? 'Correto ✓' : 'Incorreto ✗';
    statusEl.className = 'exercise-status ' + (isCorrect ? 'correct' : 'wrong');

    feedbackEl.textContent = (isCorrect ? '✅ ' : '❌ ') + (EXPLANATIONS[exId] || '');
    feedbackEl.className = 'exercise-feedback visible ' + (isCorrect ? 'correct' : 'wrong');

    // Disable all options in this exercise
    card.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.getAttribute('data-value') === correct) b.classList.add('correct-answer');
    });
    if (clickedBtn.classList.contains('option-btn')) {
      clickedBtn.classList.add('selected', isCorrect ? 'correct' : 'wrong');
    }

    updateExerciseProgress();
  }

  // Code challenges
  document.querySelectorAll('.challenge-run').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.getAttribute('data-exercise');
      if (exerciseState[exId]) return;
      const textarea = document.getElementById('challenge-' + exId);
      if (!textarea) return;

      const code = textarea.value;
      const lines = [];
      const mockConsole = {
        log: (...args) => lines.push(args.map(formatValue).join(' ')),
        error: (...args) => lines.push('Error: ' + args.map(formatValue).join(' ')),
      };

      let passed = false;
      try {
        const fn = new Function('console', code + '\nreturn { maiorValor: typeof maiorValor === "function" ? maiorValor : null, inverterString: typeof inverterString === "function" ? inverterString : null, ehPar: typeof ehPar === "function" ? ehPar : null, contarVogais: typeof contarVogais === "function" ? contarVogais : null };');
        const result = fn(mockConsole);

        if (exId === '11' && result.maiorValor) {
          passed = result.maiorValor([3, 7, 1, 9, 4]) === 9 && result.maiorValor([-5, -2, -8]) === -2;
        } else if (exId === '12' && result.inverterString) {
          passed = result.inverterString('hello') === 'olleh' && result.inverterString('JavaScript') === 'tpircSavaJ';
        } else if (exId === '25' && result.ehPar) {
          passed = result.ehPar(4) === true && result.ehPar(7) === false && result.ehPar(0) === true;
        } else if (exId === '29' && result.contarVogais) {
          passed = result.contarVogais('hello') === 2 && result.contarVogais('JavaScript') === 3 && result.contarVogais('xyz') === 0;
        }
      } catch (err) {
        lines.push('Error: ' + err.message);
      }

      exerciseState[exId] = passed ? 'correct' : 'wrong';

      const card = btn.closest('.exercise-card');
      const statusEl = document.getElementById('cs-status-' + exId);
      const feedbackEl = document.getElementById('cs-feedback-' + exId);

      card.classList.add(passed ? 'correct' : 'wrong');
      statusEl.textContent = passed ? 'Correto ✓' : 'Incorreto ✗';
      statusEl.className = 'exercise-status ' + (passed ? 'correct' : 'wrong');

      let feedbackText = passed
        ? '✅ Parabéns! Todos os testes passaram.'
        : '❌ Os testes não passaram. ';
      if (lines.length > 0) feedbackText += 'Output: ' + lines.join(', ');
      if (!passed) feedbackText += ' Tente novamente (recarregue a página).';

      feedbackEl.textContent = feedbackText;
      feedbackEl.className = 'exercise-feedback visible ' + (passed ? 'correct' : 'wrong');

      updateExerciseProgress();
    });
  });

  function updateExerciseProgress() {
    const done = Object.values(exerciseState).filter(v => v === 'correct').length;
    const fill = document.getElementById('csExProgressFill');
    const text = document.getElementById('csExProgressText');
    if (fill) fill.style.width = (done / TOTAL_EXERCISES * 100) + '%';
    if (text) text.textContent = done + ' de ' + TOTAL_EXERCISES + ' completos';
  }

  /* ═══════════════════ CHATBOT ═══════════════════ */
  const CHAT_CONFIG = {
    BACKEND_URL: 'https://ib-math.onrender.com',
    MAX_HISTORY: 10,
  };

  const chatFab = document.getElementById('chatFab');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const chatClear = document.getElementById('chatClear');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatTyping = document.getElementById('chatTyping');
  const chatStatus = document.getElementById('chatStatus');
  const chatContextText = document.getElementById('chatContextText');
  const chatContextClear = document.getElementById('chatContextClear');

  let chatHistory = [];
  let chatContext = 'geral';

  if (chatFab) {
    chatFab.addEventListener('click', toggleChat);
  }
  if (chatClose) chatClose.addEventListener('click', toggleChat);
  if (chatClear) chatClear.addEventListener('click', clearChat);
  if (chatContextClear) chatContextClear.addEventListener('click', () => {
    chatContext = 'geral';
    if (chatContextText) chatContextText.textContent = 'Chat Geral';
  });

  function toggleChat() {
    chatFab.classList.toggle('active');
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open') && chatMessages.children.length === 0) {
      addBotMessage('Olá! 👋 Sou o **CS Tutor**, seu assistente de Computer Science. Pergunte sobre programação, algoritmos, lógica, game dev, ou qualquer tópico do curso!');
    }
  }

  function clearChat() {
    chatHistory = [];
    if (chatMessages) chatMessages.innerHTML = '';
    addBotMessage('Chat reiniciado. Como posso ajudar?');
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = chatInput.value.trim();
      if (!msg) return;

      addUserMessage(msg);
      chatInput.value = '';
      chatInput.disabled = true;

      showTyping();

      try {
        const response = await getResponse(msg);
        hideTyping();
        addBotMessage(response);
      } catch {
        hideTyping();
        addBotMessage(getMockResponse(msg));
      }
      chatInput.disabled = false;
      chatInput.focus();
    });
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatHistory.push({ role: 'user', content: text });
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = formatMarkdown(text);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatHistory.push({ role: 'assistant', content: text });
    if (chatHistory.length > CHAT_CONFIG.MAX_HISTORY * 2) {
      chatHistory = chatHistory.slice(-CHAT_CONFIG.MAX_HISTORY * 2);
    }
  }

  function showTyping() { if (chatTyping) chatTyping.classList.add('visible'); }
  function hideTyping() { if (chatTyping) chatTyping.classList.remove('visible'); }

  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  async function getResponse(msg) {
    const recent = chatHistory.slice(-CHAT_CONFIG.MAX_HISTORY);
    const res = await fetch(CHAT_CONFIG.BACKEND_URL + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        history: recent,
        context: 'cs-' + chatContext
      })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.response || data.message || 'Sem resposta do servidor.';
  }

  /* ─── MOCK RESPONSES (fallback) ─── */
  const CS_KNOWLEDGE = {
    algoritmo: 'Um **algoritmo** é uma sequência finita de instruções que resolve um problema. Os principais conceitos são:\n\n• **Big O** — mede eficiência (O(1), O(n), O(n²), O(log n))\n• **Busca Linear** — O(n), percorre item por item\n• **Busca Binária** — O(log n), divide e conquista\n• **Pseudocódigo** — escrever lógica sem se prender a uma linguagem',
    variavel: '**Variáveis** são contêineres na memória com um nome:\n\n• `let` — pode ser reatribuída\n• `const` — constante, não muda\n• `var` — forma antiga, evitar\n\n**Escopo:** `let`/`const` = bloco, `var` = função. Use nomes descritivos em camelCase.',
    tipo: '**Tipos primitivos em JS:**\n• String, Number, Boolean, Undefined, Null, Symbol, BigInt\n\n⚠️ **Type Coercion:** `"5" + 3 = "53"` (concatenação) mas `"5" - 3 = 2` (subtração)\n\nSempre use `===` (estrita) em vez de `==` (frouxa).',
    loop: '**Loops** repetem código:\n• `for (let i = 0; i < n; i++)` — quando sabe quantas vezes\n• `while (condição)` — quando não sabe\n• `do...while` — executa pelo menos uma vez\n• `for...of` — iterar arrays',
    boolean: '**Operadores booleanos:**\n• `&&` (AND) — ambos true\n• `||` (OR) — pelo menos um true\n• `!` (NOT) — inverte\n\nPrecedência: NOT > AND > OR',
    colisao: '**Colisão AABB:** 4 condições simultâneas:\n`A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y`\n\n**Colisão circular:** `distância < raio1 + raio2`',
    fisica: '**Física de jogos:**\n• `posição += velocidade × dt`\n• `velocidade += aceleração × dt`\n• **Gravidade:** velocidade y aumenta a cada frame\n• **Fricção:** `velocidade *= fator` (0 < fator < 1)',
    parallax: '**Parallax:** camadas distantes movem mais devagar. Cada camada tem multiplicador de 0.1 (fundo) a 1.0 (frente). Cria ilusão de profundidade em jogos 2D.',
    oop: '**OOP — 4 Pilares:**\n• **Encapsulamento** — esconder detalhes internos\n• **Herança** — filha herda do pai (extends)\n• **Polimorfismo** — mesmo método, comportamentos diferentes\n• **Abstração** — modelar o essencial',
    game: '**Game Loop:** `Input → Update → Render` repetido ~60x/seg.\n**State Machine:** Menu → Playing → Paused → GameOver\n\nCada estado tem `entrar()`, `atualizar()` e `sair()`.',
    tile: '**Tilemaps** representam o mapa como grade 2D de números. Cada número = um tipo de tile (chão, parede, moeda, etc). Engines como Tiled exportam JSON que o jogo carrega.',
    input: '**Input em jogos:**\n• **Event-based** — keydown/keyup para ações únicas\n• **Polling** — verificar estado a cada frame para movimento contínuo\n• Use um `InputManager` que rastreia teclas pressionadas',
    array: '**Arrays essenciais:**\n• `.push()` — adicionar\n• `.map()` — transformar\n• `.filter()` — filtrar\n• `.reduce()` — reduzir\n• `.sort()` — ordenar\n\n**Vector2D** para jogos: posição, velocidade, direção.',
    qualidade: '**Testes:**\n• **Unitário** — testa uma função isolada\n• **Integração** — testa componentes juntos\n• **E2E** — testa fluxo completo\n\n**Debugging:** use console.log para rastrear valores.',
    engenharia: '**SDLC:** Requisitos → Design → Implementação → Testes → Deploy → Manutenção\n**Agile vs Waterfall**\n**Princípios:** DRY, KISS, SOLID\n**Design Patterns:** Observer, Singleton, Factory',
    spreadsheet: '**Planilhas** organizam dados em linhas × colunas. Em código, representamos como arrays de objetos. Métodos úteis: `.map()`, `.reduce()`, `.filter()`.',
  };

  function getMockResponse(msg) {
    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(CS_KNOWLEDGE)) {
      if (lower.includes(key)) return val;
    }
    // Generic patterns
    if (lower.match(/ol[áa]|oi|hey|eai|bom dia|boa tarde|boa noite/)) {
      return 'Olá! 👋 Como posso ajudar com seus estudos de Computer Science? Pode perguntar sobre algoritmos, variáveis, loops, OOP, game dev, ou qualquer outro tópico!';
    }
    if (lower.match(/obrigad|valeu|thanks/)) {
      return 'De nada! 😊 Continue praticando — programação se aprende fazendo. Se tiver mais dúvidas, estou aqui!';
    }
    if (lower.match(/javascript|js/)) {
      return 'JavaScript é a linguagem que usamos neste curso! É versátil: funciona no navegador (front-end), servidor (Node.js), e até em jogos. Qual aspecto quer explorar?';
    }
    if (lower.match(/ajuda|help|como|what|qual|o que/)) {
      return 'Posso ajudar com qualquer tópico do curso:\n\n• Algoritmos & Big O\n• Variáveis & Tipos\n• Loops & Booleanos\n• Colisão & Física\n• OOP & Herança\n• Game Loop & States\n• Arrays & Vetores\n• Qualidade & Engenharia\n\nO que quer aprender? 🚀';
    }
    return 'Interessante! 🤔 Para te dar a melhor resposta, tente ser mais específico. Exemplos:\n• "Explica AABB"\n• "Como funciona um loop for?"\n• "O que é OOP?"\n• "Diferença entre let e const"';
  }

  // Update context based on visible section
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const labels = {
            algoritmos: 'Algoritmos', variaveis: 'Variáveis',
            'tipos-dados': 'Tipos de Dados', spreadsheets: 'Spreadsheets',
            loops: 'Loops', booleanos: 'Booleanos',
            'controle-colisao': 'Colisão', 'game-physics': 'Física',
            parallax: 'Parallax', oop: 'OOP',
            'game-arch': 'Arquitetura', tiled: 'Mapas',
            input: 'Input', arrays: 'Arrays',
            qualidade: 'Qualidade', engenharia: 'Engenharia',
            playground: 'Playground', exercicios: 'Exercícios',
          };
          if (labels[id]) {
            chatContext = id;
            if (chatContextText) chatContextText.textContent = labels[id];
          }
        }
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll('section[id]').forEach(sec => sectionObserver.observe(sec));

})();
