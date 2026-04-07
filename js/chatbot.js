/* ═══════════════════════════════════════════════════════
   IB Math — AI Chatbot Module
   Contextual + Global Chat com Backend Node.js
   ═══════════════════════════════════════════════════════

   🔧 INTEGRAÇÃO:
   O frontend se comunica com o backend (server.js) que
   faz proxy seguro para a API de IA (Groq/Gemini).

   A chave de API fica APENAS no backend (.env).
   Se o backend estiver offline, o chat usa mock local.

   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ══════════════════════════════════════════
  //  ⚙️ CONFIGURAÇÃO DO BACKEND
  //  👉 Altere BACKEND_URL para a URL do seu backend em produção
  // ══════════════════════════════════════════

  const CHAT_CONFIG = {
    // URL do backend — mude para a URL de deploy (Render, Railway, etc.)
    // Desenvolvimento local: 'http://localhost:3001'
    BACKEND_URL: 'https://ib-math.onrender.com',

    // Tempo máximo de espera pela resposta do backend (ms)
    TIMEOUT: 15000
  };

  // ══════════════════════════════════════════
  //  ELEMENTOS DO DOM
  // ══════════════════════════════════════════

  const chatFab = document.getElementById('chatFab');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const chatClear = document.getElementById('chatClear');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatTyping = document.getElementById('chatTyping');
  const chatStatus = document.getElementById('chatStatus');
  const chatContextBar = document.getElementById('chatContextBar');
  const chatContextText = document.getElementById('chatContextText');
  const chatContextClear = document.getElementById('chatContextClear');
  const contextualBtns = document.querySelectorAll('.btn-contextual-chat');

  // ══════════════════════════════════════════
  //  ESTADO DO CHAT
  // ══════════════════════════════════════════

  let chatOpen = false;
  let currentContext = null; // null = chat geral, string = topic context
  let conversationHistory = [];
  let isProcessing = false;

  // ══════════════════════════════════════════
  //  ABRIR / FECHAR CHAT
  // ══════════════════════════════════════════

  function openChat(context) {
    chatOpen = true;
    chatFab.classList.add('active');
    chatWindow.classList.add('open');

    if (context) {
      setContext(context.topic, context.section);
    }

    // Focus input after animation
    setTimeout(() => chatInput.focus(), 350);
  }

  function closeChat() {
    chatOpen = false;
    chatFab.classList.remove('active');
    chatWindow.classList.remove('open');
  }

  function toggleChat() {
    if (chatOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // ══════════════════════════════════════════
  //  CONTEXTO
  // ══════════════════════════════════════════

  function setContext(topic, sectionId) {
    currentContext = { topic, sectionId };
    chatContextText.textContent = topic;
    chatContextBar.classList.add('visible');
    chatStatus.textContent = `Focado em: ${topic.split('—')[0].trim()}`;
  }

  function clearContext() {
    currentContext = null;
    chatContextBar.classList.remove('visible');
    chatStatus.textContent = 'Online — pronto para ajudar';
  }

  // ══════════════════════════════════════════
  //  MENSAGENS
  // ══════════════════════════════════════════

  function addMessage(text, sender, skipHistory) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.textContent = sender === 'bot' ? '∑' : '👤';

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = formatMessage(text);

    const time = document.createElement('span');
    time.className = 'chat-msg-time';
    time.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const wrapper = document.createElement('div');
    wrapper.appendChild(bubble);
    wrapper.appendChild(time);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(wrapper);
    chatMessages.appendChild(msgDiv);

    // Auto scroll
    scrollToBottom();

    // Track history
    if (!skipHistory) {
      conversationHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: text
      });
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

  function formatMessage(text) {
    // Basic markdown-like formatting with HTML escaping
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n- /g, '\n• ')
      .replace(/\n/g, '<br>');
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function showTyping() {
    chatTyping.classList.add('visible');
    scrollToBottom();
  }

  function hideTyping() {
    chatTyping.classList.remove('visible');
  }

  function clearMessages() {
    chatMessages.innerHTML = '';
    conversationHistory = [];
    addWelcomeMessage();
  }

  function addWelcomeMessage() {
    const welcomeText = currentContext
      ? `Olá! 👋 Estou aqui para ajudar com **${currentContext.topic.split('—')[0].trim()}**.\n\nPode me perguntar qualquer coisa sobre este tópico. Por exemplo:\n- "O que é...?"\n- "Me explique com um exemplo"\n- "Como resolver...?"`
      : `Olá! 👋 Sou o **IB Math Tutor**, seu assistente de matemática.\n\nPosso ajudar com qualquer tópico de **Functions & Modeling** do currículo IB. Pergunte-me sobre:\n- Funções (lineares, quadráticas, cúbicas, exponenciais)\n- Funções inversas\n- Turning points\n- Modelagem e regressão\n\nDigite sua dúvida abaixo! 📝`;

    addMessage(welcomeText, 'bot', true);
  }

  // ══════════════════════════════════════════
  //  PROCESSAR MENSAGEM DO USUÁRIO
  // ══════════════════════════════════════════

  let backendOnline = null; // null = not checked, true/false

  async function checkBackend() {
    if (backendOnline !== null) return backendOnline;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${CHAT_CONFIG.BACKEND_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      backendOnline = res.ok;
    } catch {
      backendOnline = false;
    }
    return backendOnline;
  }

  // Check backend on load (non-blocking)
  checkBackend().then(online => {
    if (online) {
      chatStatus.textContent = 'Online — IA conectada ✨';
    } else {
      chatStatus.textContent = 'Online — modo offline';
    }
  });

  async function handleUserMessage(text) {
    if (!text.trim() || isProcessing) return;

    isProcessing = true;
    addMessage(text, 'user');
    chatInput.value = '';

    showTyping();

    try {
      let response;

      // Try backend first; fall back to mock
      const online = await checkBackend();
      if (online) {
        response = await fetchBackendResponse(text);
      } else {
        response = await getMockResponse(text);
      }

      hideTyping();
      addMessage(response, 'bot');
    } catch (err) {
      hideTyping();
      // If backend failed, try mock
      try {
        const fallback = await getMockResponse(text);
        addMessage(fallback, 'bot');
      } catch {
        addMessage('Desculpe, ocorreu um erro. Tente novamente em alguns instantes.', 'bot');
      }
    }

    isProcessing = false;
  }

  // ══════════════════════════════════════════
  //  🔌 COMUNICAÇÃO COM O BACKEND
  //  O backend faz proxy seguro para a API de IA
  // ══════════════════════════════════════════

  async function fetchBackendResponse(userMessage) {
    const contextString = currentContext ? currentContext.topic : '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_CONFIG.TIMEOUT);

    const res = await fetch(`${CHAT_CONFIG.BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context: contextString
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok) {
      // If backend says API key not configured, use mock
      if (data.fallback) {
        backendOnline = false;
        return getMockResponse(userMessage);
      }
      throw new Error(data.error || 'Erro no servidor');
    }

    return data.response;
  }

  // ══════════════════════════════════════════
  //  🧪 RESPOSTAS MOCK (SIMULAÇÃO)
  //  Funciona sem API conectada
  // ══════════════════════════════════════════

  async function getMockResponse(userMessage) {
    const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const topic = currentContext ? currentContext.sectionId : null;

    // Simulated delay (feels natural)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    // ── Knowledge base by topic ──

    const responses = {
      // FUNÇÕES
      funcoes: {
        patterns: [
          { match: /o que e|que e uma|defin|conceito/, response: 'Uma **função** (function) é uma regra que associa cada elemento do domínio a **exatamente um** elemento do contradomínio.\n\nPense assim: é como uma máquina 🏭\n- Você coloca um número (entrada)\n- A máquina aplica a regra\n- Sai exatamente um resultado\n\nNotação: `f(x) = expressão`\n\nExemplo: Se `f(x) = 2x + 3`, então f(4) = 2(4) + 3 = **11**.' },
          { match: /dominio|domain/, response: 'O **domínio** (domain) é o conjunto de todos os valores que *x* pode assumir como entrada na função.\n\nExemplo:\n- `f(x) = 2x + 1` → Domínio: todos os reais (ℝ)\n- `f(x) = 1/x` → Domínio: todos os reais exceto x = 0\n- `f(x) = √x` → Domínio: x ≥ 0\n\nDica: Procure valores que causam divisão por zero ou raízes de números negativos!' },
          { match: /contra ?dominio|range|imagem/, response: 'O **contradomínio** (range) é o conjunto de todos os valores possíveis de **saída** da função.\n\nExemplos:\n- `f(x) = x²` → Range: y ≥ 0 (nunca é negativo!)\n- `f(x) = 2x + 1` → Range: todos os reais\n\nNa GDC, observe o eixo y para determinar o range.' },
          { match: /reta vertical|vertical line/, response: 'O **Teste da Reta Vertical** (Vertical Line Test) é simples:\n\nTrace retas verticais em várias posições do gráfico:\n- Se **cada reta toca no máximo 1 ponto** → É uma função ✅\n- Se **alguma reta toca 2+ pontos** → NÃO é função ❌\n\nExemplo: Um **círculo** não é função (uma vertical cruza em 2 pontos). Uma **parábola** é função!' }
        ],
        fallback: 'Sobre **funções**, os conceitos principais são:\n\n1. **Definição**: regra que associa cada entrada a uma única saída\n2. **Notação**: f(x) — "f de x"\n3. **Domínio**: valores possíveis de entrada\n4. **Contradomínio**: valores possíveis de saída\n5. **Teste da Reta Vertical**: para verificar se é função\n\nQuer que eu explique algum desses em mais detalhe?'
      },

      // LINEARES
      lineares: {
        patterns: [
          { match: /inclinacao|gradient|slope|angular/, response: 'A **inclinação** (gradient/slope) é representada por **m** na equação `y = mx + c`.\n\nEla mede o quão "inclinada" a reta é:\n- **m > 0** → reta sobe (↗️)\n- **m < 0** → reta desce (↘️)\n- **m = 0** → reta horizontal (→)\n\nFórmula com dois pontos:\n`m = (y₂ − y₁) / (x₂ − x₁)`\n\nExemplo: Pontos (1, 3) e (4, 9)\nm = (9 − 3) / (4 − 1) = 6/3 = **2**' },
          { match: /paralel/, response: 'Duas retas são **paralelas** quando têm a **mesma inclinação**:\n\n`m₁ = m₂`\n\nExemplo:\n- y = 3x + 2\n- y = 3x − 5\n\nAmbas têm m = 3, então são paralelas! Elas nunca se cruzam.' },
          { match: /perpendicular/, response: 'Duas retas são **perpendiculares** quando o produto das inclinações é **−1**:\n\n`m₁ × m₂ = −1`\n\nOu seja: `m₂ = −1/m₁`\n\nExemplo: Se uma reta tem m = 2, a perpendicular tem m = **−1/2**.\n\nDica: A perpendicular é o "negativo do inverso"!' },
          { match: /intercept|intercepto/, response: 'O **y-intercept** (intercepto) é o valor de *c* em `y = mx + c`.\n\nÉ o ponto onde a reta **cruza o eixo y**, ou seja, quando x = 0.\n\nExemplo: Em `y = 2x + 5`:\n- y-intercept = 5 → ponto (0, 5)\n\nPara encontrar o **x-intercept** (onde cruza o eixo x), faça y = 0:\n0 = 2x + 5 → x = −2.5 → ponto (−2.5, 0)' }
        ],
        fallback: 'Para **funções lineares** (`y = mx + c`):\n\n- **m** = inclinação (gradient): quão rápido y muda\n- **c** = y-intercept: onde cruza o eixo y\n- Paralelas: mesmo m\n- Perpendiculares: m₁ × m₂ = −1\n\nSobre qual aspecto quer saber mais?'
      },

      // QUADRÁTICAS
      quadraticas: {
        patterns: [
          { match: /vertice|vertex/, response: 'O **vértice** (vertex) é o ponto mais alto ou mais baixo da parábola.\n\nPara encontrá-lo em `f(x) = ax² + bx + c`:\n\n**x do vértice:** `x = −b / (2a)`\n**y do vértice:** substitua x na função\n\nExemplo: `f(x) = 2x² − 8x + 3`\n- x = −(−8) / (2×2) = 8/4 = **2**\n- y = 2(4) − 8(2) + 3 = 8 − 16 + 3 = **−5**\n- Vértice: **(2, −5)**' },
          { match: /discrimina|delta|raiz|root|zero/, response: 'O **discriminante** (Δ) determina quantas raízes a quadrática tem:\n\n`Δ = b² − 4ac`\n\n- **Δ > 0**: duas raízes reais distintas ✌️\n- **Δ = 0**: uma raiz real (raiz dupla) ☝️\n- **Δ < 0**: sem raízes reais ❌\n\n**Fórmula de Bhaskara:**\n`x = (−b ± √Δ) / (2a)`\n\nExemplo: `x² − 5x + 6 = 0`\nΔ = 25 − 24 = 1\nx = (5 ± 1) / 2 → x = **3** ou x = **2**' },
          { match: /bhaskara|formula|resolver/, response: 'A famosa **Fórmula de Bhaskara** resolve qualquer equação quadrática!\n\n`x = (−b ± √Δ) / (2a)` onde `Δ = b² − 4ac`\n\n**Passo a passo:**\n1. Identifique a, b, c\n2. Calcule Δ = b² − 4ac\n3. Se Δ ≥ 0, aplique a fórmula\n\nExemplo: `2x² + 3x − 5 = 0`\na=2, b=3, c=−5\nΔ = 9 − 4(2)(−5) = 9 + 40 = **49**\nx = (−3 ± 7) / 4\nx = 1 ou x = −2.5' },
          { match: /parabola|abre|forma/, response: 'A **parábola** tem 3 formas importantes:\n\n1. **Forma geral**: `f(x) = ax² + bx + c`\n   → Fácil ver o y-intercept (c)\n\n2. **Forma do vértice**: `f(x) = a(x − h)² + k`\n   → Fácil ver o vértice (h, k)\n\n3. **Forma fatorada**: `f(x) = a(x − r₁)(x − r₂)`\n   → Fácil ver as raízes (r₁ e r₂)\n\nSe **a > 0** → abre para cima (∪)\nSe **a < 0** → abre para baixo (∩)' }
        ],
        fallback: 'Sobre **funções quadráticas** (`f(x) = ax² + bx + c`):\n\n- Gráfico: **parábola** (U ou ∩)\n- a > 0 → abre para cima, a < 0 → abre para baixo\n- **Vértice**: x = −b/(2a)\n- **Discriminante**: Δ = b² − 4ac\n- **Bhaskara**: x = (−b ± √Δ) / (2a)\n\nQual parte quer explorar?'
      },

      // CÚBICAS
      cubicas: {
        patterns: [
          { match: /turning|retorno|maximo|minimo/, response: 'Uma função cúbica pode ter **0 ou 2 turning points**.\n\n- Se tem 2: um é **máximo local** e outro é **mínimo local**\n- Regra geral: grau n → no máximo n−1 turning points\n- Cúbica (grau 3) → máximo **2** turning points\n\nNa GDC, use as funções "maximum" e "minimum" para encontrá-los!' },
          { match: /inflexao|inflection/, response: 'O **ponto de inflexão** (point of inflection) é onde a **concavidade muda**.\n\nEm uma cúbica `f(x) = ax³ + bx² + cx + d`:\n- A concavidade muda de "côncava para cima" para "côncava para baixo" (ou vice-versa)\n- Toda cúbica tem exatamente **1 ponto de inflexão**\n\nÉ o ponto onde a curva faz a "mudança de direção" no formato S.' },
          { match: /comportamento|extremo|braco/, response: 'O **comportamento nos extremos** de uma cúbica é diferente da quadrática:\n\n- **a > 0**: parte de baixo-esquerda, vai para cima-direita (↙↗)\n- **a < 0**: parte de cima-esquerda, vai para baixo-direita (↖↘)\n\nIsso significa que os "braços" vão em **direções opostas** — diferente da parábola onde vão na mesma direção!' }
        ],
        fallback: 'Sobre **funções cúbicas** (`f(x) = ax³ + bx² + cx + d`):\n\n- Até **2 turning points** e **3 raízes**\n- Sempre tem pelo menos **1 raiz real**\n- Braços em direções **opostas**\n- Tem **1 ponto de inflexão**\n\nGostaria de saber mais sobre algum desses conceitos?'
      },

      // EXPONENCIAIS
      exponenciais: {
        patterns: [
          { match: /crescimento|growth/, response: 'O **crescimento exponencial** (exponential growth) acontece quando **b > 1** em `f(x) = a · bˣ`.\n\nCaracterísticas:\n- A função cresce cada vez **mais rápido**\n- Exemplos: populações, juros compostos, vírus\n\nExemplo prático:\nUma população de 100 bactérias que **dobra** a cada hora:\n`P(t) = 100 · 2ᵗ`\n- t=0: 100\n- t=3: 800\n- t=10: 102.400!\n\nO crescimento exponencial é muito mais rápido que o linear!' },
          { match: /decaimento|decay|meia.vida|half/, response: 'O **decaimento exponencial** (exponential decay) acontece quando **0 < b < 1**.\n\nCaracterísticas:\n- A função decresce cada vez **mais lentamente**\n- Nunca chega a zero (assíntota)\n\n**Meia-vida** (half-life): tempo para a quantidade cair pela metade.\n\nExemplo: Substância com meia-vida de 5 horas, começando com 200g:\n`M(t) = 200 · (0.5)^(t/5)`\n- t=0: 200g\n- t=5: 100g\n- t=10: 50g' },
          { match: /assintota|asymptote/, response: 'A **assíntota horizontal** (horizontal asymptote) é uma linha que o gráfico se **aproxima mas nunca toca**.\n\nPara `f(x) = a · bˣ`:\n- A assíntota é **y = 0** (o eixo x)\n- A função se aproxima cada vez mais mas nunca vale zero\n\nPara `f(x) = a · bˣ + k`:\n- A assíntota é **y = k**\n\nIsso é importante para entender o comportamento a longo prazo!' }
        ],
        fallback: 'Sobre **funções exponenciais** (`f(x) = a · bˣ`):\n\n- **b > 1**: crescimento exponencial 📈\n- **0 < b < 1**: decaimento exponencial 📉\n- **a**: valor inicial (quando x=0)\n- Tem **assíntota horizontal** em y = 0\n\nPergunta sobre crescimento, decaimento ou outro aspecto?'
      },

      // INVERSAS
      inversas: {
        patterns: [
          { match: /como encontr|como achar|passo|calcular/, response: 'Para encontrar a **função inversa** f⁻¹(x):\n\n**4 passos:**\n1. Escreva `y = f(x)`\n2. **Troque** x por y e y por x\n3. **Isole** y (resolva para y)\n4. Renomeie como f⁻¹(x)\n\n**Exemplo:** `f(x) = 3x + 6`\n1. y = 3x + 6\n2. x = 3y + 6\n3. x − 6 = 3y → y = (x − 6)/3\n4. **f⁻¹(x) = (x − 6)/3**\n\nVerificação: f(2) = 12 → f⁻¹(12) = (12−6)/3 = 2 ✓' },
          { match: /reflexao|grafico|reflect/, response: 'O gráfico de f⁻¹ é a **reflexão** do gráfico de f sobre a reta **y = x**.\n\nIsso significa:\n- Se (a, b) está no gráfico de f\n- Então (b, a) está no gráfico de f⁻¹\n\nOs pontos são "espelhados" pela diagonal!\n\nExemplo: Se f passa por (2, 5), então f⁻¹ passa por **(5, 2)**.' },
          { match: /propriedade|composi/, response: 'A **propriedade fundamental** das inversas:\n\n`f(f⁻¹(x)) = x` e `f⁻¹(f(x)) = x`\n\nIsso significa: aplicar f e depois f⁻¹ (ou vice-versa) **retorna ao valor original**.\n\nÉ como o botão "desfazer" 🔄\n\nExemplo: Se f(x) = 2x e f⁻¹(x) = x/2:\nf(f⁻¹(8)) = f(4) = 8 ✓' }
        ],
        fallback: 'Sobre **funções inversas** (f⁻¹):\n\n- f⁻¹ "desfaz" o que f faz\n- Para encontrar: troque x↔y e isole\n- Gráfico: reflexão sobre y = x\n- Propriedade: f(f⁻¹(x)) = x\n\nQual aspecto das inversas quer explorar?'
      },

      // TURNING POINTS
      'turning-points': {
        patterns: [
          { match: /maximo|maximum/, response: 'Um **máximo local** (local maximum) é um ponto onde:\n- A função **cresce** antes e **decresce** depois\n- É o ponto mais alto *na vizinhança*\n\nPara uma quadrática com a < 0, o vértice é o **máximo global**.\n\nNa GDC: use a função "maximum" para encontrá-lo automaticamente!' },
          { match: /minimo|minimum/, response: 'Um **mínimo local** (local minimum) é um ponto onde:\n- A função **decresce** antes e **cresce** depois\n- É o ponto mais baixo *na vizinhança*\n\nPara uma quadrática com a > 0, o vértice é o **mínimo global**.\n\nNa GDC: use a função "minimum" para encontrá-lo automaticamente!' },
          { match: /quantos|regra|grau/, response: 'A **regra dos turning points**:\n\nUma função de grau **n** pode ter no máximo **n − 1** turning points.\n\n- Grau 2 (quadrática) → máximo **1** turning point\n- Grau 3 (cúbica) → máximo **2** turning points\n- Grau 4 → máximo **3** turning points\n\n⚠️ Isso é o **máximo** — pode ter menos!' }
        ],
        fallback: 'Sobre **Turning Points** (pontos de retorno):\n\n- **Máximo local**: função muda de crescente → decrescente\n- **Mínimo local**: função muda de decrescente → crescente\n- **Ponto de inflexão**: onde a concavidade muda\n- **Regra**: grau n → máximo n−1 turning points\n\nQual tipo quer entender melhor?'
      },

      // MODELAGEM
      modelagem: {
        patterns: [
          { match: /r2|r quadrado|coeficiente|determinacao/, response: 'O **R²** (coeficiente de determinação) mede quão bem o modelo se ajusta aos dados.\n\n- **R² = 1** → ajuste perfeito (todos os pontos na curva)\n- **R² = 0** → sem ajuste\n\nInterpretação prática:\n- R² > 0.9 → ajuste **forte** ✅\n- R² entre 0.7 e 0.9 → ajuste **moderado**\n- R² < 0.7 → ajuste **fraco** ❌\n\nSempre busque o modelo com o **maior R²**!' },
          { match: /interpol|extrapol/, response: '**Interpolação** vs **Extrapolação**:\n\n📍 **Interpolação**: previsão **dentro** do range dos dados\n→ Mais confiável! ✅\n\n📍 **Extrapolação**: previsão **fora** do range dos dados\n→ Menos confiável! ⚠️\n\nExemplo: Se seus dados vão de x=1 a x=10:\n- Prever y quando x=5 → interpolação ✅\n- Prever y quando x=20 → extrapolação ⚠️\n\nNo IB, sempre comente sobre a confiabilidade da previsão!' },
          { match: /escolher|qual modelo|tipo/, response: 'Como **escolher o modelo correto** de regressão:\n\nObserve o formato da nuvem de pontos:\n- Pontos em **linha** → Regressão **Linear** (y = mx + c)\n- Pontos em **U ou ∩** → Regressão **Quadrática** (y = ax² + bx + c)\n- Pontos em **S** → Regressão **Cúbica**\n- Crescimento cada vez mais **rápido** → Regressão **Exponencial** (y = a · bˣ)\n\nDepois, compare os **R²** de cada modelo!' }
        ],
        fallback: 'Sobre **Modelagem** (Mathematical Modeling):\n\n**5 passos:**\n1. Coletar dados\n2. Plotar (scatter plot)\n3. Escolher tipo de função\n4. Regressão (GDC/software)\n5. Avaliar R² e fazer previsões\n\nTipos: Linear, Quadrática, Cúbica, Exponencial\n\nSobre qual etapa quer saber mais?'
      }
    };

    // ── Match response ──

    // First, try topic-specific responses
    if (topic && responses[topic]) {
      const topicData = responses[topic];
      for (const pattern of topicData.patterns) {
        if (pattern.match.test(msg)) {
          return pattern.response;
        }
      }
      return topicData.fallback;
    }

    // If no context, try all topics
    for (const [, topicData] of Object.entries(responses)) {
      for (const pattern of topicData.patterns) {
        if (pattern.match.test(msg)) {
          return pattern.response;
        }
      }
    }

    // ── Generic responses ──

    if (/ola|oi|hey|bom dia|boa tarde|boa noite/.test(msg)) {
      return 'Olá! 👋 Como posso ajudar com matemática hoje? Pode me perguntar sobre qualquer tópico de **Functions & Modeling**!';
    }

    if (/obrigad|valeu|thanks|brigad/.test(msg)) {
      return 'De nada! 😊 Fico feliz em ajudar. Continue estudando e não hesite em perguntar mais!';
    }

    if (/ajuda|help|nao entend|nao consigo|dificil/.test(msg)) {
      return 'Sem problemas! 💪 Vamos por partes. Me diga:\n\n1. Qual **tópico** você está estudando?\n2. Qual **parte específica** está gerando dúvida?\n\nAssim posso explicar de forma mais direcionada!\n\nDica: Você também pode clicar em **"Tirar dúvida sobre este conteúdo"** em cada seção para eu focar naquele tema.';
    }

    if (/exercicio|resolver|prova|questao/.test(msg)) {
      return 'Vamos resolver juntos! 📝\n\nMe diga o exercício ou questão completa, e vou te guiar **passo a passo** pela resolução.\n\nLembre-se: entender o processo é mais importante que a resposta final!';
    }

    // Default fallback
    return 'Boa pergunta! 🤔 Esse é um tópico interessante.\n\nPara eu dar a melhor explicação possível, pode ser mais específico? Por exemplo:\n- Sobre qual **tipo de função** é a dúvida?\n- Quer uma **explicação conceitual** ou ajuda para **resolver um exercício**?\n\nEstou aqui para ajudar! 📚';
  }

  // ══════════════════════════════════════════
  //  EVENT LISTENERS
  // ══════════════════════════════════════════

  // FAB click
  chatFab.addEventListener('click', toggleChat);

  // Close button
  chatClose.addEventListener('click', closeChat);

  // Clear conversation
  chatClear.addEventListener('click', () => {
    clearMessages();
  });

  // Clear context
  chatContextClear.addEventListener('click', () => {
    clearContext();
  });

  // Submit message
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserMessage(chatInput.value);
  });

  // Contextual chat buttons
  contextualBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.topic;
      const section = btn.dataset.context;

      // Clear previous messages and set new context
      conversationHistory = [];
      chatMessages.innerHTML = '';
      openChat({ topic, section });
      addWelcomeMessage();
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) closeChat();
  });

  // ── INIT ──
  addWelcomeMessage();

})();
