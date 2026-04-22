import { useState, useEffect, useCallback } from "react";

// ─── Minimal in-memory DB ──────────────────────────────────────────────────
const DB = {
  users: [],
  contents: [],
  sessions: {},
  nextUserId: 1,
  nextContentId: 1,
};

function hashPassword(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = ((h << 5) - h + p.charCodeAt(i)) | 0;
  return "hash_" + Math.abs(h).toString(36);
}

function getUser(email) {
  return DB.users.find((u) => u.email === email);
}

function getDailyCount(userId) {
  const today = new Date().toDateString();
  return DB.contents.filter(
    (c) => c.user_id === userId && new Date(c.data_criacao).toDateString() === today
  ).length;
}

// ─── Anthropic API call ────────────────────────────────────────────────────
async function callClaude(prompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt || "Você é um especialista em marketing digital e criação de conteúdo viral para redes sociais. Responda sempre em português brasileiro.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ─── Image placeholder generator (HD/4K simulated) ────────────────────────
function generateImageUrl(prompt, resolution) {
  const seed = Math.abs([...prompt].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0));
  const size = resolution === "4K" ? "1280/720" : "640/360";
  const colors = ["7B5CFF", "5C3DFF", "9B7BFF", "FF5C9B", "5CFFB8", "FFB85C"];
  const col = colors[seed % colors.length];
  const bg = "0D0D0D";
  const enc = encodeURIComponent(prompt.slice(0, 40));
  return `https://placehold.co/${size}/${bg}/${col}?text=${enc}`;
}

// ─── Content generators ───────────────────────────────────────────────────
async function generatePost(nicho, tema, tom, objetivo) {
  const prompt = `Crie um post viral para redes sociais sobre "${tema}" no nicho "${nicho}".
Tom: ${tom}. Objetivo: ${objetivo}.
Retorne EXATAMENTE neste formato JSON (sem markdown):
{"gancho":"...","legenda":"...","cta":"...","hashtags":"..."}`;
  try {
    const raw = await callClaude(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      gancho: `🔥 ${tema} vai mudar tudo no nicho de ${nicho}!`,
      legenda: `Você sabia que dominar ${tema} pode transformar seus resultados em ${nicho}? Hoje vou te mostrar exatamente como fazer isso de forma prática e eficiente. Não perca essa oportunidade única de elevar seu jogo!`,
      cta: `👇 Salva esse post e compartilha com quem precisa ver!`,
      hashtags: `#${nicho.replace(/ /g,"")} #${tema.replace(/ /g,"")} #ContentMarketing #ViralContent #Marketing`,
    };
  }
}

async function generateCarousel(nicho, tema, tom) {
  const prompt = `Crie um carrossel viral de 5 slides sobre "${tema}" no nicho "${nicho}". Tom: ${tom}.
Retorne EXATAMENTE neste formato JSON (sem markdown):
{"slides":[{"titulo":"...","texto":"...","prompt_imagem":"..."},{"titulo":"...","texto":"...","prompt_imagem":"..."},{"titulo":"...","texto":"...","prompt_imagem":"..."},{"titulo":"...","texto":"...","prompt_imagem":"..."},{"titulo":"...","texto":"...","prompt_imagem":"..."}]}`;
  try {
    const raw = await callClaude(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      slides: [
        { titulo: `${tema}: O que ninguém te conta`, texto: `A verdade sobre ${tema} que vai mudar sua perspectiva em ${nicho}.`, prompt_imagem: `${tema} digital art vibrant` },
        { titulo: "O Problema", texto: `A maioria das pessoas em ${nicho} erra aqui: ignoram ${tema} completamente.`, prompt_imagem: `problem solving abstract` },
        { titulo: "A Solução", texto: `Com a técnica certa, você pode dominar ${tema} em menos de 30 dias.`, prompt_imagem: `solution success abstract` },
        { titulo: "Passo a Passo", texto: `1️⃣ Estude o básico\n2️⃣ Pratique diariamente\n3️⃣ Analise resultados\n4️⃣ Escale o que funciona`, prompt_imagem: `steps ladder success` },
        { titulo: "Resultado Final", texto: `Seguindo esse método, você vai se tornar referência em ${nicho}!`, prompt_imagem: `success achievement celebration` },
      ],
    };
  }
}

async function generateVideo(nicho, tema, tom, objetivo) {
  const prompt = `Crie um roteiro de vídeo viral sobre "${tema}" no nicho "${nicho}". Tom: ${tom}. Objetivo: ${objetivo}.
Retorne EXATAMENTE neste formato JSON (sem markdown):
{"hook":"...","introducao":"...","desenvolvimento":"...","cta":"...","duracao_estimada":"..."}`;
  try {
    const raw = await callClaude(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      hook: `Você vai parar tudo que está fazendo quando ver isso sobre ${tema}...`,
      introducao: `Olá! Hoje vou revelar os segredos de ${tema} que os especialistas em ${nicho} não querem que você saiba.`,
      desenvolvimento: `[0:30] Problema principal\n[1:00] Por que ${tema} importa em ${nicho}\n[2:00] Método exclusivo\n[3:00] Casos reais\n[4:00] Erros comuns`,
      cta: `Se esse vídeo te ajudou, curte, compartilha e se inscreve para mais conteúdo sobre ${nicho}!`,
      duracao_estimada: "5-7 minutos",
    };
  }
}

async function generateThumbnail(nicho, tema, tom) {
  const prompt = `Crie um conceito de thumbnail impactante para "${tema}" no nicho "${nicho}". Tom: ${tom}.
Retorne EXATAMENTE neste formato JSON (sem markdown):
{"titulo":"...","subtitulo":"...","prompt_imagem":"...","cores_sugeridas":"..."}`;
  try {
    const raw = await callClaude(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      titulo: tema.toUpperCase(),
      subtitulo: `O guia definitivo de ${nicho}`,
      prompt_imagem: `${tema} professional thumbnail eye-catching`,
      cores_sugeridas: "#7B5CFF, #FFB800, #FFFFFF",
    };
  }
}

// ─── Styled constants ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0D0D0D;--surface:#111111;--card:#181818;--border:#232323;
    --purple:#7B5CFF;--purple-light:#9B7BFF;--purple-dark:#5C3DFF;
    --text:#F0F0F0;--muted:#888;--dim:#555;
    --green:#00E5A0;--red:#FF5C73;--yellow:#FFB800;
  }
  body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
  h1,h2,h3,.display{font-family:'Syne',sans-serif}
  
  .app{display:flex;min-height:100vh}
  
  /* Sidebar */
  .sidebar{width:240px;background:var(--surface);border-right:1px solid var(--border);
    display:flex;flex-direction:column;padding:24px 0;position:fixed;height:100vh;z-index:50}
  .logo{padding:0 24px 32px;font-family:'Syne',sans-serif;font-size:20px;font-weight:800;
    background:linear-gradient(135deg,var(--purple),var(--purple-light));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .logo span{font-weight:400;opacity:.7}
  .nav-section{padding:0 12px;flex:1}
  .nav-label{font-size:10px;font-weight:600;letter-spacing:.12em;color:var(--dim);
    padding:0 12px 8px;text-transform:uppercase}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;
    cursor:pointer;font-size:13.5px;color:var(--muted);transition:all .15s;margin-bottom:2px}
  .nav-item:hover{background:var(--card);color:var(--text)}
  .nav-item.active{background:rgba(123,92,255,.15);color:var(--purple-light);font-weight:500}
  .nav-icon{width:16px;height:16px;opacity:.8}
  .sidebar-footer{padding:16px 24px;border-top:1px solid var(--border)}
  .plan-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
    border-radius:20px;font-size:11px;font-weight:600;margin-bottom:8px}
  .plan-free{background:rgba(136,136,136,.15);color:var(--muted)}
  .plan-pro{background:rgba(123,92,255,.2);color:var(--purple-light)}
  .user-name{font-size:13px;font-weight:500;color:var(--text)}
  .user-email{font-size:11px;color:var(--dim);margin-top:2px}
  .logout-btn{margin-top:12px;font-size:12px;color:var(--dim);cursor:pointer;
    display:flex;align-items:center;gap:6px}
  .logout-btn:hover{color:var(--red)}
  
  /* Main */
  .main{margin-left:240px;flex:1;padding:32px;max-width:calc(100vw - 240px)}
  
  /* Header */
  .page-header{margin-bottom:32px}
  .page-title{font-size:28px;font-weight:800;margin-bottom:6px}
  .page-sub{color:var(--muted);font-size:14px}
  
  /* Auth */
  .auth-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;
    background:var(--bg);padding:24px}
  .auth-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;
    padding:40px;width:100%;max-width:420px}
  .auth-logo{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;text-align:center;
    margin-bottom:8px;background:linear-gradient(135deg,var(--purple),var(--purple-light));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .auth-sub{text-align:center;color:var(--muted);font-size:13px;margin-bottom:32px}
  .auth-tabs{display:flex;gap:2px;background:var(--card);border-radius:8px;padding:4px;margin-bottom:28px}
  .auth-tab{flex:1;text-align:center;padding:8px;border-radius:6px;cursor:pointer;
    font-size:13px;font-weight:500;color:var(--muted);transition:all .15s}
  .auth-tab.active{background:var(--purple);color:#fff}
  
  /* Forms */
  .form-group{margin-bottom:16px}
  label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;
    letter-spacing:.04em;text-transform:uppercase}
  input,select,textarea{width:100%;background:var(--card);border:1px solid var(--border);
    border-radius:8px;padding:10px 14px;color:var(--text);font-family:inherit;font-size:14px;
    outline:none;transition:border .15s}
  input:focus,select:focus,textarea:focus{border-color:var(--purple)}
  textarea{resize:vertical;min-height:80px}
  select option{background:var(--card)}
  
  /* Buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:10px 20px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;
    cursor:pointer;border:none;transition:all .15s}
  .btn-primary{background:var(--purple);color:#fff}
  .btn-primary:hover{background:var(--purple-dark);transform:translateY(-1px)}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
  .btn-outline:hover{border-color:var(--purple);color:var(--purple-light)}
  .btn-ghost{background:transparent;color:var(--muted);padding:8px 12px}
  .btn-ghost:hover{color:var(--text);background:var(--card)}
  .btn-danger{background:rgba(255,92,115,.1);color:var(--red);border:1px solid rgba(255,92,115,.2)}
  .btn-danger:hover{background:rgba(255,92,115,.2)}
  .btn-sm{padding:6px 12px;font-size:12px}
  .btn-full{width:100%}
  
  /* Cards */
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px}
  .card-sm{padding:16px}
  
  /* Grid */
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  
  /* Stats */
  .stat-card{background:var(--card);border:1px solid var(--border);border-radius:12px;
    padding:20px;position:relative;overflow:hidden}
  .stat-card::before{content:'';position:absolute;top:0;right:0;width:60px;height:60px;
    background:var(--purple);opacity:.05;border-radius:50%;transform:translate(20px,-20px)}
  .stat-value{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;
    background:linear-gradient(135deg,var(--purple-light),#fff);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .stat-label{font-size:12px;color:var(--muted);margin-top:4px;font-weight:500}
  
  /* Generator */
  .gen-panel{display:grid;grid-template-columns:380px 1fr;gap:24px;align-items:start}
  .gen-form{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px}
  .gen-result{background:var(--card);border:1px solid var(--border);border-radius:12px;
    padding:24px;min-height:400px}
  .type-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px}
  .type-tab{padding:10px;border-radius:8px;cursor:pointer;text-align:center;
    border:1px solid var(--border);transition:all .15s;font-size:13px;font-weight:500}
  .type-tab:hover{border-color:var(--purple);color:var(--purple-light)}
  .type-tab.active{background:rgba(123,92,255,.2);border-color:var(--purple);color:var(--purple-light)}
  .type-icon{font-size:18px;margin-bottom:4px;display:block}
  
  /* Result display */
  .result-section{margin-bottom:20px}
  .result-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:var(--purple-light);margin-bottom:8px}
  .result-text{background:var(--surface);border:1px solid var(--border);border-radius:8px;
    padding:14px;font-size:14px;line-height:1.6;color:var(--text);white-space:pre-wrap}
  .result-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
  
  /* Carousel slides */
  .slide-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .slide-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
  .slide-img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
  .slide-body{padding:12px}
  .slide-num{font-size:10px;font-weight:700;color:var(--purple-light);margin-bottom:4px}
  .slide-title{font-size:13px;font-weight:700;margin-bottom:4px}
  .slide-text{font-size:12px;color:var(--muted);line-height:1.4}
  
  /* History */
  .history-tabs{display:flex;gap:4px;margin-bottom:24px;background:var(--card);
    padding:4px;border-radius:10px;width:fit-content}
  .history-tab{padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;
    font-weight:500;color:var(--muted);transition:all .15s}
  .history-tab.active{background:var(--purple);color:#fff}
  .content-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
  .content-card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;
    transition:border-color .15s}
  .content-card:hover{border-color:var(--purple)}
  .content-card-img{width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--surface)}
  .content-card-body{padding:16px}
  .content-card-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .content-type-badge{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    padding:3px 8px;border-radius:20px;background:rgba(123,92,255,.15);color:var(--purple-light)}
  .content-date{font-size:11px;color:var(--dim)}
  .content-text{font-size:13px;color:var(--muted);line-height:1.4;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:12px}
  .content-actions{display:flex;gap:6px;flex-wrap:wrap}
  
  /* Loading */
  .loader{display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:300px;gap:16px}
  .spinner{width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--purple);
    border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loader-text{color:var(--muted);font-size:14px;animation:pulse 1.5s ease infinite}
  @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
  
  /* Alert */
  .alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;display:flex;align-items:center;gap:8px}
  .alert-error{background:rgba(255,92,115,.1);border:1px solid rgba(255,92,115,.2);color:var(--red)}
  .alert-success{background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.2);color:var(--green)}
  .alert-warning{background:rgba(255,184,0,.1);border:1px solid rgba(255,184,0,.2);color:var(--yellow)}
  
  /* Profile */
  .profile-header{display:flex;align-items:center;gap:20px;margin-bottom:32px;
    background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px}
  .avatar{width:64px;height:64px;background:linear-gradient(135deg,var(--purple),var(--purple-light));
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fff;flex-shrink:0}
  .usage-bar{height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:8px}
  .usage-fill{height:100%;background:linear-gradient(90deg,var(--purple),var(--purple-light));
    border-radius:4px;transition:width .4s}
  
  /* Resolution toggle */
  .res-toggle{display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);
    border-radius:8px;padding:4px}
  .res-btn{padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;
    color:var(--muted);transition:all .15s;border:none;background:transparent;font-family:inherit}
  .res-btn.active{background:var(--purple);color:#fff}
  .res-btn.locked{opacity:.4;cursor:not-allowed}
  
  /* Divider */
  .divider{height:1px;background:var(--border);margin:20px 0}
  
  /* Empty state */
  .empty{text-align:center;padding:60px 20px}
  .empty-icon{font-size:48px;margin-bottom:16px;opacity:.3}
  .empty-text{color:var(--muted);font-size:15px}
  
  /* Toast */
  .toast-wrap{position:fixed;bottom:24px;right:24px;z-index:1000;display:flex;flex-direction:column;gap:8px}
  .toast{background:var(--card);border:1px solid var(--border);border-radius:10px;
    padding:12px 16px;font-size:13px;font-weight:500;animation:slideUp .2s ease;
    display:flex;align-items:center;gap:8px;min-width:220px}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  
  /* Upgrade banner */
  .upgrade-banner{background:linear-gradient(135deg,rgba(123,92,255,.2),rgba(91,61,255,.1));
    border:1px solid rgba(123,92,255,.3);border-radius:12px;padding:20px;margin-bottom:24px;
    display:flex;align-items:center;justify-content:space-between;gap:16px}
  .upgrade-text h3{font-size:15px;font-weight:700;margin-bottom:4px}
  .upgrade-text p{font-size:13px;color:var(--muted)}
  
  @media(max-width:1100px){.gen-panel{grid-template-columns:1fr}.grid-4{grid-template-columns:1fr 1fr}}
  @media(max-width:768px){.sidebar{width:200px}.main{margin-left:200px;padding:20px}}
`;

// ─── Icons (inline SVG) ───────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    history: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-6.67"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    video: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    duplicate: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  };
  return icons[name] || null;
};

// ─── Toast ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  const icons = { success: "✓", error: "✕", warning: "⚠" };
  const colors = { success: "var(--green)", error: "var(--red)", warning: "var(--yellow)" };
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{ borderLeftColor: colors[t.type], borderLeftWidth: 3 }}>
          <span style={{ color: colors[t.type] }}>{icons[t.type]}</span> {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (tab === "register") {
      if (!form.nome || !form.email || !form.senha) { setError("Preencha todos os campos."); setLoading(false); return; }
      if (getUser(form.email)) { setError("E-mail já cadastrado."); setLoading(false); return; }
      const user = {
        id: DB.nextUserId++, nome: form.nome, email: form.email,
        senha_hash: hashPassword(form.senha), plano: "free",
        data_inicio: new Date().toISOString(),
        data_expiracao: new Date(Date.now() + 30 * 864e5).toISOString(),
      };
      DB.users.push(user);
      DB.sessions[user.id] = user;
      onLogin(user);
    } else {
      const user = getUser(form.email);
      if (!user || user.senha_hash !== hashPassword(form.senha)) {
        setError("E-mail ou senha incorretos."); setLoading(false); return;
      }
      DB.sessions[user.id] = user;
      onLogin(user);
    }
    setLoading(false);
  }

  // Demo login
  function demoLogin() {
    let demo = getUser("demo@viralcontent.ai");
    if (!demo) {
      demo = { id: DB.nextUserId++, nome: "Demo User", email: "demo@viralcontent.ai",
        senha_hash: "demo", plano: "pro", data_inicio: new Date().toISOString(),
        data_expiracao: new Date(Date.now() + 30 * 864e5).toISOString() };
      DB.users.push(demo);
    }
    DB.sessions[demo.id] = demo;
    onLogin(demo);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">⚡ ViralContent<span> AI</span></div>
        <div className="auth-sub">Crie conteúdo viral com inteligência artificial</div>
        <div className="auth-tabs">
          {["login","register"].map((t) => (
            <div key={t} className={`auth-tab ${tab===t?"active":""}`} onClick={()=>{setTab(t);setError("")}}>
              {t==="login"?"Entrar":"Criar conta"}
            </div>
          ))}
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={submit}>
          {tab === "register" && (
            <div className="form-group">
              <label>Nome</label>
              <input placeholder="Seu nome" value={form.nome} onChange={set("nome")} />
            </div>
          )}
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={form.senha} onChange={set("senha")} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{marginTop:8}}>
            {loading ? "Carregando..." : tab==="login"?"Entrar":"Criar minha conta"}
          </button>
        </form>
        <div className="divider"/>
        <button className="btn btn-outline btn-full" onClick={demoLogin}>
          ⚡ Entrar com conta Demo (PRO)
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────
function Dashboard({ user }) {
  const total = DB.contents.filter((c) => c.user_id === user.id).length;
  const today = getDailyCount(user.id);
  const limit = user.plano === "free" ? 3 : "∞";
  const expDays = Math.ceil((new Date(user.data_expiracao) - Date.now()) / 864e5);
  const recentTypes = ["post","carrossel","video","thumbnail"];
  const stats = recentTypes.map((t) => ({
    type: t, count: DB.contents.filter((c) => c.user_id === user.id && c.tipo === t).length
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Olá, {user.nome.split(" ")[0]} 👋</div>
        <div className="page-sub">Bem-vindo ao ViralContent AI — seu criador de conteúdo viral</div>
      </div>

      {user.plano === "free" && (
        <div className="upgrade-banner">
          <div className="upgrade-text">
            <h3>🚀 Faça upgrade para o Plano PRO</h3>
            <p>Gerações ilimitadas + imagens em 4K + todos os recursos desbloqueados</p>
          </div>
          <button className="btn btn-primary" onClick={() => alert("Integração Stripe/MP em produção")}>
            <Icon name="star" size={14} color="var(--yellow)" /> Assinar PRO — R$47/mês
          </button>
        </div>
      )}

      <div className="grid-4" style={{marginBottom:24}}>
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total gerado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today}</div>
          <div className="stat-label">Hoje · Limite: {limit}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{fontSize:20,paddingTop:6}}>{user.plano.toUpperCase()}</div>
          <div className="stat-label">Plano atual</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{expDays}d</div>
          <div className="stat-label">Dias restantes</div>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        {[
          {icon:"📝",label:"Posts",sub:"Legendas + hashtags virais",type:"post"},
          {icon:"📚",label:"Carrosséis",sub:"Slides completos com imagens",type:"carrossel"},
          {icon:"🎬",label:"Roteiros de Vídeo",sub:"Hook + desenvolvimento + CTA",type:"video"},
          {icon:"🖼️",label:"Thumbnails",sub:"Capas em HD e 4K",type:"thumbnail"},
        ].map((i) => (
          <div key={i.type} className="card" style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:32}}>{i.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{i.label}</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>{i.sub}</div>
            </div>
            <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"var(--purple-light)"}}>
              {stats.find(s=>s.type===i.type)?.count||0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Generator Page ───────────────────────────────────────────────────────
function GeneratorPage({ user, toast }) {
  const [type, setType] = useState("post");
  const [form, setForm] = useState({ nicho: "", tema: "", tom: "inspirador", objetivo: "engajamento" });
  const [resolution, setResolution] = useState("HD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const daily = getDailyCount(user.id);
  const canGenerate = user.plano === "pro" || daily < 3;
  const can4K = user.plano === "pro";

  const typeConfig = [
    { id: "post", icon: "📝", label: "Post" },
    { id: "carrossel", icon: "📚", label: "Carrossel" },
    { id: "video", icon: "🎬", label: "Vídeo" },
    { id: "thumbnail", icon: "🖼️", label: "Thumbnail" },
  ];

  async function generate() {
    if (!form.nicho || !form.tema) { setError("Preencha nicho e tema."); return; }
    if (!canGenerate) { setError("Limite diário atingido. Faça upgrade para PRO!"); return; }
    setError(""); setLoading(true); setResult(null);

    try {
      let data = null;
      let imagens_urls = [];
      let conteudo_texto = "";

      if (type === "post") {
        data = await generatePost(form.nicho, form.tema, form.tom, form.objetivo);
        conteudo_texto = `${data.gancho}\n\n${data.legenda}\n\n${data.cta}\n\n${data.hashtags}`;
        imagens_urls = [generateImageUrl(`${form.tema} ${form.nicho} post`, resolution)];
      } else if (type === "carrossel") {
        data = await generateCarousel(form.nicho, form.tema, form.tom);
        data.slides = data.slides.map((s) => ({
          ...s, imagem: generateImageUrl(s.prompt_imagem || s.titulo, resolution)
        }));
        conteudo_texto = data.slides.map((s, i) => `Slide ${i+1}: ${s.titulo}\n${s.texto}`).join("\n\n");
        imagens_urls = data.slides.map((s) => s.imagem);
      } else if (type === "video") {
        data = await generateVideo(form.nicho, form.tema, form.tom, form.objetivo);
        conteudo_texto = `HOOK: ${data.hook}\n\nINTRO: ${data.introducao}\n\nDESENVOLVIMENTO: ${data.desenvolvimento}\n\nCTA: ${data.cta}\n\nDuração: ${data.duracao_estimada}`;
        imagens_urls = [generateImageUrl(`${form.tema} video thumbnail`, resolution)];
      } else {
        data = await generateThumbnail(form.nicho, form.tema, form.tom);
        conteudo_texto = `TÍTULO: ${data.titulo}\nSUBTÍTULO: ${data.subtitulo}\nCORES: ${data.cores_sugeridas}`;
        imagens_urls = [generateImageUrl(data.prompt_imagem, resolution)];
      }

      const content = {
        id: DB.nextContentId++, user_id: user.id, tipo: type,
        nicho: form.nicho, tema: form.tema, conteudo_texto,
        imagens_urls, resolucao: resolution,
        data_criacao: new Date().toISOString(), _data: data,
      };
      DB.contents.push(content);
      setResult(content);
      toast("Conteúdo gerado e salvo! 🎉");
    } catch (e) {
      setError("Erro ao gerar conteúdo. Verifique sua conexão.");
    }
    setLoading(false);
  }

  function copyText() {
    navigator.clipboard.writeText(result.conteudo_texto);
    toast("Texto copiado!");
  }

  function downloadImage(url, name = "imagem") {
    const a = document.createElement("a");
    a.href = url; a.download = `${name}-${result.resolucao}.png`;
    a.target="_blank"; a.click();
    toast(`Download iniciado (${result.resolucao})!`);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚡ Gerar Conteúdo</div>
        <div className="page-sub">Crie posts, carrosséis, roteiros e thumbnails virais com IA</div>
      </div>

      {!canGenerate && (
        <div className="alert alert-warning">
          ⚠ Você atingiu o limite de 3 gerações hoje. <strong>Faça upgrade para PRO</strong> para gerações ilimitadas!
        </div>
      )}

      <div className="gen-panel">
        <div className="gen-form">
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>Tipo de conteúdo</div>
            <div className="type-tabs">
              {typeConfig.map((t) => (
                <div key={t.id} className={`type-tab ${type===t.id?"active":""}`} onClick={()=>{setType(t.id);setResult(null)}}>
                  <span className="type-icon">{t.icon}</span>{t.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Nicho *</label>
            <input placeholder="Ex: fitness, finanças, marketing..." value={form.nicho} onChange={set("nicho")} />
          </div>
          <div className="form-group">
            <label>Tema *</label>
            <input placeholder="Ex: como perder 5kg em 30 dias..." value={form.tema} onChange={set("tema")} />
          </div>
          <div className="form-group">
            <label>Tom</label>
            <select value={form.tom} onChange={set("tom")}>
              {["inspirador","educativo","divertido","urgente","empático","provocador","storytelling"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {(type === "post" || type === "video") && (
            <div className="form-group">
              <label>Objetivo</label>
              <select value={form.objetivo} onChange={set("objetivo")}>
                {["engajamento","vendas","seguidores","tráfego","autoridade","conversão"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Resolução das imagens</label>
            <div className="res-toggle">
              <button className={`res-btn ${resolution==="HD"?"active":""}`} onClick={()=>setResolution("HD")}>HD</button>
              <button
                className={`res-btn ${resolution==="4K"?"active":""} ${!can4K?"locked":""}`}
                onClick={()=>can4K?setResolution("4K"):alert("Resolução 4K disponível apenas no plano PRO!")}
              >
                4K {!can4K && "🔒"}
              </button>
            </div>
            {!can4K && <div style={{fontSize:11,color:"var(--dim)",marginTop:4}}>4K disponível no plano PRO</div>}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-full" onClick={generate} disabled={loading||!canGenerate} style={{marginTop:8}}>
            {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Gerando...</> : "⚡ Gerar Conteúdo"}
          </button>

          {user.plano==="free" && (
            <div style={{fontSize:11,color:"var(--dim)",textAlign:"center",marginTop:8}}>
              {3-daily} geração(ões) restantes hoje · <span style={{color:"var(--purple-light)",cursor:"pointer"}} onClick={()=>alert("Assine o PRO!")}>Upgrade PRO</span>
            </div>
          )}
        </div>

        <div className="gen-result">
          {loading && (
            <div className="loader">
              <div className="spinner"/>
              <div className="loader-text">Gerando conteúdo viral com IA...</div>
              <div style={{fontSize:12,color:"var(--dim)"}}>Aguarde alguns segundos</div>
            </div>
          )}

          {!loading && !result && (
            <div className="empty">
              <div className="empty-icon">✨</div>
              <div className="empty-text">Preencha o formulário e clique em "Gerar Conteúdo"<br/>para criar seu conteúdo viral</div>
            </div>
          )}

          {!loading && result && <ResultDisplay result={result} onCopy={copyText} onDownload={downloadImage} onRegenerate={generate} />}
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ result, onCopy, onDownload, onRegenerate }) {
  const d = result._data;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800}}>Conteúdo Gerado ✨</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>{result.tipo} · {result.nicho} · {result.resolucao}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={onCopy}><Icon name="copy" size={13}/> Copiar</button>
          <button className="btn btn-outline btn-sm" onClick={onRegenerate}><Icon name="refresh" size={13}/> Regerar</button>
        </div>
      </div>

      {result.tipo === "post" && d && (
        <>
          <div className="result-section">
            <div className="result-label">🎯 Gancho</div>
            <div className="result-text">{d.gancho}</div>
          </div>
          <div className="result-section">
            <div className="result-label">📝 Legenda</div>
            <div className="result-text">{d.legenda}</div>
          </div>
          <div className="result-section">
            <div className="result-label">📣 CTA</div>
            <div className="result-text">{d.cta}</div>
          </div>
          <div className="result-section">
            <div className="result-label"># Hashtags</div>
            <div className="result-text" style={{color:"var(--purple-light)"}}>{d.hashtags}</div>
          </div>
        </>
      )}

      {result.tipo === "carrossel" && d?.slides && (
        <div>
          <div className="result-label" style={{marginBottom:12}}>📚 Slides do Carrossel</div>
          <div className="slide-grid">
            {d.slides.map((s, i) => (
              <div key={i} className="slide-card">
                <img src={s.imagem} alt={s.titulo} className="slide-img" />
                <div className="slide-body">
                  <div className="slide-num">Slide {i+1}</div>
                  <div className="slide-title">{s.titulo}</div>
                  <div className="slide-text">{s.texto}</div>
                  <button className="btn btn-ghost btn-sm" style={{marginTop:8,width:"100%"}} onClick={()=>onDownload(s.imagem,`slide-${i+1}`)}>
                    <Icon name="download" size={12}/> Baixar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.tipo === "video" && d && (
        <>
          <div className="result-section">
            <div className="result-label">🎣 Hook</div>
            <div className="result-text">{d.hook}</div>
          </div>
          <div className="result-section">
            <div className="result-label">🎬 Introdução</div>
            <div className="result-text">{d.introducao}</div>
          </div>
          <div className="result-section">
            <div className="result-label">📖 Desenvolvimento</div>
            <div className="result-text" style={{whiteSpace:"pre-wrap"}}>{d.desenvolvimento}</div>
          </div>
          <div className="result-section">
            <div className="result-label">📣 CTA Final</div>
            <div className="result-text">{d.cta}</div>
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",background:"rgba(123,92,255,.15)",borderRadius:20,fontSize:12,color:"var(--purple-light)"}}>
            ⏱ {d.duracao_estimada}
          </div>
        </>
      )}

      {result.tipo === "thumbnail" && d && (
        <>
          <div className="result-section">
            <div className="result-label">🖼️ Preview</div>
            <img src={result.imagens_urls[0]} alt="thumbnail" style={{width:"100%",borderRadius:8,marginBottom:12}}/>
          </div>
          <div className="result-section">
            <div className="result-label">Título</div>
            <div className="result-text" style={{fontFamily:"Syne",fontWeight:800,fontSize:20}}>{d.titulo}</div>
          </div>
          <div className="result-section">
            <div className="result-label">Subtítulo</div>
            <div className="result-text">{d.subtitulo}</div>
          </div>
          <div className="result-section">
            <div className="result-label">Cores Sugeridas</div>
            <div className="result-text">{d.cores_sugeridas}</div>
          </div>
        </>
      )}

      <div className="result-actions">
        {result.imagens_urls.map((url, i) => (
          <button key={i} className="btn btn-primary btn-sm" onClick={()=>onDownload(url,`${result.tipo}-${i+1}`)}>
            <Icon name="download" size={13}/> Baixar {result.resolucao} {result.tipo==="carrossel"?`(${i+1})`:""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────
function HistoryPage({ user, toast, setPage }) {
  const [tab, setTab] = useState("all");
  const types = ["all","post","carrossel","video","thumbnail"];
  const typeLabels = { all:"Todos", post:"Posts", carrossel:"Carrosséis", video:"Vídeos", thumbnail:"Thumbnails" };

  const items = DB.contents.filter((c) => c.user_id === user.id && (tab === "all" || c.tipo === tab))
    .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

  function del(id) {
    const idx = DB.contents.findIndex((c) => c.id === id);
    if (idx > -1) { DB.contents.splice(idx, 1); toast("Conteúdo deletado."); }
  }

  function dup(item) {
    const copy = { ...item, id: DB.nextContentId++, data_criacao: new Date().toISOString() };
    DB.contents.push(copy);
    toast("Conteúdo duplicado!");
  }

  const [, rerender] = useState(0);
  function refresh() { rerender((n) => n + 1); }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📂 Histórico</div>
        <div className="page-sub">Todos os seus conteúdos gerados</div>
      </div>

      <div className="history-tabs">
        {types.map((t) => (
          <div key={t} className={`history-tab ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
            {typeLabels[t]} ({DB.contents.filter((c) => c.user_id===user.id&&(t==="all"||c.tipo===t)).length})
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <div className="empty-text">Nenhum conteúdo encontrado.<br/>
            <span style={{color:"var(--purple-light)",cursor:"pointer"}} onClick={()=>setPage("generator")}>Gere seu primeiro conteúdo!</span>
          </div>
        </div>
      ) : (
        <div className="content-grid">
          {items.map((c) => (
            <ContentCard key={c.id} item={c} onDelete={()=>{del(c.id);refresh()}} onDuplicate={()=>{dup(c);refresh()}} toast={toast}/>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, onDelete, onDuplicate, toast }) {
  const typeEmoji = { post:"📝", carrossel:"📚", video:"🎬", thumbnail:"🖼️" };
  const date = new Date(item.data_criacao).toLocaleDateString("pt-BR");
  const preview = item.imagens_urls?.[0] || "";

  return (
    <div className="content-card">
      {preview && <img src={preview} alt="" className="content-card-img" />}
      <div className="content-card-body">
        <div className="content-card-meta">
          <div className="content-type-badge">{typeEmoji[item.tipo]} {item.tipo}</div>
          <div className="content-date">{date}</div>
        </div>
        <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{item.tema}</div>
        <div className="content-text">{item.conteudo_texto}</div>
        <div style={{fontSize:11,color:"var(--dim)",marginBottom:10}}>
          {item.nicho} · {item.resolucao}
        </div>
        <div className="content-actions">
          <button className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(item.conteudo_texto);toast("Copiado!")}}>
            <Icon name="copy" size={12}/> Copiar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{const a=document.createElement("a");a.href=item.imagens_urls[0];a.download="imagem";a.target="_blank";a.click();toast("Download!")}}>
            <Icon name="download" size={12}/> Baixar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{onDuplicate()}}>
            <Icon name="duplicate" size={12}/> Duplicar
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            <Icon name="trash" size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────
function ProfilePage({ user, toast }) {
  const expDays = Math.max(0, Math.ceil((new Date(user.data_expiracao) - Date.now()) / 864e5));
  const total = DB.contents.filter((c) => c.user_id === user.id).length;
  const daily = getDailyCount(user.id);
  const dailyLimit = user.plano === "free" ? 3 : Infinity;
  const usagePct = user.plano === "free" ? (daily / 3) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👤 Perfil</div>
        <div className="page-sub">Suas informações e configurações</div>
      </div>

      <div className="profile-header">
        <div className="avatar">{user.nome[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800}}>{user.nome}</div>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:2}}>{user.email}</div>
          <div style={{marginTop:8}}>
            <div className={`plan-badge ${user.plano==="pro"?"plan-pro":"plan-free"}`}>
              {user.plano==="pro" ? <><Icon name="star" size={11} color="var(--purple-light)"/> PRO</> : "FREE"}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:"var(--purple-light)"}}>{expDays}d</div>
          <div style={{fontSize:12,color:"var(--muted)"}}>até expirar</div>
          {expDays <= 7 && <div style={{fontSize:11,color:"var(--yellow)",marginTop:2}}>⚠ Expira em breve!</div>}
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div style={{fontWeight:700,marginBottom:16}}>📊 Uso Hoje</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,color:"var(--muted)"}}>Gerações</span>
            <span style={{fontSize:13,fontWeight:600}}>{daily} / {user.plano==="pro"?"∞":3}</span>
          </div>
          {user.plano==="free" && (
            <div className="usage-bar">
              <div className="usage-fill" style={{width:`${Math.min(usagePct,100)}%`}}/>
            </div>
          )}
          {user.plano==="free" && usagePct>=100 && (
            <div style={{fontSize:11,color:"var(--red)",marginTop:6}}>Limite atingido hoje</div>
          )}
        </div>

        <div className="card">
          <div style={{fontWeight:700,marginBottom:16}}>📁 Conteúdo Total</div>
          <div className="stat-value" style={{fontSize:36}}>{total}</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>conteúdos gerados no total</div>
        </div>
      </div>

      {user.plano === "free" && (
        <div className="card" style={{background:"linear-gradient(135deg,rgba(123,92,255,.15),rgba(91,61,255,.05))",borderColor:"rgba(123,92,255,.3)"}}>
          <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800,marginBottom:8}}>🚀 Faça Upgrade para PRO</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:16,lineHeight:1.5}}>
            Desbloqueie gerações ilimitadas, resolução 4K, suporte prioritário e muito mais.
          </div>
          <div className="grid-2" style={{marginBottom:16}}>
            {[
              "✓ Gerações ilimitadas/dia",
              "✓ Imagens em 4K",
              "✓ Todos os formatos",
              "✓ Download em ZIP",
              "✓ Suporte prioritário",
              "✓ Novos recursos primeiro",
            ].map((f) => (
              <div key={f} style={{fontSize:13,color:"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                <Icon name="check" size={12} color="var(--green)"/> {f.slice(2)}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={()=>alert("Integração de pagamento (Stripe/Mercado Pago) configurável em produção!")}>
            <Icon name="star" size={14} color="var(--yellow)"/> Assinar PRO — R$47/mês
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout }) {
  const nav = [
    { id: "home", icon: "home", label: "Dashboard" },
    { id: "generator", icon: "zap", label: "Gerar Conteúdo" },
    { id: "history", icon: "history", label: "Histórico" },
    { id: "profile", icon: "user", label: "Perfil" },
  ];

  return (
    <div className="sidebar">
      <div className="logo">⚡ Viral<span>Content AI</span></div>
      <div className="nav-section">
        <div className="nav-label">Menu</div>
        {nav.map((n) => (
          <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
            <span className="nav-icon"><Icon name={n.icon} size={15}/></span> {n.label}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className={`plan-badge ${user.plano==="pro"?"plan-pro":"plan-free"}`}>
          {user.plano==="pro"?<><Icon name="star" size={11} color="var(--purple-light)"/> PRO</>:"FREE"}
        </div>
        <div className="user-name">{user.nome}</div>
        <div className="user-email">{user.email}</div>
        <div className="logout-btn" onClick={onLogout}>
          <Icon name="logout" size={13}/> Sair
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const { toasts, show: toast } = useToast();

  function logout() { setUser(null); setPage("home"); }

  const pages = {
    home: <Dashboard user={user} />,
    generator: <GeneratorPage user={user} toast={toast} />,
    history: <HistoryPage user={user} toast={toast} setPage={setPage} />,
    profile: <ProfilePage user={user} toast={toast} />,
  };

  return (
    <>
      <style>{css}</style>
      {!user ? (
        <AuthPage onLogin={setUser} />
      ) : (
        <div className="app">
          <Sidebar page={page} setPage={setPage} user={user} onLogout={logout}/>
          <div className="main">{pages[page]}</div>
        </div>
      )}
      <ToastContainer toasts={toasts}/>
    </>
  );
}
