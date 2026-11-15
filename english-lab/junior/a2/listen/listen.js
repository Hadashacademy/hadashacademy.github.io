/* English Lab · Junior A2 — listening player (Student's Book #listen, Workbook units and Practice Tests) */
(function(){
var D=window.LD, app=document.getElementById('app'), S=window.speechSynthesis, voices=[], tok=0, rate=1;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(){voices=(S&&S.getVoices()||[]).filter(function(v){return /^en/i.test(v.lang)})}
if(S){load();S.onvoiceschanged=load}
var who={}, wi=0;
var FEM=/^(Maya|Nina|Sofía|Miss Ana|Mom|Grandma|Girl|Woman|Librarian|Nurse|Seller|Guide|Aunt)/i;
function vfor(name){
  if(!(name in who)){who[name]=wi++}
  var fem=FEM.test(name), pool=voices.filter(function(v){return fem?/female|samantha|zira|aria|jenny|google us english|karen|moira|tessa|victoria/i.test(v.name):/male|daniel|david|guy|alex|fred|google uk english male/i.test(v.name)});
  if(!pool.length)pool=voices;
  return {v:pool.length?pool[who[name]%pool.length]:null, p:fem?1.15:0.9};
}
function clean(t){return t.replace(/^Q\d+\s*/,'').replace(/—/g,',')}
function sayLines(list,i,done,hl){
  var my=++tok; S&&S.cancel();
  (function step(k){
    if(my!==tok)return;
    if(k>=list.length){hl&&hl(-1);done&&done();return}
    hl&&hl(k);
    if(!S){step(k+1);return}
    var u=new SpeechSynthesisUtterance(clean(list[k][1])), c=vfor(list[k][0]);
    if(c.v)u.voice=c.v; u.lang='en-US'; u.pitch=c.p; u.rate=.92*rate;
    u.onend=function(){setTimeout(function(){step(k+1)},350)}; u.onerror=function(){step(k+1)};
    S.speak(u);
  })(i||0);
}
function stop(){tok++;S&&S.cancel()}
var L=D.lines;
var tasks='';
(D.tasks||[]).forEach(function(t,ti){
  if(t.type==='mc'){
    tasks+='<div class="card"><div class="h"><span class="n">'+(ti+1)+'</span> '+esc(t.title)+'</div>'+t.qs.map(function(q,i){
      return '<div class="mcq" data-c="'+q.c+'"><p><b>'+(i+1)+'.</b> '+esc(q.q)+'</p><div class="opts">'+q.o.map(function(o,j){return '<button class="opt" data-j="'+j+'">'+(q.e?'<span class="emo">'+q.e[j]+'</span>':'')+'<b>'+'ABC'[j]+'</b> '+esc(o)+'</button>'}).join('')+'</div></div>'}).join('')+'<p class="score" hidden></p></div>';
  } else if(t.type==='form'){
    tasks+='<div class="card"><div class="h"><span class="n">'+(ti+1)+'</span> '+esc(t.title)+'</div>'+t.rows.map(function(r,i){return '<label class="fr"><span>'+esc(r[0])+'</span><input data-a="'+esc(r[1])+'" autocomplete="off"></label>'}).join('')+'<button class="btn chk">Check</button><p class="score" hidden></p></div>';
  } else if(t.type==='table'){
    tasks+='<div class="card"><div class="h"><span class="n">'+(ti+1)+'</span> '+esc(t.title)+'</div><div class="tw"><table class="lt"><tr>'+t.head.map(function(h){return '<th>'+esc(h)+'</th>'}).join('')+'</tr>'+t.rows.map(function(r){return '<tr>'+t.head.map(function(h,k){return '<td>'+(r[k]?'<b>'+esc(r[k])+'</b>':'<input autocomplete="off">')+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>'+(t.extra?'<p>'+esc(t.extra)+'</p><input class="wide" autocomplete="off">':'')+'<button class="btn key">Show answers</button><p class="keyt" hidden><b>Answers:</b> '+esc(t.key)+'</p></div>';
  } else if(t.type==='chant'){
    tasks+='<div class="card chant"><div class="h">🎶 '+esc(t.title)+'</div>'+t.lines.map(function(x){return '<div>'+esc(x)+'</div>'}).join('')+'<button class="btn say">▶ Listen to the chant</button></div>';
  }
});
var nav=(D.prev?'<a href="'+D.prev+'">← '+esc(D.prevt)+'</a>':'<span></span>')+(D.next?'<a href="'+D.next+'">'+esc(D.nextt)+' →</a>':'');
app.innerHTML='<header class="top"><div class="wrap"><nav class="crumbs">'+D.crumbs+'</nav><div class="kick">'+esc(D.kick)+'</div><h1>'+esc(D.title)+'</h1><p>'+esc(D.scene||'')+'</p></div></header>'+
 '<main class="wrap"><div class="card" style="margin-top:-28px;position:relative"><div class="h">🎧 Listen</div><p class="hint">Listen two times. Then do the activities. You can read the script after you finish.</p>'+
 '<div class="pl"><button class="btn play">▶ Play</button><button class="btn ghost stop">■ Stop</button><button class="btn ghost slow">🐢 Slow</button></div>'+
 '<details class="scr"><summary>📄 Show the script</summary>'+L.map(function(l,i){return '<div class="ln" data-i="'+i+'"><b>'+esc(l[0].replace(/^Q(\d+)$/,'$1.'))+'</b> '+esc(l[1])+' <button class="mini" data-i="'+i+'" aria-label="play line">🔊</button></div>'}).join('')+'</details></div>'+
 tasks+'<nav class="pn">'+nav+'</nav><p class="foot">'+esc(D.foot)+'<br>© 2026 Mercedes Moronta · Hadash Academy</p></main>';
function hl(k){[].forEach.call(app.querySelectorAll('.ln'),function(e){e.classList.toggle('on',+e.dataset.i===k)})}
app.querySelector('.play').onclick=function(){sayLines(L,0,null,hl)};
app.querySelector('.stop').onclick=stop;
app.querySelector('.slow').onclick=function(){rate=rate===1?.75:1;this.textContent=rate===1?'🐢 Slow':'🐇 Normal'};
[].forEach.call(app.querySelectorAll('.mini'),function(b){b.onclick=function(){var i=+b.dataset.i;sayLines([L[i]],0,null,function(k){hl(k<0?-1:i)})}});
[].forEach.call(app.querySelectorAll('.chant .say'),function(b){b.onclick=function(){var t=D.tasks.filter(function(x){return x.type==='chant'})[0];sayLines(t.lines.map(function(x){return ['Miss Ana',x]}),0)}});
function norm(s){return s.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9:.' ]/g,' ').replace(/\b(a|an|the|at|on|in)\b/g,' ').replace(/\s+/g,' ').trim()}
[].forEach.call(app.querySelectorAll('.mcq'),function(q){
  var c=+q.dataset.c;
  [].forEach.call(q.querySelectorAll('.opt'),function(o){o.onclick=function(){
    if(q.dataset.done)return; q.dataset.done=1; var j=+o.dataset.j;
    o.classList.add(j===c?'ok':'bad'); q.querySelectorAll('.opt')[c].classList.add('ok');
    var card=q.closest('.card'), all=card.querySelectorAll('.mcq'), done=card.querySelectorAll('.mcq[data-done]');
    if(all.length===done.length){var s=card.querySelectorAll('.opt.ok').length-0, right=0;[].forEach.call(all,function(m){var b=m.querySelector('.opt.bad');if(!b)right++});var p=card.querySelector('.score');p.hidden=false;p.textContent=(right===all.length?'🌟 Perfect! ':'👍 ')+right+' / '+all.length}
  }})
});
[].forEach.call(app.querySelectorAll('.chk'),function(b){b.onclick=function(){
  var card=b.closest('.card'), ins=card.querySelectorAll('input[data-a]'), r=0;
  [].forEach.call(ins,function(i){var ok=i.dataset.a.split(' / ').some(function(a){return norm(a)===norm(i.value)});i.classList.toggle('ok',ok);i.classList.toggle('bad',!ok);if(ok)r++;else i.title='Answer: '+i.dataset.a});
  var p=card.querySelector('.score');p.hidden=false;p.textContent=(r===ins.length?'🌟 Perfect! ':'👍 ')+r+' / '+ins.length+(r<ins.length?' — tap a red box to see the answer.':'');
  [].forEach.call(ins,function(i){if(i.classList.contains('bad'))i.onclick=function(){i.value=i.dataset.a}});
}});
[].forEach.call(app.querySelectorAll('.key'),function(b){b.onclick=function(){b.nextElementSibling.hidden=false}});
})();
