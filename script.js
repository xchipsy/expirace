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
container.style.display = 'none'; // na titulce nic

let currentCategory = null;

// ====== VYHLEDÁVÁNÍ ======
const searchContainer = document.getElementById('search-container');
function toggleSearch(show) {
  searchContainer.style.display = show ? 'block' : 'none';
}
// Na startu: zobrazit (jsme na titulní stránce)
toggleSearch(true);

const categoryButtons = document.querySelectorAll('.category-button');
categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // podbarvení aktivní kategorie
    categoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.dataset.category;
    renderCategory(currentCategory);

    // po kliknutí na kategorii vyhledávání pryč
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

  // naplnění z localStorage
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
      // přepočet barvy
      const remaining = Number(r.querySelector('.zbyva').value) || 0;
      r.style.backgroundColor = remaining === 0 ? '#e0e0e0' : '#fff';
    });
    sortCommittedRows(tbody);
  }

  ensureOneEmptyRow(tbody);
  saveCategoryData(category, tbody);
}

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

  // doplnění názvu podle kódu
  codeInput.addEventListener('input', () => {
    const code = codeInput.value.trim();
    if (!code) { nameInput.value = ''; saveIfPossible(); return; }
    const found = productList.find(p => p['Číslo'] === code);
    nameInput.value = found ? found['Popis'] : '';
    saveIfPossible();
  });

  // potvrzení řádku Enterem
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRow(row, tbody);
      ensureOneEmptyRow(tbody);
      sortCommittedRows(tbody);
      saveIfPossible();
      focusLastEmptyCode(tbody);
    }
  });

  // potvrzení po opuštění pole kód
  codeInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (codeInput.value.trim() !== '') {
        commitRow(row, tbody);
        ensureOneEmptyRow(tbody);
        sortCommittedRows(tbody);
        saveIfPossible();
      }
    }, 80);
  });

  // přepočet zbývá + uložení
  const recalc = () => {
    const total = Number(qtyInput.value) || 0;
    const sold = (Number(bezInput.value) || 0) + (Number(s30Input.value) || 0) + (Number(s50Input.value) || 0);
    const rest = total - sold;
    zbyvaInput.value = rest;
    row.style.backgroundColor = rest === 0 ? '#e0e0e0' : '#fff';
    saveIfPossible();
  };

  [qtyInput, bezInput, s30Input, s50Input].forEach(inp => {
    inp.addEventListener('input', recalc);
    inp.addEventListener('change', recalc);
  });

  // *** NOVÉ: uložení při změně expirace ***
  expiraceInput.addEventListener('change', saveIfPossible);

  // koš – vyčistí řádek
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
    row.style.backgroundColor = '#fff';
    sortCommittedRows(tbody);
    ensureOneEmptyRow(tbody);
    saveIfPossible();
    focusLastEmptyCode(tbody);
  });

  tbody.appendChild(row);
  return row;
}

function commitRow(row, tbody) {
  if (row.dataset.empty === 'false') return;
  const code = row.querySelector('.kod').value.trim();
  if (!code) return;
  row.dataset.empty = 'false';
}

function ensureOneEmptyRow(tbody) {
  const hasEmpty = [...tbody.querySelectorAll('tr')].some(r => r.dataset.empty === 'true');
  if (!hasEmpty) {
    createRow(tbody, true);
  }
}

function focusLastEmptyCode(tbody) {
  const rows = [...tbody.querySelectorAll('tr')];
  const lastEmpty = rows.reverse().find(r => r.dataset.empty === 'true');
  if (lastEmpty) lastEmpty.querySelector('.kod').focus();
}

function sortCommittedRows(tbody) {
  const rows = [...tbody.querySelectorAll('tr')];
  const committed = rows.filter(r => r.dataset.empty === 'false');
  const empty = rows.filter(r => r.dataset.empty === 'true');

  committed.sort((a, b) => {
    const aCode = a.querySelector('.kod').value.trim();
    const bCode = b.querySelector('.kod').value.trim();
    return aCode.localeCompare(bCode, undefined, { numeric: true });
  });

  [...committed, ...empty].forEach(r => tbody.appendChild(r));

}
