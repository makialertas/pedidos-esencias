let articles = [];
let currentOrder = {};
let clientData = JSON.parse(localStorage.getItem('clientData') || '{}');
let orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');

async function loadArticles() {
  try {
    const res = await fetch('/api/articles');
    articles = await res.json();
    renderArticles();
  } catch (err) {
    console.error(err);
    document.getElementById('articles-container').innerHTML = '<p class="text-red-500">Error al cargar artículos. Asegurate de que el servidor esté corriendo.</p>';
  }
}

function renderArticles() {
  const container = document.getElementById('articles-container');
  container.innerHTML = '';
  articles.forEach(art => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded-lg shadow';
    div.innerHTML = `
      <h3 class="font-bold text-lg mb-3">${art.name}</h3>
      <div class="space-y-2">
        ${art.subarticles.map(sub => `
          <div class="flex items-center justify-between">
            <span>${sub.name}</span>
            <div class="flex items-center gap-2">
              <button onclick="changeQty(${art.id}, ${sub.id}, -1)" class="w-8 h-8 bg-gray-200 rounded">-</button>
              <input type="number" min="0" value="${currentOrder[art.id]?.[sub.id] || 0}" 
                     id="qty-${art.id}-${sub.id}" 
                     onchange="setQty(${art.id}, ${sub.id}, this.value)"
                     class="qty-input border text-center p-1 rounded">
              <button onclick="changeQty(${art.id}, ${sub.id}, 1)" class="w-8 h-8 bg-gray-200 rounded">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });
  updateOrderView();
}

function changeQty(artId, subId, delta) {
  const input = document.getElementById(`qty-${artId}-${subId}`);
  let val = parseInt(input.value) || 0;
  val = Math.max(0, val + delta);
  input.value = val;
  setQty(artId, subId, val);
}

function setQty(artId, subId, value) {
  const qty = Math.max(0, parseInt(value) || 0);
  if (!currentOrder[artId]) currentOrder[artId] = {};
  if (qty === 0) {
    delete currentOrder[artId][subId];
    if (Object.keys(currentOrder[artId]).length === 0) delete currentOrder[artId];
  } else {
    currentOrder[artId][subId] = qty;
  }
  updateOrderView();
}

function updateOrderView() {
  const detailedDiv = document.getElementById('order-detailed');
  const summaryDiv = document.getElementById('order-summary');
  const btn = document.getElementById('btn-send');

  let detailedHtml = '';
  let summary = {};
  let hasItems = false;

  articles.forEach(art => {
    if (currentOrder[art.id]) {
      let artTotal = 0;
      Object.entries(currentOrder[art.id]).forEach(([subId, qty]) => {
        const sub = art.subarticles.find(s => s.id == subId);
        if (sub && qty > 0) {
          detailedHtml += `<div class="py-1 border-b">${art.name} - ${sub.name}: <strong>${qty}</strong></div>`;
          artTotal += qty;
          hasItems = true;
        }
      });
      if (artTotal > 0) {
        summary[art.name] = artTotal;
      }
    }
  });

  detailedDiv.innerHTML = detailedHtml || '<p class="text-gray-400">No hay items en el pedido</p>';
  summaryDiv.innerHTML = Object.entries(summary).map(([name, total]) => 
    `<div class="py-1">${name}: <strong>${total}</strong></div>`
  ).join('') || '<p class="text-gray-400">Sin resumen</p>';

  btn.disabled = !hasItems || !isClientDataComplete();
}

function isClientDataComplete() {
  return clientData.razonSocial && clientData.direccion && clientData.localidad && 
         clientData.provincia && clientData.codigoPostal && clientData.cuit && clientData.iva;
}

function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('[id^="tab-"]').forEach(el => {
    el.classList.remove('tab-active');
    el.classList.add('text-gray-500');
  });
  document.getElementById(`content-${tab}`).classList.remove('hidden');
  document.getElementById(`tab-${tab}`).classList.add('tab-active');
  document.getElementById(`tab-${tab}`).classList.remove('text-gray-500');

  if (tab === 'datos') loadClientForm();
  if (tab === 'historial') renderHistory();
}

function loadClientForm() {
  document.getElementById('razonSocial').value = clientData.razonSocial || '';
  document.getElementById('direccion').value = clientData.direccion || '';
  document.getElementById('localidad').value = clientData.localidad || '';
  document.getElementById('provincia').value = clientData.provincia || '';
  document.getElementById('codigoPostal').value = clientData.codigoPostal || '';
  document.getElementById('cuit').value = clientData.cuit || '';
  document.getElementById('iva').value = clientData.iva || '';
  document.getElementById('transporte').value = clientData.transporte || '';
}

document.getElementById('client-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clientData = {
    razonSocial: document.getElementById('razonSocial').value,
    direccion: document.getElementById('direccion').value,
    localidad: document.getElementById('localidad').value,
    provincia: document.getElementById('provincia').value,
    codigoPostal: document.getElementById('codigoPostal').value,
    cuit: document.getElementById('cuit').value,
    iva: document.getElementById('iva').value,
    transporte: document.getElementById('transporte').value
  };
  localStorage.setItem('clientData', JSON.stringify(clientData));
  alert('Datos guardados correctamente');
  updateOrderView();
  showTab('pedido');
});

function renderHistory() {
  const container = document.getElementById('orders-history');
  if (orderHistory.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No hay pedidos anteriores</p>';
    return;
  }
  container.innerHTML = orderHistory.slice().reverse().map(order => `
    <div class="bg-white p-4 rounded shadow">
      <div class="flex justify-between">
        <span class="font-medium">${new Date(order.date).toLocaleString('es-AR')}</span>
        <button onclick="downloadHistoryPDF(${order.id})" class="text-indigo-600 text-sm">Descargar PDF</button>
      </div>
      <div class="text-sm mt-2">${order.summaryText}</div>
    </div>
  `).join('');
}

async function generateAndSend() {
  if (!isClientDataComplete()) {
    alert('Por favor completá tus datos personales primero');
    showTab('datos');
    return;
  }

  let detailed = [];
  let summary = {};
  articles.forEach(art => {
    if (currentOrder[art.id]) {
      let total = 0;
      Object.entries(currentOrder[art.id]).forEach(([subId, qty]) => {
        const sub = art.subarticles.find(s => s.id == subId);
        if (sub && qty > 0) {
          detailed.push({ article: art.name, sub: sub.name, qty });
          total += qty;
        }
      });
      if (total > 0) summary[art.name] = total;
    }
  });

  const orderData = {
    clientData,
    items: detailed,
    summary,
    detailed
  };

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
  } catch (e) { console.error(e); }

  const pdf = await generatePDF(orderData);
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const historyItem = {
    id: Date.now(),
    date: new Date().toISOString(),
    orderData,
    summaryText: Object.entries(summary).map(([k,v]) => `${k}: ${v}`).join(' | ')
  };
  orderHistory.push(historyItem);
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));

  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = `Pedido_${clientData.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  a.click();

  const settingsRes = await fetch('/api/settings');
  const settings = await settingsRes.json();
  const waNumber = settings.whatsappNumber || '';
  
  let message = `*NUEVO PEDIDO*\n\n`;
  message += `*Cliente:* ${clientData.razonSocial}\n`;
  message += `*CUIT:* ${clientData.cuit}\n`;
  message += `*IVA:* ${clientData.iva}\n\n`;
  message += `*DETALLE:*\n`;
  detailed.forEach(item => {
    message += `- ${item.article} - ${item.sub}: ${item.qty}\n`;
  });
  message += `\n*RESUMEN:*\n`;
  Object.entries(summary).forEach(([name, total]) => {
    message += `- ${name}: ${total}\n`;
  });
  message += `\nAdjuntar el PDF descargado.`;

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');

  currentOrder = {};
  renderArticles();
  alert('PDF descargado. Se abrió WhatsApp con el mensaje. Adjuntá el PDF manualmente.');
}

async function generatePDF(orderData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text('NOTA DE PEDIDO', 105, y, { align: 'center' });
  y += 10;
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleString('es-AR')}`, 20, y);
  y += 15;

  doc.setFontSize(12);
  doc.text('DATOS DEL CLIENTE', 20, y);
  y += 8;
  doc.setFontSize(10);
  const c = orderData.clientData;
  doc.text(`Razón Social: ${c.razonSocial}`, 20, y); y += 6;
  doc.text(`Dirección: ${c.direccion}`, 20, y); y += 6;
  doc.text(`Localidad: ${c.localidad} - ${c.provincia} (CP: ${c.codigoPostal})`, 20, y); y += 6;
  doc.text(`CUIT: ${c.cuit}`, 20, y); y += 6;
  doc.text(`Condición IVA: ${c.iva}`, 20, y); y += 6;
  if (c.transporte) { doc.text(`Transporte: ${c.transporte}`, 20, y); y += 6; }
  y += 10;

  doc.setFontSize(12);
  doc.text('DETALLE DEL PEDIDO', 20, y);
  y += 8;
  doc.setFontSize(10);
  orderData.detailed.forEach(item => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`• ${item.article} - ${item.sub}: ${item.qty}`, 25, y);
    y += 6;
  });

  y += 10;
  doc.setFontSize(12);
  doc.text('RESUMEN POR ARTÍCULO', 20, y);
  y += 8;
  doc.setFontSize(10);
  Object.entries(orderData.summary).forEach(([name, total]) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`• ${name}: ${total}`, 25, y);
    y += 6;
  });

  return doc;
}

function downloadHistoryPDF(id) {
  const order = orderHistory.find(o => o.id === id);
  if (order) {
    generatePDF(order.orderData).then(doc => {
      doc.save(`Pedido_${id}.pdf`);
    });
  }
}

loadArticles();
