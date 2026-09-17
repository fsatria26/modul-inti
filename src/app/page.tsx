import Link from "next/link";

const modules = [
  {
    href: "/txt-to-json",
    icon: "📄",
    title: "TXT → Table / JSON",
    category: "Data Processing",
    desc: "Upload file TXT dengan separator pilihan, parsing menjadi tabel data yang dapat diedit, kemudian export sebagai JSON atau TXT.",
  },
  {
    href: "/json-to-txt",
    icon: "🔄",
    title: "JSON → TXT",
    category: "Data Processing",
    desc: "Upload JSON array of objects, validasi struktur, tentukan separator dan header, lalu download hasilnya sebagai file TXT.",
  },
  {
    href: "/pdf-preview",
    icon: "📕",
    title: "PDF Preview",
    category: "Document",
    desc: "Upload file PDF dan tampilkan preview langsung di browser dengan navigasi halaman dan kontrol zoom.",
  },
];

const categoryColor: Record<string, string> = {
  "Data Processing": "bg-blue-50 text-blue-700",
  Document: "bg-amber-50 text-amber-700",
};

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-5 py-10 pb-20">
      {/* Hero */}
      <section className="py-8 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Data Processing Tool</h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
          Platform utility modular untuk pemrosesan file TXT, JSON, dan PDF secara cepat dan terstruktur —
          langsung di browser tanpa perlu instalasi tambahan.
        </p>
      </section>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => (
          <article
            key={m.href}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="text-4xl mb-3">{m.icon}</div>
            <span
              className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mb-2 w-fit ${categoryColor[m.category] ?? "bg-gray-100 text-gray-600"}`}
            >
              {m.category}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{m.title}</h2>
            <p className="text-gray-500 leading-relaxed text-sm flex-1 mb-4">{m.desc}</p>
            <Link
              href={m.href}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              Buka Modul
            </Link>
          </article>
        ))}
      </div>

      {/* Info panel */}
      <section className="mt-8 bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 mb-2">Tentang Aplikasi</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Semua pemrosesan dilakukan <strong className="text-gray-700">langsung di browser</strong> (client-side) —
          file Anda tidak pernah dikirim ke server. Aplikasi dirancang secara modular sehingga modul baru
          dapat ditambahkan tanpa mengubah struktur utama.
        </p>
      </section>
    </main>
  );
}