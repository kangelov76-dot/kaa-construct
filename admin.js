const ADMIN_PASSWORD = 'KAA2026';

const loginBox = document.getElementById('adminLogin');
const app = document.getElementById('adminApp');

const passInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('adminLoginBtn');
const msg = document.getElementById('adminLoginMsg');

const refreshBtn = document.getElementById('refreshAdmin');
const logoutBtn = document.getElementById('adminLogout');

const statusBox = document.getElementById('adminStatus');
const listBox = document.getElementById('submissionsList');

let allRows = [];
let activeFilter = 'all';
let activePhotoIndex = 0;
let activePhotos = [];

function esc(v){
  return String(v || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]));
}

function fmtDate(iso){
  try{
    return new Date(iso).toLocaleString('bg-BG', {
      day:'2-digit',
      month:'2-digit',
      year:'numeric',
      hour:'2-digit',
      minute:'2-digit'
    });
  }catch(e){
    return iso || '';
  }
}

function isToday(iso){
  try{
    return new Date(iso).toDateString() === new Date().toDateString();
  }catch(e){
    return false;
  }
}

function getPhotos(data){
  const photos = [];

  for(let i = 1; i <= 10; i++){
    const item = data[`photo_${i}`];

    if(item && typeof item === 'object' && item.url){
      photos.push({
        url: item.url,
        filename: item.filename || `Снимка ${i}`
      });
    }

    if(typeof item === 'string' && item.startsWith('http')){
      photos.push({
        url: item,
        filename: `Снимка ${i}`
      });
    }
  }

  return photos;
}

function statusKey(id){
  return `kaa_status_${id}`;
}

function readStatus(id){
  return localStorage.getItem(statusKey(id)) || 'new';
}

function saveStatus(id, status){
  localStorage.setItem(statusKey(id), status);
}

function statusLabel(status){
  return {
    new: 'Нова',
    seen: 'Прегледана',
    called: 'Обадено',
    offer: 'Оферта',
    done: 'Приключена'
  }[status] || 'Нова';
}

function login(){
  if(passInput.value !== ADMIN_PASSWORD){
    msg.textContent = 'Грешна парола';
    return;
  }

  localStorage.setItem('kaa_admin_auth','1');

  loginBox.classList.add('hidden');
  app.classList.remove('hidden');

  prepareMetricButtons();
  loadSubmissions();
}

function logout(){
  localStorage.removeItem('kaa_admin_auth');
  location.reload();
}

async function loadSubmissions(){
  statusBox.textContent = 'Зареждане на реалните заявки от Netlify...';
  listBox.innerHTML = '';

  try{
    const res = await fetch('/.netlify/functions/get-submissions');

    if(!res.ok){
      throw new Error('Грешка при зареждане: ' + res.status);
    }

    const json = await res.json();

    if(!json.success){
      throw new Error(json.error || 'Невалиден отговор от сървъра');
    }

    allRows = json.submissions || [];

    renderMetrics(allRows);
    renderFiltered();

  }catch(err){
    statusBox.textContent = 'Грешка: ' + err.message;
    listBox.innerHTML = '';
  }
}

function prepareMetricButtons(){
  const boxes = document.querySelectorAll('.admin-metrics > div');

  boxes.forEach((box, index) => {
    box.classList.add('metric-button');

    if(index === 0) box.dataset.filter = 'all';
    if(index === 1) box.dataset.filter = 'today';
    if(index === 2) box.dataset.filter = 'photos';
    if(index === 3) box.dataset.filter = 'unseen';

    box.addEventListener('click', () => {
      activeFilter = box.dataset.filter || 'all';

      document.querySelectorAll('.metric-button').forEach(b => b.classList.remove('active'));
      box.classList.add('active');

      renderFiltered();
    });
  });

  if(boxes[0]) boxes[0].classList.add('active');
}

function renderMetrics(rows){
  const todayCount = rows.filter(r => isToday(r.created_at)).length;

  const withPhotos = rows.filter(r => {
    const data = r.data || {};
    return getPhotos(data).length > 0;
  }).length;

  const unseenCount = rows.filter(r => readStatus(r.id) === 'new').length;

  document.getElementById('metricTotal').textContent = rows.length;
  document.getElementById('metricToday').textContent = todayCount;
  document.getElementById('metricPhotos').textContent = withPhotos;

  const unseenEl = document.getElementById('metricUnseen');
  if(unseenEl) unseenEl.textContent = unseenCount;
}

function getFilteredRows(){
  if(activeFilter === 'today'){
    return allRows.filter(r => isToday(r.created_at));
  }

  if(activeFilter === 'photos'){
    return allRows.filter(r => getPhotos(r.data || {}).length > 0);
  }

  if(activeFilter === 'unseen'){
    return allRows.filter(r => readStatus(r.id) === 'new');
  }

  return allRows;
}

function renderFiltered(){
  const rows = getFilteredRows();

  const label = {
    all: 'Всички заявки',
    today: 'Заявки от днес',
    photos: 'Заявки със снимки',
    unseen: 'Непрегледани заявки'
  }[activeFilter] || 'Всички заявки';

  statusBox.textContent = `${label}: ${rows.length}`;

  renderMetrics(allRows);
  renderSubmissions(rows);
}

function renderSubmissions(rows){
  if(!rows.length){
    listBox.innerHTML = '<p>Няма заявки за този филтър.</p>';
    return;
  }

  listBox.innerHTML = rows.map(r => {
    const d = r.data || {};
    const photos = getPhotos(d);
    const status = readStatus(r.id);

    return `
      <div class="admin-row-card" data-id="${esc(r.id)}">

        <div class="admin-row-main">
          <div class="admin-row-title">
            <b>№${esc(r.number)} — ${esc(d.name || r.name || 'Без име')}</b>
            <span>${esc(fmtDate(r.created_at))}</span>
          </div>

          <div class="admin-row-meta">
            <span>📧 ${esc(d.email || 'няма имейл')}</span>
            <span>📞 ${esc(d.phone || 'няма телефон')}</span>
            <span>📷 ${photos.length}</span>
          </div>
        </div>

        <div class="admin-row-actions">
          <label class="status-check">
            <input type="checkbox" ${status !== 'new' ? 'checked' : ''} data-action="toggle-seen" data-id="${esc(r.id)}">
            <span>Прегледана</span>
          </label>

          <select class="status-select" data-action="status" data-id="${esc(r.id)}">
            <option value="new" ${status === 'new' ? 'selected' : ''}>Нова</option>
            <option value="seen" ${status === 'seen' ? 'selected' : ''}>Прегледана</option>
            <option value="called" ${status === 'called' ? 'selected' : ''}>Обадено</option>
            <option value="offer" ${status === 'offer' ? 'selected' : ''}>Оферта</option>
            <option value="done" ${status === 'done' ? 'selected' : ''}>Приключена</option>
          </select>

          <span class="status-pill status-${esc(status)}">${esc(statusLabel(status))}</span>

          <button class="mini-3d-btn" data-action="details" data-id="${esc(r.id)}">Детайли</button>
        </div>

      </div>
    `;
  }).join('');
}

function openDetails(id){
  const r = allRows.find(x => x.id === id);
  if(!r) return;

  const d = r.data || {};
  const photos = getPhotos(d);

  const size = [d.width, d.length, d.height].filter(Boolean).join(' x ');

  const modal = document.createElement('div');
  modal.className = 'admin-modal-backdrop';
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-head">
        <div>
          <h2>Заявка №${esc(r.number)} — ${esc(d.name || r.name || 'Без име')}</h2>
          <p>${esc(fmtDate(r.created_at))}</p>
        </div>

        <button class="modal-x mini-3d-btn" data-close-modal>×</button>
      </div>

      <div class="admin-detail-grid">
        <p><b>Име:</b><br>${esc(d.name)}</p>
        <p><b>Телефон:</b><br>${esc(d.phone)}</p>
        <p><b>Имейл:</b><br>${esc(d.email)}</p>
        <p><b>Тип:</b><br>${esc(d.type)}</p>
        <p><b>Етап:</b><br>${esc(d.stage)}</p>
        <p><b>Локация:</b><br>${esc(d.location)}</p>
        <p><b>Размери:</b><br>${esc(size)}</p>
        <p><b>Конструкция:</b><br>${esc(d.existing)}</p>
        <p><b>Срок:</b><br>${esc(d.deadline)}</p>
        <p><b>Бюджет:</b><br>${esc(d.budget)}</p>
        <p><b>Контакт:</b><br>${esc(d.contact_method)}</p>
      </div>

      <div class="admin-detail-message">
        <b>Описание:</b>
        <p>${esc(d.message || 'Няма описание.')}</p>
      </div>

      <div class="admin-detail-actions">
        ${d.phone ? `<a class="mini-3d-btn" href="tel:${esc(d.phone)}">Обади се</a>` : ''}
        ${d.email ? `<a class="mini-3d-btn secondary" href="mailto:${esc(d.email)}">Имейл</a>` : ''}
      </div>

      <div class="admin-thumbs-wrap">
        <b>Снимки (${photos.length}):</b>

        ${
          photos.length
          ? `<div class="admin-thumbs">
              ${photos.map((p, i) => `
                <button class="admin-thumb" data-photo-index="${i}">
                  <img src="${esc(p.url)}" alt="${esc(p.filename)}">
                  <span>${esc(p.filename)}</span>
                </button>
              `).join('')}
            </div>`
          : '<p>Няма качени снимки.</p>'
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('[data-photo-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePhotos = photos;
      activePhotoIndex = Number(btn.dataset.photoIndex || 0);
      openPhotoViewer();
    });
  });

  modal.addEventListener('click', e => {
    if(e.target.matches('[data-close-modal]') || e.target === modal){
      modal.remove();
    }
  });
}

function openPhotoViewer(){
  if(!activePhotos.length) return;

  const p = activePhotos[activePhotoIndex];

  let viewer = document.querySelector('.photo-viewer-backdrop');

  if(!viewer){
    viewer = document.createElement('div');
    viewer.className = 'photo-viewer-backdrop';
    document.body.appendChild(viewer);
  }

  viewer.innerHTML = `
    <div class="photo-viewer">
      <div class="photo-viewer-toolbar">
        <button class="mini-3d-btn" data-photo-prev>‹</button>
        <button class="mini-3d-btn" data-photo-next>›</button>
        <a class="mini-3d-btn" href="${esc(p.url)}" download target="_blank" rel="noopener">⬇</a>
        <button class="mini-3d-btn" data-photo-copy>Копирай</button>
        <button class="mini-3d-btn danger" data-photo-close>×</button>
      </div>

      <img src="${esc(p.url)}" alt="${esc(p.filename)}">

      <div class="photo-viewer-caption">
        ${esc(p.filename)} · ${activePhotoIndex + 1}/${activePhotos.length}
      </div>
    </div>
  `;

  viewer.querySelector('[data-photo-prev]').onclick = () => {
    activePhotoIndex = (activePhotoIndex - 1 + activePhotos.length) % activePhotos.length;
    openPhotoViewer();
  };

  viewer.querySelector('[data-photo-next]').onclick = () => {
    activePhotoIndex = (activePhotoIndex + 1) % activePhotos.length;
    openPhotoViewer();
  };

  viewer.querySelector('[data-photo-close]').onclick = () => {
    viewer.remove();
  };

  viewer.querySelector('[data-photo-copy]').onclick = async () => {
    try{
      await navigator.clipboard.writeText(p.url);
      viewer.querySelector('[data-photo-copy]').textContent = 'Копирано';
      setTimeout(() => openPhotoViewer(), 900);
    }catch(e){
      alert('Неуспешно копиране.');
    }
  };

  viewer.onclick = e => {
    if(e.target === viewer) viewer.remove();
  };
}

listBox.addEventListener('change', e => {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;

  if(!id) return;

  if(action === 'status'){
    saveStatus(id, e.target.value);
    renderFiltered();
  }

  if(action === 'toggle-seen'){
    saveStatus(id, e.target.checked ? 'seen' : 'new');
    renderFiltered();
  }
});

listBox.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="details"]');
  if(!btn) return;

  openDetails(btn.dataset.id);
});

loginBtn?.addEventListener('click', login);
logoutBtn?.addEventListener('click', logout);
refreshBtn?.addEventListener('click', loadSubmissions);

if(localStorage.getItem('kaa_admin_auth') === '1'){
  loginBox.classList.add('hidden');
  app.classList.remove('hidden');
  prepareMetricButtons();
  loadSubmissions();
}
