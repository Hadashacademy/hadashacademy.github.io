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
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('a1lab:'+k)||'null');localStorage.setItem('a1lab:'+k,JSON.stringify(v));}catch(e){return null;}}

/* ---------- speech ---------- */
var synth = window.speechSynthesis, voices = [], rate = 1, token = 0;
function loadVoices(){ if(!synth) return; var v=synth.getVoices().filter(function(x){return /^en[-_]/i.test(x.lang);});
  voices = v.sort(function(x,y){return vq(y)-vq(x);}); }
function vq(v){const n=v.name+' '+(v.voiceURI||''),l=(v.lang||'').replace('_','-').toLowerCase();let s=1;if(/natural|neural/i.test(n))s=6;else if(/online/i.test(n))s=5;else if(/google|premium|enhanced|siri/i.test(n))s=4;else if(/samantha|ava|allison|alex|daniel|karen|moira|paulina|monica|juan/i.test(n))s=3;if(/zira|david|mark|hazel|helena|sabina|espeak|compact/i.test(n))s=0;if(l==='en-us'||l==='es-us'||l==='es-mx'||l==='es-419')s+=0.5;return s}
if(synth){loadVoices(); synth.onvoiceschanged=loadVoices;}
var cast = {};
function voiceFor(who){ if(!voices.length) return null; if(!(who in cast)) cast[who]=Object.keys(cast).length; return voices[cast[who] % voices.length]; }
function stop(){ token++; if(synth) synth.cancel(); document.querySelectorAll('.on').forEach(function(e){e.classList.remove('on');}); }
var LETTER={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'eff',G:'gee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'are',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
var SPELLED=/\b[A-Z](?:(?:-|\.\s)[A-Z]){2,}\b\.?/;
function say(text, who){ // spelled words (N-I-N-A) are said letter by letter with pauses
  if(!SPELLED.test(text)) return say1(text, who);
  var parts=[], rest=text, m; while((m=rest.match(SPELLED))){ var pre=rest.slice(0,m.index).trim(); if(pre) parts.push([pre,250]); m[0].replace(/[^A-Z]/g,'').split('').forEach(function(c){ parts.push([LETTER[c]||c, 450]); }); rest=rest.slice(m.index+m[0].length); }
  if(rest.trim()) parts.push([rest.trim(),0]);
  var my=token; return parts.reduce(function(p,x){ return p.then(function(){ if(my!==token) return; return say1(x[0], who).then(function(){ return new Promise(function(r){ setTimeout(r, x[1]/rate); }); }); }); }, Promise.resolve()); }
function say1(text, who){ return new Promise(function(res){
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
    var fc=(window.LAB_FACES||{})[l.who]; var av=fc?'<span class="jav">'+fc+'</span>':'<span class="jav jl">'+esc(l.who.charAt(0))+'</span>';
    return '<div class="ln" data-l="'+li+'">'+av+'<b>'+esc(l.who)+'</b><span>'+html+'</span></div>';
  }).join('');
  var people=[]; D.lines.forEach(function(l){ if(people.indexOf(l.who)<0) people.push(l.who); });
  var sound = D.sound && D.sound.length ? '<div class="card T"><div class="h">🔊 Sound smart</div><div class="tip">'+D.sound.map(function(s){return '<p>'+esc(s)+'</p>';}).join('')+'</div><div class="ctrl"><button class="btn sm" id="sndPlay">▶ Hear the examples</button></div></div>' : '';
  var mic = !!(window.FB && FB.SR);
  var prompts = D.pairs && D.pairs.length ? '<div class="card T"><div class="h"><span class="n">3</span> Speaking challenge<small>with feedback</small></div><p class="hint" style="margin:0 0 10px">Choose a question and listen. Then '+(mic?'tap <b>🎤 Answer</b> and speak for 20–40 seconds. You’ll get feedback on your answer.':'answer out loud for 20–40 seconds. <b>Tip:</b> open this page in Chrome to get voice feedback.')+'</p><div class="prompts">'+D.pairs.map(function(p,i){return '<button class="pr" data-p="'+i+'">'+esc(p)+'</button>';}).join('')+'</div>'+
    '<div class="ctrl"><button class="btn sm ghost" id="rnd">🎲 Random question</button>'+(mic?'<button class="btn" id="ans" disabled>🎤 Answer</button>':'')+'<span class="score" id="sec"></span></div><div class="live" id="live" hidden></div><div id="sfb"></div></div>' : '';
  return '<div class="card T"><div class="h"><span class="n">1</span> Listen and complete<small>Unit '+D.n+' · Talk</small></div>'+
    '<div class="scene">'+esc(D.setting)+'</div>'+
    '<div class="ctrl"><button class="btn" id="playAll">▶ Listen</button><button class="btn ghost sm" id="stopB">■ Stop</button>'+speedCtl()+'</div>'+
    '<div class="dlg" id="dlg">'+rows+'</div>'+
    (D.after?'<p class="hint">'+esc(D.after)+'</p>':'')+
    '<div class="ctrl"><button class="btn" id="chk">✓ Check</button><button class="btn ghost" id="show">Show answers</button><span class="score" id="tsc"></span></div></div>'+
    '<div class="card T"><div class="h"><span class="n">2</span> Role-play with a voice tutor<small><span class="probadge'+((window.PRO&&PRO.available())?'':' free')+'">'+((window.PRO&&PRO.available())?'⭐ Pro tutor':'🧑‍🏫 Tutor')+'</span></small></div>'+
    '<p class="hint" style="margin:0">Choose your character. The app reads the other lines — say <b>your</b> lines out loud'+((window.FB&&FB.SR)?'. Your <b>🧑‍🏫 voice tutor</b> listens, shows the clear words in <span class="wok">green</span> and the unclear ones in <span class="wno">red</span>, then practices those words with you out loud. Tap <b>Next</b> to skip or continue.':', then tap <b>Next</b>.')+'</p>'+
    '<div class="ctrl">'+people.map(function(p){return '<button class="btn ghost sm role" data-w="'+esc(p)+'">I’m '+esc(p)+'</button>';}).join('')+'<button class="btn sm" id="next" disabled>Next ▶</button></div><div id="rpBox" class="dlg"></div></div>'+
    sound+prompts+'';
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
      if(D.lines[step].who===me){ nx.disabled=false;
        var exp=lineText(D.lines[step],step), fbEl=document.createElement('div'); fbEl.className='rpf'; r.appendChild(fbEl);
        var turn={off:false, rec:null}; curTurn=turn;
        var finished=new Promise(function(res){ wait=res; });
        if(window.FB && (FB.SR || PRO_ON())){ coach(turn, exp, fbEl).then(function(perfect){ if(perfect && !turn.off && wait){ setTimeout(function(){ if(wait){var w=wait;wait=null;w();} }, 900); } else if(!turn.off){ nx.classList.add('pulse'); } }); }
        else fbEl.innerHTML='Say your line out loud, then tap <b>Next</b>.';
        await finished; turn.off=true; if(turn.rec) turn.rec.stop(); nx.disabled=true; }
      else { await say(lineText(D.lines[step],step), D.lines[step].who); }
      r.classList.remove('on'); step++; }
    if(t===token){ nx.disabled=true; box.insertAdjacentHTML('beforeend','<p class="score">🎬 Great job! Now swap roles.</p>'); } }
  var curTurn=null, PRAISE=['Great!','Excellent!','Perfect!','Well done!','Nice!'];
  function tsay(text, slow){ var keep=rate; rate=slow?0.7:0.95; return say(text,'tutor').then(function(){ rate=keep; }); }
  function hear(turn, ms, el, label){ return new Promise(function(res){ if(turn.off){res('');return;}
    el.querySelector('.live2').innerHTML='🎤 '+label;
    var rec=FB.listen({onText:function(t){ el.querySelector('.live2').innerHTML='🎤 <i>'+esc(t)+'</i>'; }, onError:function(e){ if(e==='not-allowed') el.querySelector('.live2').innerHTML='🔒 Allow the microphone to practice with the tutor.'; }});
    turn.rec=rec; var tm=setTimeout(function(){ rec.stop(); }, ms);
    rec.promise.then(function(s){ clearTimeout(tm); turn.rec=null; res(s||''); }); }); }
  var PRO_ON = function(){ return !!(window.PRO && PRO.available()); };
  function colorFor(sc){ return sc>=80?'wok':sc>=60?'wmid':'wno'; }
  async function attemptLine(turn, exp, el, label){
    var live=el.querySelector('.live2');
    if(PRO_ON()){
      live.innerHTML='⭐ '+label+' <span class="hint">(Pro tutor listening)</span>';
      var r=await PRO.assess(exp, 13000);
      if(turn.off) return null;
      if(r){ live.innerHTML='';
        if(!r.text) return {silent:true};
        var words=r.words.filter(function(w){ return w.error!=='Insertion'; });
        var missed=[], worst={};
        words.forEach(function(w){ if(w.error==='Omission'||w.error==='Mispronunciation'||w.score<70){ missed.push(w.word); var ph=w.phonemes.slice().sort(function(x,y){return x.score-y.score;})[0]; if(ph) worst[w.word]=ph.p; } });
        return {pro:true, pct:r.pron, html:words.map(function(w){ return '<span class="'+(w.error==='Omission'?'wom':colorFor(w.score))+'" title="'+w.score+'/100">'+esc(w.word)+'</span>'; }).join(' '),
          scores:'Accuracy '+r.accuracy+' · Fluency '+r.fluency+' · Completeness '+r.completeness, missed:missed, worst:worst, heard:{}};
      }
      document.querySelectorAll('.probadge').forEach(function(x){ x.textContent='🧑‍🏫 Tutor'; x.className='probadge free'; });
    }
    var said=await hear(turn, 9000, el, label);
    if(turn.off) return null;
    if(!said) return {silent:true};
    live.innerHTML='';
    var c=FB.compareLine(exp,said);
    return {pro:false, pct:c.pct, html:c.html, missed:c.missed, heard:c.heard, worst:{}};
  }
  async function checkWord(turn, w, el){
    if(PRO_ON()){ el.querySelector('.live2').innerHTML='⭐ Say: “'+esc(w)+'”';
      var r=await PRO.assess(w, 6000); el.querySelector('.live2').innerHTML='';
      if(r){ var sc=(r.words[0]||{}).score||0; return {ok: !!r.text && sc>=75, score:sc}; } }
    var h=await hear(turn, 4500, el, 'Say: “'+esc(w)+'”');
    return {ok: !!h && FB.sameWord(w,h)};
  }
  function recordTools(el, exp){
    var rc=el.querySelector('.rc'); if(!navigator.mediaDevices || !window.MediaRecorder) return;
    rc.innerHTML='<span class="hint">Compare:</span> <button class="btn sm ghost rm">▶ Model</button> <button class="btn sm ghost rr">🎙 Record me</button> <button class="btn sm ghost ry" disabled>▶ Me</button>';
    var url=null, au=null;
    rc.querySelector('.rm').onclick=function(){ if(synth) synth.cancel(); tsay(exp); };
    rc.querySelector('.rr').onclick=function(){ var b=this; if(b.dataset.on){ if(FB.recordOnce.stop) FB.recordOnce.stop(); return; }
      b.dataset.on=1; b.textContent='■ Stop (recording…)';
      FB.recordOnce(8000).then(function(u){ delete b.dataset.on; b.textContent='🎙 Record again'; if(u){ url=u; rc.querySelector('.ry').disabled=false; } }); };
    rc.querySelector('.ry').onclick=function(){ if(au) au.pause(); if(url){ au=new Audio(url); au.play(); } };
  }
  async function coach(turn, exp, el){
    el.innerHTML='<div class="res"></div><div class="live2"></div><div class="tut"></div><div class="rc"></div>';
    var res=el.querySelector('.res'), tut=el.querySelector('.tut'), perfect=false;
    for(var attempt=1; attempt<=2 && !turn.off; attempt++){
      var R=await attemptLine(turn, exp, el, attempt===1?'Your turn — say your line…':'Say the whole line again…');
      if(!R || turn.off) return false;
      if(R.silent){ tut.innerHTML='🧑‍🏫 <i>I didn’t hear you. Let’s try again.</i>'; await tsay('I didn’t hear you. Try again.'); continue; }
      res.innerHTML='<div>'+R.html+'</div><b class="'+(R.pct>=85?'good':R.pct>=60?'mid':'low')+'">'+(R.pro?'Pronunciation '+R.pct+'/100':R.pct+'% clear')+'</b>'+(R.scores?'<div class="hint">'+R.scores+'</div>':'');
      var miss=[]; R.missed.forEach(function(w){ if(w && miss.indexOf(w)<0 && w.length>1) miss.push(w); });
      if(!miss.length || R.pct>=95){ var pr=PRAISE[Math.floor(Math.random()*PRAISE.length)]; tut.innerHTML='🧑‍🏫 <b>'+pr+'</b> Your pronunciation was very clear.'; await tsay(pr+' Very clear!'); perfect=attempt===1; break; }
      if(attempt===2){ tut.innerHTML='🧑‍🏫 <b>Good effort!</b> Keep practicing: '+miss.slice(0,4).map(function(w){return '<span class="chipw">'+esc(w)+'</span>';}).join(' ')+'<div class="hint">Saved in <b>My tricky words</b>.</div>'; miss.forEach(function(w){ FB.addTricky(D.n,w); }); await tsay('Good effort! Let’s continue.'); break; }
      miss.sort(function(a,b){ return (R.worst[b]?1:0)-(R.worst[a]?1:0) || b.length-a.length; }); miss=miss.slice(0,3);
      await tsay(miss.length>1?'Good try! Let’s practice these words.':'Good try! Let’s practice this word.');
      for(var k=0;k<miss.length && !turn.off;k++){
        var w=miss[k], ph=R.worst[w], tip=(ph && PRO.phTip(ph)) || FB.tipFor(w), heardW=R.heard[w];
        tut.innerHTML='🧑‍🏫 '+(heardW?'I heard “<b>'+esc(heardW)+'</b>”, but the word is ':'Listen and repeat: ')+'<span class="chipw big2">'+esc(w)+'</span>'+(ph?' <span class="hint">sound /'+esc(ph)+'/</span>':'')+'<div class="tipx">💡 '+esc(tip[0])+'<br><small>'+esc(tip[1])+'</small></div>';
        if(heardW){ await tsay('I heard '+heardW+'. But the word is'); }
        await tsay(w, true); if(turn.off) return false; await tsay(tip[0]); if(turn.off) return false; await tsay('Your turn.');
        var ok=false;
        for(var tr=0; tr<2 && !turn.off && !ok; tr++){
          var C=await checkWord(turn, w, el); ok=C.ok;
          if(ok){ FB.trickyOk(w); tut.insertAdjacentHTML('beforeend','<div class="good">✅ '+esc(w)+(C.score?' · '+C.score+'/100':'')+' — '+PRAISE[k%PRAISE.length]+'</div>'); await tsay(PRAISE[(k+tr)%PRAISE.length]); }
          else if(tr===0){ await tsay('Almost. Listen again.'); await tsay(w, true); }
          else { FB.addTricky(D.n,w); tut.insertAdjacentHTML('beforeend','<div class="mid">🔁 “'+esc(w)+'” saved in My tricky words.</div>'); await tsay('Good effort. We’ll practice it later.'); }
        }
      }
      if(turn.off) return false;
      await tsay('Now say the whole line again.');
    }
    if(!turn.off) recordTools(el, exp);
    return perfect;
  }
  root.querySelectorAll('.role').forEach(function(b){ b.onclick=function(){ if(curTurn){curTurn.off=true; if(curTurn.rec) curTurn.rec.stop();} if(wait){wait=null;} stop(); me=b.dataset.w; step=0; rp(); run(); }; });
  nx.onclick=function(){ nx.classList.remove('pulse'); if(curTurn){ curTurn.off=true; if(curTurn.rec) curTurn.rec.stop(); } if(synth) synth.cancel(); if(wait){var w=wait;wait=null;w();} };
  var sp=root.querySelector('#sndPlay'); if(sp) sp.onclick=async function(){ stop(); var t=token;
    for(var i=1;i<D.sound.length;i++){ if(t!==token) return; var s=D.sound[i].replace(/^[^!:]*[!:]\s*/,''); await say(s.replace(/\/[^/]*\//g,' ').replace(/[↗↘|·]/g,', ')); } };
  var prs=root.querySelectorAll('.pr'), timer=null, cur=-1, ansB=root.querySelector('#ans'), live=root.querySelector('#live'), sfb=root.querySelector('#sfb'), secEl=root.querySelector('#sec'), recNow=null;
  function ask(i){ stop(); if(recNow){recNow.stop();} cur=i; prs.forEach(function(p){p.classList.toggle('pick',+p.dataset.p===i);}); var q=D.pairs[i].replace(/^[^A-Za-z“"]+/,'');
    if(ansB) ansB.disabled=false; if(sfb) sfb.innerHTML='';
    say(q,'coach').then(function(){ if(ansB) return; var s=30; clearInterval(timer); secEl.textContent='⏱ '+s+'s — talk!';
      timer=setInterval(function(){ s--; secEl.textContent= s>0 ? '⏱ '+s+'s' : '✅ Time! Nice work.'; if(s<=0) clearInterval(timer); },1000); }); }
  prs.forEach(function(p){ p.onclick=function(){ ask(+p.dataset.p); }; });
  var rn=root.querySelector('#rnd'); if(rn) rn.onclick=function(){ ask(Math.floor(Math.random()*D.pairs.length)); };
  if(ansB) ansB.onclick=function(){
    if(recNow){ recNow.stop(); return; }
    stop(); var t0=Date.now(), s=0; live.hidden=false; live.textContent='🎤 Listening… start speaking.'; sfb.innerHTML='';
    ansB.textContent='■ Stop'; clearInterval(timer);
    timer=setInterval(function(){ s=Math.round((Date.now()-t0)/1000); secEl.textContent='⏱ '+s+'s'+(s<20?' — keep going!':' ✓'); if(s>=60 && recNow) recNow.stop(); },500);
    var errMsg='';
    recNow=FB.listen({continuous:true, onText:function(t){ live.innerHTML='🎤 <i>'+esc(t)+'</i>'; }, onError:function(e){ errMsg=e; }});
    recNow.promise.then(function(said){
      var secs=(Date.now()-t0)/1000; recNow=null; clearInterval(timer); ansB.textContent='🎤 Answer again';
      if(!said){ live.innerHTML= errMsg==='not-allowed' ? '🔒 Please allow the microphone in your browser to get feedback.' : '🤔 I didn’t hear anything. Speak a little louder and try again.'; return; }
      live.innerHTML='<b>What I heard:</b> “'+esc(said)+'”';
      var f=FB.speakFeedback(said, secs, D.n);
      sfb.innerHTML='<div class="fb">'+FB.fbList(f.good,f.next)+'<h4>🔎 Grammar check</h4><div id="sgc" class="hint">Checking…</div>'+
        '<p class="lt">Voice-to-text by your browser; grammar check by <a href="https://languagetool.org" target="_blank">LanguageTool</a>. If a word was misheard, it isn’t your mistake!</p>'+
        '<div class="send"><input id="sname" placeholder="Your name" value="'+esc(FB.store('name')||'')+'"><button class="btn wa" id="ssend">💬 Send to my teacher</button></div></div>';
      var said2=said.charAt(0).toUpperCase()+said.slice(1)+(/[.!?]$/.test(said)?'':'.');
      FB.ltCheck(said2).then(function(ms){ ms=ms.filter(function(m){return !/MORFOLOGIK|UPPERCASE|PUNCT|COMMA|SENTENCE_FRAGMENT/i.test(m.rule.id);});
        sfb.querySelector('#sgc').innerHTML= ms.length ? '<ol class="errs">'+ms.slice(0,6).map(function(m){ return '<li><b>“'+esc(said2.substr(m.offset,m.length))+'”</b> — '+esc(m.message)+((m.replacements||[]).length?' Try: <b>'+esc(m.replacements[0].value)+'</b>':'')+'</li>'; }).join('')+'</ol>' : '<p class="fbg">✅ No grammar problems found.</p>';
      }, function(){ sfb.querySelector('#sgc').textContent='Grammar check not available right now.'; });
      sfb.querySelector('#ssend').onclick=function(){ var nm=sfb.querySelector('#sname').value.trim(); FB.store('name',nm);
        var msg='📚 English Lab A1 · Unit '+D.n+' · Speaking\n👤 '+(nm||'Student')+'\n❓ '+D.pairs[cur].replace(/^[^A-Za-z“"]+/,'')+'\n\n🗣️ “'+said+'”\n\n— '+f.a.words+' words in '+Math.round(secs)+'s';
        window.open('https://wa.me/'+FB.TEACHER_WA+'?text='+encodeURIComponent(msg),'_blank'); };
    });
  };
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
    '<p style="margin:0 0 6px">Read the whole text <b>out loud</b>. Tap <b>Start</b>, read, then tap <b>Stop</b>. '+((window.FB&&FB.SR)?'Ollie listens and tells you your <b>score</b> and what to practice. ':'')+'A1 goal: about <b>60 words per minute</b>.</p>'+
    '<div class="timer"><button class="btn" id="fl">▶ Start</button><span class="big" id="flt">0:00</span><span class="hint">'+words+' words</span><span class="score" id="flr"></span></div><div class="live" id="fllive" hidden></div><div id="flfb"></div></div>';
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
  var text=D.paras.map(function(p){ return p.replace(/^\d+\.\s*/,'').replace(/^[A-Z][A-Za-z.’ ]{0,14}:\s+/,''); }).join(' '), heard='', rec=null, reading=false;
  var live=root.querySelector('#fllive'), fb=root.querySelector('#flfb'), mic=!!(window.FB && FB.SR);
  function listenLoop(){ if(!reading) return; rec=FB.listen({continuous:true, onText:function(t){ live.innerHTML='🎤 <i>'+esc((heard+' '+t).trim().split(/\s+/).slice(-14).join(' '))+'</i>'; }, onError:function(e){ if(e==='not-allowed'){ live.innerHTML='🔒 Please allow the microphone to get Ollie’s feedback.'; } }});
    rec.promise.then(function(t){ heard=(heard+' '+(t||'')).trim(); if(reading) listenLoop(); }); }
  function score10(acc,wpm){ var sp=Math.min(1,wpm/60); return Math.max(1,Math.round((acc/100)*7+sp*3)); }
  fl.onclick=function(){
    if(!iv){ stop(); t0=Date.now(); heard=''; fb.innerHTML=''; fl.textContent='■ Stop'; root.querySelector('#flr').textContent='';
      iv=setInterval(function(){ var s=Math.floor((Date.now()-t0)/1000); root.querySelector('#flt').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); },250);
      if(mic){ reading=true; live.hidden=false; live.innerHTML='🎤 Listening… start reading.'; listenLoop(); }
      return; }
    clearInterval(iv); iv=null; fl.textContent='▶ Try again'; var sec=(Date.now()-t0)/1000, wpm=Math.round(words/(sec/60));
    var best=store('u'+D.n+'wpm')||0; if(wpm>best && sec>10) store('u'+D.n+'wpm',wpm);
    root.querySelector('#flr').textContent= sec<10 ? 'Too fast — did you read it all? 😉' : wpm+' words/min'+(best?' · best: '+Math.max(best,wpm):'');
    if(sec<10){ say('Hmm, that was very fast. Did you read it all? Try again!','coach'); return; }
    if(!mic){ say(wpm>=60?'Great reading! You read '+wpm+' words per minute.':'Good try! You read '+wpm+' words per minute. Read again a little faster.','coach'); return; }
    reading=false; live.innerHTML='⏳ Ollie is checking your reading…'; if(rec) rec.stop();
    setTimeout(function(){
      live.hidden=true;
      if(!heard){ fb.innerHTML='<div class="fb"><p>🤔 I didn’t hear you. Read a little louder, close to the microphone, and try again.</p></div>'; say('I could not hear you. Read a little louder and try again.','coach'); return; }
      var C=FB.compareLine(text, heard), acc=C.pct, sc=score10(acc,Math.min(wpm,90));
      var miss=[]; C.missed.forEach(function(w){ if(w && miss.indexOf(w.toLowerCase())<0 && miss.length<6) miss.push(w.toLowerCase()); });
      var stars=sc>=9?3:sc>=7?2:sc>=5?1:0, prevS=store('u'+D.n+'rs')||0; if(sc>prevS) store('u'+D.n+'rs',sc);
      var head=sc>=9?'🏆 Excellent reading!':sc>=7?'🌟 Very good!':sc>=5?'👍 Good try!':'💪 Keep practicing!';
      var tips=[]; if(acc<85) tips.push('Read slowly and say every word.'); if(wpm<45) tips.push('Read the text two more times to read faster.'); else if(wpm>110) tips.push('Slow down a little so every word is clear.'); if(!tips.length) tips.push('Try reading with expression, like a storyteller!');
      fb.innerHTML='<div class="fb"><h4 style="margin:0 0 6px">'+head+' &nbsp;<span style="font-size:22px">'+(stars?'⭐'.repeat(stars):'☆')+'</span></h4>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px"><span class="chipw" style="font-size:16px">Score: <b>'+sc+' / 10</b></span><span class="chipw">Words read well: <b>'+acc+'%</b></span><span class="chipw">Speed: <b>'+wpm+'</b> words/min</span></div>'+
        '<div class="art" style="margin:6px 0;line-height:1.8">'+C.html+'</div>'+
        (miss.length?'<p style="margin:8px 0 4px"><b>Practice these words:</b> '+miss.map(function(w){return '<button class="chipw pw" data-w="'+esc(w)+'">🔈 '+esc(w)+'</button>';}).join(' ')+'</p>':'')+
        '<p style="margin:6px 0 0"><b>Tip:</b> '+esc(tips.join(' '))+'</p><p class="lt">Green = Ollie heard it · Red = practice it. The browser’s voice recognition is not perfect — if a word was misheard, it isn’t your mistake!</p></div>';
      fb.querySelectorAll('.pw').forEach(function(b){ b.onclick=function(){ say(b.dataset.w,'coach'); }; });
      var msg=head.replace(/^[^A-Za-z]+/,'')+' Your score is '+sc+' out of 10. You read '+acc+' percent of the words well, at '+wpm+' words per minute. '+
        (miss.length?'Practice these words: '+miss.slice(0,3).join(', ')+'. ':'')+tips[0];
      say(msg,'coach');
    }, 900);
  };
}

/* ---------- page ---------- */
function render(){
  stop();
  var tab = location.hash==='#read' ? 'read' : location.hash==='#write' ? 'write' : 'talk';
  var t=D.title.replace(/(\S+…?\??!?)$/,'<em>$1</em>');
  var prev=D.n>1?'<a href="../unit-'+(D.n-1)+'/'+location.hash+'">← Unit '+(D.n-1)+'</a>':'', next=D.n<24?'<a href="../unit-'+(D.n+1)+'/'+location.hash+'">Unit '+(D.n+1)+' →</a>':'';
  app.innerHTML='<header class="top"><div class="wrap"><nav class="crumbs"><a href="../../../../#kids">Junior</a><a href="../../../../#book1">Book 1 · A1</a><a href="../">Activities</a>'+prev+next+'</nav>'+
    '<div class="kick">UNIT '+D.n+' · ENGLISH LAB A1</div><h1>'+t+'</h1><p>'+esc(D.sub)+'</p></div></header>'+
    '<main class="wrap"><div class="tabs" role="tablist"><a role="tab" class="tab t" href="#talk" aria-selected="'+(tab==='talk')+'" style="text-decoration:none">🎧 Talk</a><a role="tab" class="tab r" href="#read" aria-selected="'+(tab==='read')+'" style="text-decoration:none">📖 Read</a><a role="tab" class="tab w" href="#write" aria-selected="'+(tab==='write')+'" style="text-decoration:none">✍️ Write</a></div>'+
    '<div id="pane">'+(tab==='talk'?talkHTML():tab==='read'?readHTML():FB.writeHTML(D))+'</div>'+
    (synth?'':'<div class="card">🔇 Your browser can’t read aloud. Try Chrome, Edge or Safari.</div>')+
    '<p class="foot">My English Adventure · Book 1 · Level A1<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
  var pane=document.getElementById('pane'); if(tab==='talk') bindTalk(pane); else if(tab==='read') bindRead(pane); else FB.bindWrite(pane,D);
  document.title='Unit '+D.n+' · '+(tab==='talk'?'Talk':tab==='read'?'Read':'Write')+' · English Lab A1';
}
window.addEventListener('hashchange',function(){ render(); window.scrollTo(0,0); });
render();
})();
