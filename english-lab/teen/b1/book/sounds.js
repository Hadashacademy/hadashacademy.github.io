(function(){
'use strict';
var esc=FB.esc, app=document.getElementById('app');
var GROUPS=[
 {t:'Short i /ɪ/ or long ee /iː/', tip:'Short i is relaxed; long ee — smile!', es:'La i corta es relajada; la ii larga, ¡sonríe!', pairs:[['ship','sheep'],['live','leave'],['sit','seat'],['fill','feel']]},
 {t:'V or B', tip:'For v, top teeth on your bottom lip. For b, close your lips.', es:'Para la v, dientes sobre el labio; para la b, cierra los labios.', pairs:[['very','berry'],['vote','boat'],['van','ban'],['vest','best']]},
 {t:'TH /θ/ or S / T', tip:'Tongue between your teeth and blow.', es:'Lengua entre los dientes y sopla.', pairs:[['think','sink'],['three','tree'],['thank','tank'],['mouth','mouse']]},
 {t:'TH /ð/ or D', tip:'Tongue between your teeth, with voice.', es:'Lengua entre los dientes, con voz.', pairs:[['they','day'],['then','den'],['those','doze'],['there','dare']]},
 {t:'SH or CH', tip:'sh is long (shhh); ch is short and strong.', es:'sh es larga (shhh); ch es corta y fuerte.', pairs:[['share','chair'],['shoes','choose'],['wash','watch'],['ship','chip']]},
 {t:'Cat /æ/ or Cut /ʌ/', tip:'For æ open your mouth wide; ʌ is a short, relaxed “uh”.', es:'Para æ abre bien la boca; ʌ es una “a” corta y relajada.', pairs:[['cat','cut'],['hat','hut'],['bag','bug'],['cap','cup']]},
 {t:'J or Y', tip:'j sounds like “dy”; y is a quick “i”.', es:'j suena “dy”; y es una “i” rápida.', pairs:[['jet','yet'],['jam','yam'],['joke','yolk'],['jaw','yaw']]},
 {t:'No “e” before S', tip:'Start with a long sss — never “es”.', es:'Empieza con una sss larga, nunca “es”.', words:['school','Spanish','student','sport','street','study','smile','snack']},
 {t:'-ed endings: /t/, /d/ or /ɪd/', tip:'After t or d say “id”; otherwise the -ed is just a short t or d.', es:'Después de t o d se dice “id”; si no, solo suena t o d.', words:['walked','watched','played','cleaned','wanted','needed','started','decided']}
];
function say(t,slow){ return new Promise(function(res){ var s=window.speechSynthesis; if(!s){res();return;} s.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=slow?0.7:0.95;
  var v=s.getVoices().filter(function(x){return /^en[-_]US/i.test(x.lang);}); if(v.length) u.voice=v.sort(function(x,y){return vq(y)-vq(x);})[0];
  u.onend=u.onerror=function(){res();}; s.speak(u); }); }
function check(w, out){
  out.innerHTML='🎤 Say “'+esc(w)+'”…';
  if(window.PRO && PRO.available()){
    return PRO.assess(w,6000).then(function(r){ if(!r) return freeCheck(w,out); var sc=(r.words[0]||{}).score||0, ok=!!r.text && sc>=75;
      var ph=((r.words[0]||{}).phonemes||[]).slice().sort(function(a,b){return a.score-b.score;})[0], tip=ph&&PRO.phTip(ph.p);
      out.innerHTML= ok ? '✅ <b>'+sc+'/100</b> — great!' : '🔁 <b>'+sc+'/100</b>'+(ph?' · check the sound /'+esc(ph.p)+'/':'')+(tip?'<br><small>💡 '+esc(tip[0])+' · '+esc(tip[1])+'</small>':'');
      return ok; }); }
  return freeCheck(w,out);
}
function freeCheck(w,out){ if(!FB.SR){ out.innerHTML='Open this page in Chrome, Edge or Safari to use the microphone.'; return Promise.resolve(false); }
  var r=FB.listen({onText:function(t){ out.innerHTML='🎤 <i>'+esc(t)+'</i>'; }, onError:function(e){ if(e==='not-allowed') out.innerHTML='🔒 Allow the microphone.'; }});
  var tm=setTimeout(function(){ r.stop(); },4500);
  return r.promise.then(function(h){ clearTimeout(tm); var ok=!!h && FB.sameWord(w,h);
    out.innerHTML= !h ? '🤔 I didn’t hear you. Try again.' : ok ? '✅ Great — I heard “'+esc(h)+'”.' : '🔁 I heard “'+esc(h)+'”. Listen again and repeat.'; return ok; }); }
function tricky(){
  var t=FB.store('tricky')||{}, ks=Object.keys(t).sort(function(a,b){return t[b].c-t[a].c;});
  return '<div class="card T"><div class="h"><span class="n">⭐</span> My tricky words<small>saved on this device</small></div>'+
   (ks.length ? '<p class="hint" style="margin:0 0 8px">Tap a word, listen and say it. Say it right 3 times and it leaves your list! 🎉</p><div class="wordrow">'+ks.map(function(k){return '<button class="chipw tw" data-w="'+esc(k)+'">'+esc(k)+' <small>U'+t[k].u+'</small></button>';}).join('')+'</div><div class="out" id="tout"></div>'
     : '<p style="margin:0">No tricky words yet. 🎉 When the role-play tutor finds a difficult word, it will appear here so you can practice it.</p>')+'</div>';
}
function groupHTML(g,i){
  var items = g.pairs ? g.pairs.map(function(p){return '<span class="pairx"><button class="chipw sw" data-w="'+p[0]+'">'+p[0]+'</button><span class="hint">vs</span><button class="chipw sw" data-w="'+p[1]+'">'+p[1]+'</button></span>';}).join('')
    : g.words.map(function(w){return '<button class="chipw sw" data-w="'+w+'">'+w+'</button>';}).join('');
  return '<div class="card T sg" data-g="'+i+'"><div class="h"><span class="n">'+(i+1)+'</span> '+esc(g.t)+'</div><p class="tip" style="margin:0 0 10px">💡 '+esc(g.tip)+'<br><small class="hint">'+esc(g.es)+'</small></p>'+
    '<div class="wordrow">'+items+'</div>'+(g.pairs?'<div class="ctrl"><button class="btn sm game">👂 Listen &amp; choose</button><span class="score gs"></span></div><div class="gq"></div>':'')+'<div class="out"></div></div>';
}
function render(){
  app.innerHTML='<header class="top"><div class="wrap"><nav class="crumbs"><a href="../../../">Teen Lab</a><a href="../../">B1 · Adventurer</a><a href="../">Student\u2019s Book</a></nav><div class="kick">ENGLISH LAB B1 · PRONUNCIATION</div><h1>Sounds <em>lab</em></h1><p>The sounds that are hardest for Spanish speakers — listen, choose and say them.</p>'+
   (window.PRO&&PRO.available()?'<p><span class="probadge">⭐ Pro tutor on</span></p>':'')+'</div></header><main class="wrap">'+tricky()+GROUPS.map(groupHTML).join('')+
   '<p class="foot">Tap a word to hear it, then say it. Voice recognition is done by your browser'+(window.PRO&&PRO.available()?' or by Microsoft Azure (Pro tutor)':'')+'.<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
  app.querySelectorAll('.tw').forEach(function(b){ b.onclick=function(){ var w=b.dataset.w, out=document.getElementById('tout'); say(w,true).then(function(){ return check(w,out); }).then(function(ok){ if(ok){ FB.trickyOk(w); var t=FB.store('tricky')||{}; if(!t[w]){ b.remove(); out.innerHTML+=' 🎉 Removed from your list!'; } else b.querySelector('small').textContent='U'+t[w].u+' · '+t[w].ok+'/3'; } }); }; });
  app.querySelectorAll('.sg').forEach(function(card){ var g=GROUPS[+card.dataset.g], out=card.querySelector('.out');
    card.querySelectorAll('.sw').forEach(function(b){ b.onclick=function(){ say(b.dataset.w,true).then(function(){ return check(b.dataset.w,out); }); }; });
    var gb=card.querySelector('.game'); if(!gb) return; var right=0,total=0;
    gb.onclick=function(){ var p=g.pairs[Math.floor(Math.random()*g.pairs.length)], ans=p[Math.random()<.5?0:1], q=card.querySelector('.gq');
      q.innerHTML='<p class="hint" style="margin:8px 0 4px">Which word did you hear? <button class="btn sm ghost again">🔁 Again</button></p><div class="row">'+p.map(function(w){return '<button class="ch pick" data-w="'+w+'">'+w+'</button>';}).join('')+'</div>';
      say(ans); q.querySelector('.again').onclick=function(){ say(ans,true); };
      q.querySelectorAll('.pick').forEach(function(x){ x.onclick=function(){ if(q.dataset.done===ans+total) return; q.dataset.done=ans+total; total++; var ok=x.dataset.w===ans; if(ok) right++;
        x.classList.add(ok?'ok':'no'); if(!ok) q.querySelector('.pick[data-w="'+ans+'"]').classList.add('ok');
        card.querySelector('.gs').textContent=right+' / '+total+(ok?' ✅':' — it was “'+ans+'”'); gb.textContent='👂 Next word'; }; }); }; });
}
render();
})();
function vq(v){const n=v.name+' '+(v.voiceURI||''),l=(v.lang||'').replace('_','-').toLowerCase();let s=1;if(/natural|neural/i.test(n))s=6;else if(/online/i.test(n))s=5;else if(/google|premium|enhanced|siri/i.test(n))s=4;else if(/samantha|ava|allison|alex|daniel|karen|moira|paulina|monica|juan/i.test(n))s=3;if(/zira|david|mark|hazel|helena|sabina|espeak|compact/i.test(n))s=0;if(l==='en-us'||l==='es-us'||l==='es-mx'||l==='es-419')s+=0.5;return s}
