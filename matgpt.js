// matgpt.js
// Improved MatGPT helper with better responses and smarter math parsing
// Adds optional remote AI integration via user-supplied API key (stored in localStorage).
(function(){
  const HISTORY_KEY = 'matgpt_history_v1';
  const API_KEY_KEY = 'matgpt_api_key_v1';
  const API_URL_KEY = 'matgpt_api_url_v1';

  function safeEvaluate(expr){
    if (typeof expr !== 'string') return null;
    // allow ^ for exponent, convert to **; remove disallowed chars
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

    // Greetings
    if (/^\s*(hi|hello|hey|yo)\b/.test(low)) return choose([
      'Hello! I\'m MatGPT — your local browser assistant. How can I help today?',
      'Hi there! MatGPT at your service. Ask me for time, math, text transforms, or to open apps.'
    ]);

    if (low.includes('who are you') || low.includes('your name')) return 'I\'m MatGPT, a small local assistant embedded in this browser OS. I can do quick tasks without sending data anywhere unless you enable a remote AI key.';

    // Time & Date
    if (low.includes('time')) return 'Current time: ' + new Date().toLocaleTimeString();
    if (low.includes('date')) return 'Today is ' + new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Help / Capabilities
    if (low.includes('what can') || low.includes('what do you do') || low.includes('capab')){
      return 'I can help with quick calculations, basic text transforms (uppercase/lowercase/reverse), opening local apps (Browser, Settings, Files), and saving a short chat history locally. If you want broader knowledge, add an OpenAI-compatible API key in the MatGPT app settings and I can proxy your queries to a hosted model.';
    }

    // Open apps
    if (low.includes('open browser')) { if (window.createAppWindow) window.createAppWindow('Browser'); return 'Opening Browser...'; }
    if (low.includes('open settings')) { if (window.createAppWindow) window.createAppWindow('Settings'); return 'Opening Settings...'; }
    if (low.includes('open files')) { if (window.createAppWindow) window.createAppWindow('Files'); return 'Opening Files...'; }

    // Text transforms
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

    // Math parsing: try to extract an expression
    const mathMatch = text.match(/([-+*/^ ().0-9%]+)$/);
    const altMath = text.match(/(?:what is|what's|calculate|compute|result of|what's the result of)\s+(.+)$/i);
    let expr = null;
    if (altMath && altMath[1]) expr = altMath[1];
    else if (mathMatch) expr = mathMatch[1];

    if (expr){
      const val = safeEvaluate(expr);
      if (val !== null) return 'Result: ' + val;
    }

    // Random number
    const rand = low.match(/random(?: number)?\s*(\d+)/i);
    if (rand){ const limit = parseInt(rand[1],10) || 10; return 'Random number: ' + (Math.floor(Math.random()*limit)+1); }

    // Small talk
    if (low.includes('thank')) return choose(['You\'re welcome!','No problem — happy to help.']);
    if (low.includes('bye') || low.includes('goodbye')) return choose(['Goodbye!','See you later!']);

    // Fallback more helpful
    return 'I\'m a local assistant: I can do quick math, text transforms, and open apps. If you need more knowledge, add a remote API key in MatGPT settings so I can query a hosted model.';
  }

  // Remote AI integration
  async function remoteAnswer(prompt, opts){
    const key = localStorage.getItem(API_KEY_KEY);
    if (!key) return null; // caller should fallback to local
    const apiUrl = localStorage.getItem(API_URL_KEY) || 'https://api.openai.com/v1/chat/completions';
    const model = (opts && opts.model) || 'gpt-3.5-turbo';

    const systemPrompt = (opts && opts.system) || 'You are MatGPT, a helpful assistant embedded in a browser-based OS. Keep answers concise when appropriate.';

    try {
      const body = {
        model: model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.5,
        max_tokens: 800
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify(body)
      });

      if (!res.ok){
        const txt = await res.text();
        throw new Error('Remote API error: ' + res.status + ' ' + txt.slice(0,200));
      }
      const json = await res.json();
      // OpenAI style
      if (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content){
        return String(json.choices[0].message.content).trim();
      }
      // other providers might use text
      if (json.answer) return String(json.answer).trim();
      return null;
    } catch (e){
      console.error('remoteAnswer error', e);
      return null;
    }
  }

  function loadHistory(){
    try{ const raw = localStorage.getItem(HISTORY_KEY); if (!raw) return []; const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }catch(e){return [];} }
  function saveHistory(list){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }catch(e){} }
  function appendHistory(role, text){ const list = loadHistory(); list.push({role, text, ts: Date.now()}); saveHistory(list); }
  function clearHistory(){ try{ localStorage.removeItem(HISTORY_KEY); }catch(e){} }

  function setApiKey(key){ try{ if (!key) localStorage.removeItem(API_KEY_KEY); else localStorage.setItem(API_KEY_KEY, key); return true;}catch(e){return false;} }
  function getApiKey(){ return localStorage.getItem(API_KEY_KEY) || null; }
  function clearApiKey(){ localStorage.removeItem(API_KEY_KEY); }

  window.matgpt = {
    answer,
    safeEvaluate,
    remoteAnswer,
    loadHistory,
    saveHistory,
    appendHistory,
    clearHistory,
    setApiKey,
    getApiKey,
    clearApiKey,
    HISTORY_KEY,
    API_KEY_KEY
  };
})();
