(function () {
  const SYSTEM_PROMPT = `You are Aria, the AI assistant for Inferis Tech — a digital agency run by Bhuvan Rongali that builds premium websites and AI automation solutions for small and medium businesses.

Your job is to help website visitors understand what Inferis Tech offers, answer their questions, and guide them toward booking a free strategy call.

== ABOUT INFERIS TECH ==
Inferis Tech is an AI-powered digital agency based in the Raleigh-Charlotte, NC area. We help small businesses compete with enterprise companies by giving them access to the same powerful technology — without the big price tag.
Founder: Bhuvan Rongali — incoming Finance & Accounting student at UNC Charlotte (Belk College of Business). Experienced web developer and AI automation builder with real client work delivered.

== SERVICES ==
1. Custom Website Design - Hand-crafted, pixel-perfect websites built from scratch. Mobile-first, fast-loading, SEO-optimized. Built with HTML/CSS/JS or React. Delivered in 2-3 weeks.
2. AI Voice Agents - AI phone agents that answer calls 24/7. Handle FAQs, qualify leads, book appointments automatically. Built with Bland.ai.
3. Scheduling Automation - AI-powered booking systems synced to your calendar. Auto email/SMS reminders. Built with Cal.com + Zapier.
4. AI Chatbots - Smart website chat widgets trained on your business. Capture leads, answer questions 24/7. Built with custom GPT integration.
5. Workflow Automation - Connect your tools and automate repetitive tasks. Built with Zapier and Make.
6. SEO & Performance - On-page SEO, Google Search Console setup, Core Web Vitals optimization.

== PRICING ==
Starter Plan — $500 one-time: Custom 5-page website, mobile responsive, basic SEO, contact form, 30-day support.
Growth Plan — $1,200 one-time + $150/month (Most Popular): Everything in Starter + up to 10 pages, AI chatbot, scheduling automation, lead capture, advanced SEO, monthly maintenance.
Pro Plan — $2,500 one-time + $400/month: Everything in Growth + unlimited pages, AI voice agent, full workflow automation, CRM setup, monthly strategy calls, priority support.
Add-ons: Extra voice agent (+$200/mo), extra pages (+$75 each), multi-language (+$300), analytics dashboard (+$150/mo).

== PORTFOLIO ==
NVision IT — Full website redesign for an Oracle Gold Partner enterprise IT firm.
Secure Our Families — Brand identity and digital presence for a legacy planning firm.
AI Scheduling System — 24/7 booking automation for a local med spa.
Lead Capture Chatbot — Custom AI chatbot with CRM integration for a contractor.
AI Voice Agent — Inbound AI phone agent for a dental practice.

== CONTACT ==
Email: hello@inferistech.com. Book a free 30-minute strategy call at the contact page.

== HOW TO RESPOND ==
- Be friendly, direct, and helpful — no corporate fluff
- Keep responses concise (2-4 sentences max unless they ask for detail)
- If someone asks about pricing, give them the info and invite them to book a call
- If someone is ready to start, direct them to hello@inferistech.com or the contact page
- Never make up services, prices, or capabilities not listed above
- Always end with a helpful next step or question`;

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    #inferis-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #60a5fa);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(74,222,128,0.35); transition: transform 0.2s, box-shadow 0.2s; font-size: 22px;
    }
    #inferis-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(74,222,128,0.45); }
    #inferis-chat-btn .chat-icon { display: block; }
    #inferis-chat-btn .close-icon { display: none; color: #1c1c1e; font-size: 18px; font-weight: 700; }
    #inferis-chat-btn.open .chat-icon { display: none; }
    #inferis-chat-btn.open .close-icon { display: block; }
    #inferis-chat-window {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 360px; height: 520px; background: #1c1c1e;
      border: 1px solid rgba(74,222,128,0.15); border-radius: 20px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      transform: scale(0.92) translateY(12px); opacity: 0; pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
      font-family: 'DM Sans', sans-serif;
    }
    #inferis-chat-window.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
    .ic-header { padding: 14px 16px; background: #242426; border-bottom: 1px solid rgba(74,222,128,0.1); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .ic-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #60a5fa); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .ic-header-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #f2f2f7; line-height: 1.2; }
    .ic-header-status { font-size: 11px; color: rgba(210,220,210,0.5); display: flex; align-items: center; gap: 4px; }
    .ic-status-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; animation: ic-pulse 2s infinite; }
    @keyframes ic-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .ic-powered { font-size: 10px; color: rgba(210,220,210,0.25); font-weight: 300; margin-left: auto; }
    .ic-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
    .ic-messages::-webkit-scrollbar { width: 4px; }
    .ic-messages::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 4px; }
    .ic-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; animation: ic-fadein 0.2s ease; }
    @keyframes ic-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .ic-msg.bot { background: #2c2c2e; color: #f2f2f7; border-radius: 16px 16px 16px 4px; align-self: flex-start; border: 1px solid rgba(74,222,128,0.08); }
    .ic-msg.user { background: linear-gradient(135deg, #4ade80, #60a5fa); color: #1c1c1e; font-weight: 500; border-radius: 16px 16px 4px 16px; align-self: flex-end; }
    .ic-typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; background: #2c2c2e; border-radius: 16px 16px 16px 4px; align-self: flex-start; border: 1px solid rgba(74,222,128,0.08); }
    .ic-typing span { width: 6px; height: 6px; background: rgba(74,222,128,0.6); border-radius: 50%; animation: ic-bounce 1.2s infinite; }
    .ic-typing span:nth-child(2){animation-delay:0.2s} .ic-typing span:nth-child(3){animation-delay:0.4s}
    @keyframes ic-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .ic-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; flex-shrink: 0; }
    .ic-suggestion { padding: 5px 11px; border-radius: 50px; border: 1px solid rgba(74,222,128,0.2); background: transparent; color: rgba(210,220,210,0.7); font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .ic-suggestion:hover { border-color: rgba(74,222,128,0.5); color: #4ade80; background: rgba(74,222,128,0.06); }
    .ic-input-row { padding: 12px 14px; background: #242426; border-top: 1px solid rgba(74,222,128,0.08); display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .ic-input { flex: 1; background: #2c2c2e; border: 1px solid rgba(74,222,128,0.1); border-radius: 50px; padding: 9px 16px; color: #f2f2f7; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300; outline: none; transition: border-color 0.2s; }
    .ic-input::placeholder { color: rgba(210,220,210,0.3); }
    .ic-input:focus { border-color: rgba(74,222,128,0.35); }
    .ic-send { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #60a5fa); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s, transform 0.2s; flex-shrink: 0; }
    .ic-send:hover { opacity: 0.85; transform: scale(1.05); }
    .ic-send:disabled { opacity: 0.4; cursor: default; transform: none; }
    .ic-send svg { width: 16px; height: 16px; fill: #1c1c1e; }
    @media (max-width: 480px) {
      #inferis-chat-window { width: calc(100vw - 24px); right: 12px; bottom: 84px; height: 70vh; }
      #inferis-chat-btn { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'inferis-chat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = '<span class="chat-icon">💬</span><span class="close-icon">✕</span>';

  const win = document.createElement('div');
  win.id = 'inferis-chat-window';
  win.innerHTML = `
    <div class="ic-header">
      <div class="ic-avatar">🤖</div>
      <div class="ic-header-info">
        <div class="ic-header-name">Aria &middot; Inferis Tech</div>
        <div class="ic-header-status"><span class="ic-status-dot"></span> Online now</div>
      </div>
      <div class="ic-powered">GPT-4o</div>
    </div>
    <div class="ic-messages" id="ic-messages"></div>
    <div class="ic-suggestions" id="ic-suggestions">
      <button class="ic-suggestion">What services do you offer?</button>
      <button class="ic-suggestion">How much does it cost?</button>
      <button class="ic-suggestion">How do I get started?</button>
    </div>
    <div class="ic-input-row">
      <input class="ic-input" id="ic-input" type="text" placeholder="Ask me anything..." autocomplete="off" />
      <button class="ic-send" id="ic-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  let isOpen = false, isLoading = false, greeted = false;
  const messagesEl = document.getElementById('ic-messages');
  const inputEl = document.getElementById('ic-input');
  const sendEl = document.getElementById('ic-send');
  const suggestionsEl = document.getElementById('ic-suggestions');

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    btn.classList.toggle('open', isOpen);
    win.classList.toggle('open', isOpen);
    if (isOpen && !greeted) {
      greeted = true;
      setTimeout(() => addMessage('bot', "Hey! 👋 I'm Aria, Inferis Tech's AI assistant. I can tell you about our services, pricing, and how we can help your business. What's on your mind?"), 300);
    }
    if (isOpen) setTimeout(() => inputEl.focus(), 300);
  });

  suggestionsEl.querySelectorAll('.ic-suggestion').forEach(s => {
    s.addEventListener('click', () => {
      inputEl.value = s.textContent;
      suggestionsEl.style.display = 'none';
      sendMessage();
    });
  });

  sendEl.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); });

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ic-msg ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ic-typing'; div.id = 'ic-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() { const t = document.getElementById('ic-typing'); if (t) t.remove(); }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;
    const apiKey = window.INFERIS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      addMessage('bot', 'Chat is not configured yet. Please reach out to us at hello@inferistech.com!');
      return;
    }
    suggestionsEl.style.display = 'none';
    inputEl.value = '';
    addMessage('user', text);
    messages.push({ role: 'user', content: text });
    isLoading = true; sendEl.disabled = true;
    addTyping();
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: messages, max_tokens: 300, temperature: 0.7 })
      });
      const data = await res.json();
      if (data.error) {
        removeTyping();
        const code = data.error.code || data.error.type || '';
        let msg = "I'm having a little trouble right now. Reach out to us at hello@inferistech.com and we'll get back to you!";
        if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached')
          msg = "I'm temporarily unavailable. You can reach us at hello@inferistech.com and we'll be happy to help!";
        else if (code === 'rate_limit_exceeded')
          msg = "I'm getting a lot of questions right now! Try again in a moment or email us at hello@inferistech.com.";
        addMessage('bot', msg);
        return;
      }
      const reply = data.choices[0].message.content;
      messages.push({ role: 'assistant', content: reply });
      removeTyping();
      addMessage('bot', reply);
    } catch (err) {
      removeTyping();
      addMessage('bot', "Something went wrong on my end. Feel free to reach out at hello@inferistech.com and we'll help you out!");
    } finally {
      isLoading = false; sendEl.disabled = false; inputEl.focus();
    }
  }
})();
