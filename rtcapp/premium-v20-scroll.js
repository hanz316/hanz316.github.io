(function(){'use strict';
if(window.__TeslaLyricsV20Scroll)return;window.__TeslaLyricsV20Scroll=true;
var nativeRAF=window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(cb){return setTimeout(function(){cb(Date.now())},16)};
var nativeCAF=window.cancelAnimationFrame?window.cancelAnimationFrame.bind(window):clearTimeout;
var waveTimers={};
// The premium waveform callback is named "frame". Throttle only that loop to ~10 fps;
// CSS transitions remain compositor-driven and are unaffected.
window.requestAnimationFrame=function(cb){
  if(cb&&cb.name==='frame'){
    var id=setTimeout(function(){delete waveTimers[id];nativeRAF(cb)},96);
    waveTimers[id]=1;return id;
  }
  return nativeRAF(cb);
};
window.cancelAnimationFrame=function(id){if(waveTimers[id]){delete waveTimers[id];clearTimeout(id);return}try{nativeCAF(id)}catch(e){}};

var lyrics=null,group=null,activeTxt=null,lastText='',lastHTML='',ghost=null,cleanupTimer=null,observer=null;
function norm(s){return String(s||'').replace(/\s+/g,'').trim()}
function text(sel){var e=document.querySelector(sel);return norm(e&&e.textContent)}
function stripIds(root){var a=root.querySelectorAll('[id]');for(var i=0;i<a.length;i++)a[i].removeAttribute('id')}
function clearAnim(){
  if(cleanupTimer){clearTimeout(cleanupTimer);cleanupTimer=null}
  if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);ghost=null;
  if(group){group.classList.remove('v20Incoming');group.style.transition='';group.style.transform='';group.style.opacity='';group.style.willChange=''}
  if(document.body)document.body.classList.remove('v20ScrollBusy');
}
function directionFor(oldText){
  if(oldText&&text('.line.m1 .txt')===oldText)return-1; // normal next line: old content moves upward
  if(oldText&&text('.line.p1 .txt')===oldText)return 1;  // seek/backward: old content moves downward
  return-1;
}
function animate(oldHTML,oldText){
  if(!lyrics||!group||!oldHTML)return;
  clearAnim();
  var gr=group.getBoundingClientRect(),lr=lyrics.getBoundingClientRect();
  if(!gr.width||!gr.height)return;
  var dir=directionFor(oldText),shift=Math.max(24,Math.min(42,Math.round(gr.height*.075)));
  var g=group.cloneNode(false);g.removeAttribute('id');g.className=(group.className||'')+' v20Ghost';g.innerHTML=oldHTML;
  var extras=g.querySelectorAll('#premiumPhraseProgress,#premiumSubline');for(var i=0;i<extras.length;i++)if(extras[i].parentNode)extras[i].parentNode.removeChild(extras[i]);
  stripIds(g);
  var cs=window.getComputedStyle?getComputedStyle(group):null;
  g.style.left=(gr.left-lr.left)+'px';g.style.top=(gr.top-lr.top)+'px';g.style.width=gr.width+'px';g.style.height=gr.height+'px';
  if(cs){g.style.display=cs.display;g.style.flexDirection=cs.flexDirection;g.style.justifyContent=cs.justifyContent;g.style.alignItems=cs.alignItems;g.style.gap=cs.gap}
  g.style.opacity='1';g.style.transform='translate3d(0,0,0)';
  lyrics.appendChild(g);ghost=g;
  document.body.classList.add('v20ScrollBusy');
  group.classList.add('v20Incoming');group.style.willChange='transform,opacity';group.style.transition='none';group.style.transform='translate3d(0,'+(-dir*shift)+'px,0)';group.style.opacity='.70';
  // One layout flush per lyric change only; afterwards both layers are transform/opacity only.
  void group.offsetHeight;
  var ease='cubic-bezier(.20,.72,.22,1)';
  group.style.transition='transform 300ms '+ease+',opacity 210ms ease-out';
  g.style.transition='transform 300ms '+ease+',opacity 205ms ease-out';
  nativeRAF(function(){
    if(!group||!g.parentNode)return;
    group.style.transform='translate3d(0,0,0)';group.style.opacity='1';
    g.style.transform='translate3d(0,'+(dir*shift)+'px,0)';g.style.opacity='0';
  });
  cleanupTimer=setTimeout(clearAnim,340);
}
function handleChange(){
  if(!group||!activeTxt)return;
  var now=norm(activeTxt.textContent);if(!now||now===lastText)return;
  var oldText=lastText,oldHTML=lastHTML;
  // Core updates all six lyric rows in one batch. Keep that finished frame as the next snapshot.
  animate(oldHTML,oldText);
  lastText=now;lastHTML=group.innerHTML;
}
function boot(){
  lyrics=document.getElementById('lyrics');group=document.getElementById('lyricsGroup');activeTxt=document.querySelector('.line.active .txt');
  if(!lyrics||!group||!activeTxt){setTimeout(boot,120);return}
  lastText=norm(activeTxt.textContent);lastHTML=group.innerHTML;
  if(window.MutationObserver){observer=new MutationObserver(handleChange);observer.observe(activeTxt,{childList:true,characterData:true,subtree:true})}
  else setInterval(handleChange,160);
  window.addEventListener('beforeunload',clearAnim);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
