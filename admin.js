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

function login(){
  if(passInput.value !== ADMIN_PASSWORD){
    msg.textContent = 'Грешна парола';
    return;
  }

  localStorage.setItem('kaa_admin_auth','1');

  loginBox.classList.add('hidden');
  app.classList.remove('hidden');

  loadDemoData();
}

function logout(){
  localStorage.removeItem('kaa_admin_auth');
  location.reload();
}

function loadDemoData(){

  statusBox.textContent =
    'Това е временен админ панел. Следваща стъпка е свързване с Netlify API.';

  const rows = JSON.parse(
    localStorage.getItem('kaa_requests_local') || '[]'
  );

  document.getElementById('metricTotal').textContent = rows.length;

  const today = new Date().toDateString();

  document.getElementById('metricToday').textContent =
    rows.filter(r => new Date(r.createdAt).toDateString() === today).length;

  document.getElementById('metricPhotos').textContent =
    rows.filter(r => (r.files || []).length).length;

  if(!rows.length){
    listBox.innerHTML = '<p>Няма локални записи.</p>';
    return;
  }

  listBox.innerHTML = rows.map(r => `
    <div class="admin-card">

      <h3>${esc(r.name)}</h3>

      <p>
        <b>Телефон:</b>
        ${esc(r.phone)}
      </p>

      <p>
        <b>Имейл:</b>
        ${esc(r.email)}
      </p>

      <p>
        <b>Тип:</b>
        ${esc(r.type)}
      </p>

      <p>
        <b>Локация:</b>
        ${esc(r.location)}
      </p>

      <p>
        <b>Размери:</b>
        ${esc([r.width,r.length,r.height]
          .filter(Boolean)
          .join(' x ')
        )}
      </p>

      <p>
        <b>Етап:</b>
        ${esc(r.stage)}
      </p>

      <p>
        <b>Конструкция:</b>
        ${esc(r.existing)}
      </p>

      <p>
        <b>Срок:</b>
        ${esc(r.deadline)}
      </p>

      <p>
        <b>Бюджет:</b>
        ${esc(r.budget)}
      </p>

      <p>
        <b>Предпочитан контакт:</b>
        ${esc(r.contact_method)}
      </p>

      <p>
        <b>Описание:</b><br>
        ${esc(r.message)}
      </p>

      <p>
        <b>Файлове:</b><br>
        ${esc((r.files || []).join(', '))}
      </p>

      <a class="btn mini" href="tel:${esc(r.phone)}">
        Обади се
      </a>

    </div>
  `).join('');
}

loginBtn?.addEventListener('click', login);
logoutBtn?.addEventListener('click', logout);
refreshBtn?.addEventListener('click', loadDemoData);

if(localStorage.getItem('kaa_admin_auth') === '1'){
  loginBox.classList.add('hidden');
  app.classList.remove('hidden');
  loadDemoData();
}