// =============================================
// KONFIGURASI
// =============================================
// Kosongkan SPREADSHEET_ID, akan dibuat otomatis saat pertama kali dijalankan
var SPREADSHEET_ID = '';
const DRIVE_FOLDER_ID = '1OszxvQiSvtBCbcK3fkACngUx1bvvzwXZ';

const SHEET_PESERTA = 'Peserta';
const SHEET_SEKOLAH = 'Sekolah';
const CONFIG_KEY = 'SPREADSHEET_ID';

// Ambil atau buat Spreadsheet ID
function getSpreadsheetId() {
  // Cek dari PropertiesService dulu
  const saved = PropertiesService.getScriptProperties().getProperty(CONFIG_KEY);
  if (saved) return saved;

  // Buat spreadsheet baru
  const ss = SpreadsheetApp.create('Lomba KKA Blitar - Data');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty(CONFIG_KEY, id);
  Logger.log('Spreadsheet baru dibuat: ' + ss.getUrl());
  return id;
}

// =============================================
// CORS OUTPUT HELPER
// =============================================
function corsOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Jalankan fungsi ini SEKALI untuk setup awal
function setup() {
  const id = getSpreadsheetId();
  const ss = SpreadsheetApp.openById(id);
  Logger.log('✅ Spreadsheet siap: ' + ss.getUrl());
  Logger.log('📋 Spreadsheet ID: ' + id);
}

// Jalankan ini untuk reset dan buat spreadsheet baru
function resetSpreadsheet() {
  PropertiesService.getScriptProperties().deleteProperty(CONFIG_KEY);
  Logger.log('🗑️ Property lama dihapus');
  const ss = SpreadsheetApp.create('Lomba KKA Blitar - Data');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty(CONFIG_KEY, id);
  Logger.log('✅ Spreadsheet baru: ' + ss.getUrl());
  Logger.log('📋 ID: ' + id);
}

// =============================================
// doGet — untuk GET request (getSekolah, getPeserta)
// =============================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    if (action === 'getPeserta') result = getPeserta();
    else if (action === 'getSekolah') result = getSekolah();
    else result = { success: false, message: 'Action tidak dikenal' };
    return corsOutput(result);
  } catch (err) {
    return corsOutput({ success: false, message: err.toString() });
  }
}

// =============================================
// doPost — untuk POST request (register, addSekolah, dll)
// =============================================
function doPost(e) {
  try {
    // Apps Script menerima body sebagai string
    const raw = e.postData ? e.postData.contents : '';
    const data = JSON.parse(raw);
    const action = data.action;

    let result;
    if (action === 'register')              result = registerPeserta(data);
    else if (action === 'addSekolah')       result = addSekolah(data);
    else if (action === 'addSekolahBatch')  result = addSekolahBatch(data);
    else if (action === 'deleteSekolah')    result = deleteSekolah(data);
    else if (action === 'deletePeserta')    result = deletePeserta(data);
    else result = { success: false, message: 'Action tidak dikenal: ' + action };

    return corsOutput(result);
  } catch (err) {
    return corsOutput({ success: false, message: err.toString() });
  }
}

// =============================================
// REGISTER PESERTA
// =============================================
function registerPeserta(data) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  let sheet = ss.getSheetByName(SHEET_PESERTA);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PESERTA);
    const headers = ['ID','Waktu','Nama Sekolah','Ketua Tim','Anggota',
                     'Kategori','Guru Pembimbing','No HP Guru','Link Karya',
                     'URL Screenshot','URL Poster'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold')
         .setBackground('#1e3a5f')
         .setFontColor('white');
  }

  // Upload ke Drive
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const ts = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  const safe = data.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

  const ssBlob = Utilities.newBlob(
    Utilities.base64Decode(data.screenshotData),
    data.screenshotMime,
    'screenshot_' + safe + '_' + ts + '.' + data.screenshotName.split('.').pop()
  );
  const ssFile = folder.createFile(ssBlob);
  ssFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const pBlob = Utilities.newBlob(
    Utilities.base64Decode(data.posterData),
    data.posterMime,
    'poster_' + safe + '_' + ts + '.' + data.posterName.split('.').pop()
  );
  const pFile = folder.createFile(pBlob);
  pFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const id = Utilities.getUuid();
  const waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');

  sheet.appendRow([
    id, waktu, data.namaSekolah, data.ketuaTim, data.anggota,
    data.kategori, data.guruPembimbing, data.noHpGuru, data.linkKarya || '',
    ssFile.getUrl(), pFile.getUrl()
  ]);

  return { success: true, message: 'Pendaftaran berhasil', id: id };
}

// =============================================
// GET PESERTA
// =============================================
function getPeserta() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const sheet = ss.getSheetByName(SHEET_PESERTA);
  if (!sheet) return { success: true, data: [] };

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, data: [] };

  const headers = rows[0];
  const data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[headerToKey(h)] = String(row[i] || ''); });
    return obj;
  });
  return { success: true, data: data };
}

// =============================================
// ADD SEKOLAH BATCH (import CSV)
// =============================================
function addSekolahBatch(data) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  let sheet = ss.getSheetByName(SHEET_SEKOLAH);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SEKOLAH);
    const headers = ['ID','Nama Sekolah','NPSN','Alamat','Kecamatan',
                     'Kepala Sekolah','Telepon','Email','Catatan','Tanggal Ditambahkan'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold').setBackground('#1e3a5f').setFontColor('white');
  }

  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
  const rows = (data.data || []).map(function(s) {
    return [
      Utilities.getUuid(), s.namaSekolah, s.npsn || '', s.alamat || '',
      s.kecamatan || '', s.kepsek || '', s.telp || '',
      s.email || '', s.catatan || '', tanggal
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
  }

  return { success: true, count: rows.length };
}

// =============================================
// ADD SEKOLAH
// =============================================
function addSekolah(data) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  let sheet = ss.getSheetByName(SHEET_SEKOLAH);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SEKOLAH);
    const headers = ['ID','Nama Sekolah','NPSN','Alamat','Kecamatan',
                     'Kepala Sekolah','Telepon','Email','Catatan','Tanggal Ditambahkan'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold')
         .setBackground('#1e3a5f')
         .setFontColor('white');
  }

  const id = Utilities.getUuid();
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');

  sheet.appendRow([
    id, data.namaSekolah, data.npsn || '', data.alamat || '',
    data.kecamatan || '', data.kepsek || '', data.telp || '',
    data.email || '', data.catatan || '', tanggal
  ]);

  return { success: true, message: 'Sekolah berhasil ditambahkan', id: id };
}

// =============================================
// GET SEKOLAH
// =============================================
function getSekolah() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) return { success: true, data: [] };

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, data: [] };

  const headers = rows[0];
  const data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[headerToKey(h)] = String(row[i] || ''); });
    return obj;
  });
  return { success: true, data: data };
}

// =============================================
// DELETE PESERTA
// =============================================
function deletePeserta(data) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const sheet = ss.getSheetByName(SHEET_PESERTA);
  if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };

  const rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

// =============================================
// DELETE SEKOLAH
// =============================================
function deleteSekolah(data) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const sheet = ss.getSheetByName(SHEET_SEKOLAH);
  if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };

  const rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

// =============================================
// HELPER
// =============================================
function headerToKey(header) {
  var map = {
    'ID': 'id', 'Waktu': 'waktu', 'Nama Sekolah': 'namaSekolah',
    'Ketua Tim': 'ketuaTim', 'Anggota': 'anggota', 'Kategori': 'kategori',
    'Guru Pembimbing': 'guruPembimbing', 'No HP Guru': 'noHpGuru',
    'Link Karya': 'linkKarya',
    'URL Screenshot': 'screenshotUrl', 'URL Poster': 'posterUrl',
    'NPSN': 'npsn', 'Alamat': 'alamat', 'Kecamatan': 'kecamatan',
    'Kepala Sekolah': 'kepsek', 'Telepon': 'telp', 'Email': 'email',
    'Catatan': 'catatan', 'Tanggal Ditambahkan': 'tanggalDitambahkan'
  };
  return map[header] || header.toLowerCase().replace(/\s+/g, '_');
}
