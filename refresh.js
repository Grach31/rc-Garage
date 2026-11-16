const button = document.querySelector('#refresh-button');
const indicator = document.querySelector('#pull-refresh');
const message = document.querySelector('#refresh-message');
const threshold = 85;
let pull = null, refreshing = false, hideTimer;

function show(text, ready = false) {
  clearTimeout(hideTimer);
  message.textContent = text;
  indicator.hidden = false;
  indicator.classList.add('visible');
  indicator.classList.toggle('ready', ready);
}
function hide() {
  indicator.hidden = true;
  indicator.classList.remove('visible', 'ready');
}
function hasUnsavedNote() {
  const form = document.querySelector('#note-editor');
  if (!form || form.hidden) return false;
  return JSON.stringify([form.querySelector('select').value, form.querySelector('textarea').value]) !== form.dataset.savedSnapshot;
}
async function refresh() {
  if (refreshing) return;
  pull = null;
  if (hasUnsavedNote() && !window.confirm('В заметке есть несохранённые изменения. Обновить приложение и отменить их?')) {
    hide();return;
  }
  refreshing = true;
  button.disabled = true;
  button.classList.add('refreshing');
  indicator.classList.add('refreshing');
  show('Обновляем…');
  try {
    if (!navigator.onLine) throw new Error('Offline');
    const response = await fetch(location.pathname + location.search, {cache:'no-store'});
    if (!response.ok) throw new Error('Refresh unavailable');
    // Reload revalidates the document and its assets and retains the current hash route.
    location.reload();
  } catch {
    refreshing = false;
    button.disabled = false;
    button.classList.remove('refreshing');
    indicator.classList.remove('refreshing');
    show('Не удалось обновить. Проверьте интернет и повторите.');
    hideTimer = setTimeout(hide, 5000);
  }
}
button.addEventListener('click',refresh);

function atTop() {
  return Math.max(window.scrollY, document.scrollingElement?.scrollTop || 0) <= 1;
}
function canStart(target) {
  if (target.closest('input,textarea,select,button,dialog,[contenteditable]')) return false;
  for (let el = target; el && el !== document.body; el = el.parentElement) {
    if (el.scrollTop > 0 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return false;
  }
  return true;
}
document.addEventListener('touchstart',event=>{
  pull = null;
  if (refreshing || event.touches.length !== 1 || !atTop() || document.querySelector('dialog[open]') || !canStart(event.target)) return;
  const touch = event.touches[0];
  pull = {id:touch.identifier,x:touch.clientX,y:touch.clientY,distance:0};
},{passive:true});
document.addEventListener('touchmove',event=>{
  if (!pull) return;
  const touch = Array.from(event.touches).find(item=>item.identifier === pull.id);
  if (event.touches.length !== 1 || !touch || !atTop()) {pull = null;if (!refreshing) hide();return;}
  const dx = touch.clientX-pull.x, dy = touch.clientY-pull.y;
  if (dy < -8 || (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy))) {pull = null;hide();return;}
  if (dy <= 8) return;
  if (!event.cancelable) {pull = null;hide();return;}
  event.preventDefault();
  pull.distance = dy;
  show(dy >= threshold ? 'Отпустите, чтобы обновить' : 'Потяните вниз, чтобы обновить', dy >= threshold);
},{passive:false});
document.addEventListener('touchend',event=>{
  if (!pull) return;
  if (!Array.from(event.changedTouches).some(item=>item.identifier === pull.id)) return;
  const ready = pull.distance >= threshold;
  pull = null;
  if (ready) refresh();else hide();
},{passive:true});
document.addEventListener('touchcancel',()=>{pull = null;if (!refreshing) hide();},{passive:true});
