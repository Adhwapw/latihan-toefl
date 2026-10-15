/* Text-to-speech untuk soal Listening memakai Web Speech API bawaan browser.
   Mode latihan: naskah dibacakan dengan suara bahasa Inggris perangkat. */
const TTS = {
  speaking: false,
  currentKey: null,
  onEnd: null,

  supported() {
    return "speechSynthesis" in window;
  },

  speak(key, script) {
    this.stop();
    if (!this.supported()) {
      alert("Perangkat ini tidak mendukung text-to-speech. Aktifkan transkrip untuk membaca naskah.");
      return;
    }
    this.speaking = true;
    this.currentKey = key;
    const synth = window.speechSynthesis;
    let delay = 0;
    script.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line.t);
      u.lang = "en-US";
      u.rate = 0.95;
      // Variasi ringan agar W/M/N terdengar beda
      u.pitch = line.s === "W" ? 1.15 : line.s === "M" ? 0.85 : 1.0;
      if (i === script.length - 1) {
        u.onend = () => {
          if (this.currentKey === key) {
            this.speaking = false;
            this.currentKey = null;
            if (this.onEnd) this.onEnd(key);
          }
        };
      }
      // Antrekan berurutan; jeda kecil antar baris
      setTimeout(() => { if (this.currentKey === key) synth.speak(u); }, delay);
      delay += 400;
    });
  },

  stop() {
    if (this.supported()) window.speechSynthesis.cancel();
    const key = this.currentKey;
    this.speaking = false;
    this.currentKey = null;
    if (key && this.onEnd) this.onEnd(key);
  }
};
