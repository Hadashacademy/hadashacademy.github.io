/* Little Explorers Lab · My English Adventure Book 1 · for ages 5–7
   Listen & tap, say it (microphone), story with highlighted words, trace letters with your finger.
   All instructions are spoken by Ollie. */
(function(){
'use strict';
var N = window.UNIT, D = (window.LE || {})[N], app = document.getElementById('app');
if(!D){ app.innerHTML='<p style="padding:20px">Unit not found.</p>'; return; }
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('le:'+k)||'null');localStorage.setItem('le:'+k,JSON.stringify(v));}catch(e){return null;}}
var OLLIE = (window.LAB_FACES||{})['Ollie'] || '🦉';

/* ---------- voice ---------- */
var synth = window.speechSynthesis, voice = null, token = 0;
function pick(){ if(!synth) return; var v=synth.getVoices().filter(function(x){return /^en[-_]/i.test(x.lang);});
  var sc=function(x){var n=x.name;return /natural|neural/i.test(n)?6:/online/i.test(n)?5:/google|samantha|ava|allison|siri|enhanced/i.test(n)?4:/zira|david|mark|espeak/i.test(n)?0:2;};
  v.sort(function(a,b){return sc(b)-sc(a);}); voice=v[0]||null; }
if(synth){ pick(); synth.onvoiceschanged=pick; }
function say(text, opt){ opt=opt||{}; return new Promise(function(res){
  if(!synth){ res(); return; } var my=token;
  var u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=opt.rate||0.85; u.pitch=opt.pitch||1.15; if(voice) u.voice=voice;
  if(opt.onWord) u.onboundary=function(e){ if(e.name==='word'||e.name===undefined) opt.onWord(e.charIndex); };
  u.onend=u.onerror=function(){ res(); }; synth.speak(u); }); }
function hush(){ token++; if(synth) synth.cancel(); }
var CHEERS=['Yes! Great job!','Super!','Wonderful!','You did it!','Fantastic!','Well done!'];
function cheer(){ return CHEERS[Math.floor(Math.random()*CHEERS.length)]; }
function burst(el){ var b=document.createElement('div'); b.className='burst'; b.textContent='⭐'; el.appendChild(b); setTimeout(function(){b.remove();},900); }

/* ---------- layout ---------- */
var ACTS=[['listen','🎧','Workbook listening','Listen and tap the picture you hear.'],['tap','👆','Listen and tap','Listen. Tap the right picture.'],
          ['say','🎤','Say it!','Listen. Then say the word.'],['story','📖','Story time','Listen to the story.'],['trace','✏️','Trace','Trace the letter with your finger.']];
function header(){
  var prev=N>1?'<a class="nav" href="../unit-'+(N-1)+'/">◀</a>':'<span></span>', next=N<24?'<a class="nav" href="../unit-'+(N+1)+'/">▶</a>':'<span></span>';
  return '<header class="top"><div class="wrap"><nav class="crumbs"><a href="../../../../#kids">Junior</a><a href="../../../../#book1">Book 1</a><a href="../">Little Explorers</a></nav>'+
    '<div class="tt">'+prev+'<div><div class="kick">UNIT '+N+' · LITTLE EXPLORERS</div><h1>'+esc(D.title)+'</h1></div>'+next+'</div></div></header>';
}
function menu(){
  var cur=(location.hash||'#home').slice(1);
  return '<div class="acts">'+ACTS.map(function(a){ var st=store('u'+N+a[0]); return '<a class="act'+(cur===a[0]?' on':'')+'" href="#'+a[0]+'"><span class="ai">'+a[1]+'</span><span class="al">'+a[2]+'</span>'+(st?'<span class="done">⭐</span>':'')+'</a>'; }).join('')+'</div>';
}
function ollieBar(text){ return '<div class="ollie"><span class="ow">'+OLLIE+'</span><div class="bub">'+esc(text)+' <button class="rep" id="rep" aria-label="Say it again">🔊</button></div></div>'; }
function home(){
  return ollieBar('Hello, little explorer! Tap a picture to play.')+
    '<div class="words">'+D.words.map(function(w,i){ return '<button class="wc" data-i="'+i+'"><span class="we">'+w[0]+'</span><span class="ww">'+esc(w[1])+'</span></button>'; }).join('')+'</div>';
}
function render(){
  hush(); var cur=(location.hash||'#home').slice(1);
  var act=ACTS.filter(function(a){return a[0]===cur;})[0];
  app.innerHTML=header()+'<main class="wrap">'+menu()+'<div id="pane"></div><p class="foot">My English Adventure · Book 1 · Little Explorers<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
  var pane=document.getElementById('pane');
  if(!act){ pane.innerHTML=home(); pane.querySelectorAll('.wc').forEach(function(b){ b.onclick=function(){ say(D.words[+b.dataset.i][1]); b.classList.add('pop'); setTimeout(function(){b.classList.remove('pop');},400); }; });
    pane.querySelector('#rep').onclick=function(){ say('Hello, little explorer! Tap a picture to hear the word. Then choose a game.'); };
    document.title='Unit '+N+' · Little Explorers'; return; }
  document.title='Unit '+N+' · '+act[2]+' · Little Explorers';
  var run=function(){ ({listen:listenAct, tap:tapAct, say:sayAct, story:storyAct, trace:traceAct})[cur](pane, act); };
  if(navigator.userActivation && !navigator.userActivation.hasBeenActive){
    pane.innerHTML='<div class="start"><span class="ow">'+OLLIE+'</span><button class="btn huge" id="st">▶ Start</button><p>'+esc(act[2])+'</p></div>';
    pane.querySelector('#st').onclick=run; }
  else run();
}
function finish(pane, key, msg){ store('u'+N+key, 1);
  pane.insertAdjacentHTML('beforeend','<div class="win"><div class="big">🎉</div><b>'+esc(msg||'You did it!')+'</b><div class="row"><a class="btn" href="#home">🏠 Home</a>'+(N<24?'<a class="btn" href="../unit-'+(N+1)+'/">Next unit ▶</a>':'')+'</div></div>');
  say((msg||'You did it!')+' Great job, little explorer!'); }

/* ---------- picture rounds (used by listen + tap) ---------- */
function rounds(pane, list, key, intro){
  var i=0, score=0;
  function show(){
    if(i>=list.length){ finish(pane,key, score===list.length?'Perfect! All correct!':'You did it!'); return; }
    var r=list[i];
    pane.innerHTML=ollieBar(intro)+'<div class="prog">'+list.map(function(_,k){return '<span class="'+(k<i?'ok':k===i?'cur':'')+'"></span>';}).join('')+'</div>'+
      '<div class="q"><button class="play" id="pl">🔊 Number '+(i+1)+'</button></div><div class="opts">'+r.opts.map(function(o,k){ return '<button class="op" data-k="'+k+'"><span>'+o[0]+'</span></button>'; }).join('')+'</div>';
    var ask=function(){ return say('Number '+(i+1)+'. Find the '+r.target+'.'); };
    pane.querySelector('#pl').onclick=ask; pane.querySelector('#rep').onclick=function(){ say(intro).then(ask); };
    var tries=0;
    pane.querySelectorAll('.op').forEach(function(b){ b.onclick=function(){
      var o=r.opts[+b.dataset.k];
      if(o[1]===r.target){ b.classList.add('right'); burst(b); if(!tries) score++; hush(); say(cheer()+' '+r.target+'!').then(function(){ i++; show(); }); }
      else { tries++; b.classList.add('wrong'); setTimeout(function(){b.classList.remove('wrong');},600); hush(); say('Oops! That is '+o[1]+'. Try again!').then(ask); }
    }; });
    ask();
  }
  say(intro).then(show);
}
function listenAct(pane, act){ rounds(pane, D.listen, 'listen', 'Listen and tap the picture you hear. It is the same as page 3 of your workbook!'); }
function tapAct(pane, act){
  var w=D.words.slice(), list=[];
  w.forEach(function(t){ var o=[t]; var rest=w.filter(function(x){return x[1]!==t[1];}).sort(function(){return Math.random()-.5;}).slice(0,2); o=o.concat(rest).sort(function(){return Math.random()-.5;}); list.push({target:t[1], opts:o}); });
  list.sort(function(){return Math.random()-.5;});
  rounds(pane, list, 'tap', 'Listen. Tap the right picture.');
}

/* ---------- say it ---------- */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function sayAct(pane){
  var i=0, good=0;
  function norm(s){ return String(s).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim(); }
  function show(){
    if(i>=D.words.length){ finish(pane,'say','Great speaking!'); return; }
    var w=D.words[i];
    pane.innerHTML=ollieBar('Listen. Then say the word.')+'<div class="prog">'+D.words.map(function(_,k){return '<span class="'+(k<i?'ok':k===i?'cur':'')+'"></span>';}).join('')+'</div>'+
      '<div class="card1"><div class="bigE">'+w[0]+'</div><div class="bigW">'+esc(w[1])+'</div><div class="row"><button class="btn" id="hear">🔊 Listen</button>'+
      (SR?'<button class="btn mic" id="mic">🎤 Say it</button>':'<button class="btn mic" id="did">✅ I said it!</button>')+'</div><div class="heard" id="hd"></div></div>';
    var hear=function(){ return say(w[1], {rate:.75}); };
    pane.querySelector('#hear').onclick=hear; pane.querySelector('#rep').onclick=function(){ say('Listen. Then say the word.').then(hear); };
    var hd=pane.querySelector('#hd');
    if(!SR){ pane.querySelector('#did').onclick=function(){ say(cheer()).then(function(){ i++; show(); }); }; }
    else pane.querySelector('#mic').onclick=function(){
      var b=this; hush(); b.classList.add('rec'); b.textContent='👂 Listening…'; hd.textContent='';
      var rec=new SR(); rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=5; var got=false;
      rec.onresult=function(e){ got=true; var alts=[]; for(var a=0;a<e.results[0].length;a++) alts.push(norm(e.results[0][a].transcript));
        var target=norm(w[1]), ok=alts.some(function(t){ return t===target || (' '+t+' ').indexOf(' '+target+' ')>=0 || target.split(' ').every(function(p){return t.indexOf(p)>=0;}); });
        hd.textContent='I heard: “'+e.results[0][0].transcript+'”';
        if(ok){ good++; burst(pane.querySelector('.card1')); say(cheer()).then(function(){ i++; show(); }); }
        else say('Almost! Listen and try again.').then(hear); };
      rec.onerror=function(e){ if(e.error==='not-allowed') hd.textContent='🔒 Please allow the microphone.'; };
      rec.onend=function(){ b.classList.remove('rec'); b.textContent='🎤 Say it'; if(!got && !hd.textContent){ hd.textContent='I didn’t hear you.'; say('I didn’t hear you. Say it a little louder!'); } };
      try{ rec.start(); }catch(e){}
    };
    say('Say: '+w[1], {rate:.75});
  }
  say('Listen. Then say the word. Tap the microphone and say it!').then(show);
}

/* ---------- story with highlighted words ---------- */
function storyAct(pane){
  var html=D.story.map(function(s,si){ var off=0; return '<p class="sl" data-s="'+si+'">'+s.split(' ').map(function(w,wi){ var h='<span class="sw" data-c="'+off+'">'+esc(w)+'</span>'; off+=w.length+1; return h; }).join(' ')+'</p>'; }).join('');
  var pics=D.words.slice(0,4).map(function(w){return '<span>'+w[0]+'</span>';}).join('');
  pane.innerHTML=ollieBar('Listen to the story. Look at the words!')+'<div class="story"><div class="spics">'+pics+'</div>'+html+'<div class="row"><button class="btn" id="go">▶ Read to me</button><button class="btn ghost" id="slow">🐢 Slow</button></div><p class="hint">Tap any word to hear it.</p></div>';
  var rate=.85, played=false;
  async function read(){ hush(); var my=token; var lines=pane.querySelectorAll('.sl');
    for(var si=0;si<lines.length;si++){ if(my!==token) return; var spans=[].slice.call(lines[si].querySelectorAll('.sw')); var got=false;
      lines[si].classList.add('now');
      var timers=[]; var est=function(){ var t=0; spans.forEach(function(sp,k){ timers.push(setTimeout(function(){ if(!got){ spans.forEach(function(x){x.classList.remove('lit');}); sp.classList.add('lit'); } }, t)); t+= (260+sp.textContent.length*55)/rate; }); };
      est();
      await say(D.story[si], {rate:rate, onWord:function(ci){ got=true; spans.forEach(function(x){ x.classList.toggle('lit', +x.dataset.c===ci || (+x.dataset.c<=ci && ci< +x.dataset.c+x.textContent.length)); }); }});
      timers.forEach(clearTimeout); spans.forEach(function(x){x.classList.remove('lit');}); lines[si].classList.remove('now');
      await new Promise(function(r){setTimeout(r,350);}); }
    if(my===token && !played){ played=true; finish(pane,'story','What a nice story!'); } }
  pane.querySelector('#go').onclick=function(){ rate=.85; read(); };
  pane.querySelector('#slow').onclick=function(){ rate=.6; read(); };
  pane.querySelector('#rep').onclick=function(){ say('Listen to the story. Look at the words!'); };
  pane.querySelectorAll('.sw').forEach(function(s){ s.onclick=function(){ hush(); s.classList.add('lit'); say(s.textContent.replace(/[^A-Za-z’']/g,''),{rate:.7}).then(function(){ s.classList.remove('lit'); }); }; });
  say('Listen to the story. Tap Read to me!');
}

/* ---------- trace letters with your finger ---------- */
function traceAct(pane){
  var letters=[]; D.words.forEach(function(w){ var c=w[1].charAt(0).toUpperCase(); if(/[A-Z]/.test(c) && letters.indexOf(c)<0) letters.push(c); });
  letters=letters.slice(0,4); var i=0;
  function show(){
    if(i>=letters.length){ finish(pane,'trace','Beautiful letters!'); return; }
    var L=letters[i], word=D.words.filter(function(w){return w[1].charAt(0).toUpperCase()===L;})[0];
    pane.innerHTML=ollieBar('Trace the letter with your finger.')+'<div class="prog">'+letters.map(function(_,k){return '<span class="'+(k<i?'ok':k===i?'cur':'')+'"></span>';}).join('')+'</div>'+
      '<div class="trace"><div class="tw">'+word[0]+' <b>'+L+'</b> is for <b>'+esc(word[1])+'</b></div><canvas id="cv" width="600" height="600"></canvas><div class="row"><button class="btn ghost" id="clr">🧽 Clear</button><button class="btn" id="hearL">🔊 Listen</button></div></div>';
    var cv=pane.querySelector('#cv'), ctx=cv.getContext('2d'), mask=document.createElement('canvas'); mask.width=mask.height=600; var mx=mask.getContext('2d');
    function base(){ ctx.clearRect(0,0,600,600); ctx.fillStyle='#fff'; ctx.fillRect(0,0,600,600);
      ctx.strokeStyle='#E3E6EF'; ctx.lineWidth=3; [140,300,460].forEach(function(y){ ctx.beginPath(); ctx.moveTo(30,y); ctx.lineTo(570,y); ctx.stroke(); });
      ctx.font='bold 420px Poppins, Arial, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#EEF0F6'; ctx.fillText(L,300,470); ctx.setLineDash([14,12]); ctx.lineWidth=5; ctx.strokeStyle='#A9B1C9'; ctx.strokeText(L,300,470); ctx.setLineDash([]);
      mx.clearRect(0,0,600,600); mx.font=ctx.font; mx.textAlign='center'; mx.fillStyle='#000'; mx.fillText(L,300,470); }
    base(); var ink=document.createElement('canvas'); ink.width=ink.height=600; var ix=ink.getContext('2d');
    var down=false, last=null, checked=false;
    function pos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*600/r.width, y:(e.clientY-r.top)*600/r.height}; }
    function line(a,b){ [ctx,ix].forEach(function(c){ c.strokeStyle=c===ctx?'#F26B00':'#000'; c.lineWidth=56; c.lineCap='round'; c.lineJoin='round'; c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.stroke(); }); }
    cv.onpointerdown=function(e){ down=true; last=pos(e); line(last,last); cv.setPointerCapture(e.pointerId); };
    cv.onpointermove=function(e){ if(!down) return; var p=pos(e); line(last,p); last=p; };
    cv.onpointerup=cv.onpointercancel=function(){ down=false; check(); };
    function check(){ if(checked) return;
      var m=mx.getImageData(0,0,600,600).data, k=ix.getImageData(0,0,600,600).data, inL=0, cov=0, inkN=0, out=0;
      for(var p=3;p<m.length;p+=16){ var a=m[p]>128, b=k[p]>128; if(a){inL++; if(b) cov++;} if(b){inkN++; if(!a) out++;} }
      var c=cov/Math.max(1,inL), o=out/Math.max(1,inkN);
      if(c>0.45 && o<0.7){ checked=true; burst(pane.querySelector('.trace')); say(cheer()+' '+L+' is for '+word[1]+'!').then(function(){ i++; show(); }); }
    }
    pane.querySelector('#clr').onclick=function(){ base(); ix.clearRect(0,0,600,600); checked=false; };
    var hearL=function(){ return say(L+'. '+L+' is for '+word[1]+'.',{rate:.75}); };
    pane.querySelector('#hearL').onclick=hearL; pane.querySelector('#rep').onclick=function(){ say('Trace the letter with your finger.').then(hearL); };
    hearL();
  }
  say('Trace the letter with your finger. Start at the top!').then(show);
}

window.addEventListener('hashchange', function(){ render(); scrollTo(0,0); });
render();
})();
