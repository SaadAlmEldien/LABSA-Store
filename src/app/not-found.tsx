import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#FDFBF7] text-[#30302E] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center bg-white border border-[#E9D7BF] rounded-2xl p-8 shadow-sm">
          <p className="text-xs font-mono font-bold text-[#808060] uppercase tracking-wider mb-2">
            404 • LABSA | لَبسة
          </p>
          <h1 className="text-2xl font-bold text-[#30302E] mb-3">
            الصفحة غير موجودة • Page Not Found
          </h1>
          <p className="text-sm text-[#5B5B58] mb-6 leading-relaxed">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            <br />
            The page you are looking for does not exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ar"
              className="inline-flex justify-center items-center px-5 py-2.5 bg-[#C8784C] text-white text-sm font-semibold rounded-xl hover:bg-[#a65d35] transition"
            >
              الرئيسية (العربية)
            </Link>
            <Link
              href="/en"
              className="inline-flex justify-center items-center px-5 py-2.5 bg-[#30302E] text-white text-sm font-semibold rounded-xl hover:bg-[#808060] transition"
            >
              Home (English)
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
