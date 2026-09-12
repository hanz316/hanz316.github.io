(function(){'use strict';
var ROOT='https://ntfy.sh/';
var BASE='teslalyrics-hanz316-9f2c7e6a3b8d4f10a15c';
var STATE=BASE+'-state',LYR=BASE+'-lyrics',CMD=BASE+'-cmd';
var chunks={},streams={},lastPollAt=0,pollBusy=false,lastRestartAt=0,lastStateRxAt=0,lastAnyRxAt=0;
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
  if(playing&&stamp){var transit=now-stamp;if(transit>0&&transit<45000)elapsed+=transit;}
  if(same&&lastStateLocalAt&&playing&&lastStatePlaying&&now>allowBackwardUntil){
    var predicted=lastStateElapsed+Math.max(0,now-lastStateLocalAt),back=predicted-elapsed;
    if(back>80&&back<=1800)elapsed=predicted;
  }
  if(duration>0)elapsed=Math.min(elapsed,duration);
  out.elapsed=Math.round(elapsed);
  if(stamp)lastStateStamp=stamp;
  lastStateTrack=key;lastStateElapsed=out.elapsed;lastStateLocalAt=now;lastStatePlaying=playing;
  return out;
}
function markState(){lastStateRxAt=Date.now();lastAnyRxAt=lastStateRxAt;window.tlxRelayLastStateAt=lastStateRxAt}
function markAny(){lastAnyRxAt=Date.now()}
function acceptEnvelope(env){
  if(!env||Number(env.v)<10||Number(env.v)>16)return;
  if(env.kind==='state'&&env.payload&&window.tlxAcceptState){var s=normalizeState(env.payload);if(s){markState();window.tlxAcceptState(s)}return;}
  if(env.kind==='lyrics'&&env.payload&&window.tlxAcceptLyrics){markAny();window.tlxAcceptLyrics(env.payload);return;}
  if(env.kind==='lyricsChunk'){
    var id=String(env.id||''),p=Number(env.part)||0,n=Number(env.total)||0;
    if(!id||p<0||n<1||n>60)return;
    var c=chunks[id]||(chunks[id]={parts:[],total:n,at:Date.now()});c.parts[p]=String(env.data||'');c.total=n;
    var ok=true,i;for(i=0;i<n;i++)if(typeof c.parts[i]!=='string'){ok=false;break}
    if(ok){var raw=decodeB64(c.parts.join(''));delete chunks[id];var x=parseEnvelope(raw);if(x&&x.kind==='lyrics'&&window.tlxAcceptLyrics){markAny();window.tlxAcceptLyrics(x)}}
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
function closeStream(name){var es=streams[name];if(es)try{es.close()}catch(e){}streams[name]=null}
function openStream(name,topic){
  closeStream(name);if(!window.EventSource)return;
  try{
    var es=new EventSource(ROOT+topic+'/sse?since=latest&_='+(Date.now()));streams[name]=es;
    es.onmessage=function(e){handleNtfyText(e.data)};
    es.onerror=function(){if(streams[name]!==es)return;try{es.close()}catch(e){}streams[name]=null;setTimeout(function(){if(!streams[name])openStream(name,topic)},1400)};
  }catch(e){setTimeout(function(){openStream(name,topic)},1800)}
}
function restartStreams(){var now=Date.now();if(now-lastRestartAt<9000)return;lastRestartAt=now;openStream('state',STATE);openStream('lyrics',LYR)}
function pollOnce(){
  var now=Date.now();if(pollBusy||now-lastPollAt<5500)return;lastPollAt=now;pollBusy=true;
  try{
    var u=ROOT+STATE+','+LYR+'/json?poll=1&since=45s&_='+now;
    var x=new XMLHttpRequest();x.open('GET',u,true);x.timeout=8500;
    x.onreadystatechange=function(){if(x.readyState!==4)return;pollBusy=false;if(x.status>=200&&x.status<300)handleNtfyText(x.responseText)};
    x.onerror=function(){pollBusy=false};x.ontimeout=function(){pollBusy=false};x.send();
  }catch(e){pollBusy=false}
}
openStream('state',STATE);openStream('lyrics',LYR);
setTimeout(function(){if(!lastStateRxAt)pollOnce()},3200);
setInterval(function(){
  var now=Date.now(),age=lastStateRxAt?now-lastStateRxAt:999999;
  if(age>24000)pollOnce();
  if(age>36000)restartStreams();
  for(var k in chunks)if(now-chunks[k].at>120000)delete chunks[k];
},4000);
window.tlxRelayForceRecover=function(){pollOnce();restartStreams()};
window.tlxHttpCommand=function(action,extra){
  var x={kind:'control',action:action,ts:Date.now()},k;if(extra)for(k in extra)x[k]=extra[k];
  if(action==='seek'){allowBackwardUntil=Date.now()+3500;if(extra&&isFinite(Number(extra.position))){lastStateElapsed=Math.max(0,Number(extra.position));lastStateLocalAt=Date.now();}}
  try{var r=new XMLHttpRequest();r.open('POST',ROOT+CMD,true);r.setRequestHeader('Content-Type','text/plain;charset=UTF-8');r.send(JSON.stringify({v:16,kind:'command',payload:x}))}catch(e){}
};
})();
