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
    return new Date(iso).toLocaleString('bg-BG');
  }catch(e){
    return iso || '';
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

function login(){
  if(passInput.value !== ADMIN_PASSWORD){
    msg.textContent = 'Грешна парола';
    return;
  }

  localStorage.setItem('kaa_admin_auth','1');

  loginBox.classList.add('hidden');
  app.classList.remove('hidden');

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

    const rows = json.submissions || [];

    renderMetrics(rows);
    renderSubmissions(rows);

    statusBox.textContent = rows.length
      ? `Заредени заявки: ${rows.length}`
      : 'Няма заявки.';

  }catch(err){
    statusBox.textContent = 'Грешка: ' + err.message;
    listBox.innerHTML = '';
  }
}

function renderMetrics(rows){
  const today = new Date().toDateString();

  const todayCount = rows.filter(r => {
    try{
      return new Date(r.created_at).toDateString() === today;
    }catch(e){
      return false;
    }
  }).length;

  const withPhotos = rows.filter(r => {
    const data = r.data || {};
    return getPhotos(data).length > 0;
  }).length;

  document.getElementById('metricTotal').textContent = rows.length;
  document.getElementById('metricToday').textContent = todayCount;
  document.getElementById('metricPhotos').textContent = withPhotos;
}

function renderSubmissions(rows){
  if(!rows.length){
    listBox.innerHTML = '<p>Няма подадени заявки.</p>';
    return;
  }

  listBox.innerHTML = rows.map(r => {
    const d = r.data || {};
    const photos = getPhotos(d);

    const size = [d.width, d.length, d.height]
      .filter(Boolean)
      .join(' x ');

    return `
      <div class="admin-card request-item">

        <div class="admin-head" style="margin-bottom:14px">
          <div>
            <h3>Заявка №${esc(r.number)} — ${esc(d.name || r.name || 'Без име')}</h3>
            <p>${esc(fmtDate(r.created_at))}</p>
          </div>

          <div class="mini-actions">
            ${d.phone ? `<a class="btn mini" href="tel:${esc(d.phone)}">Обади се</a>` : ''}
            ${d.email ? `<a class="btn secondary mini" href="mailto:${esc(d.email)}">Имейл</a>` : ''}
          </div>
        </div>

        <div class="admin-request-grid">
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

        <p>
          <b>Описание:</b><br>
          ${esc(d.message)}
        </p>

        ${photos.length ? `
          <div class="admin-photos">
            <b>Снимки:</b>
            <div class="admin-photo-grid">
              ${photos.map(p => `
                <a href="${esc(p.url)}" target="_blank" rel="noopener">
                  <img src="${esc(p.url)}" alt="${esc(p.filename)}">
                  <span>${esc(p.filename)}</span>
                </a>
              `).join('')}
            </div>
          </div>
        ` : '<p><b>Снимки:</b><br>Няма качени снимки.</p>'}

      </div>
    `;
  }).join('');
}

loginBtn?.addEventListener('click', login);
logoutBtn?.addEventListener('click', logout);
refreshBtn?.addEventListener('click', loadSubmissions);

if(localStorage.getItem('kaa_admin_auth') === '1'){
  loginBox.classList.add('hidden');
  app.classList.remove('hidden');
  loadSubmissions();
}
