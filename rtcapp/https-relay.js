(function(){'use strict';
var ROOT='https://ntfy.sh/';
var BASE='teslalyrics-hanz316-9f2c7e6a3b8d4f10a15c';
var STATE=BASE+'-state',LYR=BASE+'-lyrics',CMD=BASE+'-cmd';
var chunks={},gotAny=false,pollTimer=null;
var lastStateStamp=0,lastStateTrack='',lastStateElapsed=0,lastStateLocalAt=0,lastStatePlaying=false,allowBackwardUntil=0;
function parseEnvelope(raw){try{return JSON.parse(raw)}catch(e){return null}}
function decodeB64(s){try{return decodeURIComponent(escape(atob(s)))}catch(e){return ''}}
function copyObject(x){var y={},k;for(k in x)if(Object.prototype.hasOwnProperty.call(x,k))y[k]=x[k];return y}
function stateTrack(s){return [s&&s.title||'',s&&s.artist||'',s&&s.album||'',Number(s&&s.duration)||0].join('|')}
function normalizeState(src){
  if(!src)return null;
  var now=Date.now(),stamp=Number(src.sentAtMs)||0,key=stateTrack(src),same=key===lastStateTrack;
  if(same&&stamp&&lastStateStamp&&stamp<=lastStateStamp)return null;
  var out=copyObject(src),elapsed=Math.max(0,Number(out.elapsed)||0),duration=Math.max(0,Number(out.duration)||0),playing=!!out.playing;
  if(playing&&stamp){var transit=now-stamp;if(transit>0&&transit<30000)elapsed+=transit;}
  if(same&&lastStateLocalAt&&playing&&lastStatePlaying&&now>allowBackwardUntil){
    var predicted=lastStateElapsed+Math.max(0,now-lastStateLocalAt),back=predicted-elapsed;
    if(back>80&&back<=1200)elapsed=predicted;
  }
  if(duration>0)elapsed=Math.min(elapsed,duration);
  out.elapsed=Math.round(elapsed);
  if(stamp)lastStateStamp=stamp;
  lastStateTrack=key;lastStateElapsed=out.elapsed;lastStateLocalAt=now;lastStatePlaying=playing;
  return out;
}
function acceptEnvelope(env){
  if(!env||(env.v!==10&&env.v!==11&&env.v!==12))return;
  if(env.kind==='state'&&env.payload&&window.tlxAcceptState){var s=normalizeState(env.payload);if(s){gotAny=true;window.tlxAcceptState(s)}return;}
  if(env.kind==='lyrics'&&env.payload&&window.tlxAcceptLyrics){gotAny=true;window.tlxAcceptLyrics(env.payload);return;}
  if(env.kind==='lyricsChunk'){
    var id=String(env.id||''),p=Number(env.part)||0,n=Number(env.total)||0;
    if(!id||p<0||n<1||n>40)return;
    var c=chunks[id]||(chunks[id]={parts:[],total:n,at:Date.now()});c.parts[p]=String(env.data||'');c.total=n;
    var ok=true,i;for(i=0;i<n;i++)if(typeof c.parts[i]!=='string'){ok=false;break}
    if(ok){var raw=decodeB64(c.parts.join(''));delete chunks[id];var x=parseEnvelope(raw);if(x&&x.kind==='lyrics'&&window.tlxAcceptLyrics){gotAny=true;window.tlxAcceptLyrics(x)}}
  }
}
function handleNtfyText(text){
  var lines=String(text||'').split(/\r?\n/),i,o,env;
  for(i=0;i<lines.length;i++){
    if(!lines[i])continue;
    try{o=JSON.parse(lines[i])}catch(e){continue}
    if(o.event!=='message'||!o.message)continue;
    env=parseEnvelope(o.message);acceptEnvelope(env);
  }
}
function startSse(topic){
  if(!window.EventSource)return null;
  try{
    var es=new EventSource(ROOT+topic+'/sse?since=latest');
    es.onmessage=function(e){handleNtfyText(e.data)};
    es.onerror=function(){};
    return es;
  }catch(e){return null}
}
function pollOnce(){
  try{
    var u=ROOT+STATE+','+LYR+'/json?poll=1&since=10s&_='+(Date.now());
    var x=new XMLHttpRequest();x.open('GET',u,true);x.onreadystatechange=function(){if(x.readyState===4&&x.status>=200&&x.status<300)handleNtfyText(x.responseText)};x.send();
  }catch(e){}
}
function startPolling(){if(pollTimer)return;pollOnce();pollTimer=setInterval(pollOnce,5000)}
var s1=startSse(STATE),s2=startSse(LYR);
setTimeout(function(){if(!gotAny)startPolling()},4500);
window.tlxHttpCommand=function(action,extra){
  var x={kind:'control',action:action,ts:Date.now()},k;if(extra)for(k in extra)x[k]=extra[k];
  if(action==='seek'){allowBackwardUntil=Date.now()+3500;if(extra&&isFinite(Number(extra.position))){lastStateElapsed=Math.max(0,Number(extra.position));lastStateLocalAt=Date.now();}}
  try{var r=new XMLHttpRequest();r.open('POST',ROOT+CMD,true);r.setRequestHeader('Content-Type','text/plain;charset=UTF-8');r.send(JSON.stringify({v:10,kind:'command',payload:x}))}catch(e){}
};
setInterval(function(){var now=Date.now(),k;for(k in chunks)if(now-chunks[k].at>120000)delete chunks[k]},30000);
})();
