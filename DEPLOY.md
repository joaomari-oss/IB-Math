# 🧮 IB Math Tutor — Guia Completo do Projeto

## 📁 Estrutura do Projeto

```
IB-Math/
├── index.html              ← Página principal (frontend)
├── css/
│   └── styles.css          ← Estilos completos (dark/light, chatbot)
├── js/
│   ├── app.js              ← Lógica do site (gráficos, exercícios, tema)
│   └── chatbot.js          ← Cliente do chatbot (conecta ao backend)
├── backend/
│   ├── server.js           ← Servidor Express (proxy da API de IA)
│   ├── package.json        ← Dependências do Node.js
│   ├── .env                ← 🔑 Suas chaves de API (NÃO committar!)
│   ├── .env.example        ← Template público do .env
│   └── .gitignore          ← Ignora node_modules e .env
└── DEPLOY.md               ← Este arquivo
```

---

## 🚀 1. Instalação Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18+ instalado
- Um editor de código (VS Code recomendado)

### Passo a passo

```bash
# 1. Clone ou baixe o projeto

# 2. Entre na pasta do backend
cd backend

# 3. Instale as dependências
npm install

# 4. Configure sua chave de API (veja seção abaixo)
# Edite o arquivo .env

# 5. Inicie o backend
npm start

# 6. Abra o index.html no navegador
# (Pode usar Live Server do VS Code, ou simplesmente abrir o arquivo)
```

O terminal mostrará:
```
═══════════════════════════════════════════
  🧮 IB Math Tutor — Backend
  📡 Servidor rodando em http://localhost:3001
  🤖 Provedor de IA: GROQ
  🔑 API Key: gsk_hMWA...
═══════════════════════════════════════════
```

---

## 🔑 2. Como Obter uma Chave de API (GRATUITA)

### Opção A: Groq (Recomendado — mais rápido)

1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta (Google login funciona)
3. No menu lateral, clique em **API Keys**
4. Clique em **Create API Key**
5. Copie a chave (começa com `gsk_`)
6. Cole no arquivo `backend/.env`:

```env
GROQ_API_KEY=gsk_SUA_CHAVE_AQUI
AI_PROVIDER=groq
```

### Opção B: Google Gemini

1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Faça login com sua conta Google
3. Clique em **Create API Key**
4. Copie a chave
5. Cole no arquivo `backend/.env`:

```env
GEMINI_API_KEY=SUA_CHAVE_AQUI
AI_PROVIDER=gemini
```

---

## 🌍 3. Deploy do Frontend (GitHub Pages)

O frontend é **estático** (HTML/CSS/JS puro), então pode ser hospedado gratuitamente no GitHub Pages.

### Passo a passo

#### 3.1. Criar repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **+** → **New repository**
3. Nome: `IB-Math` (ou o que preferir)
4. Visibilidade: **Public**
5. Clique **Create repository**

#### 3.2. Preparar os arquivos

O arquivo `.github/workflows/deploy.yml` já está no projeto — ele faz o deploy automático a cada push.

#### 3.3. Subir os arquivos

```bash
# Na pasta raiz do projeto (onde está index.html)
git init
git remote add origin https://github.com/SEU_USUARIO/IB-Math.git
git add index.html css/ js/ .github/
git commit -m "Deploy frontend"
git push -u origin main
```

**⚠️ NÃO suba a pasta `backend/` para o GitHub Pages!**

#### 3.4. Ativar Pages

1. No GitHub, vá para **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. O deploy é automático após o push
4. Aguarde o workflow terminar (1-2 minutos)
5. Sua URL será: `https://SEU_USUARIO.github.io/IB-Math/`

---

## ⚙️ 4. Deploy do Backend (Render — GRATUITO)

**⚠️ GitHub Pages NÃO roda backend/Node.js.** O backend precisa de um serviço separado.

Recomendamos o **Render** (gratuito, sem cartão de crédito).

### Passo a passo

#### 4.1. Preparar repositório do backend

Crie um **repositório separado** no GitHub ou GitLab para o backend:

```bash
cd backend
git init
git add server.js package.json .env.example .gitignore
git commit -m "Backend do IB Math Tutor"

# GitHub:
git remote add origin https://github.com/SEU_USUARIO/ib-math-backend.git
git push -u origin main
```

**⚠️ O arquivo `.env` NÃO será enviado (está no `.gitignore`). Correto!**

#### 4.2. Criar serviço no Render

1. Acesse [render.com](https://render.com) e crie uma conta
2. No Dashboard, clique em **New** → **Web Service**
3. Conecte seu GitHub/GitLab e selecione o repositório `ib-math-backend`
4. Configure:
   - **Name**: `ib-math-backend`
   - **Region**: escolha a mais próxima (ex: `Oregon` ou `Frankfurt`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ✅

#### 4.3. Configurar variável de ambiente (API Key)

No Render, após criar o serviço:

1. Vá para **Environment** (menu lateral)
2. Adicione as variáveis:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | `gsk_SuaChaveAqui` |
| `AI_PROVIDER` | `groq` |

3. Clique **Save Changes**
4. O Render vai redeployar automaticamente

#### 4.4. Obter a URL do backend

Após o deploy, o Render dará uma URL como:
```
https://ib-math-backend.onrender.com
```

Teste acessando:
```
https://ib-math-backend.onrender.com/health
```

Deve retornar: `{"status":"ok","provider":"groq",...}`

---

## 🔗 5. Conectar Frontend com Backend

Após ter a URL do backend (Render), edite o arquivo `js/chatbot.js`:

```javascript
const CHAT_CONFIG = {
  // 👇 MUDE PARA A URL DO SEU BACKEND NO RENDER
  BACKEND_URL: 'https://ib-math-backend.onrender.com',
  TIMEOUT: 15000
};
```

Depois, faça push do frontend atualizado para o GitHub:

```bash
git add js/chatbot.js
git commit -m "Conectar backend em produção"
git push
```

---

## 🧪 6. Como Testar

### Testar localmente

1. Inicie o backend: `cd backend && npm start`
2. Abra `index.html` no navegador
3. Clique no botão de chat (canto inferior direito)
4. Digite uma pergunta, ex: "O que é uma função?"
5. Se o backend estiver rodando com chave válida → resposta da IA
6. Se não → resposta mock (offline) automática

### Testar em produção

1. Acesse sua URL do GitHub Pages
2. Abra o chat
3. O status deve mostrar "IA conectada ✨"
4. Faça perguntas e verifique as respostas

### Verificar o endpoint diretamente

```bash
curl -X POST https://ib-math-backend.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "O que é uma função?", "context": "Funções"}'
```

---

## 🔄 Alternativa: Deploy no Railway

Se preferir o Railway em vez do Render:

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório do backend
4. Vá em **Variables** e adicione:
   - `GROQ_API_KEY` = sua chave
   - `AI_PROVIDER` = `groq`
5. Railway detecta automaticamente o Node.js
6. Após deploy, vá em **Settings** → **Networking** → **Generate Domain**
7. Use a URL gerada no `chatbot.js`

---

## 📋 Resumo das URLs

| O que | Onde | URL |
|-------|------|-----|
| Frontend | GitHub Pages | `https://SEU_USUARIO.github.io/IB-Math/` |
| Backend | Render | `https://ib-math-backend.onrender.com` |
| Health Check | Render | `https://ib-math-backend.onrender.com/health` |
| Chat API | Render | `POST https://ib-math-backend.onrender.com/chat` |

---

## ❓ Problemas Comuns

### "O chat responde mas não é IA"
→ O backend pode estar offline ou sem chave. Verifique `/health` e as variáveis de ambiente.

### "Erro 429 — Too many requests"
→ Limite de taxa atingido. Aguarde 1 minuto. O plano gratuito do Groq tem ~30 requisições/minuto.

### "O Render está lento na primeira requisição"
→ No plano gratuito, o Render "adormece" após 15min de inatividade. A primeira requisição pode levar ~30s para acordar.

### "CORS error no console"
→ Verifique se a URL no `chatbot.js` está correta e não tem barra final (`/`).
