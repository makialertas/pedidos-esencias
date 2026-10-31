let articles = [];
let tempSubarticles = [];
let editingId = null;

async function login() {
  const password = document.getElementById('admin-password').value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('admin-panel').classList.remove('hidden');
      loadAdminData();
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
  } catch (err) {
    alert('Error de conexión');
  }
}

async function loadAdminData() {
  const [artRes, setRes, ordRes] = await Promise.all([
    fetch('/api/articles'),
    fetch('/api/settings'),
    fetch('/api/orders')
  ]);
  articles = await artRes.json();
  const settings = await setRes.json();
  const orders = await ordRes.json();

  document.getElementById('whatsapp-number').value = settings.whatsappNumber || '';
  renderArticlesList();
  renderAdminOrders(orders);
}

function renderArticlesList() {
  const container = document.getElementById('articles-list');
  container.innerHTML = articles.map(art => `
    <div class="border p-3 rounded">
      <div class="flex justify-between items-start">
        <div>
          <strong>${art.name}</strong>
          <div class="text-sm text-gray-600 mt-1">
            Aromas: ${art.subarticles.map(s => s.name).join(', ') || 'Ninguno'}
          </div>
        </div>
        <div class="space-x-2">
          <button onclick="editArticle(${art.id})" class="text-blue-600 text-sm">Editar</button>
          <button onclick="deleteArticle(${art.id})" class="text-red-600 text-sm">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAdminOrders(orders) {
  const container = document.getElementById('admin-orders');
  if (orders.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No hay pedidos aún</p>';
    return;
  }
  container.innerHTML = orders.slice().reverse().map(o => `
    <div class="border-b py-2 text-sm">
      <div class="font-medium">${new Date(o.date).toLocaleString('es-AR')} - ${o.clientData.razonSocial}</div>
      <div class="text-gray-600">CUIT: ${o.clientData.cuit} | ${Object.entries(o.summary).map(([k,v])=>`${k}: ${v}`).join(', ')}</div>
    </div>
  `).join('');
}

async function saveSettings() {
  const whatsappNumber = document.getElementById('whatsapp-number').value;
  const newPassword = document.getElementById('new-password').value;
  const body = { whatsappNumber };
  if (newPassword) body.adminPassword = newPassword;
  
  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  alert('Configuración guardada');
  if (newPassword) document.getElementById('new-password').value = '';
}

function showAddArticle() {
  editingId = null;
  tempSubarticles = [];
  document.getElementById('modal-title').textContent = 'Nuevo Artículo';
  document.getElementById('article-name').value = '';
  document.getElementById('edit-article-id').value = '';
  renderTempSubs();
  document.getElementById('article-modal').classList.remove('hidden');
  document.getElementById('article-modal').classList.add('flex');
}

function editArticle(id) {
  const art = articles.find(a => a.id === id);
  if (!art) return;
  editingId = id;
  tempSubarticles = [...art.subarticles];
  document.getElementById('modal-title').textContent = 'Editar Artículo';
  document.getElementById('article-name').value = art.name;
  document.getElementById('edit-article-id').value = id;
  renderTempSubs();
  document.getElementById('article-modal').classList.remove('hidden');
  document.getElementById('article-modal').classList.add('flex');
}

function renderTempSubs() {
  const container = document.getElementById('subarticles-list');
  container.innerHTML = tempSubarticles.map((sub, idx) => `
    <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
      <span>${sub.name}</span>
      <button onclick="removeTempSub(${idx})" class="text-red-500 text-sm">✕</button>
    </div>
  `).join('');
}

function addSubarticleTemp() {
  const name = document.getElementById('new-sub-name').value.trim();
  if (name) {
    tempSubarticles.push({ id: Date.now() + Math.random(), name });
    document.getElementById('new-sub-name').value = '';
    renderTempSubs();
  }
}

function removeTempSub(idx) {
  tempSubarticles.splice(idx, 1);
  renderTempSubs();
}

async function saveArticle() {
  const name = document.getElementById('article-name').value.trim();
  if (!name) { alert('Nombre requerido'); return; }

  const payload = { name, subarticles: tempSubarticles };

  if (editingId) {
    await fetch(`/api/articles/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
  closeModal();
  loadAdminData();
}

async function deleteArticle(id) {
  if (confirm('¿Eliminar este artículo?')) {
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    loadAdminData();
  }
}

function closeModal() {
  document.getElementById('article-modal').classList.add('hidden');
  document.getElementById('article-modal').classList.remove('flex');
}

document.getElementById('admin-password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});
