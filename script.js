// ====== ULOŽENÍ / ZOBRAZENÍ ČÍSLA PRODEJNY ======
const storeInput = document.getElementById('store-id');
const storeSaveBtn = document.getElementById('save-store-id');
const storeMessage = document.getElementById('store-message');

const storeDisplay = document.createElement('div');
storeDisplay.style.marginTop = '5px';
storeDisplay.style.fontWeight = 'bold';
storeInput.parentNode.appendChild(storeDisplay);

const savedStore = localStorage.getItem('storeId');
if (savedStore) {
  storeDisplay.textContent = `Aktuální číslo prodejny: ${savedStore}`;
  storeInput.value = savedStore;
} else {
  storeDisplay.textContent = 'Aktuální číslo prodejny: neuvedena';
}

storeSaveBtn.addEventListener('click', () => {
  const val = storeInput.value.trim();
  if (val) {
    localStorage.setItem('storeId', val);
    storeDisplay.textContent = `Aktuální číslo prodejny: ${val}`;
    storeMessage.textContent = `Číslo prodejny "${val}" bylo uloženo.`;
    storeMessage.style.color = 'green';
  } else {
    localStorage.removeItem('storeId');
    storeDisplay.textContent = 'Aktuální číslo prodejny: neuvedena';
    storeMessage.textContent = 'Číslo prodejny bylo odstraněno.';
    storeMessage.style.color = 'orange';
  }
  setTimeout(() => { storeMessage.textContent = ''; }, 3000);
});

// ====== NAČTENÍ PRODUKTŮ ======
let productList = [];
fetch('products.json')
  .then(res => res.json())
  .then(data => { productList = data; })
  .catch(err => console.error('Chyba při načítání products.json:', err));

// ====== KATEGORIE / TABULKA ======
const container = document.getElementById('container');
container.style.display = 'none';

let currentCategory = null;

// ====== VYHLEDÁVÁNÍ ======
const searchContainer = document.getElementById('search-container');
function toggleSearch(show) {
  searchContainer.style.display = show ? 'block' : 'none';
}
toggleSearch(true);

const categoryButtons = document.querySelectorAll('.category-button');
categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.dataset.category;
    renderCategory(currentCategory);

    toggleSearch(false);
  });
});

function dataKey(category) {
  const storeId = localStorage.getItem('storeId') || 'nostore';
  return `expirace:${storeId}:${category}`;
}

function loadCategoryData(category) {
  try {
    const raw = localStorage.getItem(dataKey(category));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCategoryData(category, tbody) {
  if (!category) return;
  const rows = [...tbody.querySelectorAll('tr')].filter(r => r.dataset.empty === 'false');
  const payload = rows.map(r => ({
    kod: r.querySelector('.kod')?.value.trim() || '',
    nazev: r.querySelector('.nazev')?.value.trim() || '',
    pocet: r.querySelector('.pocet')?.value.trim() || '',
    expirace: r.querySelector('.expirace')?.value.trim() || '',
    bez: r.querySelector('.bez')?.value.trim() || '',
    s30: r.querySelector('.s30')?.value.trim() || '',
    s50: r.querySelector('.s50')?.value.trim() || '',
    zbyva: r.querySelector('.zbyva')?.value.trim() || ''
  }));
  localStorage.setItem(dataKey(category), JSON.stringify(payload));
}

function renderCategory(category) {
  container.innerHTML = '';
  container.style.display = 'block';

  const table = document.createElement('table');
  table.id = 'expirace-table';
  table.style.borderCollapse = 'separate';
  table.style.borderSpacing = '0';
  table.style.width = '100%';
  table.style.marginTop = '12px';
  table.style.border = '1px solid #ccc';
  table.style.borderRadius = '8px';

  table.innerHTML = `
    <thead>
      <tr>
        <th style="width:40px;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;border-top-left-radius:8px;"></th>
        <th style="width:100px;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;line-height:1.2em;">Kód</th>
        <th style="width:auto;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;line-height:1.2em;">Název</th>
        <th style="width:60px;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;line-height:1.2em;">Počet ks</th>
        <th style="width:100px;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;line-height:1.2em;">Expirace</th>
        <th colspan="3" style="border:1px solid #ccc;padding:2px 4px;background:#fffbe6;text-align:center;line-height:1.2em;">Prodáno</th>
        <th style="width:80px;border:1px solid #ccc;padding:2px 4px;background:#fffbe6;border-top-right-radius:8px;line-height:1.2em;">Zbývá ks</th>
      </tr>
      <tr>
        <th style="border:none;padding:0;"></th>
        <th colspan="4" style="border:none;padding:0;"></th>
        <th style="width:70px;border:1px solid #ccc;padding:2px 4px;background:#cce0ff;line-height:1.2em;">Bez slevy</th>
        <th style="width:70px;border:1px solid #ccc;padding:2px 4px;background:#ffeb99;line-height:1.2em;">30%</th>
        <th style="width:70px;border:1px solid #ccc;padding:2px 4px;background:#ffc0c0;line-height:1.2em;">50%</th>
        <th style="border:none;padding:0;"></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(table);
  const tbody = table.querySelector('tbody');

  const saved = loadCategoryData(category);
  if (saved.length) {
    saved.forEach(obj => {
      const r = createRow(tbody, false);
      r.querySelector('.kod').value = obj.kod || '';
      r.querySelector('.nazev').value = obj.nazev || '';
      r.querySelector('.pocet').value = obj.pocet || '';
      r.querySelector('.expirace').value = obj.expirace || '';
      r.querySelector('.bez').value = obj.bez || '';
      r.querySelector('.s30').value = obj.s30 || '';
      r.querySelector('.s50').value = obj.s50 || '';
      r.querySelector('.zbyva').value = obj.zbyva || '';
    });
  }

  ensureOneEmptyRow(tbody); // vytvoří nový řádek pro zápis
  sortCommittedRows(tbody);  // řadí řádky a vloží oddělovač
  saveCategoryData(category, tbody);
}

// ====== CREATE ROW ======
function createRow(tbody, isEmpty = true) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td style="border:1px solid #ccc;text-align:center;">
      <button class="delete-row" title="Smazat řádek" style="background:none;border:none;cursor:pointer;padding:0;">
        <img src="images/kos.png" alt="Smazat" style="width:16px;height:16px;">
      </button>
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="kod" type="text" style="width:100%;box-sizing:border-box;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="nazev" type="text" readonly style="width:100%;box-sizing:border-box;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="pocet" type="number" min="0" style="width:100%;box-sizing:border-box;text-align:center;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="expirace" type="date" style="width:100%;box-sizing:border-box;font-size:14px;height:32px;padding:4px;line-height:24px;text-align:center;font-family:'Arial', sans-serif;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="bez" type="number" min="0" style="width:100%;box-sizing:border-box;text-align:center;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="s30" type="number" min="0" style="width:100%;box-sizing:border-box;text-align:center;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="s50" type="number" min="0" style="width:100%;box-sizing:border-box;text-align:center;font-size:14px;height:32px;padding:4px;">
    </td>
    <td style="border:1px solid #ccc;padding:4px">
      <input class="zbyva" type="number" readonly style="width:100%;box-sizing:border-box;text-align:center;font-size:14px;height:32px;padding:4px;background:#f7f7f7;">
    </td>
  `;
  row.dataset.empty = isEmpty ? 'true' : 'false';

  const codeInput = row.querySelector('.kod');
  const nameInput = row.querySelector('.nazev');
  const qtyInput = row.querySelector('.pocet');
  const expiraceInput = row.querySelector('.expirace');
  const bezInput = row.querySelector('.bez');
  const s30Input = row.querySelector('.s30');
  const s50Input = row.querySelector('.s50');
  const zbyvaInput = row.querySelector('.zbyva');
  const delBtn = row.querySelector('.delete-row');

  function saveIfPossible() {
    if (currentCategory) saveCategoryData(currentCategory, tbody);
  }

  codeInput.addEventListener('input', () => {
    const code = codeInput.value.trim();
    if (!code) { nameInput.value = ''; saveIfPossible(); return; }
    const found = productList.find(p => p['Číslo'] === code);
    nameInput.value = found ? found['Popis'] : '';
    saveIfPossible();
  });

  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRow(row);
      ensureOneEmptyRow(tbody);
      sortCommittedRows(tbody);
      saveIfPossible();
      focusLastEmptyCode(tbody);
    }
  });

  codeInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (codeInput.value.trim() !== '') {
        commitRow(row);
        ensureOneEmptyRow(tbody);
        sortCommittedRows(tbody);
        saveIfPossible();
      }
    }, 80);
  });

  const recalc = () => {
    const total = Number(qtyInput.value) || 0;
    const sold = (Number(bezInput.value) || 0) + (Number(s30Input.value) || 0) + (Number(s50Input.value) || 0);
    const rest = total - sold;
    zbyvaInput.value = rest;
    sortCommittedRows(tbody);
    saveIfPossible();
  };
  [qtyInput, bezInput, s30Input, s50Input].forEach(inp => inp.addEventListener('input', recalc));
  [qtyInput, bezInput, s30Input, s50Input].forEach(inp => inp.addEventListener('change', recalc));
  expiraceInput.addEventListener('change', saveIfPossible);

  delBtn.addEventListener('click', () => {
    codeInput.value = '';
    nameInput.value = '';
    qtyInput.value = '';
    expiraceInput.value = '';
    bezInput.value = '';
    s30Input.value = '';
    s50Input.value = '';
    zbyvaInput.value = '';
    row.dataset.empty = 'true';
    sortCommittedRows(tbody);
    ensureOneEmptyRow(tbody);
    saveIfPossible();
    focusLastEmptyCode(tbody);
  });

  tbody.appendChild(row);
  return row;
}

function commitRow(row) {
  if (row.dataset.empty === 'false') return;
  const code = row.querySelector('.kod').value.trim();
  if (!code) return;
  row.dataset.empty = 'false';
}

// ====== NOVÉ ŘAZENÍ S ODDĚLOVACÍ ČÁROU A PRÁZDNÝM ŘÁDKEM ======
function sortCommittedRows(tbody) {
  const rows = [...tbody.querySelectorAll('tr')];
  const committed = rows.filter(r => r.dataset.empty === 'false' && (Number(r.querySelector('.zbyva').value) || 0) > 0);
  const zeros = rows.filter(r => r.dataset.empty === 'false' && (Number(r.querySelector('.zbyva').value) || 0) === 0);
  const newEntry = rows.find(r => r.dataset.newEntry === 'true');

  tbody.innerHTML = '';

  committed.forEach(r => tbody.appendChild(r));

  if (zeros.length) {
    const sepRow = document.createElement('tr');
    const sepTd = document.createElement('td');
    sepTd.colSpan = 9;
    sepTd.style.borderTop = '10px solid #ffd966';
    sepTd.style.padding = '0';
    sepTd.style.height = '5px';
    sepRow.appendChild(sepTd);
    tbody.appendChild(sepRow);
  }

  if (newEntry) tbody.appendChild(newEntry);

  zeros.forEach(r => tbody.appendChild(r));
}

function ensureOneEmptyRow(tbody) {
  const existing = [...tbody.querySelectorAll('tr')].find(r => r.dataset.newEntry === 'true');
  if (!existing) {
    const newRow = createRow(tbody, true);
    newRow.dataset.newEntry = 'true';
  }
}

function focusLastEmptyCode(tbody) {
  const rows = [...tbody.querySelectorAll('tr')];
  const lastEmpty = rows.reverse().find(r => r.dataset.empty === 'true');
  if (lastEmpty) lastEmpty.querySelector('.kod').focus();
}

