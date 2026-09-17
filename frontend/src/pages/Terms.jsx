import React from "react";
import { LegalLayout, LegalSection } from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Syarat & Ketentuan" updated="Juni 2026">
      <p className="text-slate-300">Dengan mengakses dan menggunakan platform SilentCX, Anda menyetujui Syarat & Ketentuan berikut. Mohon baca dengan saksama sebelum menggunakan layanan kami.</p>

      <LegalSection heading="1. Definisi Layanan">
        <p>SilentCX menyediakan layanan mystery shopping, audit pengalaman pelanggan (CX), audit kepatuhan SOP, serta pelaporan berbasis bukti untuk bisnis multi-outlet.</p>
      </LegalSection>

      <LegalSection heading="2. Akun & Peran Pengguna">
        <p>Platform memiliki tiga peran: Klien, Mystery Shopper, dan Admin. Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan seluruh aktivitas yang terjadi pada akun Anda.</p>
      </LegalSection>

      <LegalSection heading="3. Paket & Pembayaran">
        <p>Harga dan cakupan setiap paket serta add-on ditampilkan pada halaman paket dan dapat berubah sewaktu-waktu. Faktur diterbitkan per proyek dan wajib dilunasi sesuai ketentuan yang berlaku.</p>
      </LegalSection>

      <LegalSection heading="4. Kewajiban Mystery Shopper">
        <p>Mystery shopper wajib menjalankan penugasan secara jujur, diskret, dan sesuai skenario, serta mengunggah bukti yang sah. Manipulasi data dapat mengakibatkan penolakan submission dan pembekuan akun.</p>
      </LegalSection>

      <LegalSection heading="5. Hasil & Laporan">
        <p>Laporan audit disusun berdasarkan observasi lapangan dan bukti yang tersedia. Rekomendasi bersifat saran profesional; keputusan implementasi sepenuhnya menjadi tanggung jawab klien.</p>
      </LegalSection>

      <LegalSection heading="6. Kekayaan Intelektual">
        <p>Seluruh metodologi, kerangka penilaian, dan materi platform merupakan milik SilentCX. Laporan yang diterbitkan menjadi milik klien terkait untuk penggunaan internal.</p>
      </LegalSection>

      <LegalSection heading="7. Batasan Tanggung Jawab">
        <p>SilentCX tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan. Layanan disediakan "sebagaimana adanya" tanpa jaminan hasil bisnis tertentu.</p>
      </LegalSection>

      <LegalSection heading="8. Perubahan Ketentuan">
        <p>Kami berhak memperbarui Syarat & Ketentuan ini. Penggunaan berkelanjutan atas platform setelah perubahan berarti Anda menyetujui ketentuan yang diperbarui.</p>
      </LegalSection>
    </LegalLayout>
  );
}
