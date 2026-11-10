(function(){
'use strict';
var D = (window.WB || []).filter(function(u){return u.n === window.UNIT;})[0];
var app = document.getElementById('app');
if(!D){app.innerHTML='<div class="wrap"><div class="card">Unit not found.</div></div>';return;}

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function norm(s){return String(s).toLowerCase().replace(/[’‘`]/g,"'").replace(/[.,!?;:"“”]/g,' ').replace(/\s+/g,' ').trim();}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('b1wb:'+k)||'null');localStorage.setItem('b1wb:'+k,JSON.stringify(v));}catch(e){return null;}}

/* ---------- speech (same voices as the Student's Book lab) ---------- */
var synth = window.speechSynthesis, voices = [], rate = 1, token = 0;
function vq(v){var n=v.name+' '+(v.voiceURI||''),l=(v.lang||'').replace('_','-').toLowerCase(),s=1;if(/natural|neural/i.test(n))s=6;else if(/online/i.test(n))s=5;else if(/google|premium|enhanced|siri/i.test(n))s=4;else if(/samantha|ava|allison|alex|daniel|karen|moira/i.test(n))s=3;if(/zira|david|mark|hazel|espeak|compact/i.test(n))s=0;if(l==='en-us')s+=0.5;return s;}
function loadVoices(){ if(!synth) return; voices = synth.getVoices().filter(function(x){return /^en[-_]/i.test(x.lang);}).sort(function(a,b){return vq(b)-vq(a);}); }
if(synth){loadVoices(); synth.onvoiceschanged=loadVoices;}
var cast = {};
function voiceFor(who){ if(!voices.length) return null; if(!(who in cast)) cast[who]=Object.keys(cast).length; return voices[cast[who] % voices.length]; }
function stop(){ token++; if(synth) synth.cancel(); document.querySelectorAll('.ln.on').forEach(function(e){e.classList.remove('on');}); }
function say(text, who){ return new Promise(function(res){
  if(!synth){res();return;}
  var u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=rate;
  var v=voiceFor(who); if(v){u.voice=v;u.lang=v.lang;}
  if(cast[who]%2===1 && voices.length<2) u.pitch=1.25;
  u.onend=u.onerror=function(){res();}; synth.speak(u); }); }
function playAll(root){
  stop(); var my=++token, i=0, lines=root.querySelectorAll('#tr .ln');
  (function next(){ if(my!==token||i>=D.lines.length){ lines.forEach(function(e){e.classList.remove('on');}); return; }
    lines.forEach(function(e,k){e.classList.toggle('on',k===i);});
    var L=D.lines[i]; say(L.text, L.who).then(function(){ i++; setTimeout(next,250); }); })();
}

/* ---------- gaps ---------- */
var GAPS=[];
D.gaps.forEach(function(g){
  var re=new RegExp('(^|[^A-Za-z\u2019\'])('+g.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![A-Za-z])','g');
  for(var i=0;i<D.lines.length;i++){
    var m, t=D.lines[i].text, done=false; re.lastIndex=0;
    while((m=re.exec(t))){ var at=m.index+m[1].length, end=at+g.length;
      if(!GAPS.some(function(x){return x.li===i && at<x.at+x.ans.length && end>x.at;})){ GAPS.push({li:i,ans:g,at:at}); done=true; break; } }
    if(done) break;
  }
});
GAPS.sort(function(a,b){return a.li-b.li||a.at-b.at;});

function render(){
  stop();
  var best=store('u'+D.n)||0;
  var t=esc(D.title).replace(/(\S+)$/,'<em>$1</em>');
  var prev=D.n>1?'<a href="../unit-'+(D.n-1)+'/">← Unit '+(D.n-1)+'</a>':'', next=D.n<25?'<a href="../unit-'+(D.n+1)+'/">Unit '+(D.n+1)+' →</a>':'';
  var tr=D.lines.map(function(l){return '<div class="ln"><b>'+esc(l.who)+'</b><span>'+esc(l.text)+'</span></div>';}).join('');
  var qs=D.qs.map(function(q,qi){return '<div class="q"><b>'+(qi+1)+'.</b> '+esc(q.q)+'<div class="row">'+q.o.map(function(o,oi){return '<button class="ch" data-q="'+qi+'" data-o="'+oi+'">'+String.fromCharCode(97+oi)+') '+esc(o)+'</button>';}).join('')+'</div></div>';}).join('');
  var byLine={}; GAPS.forEach(function(g,gi){ (byLine[g.li]=byLine[g.li]||[]).push({g:g,gi:gi}); });
  var gl=Object.keys(byLine).map(Number).sort(function(a,b){return a-b;}).map(function(li){ var L=D.lines[li], s=L.text, pos=0, h='';
    byLine[li].forEach(function(x){ h+=esc(s.slice(pos,x.g.at))+'<span class="gn">'+(x.gi+1)+'</span><input class="gap" data-g="'+x.gi+'" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Gap '+(x.gi+1)+'">'; pos=x.g.at+x.g.ans.length; });
    return '<div class="ln"><b>'+esc(L.who)+'</b><span>'+h+esc(s.slice(pos))+'</span></div>'; }).join('');
  app.innerHTML='<header class="top wbtop"><div class="wrap"><nav class="crumbs"><a href="../../../">Teen Lab</a><a href="../../">B1 · Adventurer</a><a href="../">Workbook</a>'+prev+next+'</nav>'+
    '<div class="kick">UNIT '+D.n+' · WORKBOOK LISTENING</div><h1>'+t+'</h1><p>'+esc(D.unit)+' · '+esc(D.theme)+'</p></div></header>'+
    '<main class="wrap">'+
    '<div class="card" style="margin-top:-28px;position:relative;box-shadow:0 8px 24px rgba(10,60,90,.12)"><div class="h"><span class="n">🎧</span>Listen<small>'+(best?'★'.repeat(best)+' your best':'')+'</small></div>'+
      '<div class="scene">'+esc(D.setting)+'</div>'+
      '<div class="ctrl"><button class="btn" id="play">▶ Play</button><button class="btn ghost" id="stop">■ Stop</button><button class="btn ghost sm" id="show">👁 Show transcript</button>'+
      '<div class="speed">Speed <button data-r="0.8">Slow</button><button data-r="1" aria-pressed="true">Normal</button></div></div>'+
      '<div class="dlg" id="tr" hidden>'+tr+'</div></div>'+
    '<div class="card"><div class="h"><span class="n">1</span>Listen and choose the correct answer<small id="s1"></small></div>'+qs+'</div>'+
    '<div class="card"><div class="h"><span class="n">2</span>Listen again and complete<small id="s2"></small></div><p class="hint" style="margin-top:0">Write the missing words. Then press <b>Check</b>.</p><div class="dlg">'+gl+'</div>'+
      '<div class="ctrl"><button class="btn" id="chk">✓ Check</button><button class="btn ghost sm" id="ans">Show answers</button></div></div>'+
    '<div class="card wbnote">📒 <b>In your Workbook:</b> page '+D.page+', exercise 9. Write your answers there too!</div>'+
    (synth?'':'<div class="card">🔇 Your browser can’t read aloud. Try Chrome, Edge or Safari.</div>')+
    '<div class="card fin" id="fin" hidden></div>'+
    '<p class="foot">My English Adventure · Teen Edition · Workbook B1<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
  bind();
  document.title='Unit '+D.n+' · Workbook listening · English Lab B1';
}

var res1={}, res2=null;
function bind(){
  var root=app;
  root.querySelector('#play').onclick=function(){ playAll(root); };
  root.querySelector('#stop').onclick=stop;
  root.querySelector('#show').onclick=function(){ var tr=root.querySelector('#tr'); tr.hidden=!tr.hidden; this.textContent=tr.hidden?'👁 Show transcript':'🙈 Hide transcript'; };
  root.querySelectorAll('.speed button').forEach(function(b){ b.onclick=function(){ rate=+b.dataset.r; root.querySelectorAll('.speed button').forEach(function(x){x.setAttribute('aria-pressed', x===b);}); }; });
  root.querySelectorAll('.ch').forEach(function(b){ b.onclick=function(){
    var qi=+b.dataset.q, oi=+b.dataset.o; if(qi in res1) return;
    var ok=oi===D.qs[qi].c; res1[qi]=ok;
    root.querySelectorAll('.ch[data-q="'+qi+'"]').forEach(function(x){ var xo=+x.dataset.o; if(xo===D.qs[qi].c) x.classList.add('ok'); else if(xo===oi) x.classList.add('no'); x.disabled=true; });
    var n=Object.keys(res1).length, good=Object.values(res1).filter(Boolean).length;
    root.querySelector('#s1').textContent=good+' / '+D.qs.length;
    if(n===D.qs.length) finish(); }; });
  root.querySelector('#chk').onclick=function(){
    var good=0; root.querySelectorAll('input.gap').forEach(function(inp){ var g=GAPS[+inp.dataset.g]; var ok=norm(inp.value)===norm(g.ans); inp.classList.toggle('ok',ok); inp.classList.toggle('no',!ok); if(ok) good++; });
    res2=good; root.querySelector('#s2').textContent=good+' / '+GAPS.length; finish(); };
  root.querySelector('#ans').onclick=function(){ root.querySelectorAll('input.gap').forEach(function(inp){ var g=GAPS[+inp.dataset.g]; if(!inp.classList.contains('ok')){ inp.value=g.ans; inp.classList.remove('no'); inp.classList.add('shown'); } }); };
}
function finish(){
  if(Object.keys(res1).length<D.qs.length || res2===null) return;
  var good=Object.values(res1).filter(Boolean).length+res2, tot=D.qs.length+GAPS.length;
  var stars=good>=tot-1?3:good>=Math.ceil(tot*0.6)?2:good>=Math.ceil(tot*0.35)?1:0;
  var best=store('u'+D.n)||0; if(stars>best) store('u'+D.n,stars);
  var f=document.getElementById('fin'); f.hidden=false;
  f.innerHTML='<div class="h"><span class="n">⭐</span>Your result</div><p class="big">'+good+' / '+tot+' &nbsp; '+(stars?'★'.repeat(stars):'☆')+'</p><p>'+(stars===3?'Excellent! You understood everything. 🎉':stars===2?'Great job! Listen once more and check the transcript. 👍':'Keep practicing! Use the slow speed and the transcript. 💪')+'</p>'+
    (D.n<25?'<a class="btn" href="../unit-'+(D.n+1)+'/" style="text-decoration:none">Next unit →</a>':'<a class="btn" href="../" style="text-decoration:none">All units</a>');
}
window.addEventListener('beforeunload',stop);
render();
})();
