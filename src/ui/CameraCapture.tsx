import React, { useRef } from "react";
import { compressImage } from "../utils/compress";

export default function CameraCapture({ onCapture, lang }: { onCapture: (b64: string) => void; lang: "en" | "vi" }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 800, 0.7);
      onCapture(compressed);
    };
    reader.readAsDataURL(file);
  }

  const t =
    lang === "en"
      ? {
          desc: "Place physical stickers on the table & snap a photo to bring them to life!",
          btn: "📸 Snap Sticker Table",
          note: "Native OS Camera Bridge • Auto-compressed 800px"
        }
      : {
          desc: "Dán sticker giấy lên bàn và chụp ảnh để biến chúng thành câu chuyện sống động!",
          btn: "📸 Chụp ảnh bàn Sticker",
          note: "Camera gốc hệ điều hành • Tự động nén 800px"
        };

  return (
    <div style={{ textAlign: "center", background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: 14, color: "#333", marginBottom: 16 }}>{t.desc}</p>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      <button
        onClick={() => inputRef.current?.click()}
        style={{ padding: "14px 24px", borderRadius: 12, background: "#000", color: "#fff", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}
      >
        {t.btn}
      </button>
      <p style={{ fontSize: 12, color: "#777", marginTop: 10 }}>{t.note}</p>
    </div>
  );
}