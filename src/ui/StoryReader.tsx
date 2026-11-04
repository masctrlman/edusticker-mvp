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
    const synth = window.speechSynthesis;
    synth.cancel();

    const cleanText = text.replace(/\([^)]*\)/g, "");
    const u = new SpeechSynthesisUtterance(cleanText);
    const targetLang = lang === "en" ? "en-US" : "vi-VN";
    u.lang = targetLang;
    u.rate = 0.9;
    u.pitch = 1.15;

    const pickFemaleVoice = () => {
      const voices = synth.getVoices();
      if (!voices.length) return;

      const langPrefix = lang === "en" ? "en" : "vi";
      const matchingVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));

      // Danh sách tên các giọng nữ chuẩn trên macOS/iOS, Chrome và Windows/Android
      const femaleKeywords =
        lang === "en"
          ? ["samantha", "victoria", "karen", "moira", "tessa", "ava", "allison", "susan", "zira", "aria", "jenny", "google us english", "female"]
          : ["linh", "hoaimy", "hoài my", "my", "google tiếng việt", "female", "nữ"];

      const femaleVoice =
        matchingVoices.find((v) =>
          femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
        ) || matchingVoices[0];

      if (femaleVoice) {
        u.voice = femaleVoice;
      }
      synth.speak(u);
    };

    // Đảm bảo danh sách giọng đọc của Chrome đã nạp xong trước khi phát
    if (synth.getVoices().length > 0) {
      pickFemaleVoice();
    } else {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        pickFemaleVoice();
      };
    }
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