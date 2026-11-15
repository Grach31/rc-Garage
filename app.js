const app = document.querySelector('#app');
const camera = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true"><path d="M9 20h12l4-7h14l4 7h12v30H9z" stroke-linejoin="round"/><circle cx="32" cy="34" r="10"/><path d="M46 25h4M18 55h28"/></svg>';
const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value = text => text ? escape(text) : '<span class="unknown">Не указано</span>';
let vehicles = [], filter = 'all', query = '';
const title = car => car.manufacturer && car.model ? `${car.manufacturer} ${car.model}` : car.model || car.manufacturer;
const placeholder = (caption = 'Фото не добавлено') => `<div class="placeholder">${camera}<p>${caption}</p></div>`;
// Relative asset paths keep the site portable to GitHub Pages subdirectories.
function safeImage(path) {
  if (typeof path !== 'string' || !path || /[\\\u0000-\u001f]/.test(path)) return null;
  const url = new URL(path, document.baseURI);
  return url.origin === location.origin && ['http:', 'https:'].includes(url.protocol) ? url.href : null;
}
function photo(path, alt, className = '', overlay = '', eager = false) {
  const src = safeImage(path);
  return `<div class="media ${className}">${src ? `<img src="${escape(src)}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">` : placeholder()}${overlay}</div>`;
}
function bindImageFallbacks() {
  app.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
    const fallback = document.createElement('div'); fallback.innerHTML = placeholder('Фото недоступно'); img.replaceWith(fallback.firstChild);
  }, {once:true}));
}
function swatch(car) {
  const s = car.description || '';
  const color = /Хамелеон/.test(s) ? 'chameleon' : /Серый/.test(s) ? 'grey' : /Красный/.test(s) ? 'red' : /Чёрный/.test(s) ? 'black' : /хаки/.test(s) ? 'khaki' : '';
  return color ? `<span class="swatch ${color}" aria-hidden="true"></span>` : '';
}
function card(car) {
  const number = String(vehicles.indexOf(car) + 1).padStart(2, '0');
  return `<a class="card" href="#/vehicle/${encodeURIComponent(car.id)}" aria-label="${escape(title(car))}${car.description ? ` — ${escape(car.description)}` : ''}">
    ${photo(car.image, title(car), '', `<span class="index">${number} / COLLECTION</span><span class="scale">${car.scale ? escape(car.scale) : 'Масштаб не указан'}</span>`)}
    <div class="card-info"><div><p class="maker">${escape(car.manufacturer || 'Производитель не указан')}</p><h2>${escape(car.model || car.manufacturer)}</h2><p class="card-description">${swatch(car)}${escape(car.description || 'Описание: Не указано')}</p></div><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18 18 6M6 6h12v12"/></svg></span></div></a>`;
}
function updateGrid() {
  const results = vehicles.filter(car => (filter === 'all' || (filter === 'custom' ? ['kamaz','ural'].includes(car.id) : car.id === 'trailer')) && `${title(car)} ${car.description || ''}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  document.querySelector('#cards').innerHTML = results.length ? results.map(card).join('') : '<p class="empty-result">Ничего не найдено. Попробуйте другое название.</p>';
  document.querySelector('#count').textContent = `ПОКАЗАНО ${String(results.length).padStart(2,'0')} ИЗ ${vehicles.length}`;
  document.querySelectorAll('.filter').forEach(button => { button.classList.toggle('active', button.dataset.filter === filter); button.setAttribute('aria-pressed', String(button.dataset.filter === filter)); });
  bindImageFallbacks();
}
function home() {
  document.title = 'Мой гараж — RC Garage';
  app.innerHTML = `<div class="view"><section class="intro"><div><p class="eyebrow"><span class="dot"></span> ЛИЧНАЯ КОЛЛЕКЦИЯ / ${String(vehicles.length).padStart(2,'0')} МОДЕЛЕЙ</p><h1>Мой <em>гараж.</em></h1></div><p class="intro-copy">Модели, детали и истории.<br>Всё, что делает эту коллекцию моей.</p></section>
  <div class="toolbar"><div class="filters" role="group" aria-label="Фильтр коллекции"><button class="filter" data-filter="all">Все модели <span>· ${vehicles.length}</span></button><button class="filter" data-filter="custom">Самодельные</button><button class="filter" data-filter="trailer">Прицепы</button></div><label class="search">${searchIcon}<input type="search" placeholder="Найти модель" aria-label="Найти модель" value="${escape(query)}"></label></div>
  <div class="collection-meta"><span id="count" role="status" aria-live="polite"></span><span>Коллекция в деталях</span></div><div id="cards" class="grid"></div><div class="collection-end"><span>10 моделей. Каждая — с характером.</span><span>Фотографии скоро займут своё место.</span></div></div>`;
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {filter = button.dataset.filter; updateGrid();}));
  document.querySelector('input[type="search"]').addEventListener('input', event => {query = event.target.value; updateGrid();});
  updateGrid();
}
function section(id, n, name, desc, content) {
  return `<section class="detail-section" id="${id}"><div><span class="section-number">${n} / В ДЕТАЛЯХ</span><h2>${name}</h2><p class="section-desc">${desc}</p></div><div>${content}</div></section>`;
}
function detail(car) {
  document.title = `${title(car)} — RC Garage`;
  const specs = [['Производитель',car.manufacturer],['Модель',car.model],['Масштаб',car.scale],['Размеры',car.specifications.dimensions],['Вес',car.specifications.weight],['Двигатель',car.specifications.motor],['Регулятор ESC',car.specifications.esc],['Сервопривод',car.specifications.servo],['Аккумулятор',car.specifications.battery],['Подвеска',car.specifications.suspension],['Колёса и шины',car.specifications.wheels],['Привод и трансмиссия',car.specifications.transmission]];
  app.innerHTML = `<article class="view"><a class="back" href="#/">← <span>В мой гараж</span></a><header class="detail-header"><div><p class="eyebrow">${escape(car.manufacturer || 'ПЕРСОНАЛЬНАЯ КОЛЛЕКЦИЯ')}</p><h1 tabindex="-1">${escape(car.model || car.manufacturer)}</h1><p class="detail-sub">${swatch(car)}${escape(car.description || 'Описание: Не указано')}</p></div><span class="record">ЭКЗЕМПЛЯР ${String(vehicles.indexOf(car)+1).padStart(2,'0')} / 10</span></header>
  ${photo(car.image, title(car), 'hero-media', '', true)}<p class="photo-note">${car.image ? 'Фотография коллекции владельца.' : 'Здесь будет фотография этой модели. Изображение владельца пока не добавлено.'}</p>
  <nav class="tabs" aria-label="Разделы модели"><a href="#specs">Характеристики</a><a href="#components">Компоненты</a><a href="#service">Тюнинг и обслуживание</a><a href="#gallery">Галерея</a></nav>
  ${section('specs','01','Характеристики','Паспорт модели. Только подтверждённые сведения.',`<dl class="specs">${specs.map(([label,text])=>`<div><dt>${label}</dt><dd>${value(text)}</dd></div>`).join('')}</dl>`)}
  ${section('components','02','Установленные компоненты','То, из чего складывается характер модели.',car.components.length ? `<div class="component-grid">${car.components.map(c=>`<article class="component">${photo(c.image,c.model)}<p class="maker">${value(c.manufacturer)}</p><h3>${value(c.model)}</h3><p>Характеристики: ${value(c.specifications)}</p><p>Примечания: ${value(c.notes)}</p></article>`).join('')}</div>` : '<div class="empty-panel"><h3>Детали появятся здесь</h3><p>Установленные компоненты: Не указано.<br>Для каждой детали будут фото, точная модель и характеристики.</p></div>')}
  ${section('service','03','Тюнинг и обслуживание','Улучшения, настройки и история модели.','<div class="empty-panel"><h3>История ещё не заполнена</h3><p>Установленные улучшения: Не указано.<br>Настройки: Не указано.<br>История обслуживания: Не указано.</p></div>')}
  ${section('gallery','04','Ближе к деталям','Другие ракурсы и детали крупным планом.',car.gallery.length ? `<div class="gallery-empty">${car.gallery.map((src,i)=>photo(src,`${title(car)} — ракурс ${i+1}`)).join('')}</div>` : `<div class="gallery-empty">${[1,2,3].map(()=>`<div class="media">${placeholder()}</div>`).join('')}</div>`)}
  <a class="back" href="#/">← <span>Ко всей коллекции</span></a></article>`;
  app.querySelectorAll('.tabs a').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); document.querySelector(link.getAttribute('href')).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }));
  bindImageFallbacks();
}
function route() {
  const hash = location.hash || '#/';
  if (hash === '#/' || hash === '#') home();
  else {
    const car = vehicles.find(item => hash === `#/vehicle/${encodeURIComponent(item.id)}`);
    if (car) detail(car);
    else {document.title = 'Модель не найдена — RC Garage'; app.innerHTML = '<div class="error"><h1>Модель не найдена</h1><p>Возможно, ссылка устарела.</p><a class="back" href="#/">← В мой гараж</a></div>';}
  }
  window.scrollTo(0,0);
}
async function init() {
  try {
    const response = await fetch('./data/collection.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json(); vehicles = data.vehicles;
    route(); window.addEventListener('hashchange', route);
  } catch {
    app.innerHTML = '<div class="error"><h1>Гараж пока недоступен</h1><p>Не удалось загрузить каталог. Проверьте соединение и попробуйте ещё раз.</p><button type="button">Повторить</button></div>';
    app.querySelector('button').addEventListener('click', () => location.reload());
  }
}
init();
