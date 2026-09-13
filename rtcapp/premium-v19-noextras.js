(function(){'use strict';
if(window.__TeslaLyricsV19NoExtras)return;window.__TeslaLyricsV19NoExtras=true;
function stripLrc(raw){
  var rows=String(raw||'').split(/\r?\n/),out=[],seen={},i,m,k;
  for(i=0;i<rows.length;i++){
    m=rows[i].match(/^\[(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)\]/);
    if(!m){if(rows[i].trim())out.push(rows[i]);continue;}
    k=m[1]+':'+m[2];
    if(seen[k])continue;
    seen[k]=1;out.push(rows[i]);
  }
  return out.join('\n');
}
function clean(x){
  if(!x||x.kind!=='lyrics')return x;
  var y={},k;for(k in x)if(Object.prototype.hasOwnProperty.call(x,k))y[k]=x[k];
  y.lrc=stripLrc(x.lrc||'');
  delete y.translationLrc;delete y.translation;delete y.romajiLrc;delete y.romaji;
  return y;
}
function removeUi(){
  document.body.classList.add('v19NoExtras');
  var a=document.getElementById('premiumSubline');if(a&&a.parentNode)a.parentNode.removeChild(a);
  var b=document.getElementById('premiumLyricOptions');if(b&&b.parentNode)b.parentNode.removeChild(b);
}
function hook(){
  var old=window.tlxAcceptLyrics;
  if(old&&!old.__v19){
    var f=function(x){return old(clean(x))};f.__v19=true;window.tlxAcceptLyrics=f;
  }
  removeUi();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
setTimeout(hook,250);
})();
