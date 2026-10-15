/* Hasil, pembahasan, dan riwayat latihan. */
const Results = {
  lastReview: null,

  show(mode, sectionResults, bundles, allAnswers) {
    const total = Math.round(sectionResults.reduce((s, r) => s + r.scaled, 0) / sectionResults.length * 10);
    document.getElementById("result-total").textContent = total;
    document.getElementById("result-date").textContent =
      new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }) + " · " +
      (mode === "full" ? "Simulasi penuh" : "Latihan per section");

    const wrap = document.getElementById("result-sections");
    wrap.innerHTML = sectionResults.map(r => `
      <div class="score-card">
        <h3>${r.title}</h3>
        <div class="big">${r.scaled}</div>
        <div class="sub">${r.correct} benar dari ${r.total} soal</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${r.pct}%"></div></div>
        <div class="sub">${r.pct}% jawaban benar</div>
      </div>`).join("");

    this.saveHistory(mode, total, sectionResults);
    this.lastReview = { bundles, allAnswers, mode };
    App.showView("view-result");
    lucide.createIcons();

    document.getElementById("btn-review").onclick = () => this.showReview("all");
    document.getElementById("btn-retry").onclick = () => Quiz.start(mode);
  },

  saveHistory(mode, total, sectionResults) {
    try {
      const key = "toefl_itp_history";
      const hist = JSON.parse(localStorage.getItem(key) || "[]");
      hist.unshift({
        date: new Date().toISOString(),
        mode: mode === "full" ? "Simulasi penuh" : sectionResults[0].title,
        total,
        sections: sectionResults.map(r => ({ title: r.title, correct: r.correct, total: r.total, scaled: r.scaled }))
      });
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 50)));
    } catch (e) { /* abaikan jika storage penuh */ }
  },

  showReview(filter) {
    const { bundles, allAnswers } = this.lastReview;
    App.showView("view-review");
    document.querySelectorAll(".filter-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.filter === filter);
      b.onclick = () => this.showReview(b.dataset.filter);
    });

    const list = document.getElementById("review-list");
    let html = "";
    for (const key of Object.keys(bundles)) {
      const bundle = bundles[key];
      const answers = allAnswers[key] || {};
      html += `<h3 class="section-title" style="margin-top:18px">${bundle.meta.title}</h3>`;
      for (const q of bundle.questions) {
        const user = answers[q.id];
        const isRight = user !== undefined && user === q.answer;
        if (filter === "wrong" && isRight) continue;
        html += this.reviewCard(q, user, isRight);
      }
    }
    list.innerHTML = html || `<div class="empty-state"><i data-lucide="party-popper"></i><p>Semua jawaban benar. Kerja bagus!</p></div>`;
    lucide.createIcons();
  },

  reviewCard(q, user, isRight) {
    const letters = ["A", "B", "C", "D"];
    const badge = user === undefined
      ? `<span class="badge badge-unanswered">Tidak dijawab</span>`
      : isRight ? `<span class="badge badge-right">Benar</span>` : `<span class="badge badge-wrong">Salah</span>`;

    let contextHTML = "";
    if (q.kind === "reading") {
      contextHTML = `<div class="context-block passage"><h4>${Quiz.esc(q.passageTitle)}</h4>${q.passageText.split(/\n\n+/).map(p => `<p>${Quiz.esc(p)}</p>`).join("")}</div>`;
    } else if (q.kind === "listening") {
      contextHTML = `<div class="context-block transcript">${q.script.map(l => `<p><span class="spk">${Quiz.esc(l.s)}:</span>${Quiz.esc(l.t)}</p>`).join("")}</div>`;
    } else if (q.kind === "we") {
      let sent = "";
      q.tokens.forEach((tok, i) => {
        const mi = q.marks.indexOf(i);
        sent += mi >= 0 ? `<u>${Quiz.esc(tok)}</u><span class="we-label">${letters[mi]}</span>` : Quiz.esc(tok);
      });
      contextHTML = `<div class="context-block"><div class="we-sentence">${sent}</div></div>`;
    }

    let opts = "";
    if (q.kind === "we") {
      opts = letters.map((lab, i) => {
        let cls = "option";
        if (lab === q.answer) cls += " correct";
        else if (user === lab) cls += " wrong";
        return `<div class="${cls}"><span class="opt-key">${lab}</span><span>${Quiz.esc(q.tokens[q.marks[i]])}</span></div>`;
      }).join("");
    } else {
      opts = q.options.map((opt, i) => {
        let cls = "option";
        if (i === q.answer) cls += " correct";
        else if (user === i) cls += " wrong";
        return `<div class="${cls}"><span class="opt-key">${letters[i]}</span><span>${Quiz.esc(opt)}</span></div>`;
      }).join("");
    }

    const yourAnswer = q.kind === "we"
      ? (user === undefined ? "—" : `Jawabanmu: ${user}`)
      : (user === undefined ? "—" : `Jawabanmu: ${letters[user]}`);
    const keyAnswer = q.kind === "we" ? `Kunci: ${q.answer}` : `Kunci: ${letters[q.answer]}`;

    return `
      <div class="review-card ${isRight ? "right" : "wrong"}">
        <div class="review-meta">
          <span class="qnum">Soal ${q.number}</span>
          ${badge}
          <span class="muted">${yourAnswer} · ${keyAnswer}</span>
        </div>
        ${contextHTML}
        ${q.stem ? `<div class="qstem">${Quiz.esc(q.stem)}</div>` : ""}
        <div class="options">${opts}</div>
        <div class="explanation"><strong><i data-lucide="lightbulb"></i> Pembahasan</strong>${Quiz.esc(q.explanation)}</div>
      </div>`;
  },

  showHistory() {
    App.showView("view-history");
    const list = document.getElementById("history-list");
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem("toefl_itp_history") || "[]"); } catch (e) {}
    if (!hist.length) {
      list.innerHTML = `<div class="empty-state"><i data-lucide="history"></i><p>Belum ada riwayat latihan. Mulai latihan pertamamu dari beranda.</p></div>`;
    } else {
      list.innerHTML = hist.map(h => {
        const d = new Date(h.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
        const detail = h.sections.map(s => `${s.title.split("—")[0].trim()}: ${s.correct}/${s.total}`).join(" · ");
        return `
          <div class="history-item">
            <div><div class="h-mode">${Quiz.esc(h.mode)}</div><div class="h-date">${d}</div>
            <div class="h-date">${Quiz.esc(detail)}</div></div>
            <div class="h-score">${h.total}</div>
          </div>`;
      }).join("");
    }
    lucide.createIcons();
  }
};
