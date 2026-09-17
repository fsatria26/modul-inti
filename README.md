# Data Processing Tool — Next.js Starter

Starter project untuk:

1. TXT → Table / JSON
2. JSON → TXT
3. PDF Upload + Preview

## Requirements

- Node.js 20+ direkomendasikan
- npm / pnpm

## Install

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Modul

### TXT → Table / JSON

Route:

```text
/txt-to-json
```

Fitur:
- upload TXT
- separator configurable, default `|`
- TXT dengan header atau tanpa header
- validasi jumlah kolom
- editable table
- tambah/hapus/edit row
- export JSON
- export TXT

Contoh:

```text
001|Budi|Teknik Informatika|Aktif
002|Siti|Sistem Informasi|Aktif
```

Jika header aktif, baris pertama dianggap nama field:

```text
nim|nama|prodi|status
001|Budi|Teknik Informatika|Aktif
```

### JSON → TXT

Route:

```text
/json-to-txt
```

Input harus berupa array object:

```json
[
  {
    "nim": "001",
    "nama": "Budi",
    "prodi": "Teknik Informatika"
  }
]
```

Output:

```text
nim|nama|prodi
001|Budi|Teknik Informatika
```

### PDF Preview

Route:

```text
/pdf-preview
```

PDF dirender dengan React-PDF/PDF.js di browser.

## Struktur

```text
src/
├── app/
│   ├── page.tsx
│   ├── txt-to-json/page.tsx
│   ├── json-to-txt/page.tsx
│   ├── pdf-preview/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── FileDropzone.tsx
│   ├── DataTableEditor.tsx
│   └── PdfViewer.tsx
└── lib/
    └── txt-parser.ts
```

## Catatan

Versi starter ini sengaja memproses file di browser sehingga belum membutuhkan database atau backend API.

Untuk file TXT sangat besar, tambahkan server-side streaming/parser agar browser tidak perlu memuat seluruh file sekaligus.

## Pengembangan berikutnya

Direkomendasikan menambahkan:

- drag & drop
- pagination tabel
- pencarian/filter
- column mapping
- duplicate detection
- validasi tipe data
- preview raw TXT
- upload ke server
- database
- user authentication
- history proses
- audit log
- ukuran file maksimum
- background job untuk file besar
