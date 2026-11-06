/* English Lab B1 · Pro pronunciation tutor (Microsoft Azure Pronunciation Assessment)
   Turns itself on only when LAB_CONFIG.azureTokenUrl is set. If anything fails
   (no internet, free hours used up, limit reached…), it switches itself off and the
   free tutor is used automatically. */
(function(){
'use strict';
var CFG = window.LAB_CONFIG || {};
var SDK_URL = 'https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@1.50.0/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js';
var off = !CFG.azureTokenUrl, why = off ? 'not configured' : '', tok = null, sdkP = null;
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem('b1lab:'+k)||'null');localStorage.setItem('b1lab:'+k,JSON.stringify(v));}catch(e){return null;}}
// if the Pro tutor failed today on this device, don't retry until tomorrow
var today = new Date().toISOString().slice(0,10);
if(!off && store('proOff')===today){ off=true; why='paused today'; }
function disable(reason){ off=true; why=reason||'unavailable'; if(/quota|limit|429|403/i.test(String(reason))) store('proOff',today);
  document.querySelectorAll('.probadge').forEach(function(b){ b.className='probadge free'; b.textContent='🆓 Free tutor'; }); }
function loadSDK(){ if(window.SpeechSDK) return Promise.resolve(window.SpeechSDK);
  if(!sdkP) sdkP=new Promise(function(res,rej){ var s=document.createElement('script'); s.src=SDK_URL; s.async=true; s.onload=function(){ window.SpeechSDK?res(window.SpeechSDK):rej(new Error('sdk')); }; s.onerror=function(){ rej(new Error('sdk')); }; document.head.appendChild(s); });
  return sdkP; }
function token(){
  if(tok && Date.now()-tok.t < 8*60*1000) return Promise.resolve(tok);
  var sid=store('sid'); if(!sid){ sid=Math.random().toString(36).slice(2)+Date.now().toString(36); store('sid',sid); }
  return fetch(CFG.azureTokenUrl+(CFG.azureTokenUrl.indexOf('?')<0?'?':'&')+'s='+encodeURIComponent(sid),{cache:'no-store'})
    .then(function(r){ if(!r.ok) throw new Error('token '+r.status); return r.json(); })
    .then(function(j){ if(!j.token||!j.region) throw new Error('token'); tok={token:j.token,region:j.region,t:Date.now()}; return tok; }); }

/* assess(referenceText) → Promise<{text, pron, accuracy, fluency, completeness, words:[{word,score,error,phonemes:[{p,score}]}]} | null>
   null = Pro not available → caller uses the free tutor */
function assess(ref, maxMs){
  if(off) return Promise.resolve(null);
  return Promise.all([loadSDK(), token()]).then(function(v){
    var S=v[0], t=v[1];
    return new Promise(function(res){
      var cfg=S.SpeechConfig.fromAuthorizationToken(t.token,t.region); cfg.speechRecognitionLanguage='en-US';
      cfg.setProperty(S.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,'1200');
      var audio=S.AudioConfig.fromDefaultMicrophoneInput();
      var pa=new S.PronunciationAssessmentConfig(ref, S.PronunciationAssessmentGradingSystem.HundredMark, S.PronunciationAssessmentGranularity.Phoneme, true);
      try{ pa.phonemeAlphabet='IPA'; }catch(e){}
      var rec=new S.SpeechRecognizer(cfg,audio); pa.applyTo(rec);
      var done=false, tm=setTimeout(function(){ try{rec.close();}catch(e){} if(!done){done=true;res({text:'',words:[],pron:0});} }, maxMs||12000);
      rec.recognizeOnceAsync(function(r){
        if(done) return; done=true; clearTimeout(tm);
        try{
          if(r.reason===S.ResultReason.Canceled){ var c=S.CancellationDetails.fromResult(r); disable(c.errorDetails||c.ErrorDetails||'canceled'); rec.close(); res(null); return; }
          if(r.reason!==S.ResultReason.RecognizedSpeech){ rec.close(); res({text:'',words:[],pron:0}); return; }
          var json=JSON.parse(r.properties.getProperty(S.PropertyId.SpeechServiceResponse_JsonResult));
          var nb=(json.NBest||[])[0]||{}, pa2=nb.PronunciationAssessment||nb;
          var words=(nb.Words||[]).map(function(w){ var a=w.PronunciationAssessment||w; return {word:w.Word, score:Math.round(a.AccuracyScore||0), error:a.ErrorType||'None',
            phonemes:(w.Phonemes||[]).map(function(p){ var b=p.PronunciationAssessment||p; return {p:p.Phoneme, score:Math.round(b.AccuracyScore||0)}; })}; });
          rec.close();
          res({text:json.DisplayText||r.text||'', pron:Math.round(pa2.PronScore||0), accuracy:Math.round(pa2.AccuracyScore||0), fluency:Math.round(pa2.FluencyScore||0), completeness:Math.round(pa2.CompletenessScore||0), words:words});
        }catch(e){ try{rec.close();}catch(_){} res({text:'',words:[],pron:0}); }
      }, function(err){ if(done) return; done=true; clearTimeout(tm); disable(err); try{rec.close();}catch(e){} res(null); });
    });
  }).catch(function(e){ disable(e && e.message); return null; });
}
/* Tips by sound (IPA) for Spanish speakers */
var PH = {
 'θ':['Put your tongue between your teeth and blow: “th” as in think.','Lengua entre los dientes y sopla: “th” de think.'],
 'ð':['Tongue between your teeth, with voice: “th” as in this.','Lengua entre los dientes, con voz: “th” de this.'],
 'v':['Top teeth on your bottom lip: “v”, not “b”.','Dientes de arriba sobre el labio de abajo: “v”, no “b”.'],
 'z':['Make a buzzing sound, like a bee: zzz.','Haz un zumbido, como una abeja: zzz.'],
 'ʃ':['“sh”: like asking for silence — shhh.','“sh”: como cuando pides silencio — shhh.'],
 'ʒ':['Like “sh”, but with voice: televiSion.','Como “sh”, pero con voz.'],
 'dʒ':['“j” sounds like “dy”: job, orange.','La “j” suena “dy”: job, orange.'],
 'tʃ':['“ch” is short and strong: chair.','“ch” corta y fuerte: chair.'],
 'h':['A soft breath: “ha”. Not a strong Spanish “j”.','Un soplido suave, no una “j” fuerte.'],
 'ɪ':['Short “i”, relaxed: ship, sit. Not “ee”.','“i” corta y relajada: ship, sit.'],
 'i':['Long “ee”, smile: sheep, eat.','“ii” larga, sonríe: sheep, eat.'],
 'iː':['Long “ee”, smile: sheep, eat.','“ii” larga, sonríe: sheep, eat.'],
 'æ':['Open your mouth wide: “a” between a and e — cat, hat.','Abre bien la boca: entre “a” y “e”.'],
 'ʌ':['Short, relaxed “uh”: cup, but.','“a” corta y relajada: cup, but.'],
 'ə':['Weak, relaxed “uh” — don’t stress it.','Sonido débil “uh”, sin fuerza.'],
 'ɑ':['Open “ah”: car, father.','“a” abierta: car, father.'],
 'ɝ':['“er”: curl your tongue back — bird, work.','“er”: lengua hacia atrás — bird, work.'],
 'ɚ':['Weak “er”: teacher, water.','“er” suave: teacher, water.'],
 'ɹ':['English “r”: don’t touch the top of your mouth.','La “r” inglesa no toca el paladar.'],
 'r':['English “r”: don’t touch the top of your mouth.','La “r” inglesa no toca el paladar.'],
 'ŋ':['“ng” is in your throat — don’t say a hard “g”.','“ng” en la garganta, sin “g” fuerte.'],
 'w':['Round your lips: “w” — want, work.','Redondea los labios: “w”.'],
 'j':['“y” like a quick “i”: yes, you.','“y” como una “i” rápida: yes.'],
 's':['A clear “sss”. At the start of a word, no “e” before it.','“sss” clara. Sin “e” al principio.'],
 't':['Say the final “t” — don’t drop it.','Pronuncia la “t” final.'],
 'd':['Say the final “d” — don’t drop it.','Pronuncia la “d” final.'],
 'ʊ':['Short “u”: book, good.','“u” corta: book, good.'],
 'u':['Long “oo”: food, school.','“uu” larga: food, school.'],
 'oʊ':['“oh-u”: go, home.','“ou”: go, home.'],
 'eɪ':['“ei”: day, make.','“ei”: day, make.'],
 'aɪ':['“ai”: my, time.','“ai”: my, time.'],
 'p':['Strong “p” with a little air: pen.','“p” fuerte con un poquito de aire.'],
 'k':['Strong “k” with a little air: cat.','“k” fuerte con aire.']
};
function phTip(p){ return PH[p] || PH[String(p).replace('ː','')] || null; }
window.PRO={ available:function(){ return !off; }, reason:function(){ return why; }, assess:assess, phTip:phTip, disable:disable };
})();
