(function(){
'use strict';
var D = (window.B1 || []).filter(function(u){return u.n === window.UNIT;})[0];
var app = document.getElementById('app');
if(!D){app.innerHTML='<div class="wrap"><div class="card">Unit not found.</div></div>';return;}

/* ---------- helpers ---------- */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function norm(s){return String(s).toLowerCase().replace(/[’‘`]/g,"'").replace(/\(.*?\)/g,' ').replace(/[.,!?;:"“”]/g,' ').replace(/\s+/g,' ').trim();}
function alts(a){return String(a||'').split(/\s+\/\s+|\s+or\s+/).map(norm).filter(Boolean);}
function first(a){return String(a||'').split(/\s+\/\s+/)[0].replace(/\(.*?\)/g,'').trim();}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('b1lab:'+k)||'null');localStorage.setItem('b1lab:'+k,JSON.stringify(v));}catch(e){return null;}}

/* ---------- speech ---------- */
var synth = window.speechSynthesis, voices = [], rate = 1, token = 0;
function loadVoices(){ if(!synth) return; var v=synth.getVoices().filter(function(x){return /^en[-_]/i.test(x.lang);});
  var pref=v.filter(function(x){return /Google|Natural|Samantha|Daniel|Karen|Moira|Aria|Jenny|Guy|Microsoft/i.test(x.name);});
  voices = pref.concat(v.filter(function(x){return pref.indexOf(x)<0;})); }
if(synth){loadVoices(); synth.onvoiceschanged=loadVoices;}
var cast = {};
function voiceFor(who){ if(!voices.length) return null; if(!(who in cast)) cast[who]=Object.keys(cast).length; return voices[cast[who] % voices.length]; }
function stop(){ token++; if(synth) synth.cancel(); document.querySelectorAll('.on').forEach(function(e){e.classList.remove('on');}); }
function say(text, who){ return new Promise(function(res){
  if(!synth){res();return;}
  var u=new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu,'')); u.lang='en-US'; u.rate=rate;
  var v=voiceFor(who||'narrator'); if(v){u.voice=v;u.lang=v.lang;}
  if(who && cast[who]%2===1 && voices.length<2) u.pitch=1.25;
  u.onend=u.onerror=function(){res();}; synth.speak(u); }); }
function speedCtl(){ return '<div class="speed">Speed <button data-r="0.8">Slow</button><button data-r="1" aria-pressed="true">Normal</button></div>'; }
function bindSpeed(root){ root.querySelectorAll('.speed button').forEach(function(b){ b.onclick=function(){ rate=+b.dataset.r; root.querySelectorAll('.speed button').forEach(function(x){x.setAttribute('aria-pressed', x===b);}); }; }); }

/* ---------- talk ---------- */
function gapsIn(){ var out=[], cur=null;
  D.lines.forEach(function(l,li){ l.parts.forEach(function(p){ if(typeof p!=='object'||!p) return; if(p.num) cur=p.num; if('gap' in p){ out.push({li:li,num:cur||String(out.length+1),hint:p.gap}); cur=null; } }); });
  return out; }
var GAPS = gapsIn();
function lineText(l, li){ var s='', gi=0;
  GAPS.forEach(function(g){ if(g.li<li) gi++; });
  l.parts.forEach(function(p){
    if(typeof p==='string'){ s+=p; }
    else if('gap' in p){ var a=first(D.ansT[GAPS[gi].num]||''); if(/^['’]/.test(a)) s=s.replace(/\s+$/,''); s+=(a||'…')+' '; gi++; }
  }); return s.replace(/\s+/g,' ').replace(/\s+([,.!?])/g,'$1').trim(); }
function talkHTML(){
  var gi=0, rows=D.lines.map(function(l,li){
    var html=l.parts.map(function(p){
      if(typeof p==='string') return esc(p);
      if(p.num) return '<span class="num">('+esc(p.num)+')</span> ';
      var g=GAPS[gi++]; return '<input class="gap" data-i="'+(gi-1)+'" placeholder="'+esc(g.hint||'…')+'" aria-label="Gap '+esc(g.num)+(g.hint?' ('+esc(g.hint)+')':'')+'" autocomplete="off" autocapitalize="off" spellcheck="false">';
    }).join('');
    return '<div class="ln" data-l="'+li+'"><b>'+esc(l.who)+'</b><span>'+html+'</span></div>';
  }).join('');
  var people=[]; D.lines.forEach(function(l){ if(people.indexOf(l.who)<0) people.push(l.who); });
  var sound = D.sound && D.sound.length ? '<div class="card T"><div class="h">🔊 Sound smart</div><div class="tip">'+D.sound.map(function(s){return '<p>'+esc(s)+'</p>';}).join('')+'</div><div class="ctrl"><button class="btn sm" id="sndPlay">▶ Hear the examples</button></div></div>' : '';
  var prompts = D.pairs && D.pairs.length ? '<div class="card T"><div class="h"><span class="n">🗣</span> Speaking challenge<small>alone or with a partner</small></div><p class="hint" style="margin:0 0 10px">Tap a question to hear it. Answer out loud in full sentences — try to talk for 20 seconds!</p><div class="prompts">'+D.pairs.map(function(p,i){return '<button class="pr" data-p="'+i+'">'+esc(p)+'</button>';}).join('')+'</div><div class="ctrl"><button class="btn sm" id="rnd">🎲 Random question</button><span class="score" id="sec"></span></div></div>' : '';
  return '<div class="card T"><div class="h"><span class="n">1</span> Listen and complete<small>Unit '+D.n+' · Talk</small></div>'+
    '<div class="scene">'+esc(D.setting)+'</div>'+
    '<div class="ctrl"><button class="btn" id="playAll">▶ Listen</button><button class="btn ghost sm" id="stopB">■ Stop</button>'+speedCtl()+'</div>'+
    '<div class="dlg" id="dlg">'+rows+'</div>'+
    (D.after?'<p class="hint">'+esc(D.after)+'</p>':'')+
    '<div class="ctrl"><button class="btn" id="chk">✓ Check</button><button class="btn ghost" id="show">Show answers</button><span class="score" id="tsc"></span></div></div>'+
    '<div class="card T"><div class="h"><span class="n">2</span> Role-play<small>you are one of the characters</small></div>'+
    '<p class="hint" style="margin:0">Choose your character. The app reads the other lines — read <b>your</b> lines out loud, then tap <b>Next</b>.</p>'+
    '<div class="ctrl">'+people.map(function(p){return '<button class="btn ghost sm role" data-w="'+esc(p)+'">I’m '+esc(p)+'</button>';}).join('')+'<button class="btn sm" id="next" disabled>Next ▶</button></div><div id="rpBox" class="dlg"></div></div>'+
    sound+prompts;
}
function bindTalk(root){
  bindSpeed(root);
  var lines=root.querySelectorAll('#dlg .ln');
  root.querySelector('#playAll').onclick=async function(){ stop(); var t=token;
    for(var i=0;i<D.lines.length;i++){ if(t!==token) return; lines[i].classList.add('on'); lines[i].scrollIntoView({block:'nearest',behavior:'smooth'}); await say(lineText(D.lines[i],i), D.lines[i].who); lines[i].classList.remove('on'); } };
  root.querySelector('#stopB').onclick=stop;
  var ins=root.querySelectorAll('.gap');
  root.querySelector('#chk').onclick=function(){ var ok=0; ins.forEach(function(inp){ var g=GAPS[+inp.dataset.i], a=alts(D.ansT[g.num]); var v=norm(inp.value);
      var good=a.length && v && a.some(function(x){return x===v || x.replace(/'/g,'')===v.replace(/'/g,'');});
      inp.classList.toggle('ok',!!good); inp.classList.toggle('no',!good); if(good) ok++; });
    root.querySelector('#tsc').textContent=ok+' / '+ins.length+(ok===ins.length?' 🎉 Perfect!':'');
    var best=store('u'+D.n+'t')||0; if(ok>best) store('u'+D.n+'t',ok/ins.length>=.99?3:ok/ins.length>=.6?2:1); };
  root.querySelector('#show').onclick=function(){ ins.forEach(function(inp){ var g=GAPS[+inp.dataset.i]; inp.value=first(D.ansT[g.num]||''); inp.classList.remove('no'); inp.classList.add('ok'); }); };
  // role-play
  var me=null, step=0, wait=null, box=root.querySelector('#rpBox'), nx=root.querySelector('#next');
  function rp(){ box.innerHTML=D.lines.map(function(l,i){return '<div class="ln'+(l.who===me?' me':'')+'" data-r="'+i+'"><b>'+esc(l.who)+'</b><span>'+esc(lineText(l,i))+'</span></div>';}).join(''); }
  async function run(){ var t=token; var rows=box.querySelectorAll('.ln');
    while(step<D.lines.length){ if(t!==token) return; var r=rows[step]; r.classList.add('on'); r.scrollIntoView({block:'nearest',behavior:'smooth'});
      if(D.lines[step].who===me){ nx.disabled=false; await new Promise(function(res){wait=res;}); nx.disabled=true; }
      else { await say(lineText(D.lines[step],step), D.lines[step].who); }
      r.classList.remove('on'); step++; }
    if(t===token){ nx.disabled=true; box.insertAdjacentHTML('beforeend','<p class="score">🎬 Great job! Now swap roles.</p>'); } }
  root.querySelectorAll('.role').forEach(function(b){ b.onclick=function(){ stop(); me=b.dataset.w; step=0; rp(); run(); }; });
  nx.onclick=function(){ if(wait){var w=wait;wait=null;w();} };
  var sp=root.querySelector('#sndPlay'); if(sp) sp.onclick=async function(){ stop(); var t=token;
    for(var i=1;i<D.sound.length;i++){ if(t!==token) return; var s=D.sound[i].replace(/^[^!:]*[!:]\s*/,''); await say(s.replace(/\/[^/]*\//g,' ').replace(/[↗↘|·]/g,', ')); } };
  var prs=root.querySelectorAll('.pr'), timer=null;
  function ask(i){ stop(); prs.forEach(function(p){p.classList.toggle('pick',+p.dataset.p===i);}); var q=D.pairs[i].replace(/^[^A-Za-z“"]+/,'');
    say(q,'coach').then(function(){ var s=20, el=root.querySelector('#sec'); clearInterval(timer); el.textContent='⏱ '+s+'s — talk!';
      timer=setInterval(function(){ s--; el.textContent= s>0 ? '⏱ '+s+'s' : '✅ Time! Nice work.'; if(s<=0) clearInterval(timer); },1000); }); }
  prs.forEach(function(p){ p.onclick=function(){ ask(+p.dataset.p); }; });
  var rn=root.querySelector('#rnd'); if(rn) rn.onclick=function(){ ask(Math.floor(Math.random()*D.pairs.length)); };
}

/* ---------- read ---------- */
function isTF(a){ return /^(T|F|DS)$/i.test(String(a||'').trim()); }
function readHTML(){
  var paras=D.paras.map(function(p,i){ return (i===2 && D.pull ? '<div class="pull">'+esc(D.pull)+'</div>' : '')+'<div class="pp" data-p="'+i+'"><button aria-label="Listen to paragraph '+(i+1)+'">▶</button><div>'+esc(p)+'</div></div>'; }).join('');
  var nA=D.qa.length;
  var qa=D.qa.map(function(q,i){ var a=D.ansR[String(i+1)]||'', opts=q.match(/\b[a-c]\)\s[^·]+/g);
    var body = opts ? '<div class="row">'+opts.map(function(o){return '<button class="ch" data-k="'+o[0]+'">'+esc(o.trim())+'</button>';}).join('')+'</div>'
      : (a && a.length<=3 ? '<div class="row"><input data-a="'+esc(a)+'" style="max-width:120px" placeholder="…"><button class="btn sm ck">Check</button></div>'
      : '<input placeholder="Write your answer…"><div class="row"><button class="btn sm ghost sh" data-a="'+esc(a)+'">Show model answer</button></div>');
    return '<div class="q" data-a="'+esc(a)+'"><div>'+esc(opts? q.split(/\s+a\)/)[0] : q)+'</div>'+body+'<div class="model"></div></div>'; }).join('');
  var qb=D.qb.map(function(q,i){ var a=D.ansR[String(i+1+nA)]||'';
    var body = isTF(a) ? '<div class="row">'+['T','F','DS'].map(function(k){return '<button class="ch tf" data-k="'+k+'">'+(k==='T'?'True':k==='F'?'False':'Doesn’t say')+'</button>';}).join('')+'</div>'
      : '<input placeholder="Write here…">';
    return '<div class="q" data-a="'+esc(a)+'"><div>'+esc(q.replace(/\s*_{3,}\s*:?\s*$/,'').replace(/_{3,}/g,'…'))+'</div>'+body+'<div class="model"></div></div>'; }).join('');
  var words=D.paras.join(' ').split(/\s+/).length;
  return '<div class="card R"><div class="h"><span class="n">📖</span> '+esc(D.rtitle)+'<small>Unit '+D.n+' · Read</small></div>'+
    (D.rsub?'<div class="scene">'+esc(D.rsub)+'</div>':'')+
    '<div class="ctrl"><button class="btn" id="rAll">▶ Listen to the article</button><button class="btn ghost sm" id="rStop">■ Stop</button>'+speedCtl()+'</div>'+
    '<div class="art" id="art">'+paras+'</div></div>'+
    '<div class="card R"><div class="h"><span class="n">1</span> '+esc((D.atitle||'Answer the questions.').replace(/^A\.\s*/,''))+'</div>'+qa+'</div>'+
    (qb?'<div class="card R"><div class="h"><span class="n">2</span> '+(D.qb.length && isTF(D.ansR[String(nA+1)])?'True, False or Doesn’t say?':'Your ideas')+'</div>'+qb+'<div class="ctrl"><span class="score" id="tfs"></span></div></div>':'')+
    (D.qc?'<div class="card R"><div class="h"><span class="n">3</span> Language detective</div><p style="margin:0">'+esc(D.qc)+'</p><p class="hint">Look at the article above and find them. Check with your teacher or a partner.</p></div>':'')+
    '<div class="card R"><div class="h"><span class="n">⏱</span> Reading fluency challenge</div>'+
    '<p style="margin:0 0 6px">Read the whole article <b>out loud</b>. Tap <b>Start</b>, read, then tap <b>Stop</b>. B1 goal: about <b>120 words per minute</b> with good pronunciation.</p>'+
    '<div class="timer"><button class="btn" id="fl">▶ Start</button><span class="big" id="flt">0:00</span><span class="hint">'+words+' words</span><span class="score" id="flr"></span></div></div>';
}
function bindRead(root){
  bindSpeed(root);
  var pps=root.querySelectorAll('.pp');
  async function from(i,only){ stop(); var t=token; for(var k=i;k<D.paras.length;k++){ if(t!==token) return; pps[k].classList.add('on'); pps[k].scrollIntoView({block:'nearest',behavior:'smooth'}); await say(D.paras[k],'reader'); pps[k].classList.remove('on'); if(only) return; } }
  root.querySelector('#rAll').onclick=function(){ from(0); };
  root.querySelector('#rStop').onclick=stop;
  pps.forEach(function(p){ p.querySelector('button').onclick=function(){ from(+p.dataset.p,true); }; });
  var tfOk=0, tfDone=0;
  root.querySelectorAll('.q').forEach(function(q){
    var a=q.dataset.a, m=q.querySelector('.model');
    q.querySelectorAll('.ch').forEach(function(b){ b.onclick=function(){
      var right=String(a).trim().toLowerCase().indexOf(b.dataset.k.toLowerCase())===0 || norm(a)===norm(b.dataset.k);
      if(q.dataset.done) return; q.dataset.done=1;
      b.classList.add(right?'ok':'no');
      if(!right) q.querySelectorAll('.ch').forEach(function(x){ if(norm(a)===norm(x.dataset.k)||String(a).trim().toLowerCase().indexOf(x.dataset.k.toLowerCase())===0) x.classList.add('ok'); });
      if(b.classList.contains('tf')){ tfDone++; if(right) tfOk++; var s=root.querySelector('#tfs'); if(s) s.textContent=tfOk+' / '+tfDone+' correct'; }
    }; });
    var ck=q.querySelector('.ck'); if(ck) ck.onclick=function(){ var inp=q.querySelector('input'); var good=norm(inp.value)===norm(a); inp.style.borderColor=good?'var(--ok)':'var(--bad)'; m.innerHTML=good?'<b>✓ Correct!</b>':'Answer: <b>'+esc(a)+'</b>'; };
    var sh=q.querySelector('.sh'); if(sh) sh.onclick=function(){ m.innerHTML= a ? 'Model answer: <b>'+esc(a)+'</b> — your words can be different!' : 'Check with your teacher.'; };
  });
  var fl=root.querySelector('#fl'), t0=0, iv=null, words=D.paras.join(' ').split(/\s+/).length;
  fl.onclick=function(){ if(!iv){ stop(); t0=Date.now(); fl.textContent='■ Stop'; root.querySelector('#flr').textContent='';
      iv=setInterval(function(){ var s=Math.floor((Date.now()-t0)/1000); root.querySelector('#flt').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); },250); }
    else { clearInterval(iv); iv=null; fl.textContent='▶ Try again'; var sec=(Date.now()-t0)/1000, wpm=Math.round(words/(sec/60));
      var best=store('u'+D.n+'wpm')||0; if(wpm>best && sec>10) store('u'+D.n+'wpm',wpm);
      root.querySelector('#flr').textContent= sec<10 ? 'Too fast — did you read it all? 😉' : wpm+' words/min '+(wpm>=120?'🚀 B1 fluent!':wpm>=90?'👍 Almost there!':'💪 Keep practicing!')+(best?' · best: '+Math.max(best,wpm):''); } };
}

/* ---------- page ---------- */
function render(){
  stop();
  var tab = location.hash==='#read' ? 'read' : 'talk';
  var t=D.title.replace(/(\S+…?\??!?)$/,'<em>$1</em>');
  var prev=D.n>1?'<a href="../unit-'+(D.n-1)+'/'+location.hash+'">← Unit '+(D.n-1)+'</a>':'', next=D.n<25?'<a href="../unit-'+(D.n+1)+'/'+location.hash+'">Unit '+(D.n+1)+' →</a>':'';
  app.innerHTML='<header class="top"><div class="wrap"><nav class="crumbs"><a href="../../">Teen Lab</a><a href="../">B1 · Adventurer</a>'+prev+next+'</nav>'+
    '<div class="kick">UNIT '+D.n+' · ENGLISH LAB B1</div><h1>'+t+'</h1><p>'+esc(D.sub)+'</p></div></header>'+
    '<main class="wrap"><div class="tabs" role="tablist"><a role="tab" class="tab t" href="#talk" aria-selected="'+(tab==='talk')+'" style="text-decoration:none">🎧 Talk</a><a role="tab" class="tab r" href="#read" aria-selected="'+(tab==='read')+'" style="text-decoration:none">📖 Read</a></div>'+
    '<div id="pane">'+(tab==='talk'?talkHTML():readHTML())+'</div>'+
    (synth?'':'<div class="card">🔇 Your browser can’t read aloud. Try Chrome, Edge or Safari.</div>')+
    '<p class="foot">My English Adventure · Teen Edition · Level B1<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
  var pane=document.getElementById('pane'); if(tab==='talk') bindTalk(pane); else bindRead(pane);
  document.title='Unit '+D.n+' · '+(tab==='talk'?'Talk':'Read')+' · English Lab B1';
}
window.addEventListener('hashchange',function(){ render(); window.scrollTo(0,0); });
render();
})();
