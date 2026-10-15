/* Router view sederhana + beranda. */
const App = {
  showView(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    window.scrollTo({ top: 0 });
  },

  init() {
    const sections = [
      { key: "listening", icon: "headphones", title: "Section 1 — Listening", desc: "Dengarkan percakapan dan ceramah, lalu jawab pertanyaannya.", stats: [["list-checks", "50 soal"], ["timer", "35 menit"]] },
      { key: "structure", icon: "pen-line", title: "Section 2 — Structure", desc: "Lengkapi kalimat dan temukan bagian kalimat yang salah.", stats: [["list-checks", "40 soal"], ["timer", "25 menit"]] },
      { key: "reading", icon: "book-open", title: "Section 3 — Reading", desc: "Baca teks akademik dan jawab pertanyaan pemahaman.", stats: [["list-checks", "50 soal"], ["timer", "55 menit"]] },
      { key: "full", icon: "layers", title: "Simulasi Penuh", desc: "Kerjakan ketiga section berurutan seperti ujian asli.", stats: [["list-checks", "140 soal"], ["timer", "115 menit"]] }
    ];
    document.getElementById("section-cards").innerHTML = sections.map(s => `
      <div class="mode-card">
        <div class="mode-icon"><i data-lucide="${s.icon}"></i></div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <div class="mode-stats">${s.stats.map(([ic, t]) => `<span><i data-lucide="${ic}"></i>${t}</span>`).join("")}</div>
        <button class="btn btn-primary" data-start="${s.key}"><i data-lucide="play"></i> Mulai</button>
      </div>`).join("");

    document.querySelectorAll("[data-start]").forEach(b => {
      b.onclick = () => Quiz.start(b.dataset.start);
    });
    document.querySelectorAll("[data-nav]").forEach(b => {
      b.onclick = () => {
        if (b.dataset.nav === "history") Results.showHistory();
        else this.showView("view-home");
      };
    });
    document.getElementById("brand-home").onclick = (e) => { e.preventDefault(); this.showView("view-home"); };
    document.getElementById("btn-full-sim").onclick = () => Quiz.start("full");

    // Quiz controls
    document.getElementById("btn-prev").onclick = () => Quiz.goto(-1);
    document.getElementById("btn-next").onclick = () => Quiz.goto(1);
    document.getElementById("btn-submit").onclick = () => Quiz.askSubmit();
    document.getElementById("btn-quit").onclick = () => Quiz.quit();
    document.getElementById("modal-cancel").onclick = () => document.getElementById("modal-backdrop").classList.add("hidden");
    document.getElementById("modal-confirm").onclick = () => Quiz.finishSection(false);
    document.getElementById("directions-toggle").onclick = () => {
      const box = document.getElementById("directions-box");
      box.classList.toggle("open");
      document.getElementById("directions-text").classList.toggle("hidden");
    };
    const palToggle = document.getElementById("btn-palette-toggle");
    if (palToggle) palToggle.onclick = () => document.getElementById("palette").classList.toggle("hidden");

    document.getElementById("btn-clear-history").onclick = () => {
      if (confirm("Hapus seluruh riwayat latihan di perangkat ini?")) {
        localStorage.removeItem("toefl_itp_history");
        Results.showHistory();
      }
    };

    lucide.createIcons();
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
