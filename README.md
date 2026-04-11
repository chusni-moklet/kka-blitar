# KKA Blitar - Sistem Pendaftaran Lomba SMP

## Struktur File

```
├── index.html          → Form pendaftaran publik
├── app.js              → Logic form pendaftaran
├── admin/
│   ├── index.html      → Dashboard admin
│   └── admin.js        → Logic dashboard admin
└── google-apps-script/
    └── Code.gs         → Backend Google Apps Script
```

## Cara Setup

### 1. Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru
2. Salin **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

### 2. Buat Google Drive Folder
1. Buka [Google Drive](https://drive.google.com) → buat folder baru (misal: "KKA Blitar Files")
2. Salin **Folder ID** dari URL:
   `https://drive.google.com/drive/folders/**FOLDER_ID**`

### 3. Deploy Google Apps Script
1. Buka [script.google.com](https://script.google.com) → New Project
2. Paste isi `google-apps-script/Code.gs`
3. Ganti:
   - `YOUR_SPREADSHEET_ID` → ID spreadsheet kamu
   - `YOUR_DRIVE_FOLDER_ID` → ID folder Drive kamu
4. Klik **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin **Web App URL** yang dihasilkan

### 4. Update URL di Frontend
Ganti `YOUR_SCRIPT_ID` di dua file:
- `app.js` baris 3
- `admin/admin.js` baris 3

Dengan URL dari langkah 3.

### 5. Deploy ke Vercel / Hosting
Upload semua file ke Vercel, Netlify, atau hosting statis lainnya.

## Akun Admin
- Email: `kka-blitar@gmail.com`
- Password: `chandra87`

## Fitur
- Form pendaftaran dengan upload screenshot & poster ke Google Drive
- Data tersimpan otomatis ke Google Spreadsheet
- Dashboard admin dengan statistik, tabel peserta, data sekolah
- Tambah/hapus data sekolah dari dashboard
- Export data peserta ke CSV
- Filter & pencarian data
- Responsive design
