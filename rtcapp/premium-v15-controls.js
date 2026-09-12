(function(){'use strict';
if(window.__TeslaLyricsV15Controls)return;window.__TeslaLyricsV15Controls=true;
var TK='teslalyrics_translation_v15',RK='teslalyrics_romaji_v15';
function q(id){return document.getElementById(id)}
function read(k,def){try{var v=localStorage.getItem(k);return v===null?def:v==='1'}catch(e){return def}}
function write(k,v){try{localStorage.setItem(k,v?'1':'0')}catch(e){}}
var showT=read(TK,true),showR=read(RK,true);
function apply(){document.body.classList.toggle('hideTranslation',!showT);document.body.classList.toggle('hideRomaji',!showR);var a=q('premiumToggleTranslation'),b=q('premiumToggleRomaji');if(a){a.textContent='译文 '+(showT?'开':'关');a.className='premiumOptionBtn'+(showT?'':' off')}if(b){b.textContent='罗马音 '+(showR?'开':'关');b.className='premiumOptionBtn'+(showR?'':' off')}}
function boot(){var dock=q('controlDock');if(!dock){setTimeout(boot,100);return}if(!q('premiumLyricOptions')){var row=document.createElement('div');row.id='premiumLyricOptions';row.innerHTML='<button id="premiumToggleTranslation" class="premiumOptionBtn">译文 开</button><button id="premiumToggleRomaji" class="premiumOptionBtn">罗马音 开</button>';var bottom=dock.querySelector('.dockBottom');if(bottom)dock.insertBefore(row,bottom);else dock.appendChild(row);q('premiumToggleTranslation').onclick=function(){showT=!showT;write(TK,showT);apply()};q('premiumToggleRomaji').onclick=function(){showR=!showR;write(RK,showR);apply()}}apply()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
