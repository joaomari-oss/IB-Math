/* ═══════════════════════════════════════════════════════
   IB Math — Functions & Modeling
   Main Application JavaScript
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── LOADER ──
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => loader.classList.add('hidden'), 600);
  });

  // ── THEME SYSTEM ──
  const THEMES = ['light', 'dark', 'calm', 'focus', 'nature'];
  const html = document.documentElement;
  const THEME_META = {
    light: { label: 'Claro', swatch: '#fafbfd', border: '1px solid #e5e7eb', meta: '#4f46e5' },
    dark: { label: 'Escuro', swatch: '#0c0f1a', border: '1px solid rgba(255,255,255,0.08)', meta: '#4f46e5' },
    calm: { label: 'Calm', swatch: '#EC4899', border: '1px solid rgba(236,72,153,0.28)', meta: '#EC4899' },
    focus: { label: 'Focus', swatch: '#3B82F6', border: '1px solid rgba(59,130,246,0.28)', meta: '#3B82F6' },
    nature: { label: 'Nature', swatch: '#22C55E', border: '1px solid rgba(34,197,94,0.28)', meta: '#22C55E' },
  };

  function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'light';
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('ib-math-theme', theme); } catch (e) { /* ok */ }
    const themeMeta = THEME_META[theme] || THEME_META.light;
    const themeButton = document.getElementById('themePickerBtn');
    const swatch = themeButton ? themeButton.querySelector('.theme-swatch') : null;
    const themeValue = document.getElementById('themePickerValue');
    if (swatch) {
      swatch.style.background = themeMeta.swatch;
      swatch.style.border = themeMeta.border;
    }
    if (themeValue) themeValue.textContent = themeMeta.label;
    // Update active state in panel
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeMeta.meta);
    if (themeButton) themeButton.setAttribute('aria-label', 'Escolher tema: ' + themeMeta.label);
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem('ib-math-theme');
      if (saved && THEMES.includes(saved)) return saved;
    } catch (e) { /* ok */ }
    return 'light';
  }

  setTheme(loadTheme());

  // Theme picker panel
  const themePickerBtn = document.getElementById('themePickerBtn');
  const themePanel = document.getElementById('themePanel');

  function closeThemePanel() {
    if (!themePickerBtn || !themePanel) return;
    themePanel.classList.remove('open');
    themePickerBtn.classList.remove('is-open');
    themePickerBtn.setAttribute('aria-expanded', 'false');
  }

  if (themePickerBtn && themePanel) {
    themePickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !themePanel.classList.contains('open');
      themePanel.classList.toggle('open', willOpen);
      themePickerBtn.classList.toggle('is-open', willOpen);
      themePickerBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        closeThemePanel();
        setTheme(opt.dataset.theme);
        redrawAllGraphs();
      });
    });

    document.addEventListener('click', (e) => {
      if (!themePanel.contains(e.target) && !themePickerBtn.contains(e.target)) {
        closeThemePanel();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeThemePanel();
    });
  }

  // Legacy toggle fallback (still works if old button exists)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const idx = THEMES.indexOf(current);
      setTheme(THEMES[(idx + 1) % THEMES.length]);
      redrawAllGraphs();
    });
  }

  // ── MOBILE MENU ──
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('open');
    // Close all dropdowns when menu closes
    if (!navLinks.classList.contains('open')) {
      navLinks.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

  // ── NAV DROPDOWN TOGGLE ──
  document.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.parentElement;
      const isOpen = dropdown.classList.contains('open');
      // Close all other dropdowns
      document.querySelectorAll('.nav-dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open', !isOpen);
    });
  });

  // Close dropdowns when clicking outside
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

  // ── NAVBAR SCROLL ──
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('.section, .hero');
  const navLinkElements = navLinks.querySelectorAll('a');

  function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar shadow
    navbar.classList.toggle('scrolled', scrollY > 20);

    // Progress bar
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    document.getElementById('progressFill').style.width = progress + '%';

    // Active nav link
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (scrollY >= top) current = sec.getAttribute('id');
    });

    navLinkElements.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ── REVEAL ON SCROLL ──
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── FUNCTION CALCULATOR ──
  const calcBtn = document.getElementById('calcFunc');
  const funcExpr = document.getElementById('funcExpr');
  const funcX = document.getElementById('funcX');
  const funcResultValue = document.getElementById('funcResultValue');

  calcBtn.addEventListener('click', () => {
    try {
      const x = parseFloat(funcX.value);
      if (isNaN(x)) { funcResultValue.textContent = 'Valor inválido'; return; }
      const expr = funcExpr.value
        .replace(/\^/g, '**')
        .replace(/(\d)(x)/gi, '$1*$2');
      // Safely evaluate mathematical expression
      const result = evaluateMathExpr(expr, x);
      if (result === null) {
        funcResultValue.textContent = 'Expressão inválida';
      } else {
        funcResultValue.textContent = `f(${x}) = ${Number.isInteger(result) ? result : result.toFixed(4)}`;
      }
    } catch (e) {
      funcResultValue.textContent = 'Expressão inválida';
    }
  });

  funcExpr.addEventListener('keydown', (e) => { if (e.key === 'Enter') calcBtn.click(); });
  funcX.addEventListener('keydown', (e) => { if (e.key === 'Enter') calcBtn.click(); });

  // Safe math expression evaluator (no eval)
  function evaluateMathExpr(expr, xVal) {
    try {
      expr = expr.replace(/\s/g, '');
      // Replace x with the value
      expr = expr.replace(/x/gi, '(' + xVal + ')');
      // Replace ** with pow syntax, handle basic math
      // Use Function constructor with only Math operations allowed
      const processed = expr
        .replace(/\*\*/g, '^')
        .replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, 'Math.pow($1,$2)')
        .replace(/\(([^)]+)\)\^(\d+\.?\d*)/g, 'Math.pow(($1),$2)')
        .replace(/\(([^)]+)\)\^(\([^)]+\))/g, 'Math.pow(($1),$2)');

      // Validate: only numbers, operators, parentheses, Math.pow
      const safeExpr = processed.replace(/Math\.pow/g, '');
      if (!/^[\d\s+\-*/().e,<>!=?:&|]+$/.test(safeExpr)) return null;

      const fn = new Function('return ' + processed);
      const result = fn();
      return isFinite(result) ? result : null;
    } catch (e) {
      return null;
    }
  }

  // ── MATH STUDIO ──
  const mathStudioExpr = document.getElementById('mathStudioExpr');
  const mathStudioXStart = document.getElementById('mathStudioXStart');
  const mathStudioSamples = document.getElementById('mathStudioSamples');
  const runMathStudioBtn = document.getElementById('runMathStudio');
  const clearMathStudioBtn = document.getElementById('clearMathStudio');
  const mathStudioOutput = document.getElementById('mathStudioOutput');
  const mathStudioRunFeedback = document.getElementById('mathStudioRunFeedback');

  const mathStepEls = Array.from(document.querySelectorAll('.math-step'));
  const mathStepTriggers = Array.from(document.querySelectorAll('.math-step-trigger'));
  const mathLessonProgressFill = document.getElementById('mathLessonProgressFill');
  const mathLessonProgressText = document.getElementById('mathLessonProgressText');

  const mathStepPatterns = {
    1: /\bx\b/i,
    2: /\^2|\*\*2|x\s*\*\s*x/i,
    3: /\^x|\*\*\s*x|Math\.pow/i,
    4: /\//,
    5: /\?|if\s*\(/i,
  };
  const completedMathSteps = new Set();

  function setActiveMathStep(stepNumber) {
    mathStepEls.forEach((el) => {
      el.classList.toggle('is-active', Number(el.dataset.step) === stepNumber);
    });
  }

  function unlockMathStep(stepNumber) {
    const stepEl = mathStepEls.find((item) => Number(item.dataset.step) === stepNumber);
    if (stepEl) stepEl.classList.remove('locked');
  }

  function updateMathProgressUI() {
    if (!mathStepEls.length) return;
    const done = completedMathSteps.size;
    const total = mathStepEls.length;

    if (mathLessonProgressFill) {
      mathLessonProgressFill.style.width = ((done / total) * 100) + '%';
    }
    if (mathLessonProgressText) {
      mathLessonProgressText.textContent = done + ' de ' + total + ' etapas concluídas';
    }
  }

  function evaluateMathStudioProgress(rawExpr) {
    if (!mathStepEls.length) return;

    Object.entries(mathStepPatterns).forEach(([step, pattern]) => {
      if (pattern.test(rawExpr)) {
        const stepNum = Number(step);
        completedMathSteps.add(stepNum);
        const el = mathStepEls.find((item) => Number(item.dataset.step) === stepNum);
        if (el) el.classList.add('completed');
      }
    });

    const highestDone = Math.max(0, ...Array.from(completedMathSteps));
    unlockMathStep(1);
    for (let i = 2; i <= mathStepEls.length; i++) {
      if (i <= highestDone + 1) unlockMathStep(i);
    }

    if (highestDone >= mathStepEls.length) {
      setActiveMathStep(mathStepEls.length);
      if (mathStudioRunFeedback) {
        mathStudioRunFeedback.textContent = 'Excelente: todas as etapas da trilha foram concluídas.';
      }
    } else {
      const nextStep = Math.min(mathStepEls.length, highestDone + 1);
      setActiveMathStep(nextStep);
      if (mathStudioRunFeedback) {
        mathStudioRunFeedback.textContent = 'Etapa validada. Próxima sugestão: etapa ' + nextStep + '.';
      }
    }

    updateMathProgressUI();
  }

  function runMathStudio() {
    if (!mathStudioExpr || !mathStudioOutput) return;

    const rawExpr = mathStudioExpr.value.trim();
    const xStart = Number(mathStudioXStart && mathStudioXStart.value ? mathStudioXStart.value : 0);
    let sampleCount = Number(mathStudioSamples && mathStudioSamples.value ? mathStudioSamples.value : 6);

    if (!rawExpr) {
      mathStudioOutput.innerHTML = '<div class="math-output-line"><strong>Erro:</strong> digite uma expressão para f(x).</div>';
      return;
    }

    if (!Number.isFinite(sampleCount)) sampleCount = 6;
    sampleCount = Math.min(12, Math.max(3, Math.round(sampleCount)));

    const expr = rawExpr
      .replace(/\^/g, '**')
      .replace(/(\d)(x)/gi, '$1*$2');

    const lines = [];
    for (let i = 0; i < sampleCount; i++) {
      const xValue = xStart + i;
      const yValue = evaluateMathExpr(expr, xValue);
      if (yValue === null) {
        mathStudioOutput.innerHTML = '<div class="math-output-line"><strong>Erro:</strong> expressão inválida para x = ' + xValue + '.</div>';
        if (mathStudioRunFeedback) {
          mathStudioRunFeedback.textContent = 'Ajuste a expressão e execute novamente.';
        }
        return;
      }

      const formatted = Number.isInteger(yValue) ? yValue : yValue.toFixed(4);
      lines.push('<div class="math-output-line"><strong>x = ' + xValue + '</strong> → f(x) = ' + formatted + '</div>');
    }

    mathStudioOutput.innerHTML = lines.join('');
    evaluateMathStudioProgress(rawExpr);
  }

  mathStepTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const stepEl = trigger.closest('.math-step');
      if (!stepEl || stepEl.classList.contains('locked')) return;

      const stepNumber = Number(trigger.dataset.step);
      setActiveMathStep(stepNumber);

      const template = trigger.dataset.template;
      if (template && mathStudioExpr) {
        mathStudioExpr.value = template;
        mathStudioExpr.focus();
      }

      if (mathStudioRunFeedback) {
        mathStudioRunFeedback.textContent = 'Etapa ' + stepNumber + ' pronta. Execute para validar.';
      }
    });
  });

  if (runMathStudioBtn) runMathStudioBtn.addEventListener('click', runMathStudio);
  if (clearMathStudioBtn) {
    clearMathStudioBtn.addEventListener('click', () => {
      if (mathStudioExpr) mathStudioExpr.value = '';
      if (mathStudioOutput) {
        mathStudioOutput.innerHTML = '<div class="math-output-line">Editor limpo. Selecione uma etapa à esquerda para continuar.</div>';
      }
      if (mathStudioRunFeedback) {
        mathStudioRunFeedback.textContent = 'Dica: use os templates das etapas para avançar rapidamente.';
      }
    });
  }

  updateMathProgressUI();

  // ══════════════════════════════════════════
  //  GRAPH DRAWING ENGINE
  // ══════════════════════════════════════════

  function getThemeColors() {
    const theme = html.getAttribute('data-theme');
    const isDark = theme === 'dark' || theme === 'focus';
    const palettes = {
      light:  { accent: '#4f46e5', secondary: '#0ea5e9' },
      dark:   { accent: '#4f46e5', secondary: '#0ea5e9' },
      calm:   { accent: '#EC4899', secondary: '#F472B6' },
      focus:  { accent: '#3B82F6', secondary: '#60A5FA' },
      nature: { accent: '#22C55E', secondary: '#4ADE80' }
    };
    const p = palettes[theme] || palettes.dark;
    return {
      bg: isDark ? (theme === 'focus' ? '#0B0F14' : '#0c0f1a') : (theme === 'calm' ? '#FFF1F5' : theme === 'nature' ? '#F0FDF4' : '#f1f4f9'),
      grid: isDark ? '#1e293b' : (theme === 'calm' ? '#F5D0E0' : theme === 'nature' ? '#BBF7D0' : '#e5e7eb'),
      axis: isDark ? '#334155' : '#9ca3af',
      text: isDark ? '#64748b' : '#9ca3af',
      accent: p.accent,
      secondary: p.secondary,
      line: p.accent,
      point: p.accent
    };
  }

  function drawGraph(canvas, options) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Handle high DPI
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const colors = getThemeColors();

    const xMin = options.xMin || -10;
    const xMax = options.xMax || 10;
    const yMin = options.yMin || -10;
    const yMax = options.yMax || 10;

    function toScreenX(x) { return ((x - xMin) / (xMax - xMin)) * w; }
    function toScreenY(y) { return h - ((y - yMin) / (yMax - yMin)) * h; }

    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }

    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;

    // X-axis
    if (yMin <= 0 && yMax >= 0) {
      const y0 = toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(w, y0);
      ctx.stroke();
    }

    // Y-axis
    if (xMin <= 0 && xMax >= 0) {
      const x0 = toScreenX(0);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, h);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue;
      const sx = toScreenX(x);
      const y0 = toScreenY(0);
      const labelY = Math.min(Math.max(y0 + 16, 16), h - 4);
      ctx.fillText(x, sx, labelY);
    }

    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue;
      const sy = toScreenY(y);
      const x0 = toScreenX(0);
      const labelX = Math.max(Math.min(x0 - 6, w - 4), 24);
      ctx.fillText(y, labelX, sy + 4);
    }

    // Draw functions
    if (options.functions) {
      options.functions.forEach(fnDef => {
        ctx.strokeStyle = fnDef.color || colors.line;
        ctx.lineWidth = fnDef.lineWidth || 2.5;
        ctx.setLineDash(fnDef.dash || []);
        ctx.beginPath();

        let started = false;
        const step = (xMax - xMin) / (w * 2);

        for (let x = xMin; x <= xMax; x += step) {
          const y = fnDef.fn(x);
          if (!isFinite(y) || Math.abs(y) > 1000) {
            started = false;
            continue;
          }
          const sx = toScreenX(x);
          const sy = toScreenY(y);
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw points
    if (options.points) {
      options.points.forEach(pt => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);

        ctx.fillStyle = pt.color || colors.point;
        ctx.beginPath();
        ctx.arc(sx, sy, pt.radius || 5, 0, Math.PI * 2);
        ctx.fill();

        if (pt.label) {
          ctx.fillStyle = pt.color || colors.point;
          ctx.font = '12px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(pt.label, sx + 8, sy - 8);
        }
      });
    }

    // Draw scatter data
    if (options.scatterData) {
      options.scatterData.forEach(pt => {
        const sx = toScreenX(pt[0]);
        const sy = toScreenY(pt[1]);
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // ══════════════════════════════════════════
  //  LINEAR GRAPH
  // ══════════════════════════════════════════

  const mSlider = document.getElementById('mSlider');
  const cSlider = document.getElementById('cSlider');
  const mValueEl = document.getElementById('mValue');
  const cValueEl = document.getElementById('cValue');
  const linearEqEl = document.getElementById('linearEq');
  const linearCanvas = document.getElementById('linearCanvas');

  function drawLinearGraph() {
    const m = parseFloat(mSlider.value);
    const c = parseFloat(cSlider.value);

    mValueEl.textContent = m;
    cValueEl.textContent = c;

    const sign = c >= 0 ? '+' : '−';
    linearEqEl.textContent = `f(x) = ${m}x ${sign} ${Math.abs(c)}`;

    const tc = getThemeColors();
    drawGraph(linearCanvas, {
      xMin: -8, xMax: 8,
      yMin: -12, yMax: 12,
      functions: [{
        fn: (x) => m * x + c,
        color: tc.accent
      }],
      points: [
        { x: 0, y: c, label: `(0, ${c})`, color: tc.secondary }
      ]
    });
  }

  mSlider.addEventListener('input', drawLinearGraph);
  cSlider.addEventListener('input', drawLinearGraph);

  // ══════════════════════════════════════════
  //  QUADRATIC GRAPH
  // ══════════════════════════════════════════

  const aQuadSlider = document.getElementById('aQuadSlider');
  const bQuadSlider = document.getElementById('bQuadSlider');
  const cQuadSlider = document.getElementById('cQuadSlider');
  const aQuadValue = document.getElementById('aQuadValue');
  const bQuadValue = document.getElementById('bQuadValue');
  const cQuadValue = document.getElementById('cQuadValue');
  const quadEqEl = document.getElementById('quadEq');
  const quadInfoEl = document.getElementById('quadInfo');
  const quadCanvas = document.getElementById('quadCanvas');

  function drawQuadGraph() {
    const a = parseFloat(aQuadSlider.value);
    const b = parseFloat(bQuadSlider.value);
    const c = parseFloat(cQuadSlider.value);

    aQuadValue.textContent = a;
    bQuadValue.textContent = b;
    cQuadValue.textContent = c;

    const signB = b >= 0 ? '+' : '−';
    const signC = c >= 0 ? '+' : '−';
    quadEqEl.textContent = `f(x) = ${a}x² ${signB} ${Math.abs(b)}x ${signC} ${Math.abs(c)}`;

    const vx = a !== 0 ? -b / (2 * a) : 0;
    const vy = a * vx * vx + b * vx + c;
    const disc = b * b - 4 * a * c;

    quadInfoEl.textContent = `Vértice: (${vx.toFixed(1)}, ${vy.toFixed(1)}) | Δ = ${disc.toFixed(1)}`;

    const points = [
      { x: vx, y: vy, label: `V(${vx.toFixed(1)}, ${vy.toFixed(1)})`, color: getThemeColors().secondary, radius: 6 }
    ];

    drawGraph(quadCanvas, {
      xMin: -8, xMax: 8,
      yMin: -12, yMax: 12,
      functions: [{
        fn: (x) => a * x * x + b * x + c,
        color: getThemeColors().accent
      }],
      points
    });
  }

  aQuadSlider.addEventListener('input', drawQuadGraph);
  bQuadSlider.addEventListener('input', drawQuadGraph);
  cQuadSlider.addEventListener('input', drawQuadGraph);

  // ══════════════════════════════════════════
  //  CUBIC GRAPH
  // ══════════════════════════════════════════

  const aCubicSlider = document.getElementById('aCubicSlider');
  const bCubicSlider = document.getElementById('bCubicSlider');
  const cCubicSlider = document.getElementById('cCubicSlider');
  const aCubicValue = document.getElementById('aCubicValue');
  const bCubicValue = document.getElementById('bCubicValue');
  const cCubicValue = document.getElementById('cCubicValue');
  const cubicEqEl = document.getElementById('cubicEq');
  const cubicCanvas = document.getElementById('cubicCanvas');

  function drawCubicGraph() {
    const a = parseFloat(aCubicSlider.value);
    const b = parseFloat(bCubicSlider.value);
    const c = parseFloat(cCubicSlider.value);

    aCubicValue.textContent = a;
    bCubicValue.textContent = b;
    cCubicValue.textContent = c;

    const signB = b >= 0 ? '+' : '−';
    const signC = c >= 0 ? '+' : '−';
    cubicEqEl.textContent = `f(x) = ${a}x³ ${signB} ${Math.abs(b)}x² ${signC} ${Math.abs(c)}x`;

    drawGraph(cubicCanvas, {
      xMin: -6, xMax: 6,
      yMin: -15, yMax: 15,
      functions: [{
        fn: (x) => a * x * x * x + b * x * x + c * x,
        color: getThemeColors().accent
      }]
    });
  }

  aCubicSlider.addEventListener('input', drawCubicGraph);
  bCubicSlider.addEventListener('input', drawCubicGraph);
  cCubicSlider.addEventListener('input', drawCubicGraph);

  // ══════════════════════════════════════════
  //  EXPONENTIAL GRAPH
  // ══════════════════════════════════════════

  const aExpSlider = document.getElementById('aExpSlider');
  const bExpSlider = document.getElementById('bExpSlider');
  const aExpValue = document.getElementById('aExpValue');
  const bExpValue = document.getElementById('bExpValue');
  const expEqEl = document.getElementById('expEq');
  const expInfoEl = document.getElementById('expInfo');
  const expCanvas = document.getElementById('expCanvas');

  function drawExpGraph() {
    const a = parseFloat(aExpSlider.value);
    const b = parseFloat(bExpSlider.value);

    aExpValue.textContent = a;
    bExpValue.textContent = b;

    expEqEl.textContent = `f(x) = ${a} · ${b}ˣ`;

    const type = b > 1 ? 'Crescimento (b > 1)' : b < 1 ? 'Decaimento (0 < b < 1)' : 'Constante (b = 1)';
    expInfoEl.textContent = `Tipo: ${type}`;

    drawGraph(expCanvas, {
      xMin: -5, xMax: 5,
      yMin: -2, yMax: 20,
      functions: [{
        fn: (x) => a * Math.pow(b, x),
        color: getThemeColors().accent
      }],
      points: [
        { x: 0, y: a, label: `(0, ${a})`, color: getThemeColors().secondary }
      ]
    });
  }

  aExpSlider.addEventListener('input', drawExpGraph);
  bExpSlider.addEventListener('input', drawExpGraph);

  // ══════════════════════════════════════════
  //  INVERSE FUNCTION GRAPH
  // ══════════════════════════════════════════

  const mInvSlider = document.getElementById('mInvSlider');
  const cInvSlider = document.getElementById('cInvSlider');
  const mInvValue = document.getElementById('mInvValue');
  const cInvValue = document.getElementById('cInvValue');
  const invEqEl = document.getElementById('invEq');
  const inverseCanvas = document.getElementById('inverseCanvas');

  function drawInverseGraph() {
    const m = parseFloat(mInvSlider.value);
    const c = parseFloat(cInvSlider.value);

    mInvValue.textContent = m;
    cInvValue.textContent = c;

    const signC = c >= 0 ? '+' : '−';
    invEqEl.textContent = `f(x) = ${m}x ${signC} ${Math.abs(c)}  |  f⁻¹(x) = (x ${c >= 0 ? '−' : '+'} ${Math.abs(c)})/${m}`;

    drawGraph(inverseCanvas, {
      xMin: -10, xMax: 10,
      yMin: -10, yMax: 10,
      functions: [
        {
          fn: (x) => m * x + c,
          color: getThemeColors().accent,
          lineWidth: 2.5
        },
        {
          fn: (x) => (x - c) / m,
          color: getThemeColors().secondary,
          lineWidth: 2.5
        },
        {
          fn: (x) => x,
          color: getThemeColors().text,
          lineWidth: 1,
          dash: [6, 4]
        }
      ]
    });
  }

  mInvSlider.addEventListener('input', drawInverseGraph);
  cInvSlider.addEventListener('input', drawInverseGraph);

  // ══════════════════════════════════════════
  //  REGRESSION GRAPH
  // ══════════════════════════════════════════

  const regressionCanvas = document.getElementById('regressionCanvas');
  const regEqEl = document.getElementById('regEq');
  const regressionBtns = document.querySelectorAll('.btn-toggle[data-regression]');

  // Sample data points
  const scatterData = [
    [1, 2.5], [2, 4.8], [3, 6.2], [4, 9.1], [5, 11.5],
    [6, 15.8], [7, 18.2], [8, 23.1], [9, 28.5], [10, 35.2]
  ];

  let currentRegression = 'linear';

  function drawRegressionGraph() {
    let fn, eqText;

    switch (currentRegression) {
      case 'linear':
        fn = (x) => 3.2 * x - 1.5;
        eqText = 'y = 3.2x − 1.5 (R² = 0.97)';
        break;
      case 'quadratic':
        fn = (x) => 0.35 * x * x + 0.1 * x + 1.5;
        eqText = 'y = 0.35x² + 0.1x + 1.5 (R² = 0.99)';
        break;
      case 'exponential':
        fn = (x) => 1.8 * Math.pow(1.32, x);
        eqText = 'y = 1.8 · 1.32ˣ (R² = 0.98)';
        break;
    }

    regEqEl.textContent = eqText;

    drawGraph(regressionCanvas, {
      xMin: -1, xMax: 12,
      yMin: -5, yMax: 45,
      functions: [{
        fn,
        color: getThemeColors().accent
      }],
      scatterData
    });
  }

  regressionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regressionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRegression = btn.dataset.regression;
      drawRegressionGraph();
    });
  });

  // ── DRAW ALL GRAPHS ──
  function redrawAllGraphs() {
    drawLinearGraph();
    drawQuadGraph();
    drawCubicGraph();
    drawExpGraph();
    drawInverseGraph();
    drawRegressionGraph();
  }

  // Initial draw
  redrawAllGraphs();

  // Redraw on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redrawAllGraphs, 150);
  });

  // ══════════════════════════════════════════
  //  EXERCISES
  // ══════════════════════════════════════════

  const answers = {
    1: { value: 5, explanation: 'f(4) = 3(4) − 7 = 12 − 7 = 5 ✓' },
    2: { value: -2, explanation: 'Na forma y = mx + c, m = −2 ✓' },
    3: { value: 3, explanation: 'O ponto (0, 3) indica que o y-intercept é 3 ✓' },
    4: { value: '-1/3', check: (v) => Math.abs(parseFloat(v) - (-1/3)) < 0.02 || v.replace(/\s/g,'') === '-1/3', explanation: 'm perpendicular = −1/m = −1/3 ≈ −0.33 ✓' },
    5: { value: 2, explanation: 'x = −b/(2a) = −(−4)/(2·1) = 4/2 = 2 ✓' },
    6: { value: 49, explanation: 'Δ = b² − 4ac = 9 − 4(2)(−5) = 9 + 40 = 49 ✓' },
    7: { value: 40, explanation: 'f(3) = 5 · 2³ = 5 · 8 = 40 ✓' },
    8: { value: 3, explanation: 'f⁻¹(x) = (x−8)/4 → f⁻¹(20) = (20−8)/4 = 12/4 = 3 ✓' },
    9: { value: 3, explanation: 'Máximo de turning points = grau − 1 = 4 − 1 = 3 ✓' },
    10: { value: 'c', explanation: 'R² = 0.95 está próximo de 1, indicando um ajuste forte ✓' },
    11: { value: 3, explanation: 'f(x − 3) desloca 3 unidades para a direita (contra-intuitivo!) ✓' },
    12: { value: 9, explanation: 'g(2) = 2² = 4, depois f(4) = 2(4) + 1 = 9 ✓' },
    13: { value: 9, explanation: 'x = 3 ≥ 2, então usa x²: f(3) = 3² = 9 ✓' },
    14: { value: 3, explanation: 'Quando x → ∞, (0.8)ˣ → 0, então f(x) → 5·0 + 3 = 3. Assíntota: y = 3 ✓' },
    15: { value: 4, explanation: 'Máximo de turning points = grau − 1 = 5 − 1 = 4 ✓' }
  };

  let completedExercises = new Set();

  function checkExercise(num) {
    const answer = answers[num];
    const feedbackEl = document.getElementById(`feedback-${num}`);
    const statusEl = document.getElementById(`status-${num}`);
    const card = document.querySelector(`.exercise-card[data-exercise="${num}"]`);

    let isCorrect = false;

    if (num === 10) {
      // Multiple choice - handled separately
      return;
    }

    const inputEl = document.getElementById(`answer-${num}`);
    const userValue = inputEl.value.trim();

    if (!userValue) {
      feedbackEl.textContent = 'Digite uma resposta primeiro.';
      feedbackEl.className = 'exercise-feedback show error';
      return;
    }

    if (answer.check) {
      isCorrect = answer.check(userValue);
    } else {
      isCorrect = Math.abs(parseFloat(userValue) - answer.value) < 0.01;
    }

    showExerciseFeedback(num, isCorrect, answer.explanation, feedbackEl, statusEl, card);
  }

  function showExerciseFeedback(num, isCorrect, explanation, feedbackEl, statusEl, card) {
    if (isCorrect) {
      feedbackEl.innerHTML = `<strong>Correto!</strong> ${explanation}`;
      feedbackEl.className = 'exercise-feedback show success';
      statusEl.textContent = 'Correto';
      statusEl.className = 'exercise-status correct';
      card.classList.add('correct');
      card.classList.remove('incorrect');
      completedExercises.add(num);
    } else {
      feedbackEl.innerHTML = `<strong>Incorreto.</strong> Tente novamente! Dica: ${explanation.split('=')[0]}= ?`;
      feedbackEl.className = 'exercise-feedback show error';
      statusEl.textContent = 'Incorreto';
      statusEl.className = 'exercise-status incorrect';
      card.classList.add('incorrect');
      card.classList.remove('correct');
    }

    updateExerciseProgress();
  }

  function updateExerciseProgress() {
    const total = Object.keys(answers).length;
    const done = completedExercises.size;
    const pct = (done / total) * 100;

    document.getElementById('exercisesProgressFill').style.width = pct + '%';
    document.getElementById('exercisesProgressText').textContent = `${done} de ${total} completos`;
  }

  // Input exercises
  document.querySelectorAll('.exercise-submit').forEach(btn => {
    const num = parseInt(btn.dataset.exercise);
    btn.addEventListener('click', () => checkExercise(num));
  });

  // Also allow Enter key on inputs
  document.querySelectorAll('.exercise-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = input.closest('.exercise-card');
        const num = parseInt(card.dataset.exercise);
        checkExercise(num);
      }
    });
  });

  // Multiple choice (exercise 10)
  document.querySelectorAll('.option-btn[data-exercise="10"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = 10;
      const value = btn.dataset.value;
      const answer = answers[num];
      const feedbackEl = document.getElementById(`feedback-${num}`);
      const statusEl = document.getElementById(`status-${num}`);
      const card = document.querySelector(`.exercise-card[data-exercise="${num}"]`);

      // Reset all buttons
      document.querySelectorAll('.option-btn[data-exercise="10"]').forEach(b => {
        b.classList.remove('selected', 'correct-answer', 'wrong-answer');
      });

      const isCorrect = value === answer.value;

      if (isCorrect) {
        btn.classList.add('correct-answer');
      } else {
        btn.classList.add('wrong-answer');
        // Highlight correct answer
        document.querySelector(`.option-btn[data-exercise="10"][data-value="${answer.value}"]`)
          .classList.add('correct-answer');
      }

      showExerciseFeedback(num, isCorrect, answer.explanation, feedbackEl, statusEl, card);
    });
  });

  // ══════════════════════════════════════════
  //  ACCORDION
  // ══════════════════════════════════════════
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const content = header.nextElementSibling;
      const isOpen = header.classList.contains('active');

      // Close all in same accordion
      const accordion = item.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion-header.active').forEach(h => {
          if (h !== header) {
            h.classList.remove('active');
            h.nextElementSibling.style.maxHeight = null;
          }
        });
      }

      if (isOpen) {
        header.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        header.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // ══════════════════════════════════════════
  //  TABS
  // ══════════════════════════════════════════
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const btns = tabGroup.querySelectorAll('.tab-btn');
    const panels = tabGroup.querySelectorAll('.tab-panel');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = tabGroup.querySelector(btn.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  });

})();
