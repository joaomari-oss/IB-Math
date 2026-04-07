/* ═══════════════════════════════════════════════════════════════
   IB Math Tutor — Backend Server
   Express + Groq/Gemini AI proxy
   ═══════════════════════════════════════════════════════════════

   🚀 Como rodar:
     1. npm install
     2. Edite o arquivo .env com sua chave de API
     3. npm start

   📡 Endpoints:
     POST /chat  — Envia mensagem e recebe resposta da IA
     GET  /health — Verifica se o servidor está online

   ═══════════════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ══════════════════════════════════════
//  CONFIGURAÇÃO
// ══════════════════════════════════════

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';

const PROVIDER_CONFIG = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    getKey: () => process.env.GROQ_API_KEY,
    getHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (messages, model) => ({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7
    }),
    extractResponse: (data) => {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return null;
    }
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    getKey: () => process.env.GEMINI_API_KEY,
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
    buildBody: (messages) => ({
      contents: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
      systemInstruction: {
        parts: [{ text: messages.find(m => m.role === 'system')?.content || '' }]
      },
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    }),
    extractResponse: (data) => {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    }
  }
};

// System prompts — Math & CS tutors
const MATH_SYSTEM_PROMPT = `Você é um tutor de matemática especializado no currículo IB (International Baccalaureate), módulo Functions & Modeling.

Regras:
- Responda SEMPRE em português do Brasil
- Use termos-chave em inglês entre parênteses quando relevante
- Use linguagem clara e acessível para alunos do ensino médio
- Dê exemplos práticos e visuais sempre que possível
- Use notação matemática simples (sem LaTeX complexo)
- Seja encorajador e paciente
- Se o aluno errar, guie-o para a resposta correta em vez de dar diretamente
- Mantenha respostas concisas (máximo 3-4 parágrafos)
- Quando possível, relacione conceitos com aplicações do mundo real
- Se não souber a resposta, diga honestamente e sugira o que pode ajudar`;

const CS_SYSTEM_PROMPT = `Você é um tutor de Computer Science e Programação especializado em ensinar conceitos de CS, desenvolvimento de jogos e JavaScript.

Tópicos que você domina:
- Algoritmos e complexidade (Big O: O(1), O(n), O(log n), O(n²)), busca linear, busca binária, algoritmos de ordenação (Bubble Sort, Selection Sort, Merge Sort, Quick Sort)
- Variáveis e escopo (let/const/var, block scope vs function scope, hoisting, naming conventions: camelCase, UPPER_SNAKE_CASE)
- Tipos de dados (7 primitivos JS: string, number, boolean, null, undefined, symbol, bigint; typeof quirks como typeof null === "object"; type coercion; strict vs loose equality)
- Spreadsheets (cells, formulas, referências relativas/absolutas, array de objetos)
- Estruturas de repetição — loops (for, while, do...while, for...of, break, continue)
- Operadores booleanos e lógica (AND/OR/NOT, truth tables, precedência, truthy/falsy, double negation !!)
- Controle e detecção de colisão (AABB — 4 condições, colisão circular — distância vs soma dos raios)
- Física de jogos (cinemática, gravidade, salto, deltaTime, fricção, velocidade, aceleração)
- Efeito parallax e camadas (scrolling por profundidade, multiplicadores de velocidade)
- Programação Orientada a Objetos (class, constructor, extends, super, encapsulamento, herança, polimorfismo, abstração)
- Arquitetura de jogos (game loop: Input→Update→Render, state machine, scene management)
- Tilemaps e level design (grids, tile types, Tiled editor)
- Sistemas de input (event-based vs polling, input buffer, InputManager class, teclado/mouse/gamepad)
- Vetores 2D e arrays (Vector2D, magnitude, normalize, distância; métodos de array: push, pop, map, filter, reduce, sort, find, slice, splice)
- Funções (declaração, expressão, arrow functions =>, parâmetros default, callbacks, closures)
- Strings (template literals, slice, indexOf, split, join, métodos de transformação)
- Objetos (notação literal, dot notation, bracket notation, destructuring, spread operator)
- Qualidade de software (testes unitários, testes de integração, testes end-to-end, debugging com console.log, breakpoints)
- Engenharia de software (SDLC, Waterfall vs Agile/Scrum, princípios DRY/KISS/YAGNI/SOLID, Design Patterns como Observer, refactoring)

Regras:
- Responda SEMPRE em português do Brasil
- Use termos técnicos em inglês entre parênteses quando relevante
- Inclua exemplos de código JavaScript quando apropriado
- Use linguagem acessível para estudantes do ensino médio
- Seja encorajador e forneça dicas práticas
- Se mostrar código, explique cada parte
- Mantenha respostas concisas (máximo 3-4 parágrafos)
- Relacione conceitos com jogos e aplicações reais
- Se não souber, diga honestamente`;

const PYTHON_SYSTEM_PROMPT = `Você é um tutor de Python especializado em ensinar programação para iniciantes no módulo "Lógica e Pensamento Computacional (EFB1003)".

Tópicos que você domina:
- Introdução ao Python (print(), comentários, estrutura de código, indentação, PEP 8)
- Variáveis e tipos de dados (int, float, str, bool; type(); casting com int(), float(), str(); input())
- Operadores (aritméticos +, -, *, /, **, //, %; comparação ==, !=, <, >, <=, >=; lógicos and, or, not; precedência PEMDAS; atribuição +=, -=, *=)
- Strings (f-strings, .format(), concatenação, slicing [start:end:step], métodos .upper(), .lower(), .strip(), .split(), .join(), .replace(), .find(), .count(), len())
- Biblioteca math (math.sqrt, math.pi, math.e, math.sin, math.cos, math.tan, math.log, math.log10, math.factorial, math.ceil, math.floor, math.pow, math.gcd)
- Funções (def, return, parâmetros posicionais, default, *args, **kwargs, escopo local vs global, funções como objetos de primeira classe, lambda, docstrings)
- Condicionais (if, elif, else, operadores lógicos compostos, operador ternário, match/case do Python 3.10+)
- Loops (for com range(), while, break, continue, else em loops, loops aninhados, enumerate(), zip())
- Listas (criação, indexação, slicing, append, insert, remove, pop, sort, reverse, list comprehension, listas aninhadas)
- Dicionários (criação, acesso, .keys(), .values(), .items(), .get(), .update(), dict comprehension)
- Tuplas e Sets (imutabilidade, unpacking, set operations: union, intersection, difference)
- NumPy básico (arrays, linspace, operações vetoriais, broadcasting)
- Debugging (tipos de erro: SyntaxError, TypeError, NameError, IndexError, ValueError; estratégias de debug com print())

Regras:
- Responda SEMPRE em português do Brasil
- Use termos técnicos em inglês entre parênteses quando relevante
- Inclua exemplos de código Python quando apropriado
- Explique código LINHA POR LINHA quando necessário
- Use linguagem acessível para estudantes do ensino médio
- Seja encorajador e forneça dicas práticas
- Se mostrar código, explique cada parte e a lógica por trás
- Mantenha respostas concisas (máximo 3-4 parágrafos)
- Relacione conceitos com aplicações do mundo real
- Nunca dê a resposta direta de exercícios — guie o aluno com dicas
- Se não souber, diga honestamente`;

function getSystemPrompt(context) {
  if (context && context.startsWith('py-')) return PYTHON_SYSTEM_PROMPT;
  if (context && context.startsWith('cs-')) return CS_SYSTEM_PROMPT;
  return MATH_SYSTEM_PROMPT;
}

// ══════════════════════════════════════
//  MIDDLEWARE
// ══════════════════════════════════════

// CORS — aceita requisições do frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Body parser
app.use(express.json({ limit: '16kb' }));

// Rate limiting — 30 msgs/min por IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas mensagens. Aguarde um momento antes de tentar novamente.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ══════════════════════════════════════
//  ROTAS
// ══════════════════════════════════════

// Root — info page
app.get('/', (_req, res) => {
  res.json({
    name: 'StudyLab API (Math + CS + Python)',
    status: 'online',
    endpoints: {
      'GET /health': 'Status do servidor',
      'POST /chat': 'Enviar mensagem ao tutor IA'
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: AI_PROVIDER,
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { message, context, history } = req.body;

    // Validação
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Campo "message" é obrigatório.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres).' });
    }

    // Sanitize history (max 10 messages, validate roles)
    const validHistory = Array.isArray(history)
      ? history
          .filter(m => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
      : [];

    // Provider config
    const provider = PROVIDER_CONFIG[AI_PROVIDER];
    if (!provider) {
      return res.status(500).json({ error: `Provedor "${AI_PROVIDER}" não configurado.` });
    }

    const apiKey = provider.getKey();
    if (!apiKey || apiKey === 'SUA_CHAVE_AQUI') {
      return res.status(500).json({
        error: 'Chave de API não configurada. Edite o arquivo .env com sua chave.',
        fallback: true
      });
    }

    // Build context instruction — strip routing prefix for cleaner AI context
    const systemPrompt = getSystemPrompt(context);
    const cleanContext = context ? context.replace(/^(cs|py)-/, '') : '';
    const contextInstruction = cleanContext
      ? `\n\n[CONTEXTO ATUAL: O aluno está estudando "${cleanContext}". Foque suas respostas neste tema e nos conceitos relacionados.]`
      : '';

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt + contextInstruction },
      ...validHistory,
      { role: 'user', content: message }
    ];

    // Build request URL (Gemini needs API key in URL)
    let requestUrl = provider.url;
    if (AI_PROVIDER === 'gemini') {
      requestUrl += `?key=${encodeURIComponent(apiKey)}`;
    }

    // Call AI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const apiResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: provider.getHeaders(apiKey),
      body: JSON.stringify(provider.buildBody(messages, provider.model)),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`[AI API Error] ${apiResponse.status}:`, errorBody);

      if (apiResponse.status === 429) {
        return res.status(429).json({ error: 'Limite da API atingido. Tente novamente em alguns segundos.' });
      }
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        return res.status(500).json({ error: 'Chave de API inválida. Verifique o arquivo .env.', fallback: true });
      }

      return res.status(502).json({ error: 'Erro na comunicação com a IA. Tente novamente.' });
    }

    const data = await apiResponse.json();
    const responseText = provider.extractResponse(data);

    if (!responseText) {
      console.error('[AI API] Unexpected response format:', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'Resposta inesperada da API de IA.' });
    }

    res.json({ response: responseText });

  } catch (err) {
    console.error('[Server Error]', err.message);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'A IA demorou muito para responder. Tente novamente.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
  }
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ══════════════════════════════════════
//  START
// ══════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  📚 StudyLab — Backend (Math + CS + Python)`);
  console.log(`  📡 Servidor rodando em http://localhost:${PORT}`);
  console.log(`  🤖 Provedor de IA: ${AI_PROVIDER.toUpperCase()}`);
  console.log(`  🔑 API Key: ${PROVIDER_CONFIG[AI_PROVIDER]?.getKey()?.slice(0, 8) || '❌ NÃO CONFIGURADA'}...`);
  console.log(`═══════════════════════════════════════════\n`);
});
