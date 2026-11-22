'use strict';

let autoplay = false;
let autoplayTimer;
const autoplayInterval = 1700;

function scheduleAutoplay() {
  clearTimeout(autoplayTimer);
  if(!autoplay||!s||s.ended||s.activeDecision)return;
  autoplayTimer=setTimeout(()=>{
    if(!autoplay||!s||s.ended||s.activeDecision)return;
    if($('#modal').open||document.hidden){
      scheduleAutoplay();
      return;
    }
    simulateUntilImportant('year',false);
  },autoplayInterval);
}
function toggleAutoplay() {
  autoplay=!autoplay;
  render();
}
function autoplayControls(){
  return `<div class="autoplay-controls">
    <button type="button" class="secondary" id="autoplayBtn" aria-pressed="${autoplay}">${autoplay?'自動進行をオフにする':'1年ずつ自動で進める'}</button>
    ${autoplay?`<p role="status">${s.activeDecision?'自動進行は一時停止中。選ぶと再開します。':'自動進行中。大切な選択が出ると止まります。'}</p>`:''}
  </div>`;
}
function bindAutoplay(){
  $('#autoplayBtn').onclick=toggleAutoplay;
  scheduleAutoplay();
}
function stopAutoplay(){
  autoplay=false;
  clearTimeout(autoplayTimer);
}
