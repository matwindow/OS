// matgpt.js
// Improved MatGPT helper with smarter local logic and a secure proxy path for real AI.
(function(){
  const HISTORY_KEY = 'matgpt_history_v1';
  const API_URL_KEY = 'matgpt_api_url_v1';

  function safeEvaluate(expr){
    if (typeof expr !== 'string') return null;
    let cleaned = expr.replace(/\^/g, '**');
    cleaned = String(cleaned).replace(/[^0-9+\-*/().%\s\*\*]/g,'');
    if (!cleaned.trim()) return null;
    try {
      // eslint-disable-next-line no-new-func
      const res = Function('"use strict"; return (' + cleaned + ')')();
      return Number.isFinite(res) ? res : null;
    } catch(e){ return null; }
  }

  function extractAfterKeyword(text, keyword){
    const idx = text.toLowerCase().indexOf(keyword);
    if (idx === -1) return '';
    return text.slice(idx + keyword.length).trim();
  }

  function choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function answer(prompt){
    const text = String(prompt || '').trim();
    if (!text) return choose(['I didn\'t get anything — could you type your question?','Say something and I\'ll try to help.']);
    const low = text.toLowerCase();

    if (/^\s*(hi|hello|hey|yo)\b/.test(low)) return choose([
      'Hello! I\'m MatGPT — your local browser assistant. How can I help today?',
      'Hi there! MatGPT at your service. Ask me for time, math, text transforms, or to open apps.'
    ]);

    if (low.includes('who are you') || low.includes('your name')) return 'I\'m MatGPT, a small local assistant embedded in this browser OS. I can do quick tasks without sending data anywhere unless you point me to a proxy.';

    if (low.includes('time')) return 'Current time: ' + new Date().toLocaleTimeString();
    if (low.includes('date')) return 'Today is ' + new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (low.includes('what can') || low.includes('what do you do') || low.includes('capab')){
      return 'I can help with quick calculations, basic text transforms, opening local apps, and saving short chat history locally. If you run a Copilot-compatible proxy server, I can answer broader questions through it.';
    }

    if (low.includes('open browser')) { if (window.createAppWindow) window.createAppWindow('Browser'); return 'Opening Browser...'; }
    if (low.includes('open settings')) { if (window.createAppWindow) window.createAppWindow('Settings'); return 'Opening Settings...'; }
    if (low.includes('open files')) { if (window.createAppWindow) window.createAppWindow('Files'); return 'Opening Files...'; }

    if (low.startsWith('uppercase') || low.includes('uppercase ')){
      const v = extractAfterKeyword(text, 'uppercase');
      return v ? v.toUpperCase() : 'Provide text after the word uppercase.';
    }
    if (low.startsWith('lowercase') || low.includes('lowercase ')){
      const v = extractAfterKeyword(text, 'lowercase');
      return v ? v.toLowerCase() : 'Provide text after the word lowercase.';
    }
    if (low.startsWith('reverse') || low.includes('reverse ')){
      const v = extractAfterKeyword(text, 'reverse');
      return v ? [...v].reverse().join('') : 'Provide text after the word reverse.';
    }

    const mathMatch = text.match(/([-+*/^ ().0-9%]+)$/);
    const altMath = text.match(/(?:what is|what's|calculate|compute|result of|what's the result of)\s+(.+)$/i);
    let expr = null;
    if (altMath && altMath[1]) expr = altMath[1];
    else if (mathMatch) expr = mathMatch[1];

    if (expr){
      const val = safeEvaluate(expr);
      if (val !== null) return 'Result: ' + val;
    }

    const rand = low.match(/random(?: number)?\s*(\d+)/i);
    if (rand){ const limit = parseInt(rand[1],10) || 10; return 'Random number: ' + (Math.floor(Math.random()*limit)+1); }

    if (low.includes('thank')) return choose(['You\'re welcome!','No problem — happy to help.']);
    if (low.includes('bye') || low.includes('goodbye')) return choose(['Goodbye!','See you later!']);

    return 'I\'m a local assistant: I can do quick math, text transforms, and open apps. If you connect a Copilot-compatible proxy at http://localhost:3000/api/copilot, I can answer broader questions too.';
  }

  async function remoteAnswer(prompt, opts){
    const apiUrl = localStorage.getItem(API_URL_KEY) || 'http://localhost:3000/api/copilot';
    try {
      const payload = {
        prompt: String(prompt || '').trim(),
        model: (opts && opts.model) || 'copilot',
        system: (opts && opts.system) || 'You are MatGPT, a helpful assistant embedded in a browser OS. Keep answers concise when possible.'
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error('Remote proxy error: ' + res.status + ' ' + txt.slice(0,200));
      }
      const json = await res.json();
      if (json && json.answer) return String(json.answer).trim();
      if (json && json.content) return String(json.content).trim();
      if (json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
        return String(json.choices[0].message.content).trim();
      }
      return null;
    } catch (e) {
      console.error('remoteAnswer error', e);
      return null;
    }
  }

  function loadHistory(){
    try{ const raw = localStorage.getItem(HISTORY_KEY); if (!raw) return []; const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }catch(e){return [];} }
  function saveHistory(list){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }catch(e){} }
  function appendHistory(role, text){ const list = loadHistory(); list.push({role, text, ts: Date.now()}); saveHistory(list); }
  function clearHistory(){ try{ localStorage.removeItem(HISTORY_KEY); }catch(e){} }

  function setApiUrl(url){
    const value = String(url || '').trim();
    if (!value) { localStorage.removeItem(API_URL_KEY); return true; }
    localStorage.setItem(API_URL_KEY, value);
    return true;
  }
  function getApiUrl(){ return localStorage.getItem(API_URL_KEY) || 'http://localhost:3000/api/copilot'; }

  window.matgpt = {
    answer,
    safeEvaluate,
    remoteAnswer,
    loadHistory,
    saveHistory,
    appendHistory,
    clearHistory,
    setApiUrl,
    getApiUrl,
    HISTORY_KEY,
    API_URL_KEY
  };
})();
