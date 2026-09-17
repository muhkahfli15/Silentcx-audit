import React from "react";
import { LegalLayout, LegalSection } from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Kebijakan Privasi" updated="Juni 2026">
      <p className="text-slate-300">SilentCX ("kami") berkomitmen melindungi privasi klien, mystery shopper, dan pengunjung situs kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.</p>

      <LegalSection heading="1. Data yang Kami Kumpulkan">
        <p>Kami mengumpulkan data yang Anda berikan saat pendaftaran, onboarding, dan penggunaan platform, antara lain: nama, email, nomor WhatsApp, informasi perusahaan/outlet, serta data audit (jawaban kuesioner, foto bukti, dan nilai transaksi).</p>
      </LegalSection>

      <LegalSection heading="2. Cara Kami Menggunakan Data">
        <p>Data digunakan untuk menjalankan layanan audit pengalaman pelanggan, menyusun laporan, memproses penugasan mystery shopper, penagihan, serta komunikasi terkait proyek Anda. Kami tidak menjual data pribadi Anda kepada pihak ketiga.</p>
      </LegalSection>

      <LegalSection heading="3. Kerahasiaan Audit">
        <p>Seluruh temuan audit bersifat rahasia dan hanya dibagikan kepada klien terkait. Identitas mystery shopper dijaga kerahasiaannya untuk memastikan objektivitas penilaian.</p>
      </LegalSection>

      <LegalSection heading="4. Penyimpanan & Keamanan">
        <p>Data disimpan pada infrastruktur yang aman dengan kontrol akses berbasis peran. Bukti (foto/dokumen) dapat disimpan pada penyimpanan cloud terintegrasi (mis. Google Drive) sesuai konfigurasi akun Anda.</p>
      </LegalSection>

      <LegalSection heading="5. Berbagi dengan Pihak Ketiga">
        <p>Kami hanya membagikan data dengan penyedia layanan tepercaya yang mendukung operasional platform (mis. penyimpanan cloud, kalender, dan email) sepanjang diperlukan untuk memberikan layanan.</p>
      </LegalSection>

      <LegalSection heading="6. Hak Anda">
        <p>Anda berhak mengakses, memperbarui, atau meminta penghapusan data pribadi Anda. Permintaan dapat diajukan melalui kontak yang tercantum di bawah.</p>
      </LegalSection>

      <LegalSection heading="7. Perubahan Kebijakan">
        <p>Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan material akan diinformasikan melalui platform atau email.</p>
      </LegalSection>
    </LegalLayout>
  );
}
