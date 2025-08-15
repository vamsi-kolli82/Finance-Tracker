// ===== Utilities =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const money = (n) => {
  const val = Number(n || 0);
  return val.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
};

// ===== State =====
let expenses = []; // {id, date: 'YYYY-MM-DD', amount: number, category, notes}
let filters = { from: '', to: '', category: '', min: '', max: '', q: '' };
const LS_KEY = 'ft_expenses_v1_neon';
const THEME_KEY = 'ft_theme_v1_neon';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  $('#themeToggle').textContent = savedTheme === 'light' ? '🌙' : '☀️';

  // Data
  try {
    expenses = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch { expenses = []; }

  // Set default date in form
  $('#date').value = new Date().toISOString().slice(0, 10);

  bindEvents();
  renderAll();
});

function bindEvents() {
  // Theme toggle
  $('#themeToggle').addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, isLight ? 'dark' : 'light');
    $('#themeToggle').textContent = isLight ? '☀️' : '🌙';
    renderCharts(); // redraw for theme
  });

  // Mobile menu
  $('#menuToggle').addEventListener('click', () => {
    $('#mobileMenu').classList.toggle('open');
  });

  // Form submit
  $('#expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#expenseId').value.trim();
    const date = $('#date').value;
    const amount = Number($('#amount').value);
    const category = $('#category').value;
    const notes = $('#notes').value.trim();

    // Validation
    if (!date || !category || !(amount > 0)) {
      alert('Please enter valid date, category, and a positive amount.');
      return;
    }

    if (id) {
      // Update existing
      const idx = expenses.findIndex((x) => x.id === id);
      if (idx !== -1) {
        expenses[idx] = { ...expenses[idx], date, amount, category, notes };
      }
      $('#formTitle').textContent = 'Add Expense';
    } else {
      // Create new
      const newItem = {
        id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
        date,
        amount,
        category,
        notes,
      };
      expenses.push(newItem);
    }

    persist();
    renderAll();
    e.target.reset();
    $('#date').value = new Date().toISOString().slice(0, 10);
    $('#expenseId').value = '';
  });

  // Reset button: back to add mode
  $('#resetBtn').addEventListener('click', () => {
    $('#expenseId').value = '';
    $('#formTitle').textContent = 'Add Expense';
  });

  // Filters
  $('#applyFilters').addEventListener('click', () => {
    filters = {
      from: $('#fromDate').value,
      to: $('#toDate').value,
      category: $('#filterCategory').value,
      min: $('#minAmt').value,
      max: $('#maxAmt').value,
      q: $('#searchNotes').value.trim().toLowerCase(),
    };
    renderAll();
  });

  $('#clearFilters').addEventListener('click', () => {
    filters = { from: '', to: '', category: '', min: '', max: '', q: '' };
    $('#fromDate').value = '';
    $('#toDate').value = '';
    $('#filterCategory').value = '';
    $('#minAmt').value = '';
    $('#maxAmt').value = '';
    $('#searchNotes').value = '';
    renderAll();
  });

  // Live search
  $('#searchNotes').addEventListener('input', (e) => {
    filters.q = e.target.value.trim().toLowerCase();
    renderAll();
  });

  // Export CSV
  $('#exportCsvBtn').addEventListener('click', () => {
    const rows = [['Date','Amount','Category','Notes']];
    getFiltered().forEach(({date, amount, category, notes}) => {
      rows.push([date, amount, category, notes || '']);
    });
    const csv = rows.map(r => r.map(cell => '\"' + String(cell).replaceAll('\"','\"\"') + '\"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(expenses));
}

// ===== Rendering =====
function renderAll() {
  renderTable();
  renderKpis();
  renderCharts();
}

function getFiltered() {
  const { from, to, category, min, max, q } = filters;
  return expenses.filter((x) => {
    if (from && x.date < from) return false;
    if (to && x.date > to) return false;
    if (category && x.category !== category) return false;
    if (min && !(x.amount >= Number(min))) return false;
    if (max && !(x.amount <= Number(max))) return false;
    if (q && !(x.notes || '').toLowerCase().includes(q)) return false;
    return true;
  }).sort((a,b) => a.date.localeCompare(b.date));
}

function renderTable() {
  const tbody = $('#expenseTbody');
  tbody.innerHTML = '';
  const data = getFiltered();

  for (const item of data) {
    const tr = document.createElement('tr');
    tr.classList.add('added');

    const tdDate = document.createElement('td');
    tdDate.textContent = item.date;

    const tdAmt = document.createElement('td');
    tdAmt.textContent = money(item.amount);

    const tdCat = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.category}`;
    badge.textContent = item.category;
    tdCat.appendChild(badge);

    const tdNotes = document.createElement('td');
    tdNotes.textContent = item.notes || '';

    const tdActions = document.createElement('td');
    tdActions.className = 'actions-col';
    const div = document.createElement('div');
    div.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn ok';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => onEdit(item.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => onDelete(item.id));

    div.append(editBtn, delBtn);
    tdActions.appendChild(div);

    tr.append(tdDate, tdAmt, tdCat, tdNotes, tdActions);
    tbody.appendChild(tr);
  }
}

function onEdit(id) {
  const item = expenses.find((x) => x.id === id);
  if (!item) return;
  $('#expenseId').value = item.id;
  $('#date').value = item.date;
  $('#amount').value = item.amount;
  $('#category').value = item.category;
  $('#notes').value = item.notes || '';
  $('#formTitle').textContent = 'Edit Expense';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onDelete(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter((x) => x.id !== id);
  persist();
  renderAll();
}

function renderKpis() {
  const data = getFiltered();
  const total = data.reduce((s, x) => s + x.amount, 0);
  const byCat = groupByCategory(data);
  const top = Object.entries(byCat).sort((a,b) => b[1]-a[1])[0];

  $('#kpiTotal').textContent = money(total);
  $('#kpiCount').textContent = String(data.length);
  $('#kpiTopCategory').textContent = top ? `${top[0]} (${money(top[1])})` : '—';
}

function groupByCategory(arr) {
  return arr.reduce((acc, x) => { acc[x.category] = (acc[x.category] || 0) + x.amount; return acc; }, {});
}

// ===== Charts (Canvas, no libs) =====
function renderCharts() {
  const pieCanvas = $('#pieChart');
  const lineCanvas = $('#lineChart');
  drawPie(pieCanvas, groupByCategory(getFiltered()));
  drawLine(lineCanvas, getFiltered());
}

function clearCanvas(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#12121a';
  ctx.fillStyle = surface;
  ctx.fillRect(0,0,w,h);
}

function drawPie(canvas, byCat) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height; clearCanvas(ctx,w,h);
  const entries = Object.entries(byCat);
  const total = entries.reduce((s, [,v]) => s + v, 0);
  if (!total) { drawEmpty(ctx, w, h, 'No data'); return; }
  const colors = { Food: '#39ff14', Travel: '#00e5ff', Bills: '#ff1744', Shopping: '#c084fc', Other: '#6366f1' };

  let start = -Math.PI / 2; // top
  const cx = w/2, cy = h/2 + 10, r = Math.min(w,h)/2 - 30;
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.9)';

  entries.forEach(([label, value]) => {
    const ang = (value/total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + ang);
    ctx.closePath();
    ctx.fillStyle = colors[label] || '#9ca3af';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // label
    const mid = start + ang/2; const lx = cx + Math.cos(mid) * (r + 16); const ly = cy + Math.sin(mid) * (r + 16);
    ctx.fillStyle = '#e6f1ff';
    ctx.font = '12px system-ui';
    const pct = Math.round((value/total)*100);
    ctx.fillText(`${label} ${pct}%`, lx - 24, ly);

    start += ang;
  });
}

function drawLine(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height; clearCanvas(ctx,w,h);
  if (!data.length) { drawEmpty(ctx, w, h, 'No data'); return; }

  // Aggregate by date
  const map = new Map();
  data.forEach(d => map.set(d.date, (map.get(d.date) || 0) + d.amount));
  const points = [...map.entries()].sort((a,b) => a[0].localeCompare(b[0]));

  const padding = 36; const innerW = w - padding*2; const innerH = h - padding*2;
  const xs = points.map((_, i) => padding + (i/(points.length-1 || 1))*innerW);
  const maxY = Math.max(...points.map(p => p[1])) || 1;
  const ys = points.map(p => padding + innerH - (p[1]/maxY)*innerH);

  // Axes & grid
  ctx.strokeStyle = 'rgba(230,241,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding); ctx.lineTo(padding, h-padding); ctx.lineTo(w-padding, h-padding);
  ctx.stroke();

  ctx.font = '12px system-ui'; ctx.fillStyle = '#93a4bf';
  for (let i=0;i<=4;i++) {
    const y = padding + (i/4)*innerH;
    const val = Math.round((maxY - (i/4)*maxY));
    ctx.fillText(val, 6, y+4);
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w-padding, y); ctx.stroke();
  }

  // Line with glow
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 12;
  ctx.beginPath();
  xs.forEach((x,i) => { const y = ys[i]; if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Points
  ctx.fillStyle = '#00e5ff';
  xs.forEach((x,i) => { const y = ys[i]; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); });

  // X labels (sparse)
  ctx.fillStyle = '#93a4bf';
  points.forEach((p,i) => {
    if (i % Math.ceil(points.length/6 || 1) === 0 || i === points.length-1) {
      ctx.fillText(p[0], xs[i]-20, h - padding + 16);
    }
  });
}

function drawEmpty(ctx, w, h, text) {
  ctx.fillStyle = '#93a4bf';
  ctx.font = '14px system-ui';
  ctx.fillText(text, w/2 - ctx.measureText(text).width/2, h/2);
}
