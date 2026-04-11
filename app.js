// =============================================
// KONFIGURASI - Ganti dengan URL Apps Script kamu
// =============================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzz6jImTwb8zsmLGjKFlk3EbqGvXJIvm9ON76LHGignztROKg1jqvZ8C2PTGTiMc5bL3Q/exec';

// =============================================
// LOAD DAFTAR SEKOLAH DARI ADMIN
// =============================================
async function loadSekolahOptions() {
  const select = document.getElementById('namaSekolah');
  const msg = document.getElementById('sekolahLoadingMsg');
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getSekolah`);
    const result = await res.json();
    const list = result.data || [];
    select.innerHTML = '<option value="">-- Pilih Nama Sekolah --</option>';
    if (list.length === 0) {
      select.innerHTML += '<option value="" disabled>Belum ada sekolah terdaftar</option>';
    } else {
      list.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.namaSekolah;
        opt.textContent = s.namaSekolah;
        select.appendChild(opt);
      });
    }
  } catch {
    // Demo fallback — sama dengan data demo di admin
    const demoSekolah = [
      'SMP Negeri 1 Blitar',
      'SMP Negeri 2 Blitar',
      'SMP Muhammadiyah 1',
      'SMP Negeri 15 Blitar',
    ];
    select.innerHTML = '<option value="">-- Pilih Nama Sekolah --</option>';
    demoSekolah.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    });
  } finally {
    if (msg) msg.remove();
  }
}

document.addEventListener('DOMContentLoaded', loadSekolahOptions);

// =============================================
// ANGGOTA DINAMIS
// =============================================
let anggotaCount = 1;

function addAnggota() {
  if (anggotaCount >= 4) {
    showToast('Maksimal 4 anggota', 'warning');
    return;
  }
  anggotaCount++;
  const container = document.getElementById('anggotaContainer');
  const div = document.createElement('div');
  div.className = 'anggota-item flex gap-2';
  div.innerHTML = `
    <input type="text" name="anggota[]" placeholder="Nama anggota ${anggotaCount}"
      class="input-field flex-1 rounded-xl px-4 py-3 text-sm"/>
    <button type="button" onclick="removeAnggota(this)"
      class="text-red-400 hover:text-red-300 px-3 transition-colors">
      <i class="fas fa-times"></i>
    </button>`;
  container.appendChild(div);
}

function removeAnggota(btn) {
  btn.closest('.anggota-item').remove();
  anggotaCount--;
  // Re-number placeholders
  document.querySelectorAll('#anggotaContainer .anggota-item input').forEach((inp, i) => {
    inp.placeholder = `Nama anggota ${i + 1}`;
  });
}

// =============================================
// DRAG & DROP UPLOAD
// =============================================
function setupDragDrop(zoneId, inputId, labelId, maxMB, accept) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);

  ['dragenter', 'dragover'].forEach(e => {
    zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(e => {
    zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.remove('dragover'); });
  });
  zone.addEventListener('drop', ev => {
    const file = ev.dataTransfer.files[0];
    if (file) handleFileSelect(file, input, label, maxMB, accept);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleFileSelect(input.files[0], input, label, maxMB, accept);
  });
}

function handleFileSelect(file, input, label, maxMB, accept) {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    showToast(`File terlalu besar! Maks ${maxMB}MB`, 'error');
    return;
  }
  // Transfer to input
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  label.innerHTML = `<i class="fas fa-check-circle text-green-400 mr-1"></i> ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
  label.className = 'text-green-300 text-sm';
}

setupDragDrop('screenshotZone', 'screenshotFile', 'screenshotLabel', 5, 'image/*');
setupDragDrop('posterZone', 'posterFile', 'posterLabel', 10, 'image/*,.pdf');

// =============================================
// VALIDASI
// =============================================
function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('border-red-400');
  const err = field.parentElement.querySelector('.error-msg');
  if (err) { err.textContent = msg; err.classList.remove('hidden'); }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('border-red-400');
  const err = field.parentElement.querySelector('.error-msg');
  if (err) { err.textContent = ''; err.classList.add('hidden'); }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

function validateForm() {
  let valid = true;
  const fields = ['namaSekolah', 'ketuaTim', 'kategori', 'guruPembimbing', 'noHpGuru', 'linkKarya'];
  const labels = ['Nama Sekolah', 'Ketua Tim', 'Kategori', 'Guru Pembimbing', 'No. HP Guru', 'Link URL Karya'];

  fields.forEach((f, i) => {
    const val = document.getElementById(f)?.value.trim();
    if (!val) { showFieldError(f, `${labels[i]} wajib diisi`); valid = false; }
    else clearFieldError(f);
  });

  // Anggota
  const anggotaInputs = document.querySelectorAll('#anggotaContainer input');
  const anggotaFilled = [...anggotaInputs].filter(i => i.value.trim());
  if (anggotaFilled.length === 0) {
    showError('anggotaError', 'Minimal 1 anggota wajib diisi'); valid = false;
  } else clearError('anggotaError');

  // Files
  if (!document.getElementById('screenshotFile').files[0]) {
    showError('screenshotError', 'Screenshot wajib diupload'); valid = false;
  } else clearError('screenshotError');

  if (!document.getElementById('posterFile').files[0]) {
    showError('posterError', 'Poster wajib diupload'); valid = false;
  } else clearError('posterError');

  // URL validation
  const link = document.getElementById('linkKarya')?.value.trim();
  if (link && !/^https?:\/\/.+/.test(link)) {
    showFieldError('linkKarya', 'Format URL tidak valid, harus diawali https://'); valid = false;
  }

  // Phone validation
  const phone = document.getElementById('noHpGuru')?.value.trim();
  if (phone && !/^[0-9+\-\s]{8,15}$/.test(phone)) {
    showFieldError('noHpGuru', 'Format nomor HP tidak valid'); valid = false;
  }

  return valid;
}

// =============================================
// FILE TO BASE64
// =============================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================
// SUBMIT FORM
// =============================================
document.getElementById('registrationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const overlay = document.getElementById('loadingOverlay');
  const submitBtn = document.getElementById('submitBtn');
  overlay.classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    const anggotaInputs = document.querySelectorAll('#anggotaContainer input');
    const anggota = [...anggotaInputs].map(i => i.value.trim()).filter(Boolean);

    const screenshotFile = document.getElementById('screenshotFile').files[0];
    const posterFile = document.getElementById('posterFile').files[0];

    const [screenshotB64, posterB64] = await Promise.all([
      fileToBase64(screenshotFile),
      fileToBase64(posterFile)
    ]);

    const payload = {
      action: 'register',
      namaSekolah: document.getElementById('namaSekolah').value.trim(),
      ketuaTim: document.getElementById('ketuaTim').value.trim(),
      anggota: anggota.join(', '),
      kategori: document.getElementById('kategori').value,
      guruPembimbing: document.getElementById('guruPembimbing').value.trim(),
      noHpGuru: document.getElementById('noHpGuru').value.trim(),
      linkKarya: document.getElementById('linkKarya').value.trim(),
      screenshotName: screenshotFile.name,
      screenshotData: screenshotB64,
      screenshotMime: screenshotFile.type,
      posterName: posterFile.name,
      posterData: posterB64,
      posterMime: posterFile.type,
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('successMsg').textContent =
        `Data ${payload.namaSekolah} telah tersimpan. Selamat berjuang di Lomba KKA SMP!`;
      document.getElementById('successModal').classList.remove('hidden');
      document.getElementById('registrationForm').reset();
      document.getElementById('namaSekolah').selectedIndex = 0;
      document.getElementById('screenshotLabel').innerHTML = 'Klik atau drag file screenshot (JPG/PNG, maks 5MB)';
      document.getElementById('screenshotLabel').className = 'text-white/60 text-sm';
      document.getElementById('posterLabel').innerHTML = 'Klik atau drag file poster (JPG/PNG/PDF, maks 10MB)';
      document.getElementById('posterLabel').className = 'text-white/60 text-sm';
      anggotaCount = 1;
      const container = document.getElementById('anggotaContainer');
      while (container.children.length > 1) container.lastChild.remove();
    } else {
      showToast(result.message || 'Gagal mengirim data. Coba lagi.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Terjadi kesalahan koneksi. Periksa internet kamu.', 'error');
  } finally {
    overlay.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

// =============================================
// MODAL
// =============================================
function closeModal() {
  document.getElementById('successModal').classList.add('hidden');
}

// =============================================
// TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'info') {
  const colors = { info: 'bg-blue-600', error: 'bg-red-600', warning: 'bg-yellow-600', success: 'bg-green-600' };
  const icons = { info: 'fa-info-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', success: 'fa-check-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${colors[type]} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm max-w-sm`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// =============================================
// CLEAR ERRORS ON INPUT
// =============================================
['namaSekolah','ketuaTim','kategori','guruPembimbing','noHpGuru','linkKarya'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => clearFieldError(id));
});
