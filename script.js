
document.addEventListener('click',e=>{const img=e.target.closest('.gallery img'); if(img){document.querySelector('.lightbox img').src=img.src; document.querySelector('.lightbox').classList.add('open')}});
document.addEventListener('click',e=>{if(e.target.matches('.lightbox,.close')) document.querySelector('.lightbox').classList.remove('open')});
(function(){
  const hero=document.querySelector('.hero-slider');
  if(!hero) return;
  const slides=(hero.dataset.slides||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!slides.length) return;
  const active=hero.querySelector('.hero-bg.active');
  const next=hero.querySelector('.hero-bg.next');
  let i=0;
  active.style.backgroundImage=`url('${slides[0]}')`;
  if(slides.length>1) next.style.backgroundImage=`url('${slides[1]}')`;
  setInterval(()=>{
    if(slides.length<2) return;
    const ni=(i+1)%slides.length;
    next.style.backgroundImage=`url('${slides[ni]}')`;
    next.classList.add('active');
    setTimeout(()=>{
      active.style.backgroundImage=`url('${slides[ni]}')`;
      next.classList.remove('active');
      i=ni;
    },850);
  },3000);
})();
(function(){
  const params=new URLSearchParams(location.search);
  const type=params.get('type');
  if(!type) return;
  document.querySelectorAll('input[name="type"]').forEach(inp=>{
    if(inp.value.toLowerCase().includes(type.toLowerCase())) inp.checked=true;
  });
})();


// KAA request form: local copy in the visitor browser + Netlify Forms submission
(function(){
  const form=document.getElementById('requestForm');
  if(!form) return;
  form.addEventListener('submit',()=>{
    const fd=new FormData(form);
    const getAll=(name)=>fd.getAll(name).filter(Boolean).join(', ');
    const files=[...form.querySelectorAll('input[type="file"]')].flatMap(inp=>[...(inp.files||[])].map(f=>f.name));
    const item={
      id:'KAA-'+Date.now(),
      createdAt:new Date().toISOString(),
      type:getAll('type'),
      stage:fd.get('stage')||'',
      width:fd.get('width')||'',
      length:fd.get('length')||'',
      height:fd.get('height')||'',
      existing:fd.get('existing')||'',
      location:fd.get('location')||'',
      deadline:fd.get('deadline')||'',
      budget:fd.get('budget')||'',
      name:fd.get('name')||'',
      phone:fd.get('phone')||'',
      email:fd.get('email')||'',
      contact_method:fd.get('contact_method')||'',
      message:fd.get('message')||'',
      files
    };
    try{
      const key='kaa_requests_local';
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.unshift(item);
      localStorage.setItem(key,JSON.stringify(arr.slice(0,200)));
    }catch(e){}
  });
})();

// Simple local admin panel. For real submissions use Netlify Forms dashboard.
(function(){
  const app=document.getElementById('adminApp');
  if(!app) return;
  const USER='admin';
  const PASS='KAA2026';
  const key='kaa_admin_auth';
  const dataKey='kaa_requests_local';
  const fmt=(iso)=>{try{return new Date(iso).toLocaleString('bg-BG')}catch(e){return iso}};
  function getData(){try{return JSON.parse(localStorage.getItem(dataKey)||'[]')}catch(e){return []}}
  function renderLogin(){
    app.innerHTML=`<div class="admin-card admin-login"><h1>Админ панел</h1><p>Локален панел за тестови запитвания от този браузър.</p><label>Потребител<input id="admUser" autocomplete="username"></label><label>Парола<input id="admPass" type="password" autocomplete="current-password"></label><button class="btn" id="admLogin">Вход</button><p class="form-hint">Потребител: admin · Парола: KAA2026</p></div>`;
    document.getElementById('admLogin').onclick=()=>{
      if(document.getElementById('admUser').value===USER && document.getElementById('admPass').value===PASS){localStorage.setItem(key,'1');renderDash()}else alert('Грешен потребител или парола');
    };
  }
  function renderDash(){
    const rows=getData();
    const byType={}; rows.forEach(r=>(r.type||'Неуточнено').split(',').forEach(t=>{t=t.trim()||'Неуточнено'; byType[t]=(byType[t]||0)+1;}));
    const today=new Date().toDateString();
    const todayCount=rows.filter(r=>new Date(r.createdAt).toDateString()===today).length;
    app.innerHTML=`<div class="admin-head"><div><h1>Админ панел</h1><p>Запитвания, записани локално в този браузър. Истинските заявки от сайта се виждат в Netlify → Forms.</p></div><div class="mini-actions"><button class="btn secondary" id="exportCsv">CSV</button><button class="btn secondary" id="clearLocal">Изчисти локалните</button><button class="btn" id="logout">Изход</button></div></div><div class="admin-metrics"><div><b>${rows.length}</b><span>Локални запитвания</span></div><div><b>${todayCount}</b><span>Днес</span></div><div><b>${Object.keys(byType).length}</b><span>Видове проекти</span></div></div><div class="admin-card"><h2>Разпределение</h2><div class="type-list">${Object.entries(byType).map(([k,v])=>`<span>${k}: <b>${v}</b></span>`).join('')||'<span>Няма данни</span>'}</div></div><div class="admin-card"><h2>Запитвания</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Дата</th><th>Клиент</th><th>Телефон</th><th>Тип</th><th>Локация</th><th>Размери</th><th>Действие</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmt(r.createdAt)}</td><td>${esc(r.name)}<br><small>${esc(r.email||'')}</small></td><td>${esc(r.phone)}</td><td>${esc(r.type)}</td><td>${esc(r.location)}</td><td>${esc([r.width,r.length,r.height].filter(Boolean).join(' x '))}</td><td><a class="btn mini" href="tel:${esc(r.phone)}">Обади се</a></td></tr><tr class="details-row"><td colspan="7"><b>Описание:</b> ${esc(r.message||'')}<br><b>Етап:</b> ${esc(r.stage)} · <b>Конструкция:</b> ${esc(r.existing)} · <b>Срок:</b> ${esc(r.deadline)} · <b>Бюджет:</b> ${esc(r.budget)}<br><b>Файлове:</b> ${esc((r.files||[]).join(', '))}</td></tr>`).join('')||'<tr><td colspan="7">Няма локални запитвания.</td></tr>'}</tbody></table></div></div>`;
    document.getElementById('logout').onclick=()=>{localStorage.removeItem(key);renderLogin()};
    document.getElementById('clearLocal').onclick=()=>{if(confirm('Да изтрия ли локалните записи?')){localStorage.removeItem(dataKey);renderDash()}};
    document.getElementById('exportCsv').onclick=()=>exportCsv(rows);
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function exportCsv(rows){
    const headers=['createdAt','name','phone','email','type','stage','width','length','height','existing','location','deadline','budget','contact_method','message','files'];
    const csv=[headers.join(',')].concat(rows.map(r=>headers.map(h=>`"${String(Array.isArray(r[h])?r[h].join('; '):(r[h]||'')).replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='kaa-requests.csv'; a.click(); URL.revokeObjectURL(a.href);
  }
  if(localStorage.getItem(key)==='1') renderDash(); else renderLogin();
})();


// Upload widget for Netlify photo_1 ... photo_10
(function(){

  const widget = document.querySelector('.upload-widget');
  if(!widget) return;

  const picker = document.getElementById('photosInput');
  const hiddenInputs = [...widget.querySelectorAll('.upload-input')];

  const grid = document.getElementById('uploadGrid');
  const status = document.getElementById('uploadStatus');

  const max = hiddenInputs.length;

  let selected = [];
  let urls = [];

  function esc(s){
    return String(s || '').replace(/[&<>"']/g,m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[m]));
  }

  function clearUrls(){
    urls.forEach(u=>URL.revokeObjectURL(u));
    urls=[];
  }

  function syncInputs(){

    hiddenInputs.forEach(inp=>{
      const dt = new DataTransfer();
      inp.files = dt.files;
    });

    selected.forEach((file,index)=>{
      if(!hiddenInputs[index]) return;

      const dt = new DataTransfer();
      dt.items.add(file);

      hiddenInputs[index].files = dt.files;
    });
  }

  function emptySlot(slot){
    slot.classList.remove('has-file');

    slot.innerHTML = `
      <span class="slot-icon">⬇</span>
      <span>Няма избран файл</span>
    `;
  }

  function render(){

    clearUrls();

    const slots=[...grid.querySelectorAll('.upload-slot')];

    slots.forEach((slot,index)=>{

      const file=selected[index];

      if(!file){
        emptySlot(slot);
        return;
      }

      slot.classList.add('has-file');

      const safeName = esc(file.name);

      if(file.type.startsWith('image/')){

        const url=URL.createObjectURL(file);
        urls.push(url);

        slot.innerHTML=`
          <button type="button" class="remove-file" data-index="${index}">×</button>
          <img src="${url}" alt="${safeName}">
          <span class="file-name">${safeName}</span>
        `;

      }else{

        slot.innerHTML=`
          <button type="button" class="remove-file" data-index="${index}">×</button>
          <span class="pdf-preview">PDF</span>
          <span class="file-name">${safeName}</span>
        `;
      }

    });

    syncInputs();

    status.textContent = selected.length
      ? `${selected.length} избрани файла`
      : 'Няма избран файл';

    status.style.color = selected.length
      ? 'var(--accent)'
      : '#ef4444';
  }

  picker.addEventListener('change',()=>{

    const incoming=[...(picker.files || [])];

    selected = selected
      .concat(incoming)
      .slice(0,max);

    picker.value='';

    render();
  });

  grid.addEventListener('click',e=>{

    const removeBtn=e.target.closest('.remove-file');

    if(removeBtn){

      e.preventDefault();
      e.stopPropagation();

      const index=parseInt(removeBtn.dataset.index,10);

      selected.splice(index,1);

      render();

      return;
    }

    const slot=e.target.closest('.upload-slot');

    if(slot){
      picker.click();
    }

  });

  render();

})();