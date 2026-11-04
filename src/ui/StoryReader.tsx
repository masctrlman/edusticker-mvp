import React, { useEffect } from "react";
import WiggleSticker from "./WiggleSticker";

export default function StoryReader({
  story,
  stickers,
  crops,
  lesson,
  lang
}: {
  story: string;
  stickers: any[];
  crops: string[];
  lesson?: string;
  lang: "en" | "vi";
}) {
  function speakAsTeacher(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\([^)]*\)/g, "");
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = lang === "en" ? "en-US" : "vi-VN";
    u.rate = 0.9;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  }

  useEffect(() => {
    if (story && !story.startsWith("⚠️")) {
      speakAsTeacher(story);
    }
  }, [story, lang]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          fontSize: 17,
          lineHeight: 1.7,
          whiteSpace: "pre-line"
        }}
      >
        {story}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        {stickers.map((st, idx) => (
          <WiggleSticker key={idx} src={crops[idx] || ""} name={st.name || st.name_vi || (lang === "en" ? "Sticker" : "Hình dán")} />
        ))}
      </div>
      {lesson && (
        <div style={{ background: "#f0f8ff", padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          💡 {lesson}
        </div>
      )}
      <button
        onClick={() => speakAsTeacher(story)}
        style={{ padding: "10px", borderRadius: 12, background: "#eee", color: "#000", fontWeight: 600, border: "none", cursor: "pointer" }}
      >
        {lang === "en" ? "🔊 Replay Teacher's Voice (0.9x)" : "🔊 Nghe lại giọng cô giáo (0.9x)"}
      </button>
      <button
        onClick={() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          window.location.reload();
        }}
        style={{ padding: "12px", borderRadius: 12, background: "#000", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}
      >
        {lang === "en" ? "← Snap Next Story" : "← Chụp câu chuyện tiếp theo"}
      </button>
    </div>
  );
}