// matgpt.js
// Lightweight local MatGPT helper library for MatOS
// Exposes window.matgpt with simple processing utilities and history storage.
(function(){
  const HISTORY_KEY = 'matgpt_history_v1';

  function safeEvaluate(expr){
    const cleaned = String(expr).replace(/[^0-9+\-*/().%\s]/g,'');
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

  function answer(prompt){
    const text = String(prompt || '').trim();
    if (!text) return 'Ask me anything.';
    const low = text.toLowerCase();
    if (low.includes('hello') || low.includes('hi')) return 'Hello! I am MatGPT, your local browser assistant.';
    if (low.includes('who are you') || low.includes('your name')) return 'I am MatGPT, a local AI assistant running inside this browser-based operating system.';
    if (low.includes('time')) return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    if (low.includes('date')) return new Date().toLocaleDateString();
    if (low.includes('help')) return 'Try asking for time/date, quick math, text transforms (uppercase/lowercase/reverse), or to open apps.';

    if (low.includes('open browser')) { if (window.createAppWindow) window.createAppWindow('Browser'); return 'Opening Browser...'; }
    if (low.includes('open settings')) { if (window.createAppWindow) window.createAppWindow('Settings'); return 'Opening Settings...'; }
    if (low.includes('open files')) { if (window.createAppWindow) window.createAppWindow('Files'); return 'Opening Files...'; }

    if (low.includes('uppercase')){ const v = extractAfterKeyword(text, 'uppercase'); return v ? v.toUpperCase() : 'Provide text after the word uppercase.'; }
    if (low.includes('lowercase')){ const v = extractAfterKeyword(text, 'lowercase'); return v ? v.toLowerCase() : 'Provide text after the word lowercase.'; }
    if (low.includes('reverse')){ const v = extractAfterKeyword(text, 'reverse'); return v ? [...v].reverse().join('') : 'Provide text after the word reverse.'; }

    const mathMatch = low.match(/(?:calculate|compute|result of)?\s*([-+/*().0-9\s]+)/i);
    if (mathMatch){ const val = safeEvaluate(mathMatch[1]); if (val !== null) return 'Result: ' + val; }

    const rand = low.match(/random(?: number)?\s*(\d+)/i);
    if (rand){ const limit = parseInt(rand[1],10) || 10; return 'Random number: ' + (Math.floor(Math.random()*limit)+1); }

    if (low.includes('thank')) return 'You are welcome.';
    if (low.includes('bye') || low.includes('goodbye')) return 'Goodbye!';

    return 'MatGPT (local) — I can help with time, date, math, text transforms, and opening apps. Examples: "2+2", "Reverse hello", "Open Settings".';
  }

  function loadHistory(){
    try{ const raw = localStorage.getItem(HISTORY_KEY); if (!raw) return []; const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }catch(e){return [];}
  }
  function saveHistory(list){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }catch(e){}
  }
  function appendHistory(role, text){
    const list = loadHistory(); list.push({role, text, ts: Date.now()}); saveHistory(list);
  }

  window.matgpt = {
    answer,
    safeEvaluate,
    loadHistory,
    saveHistory,
    appendHistory,
    HISTORY_KEY
  };
})();
