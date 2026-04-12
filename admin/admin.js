// =============================================
// KONFIGURASI
// =============================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzz6jImTwb8zsmLGjKFlk3EbqGvXJIvm9ON76LHGignztROKg1jqvZ8C2PTGTiMc5bL3Q/exec';
const ADMIN_EMAIL = 'kka-blitar@gmail.com';
const ADMIN_PASSWORD = 'chandra87';

// =============================================
// AUTH
// =============================================
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  // Trim password juga untuk handle autofill
  const passTrimmed = pass.trim();

  if (email === ADMIN_EMAIL && (pass === ADMIN_PASSWORD || passTrimmed === ADMIN_PASSWORD)) {
    sessionStorage.setItem('adminLoggedIn', '1');
    localStorage.setItem('adminLoggedIn', '1');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    loadAllData();
  } else {
    errEl.textContent = 'Email atau password salah.';
    errEl.classList.remove('hidden');
    setTimeout(() => errEl.classList.add('hidden'), 3000);
  }
}

function doLogout() {
  sessionStorage.removeItem('adminLoggedIn');
  localStorage.removeItem('adminLoggedIn');
  document.getElementById('dashboardPage').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

function togglePassword() {
  const inp = document.getElementById('loginPassword');
  const icon = document.getElementById('eyeIcon');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

// Check session on load
window.addEventListener('load', () => {
  const loggedIn = sessionStorage.getItem('adminLoggedIn') || localStorage.getItem('adminLoggedIn');
  if (loggedIn) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    loadAllData();
  }
  // Enter key on login
  document.getElementById('loginPassword')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('loginEmail')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

// =============================================
// DATA STORE
// =============================================
let allPeserta = [];
let allSekolah = [];

async function loadAllData() {
  try {
    const [pesertaRes, sekolahRes] = await Promise.all([
      fetchData('getPeserta'),
      fetchData('getSekolah')
    ]);
    allPeserta = pesertaRes.data || [];
    allSekolah = sekolahRes.data || [];
    renderDashboard();
    renderPesertaTable(allPeserta);
    renderSekolahTable(allSekolah);
  } catch (e) {
    console.error(e);
    showToast('Gagal memuat data dari server', 'error');
    // Demo data for preview
    loadDemoData();
  }
}

function loadDemoData() {
  allPeserta = [
    { id: 1, waktu: '2026-04-10 08:30', namaSekolah: 'SMP Negeri 1 Blitar', ketuaTim: 'Budi Santoso', anggota: 'Andi, Citra', kategori: 'Scratch', guruPembimbing: 'Pak Hendra', noHpGuru: '081234567890', screenshotUrl: '#', posterUrl: '#' },
    { id: 2, waktu: '2026-04-10 09:15', namaSekolah: 'SMP Negeri 2 Blitar', ketuaTim: 'Dewi Rahayu', anggota: 'Eko, Fani', kategori: 'Web', guruPembimbing: 'Bu Sari', noHpGuru: '082345678901', screenshotUrl: '#', posterUrl: '#' },
    { id: 3, waktu: '2026-04-11 10:00', namaSekolah: 'SMP Muhammadiyah 1', ketuaTim: 'Gilang Pratama', anggota: 'Hani', kategori: 'Mobile', guruPembimbing: 'Pak Joko', noHpGuru: '083456789012', screenshotUrl: '#', posterUrl: '#' },
    { id: 4, waktu: '2026-04-12 07:45', namaSekolah: 'SMP Negeri 3 Blitar', ketuaTim: 'Indah Permata', anggota: 'Joko, Kiki, Lina', kategori: 'Game', guruPembimbing: 'Bu Maya', noHpGuru: '084567890123', screenshotUrl: '#', posterUrl: '#' },
  ];
  allSekolah = [
    { id: 1, namaSekolah: 'SMP Negeri 1 Blitar', npsn: '20517001', alamat: 'Jl. Veteran No. 1', kecamatan: 'Kepanjen Kidul', kepsek: 'Drs. Ahmad Fauzi', telp: '0342-801234', email: 'smpn1blitar@gmail.com', catatan: '' },
    { id: 2, namaSekolah: 'SMP Negeri 2 Blitar', npsn: '20517002', alamat: 'Jl. Merdeka No. 5', kecamatan: 'Sananwetan', kepsek: 'Dra. Sri Wahyuni', telp: '0342-801235', email: 'smpn2blitar@gmail.com', catatan: '' },
    { id: 3, namaSekolah: 'SMP Muhammadiyah 1', npsn: '20517010', alamat: 'Jl. Sudirman No. 12', kecamatan: 'Sukorejo', kepsek: 'H. Bambang S.', telp: '0342-801240', email: 'smpmuh1blitar@gmail.com', catatan: '' },
  ];
  renderDashboard();
  renderPesertaTable(allPeserta);
  renderSekolahTable(allSekolah);
}

async function fetchData(action, payload = {}) {
  const url = `${APPS_SCRIPT_URL}?action=${action}&${new URLSearchParams(payload)}`;
  const res = await fetch(url, { redirect: 'follow' });
  return res.json();
}

function refreshData() {
  const icon = document.getElementById('refreshIcon');
  icon.classList.add('fa-spin');
  loadAllData().finally(() => setTimeout(() => icon.classList.remove('fa-spin'), 800));
}

// =============================================
// TABS
// =============================================
const tabs = ['dashboard', 'peserta', 'sekolah', 'tambah'];
const titles = {
  dashboard: ['Dashboard', 'Ringkasan data pendaftaran KKA Blitar'],
  peserta: ['Data Peserta', 'Semua peserta yang telah mendaftar'],
  sekolah: ['Data Sekolah', 'Daftar sekolah peserta KKA Blitar'],
  tambah: ['Tambah Sekolah', 'Tambahkan data sekolah baru'],
};

function showTab(tab) {
  tabs.forEach(t => {
    document.getElementById(`content-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-${t}`);
    if (t === tab) {
      btn.className = 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-blue-600 text-white';
    } else {
      btn.className = 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-slate-400 hover:bg-slate-700 hover:text-white';
    }
  });
  document.getElementById('pageTitle').textContent = titles[tab][0];
  document.getElementById('pageSubtitle').textContent = titles[tab][1];
}

// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const hariIni = allPeserta.filter(p => p.waktu && p.waktu.startsWith(today)).length;
  const sekolahUnik = [...new Set(allPeserta.map(p => p.namaSekolah))].length;

  document.getElementById('statTotal').textContent = allPeserta.length;
  document.getElementById('statSekolah').textContent = sekolahUnik;
  document.getElementById('statHariIni').textContent = hariIni;

  const recent = [...allPeserta].reverse().slice(0, 5);
  const container = document.getElementById('recentTable');
  if (recent.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-6">Belum ada pendaftaran</p>';
    return;
  }
  container.innerHTML = `
    <table class="w-full text-sm">
      <thead><tr class="text-slate-400 border-b border-slate-700">
        <th class="text-left py-3 pr-4">Waktu</th>
        <th class="text-left py-3 pr-4">Sekolah</th>
        <th class="text-left py-3 pr-4">Ketua Tim</th>
        <th class="text-left py-3">Kategori</th>
      </tr></thead>
      <tbody>
        ${recent.map(p => `
          <tr class="table-row border-b border-slate-800">
            <td class="py-3 pr-4 text-slate-400 text-xs">${p.waktu || '-'}</td>
            <td class="py-3 pr-4 text-white font-medium">${p.namaSekolah}</td>
            <td class="py-3 pr-4 text-slate-300">${p.ketuaTim}</td>
            <td class="py-3">${badgeKategori(p.kategori)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// =============================================
// PESERTA TABLE
// =============================================
function renderPesertaTable(data) {
  const container = document.getElementById('pesertaTable');
  if (data.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-8">Tidak ada data ditemukan</p>';
    return;
  }
  container.innerHTML = `
    <table class="w-full text-sm">
      <thead><tr class="text-slate-400 border-b border-slate-700">
        <th class="text-left py-3 pr-3">#</th>
        <th class="text-left py-3 pr-3">Waktu</th>
        <th class="text-left py-3 pr-3">Sekolah</th>
        <th class="text-left py-3 pr-3">Ketua Tim</th>
        <th class="text-left py-3 pr-3">Anggota</th>
        <th class="text-left py-3 pr-3">Kategori</th>
        <th class="text-left py-3 pr-3">Guru</th>
        <th class="text-left py-3">Aksi</th>
      </tr></thead>
      <tbody>
        ${data.map((p, i) => `
          <tr class="table-row border-b border-slate-800">
            <td class="py-3 pr-3 text-slate-500">${i + 1}</td>
            <td class="py-3 pr-3 text-slate-400 text-xs whitespace-nowrap">${p.waktu || '-'}</td>
            <td class="py-3 pr-3 text-white font-medium">${p.namaSekolah}</td>
            <td class="py-3 pr-3 text-slate-300">${p.ketuaTim}</td>
            <td class="py-3 pr-3 text-slate-400 text-xs max-w-[120px] truncate" title="${p.anggota}">${p.anggota}</td>
            <td class="py-3 pr-3">${badgeKategori(p.kategori)}</td>
            <td class="py-3 pr-3 text-slate-300 text-xs">${p.guruPembimbing}</td>
            <td class="py-3">
              <div class="flex gap-2">
                <button onclick='showDetail(${JSON.stringify(p)})' title="Detail" class="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                  <i class="fas fa-eye"></i>
                </button>
                ${p.screenshotUrl && p.screenshotUrl !== '#' ? `<a href="${p.screenshotUrl}" target="_blank" title="Screenshot" class="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors"><i class="fas fa-image"></i></a>` : ''}
                ${p.posterUrl && p.posterUrl !== '#' ? `<a href="${p.posterUrl}" target="_blank" title="Poster" class="text-purple-400 hover:text-purple-300 text-xs px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"><i class="fas fa-file"></i></a>` : ''}
                <button onclick="deletePeserta('${p.id}')" title="Hapus" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function filterPeserta() {
  const q = document.getElementById('searchPeserta').value.toLowerCase();
  const kat = document.getElementById('filterKategori').value;
  const filtered = allPeserta.filter(p => {
    const matchQ = !q || p.namaSekolah.toLowerCase().includes(q) || p.ketuaTim.toLowerCase().includes(q);
    const matchK = !kat || p.kategori === kat;
    return matchQ && matchK;
  });
  renderPesertaTable(filtered);
}

// =============================================
// SEKOLAH TABLE
// =============================================
function renderSekolahTable(data) {
  const container = document.getElementById('sekolahTable');
  if (data.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 py-8">Belum ada data sekolah</p>';
    return;
  }
  container.innerHTML = `
    <table class="w-full text-sm">
      <thead><tr class="text-slate-400 border-b border-slate-700">
        <th class="text-left py-3 pr-3">#</th>
        <th class="text-left py-3 pr-3">Nama Sekolah</th>
        <th class="text-left py-3 pr-3">NPSN</th>
        <th class="text-left py-3 pr-3">Kecamatan</th>
        <th class="text-left py-3 pr-3">Kepala Sekolah</th>
        <th class="text-left py-3 pr-3">Telepon</th>
        <th class="text-left py-3">Aksi</th>
      </tr></thead>
      <tbody>
        ${data.map((s, i) => `
          <tr class="table-row border-b border-slate-800">
            <td class="py-3 pr-3 text-slate-500">${i + 1}</td>
            <td class="py-3 pr-3 text-white font-medium">${s.namaSekolah}</td>
            <td class="py-3 pr-3 text-slate-400">${s.npsn || '-'}</td>
            <td class="py-3 pr-3 text-slate-300">${s.kecamatan || '-'}</td>
            <td class="py-3 pr-3 text-slate-300">${s.kepsek || '-'}</td>
            <td class="py-3 pr-3 text-slate-400">${s.telp || '-'}</td>
            <td class="py-3">
              <button onclick="deleteSekolah('${s.id}')" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function filterSekolah() {
  const q = document.getElementById('searchSekolah').value.toLowerCase();
  const filtered = allSekolah.filter(s => s.namaSekolah.toLowerCase().includes(q));
  renderSekolahTable(filtered);
}

// =============================================
// IMPORT CSV
// =============================================
let csvData = [];

function previewCSV(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) { showToast('File CSV kosong atau tidak valid', 'error'); return; }

    // Parse CSV (handle quoted commas)
    const parseRow = row => {
      const result = [];
      let cur = '', inQ = false;
      for (let c of row) {
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    csvData = lines.slice(1).map(l => {
      const vals = parseRow(l);
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = vals[i] || '');
      return obj;
    }).filter(r => Object.values(r).some(v => v));

    // Render preview
    const colMap = ['Nama Sekolah','NPSN','Alamat','Kecamatan','Kepala Sekolah','Telepon','Email','Catatan'];
    document.getElementById('csvInfo').textContent = `${csvData.length} sekolah siap diimport`;
    document.getElementById('csvHeaderRow').innerHTML = colMap.map(h => `<th class="px-3 py-2 text-left">${h}</th>`).join('');
    document.getElementById('csvBodyRows').innerHTML = csvData.slice(0, 10).map(r => `
      <tr class="table-row">
        ${colMap.map(h => `<td class="px-3 py-2 text-slate-300 whitespace-nowrap">${r[h] || r[h.toLowerCase()] || '-'}</td>`).join('')}
      </tr>`).join('') + (csvData.length > 10 ? `<tr><td colspan="8" class="px-3 py-2 text-slate-500 text-center">... dan ${csvData.length - 10} sekolah lainnya</td></tr>` : '');
    document.getElementById('csvPreview').classList.remove('hidden');
  };
  reader.readAsText(file);
}

async function importCSV() {
  if (!csvData.length) return;
  document.getElementById('loadingOverlay').classList.remove('hidden');

  const colMap = {
    'Nama Sekolah': 'namaSekolah', 'NPSN': 'npsn', 'Alamat': 'alamat',
    'Kecamatan': 'kecamatan', 'Kepala Sekolah': 'kepsek',
    'Telepon': 'telp', 'Email': 'email', 'Catatan': 'catatan'
  };

  const sekolahList = csvData
    .map(row => {
      const obj = { action: 'addSekolah' };
      for (const [csvCol, key] of Object.entries(colMap)) {
        obj[key] = row[csvCol] || row[csvCol.toLowerCase()] || '';
      }
      return obj;
    })
    .filter(s => s.namaSekolah);

  try {
    // Kirim semua sekaligus dalam satu request batch
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action: 'addSekolahBatch', data: sekolahList })
    });
    const result = await res.json();
    const sukses = result.count || sekolahList.length;
    sekolahList.forEach((s, i) => allSekolah.push({ id: Date.now() + i, ...s }));
    renderSekolahTable(allSekolah);
    showToast(`Import selesai: ${sukses} sekolah berhasil ditambahkan`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Gagal import: ' + err.message, 'error');
  } finally {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('csvPreview').classList.add('hidden');
    document.getElementById('csvFile').value = '';
    csvData = [];
  }
}

function downloadTemplateCSV() {
  const headers = 'Nama Sekolah,NPSN,Alamat,Kecamatan,Kepala Sekolah,Telepon,Email,Catatan';
  const contoh = 'SMP Negeri 1 Blitar,20517001,Jl. Veteran No. 1,Kepanjen Kidul,Drs. Ahmad Fauzi,0342-801234,smpn1@gmail.com,';
  const blob = new Blob([headers + '\n' + contoh], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'template-sekolah.csv';
  a.click();
}

// =============================================
// TAMBAH SEKOLAH (form manual)
// =============================================
document.getElementById('addSekolahForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama = document.getElementById('addNamaSekolah').value.trim();
  const errEl = document.getElementById('addSekolahError');

  if (!nama) {
    errEl.textContent = 'Nama sekolah wajib diisi';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const payload = {
    action: 'addSekolah',
    namaSekolah: nama,
    npsn: document.getElementById('addNpsn').value.trim(),
    alamat: document.getElementById('addAlamat').value.trim(),
    kecamatan: document.getElementById('addKecamatan').value.trim(),
    kepsek: document.getElementById('addKepsek').value.trim(),
    telp: document.getElementById('addTelp').value.trim(),
    email: document.getElementById('addEmail').value.trim(),
    catatan: document.getElementById('addCatatan').value.trim(),
  };

  document.getElementById('loadingOverlay').classList.remove('hidden');
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      allSekolah.push({ id: result.id || Date.now(), ...payload });
      renderSekolahTable(allSekolah);
      showToast('Sekolah berhasil ditambahkan!', 'success');
      resetAddForm();
    } else {
      showToast(result.message || 'Gagal menyimpan', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    document.getElementById('loadingOverlay').classList.add('hidden');
  }
});

function resetAddForm() {
  document.getElementById('addSekolahForm').reset();
}

async function deletePeserta(id) {
  if (!confirm('Hapus data peserta ini? Tindakan ini tidak dapat dibatalkan.')) return;
  allPeserta = allPeserta.filter(p => String(p.id) !== String(id));
  renderPesertaTable(allPeserta);
  renderDashboard();
  showToast('Data peserta dihapus', 'info');
  try {
    await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'deletePeserta', id }) });
  } catch {}
}

async function deleteSekolah(id) {
  if (!confirm('Hapus data sekolah ini?')) return;
  allSekolah = allSekolah.filter(s => String(s.id) !== String(id));
  renderSekolahTable(allSekolah);
  showToast('Sekolah dihapus', 'info');
  // Also call API
  try {
    await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'deleteSekolah', id }) });
  } catch {}
}

// =============================================
// DETAIL MODAL
// =============================================
function showDetail(p) {
  document.getElementById('detailContent').innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div><p class="text-slate-400 text-xs mb-1">Waktu Daftar</p><p class="text-white text-sm">${p.waktu || '-'}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">Kategori</p><p>${badgeKategori(p.kategori)}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">Nama Sekolah</p><p class="text-white text-sm font-medium">${p.namaSekolah}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">Ketua Tim</p><p class="text-white text-sm">${p.ketuaTim}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">Anggota</p><p class="text-white text-sm">${p.anggota}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">Guru Pembimbing</p><p class="text-white text-sm">${p.guruPembimbing}</p></div>
        <div><p class="text-slate-400 text-xs mb-1">No. HP Guru</p><p class="text-white text-sm">${p.noHpGuru}</p></div>
        <div class="col-span-2"><p class="text-slate-400 text-xs mb-1">Link Karya</p><a href="${p.linkKarya}" target="_blank" class="text-blue-400 hover:underline text-sm break-all">${p.linkKarya || '-'}</a></div>
      </div>
      <div class="flex gap-3 pt-4 border-t border-slate-700">
        ${p.screenshotUrl && p.screenshotUrl !== '#' ? `<a href="${p.screenshotUrl}" target="_blank" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm transition-colors"><i class="fas fa-image"></i> Lihat Screenshot</a>` : '<span class="text-slate-500 text-sm">Screenshot tidak tersedia</span>'}
        ${p.posterUrl && p.posterUrl !== '#' ? `<a href="${p.posterUrl}" target="_blank" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors"><i class="fas fa-file"></i> Lihat Poster</a>` : ''}
      </div>
    </div>`;
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

// =============================================
// EXPORT CSV
// =============================================
function exportCSV() {
  const headers = ['No', 'Waktu', 'Nama Sekolah', 'Ketua Tim', 'Anggota', 'Kategori', 'Guru Pembimbing', 'No HP Guru'];
  const rows = allPeserta.map((p, i) => [
    i + 1, p.waktu || '', p.namaSekolah, p.ketuaTim, p.anggota, p.kategori, p.guruPembimbing, p.noHpGuru
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `peserta-kka-blitar-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// =============================================
// BADGE
// =============================================
function badgeKategori(kat) {
  const colors = { Scratch: 'bg-orange-500/20 text-orange-300', Web: 'bg-blue-500/20 text-blue-300', Mobile: 'bg-green-500/20 text-green-300', Game: 'bg-purple-500/20 text-purple-300' };
  return `<span class="badge ${colors[kat] || 'bg-slate-500/20 text-slate-300'}">${kat || '-'}</span>`;
}

// =============================================
// TOAST
// =============================================
function showToast(msg, type = 'info') {
  const colors = { info: 'bg-blue-600', error: 'bg-red-600', warning: 'bg-yellow-600', success: 'bg-green-600' };
  const icons = { info: 'fa-info-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', success: 'fa-check-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${colors[type]} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}
