(function(){'use strict';
if(window.__TeslaLyricsV18Health)return;window.__TeslaLyricsV18Health=true;
function q(id){return document.getElementById(id)}
function healthy(){var now=Date.now(),relay=Number(window.tlxRelayLastStateAt)||0;if(relay&&now-relay<45000)return true;var core=q('status'),s=core?String(core.textContent||''):'';if(!s)return false;if(/等待播放器|连接中|正在连接|失败|恢复中|通信组件/.test(s))return false;return /播放中|已暂停|已连接|HTTPS兼容线路|歌词/.test(s)}
function sync(){var ok=healthy();document.body.classList.toggle('v18Connected',ok);var title=q('title'),hasTrack=title&&String(title.textContent||'').replace(/\s+/g,'')&&!/等待手机播放器|等待播放/.test(String(title.textContent||''));document.body.classList.toggle('v18Recovering',!ok&&!!hasTrack)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();setInterval(sync,800);document.addEventListener('visibilitychange',function(){if(!document.hidden)sync()});
})();
