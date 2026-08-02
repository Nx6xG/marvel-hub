/* Marvel Hub — Client-Interaktivität (Suche, Watchlist, Countdown, Spoiler, Widgets) */
(function () {
  "use strict";
  var PREFIX = document.documentElement.getAttribute("data-prefix") || "";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ---------- Spoiler ---------- */
  var spBtn = $("#spoilerToggle");
  var showSp = store("msa-spoilers") === 1;
  function applySp() {
    document.body.classList.toggle("show-spoilers", showSp);
    if (spBtn) {
      spBtn.classList.toggle("on", showSp);
      spBtn.setAttribute("aria-pressed", String(showSp));
      spBtn.title = "Spoiler: " + (showSp ? "sichtbar / visible" : "versteckt / hidden");
    }
  }
  if (spBtn) spBtn.addEventListener("click", function () { showSp = !showSp; store("msa-spoilers", showSp ? 1 : 0); applySp(); });
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest(".spoiler");
    if (t && !showSp) { t.classList.add("revealed"); ev.preventDefault(); }
  });
  applySp();

  /* ---------- Countdown ---------- */
  var tDoom = new Date("2026-12-16T00:00:00").getTime();
  var tSW = new Date("2027-12-17T00:00:00").getTime();
  function put(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function tick() {
    var now = Date.now();
    put("hubCd", Math.max(0, Math.floor((tDoom - now) / 864e5)));
    put("hubCdSW", Math.max(0, Math.floor((tSW - now) / 864e5)));
    put("cdSW", Math.max(0, Math.floor((tSW - now) / 864e5)));
    var diff = tDoom - now;
    var clock, days;
    if (diff <= 0) { days = "JETZT"; clock = "IM KINO"; }
    else {
      var s = Math.floor(diff / 1000);
      days = Math.floor(s / 86400);
      clock = String(Math.floor(s % 86400 / 3600)).padStart(2, "0") + " Std · " + String(Math.floor(s % 3600 / 60)).padStart(2, "0") + " Min · " + String(s % 60).padStart(2, "0") + " Sek";
    }
    put("cdDays", days); put("cdClock", clock); put("hubClock", clock);
    if (document.getElementById("cdD")) {
      var ss = Math.max(0, Math.floor(diff / 1000));
      put("cdD", Math.floor(ss / 86400));
      put("cdH", String(Math.floor(ss % 86400 / 3600)).padStart(2, "0"));
      put("cdM", String(Math.floor(ss % 3600 / 60)).padStart(2, "0"));
      put("cdS", String(ss % 60).padStart(2, "0"));
    }
    put("promoCd", Math.max(0, Math.floor((tDoom - now) / 864e5)));
  }
  if ($("#cdDays") || $("#cdD") || $("#hubCd") || $("#promoCd")) { tick(); setInterval(tick, 1000); }

  /* ---------- Watchlist ---------- */
  function watched() { return store("msa-watched") || {}; }
  function setWatched(w) { store("msa-watched", w); }
  function refreshWatch() {
    var w = watched();
    $$("[data-watch]").forEach(function (btn) {
      var id = btn.getAttribute("data-watch");
      var on = !!w[id];
      var host = btn.closest(".stop, .ewl-row");
      if (host) host.classList.toggle("watched", on);
      if (btn.classList.contains("fp-watch")) {
        btn.classList.toggle("is-watched", on);
        btn.textContent = on ? btn.getAttribute("data-t-on") : btn.getAttribute("data-t-off");
      }
    });
    // Fortschritt (Event-Seite)
    var stops = $$(".stop[data-min]");
    if (stops.length && $("#tlFill")) {
      var total = 0, done = 0, minLeft = 0, pT = 0, pD = 0;
      stops.forEach(function (s) {
        if (s.getAttribute("data-prio") === "future") return;
        total++;
        var isW = !!w[s.getAttribute("data-id")];
        if (isW) done++; else if (!s.classList.contains("dimmed")) minLeft += +s.getAttribute("data-min");
        if (s.getAttribute("data-prio") === "pflicht") { pT++; if (isW) pD++; }
      });
      $("#tlFill").style.width = Math.round(done / total * 100) + "%";
      $("#tlStats").innerHTML = "<b>" + done + " / " + total + "</b> gesehen · Pflicht <b>" + pD + " / " + pT + "</b> · Rest: <b>≈ " + fmtMin(minLeft) + "</b>";
    }
    var rows = $$(".ewl-row[data-min]");
    if (rows.length && $("#ewlFill")) {
      var t2 = 0, d2 = 0, left = 0;
      rows.forEach(function (r) {
        if (r.style.display === "none") return;
        t2++;
        if (w[r.getAttribute("data-id")]) d2++; else left += +r.getAttribute("data-min");
      });
      $("#ewlFill").style.width = (t2 ? Math.round(d2 / t2 * 100) : 0) + "%";
      $("#ewlStats").innerHTML = "<b>" + d2 + " / " + t2 + "</b> gesehen · Rest: <b>≈ " + fmtMin(left) + "</b>";
    }
  }
  function fmtMin(m) { var h = Math.floor(m / 60); return h + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); }
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-watch]");
    if (!btn) return;
    ev.preventDefault();
    var w = watched(), id = btn.getAttribute("data-watch");
    if (w[id]) delete w[id]; else w[id] = true;
    setWatched(w); refreshWatch();
  });
  refreshWatch();

  /* ---------- Saga-Timeline: Sortierung & Filter ---------- */
  var road = $("#road");
  function wireSeg(id, fn) {
    var box = document.getElementById(id);
    if (!box) return;
    box.addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      $$("button", box).forEach(function (x) { x.classList.remove("sel"); });
      b.classList.add("sel");
      fn(b.dataset);
    });
  }
  if (road) {
    var ROAD_ORIG = $$(".stop, .sep, .finale", road); // Original-Reihenfolge merken
    wireSeg("segSort", function (d) {
      if (d.sort === "release") {
        ROAD_ORIG.forEach(function (el) { el.style.display = ""; road.appendChild(el); });
        $$(".chrono-n", road).forEach(function (n) { n.hidden = true; });
      } else {
        var stops = $$(".stop", road), fin = $(".finale", road);
        $$(".sep", road).forEach(function (s) { s.style.display = "none"; });
        stops.sort(function (a, b) { return +a.getAttribute("data-chrono") - +b.getAttribute("data-chrono"); });
        stops.forEach(function (s) { road.insertBefore(s, fin); });
        $$(".chrono-n", road).forEach(function (n) { n.hidden = false; });
      }
      refreshWatch();
    });
    wireSeg("segFilter", function (d) {
      $$(".stop", road).forEach(function (s) {
        var p = s.getAttribute("data-prio");
        var pass = d.filter === "alle" || p === "future" || p === "pflicht" || (d.filter === "empfohlen" && p === "empfohlen");
        s.classList.toggle("dimmed", d.filter !== "alle" && !(p === "future" || p === "pflicht" || (d.filter === "empfohlen" && p === "empfohlen")));
        void pass;
      });
      refreshWatch();
    });
  }

  /* ---------- Event-Watchlist: Modi ---------- */
  var ewl = $("#ewlList");
  if (ewl) {
    var PR = { pflicht: 0, empfohlen: 1 };
    wireSeg("ewlMode", function (d) {
      var rows = $$(".ewl-row", ewl);
      rows.forEach(function (r) { r.style.display = d.mode === "speed" && r.getAttribute("data-prio") !== "pflicht" ? "none" : ""; });
      var key = d.mode === "chrono" ? "data-chrono" : "data-rel";
      rows.sort(function (a, b) {
        if (d.mode === "relevanz") {
          var pd = PR[a.getAttribute("data-prio")] - PR[b.getAttribute("data-prio")];
          if (pd) return pd;
        }
        return +a.getAttribute(key) - +b.getAttribute(key);
      });
      rows.forEach(function (r) { ewl.appendChild(r); });
      refreshWatch();
    });
  }

  /* ---------- Suche ---------- */
  var gsInput = $("#globalSearch"), gsDrop = $("#searchDrop"), INDEX = null;
  function gsClose() { if (gsDrop) { gsDrop.hidden = true; gsDrop.innerHTML = ""; } }
  function gsRun() {
    var q = gsInput.value.trim().toLowerCase();
    if (q.length < 2 || !INDEX) { gsClose(); return; }
    var hits = INDEX.filter(function (e) { return e.q.indexOf(q) !== -1; }).slice(0, 14);
    gsDrop.innerHTML = hits.map(function (e) {
      var th = e.i ? '<img src="' + e.i + '"' + (e.k === "c" ? ' class="sd-round"' : "") + ' alt="">' : '<div class="sd-fb">' + esc(e.t.charAt(0)) + "</div>";
      return '<a class="sd-row" href="' + PREFIX + e.u + '" style="text-decoration:none;color:inherit">' + th + "<div><div class=\"sd-t\">" + esc(e.t) + '</div><div class="sd-s">' + esc(e.s) + "</div></div></a>";
    }).join("") || '<div class="sd-empty">Nichts gefunden — nicht mal im Void.</div>';
    gsDrop.hidden = false;
  }
  if (gsInput) {
    gsInput.addEventListener("focus", function () {
      if (!INDEX) fetch("/assets/search.json").then(function (r) { return r.json(); }).then(function (d) { INDEX = d; gsRun(); });
    });
    gsInput.addEventListener("input", gsRun);
    gsInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { gsClose(); gsInput.blur(); return; }
      var rows = $$(".sd-row", gsDrop);
      if (!rows.length) return;
      var idx = rows.findIndex(function (r) { return r.classList.contains("hot"); });
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        idx = ev.key === "ArrowDown" ? Math.min(idx + 1, rows.length - 1) : Math.max(idx - 1, 0);
        rows.forEach(function (r, i) { r.classList.toggle("hot", i === idx); });
        rows[idx].scrollIntoView({ block: "nearest" });
      }
      if (ev.key === "Enter") (rows[idx > -1 ? idx : 0]).click();
    });
    document.addEventListener("click", function (ev) { if (!ev.target.closest(".nav-search")) gsClose(); });
  }

  /* ---------- Burger-Menü (mobil) ---------- */
  var burger = $("#navBurger"), navLinks = $("#navLinks");
  if (burger && navLinks) {
    burger.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = navLinks.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "✕" : "☰";
    });
    document.addEventListener("click", function (ev) {
      if (navLinks.classList.contains("open") && !ev.target.closest(".nav-inner")) {
        navLinks.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.textContent = "☰";
      }
    });
  }

  /* ---------- Nav-Untermenü: Klick-Toggle für Touch ---------- */
  var drop = $(".nav-drop"), dropBtn = $(".nav-drop-btn");
  if (dropBtn) {
    dropBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = drop.classList.toggle("open");
      dropBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest(".nav-drop")) { drop.classList.remove("open"); dropBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Wiki-/Charakter-Index: Filter ---------- */
  var wikiGrid = $("#wikiGrid");
  if (wikiGrid) {
    var params = new URLSearchParams(location.search);
    var uniMode = params.get("u") || "alle", query = (params.get("q") || "").toLowerCase(), sortMode2 = params.get("s") || "y";
    function syncUrl() {
      var p = new URLSearchParams();
      if (uniMode !== "alle") p.set("u", uniMode);
      if (query) p.set("q", query);
      if (sortMode2 !== "y") p.set("s", sortMode2);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    }
    function applyWiki() {
      $$(".wcard", wikiGrid).forEach(function (c) {
        var okUni = uniMode === "alle" || (uniMode === "serie" ? c.getAttribute("data-type") !== "Film" : c.getAttribute("data-uni") === uniMode);
        var okQ = !query || c.getAttribute("data-t").indexOf(query) !== -1;
        c.style.display = okUni && okQ ? "" : "none";
      });
      var cards = $$(".wcard", wikiGrid);
      cards.sort(function (x, y) {
        if (sortMode2 === "t") return x.getAttribute("data-t") < y.getAttribute("data-t") ? -1 : 1;
        if (sortMode2 === "r") return (+y.getAttribute("data-r") || 0) - (+x.getAttribute("data-r") || 0);
        return (+x.getAttribute("data-y") || 0) - (+y.getAttribute("data-y") || 0);
      });
      cards.forEach(function (c) { wikiGrid.appendChild(c); });
      syncUrl();
    }
    wireSeg("wikiUni", function (d) { uniMode = d.uni; applyWiki(); });
    wireSeg("wikiSort", function (d) { sortMode2 = d.sort; applyWiki(); });
    var ws = $("#wikiSearch");
    if (ws) {
      ws.value = query;
      var deb;
      ws.addEventListener("input", function () {
        clearTimeout(deb);
        deb = setTimeout(function () { query = ws.value.trim().toLowerCase(); applyWiki(); }, 120);
      });
    }
    // Chips aus URL-Zustand markieren
    ["wikiUni", "wikiSort"].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      var key = id === "wikiUni" ? uniMode : sortMode2;
      var attr = id === "wikiUni" ? "uni" : "sort";
      var hit = box.querySelector('[data-' + attr + '="' + key + '"]');
      if (hit) { $$("button", box).forEach(function (b) { b.classList.remove("sel"); }); hit.classList.add("sel"); }
    });
    if (uniMode !== "alle" || query || sortMode2 !== "y") applyWiki();
  }

  /* ---------- Lexikon: Filter ---------- */
  var lexSearch = $("#lexSearch");
  if (lexSearch) {
    var lexCat = "alle", lexQ = "";
    function applyLex() {
      $$(".lex-card").forEach(function (c) {
        var ok = (lexCat === "alle" || c.getAttribute("data-cat") === lexCat) && (!lexQ || c.getAttribute("data-t").indexOf(lexQ) !== -1);
        c.style.display = ok ? "" : "none";
      });
    }
    wireSeg("lexCat", function (d) { lexCat = d.cat; applyLex(); });
    lexSearch.addEventListener("input", function () { lexQ = lexSearch.value.trim().toLowerCase(); applyLex(); });
  }

  /* ---------- Glossar-Suche (Event) ---------- */
  var gs2 = $("#glossSearch");
  if (gs2) gs2.addEventListener("input", function () {
    var q = gs2.value.trim().toLowerCase();
    $$("#glossGrid .gloss").forEach(function (g) { g.style.display = !q || g.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none"; });
  });

  /* ---------- Chronik / Fäden: Klick pinnt ---------- */
  $$(".chron-item, .thread").forEach(function (el) {
    el.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) return;
      el.classList.toggle("pinned");
    });
  });

  /* ---------- Post-Credit-Karte ---------- */
  var map = $("#pcMap"), pcData = $("#pcLinks");
  if (map && pcData) {
    var links = JSON.parse(pcData.textContent).links;
    var pcSel = null;
    function applyHl(id) {
      map.classList.toggle("focus", !!id);
      $$("path", map).forEach(function (p) { p.classList.toggle("hl", !!id && (p.dataset.from === id || p.dataset.to === id)); });
      $$(".pcm-row", map).forEach(function (r) {
        var rid = r.dataset.id;
        var conn = !id || rid === id || links.some(function (l) { return (l.from === id && l.to === rid) || (l.to === id && l.from === rid); });
        r.classList.toggle("dim", !!id && !conn);
        r.classList.toggle("sel", rid === id);
      });
    }
    function closePanel() { var old = $(".pcm-detail", map); if (old) old.remove(); }
    function titleOf(id) { var r = $('.pcm-row[data-id="' + id + '"]', map); return r ? $(".pcm-t", r).textContent : id; }
    function select(id, scroll) {
      closePanel();
      if (pcSel === id) { pcSel = null; map.classList.remove("panel-open"); applyHl(null); return; }
      pcSel = id; map.classList.add("panel-open"); applyHl(id);
      var row = $('.pcm-row[data-id="' + id + '"]', map);
      if (!row) return;
      var out = links.filter(function (l) { return l.from === id; });
      var inn = links.filter(function (l) { return l.to === id; });
      var panel = document.createElement("div");
      panel.className = "pcm-detail";
      panel.innerHTML = '<div class="pcm-d-title">' + esc(titleOf(id)) + "</div>" +
        (inn.length ? '<div class="pcm-d-label">Kommt aus</div>' + inn.map(function (l) { return '<button class="pcm-jump" data-jump="' + l.from + '">↑ ' + esc(titleOf(l.from)) + "</button>"; }).join("") : "") +
        (out.length ? '<div class="pcm-d-label">Abspann führt zu</div>' + out.map(function (l) { return '<button class="pcm-jump" data-jump="' + l.to + '">↓ ' + esc(titleOf(l.to)) + "</button>"; }).join("") : "") +
        '<a class="pcm-open" href="' + row.dataset.url + '">Film-Dossier öffnen →</a>';
      row.insertAdjacentElement("afterend", panel);
      if (scroll) row.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    map.addEventListener("click", function (ev) {
      var jump = ev.target.closest(".pcm-jump");
      if (jump) { select(jump.dataset.jump, true); return; }
      if (ev.target.closest(".pcm-open")) return;
      var row = ev.target.closest(".pcm-row");
      if (row) select(row.dataset.id, false);
    });
    map.addEventListener("mouseover", function (ev) {
      if (pcSel) return;
      var row = ev.target.closest(".pcm-row");
      if (row) applyHl(row.dataset.id);
    });
    map.addEventListener("mouseleave", function () { if (!pcSel) applyHl(null); });
  }

  /* ---------- Zurück-Button: echte Historie statt fester Link ---------- */
  var back = $(".backlink[href]");
  if (back) back.addEventListener("click", function (ev) {
    try {
      if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) {
        ev.preventDefault();
        history.back();
      }
    } catch (e) {}
  });

  /* ---------- Trailer: Click-to-Play (YouTube lädt erst beim Klick) ---------- */
  var tc = $(".trailer-card[data-yt]");
  if (tc) {
    var playTrailer = function () {
      var key = tc.getAttribute("data-yt");
      tc.classList.add("playing");
      tc.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + key +
        '?autoplay=1&rel=0" title="Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      tc.removeAttribute("role"); tc.removeAttribute("tabindex");
    };
    tc.addEventListener("click", playTrailer, { once: true });
    tc.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); playTrailer(); } }, { once: true });
  }

  /* ---------- Event: Partikel, Sticky-Countdown ---------- */
  /* ---------- Doom-Modus (Easter Egg) ---------- */
  var evLogo = $(".ev-logo");
  if (document.body.getAttribute("data-page") === "event") {
    var QUOTES = [
      "KNIET.",
      "DOOM BITTET NICHT. DOOM BEFIEHLT.",
      "EVERY STORY LEADS TO DOOM.",
      "IHR NENNT ES EROBERUNG. DOOM NENNT ES ORDNUNG.",
      "NEW MASK. SAME TASK.",
      "GÖTTER? ES GIBT KEINE GÖTTER. NUR DOOM.",
      "RICHARDS!",
      "DOOM WIEDERHOLT SICH NICHT.",
      "ES GIBT NIEMANDEN WIE DOOM.",
      "DOOM VERGIBT NICHT. DOOM VERGISST NICHT.",
      "EIN LAND. EIN KÖNIG. KEINE FRAGEN.",
      "IHR HABT EURE HELDEN. LATVERIA HAT DOOM.",
      "PERFEKTION IST KEINE KUNST. SIE IST PFLICHT.",
      "SELBST DAS MULTIVERSUM KNIET.",
      "ALLES, WAS IHR FÜRCHTET, TRÄGT MEINEN NAMEN.",
      "MASKEN LÜGEN NICHT. GESICHTER SCHON.",
      "ZEIT IST EIN WERKZEUG. DOOM FÜHRT ES.",
      "WER DOOM KOPIERT, STIRBT ALS KOPIE.",
      "18. DEZEMBER. KEIN AUFSCHUB.",
      "BATTLEWORLD WARTET."
    ];
    var buf = "", clicks = 0, lastClick = 0;
    function doomMode() {
      if ($(".doom-flash")) return;
      var d = document.createElement("div");
      d.className = "doom-flash";
      if (!doomMode.deck || !doomMode.deck.length) doomMode.deck = QUOTES.slice().sort(function () { return Math.random() - 0.5; });
      d.innerHTML = '<div class="doom-q metal">' + doomMode.deck.pop() + "</div>";
      document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, 2600);
    }
    document.addEventListener("keydown", function (ev) {
      if (/^[a-z]$/i.test(ev.key) && !ev.target.closest("input")) {
        buf = (buf + ev.key.toLowerCase()).slice(-4);
        if (buf === "doom") { buf = ""; doomMode(); }
      }
    });
    if (evLogo) evLogo.addEventListener("click", function () {
      var now = Date.now();
      clicks = now - lastClick < 900 ? clicks + 1 : 1;
      lastClick = now;
      if (clicks >= 5) { clicks = 0; doomMode(); }
    });
  }

  var prog = $("#evProgress");
  if (prog) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - innerHeight;
        prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
        ticking = false;
      });
    }, { passive: true });
  }
  var sticky = $("#evSticky"), hero = $(".ev-hero");
  if (sticky && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      sticky.hidden = en[0].isIntersecting;
    }, { threshold: 0 }).observe(hero);
    setInterval(function () {
      var s = Math.max(0, Math.floor((tDoom - Date.now()) / 1000));
      $("#evStickyD").textContent = Math.floor(s / 86400) + " T · " +
        String(Math.floor(s % 86400 / 3600)).padStart(2, "0") + ":" +
        String(Math.floor(s % 3600 / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }, 1000);
  }

  /* ---------- Event: Scroll-Reveal ---------- */
  if (document.body.getAttribute("data-page") === "event" && !matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var targets = $$(".act, .block .sec-head, .chapter, .theory, .facts, .news-item");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { t.classList.add("rv"); io.observe(t); });
  }

  /* ---------- Lightbox: Galerie-Bilder & Videos ---------- */
  function openLightbox(contentHtml) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = contentHtml + '<button class="lb-close" aria-label="Schließen">✕</button>';
    document.body.appendChild(lb);
    function close() { lb.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(ev) { if (ev.key === "Escape") close(); }
    lb.addEventListener("click", function (ev) {
      if (ev.target === lb || ev.target.closest(".lb-close")) close();
    });
    document.addEventListener("keydown", onKey);
  }
  document.addEventListener("click", function (ev) {
    var gl = ev.target.closest(".glight");
    if (!gl) return;
    if (gl.getAttribute("data-img")) openLightbox('<img src="' + gl.getAttribute("data-img") + '" alt="">');
    else if (gl.getAttribute("data-yt")) openLightbox('<div class="lb-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + gl.getAttribute("data-yt") + '?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>');
  });

  /* ---------- Mini-Beziehungsnetz (Charakterseiten) ---------- */
  var cv = $("#miniNet"), netRaw = $("#netData");
  if (cv && netRaw) {
    var net = JSON.parse(netRaw.textContent);
    var REL_COLOR = { verbuendet: "#5aa9e6", feind: "#e8353b", familie: "#d9a441", liebe: "#d9a441", komplex: "#a06be6" };
    var IMG = {};
    function getImg(src, cb) {
      if (!src) return null;
      if (IMG[src]) return IMG[src];
      var im = new Image(); im.onload = cb; im.src = src; IMG[src] = im;
      return im;
    }
    function render() {
      var W = cv.offsetWidth || 700, H = 340, dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      var ctx = cv.getContext("2d");
      ctx.scale(dpr, dpr);
      var cx = W / 2, cy = H / 2 - 8;
      var nodes = net.nodes.map(function (n, i) {
        var ang = -Math.PI / 2 + (i / net.nodes.length) * Math.PI * 2;
        return { n: n, x: cx + Math.cos(ang) * Math.min(W / 2 - 70, 230), y: cy + Math.sin(ang) * (H / 2 - 62) };
      });
      function circle(node, x, y, rad) {
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = "#181418"; ctx.fill(); ctx.clip();
        var im = getImg(node.img, draw);
        if (im && im.complete && im.naturalWidth) {
          var s = Math.max(rad * 2 / im.naturalWidth, rad * 2 / im.naturalHeight);
          ctx.drawImage(im, x - im.naturalWidth * s / 2, y - im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s);
        } else {
          ctx.fillStyle = "#cfc8cb"; ctx.font = "700 " + rad + "px 'Avenir Next Condensed', sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(node.n.charAt(0), x, y);
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = node.u === "fox" ? "#d9a441" : node.u === "sony" ? "#5aa9e6" : "#e8353b";
        ctx.lineWidth = 2; ctx.stroke();
        ctx.font = "600 10.5px 'Avenir Next Condensed', 'Arial Narrow', sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#3a3335";
        ctx.fillStyle = "#ddd6d8";
        ctx.fillText(node.n.toUpperCase(), x, y + rad + 14);
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        nodes.forEach(function (p) {
          ctx.strokeStyle = REL_COLOR[p.n.t] || "#666"; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.globalAlpha = 1;
        });
        nodes.forEach(function (p) { circle(p.n, p.x, p.y, 24); });
        circle(net.center, cx, cy, 38);
      }
      draw();
      cv.onmousemove = function (ev) {
        var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, hit = false;
        nodes.forEach(function (p) { if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) < 676) hit = true; });
        cv.style.cursor = hit ? "pointer" : "default";
      };
      cv.onclick = function (ev) {
        var r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
        for (var i = 0; i < nodes.length; i++) {
          var p = nodes[i];
          if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) < 676) { location.href = p.n.url; return; }
        }
      };
    }
    render();
    window.addEventListener("resize", render);
  }
})();
