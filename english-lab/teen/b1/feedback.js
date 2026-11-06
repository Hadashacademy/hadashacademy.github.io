/* English Lab B1 · automatic feedback for writing and speaking */
(function(){
'use strict';
var TEACHER_WA = '18297794571';

/* Grammar focus of each unit: what we look for in students' writing and speech */
var TARGETS = {
 1:['the present perfect (I’ve never…, Have you ever…?)',/\b(have|has|i've|you've|we've|they've|she's|he's|haven't|hasn't)\s+(never\s+|ever\s+|already\s+|just\s+|not\s+)?(been|done|seen|eaten|tried|gone|had|made|met|won|flown|ridden|swum|visited|\w+ed)\b/i],
 2:['for / since and the present perfect continuous',/\b(have|has|i've|you've|we've|they've|she's|he's)\s+been\s+\w+ing\b|\b(for|since)\s+(\d|a |an |two|three|many|years|months|weeks|last|i was|\w+day)/i],
 3:['comparisons (as … as, -er than, too, enough)',/\bas\s+\w+\s+as\b|\b\w+er\s+than\b|\bmore\s+\w+\s+than\b|\bthe\s+(most|best|worst)\b|\btoo\s+\w+|\b\w+\s+enough\b/i],
 4:['future forms (will, going to)',/\b(will|won't|i'll|you'll|we'll|they'll|she'll|he'll|it'll)\b|\b(am|is|are|'m|'re|'s)\s+going\s+to\b/i],
 5:['the future continuous (will be …ing)',/\b(will|'ll|won't)\s+(not\s+)?be\s+\w+ing\b|\bwill\s+have\s+\w+(ed|en|n|t)\b/i],
 6:['the first conditional (If it rains, we’ll…)',/\bif\b[^.!?]{2,60}\b(will|'ll|won't|can|might)\b|\b(will|'ll|won't)\b[^.!?]{2,60}\bif\b|\bunless\b/i],
 7:['the second conditional (If I were…, I would…)',/\bif\s+\w+\s+(were|had|could|was|\w+ed)\b|\b(would|'d|wouldn't)\s+\w+/i],
 8:['the third conditional / regrets (If I had…, I would have…)',/\b(would|could|should|might)(n't)?\s+have\s+\w+(ed|en|n|t)\b|\bif\s+\w+\s+had\b|\bi wish\b/i],
 9:['the past continuous (was / were …ing)',/\b(was|were|wasn't|weren't)\s+\w+ing\b/i],
 10:['the past perfect (had + participle)',/\b(had|hadn't|'d)\s+(never\s+|already\s+|just\s+)?(been|done|seen|gone|eaten|left|finished|forgotten|lost|\w+ed|\w+en)\b/i],
 11:['used to / would for past habits',/\b(used to|didn't use to|use to)\b|\bwould\s+(always|often|play|go|spend)\b/i],
 12:['verbs + prepositions / memories',/\b(wait|listen|depend|belong|look|care|talk|think|dream|worry|laugh|agree|apologize|apologise)\s+(for|to|on|at|about|of|after|forward to|with)\b|\b(good|bad|interested|afraid|scared|proud|tired|fond|keen)\s+(at|in|of|on)\b/i],
 13:['rules and advice (must, have to, should…)',/\b(must|mustn't|have to|has to|don't have to|doesn't have to|should|shouldn't|had better|'d better|(not\s+)?allowed to)\b/i],
 14:['be able to / ought to',/\b(be|been|was|were|wasn't|weren't|'ll be|will be)\s+(not\s+)?able\s+to\b|\bought\s+to\b/i],
 15:['modals of deduction (must be, might be, can’t be)',/\b(must|might|may|could|can't|cannot)\s+(not\s+)?(be|have)\b/i],
 16:['the passive (is made, was built…)',/\b(is|are|was|were|isn't|aren't|wasn't|weren't)\s+(not\s+)?(\w+ed|made|grown|built|found|sold|written|known|eaten|done|taken|given|sung|drunk|brought|caught|seen|stolen|chosen|spoken)\b/i],
 17:['the past perfect continuous and more passives',/\b(had|'d)\s+been\s+\w+ing\b|\b(has|have|will|must|can|should)\s+(been|be)\s+(\w+ed|done|made|built|taken|cut|sent|given|seen)\b/i],
 18:['have / get something done, make / let',/\b(have|has|had|get|got|gets|having|getting)\s+(my|his|her|our|their|your|the|a|an|its)\s+\w+(\s+\w+)?\s+(\w+ed|done|cut|made|taken|fixed|checked|repaired|painted|washed)\b|\b(make|makes|made|let|lets)\s+(me|him|her|us|them|you)\s+\w+/i],
 19:['relative clauses (who, which, where, whose)',/\b\w+,?\s+(who|which|where|whose)\s+\w+/i],
 20:['reported speech / verb patterns',/\b(said|told\s+\w+)\s+(that\s+)?(he|she|they|i|we|it|you|his|her)\b|\b(enjoy|enjoyed|avoid|can't stand|finish|keep|miss)\s+\w+ing\b|\b(want|wanted|decide|decided|promise|promised|agree|agreed|plan|planned|refuse|refused)\s+to\b/i],
 21:['reported questions and orders (asked if…, told me to…)',/\basked\s+(me\s+|him\s+|her\s+|us\s+|them\s+)?(if|whether|what|where|why|when|how|who|to)\b|\btold\s+(me|him|her|us|them)\s+(not\s+)?to\b/i],
 22:['indirect questions / future time clauses',/\b(could you tell me|can you tell me|do you know|i'd like to know|i would like to know|i wonder)\b|\b(as soon as|until|before|after|when)\s+(i|you|we|they|he|she|it)\s+\w+/i],
 23:['contrast linkers and so / such',/\b(although|even though|however|despite|in spite of)\b|\bso\s+\w+\s+that\b|\bsuch\s+(a|an)?\s*\w+/i],
 24:['word building (prefixes / suffixes)',/\b(un|dis|im|re|mis|over)[a-z]{4,}\b|\b[a-z]{3,}(ful|less|ness|ment|tion|able|ous|ive)\b/i],
 25:['phrasal verbs',/\b(give|gave|giving|given)\s+up\b|\b(look|looked|looking)\s+(after|for|forward to)\b|\b(put|putting)\s+(on|off)\b|\b(tidy|tidied)\s+up\b|\b(find|found)\s+out\b|\bget(s|ting)?\s+(on with|over)\b|\b(run|ran|running)\s+out of\b|\b(set|setting)\s+up\b|\b(turn|turned)\s+down\b|\b(pick|picked)\s+\w*\s*up\b|\b(come|came)\s+up with\b|\b(take|took)\s+up\b|\b(wake|woke)\s+up\b/i]
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
  var content = a.words<40?1 : a.words<60?2 : a.words<75?3 : (a.words<=130?4:3);
  content += (checks===total && total>0 && a.words>=75 && a.words<=130)?1:0;
  var org = a.linkers.length>=5?5 : a.linkers.length>=4?4 : a.linkers.length>=2?3 : a.linkers.length>=1?2:1;
  if(a.sentences<4) org=Math.min(org,3);
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
   '<textarea id="wtx" rows="9" placeholder="Write your text here… (about 80–100 words)">'+esc(saved)+'</textarea>'+
   '<div class="ctrl"><span class="score" id="wc">0 words</span><span class="hint">B1 goal: 80–100 words</span></div>'+
   '<div class="ctrl"><button class="btn" id="wfb">✨ Get feedback</button><button class="btn ghost sm" id="wclr">Clear</button></div>'+
   '<div id="wout"></div></div>';
}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('b1lab:'+k)||'null');localStorage.setItem('b1lab:'+k,JSON.stringify(v));}catch(e){return null;}}
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
      if(a.words>=80 && a.words<=120) good.push('Great length: <b>'+a.words+' words</b>.'); else if(a.words<80) next.push('Add more detail — you have <b>'+a.words+'</b> words; aim for <b>80–100</b>.'); else next.push('Your text is long (<b>'+a.words+'</b> words). B1 asks for about 100 — cut what isn’t necessary.');
      if(a.targetHits.length) good.push('You used this unit’s grammar — '+esc(a.target)+': <i>'+a.targetHits.map(esc).join('</i>, <i>')+'</i>.'); else next.push('Use this unit’s grammar: <b>'+esc(a.target)+'</b>.');
      if(a.linkers.length>=4) good.push('Good connectors: <i>'+a.linkers.slice(0,6).map(esc).join(', ')+'</i>.'); else next.push('Join your ideas with more connectors: <i>because, so, however, then, finally, although…</i>');
      if(a.avg>22) next.push('Some sentences are very long. Split them with full stops.'); else if(a.avg && a.avg<7) next.push('Your sentences are very short. Join some with <i>and, but, because, when</i>.');
      if(ticked<boxes.length) next.push('Check the task: did you include <b>all '+boxes.length+' points</b>? Tick them above when you have.'); else if(boxes.length) good.push('You covered all the points of the task.');
      if(a.variety<0.45) next.push('Try not to repeat the same words — use synonyms.');
      var errList = r.ok ? (real.length? '<ol class="errs">'+real.slice(0,15).map(function(m,i){ var s=(m.replacements||[]).slice(0,3).map(function(x){return '<button class="fix" data-o="'+m.offset+'" data-l="'+m.length+'" data-v="'+esc(x.value)+'">'+esc(x.value||'(delete)')+'</button>';}).join(' ');
          return '<li><b>“'+esc(text.substr(m.offset,m.length))+'”</b> — '+esc(m.message)+(s?'<div class="row">Try: '+s+'</div>':'')+'</li>'; }).join('')+'</ol>' : '<p class="fbg">✅ No grammar or spelling mistakes found. Excellent!</p>')
        : '<p class="fbw">⚠️ The grammar checker is not available right now (check your internet). The rest of the feedback still works.</p>';
      out.innerHTML='<div class="fb">'+
        '<div class="bands">'+Object.keys(sc).map(function(k){return '<div><span>'+k+'</span><b>'+sc[k]+'<small>/5</small></b><i style="width:'+(sc[k]*20)+'%"></i></div>';}).join('')+'</div>'+
        '<p class="hint" style="margin:6px 0 0">Estimated score: <b>'+total+'/20</b> using the Cambridge B1 Preliminary writing scales. Your teacher gives the final mark.</p>'+
        (good.length?'<h4>👍 What you did well</h4><ul>'+good.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+
        (next.length?'<h4>🎯 To improve</h4><ul>'+next.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+
        '<h4>🔎 Grammar &amp; spelling '+(r.ok?'('+real.length+')':'')+'</h4>'+(r.ok&&real.length?'<div class="marked">'+markText(text,real)+'</div>':'')+errList+
        '<p class="lt">Grammar check powered by <a href="https://languagetool.org" target="_blank">LanguageTool</a>. Your text is sent to LanguageTool only when you tap “Get feedback”.</p>'+
        '<div class="send"><input id="wname" placeholder="Your name" value="'+esc(store('name')||'')+'"><button class="btn wa" id="wsend">💬 Send to my teacher</button></div></div>';
      out.querySelectorAll('.fix').forEach(function(b){ b.onclick=function(){ var o=+b.dataset.o,l=+b.dataset.l; if(tx.value.substr(o,l)!==text.substr(o,l)){ alert('Your text changed — tap “Get feedback” again.'); return; } tx.value=tx.value.slice(0,o)+b.dataset.v+tx.value.slice(o+l); text=tx.value; count(); b.closest('li').style.opacity=.45; out.querySelectorAll('.fix').forEach(function(x){x.disabled=true;}); root.querySelector('#wfb').textContent='✨ Check again'; }; });
      out.querySelector('#wsend').onclick=function(){ var nm=out.querySelector('#wname').value.trim(); store('name',nm);
        var msg='📚 English Lab B1 · Unit '+D.n+' · Writing\n👤 '+(nm||'Student')+'\n📝 '+(D.write.task_title||'')+'\n\n'+tx.value.trim()+'\n\n— '+words(tx.value).length+' words · estimated '+total+'/20';
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
function compareLine(expected, said){ // LCS alignment word by word
  var E=tok(expected), S=tok(said), n=E.length, m=S.length, L=[];
  for(var i=0;i<=n;i++){ L.push(new Array(m+1).fill(0)); }
  for(i=n-1;i>=0;i--) for(var j=m-1;j>=0;j--) L[i][j]= E[i]===S[j] || E[i].replace(/'/g,'')===S[j].replace(/'/g,'') ? 1+L[i+1][j+1] : Math.max(L[i+1][j],L[i][j+1]);
  var ok=[]; i=0; j=0; while(i<n&&j<m){ if(E[i]===S[j]||E[i].replace(/'/g,'')===S[j].replace(/'/g,'')){ok[i]=1;i++;j++;} else if(L[i+1][j]>=L[i][j+1]) i++; else j++; }
  var hit=ok.filter(Boolean).length;
  return {pct: n? Math.round(hit*100/n):0, html: E.map(function(w,k){return '<span class="'+(ok[k]?'wok':'wno')+'">'+esc(w)+'</span>';}).join(' ')};
}
function speakFeedback(text, secs, unit){
  var a=analyze(text, unit), wpm= secs>3 ? Math.round(a.words/(secs/60)) : 0, good=[], next=[];
  if(a.words>=30) good.push('You spoke <b>'+a.words+' words</b> — good extended answer.'); else if(a.words>=15) next.push('Try to say more: <b>'+a.words+'</b> words. Add an example or a reason (aim for 30+).'); else next.push('Your answer is very short (<b>'+a.words+'</b> words). At B1, give 2–4 full sentences.');
  if(a.reasons) good.push('You gave a reason or an example (<i>because, so, for example…</i>).'); else next.push('Give a reason: <i>“…because…”</i> or an example: <i>“For example, …”</i>.');
  if(a.targetHits.length) good.push('You used this unit’s grammar: <i>'+a.targetHits.map(esc).join('</i>, <i>')+'</i>.'); else next.push('Try to use <b>'+esc(a.target)+'</b> in your answer.');
  if(a.linkers.length>=3) good.push('Nice connectors: <i>'+a.linkers.slice(0,5).map(esc).join(', ')+'</i>.'); else next.push('Link your ideas: <i>and, but, so, then, also, however</i>.');
  if(wpm){ if(wpm>=90) good.push('Fluency: about <b>'+wpm+' words/min</b> — confident!'); else next.push('Fluency: about <b>'+wpm+' words/min</b>. Practice again to speak more smoothly (B1 ≈ 90–130).'); }
  return {a:a, wpm:wpm, good:good, next:next};
}
function fbList(good,next){ return (good.length?'<h4>👍 Well done</h4><ul>'+good.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+(next.length?'<h4>🎯 Next time</h4><ul>'+next.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':''); }

window.FB={writeHTML:writeHTML, bindWrite:bindWrite, SR:SR, listen:listen, compareLine:compareLine, speakFeedback:speakFeedback, fbList:fbList, ltCheck:ltCheck, esc:esc, store:store, TEACHER_WA:TEACHER_WA, words:words};
})();
