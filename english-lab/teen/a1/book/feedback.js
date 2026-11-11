/* English Lab A1 · automatic feedback for writing and speaking */
(function(){
'use strict';
var TEACHER_WA = '18297794571';

/* Grammar focus of each unit: what we look for in students' writing and speech */
var TARGETS = {
 1:["am / is / are",/\b(i am|i'm|you are|you're|he is|she is|he's|she's|it is|it's|we are|they are|my name is)\b/i],
 2:["a / an and spelling",/\b(a|an)\s+[a-z]+|\b[a-z]-[a-z]-[a-z]\b/i],
 3:["numbers and How many / How old",/\b(how many|how old|there are|there is|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|\d+)\b/i],
 4:["colors and It's / They're",/\b(it's|it is|they're|they are)\b|\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey)\b/i],
 5:["this / that / these / those",/\b(this|that|these|those)\b/i],
 6:["my / your / his / her",/\b(my|your|his|her|our|their)\s+[a-z]+/i],
 7:["have got / has got",/\b(have|has|i've|she's|he's|it's)\s+(not\s+)?got\b|\b(haven't|hasn't)\s+got\b/i],
 8:["present continuous: I'm wearing",/\b(am|is|are|'m|'re|'s)\s+wearing\b|\bit's\s+(sunny|rainy|cloudy|windy|hot|cold)\b/i],
 9:["can / can't",/\b(can|can't|cannot)\s+[a-z]+/i],
 10:["like / likes / don't like",/\b(like|likes|love|loves|don't like|doesn't like)\b/i],
 11:["some / any / How much",/\b(some|any|how much|how many)\b/i],
 12:["There is / There are",/\bthere\s+(is|are|isn't|aren't|'s)\b/i],
 13:["prepositions of place",/\b(in|on|under|next to|behind|between|in front of|near|opposite)\s+(the|my|a)\b/i],
 14:["time and days (at / on / in)",/\b(at|on|in)\s+(\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|the morning|the afternoon|the evening)\b|o'clock/i],
 15:["present simple routines",/\b(i|we|they|you)\s+(get|go|eat|have|brush|wake|do|play|read|watch)\b|\b(he|she)\s+\w+s\b/i],
 16:["frequency words",/\b(always|usually|often|sometimes|never)\b/i],
 17:["can and like + -ing",/\b(can|can't)\s+[a-z]+|\b(like|likes|love|loves)\s+\w+ing\b/i],
 18:["present continuous",/\b(am|is|are|'m|'re|'s)\s+(not\s+)?\w+ing\b/i],
 19:["directions and places",/\b(go straight|turn left|turn right|next to|across from|opposite|between|near)\b/i],
 20:["jobs: What does she do?",/\b(works?|helps?|teaches|makes|drives|cooks)\b|\b(i'm|he's|she's|is)\s+an?\s+\w+/i],
 21:["feelings and advice",/\b(feel|feels|i'm|i am)\s+(happy|sad|tired|hungry|thirsty|sick|better|fine)\b|\b(drink|eat|rest|go to bed|don't)\b/i],
 22:["past simple (was / were, -ed)",/\b(was|were|went|saw|had|did|\w+ed)\b/i],
 23:["past simple story words",/\b(first|next|then|after that|finally)\b/i],
 24:["review: all you learned",/\b(am|is|are|can|like|likes|was|were|went|have got|has got)\b/i]
};
var LINKERS = ['and','but','because','so','then','after that','finally','first','also','however','although','even though','for example','for instance','in my opinion','i think','that’s why',"that's why",'while','when','if','besides','in addition','on the other hand','actually','anyway','in the end','suddenly','as a result','unfortunately','luckily'];
var REASONS = /\b(because|so|that's why|that’s why|for example|for instance|since|as a result|the reason)\b/i;

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function words(t){ return (t.match(/[A-Za-zÀ-ÿ’']+/g)||[]); }
function analyze(text, unit){
  var t=' '+text.toLowerCase().replace(/[’]/g,"'")+' ';
  var w=words(text), sents=text.split(/[.!?]+/).filter(function(s){return words(s).length>0;});
  var link=LINKERS.filter(function(l){ return new RegExp('(^|[^a-z])'+l.replace(/[’']/g,"'").replace(/ /g,'\\s+')+'([^a-z]|$)','i').test(t); });
  var tg=TARGETS[unit], m = tg ? (t.match(new RegExp(tg[1].source,'gi'))||[]) : [];
  var uniq={}; w.forEach(function(x){uniq[x.toLowerCase()]=1;});
  return {words:w.length, sentences:sents.length, avg: sents.length? Math.round(w.length/sents.length):0, linkers:link, target:tg?tg[0]:'', targetHits:m.map(function(s){return s.trim();}).slice(0,4), reasons:REASONS.test(t), variety: w.length? Object.keys(uniq).length/w.length : 0};
}

/* LanguageTool public API (https://languagetool.org) — grammar & spelling */
var IGNORE = /^(WHITESPACE_RULE|EN_QUOTES|DASH_RULE|COMMA_PARENTHESIS_WHITESPACE|EN_UNPAIRED_BRACKETS|PUNCTUATION_PARAGRAPH_END|ELLIPSIS)$/;
function ltCheck(text){
  var body=new URLSearchParams({text:text, language:'en-US', enabledOnly:'false'});
  return fetch('https://api.languagetool.org/v2/check',{method:'POST',body:body,headers:{'Content-Type':'application/x-www-form-urlencoded'}})
   .then(function(r){ if(!r.ok) throw new Error('LT '+r.status); return r.json(); })
   .then(function(j){ return (j.matches||[]).filter(function(m){ return !IGNORE.test(m.rule && m.rule.id || ''); }); });
}
function markText(text, matches){
  var out='', last=0;
  matches.slice().sort(function(a,b){return a.offset-b.offset;}).forEach(function(m,i){
    if(m.offset<last) return;
    out+=esc(text.slice(last,m.offset))+'<mark class="err'+(/MORFOLOGIK|SPELL/i.test(m.rule.id)?' sp':'')+'" title="'+esc(m.message)+'">'+esc(text.substr(m.offset,m.length))+'<sup>'+(i+1)+'</sup></mark>';
    last=m.offset+m.length; });
  return (out+esc(text.slice(last))).replace(/\n/g,'<br>');
}
function band(v){ return Math.max(0,Math.min(5,Math.round(v))); }
function scoreWriting(a, errs, checks, total){
  var content = a.words<12?1 : a.words<20?2 : a.words<30?3 : (a.words<=80?4:3);
  content += (checks===total && total>0 && a.words>=30 && a.words<=80)?1:0;
  var org = a.linkers.length>=3?5 : a.linkers.length>=2?4 : a.linkers.length>=1?3 : 2;
  if(a.sentences<3) org=Math.min(org,3);
  var per100 = a.words? errs*100/a.words : 0;
  var lang = per100<=2?5 : per100<=4?4 : per100<=7?3 : per100<=11?2 : 1;
  if(!a.targetHits.length) lang=Math.min(lang,3);
  if(a.variety<0.45) lang=Math.min(lang,3);
  var ca = Math.round((content+org+lang)/3 + (a.avg>=8 && a.avg<=20 ? 0.3 : -0.3));
  return {Content:band(content), 'Communicative achievement':band(ca), Organisation:band(org), Language:band(lang)};
}

/* ---------- writing panel ---------- */
function writeHTML(D){
  var W=D.write||{}; var saved=store('u'+D.n+'w')||'';
  return '<div class="card W"><div class="h"><span class="n">✍</span> '+esc(W.task_title||'Write')+'<small>Unit '+D.n+' · Write</small></div>'+
   '<p style="margin:0 0 8px">'+esc(W.task||'')+'</p>'+
   '<div class="checks">'+(W.cells||[]).map(function(c,i){return '<label><input type="checkbox" data-c="'+i+'"> '+esc(c)+'</label>';}).join('')+'</div>'+
   '<details class="tip" style="margin-top:10px"><summary><b>💡 Model &amp; useful language</b></summary><p class="hint" style="margin:8px 0 4px">'+esc(W.meta||'')+'</p><p style="margin:0 0 8px">'+esc(W.model||'')+'</p>'+
   (W.useful||[]).map(function(u){return '<p style="margin:2px 0"><b>'+esc(u[0])+'</b> · '+esc(u[1])+'</p>';}).join('')+'</details>'+
   '<textarea id="wtx" rows="9" placeholder="Write your text here… (about 30–50 words)">'+esc(saved)+'</textarea>'+
   '<div class="ctrl"><span class="score" id="wc">0 words</span><span class="hint">A1 goal: 30–50 words</span></div>'+
   '<div class="ctrl"><button class="btn" id="wfb">✨ Get feedback</button><button class="btn ghost sm" id="wclr">Clear</button></div>'+
   '<div id="wout"></div></div>';
}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('ta1lab:'+k)||'null');localStorage.setItem('ta1lab:'+k,JSON.stringify(v));}catch(e){return null;}}
function bindWrite(root, D){
  var tx=root.querySelector('#wtx'), wc=root.querySelector('#wc'), out=root.querySelector('#wout');
  function count(){ var n=words(tx.value).length; wc.textContent=n+' words'; wc.style.color = n>=80&&n<=120?'var(--ok)':''; store('u'+D.n+'w',tx.value); }
  tx.addEventListener('input',count); count();
  root.querySelector('#wclr').onclick=function(){ if(tx.value && !confirm('Delete your text?')) return; tx.value=''; out.innerHTML=''; count(); };
  root.querySelector('#wfb').onclick=function(){
    var text=tx.value.trim();
    if(words(text).length<15){ out.innerHTML='<p class="fbw">✋ Write at least 15 words first, then ask for feedback.</p>'; return; }
    var btn=this; btn.disabled=true; btn.textContent='⏳ Checking…';
    var a=analyze(text,D.n), boxes=root.querySelectorAll('.checks input'), ticked=[].filter.call(boxes,function(b){return b.checked;}).length;
    ltCheck(text).then(function(ms){ return {ms:ms, ok:true}; }, function(){ return {ms:[], ok:false}; }).then(function(r){
      btn.disabled=false; btn.textContent='✨ Get feedback again';
      var real=r.ms.filter(function(m){ return !(/MORFOLOGIK/.test(m.rule.id) && /^[A-ZÁÉÍÓÚ]/.test(text.substr(m.offset,1)) && m.offset>0 && !/[.!?]\s*$/.test(text.slice(0,m.offset))); });
      var sc=scoreWriting(a, real.length, ticked, boxes.length), total=0; for(var k in sc) total+=sc[k];
      var good=[], next=[];
      if(a.words>=30 && a.words<=60) good.push('Great length: <b>'+a.words+' words</b>.'); else if(a.words<30) next.push('Add more — you have <b>'+a.words+'</b> words; aim for <b>30–50</b>.'); else next.push('Great work! Your text is long (<b>'+a.words+'</b> words). Check every sentence.');
      if(a.targetHits.length) good.push('You used this unit’s grammar — '+esc(a.target)+': <i>'+a.targetHits.map(esc).join('</i>, <i>')+'</i>.'); else next.push('Use this unit’s grammar: <b>'+esc(a.target)+'</b>.');
      if(a.linkers.length>=2) good.push('Good connectors: <i>'+a.linkers.slice(0,6).map(esc).join(', ')+'</i>.'); else next.push('Join your ideas with more connectors: <i>and, but, because, then…</i>');
      if(a.avg>22) next.push('Some sentences are very long. Split them with full stops.'); else if(a.avg && a.avg<4) next.push('Your sentences are very short. Join some with <i>and, but, because</i>.');
      if(ticked<boxes.length) next.push('Check the task: did you include <b>all '+boxes.length+' points</b>? Tick them above when you have.'); else if(boxes.length) good.push('You covered all the points of the task.');
      if(a.variety<0.45) next.push('Try not to repeat the same words — use synonyms.');
      var errList = r.ok ? (real.length? '<ol class="errs">'+real.slice(0,15).map(function(m,i){ var s=(m.replacements||[]).slice(0,3).map(function(x){return '<button class="fix" data-o="'+m.offset+'" data-l="'+m.length+'" data-v="'+esc(x.value)+'">'+esc(x.value||'(delete)')+'</button>';}).join(' ');
          return '<li><b>“'+esc(text.substr(m.offset,m.length))+'”</b> — '+esc(m.message)+(s?'<div class="row">Try: '+s+'</div>':'')+'</li>'; }).join('')+'</ol>' : '<p class="fbg">✅ No grammar or spelling mistakes found. Excellent!</p>')
        : '<p class="fbw">⚠️ The grammar checker is not available right now (check your internet). The rest of the feedback still works.</p>';
      out.innerHTML='<div class="fb">'+
        '<div class="bands">'+Object.keys(sc).map(function(k){return '<div><span>'+k+'</span><b>'+sc[k]+'<small>/5</small></b><i style="width:'+(sc[k]*20)+'%"></i></div>';}).join('')+'</div>'+
        '<p class="hint" style="margin:6px 0 0">Estimated score: <b>'+total+'/20</b> using the an A1 writing guide. Your teacher gives the final mark.</p>'+
        (good.length?'<h4>👍 What you did well</h4><ul>'+good.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+
        (next.length?'<h4>🎯 To improve</h4><ul>'+next.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+
        '<h4>🔎 Grammar &amp; spelling '+(r.ok?'('+real.length+')':'')+'</h4>'+(r.ok&&real.length?'<div class="marked">'+markText(text,real)+'</div>':'')+errList+
        '<p class="lt">Grammar check powered by <a href="https://languagetool.org" target="_blank">LanguageTool</a>. Your text is sent to LanguageTool only when you tap “Get feedback”.</p>'+
        '<div class="send"><input id="wname" placeholder="Your name" value="'+esc(store('name')||'')+'"><button class="btn wa" id="wsend">💬 Send to my teacher</button></div></div>';
      out.querySelectorAll('.fix').forEach(function(b){ b.onclick=function(){ var o=+b.dataset.o,l=+b.dataset.l; if(tx.value.substr(o,l)!==text.substr(o,l)){ alert('Your text changed — tap “Get feedback” again.'); return; } tx.value=tx.value.slice(0,o)+b.dataset.v+tx.value.slice(o+l); text=tx.value; count(); b.closest('li').style.opacity=.45; out.querySelectorAll('.fix').forEach(function(x){x.disabled=true;}); root.querySelector('#wfb').textContent='✨ Check again'; }; });
      out.querySelector('#wsend').onclick=function(){ var nm=out.querySelector('#wname').value.trim(); store('name',nm);
        var msg='📚 English Lab A1 · Unit '+D.n+' · Writing\n👤 '+(nm||'Student')+'\n📝 '+(D.write.task_title||'')+'\n\n'+tx.value.trim()+'\n\n— '+words(tx.value).length+' words · estimated '+total+'/20';
        window.open('https://wa.me/'+TEACHER_WA+'?text='+encodeURIComponent(msg),'_blank'); };
      out.scrollIntoView({behavior:'smooth',block:'start'});
    });
  };
}

/* ---------- speaking ---------- */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(opts){ // returns {stop(), promise}
  var rec=new SR(); rec.lang='en-US'; rec.interimResults=true; rec.continuous=!!opts.continuous; rec.maxAlternatives=1;
  var finalT='', done, p=new Promise(function(r){done=r;});
  rec.onresult=function(e){ var interim=''; finalT=''; for(var i=0;i<e.results.length;i++){ var t=e.results[i][0].transcript; if(e.results[i].isFinal) finalT+=t+' '; else interim+=t; } if(opts.onText) opts.onText((finalT+interim).trim()); };
  rec.onerror=function(e){ if(opts.onError) opts.onError(e.error); };
  rec.onend=function(){ done(finalT.trim()); };
  try{ rec.start(); }catch(e){ done(''); }
  return {stop:function(){ try{rec.stop();}catch(e){} }, promise:p};
}
function tok(s){ return String(s).toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean); }
function same(a,b){ return a===b || a.replace(/'/g,'')===b.replace(/'/g,''); }
function compareLine(expected, said){ // LCS alignment word by word; keeps the original spelling for display
  var disp=String(expected).split(/\s+/).filter(Boolean), keys=disp.map(function(w){ return tok(w).join(' '); });
  var idx=[], E=[]; keys.forEach(function(k,i){ if(k){ idx.push(i); E.push(k.split(' ')[0]); } });
  var S=tok(said), n=E.length, m=S.length, L=[];
  for(var i=0;i<=n;i++){ L.push(new Array(m+1).fill(0)); }
  for(i=n-1;i>=0;i--) for(var j=m-1;j>=0;j--) L[i][j]= same(E[i],S[j]) ? 1+L[i+1][j+1] : Math.max(L[i+1][j],L[i][j+1]);
  var ok=[], anchors=[[-1,-1]]; i=0; j=0; while(i<n&&j<m){ if(same(E[i],S[j])){ok[i]=1;anchors.push([i,j]);i++;j++;} else if(L[i+1][j]>=L[i][j+1]) i++; else j++; }
  anchors.push([n,m]);
  var heardAt={}; for(var q=0;q<anchors.length-1;q++){ var A=anchors[q], B=anchors[q+1], ei=B[0]-A[0]-1, sj=B[1]-A[1]-1;
    if(ei>0 && ei===sj) for(var z=1;z<=ei;z++) heardAt[A[0]+z]=S[A[1]+z]; }
  var good={}, missed=[], heard={}; idx.forEach(function(di,k){ good[di]=!!ok[k]; if(!ok[k]){ var w=disp[di].replace(/^[^A-Za-zÀ-ÿ0-9’']+|[^A-Za-zÀ-ÿ0-9’']+$/g,''); missed.push(w); if(heardAt[k]) heard[w]=heardAt[k]; } });
  var hit=ok.filter(Boolean).length;
  return {pct: n? Math.round(hit*100/n):0, missed:missed, heard:heard,
    html: disp.map(function(w,di){ return di in good ? '<span class="'+(good[di]?'wok':'wno')+'">'+esc(w)+'</span>' : esc(w); }).join(' ')};
}
function sameWord(target, said){ var t=tok(target).join(' '); var S=tok(said); return S.some(function(x){ return same(x,t); }) || tok(said).join(' ').indexOf(t)>=0; }
/* Pronunciation tips for Spanish speakers */
function tipFor(w){
  var x=w.toLowerCase().replace(/’/g,"'");
  if(/^s[bcdfgklmnpqtvw]/.test(x)) return ['Start with a long “sss” — don’t add an “e” before it.','No digas “e” al principio: empieza con “sss”.'];
  if(/th/.test(x)) return ['For “th”, put your tongue between your teeth.','Para “th”, pon la lengua entre los dientes.'];
  if(/[td]ed$/.test(x)) return ['Here “-ed” sounds like “id”.','Aquí “-ed” suena como “id”.'];
  if(/ed$/.test(x)) return ['The “-ed” is very short: just a “t” or “d” sound.','La “-ed” es cortita: solo suena “t” o “d”.'];
  if(/^v|[^a-z]v/.test(x)||/v/.test(x)) return ['For “v”, touch your bottom lip with your top teeth.','Para la “v”, toca el labio de abajo con los dientes de arriba.'];
  if(/^h/.test(x)) return ['The “h” is a soft breath, like “ha!”.','La “h” es un soplido suave, como “ja”.'];
  if(/sh/.test(x)) return ['“sh” sounds like asking for silence: shhh.','“sh” suena como cuando pides silencio: shhh.'];
  if(/^j|dge|ge$/.test(x)) return ['“j” sounds like “dy”: jump, orange.','La “j” suena como “dy”.'];
  if(/^y/.test(x)) return ['Start “y” like a quick “i”.','La “y” empieza como una “i” rápida.'];
  if(/(ing)$/.test(x)) return ['Finish with “-ing”: the “g” is soft, in your throat.','Termina con “-ing”, suave, en la garganta.'];
  if(/[bcdfgklmnprstxz]{2}$/.test(x)) return ['Say the last sounds clearly — don’t cut the end.','Pronuncia bien el final, no lo cortes.'];
  return ['Listen carefully and copy the stress and the vowels.','Escucha y copia el acento y las vocales.'];
}
function speakFeedback(text, secs, unit){
  var a=analyze(text, unit), wpm= secs>3 ? Math.round(a.words/(secs/60)) : 0, good=[], next=[];
  if(a.words>=12) good.push('You spoke <b>'+a.words+' words</b> — great answer!'); else if(a.words>=6) next.push('Try to say more: <b>'+a.words+'</b> words. Add one more sentence (aim for 12+).'); else next.push('Your answer is very short (<b>'+a.words+'</b> words). At B1, give 2–4 full sentences.');
  if(a.reasons) good.push('You gave a reason or an example (<i>because, so, for example…</i>).'); else next.push('Give a reason: <i>“…because…”</i> or an example: <i>“For example, …”</i>.');
  if(a.targetHits.length) good.push('You used this unit’s grammar: <i>'+a.targetHits.map(esc).join('</i>, <i>')+'</i>.'); else next.push('Try to use <b>'+esc(a.target)+'</b> in your answer.');
  if(a.linkers.length>=3) good.push('Nice connectors: <i>'+a.linkers.slice(0,5).map(esc).join(', ')+'</i>.'); else next.push('Link your ideas: <i>and, but, so, then, also, however</i>.');
  if(wpm){ if(wpm>=50) good.push('Fluency: about <b>'+wpm+' words/min</b> — confident!'); else next.push('Fluency: about <b>'+wpm+' words/min</b>. Practice again to speak more smoothly (A1 ≈ 50–80).'); }
  return {a:a, wpm:wpm, good:good, next:next};
}
function fbList(good,next){ return (good.length?'<h4>👍 Well done</h4><ul>'+good.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+(next.length?'<h4>🎯 Next time</h4><ul>'+next.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':''); }


/* My tricky words (saved on this device) */
function addTricky(unit, w){ if(!w || w.length<2) return; var t=store('tricky')||{}; var k=w.toLowerCase().replace(/’/g,"'");
  t[k]=t[k]||{u:unit,c:0,ok:0}; t[k].c++; t[k].u=unit; store('tricky',t); }
function trickyOk(w){ var t=store('tricky')||{}, k=w.toLowerCase().replace(/’/g,"'"); if(t[k]){ t[k].ok++; if(t[k].ok>=3) delete t[k]; store('tricky',t); } }
/* Record yourself and compare with the model */
var recStream=null;
function recordOnce(ms){ return navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){ recStream=st;
  return new Promise(function(res){ var chunks=[], mr; try{ mr=new MediaRecorder(st); }catch(e){ st.getTracks().forEach(function(t){t.stop();}); res(null); return; }
    mr.ondataavailable=function(e){ if(e.data && e.data.size) chunks.push(e.data); };
    mr.onstop=function(){ st.getTracks().forEach(function(t){t.stop();}); res(chunks.length? URL.createObjectURL(new Blob(chunks,{type:mr.mimeType||'audio/webm'})) : null); };
    mr.start(); setTimeout(function(){ if(mr.state!=='inactive') mr.stop(); }, ms||5000);
    recordOnce.stop=function(){ if(mr.state!=='inactive') mr.stop(); }; }); }).catch(function(){ return null; }); }

window.FB={addTricky:addTricky, trickyOk:trickyOk, recordOnce:recordOnce, sameWord:sameWord, tipFor:tipFor, writeHTML:writeHTML, bindWrite:bindWrite, SR:SR, listen:listen, compareLine:compareLine, speakFeedback:speakFeedback, fbList:fbList, ltCheck:ltCheck, esc:esc, store:store, TEACHER_WA:TEACHER_WA, words:words};
})();
