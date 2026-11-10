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
  var done=false, fin=function(){ if(!done){ done=true; res(); } };
  u.onend=u.onerror=fin; setTimeout(fin, 2500+text.length*110/(u.rate||1)); synth.speak(u); }); }
function hush(){ token++; if(synth) synth.cancel(); }
var CHEERS=['Yes! Great job!','Super!','Wonderful!','You did it!','Fantastic!','Well done!'];
function cheer(){ return CHEERS[Math.floor(Math.random()*CHEERS.length)]; }
function burst(el){ var b=document.createElement('div'); b.className='burst'; b.textContent='⭐'; el.appendChild(b); setTimeout(function(){b.remove();},900); }

/* ---------- layout ---------- */
var ACTS=[['listen','🎧','Workbook listening','Listen and tap the picture you hear.'],['tap','👆','Listen and tap','Listen. Tap the right picture.'],
          ['say','🎤','Say it!','Listen. Then say the word.'],['story','📖','Story time','Listen, read and answer.'],['trace','✏️','Trace','Trace the letter with your finger.']];
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
  say(intro); show();
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
  say('Listen. Then say the word. Tap the microphone and say it!'); show();
}

/* ---------- story: listen · now you read · questions ---------- */
var NUMW={'0':'zero','1':'one','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven','8':'eight','9':'nine','10':'ten','11':'eleven','12':'twelve'};
function tok(s){ return String(s).toLowerCase().replace(/[’]/g,"'").replace(/(\d+):00/g,"$1 o'clock").replace(/\d+/g,function(d){return ' '+(NUMW[d]||d)+' ';}).replace(/[^a-z' ]+/g,' ').split(/\s+/).filter(Boolean); }
function same(a,b){ a=a.replace(/'/g,''); b=b.replace(/'/g,''); return a===b || a+'s'===b || a===b+'s' || (a==='oclock'&&b==='clock') || (a==='mom'&&b==='mum') || (a==='hooray'&&/^hur?ray$/.test(b)); }
function compare(expected, said){ // word-by-word LCS: which story words were heard
  var disp=expected.split(/\s+/), E=disp.map(function(w){ return tok(w).join(''); }), S=tok(said), n=E.length, m=S.length, L=[], i, j;
  for(i=0;i<=n;i++) L.push(new Array(m+1).fill(0));
  for(i=n-1;i>=0;i--) for(j=m-1;j>=0;j--) L[i][j]= E[i]&&same(E[i],S[j]) ? 1+L[i+1][j+1] : Math.max(L[i+1][j],L[i][j+1]);
  var ok=new Array(n).fill(false); i=0; j=0; while(i<n&&j<m){ if(E[i]&&same(E[i],S[j])){ ok[i]=true; i++; j++; } else if(L[i+1][j]>=L[i][j+1]) i++; else j++; }
  var cnt=E.filter(Boolean).length, hit=ok.filter(Boolean).length;
  return {ok:ok, pct: cnt?Math.round(hit*100/cnt):0, missed: disp.filter(function(w,k){ return E[k] && !ok[k]; }).map(clean)};
}
function clean(w){ return w.replace(/^[^A-Za-z0-9’']+|[^A-Za-z0-9’']+$/g,''); }
function hear1(onText){ // one listening turn; resolves with what was heard ('' if nothing)
  return new Promise(function(res){ var rec=new SR(), fin='', last='';
    rec.lang='en-US'; rec.interimResults=true; rec.maxAlternatives=1;
    rec.onresult=function(e){ var t='', f=''; for(var k=0;k<e.results.length;k++){ if(e.results[k].isFinal) f+=e.results[k][0].transcript+' '; else t+=e.results[k][0].transcript; } fin=f; last=(f+t).trim(); if(onText) onText(last); };
    rec.onerror=function(e){ if(e.error==='not-allowed') res('#denied'); };
    rec.onend=function(){ res((fin||last).trim()); };
    try{ rec.start(); }catch(e){ res(''); } }); }
function stars(n,of){ var h=''; for(var k=0;k<(of||3);k++) h+='<span class="'+(k<n?'son':'')+'">★</span>'; return '<span class="stars">'+h+'</span>'; }
function storyAct(pane){
  var cur='listen', gen=0;
  function tabs(){ return '<div class="stabs">'+[['listen','📖 Listen'],['read','🎤 Now you read!'],['qs','❓ Questions']].map(function(t){ return '<a class="stab'+(t[0]===cur?' on':'')+'" data-m="'+t[0]+'">'+t[1]+'</a>'; }).join('')+'</div>'; }
  function mode(m){ hush(); gen++; cur=m; pane.innerHTML=''; ({listen:listenMode, read:readMode, qs:qsMode})[m](); }
  pane.onclick=function(e){ var t=e.target.closest && e.target.closest('.stab'); if(t) mode(t.dataset.m); };
  function spans(s){ var off=0; return s.split(' ').map(function(w,wi){ var h='<span class="sw" data-c="'+off+'" data-i="'+wi+'">'+esc(w)+'</span>'; off+=w.length+1; return h; }).join(' '); }
  function tapWords(root){ root.querySelectorAll('.sw').forEach(function(s){ s.onclick=function(){ hush(); s.classList.add('lit'); say(clean(s.textContent),{rate:.7}).then(function(){ s.classList.remove('lit'); }); }; }); }

  /* 1 · listen with highlighted words */
  function listenMode(){ var g=gen;
    var pics=D.words.slice(0,4).map(function(w){return '<span>'+w[0]+'</span>';}).join('');
    pane.innerHTML=ollieBar('Listen to the story. Look at the words!')+tabs()+'<div class="story"><div class="spics">'+pics+'</div>'+D.story.map(function(s,si){ return '<p class="sl" data-s="'+si+'">'+spans(s)+'</p>'; }).join('')+
      '<div class="row"><button class="btn" id="go">▶ Read to me</button><button class="btn ghost" id="slow">🐢 Slow</button></div><p class="hint">Tap any word to hear it.</p><div id="nx"></div></div>';
    var rate=.85;
    async function read(){ hush(); var my=token; var lines=pane.querySelectorAll('.sl');
      for(var si=0;si<lines.length;si++){ if(my!==token) return; var sp=[].slice.call(lines[si].querySelectorAll('.sw')); var got=false;
        lines[si].classList.add('now');
        var timers=[], t=0; sp.forEach(function(x){ timers.push(setTimeout(function(){ if(!got){ sp.forEach(function(y){y.classList.remove('lit');}); x.classList.add('lit'); } }, t)); t+=(260+x.textContent.length*55)/rate; });
        await say(D.story[si], {rate:rate, onWord:function(ci){ got=true; sp.forEach(function(x){ x.classList.toggle('lit', +x.dataset.c<=ci && ci< +x.dataset.c+x.textContent.length); }); }});
        timers.forEach(clearTimeout); sp.forEach(function(x){x.classList.remove('lit');}); lines[si].classList.remove('now');
        await new Promise(function(r){setTimeout(r,350);}); }
      if(my!==token || g!==gen) return;
      pane.querySelector('#nx').innerHTML='<div class="row"><button class="btn mic" id="toread">🎤 Now you read!</button></div>';
      pane.querySelector('#toread').onclick=function(){ mode('read'); };
      say('Now it is your turn. Tap Now you read!'); }
    pane.querySelector('#go').onclick=function(){ rate=.85; read(); };
    pane.querySelector('#slow').onclick=function(){ rate=.6; read(); };
    pane.querySelector('#rep').onclick=function(){ say('Listen to the story. Tap Read to me!'); };
    tapWords(pane);
    say('Listen to the story. Tap Read to me!');
  }

  /* 2 · now you read: Ollie listens, green words, stars, practice tray */
  function readMode(){
    var g=gen, i=0, best=D.story.map(function(){return null;}), tray={};
    function trayHTML(){ var ks=Object.keys(tray); if(!ks.length) return '';
      return '<div class="tray"><b>🎯 Practice these words</b><p>Tap a word. Listen. Say it!</p><div class="tw2">'+ks.map(function(w){ return '<button class="pw'+(tray[w]?' pok':'')+'" data-w="'+esc(w)+'">'+(tray[w]?'✅ ':'🔊 ')+esc(w)+'</button>'; }).join('')+'</div><div class="heard" id="ph"></div></div>'; }
    function bindTray(){ pane.querySelectorAll('.pw').forEach(function(b){ b.onclick=function(){ practice(b); }; }); }
    function practice(b){ if(b.classList.contains('rec')) return; var w=b.dataset.w, ph=pane.querySelector('#ph'); hush();
      b.classList.add('rec'); ph.textContent='';
      say(w,{rate:.65}).then(function(){ return say('Your turn!',{rate:.9}); }).then(function(){
        if(!SR){ b.classList.remove('rec'); tray[w]=1; b.className='pw pok'; b.textContent='✅ '+w; return; }
        ph.textContent='👂 Listening…';
        return hear1(function(t){ ph.textContent='👂 '+t; }).then(function(t){ b.classList.remove('rec');
          if(t==='#denied'){ ph.textContent='🔒 Please allow the microphone.'; return; }
          if(!t){ ph.textContent='I didn’t hear you.'; say('I didn’t hear you. Tap the word and say it louder!'); return; }
          var r=compare(w,t); ph.textContent='I heard: “'+t+'”';
          if(r.pct===100){ tray[w]=1; b.className='pw pok'; b.textContent='✅ '+w; burst(b); say(cheer()+' '+w+'!'); }
          else say('Almost! Listen: '+w+'. Tap and try again!'); }); }); }
    function show(){ if(g!==gen) return;
      if(i>=D.story.length) return summary();
      var s=D.story[i], r=best[i];
      pane.innerHTML=ollieBar('Read the sentence. Tap the microphone!')+tabs()+
        '<div class="prog">'+D.story.map(function(_,k){return '<span class="'+(best[k]?'ok':k===i?'cur':'')+'"></span>';}).join('')+'</div>'+
        '<div class="card1 rd"><p class="sl big">'+spans(s)+'</p><div id="st">'+(r?stars(r.stars):'')+'</div>'+
        '<div class="row"><button class="btn ghost" id="hear">🔊 Listen</button>'+(SR?'<button class="btn mic" id="mic">🎤 I read</button>':'<button class="btn mic" id="did">✅ I read it!</button>')+
        (r?'<button class="btn" id="nxt">'+(i<D.story.length-1?'Next ▶':'Finish 🏁')+'</button>':'')+'</div><div class="heard" id="hd"></div></div>'+trayHTML();
      if(r) paint(r);
      var card=pane.querySelector('.rd'), hd=pane.querySelector('#hd');
      tapWords(card); bindTray();
      pane.querySelector('#hear').onclick=function(){ hush(); say(s,{rate:.7}); };
      pane.querySelector('#rep').onclick=function(){ say('Read the sentence. Tap the microphone and read it out loud!'); };
      if(pane.querySelector('#nxt')) pane.querySelector('#nxt').onclick=function(){ i++; show(); };
      if(!SR){ pane.querySelector('#did').onclick=function(){ best[i]={stars:3, ok:null}; say(cheer()).then(function(){ i++; show(); }); }; }
      else pane.querySelector('#mic').onclick=function(){ var b=this; hush(); b.classList.add('rec'); b.textContent='👂 Listening…'; hd.textContent='';
        card.querySelectorAll('.sw').forEach(function(x){ x.classList.remove('wok','wno'); });
        hear1(function(t){ if(g!==gen) return; hd.textContent='👂 '+t; var c=compare(s,t); paint(c, true); }).then(function(t){ if(g!==gen) return; b.classList.remove('rec'); b.textContent='🎤 I read';
          if(t==='#denied'){ hd.textContent='🔒 Please allow the microphone.'; return; }
          if(!t){ hd.textContent='I didn’t hear you.'; say('I didn’t hear you. Read a little louder!'); return; }
          var c=compare(s,t); c.stars=c.pct>=90?3:c.pct>=60?2:1;
          if(!best[i] || c.pct>=best[i].pct) best[i]=c;
          c.missed.forEach(function(w){ if(!(w in tray)) tray[w]=0; });
          var msg = c.stars===3 ? cheer()+' You read it all! Three stars!' :
                    c.stars===2 ? 'Good reading! Two stars! Practice '+(c.missed.length>1?'these words':'this word')+': '+c.missed.join(', ')+'.' :
                    'Nice try! One star. Listen and read again. You can do it!';
          if(c.stars===3) burst(card);
          show(); paint(c); pane.querySelector('#st').innerHTML=stars(c.stars); pane.querySelector('#hd').textContent='I heard: “'+t+'”'; say(msg); }); };
      if(!r) say(s,{rate:.75}).then(function(){ return say('Now you read it!'); });
    }
    function paint(c, live){ pane.querySelectorAll('.rd .sw').forEach(function(x,k){ if(c.ok===null) return; x.classList.toggle('wok', !!c.ok[k]); x.classList.toggle('wno', !live && !c.ok[k] && !!clean(x.textContent)); }); }
    function summary(){
      var tot=best.reduce(function(a,b){return a+(b?b.stars:0);},0), max=D.story.length*3, left=Object.keys(tray).filter(function(w){return !tray[w];});
      pane.innerHTML=ollieBar('You read the whole story!')+tabs()+'<div class="card1"><div class="bigE" style="font-size:80px">🏅</div><div style="font-size:24px;font-weight:800">'+tot+' / '+max+' stars</div>'+stars(Math.round(tot/max*3))+
        '<div class="lines">'+D.story.map(function(s,k){ return '<p>'+(best[k]?stars(best[k].stars):'')+' '+esc(s)+'</p>'; }).join('')+'</div>'+
        '<div class="row"><button class="btn ghost" id="again">🔁 Read again</button><button class="btn" id="toq">❓ Questions</button></div></div>'+trayHTML();
      bindTray(); store('u'+N+'read', tot);
      pane.querySelector('#again').onclick=function(){ i=0; best=best.map(function(){return null;}); show(); };
      pane.querySelector('#toq').onclick=function(){ mode('qs'); };
      pane.querySelector('#rep').onclick=function(){ say('You got '+tot+' stars out of '+max+'.'); };
      var msg = tot>=max-1 ? 'Wow! You got '+tot+' stars out of '+max+'! You are a super reader!' :
                tot>=max*0.6 ? 'Good job! You got '+tot+' stars out of '+max+'.'+(left.length?' Tap the words below and practice them.':'') :
                'You got '+tot+' stars. Keep going! Listen to the story again and practice the words below.';
      say(msg).then(function(){ return say('Now, answer my questions! Tap Questions.'); });
    }
    say('Now you read! Read each sentence out loud. I am listening!'); show();
  }

  /* 3 · questions: Ollie asks, the child taps a picture */
  function qsMode(){
    var Q=(D.qs||[]).map(function(q){ var o=q[1].map(function(x,k){return {e:x[0], w:x[1], ok:k===0};}).sort(function(){return Math.random()-.5;}); return {q:q[0], o:o}; });
    var g=gen, i=0, score=0;
    function show(){ if(g!==gen) return;
      if(i>=Q.length){ var msg=score===Q.length?'Perfect! You know the story!':'You did it! Great listening!'; store('u'+N+'qs', score);
        pane.innerHTML=ollieBar(msg)+tabs(); pane.querySelector('#rep').onclick=function(){ say(msg); }; finish(pane,'story',msg); return; }
      var r=Q[i], tries=0;
      pane.innerHTML=ollieBar(r.q)+tabs()+'<div class="prog">'+Q.map(function(_,k){return '<span class="'+(k<i?'ok':k===i?'cur':'')+'"></span>';}).join('')+'</div>'+
        '<div class="q"><button class="play" id="pl">🔊 Question '+(i+1)+'</button></div><div class="opts">'+r.o.map(function(o,k){ return '<button class="op qo" data-k="'+k+'"><span>'+o.e+'</span><small>'+esc(o.w)+'</small></button>'; }).join('')+'</div>';
      var ask=function(){ hush(); return say(r.q.replace('…?','what?'),{rate:.8}); };
      pane.querySelector('#pl').onclick=ask; pane.querySelector('#rep').onclick=ask;
      pane.querySelectorAll('.op').forEach(function(b){ b.onclick=function(){ var o=r.o[+b.dataset.k]; hush();
        if(o.ok){ b.classList.add('right'); burst(b); if(!tries) score++; say(cheer()+' '+o.w+'!').then(function(){ i++; show(); }); }
        else { tries++; b.classList.add('wrong'); setTimeout(function(){b.classList.remove('wrong');},600); say('Oops! Not '+o.w+'. Listen again.').then(ask); } }; });
      ask();
    }
    show();
  }
  mode('listen');
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
  say('Trace the letter with your finger. Start at the top!'); show();
}

window.addEventListener('hashchange', function(){ render(); scrollTo(0,0); });
render();
})();
