const app = document.querySelector('#app');
const paths = {
 camera:'<path d="M3 7h5l2-3h4l2 3h5v14H3z"/><circle cx="12" cy="13" r="4"/>',
 car:'<path d="m4 10 2-5h12l2 5M3 10h18v8H3zM5 18v3m14-3v3M6 14h2m8 0h2"/>',
 tuning:'<path d="m4 20 9-9m-4-6 3-3 3 3-3 3zm7 8 3-3 3 3-3 3zM3 13l3-3 3 3-3 3zm10 7 3-3 3 3-3 3z"/>',
 tool:'<path d="m14 5 4 4 4-2a7 7 0 0 1-9 8l-7 7-4-4 7-7a7 7 0 0 1 8-9z"/>',
 battery:'<path d="M3 7h18v14H3zM8 7V4h8v3M7 12h4m-2-2v4m6-2h3"/>',
 note:'<path d="M12 4H3v17h17v-9M9 16l2-5 9-9 3 3-9 9z"/>',
 motor:'<path d="M5 6h14v14H5zM9 3v3m6-3v3m-6 14v3m6-3v3M2 10h3m14 0h3M2 16h3m14 0h3"/><circle cx="12" cy="13" r="3"/>',
 wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m7 4 2 4m8-4-2 4m-8 12 2-4m8 4-2-4M3 12h5m8 0h5"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
 arrow:'<path d="m9 5 7 7-7 7"/>',
 check:'<path d="m5 12 4 4L20 5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.motor}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value = text => text ? escape(text) : '<span class="unknown">Не указано</span>';
let vehicles = [], vehicleAliases = {}, filter = 'all', query = '', currentCar = null, currentTab = 'overview';
const title = car => car.manufacturer && car.model ? `${car.manufacturer} ${car.model}` : car.model || car.manufacturer;
const placeholder = (caption = 'Фото не добавлено') => `<div class="placeholder">${icon('camera')}<span>${caption}</span></div>`;
function safeImage(path) {
  if (typeof path !== 'string' || !path || /[\\\u0000-\u001f]/.test(path)) return null;
  try { const url = new URL(path, document.baseURI); return url.origin === location.origin && ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function photo(path, alt, className = '', eager = false, label = '') {
  const src = safeImage(path);
  return `<div class="media ${className}">${src ? `<img src="${escape(src)}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>` : placeholder()}${src && label ? `<span class="image-label">${escape(label)}</span>` : ''}</div>`;
}
function sourceLink(url, label) {
  try {
    const target = new URL(url);
    if (target.protocol !== 'https:') return '';
    return `<a href="${escape(target.href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
  } catch { return ''; }
}
function sourceNotes(car) {
  if (!car.sources?.length) return '';
  return `<details class="source-notes"><summary>Источники данных и фотографий</summary><ul>${car.sources.map(source=>`<li>${sourceLink(source.url,source.label)}</li>`).join('')}</ul></details>`;
}
function imageAttribution(item) {
  return item?.imageCredit ? `<p class="image-credit">${escape(item.imageCredit)}${sourceLink(item.imageSourceUrl,'Источник фото') ? ` · ${sourceLink(item.imageSourceUrl,'Источник фото')}` : ''}</p>` : '';
}
function bindImageFallbacks() {
  document.querySelectorAll('img').forEach(img => {img.onerror = () => {
    const fallback = document.createElement('div'); fallback.innerHTML = placeholder('Фото недоступно'); img.replaceWith(fallback.firstChild);
  };});
}
const vehicleUrl = (car, tab = 'overview') => `#/vehicle/${encodeURIComponent(car.id)}${tab === 'overview' ? '' : `/${tab}`}`;
function renderSidebar() {
  const sidebarScroll = document.querySelector('#sidebar').scrollTop;
  const car = currentCar || vehicles[0];
  const nav = [['car','Коллекция','#/',!currentCar || ['overview','specs','gallery'].includes(currentTab)],['tuning','Тюнинг',vehicleUrl(car,'tuning'),currentTab === 'tuning'],['tool','Обслуживание',vehicleUrl(car,'service'),currentTab === 'service']];
  document.querySelector('#main-nav').innerHTML = nav.map(([symbol,label,url,active]) => `<a href="${url}" class="nav-item ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span>${label === 'Коллекция' ? `<small>${vehicles.length}</small>` : ''}</a>`).join('') + '<div class="nav-item upcoming">'+icon('battery')+'<span>Аккумуляторы</span><small>Скоро</small></div><div class="nav-item upcoming">'+icon('note')+'<span>Заметки</span><small>Скоро</small></div>';
  document.querySelector('#model-list').innerHTML = vehicles.map(car => `<a class="model-link ${currentCar?.id === car.id ? 'selected' : ''}" href="${vehicleUrl(car)}" ${currentCar?.id === car.id ? 'aria-current="page"' : ''} aria-label="${escape(title(car))}${car.description ? ` — ${escape(car.description)}` : ''}">${photo(car.thumbnail || car.image,title(car),'',false,car.imageLabel)}<div><strong>${escape(title(car))}</strong><span>${escape(car.description || 'Описание не указано')}</span></div></a>`).join('');
  if (!matchMedia('(min-width: 901px)').matches) document.querySelector('#sidebar').open = false;
  document.querySelector('#sidebar').scrollTop = sidebarScroll;
  bindImageFallbacks();
}
function card(car) {
  return `<a class="card" href="${vehicleUrl(car)}" aria-label="${escape(title(car))}${car.description ? ` — ${escape(car.description)}` : ''}">${photo(car.thumbnail || car.image,title(car),'',false,car.imageLabel)}<div class="card-info"><div><p class="maker">${escape(car.manufacturer || 'Производитель не указан')}</p><h2>${escape(car.model || car.manufacturer)}</h2><p>${escape(car.description || 'Описание: Не указано')} <span>·</span> ${escape(car.scale || 'Масштаб не указан')}</p></div>${icon('arrow')}</div></a>`;
}
function updateGrid() {
  const results = vehicles.filter(car => (filter === 'all' || (filter === 'custom' ? ['kamaz','ural'].includes(car.id) : car.id === 'trailer')) && `${title(car)} ${car.description || ''}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  document.querySelector('#cards').innerHTML = results.length ? results.map(card).join('') : '<p class="empty-result">Ничего не найдено. Попробуйте другое название.</p>';
  document.querySelector('#count').textContent = `${results.length} из ${vehicles.length} моделей`;
  document.querySelectorAll('.filter').forEach(button => {button.classList.toggle('active', button.dataset.filter === filter);button.setAttribute('aria-pressed', String(button.dataset.filter === filter));});
  bindImageFallbacks();
}
function home() {
  document.title = 'Мой гараж — RC Garage';
  app.innerHTML = `<div class="collection-page view"><header class="collection-heading"><p class="eyebrow">RC GARAGE / ЛИЧНАЯ КОЛЛЕКЦИЯ</p><h1>Мой гараж</h1><p class="intro-copy">Модели, детали и истории вашей коллекции.</p></header><div class="toolbar"><div class="filters" role="group" aria-label="Фильтр коллекции"><button class="filter" data-filter="all">Все модели</button><button class="filter" data-filter="custom">Самодельные</button><button class="filter" data-filter="trailer">Прицепы</button></div><label class="search">${icon('search')}<input type="search" placeholder="Найти модель" aria-label="Найти модель" value="${escape(query)}"></label></div><p id="count" role="status" aria-live="polite"></p><div id="cards" class="grid"></div><p class="page-footnote">У каждой модели — своя история.</p></div>`;
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {filter = button.dataset.filter;updateGrid();}));
  document.querySelector('input[type="search"]').addEventListener('input', event => {query = event.target.value;updateGrid();});
  updateGrid();
}
const tabNames = {overview:'Обзор',specs:'Характеристики',tuning:'Тюнинг',service:'Обслуживание',gallery:'Галерея'};
function getSpecs(car) {
  const s = car.specifications;
  return [['Производитель',car.manufacturer],['Модель',car.model],['Масштаб',car.scale],['Размеры',s.dimensions],['Вес',s.weight],['Двигатель',s.motor],['Регулятор ESC',s.esc],['Сервопривод',s.servo],['Аккумулятор',s.battery],['Подвеска',s.suspension],['Колёса и шины',s.wheels],['Привод и трансмиссия',s.transmission],...([['Колёсная база',s.wheelbase],['Колея',s.track],['Клиренс',s.groundClearance],['Каталожная масса',s.catalogWeight],['Совместимое питание',s.batteryCompatibility],['Аккумуляторный отсек',s.batteryCompartment],['Аппаратура',s.radio],['Освещение',s.lighting]].filter(([,text])=>text))];
}
const categories = [ ['motor','Двигатель','motor'],['esc','Регулятор ESC','motor'],['servo','Сервопривод','motor'],['suspension','Подвеска','tool'],['wheels','Колёса и шины','wheel'],['tuning','Тюнинг','tuning'] ];
function componentCards(car) {
  return `<div class="component-grid">${categories.map(([key,label,symbol]) => {
    const component = car.components.find(c => c.category === key);
    const summary = key === 'tuning' ? (car.upgrades.length ? `${car.upgrades.length} записей` : car.tuningNote ? 'Список уточняется' : car.stockConfirmed ? 'Без изменений' : null) : component?.name || component?.model || car.specifications[key];
    const media = key === 'tuning' && car.stockConfirmed ? `<div class="media stock-media"><div class="placeholder">${icon('check')}<span>Штатная комплектация</span></div></div>` : photo(component?.image,component?.name || component?.model || label,'',false,component?.imageLabel);
    return `<button class="component-card" data-component="${key}" aria-label="${label}: подробнее">${media}<span class="component-info">${icon(symbol)}<span><span class="component-label">${label}</span><strong>${value(summary)}</strong><span class="component-caption">${escape(component?.summary || component?.manufacturer || (key === 'tuning' ? 'Установленные улучшения' : 'Сведения о компоненте'))}</span></span>${icon('arrow')}</span></button>`;
  }).join('')}</div>`;
}
const galleryItem = item => typeof item === 'string' ? {src:item} : item;
function gallery(car, preview = false) {
  const photos = preview ? car.gallery.slice(0,3) : car.gallery;
  return `<div class="gallery-grid">${photos.length ? photos.map((item,i) => {
    const image = galleryItem(item);
    return `<figure><button class="gallery-photo" data-photo="${i}" aria-label="Открыть фото: ${escape(image.caption || String(i+1))}">${photo(image.src, image.caption || `${title(car)} — ракурс ${i+1}`,'',false,image.label)}</button>${image.caption ? `<figcaption>${escape(image.caption)}</figcaption>` : ''}</figure>`;
  }).join('') : [1,2,3].map(() => photo(null,'Фотография модели')).join('')}</div>`;
}
function tuning(car) {
  return `<div class="section-heading"><h2>Тюнинг и настройки</h2><p>Установленные улучшения и индивидуальные настройки.</p></div>${car.upgrades.length ? `<ul class="record-list">${car.upgrades.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>` : car.tuningNote ? `<div class="empty-panel"><h3>Тюнинг будет описан позже</h3><p>${escape(car.tuningNote)}</p></div>` : car.stockConfirmed ? '<div class="empty-panel"><h3>Заводская комплектация</h3><p>Модель без замен штатных компонентов — подтверждено владельцем.</p></div>' : '<div class="empty-panel"><h3>Улучшения пока не записаны</h3><p>Установленные улучшения: Не указано.</p></div>'}<div class="note-panel">Настройки: ${value(car.settings)}</div>`;
}
function service(car) {
  return `<div class="section-heading"><h2>История обслуживания</h2><p>Работы, замены деталей и забота о модели.</p></div>${car.service.length ? `<ul class="record-list">${car.service.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>` : '<div class="empty-panel"><h3>История ещё не заполнена</h3><p>Сведения об обслуживании и замене деталей: Не указано.</p></div>'}`;
}
function renderPanel(car, tab) {
  let content;
  if (tab === 'specs') content = `<div class="section-heading"><h2>Характеристики</h2><p>${car.referenceConfiguration ? 'Заводские сведения для справки. Текущие компоненты и изменения уточняются.' : 'Только подтверждённые сведения о модели.'}</p></div><dl class="specs">${getSpecs(car).map(([label,text])=>`<div><dt>${label}</dt><dd>${value(text)}</dd></div>`).join('')}</dl>`;
  else if (tab === 'tuning') content = tuning(car);
  else if (tab === 'service') content = service(car);
  else if (tab === 'gallery') content = `<div class="section-heading"><h2>Галерея</h2><p>Разные ракурсы и детали крупным планом.</p></div>${gallery(car)}`;
  else content = `${componentCards(car)}${car.components.some(c => !categories.some(([key]) => key === c.category)) ? `<h2 class="extra-title">Другие компоненты</h2><div class="extra-components">${car.components.map((c,i) => !categories.some(([key]) => key === c.category) ? `<button class="component-card" data-extra="${i}" aria-label="${escape(c.name || c.model || 'Компонент')}: подробнее">${photo(c.image,c.name || c.model,'',false,c.imageLabel)}<span class="component-info"><span><span class="component-label">${value(c.manufacturer)}</span><strong>${value(c.name || c.model)}</strong></span>${icon('arrow')}</span></button>` : '').join('')}</div>` : ''}<div class="gallery-heading"><h2>В деталях</h2><a href="${vehicleUrl(car,'gallery')}">Все фотографии ${icon('arrow')}</a></div>${gallery(car,true)}`;
  return `<section class="tab-panel" id="panel-${tab}" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0">${content}</section>`;
}
function openDialog(content) {
  document.querySelector('#dialog-content').innerHTML = content;
  document.querySelector('#component-dialog').showModal(); bindImageFallbacks();
}
function componentDetail(component, label, summary) {
  openDialog(`<p class="eyebrow">${escape(label)}</p>${photo(component?.image,component?.name || component?.model || label,'',false,component?.imageLabel)}${imageAttribution(component)}<h2>${value(component?.name || component?.model || summary)}</h2><dl class="specs"><div><dt>Производитель</dt><dd>${value(component?.manufacturer)}</dd></div><div><dt>Точная модель</dt><dd>${value(component?.model)}</dd></div><div><dt>Характеристики</dt><dd>${value(component?.specifications)}</dd></div><div><dt>Примечания</dt><dd>${value(component?.notes)}</dd></div></dl>${component?.sourceUrl ? `<p class="image-credit">${sourceLink(component.sourceUrl,'Источник характеристик')}</p>` : ''}`);
}
function openGalleryPhoto(car, index) {
  const item = galleryItem(car.gallery[index]);
  openDialog(`${photo(item.src,item.caption || title(car),'lightbox',true,item.label)}<p class="gallery-dialog-caption">${escape(item.caption || title(car))}</p>${imageAttribution({imageCredit:item.credit,imageSourceUrl:item.sourceUrl})}`);
}
function detail(car, tab) {
  document.title = `${title(car)} — ${tabNames[tab]} — RC Garage`;
  const color = car.color || (/Красный/i.test(car.description || '') ? 'Красный' : /Серый/i.test(car.description || '') ? 'Серый' : /Хамелеон/i.test(car.description || '') ? 'Хамелеон' : /Чёрный/i.test(car.description || '') ? 'Чёрный' : /хаки/i.test(car.description || '') ? 'Хаки' : null);
  app.innerHTML = `<article class="vehicle-page view"><header class="vehicle-hero ${car.image ? 'has-photo' : ''}">${photo(car.image,title(car),'hero-media',true,car.imageLabel)}<div class="hero-title"><a href="#/" class="eyebrow back">КОЛЛЕКЦИЯ / ${String(vehicles.indexOf(car)+1).padStart(2,'0')}</a><h1>${escape(title(car))}</h1><p>${escape(car.description || 'Описание: Не указано')}</p></div><span class="collection-badge">${icon('check')} В коллекции</span></header><div class="vehicle-body"><dl class="quick-specs">${[['Масштаб',car.scale],['Тип',car.specifications.type],['Привод',car.specifications.drive],['Кузов',color]].map(([label,text])=>`<div><dt>${label}</dt><dd>${value(text)}</dd></div>`).join('')}</dl>${car.referenceConfiguration ? `<aside class="configuration-note"><strong>Заводская справка</strong><p>${escape(car.configurationNote)}</p></aside>` : ''}<div class="tabs" role="tablist" aria-label="Разделы модели">${Object.entries(tabNames).map(([key,label])=>`<button id="tab-${key}" role="tab" aria-selected="${tab === key}" ${tab === key ? `aria-controls="panel-${key}"` : ''} tabindex="${tab === key ? 0 : -1}" data-tab="${key}" class="${tab === key ? 'active' : ''}">${label}</button>`).join('')}</div>${renderPanel(car,tab)}<p class="page-footnote">${car.configurationNote ? escape(car.configurationNote) : car.image ? 'Фотографии коллекции владельца.' : 'Фотографии владельца пока не добавлены. Чужие изображения не используются.'}</p>${imageAttribution(car)}${sourceNotes(car)}</div></article>`;
  app.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {location.hash = vehicleUrl(car,button.dataset.tab);});
    button.addEventListener('keydown',event => {
      const keys = Object.keys(tabNames), index = keys.indexOf(tab);
      const next = event.key === 'ArrowRight' ? keys[(index+1)%keys.length] : event.key === 'ArrowLeft' ? keys[(index+keys.length-1)%keys.length] : event.key === 'Home' ? keys[0] : event.key === 'End' ? keys.at(-1) : null;
      if (next) {event.preventDefault();location.hash = vehicleUrl(car,next);}
    });
  });
  app.querySelectorAll('[data-component]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.component;
    if (key === 'tuning') {location.hash = vehicleUrl(car,'tuning');return;}
    componentDetail(car.components.find(c=>c.category === key),categories.find(([k])=>k === key)[1],car.specifications[key]);
  }));
  app.querySelectorAll('[data-extra]').forEach(button=>button.addEventListener('click',()=>componentDetail(car.components[Number(button.dataset.extra)],'Компонент')));
  app.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>openGalleryPhoto(car,Number(button.dataset.photo))));
  bindImageFallbacks();
}
function route() {
  document.querySelector('#component-dialog').close();
  const hash = location.hash || '#/';
  const previous = currentCar?.id, previousTab = currentTab;
  currentCar = null;currentTab = 'overview';
  if (hash === '#/' || hash === '#') home();
  else {
    const match = /^#\/vehicle\/([^/]+)(?:\/([^/]+))?$/.exec(hash);
    const requestedId = match && (Object.hasOwn(vehicleAliases,match[1]) ? encodeURIComponent(vehicleAliases[match[1]]) : match[1]);
    const car = match && vehicles.find(item => encodeURIComponent(item.id) === requestedId);
    if (car && (!match[2] || Object.hasOwn(tabNames,match[2]))) {
      if (match[1] !== encodeURIComponent(car.id)) {location.replace(vehicleUrl(car,match[2] || 'overview'));return;}
      currentCar = car;currentTab = match[2] || 'overview';detail(car,currentTab);}
    else {document.title = 'Модель не найдена — RC Garage';app.innerHTML = '<div class="error"><h1>Страница не найдена</h1><p>Возможно, ссылка устарела.</p><a href="#/">В мою коллекцию →</a></div>';}
  }
  renderSidebar();
  const tabs = app.querySelector('.tabs'), activeTab = app.querySelector('[aria-selected=true]');
  if (tabs && activeTab) tabs.scrollLeft = activeTab.offsetLeft - tabs.offsetLeft - (tabs.clientWidth-activeTab.offsetWidth)/2;
  if (currentCar?.id === previous && previousTab !== currentTab) {app.querySelector(`[data-tab="${currentTab}"]`)?.focus({preventScroll:true});}
  else window.scrollTo(0,0);
}
for (const nav of ['#main-nav','#model-list']) document.querySelector(nav).addEventListener('click',event=>{
  if(event.target.closest('a') && !matchMedia('(min-width: 901px)').matches) document.querySelector('#sidebar').open = false;
});
const breakpoint = matchMedia('(min-width: 901px)');
breakpoint.addEventListener('change',()=>{document.querySelector('#sidebar').open = breakpoint.matches;});
document.querySelector('#sidebar').open = breakpoint.matches;
document.querySelector('#sidebar summary').addEventListener('click',event=>{if(breakpoint.matches) event.preventDefault();});
async function init() {
  try {
    const response = await fetch('./data/collection.json');if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();vehicles = data.vehicles;vehicleAliases = data.redirects || {};
    route();window.addEventListener('hashchange',route);
  } catch {
    app.innerHTML = '<div class="error"><h1>Гараж пока недоступен</h1><p>Не удалось загрузить каталог. Попробуйте ещё раз.</p><button type="button">Повторить</button></div>';
    app.querySelector('button').addEventListener('click',()=>location.reload());
  }
}
init();
