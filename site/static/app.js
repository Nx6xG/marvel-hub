/* Marvel Hub — Client-Interaktivität (Suche, Watchlist, Countdown, Spoiler, Widgets) */
(function () {
  "use strict";
  var PREFIX = document.documentElement.getAttribute("data-prefix") || "";
  var EN = document.documentElement.lang === "en";
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
      $("#tlStats").innerHTML = EN ? "<b>" + done + " / " + total + "</b> watched · essential <b>" + pD + " / " + pT + "</b> · left: <b>≈ " + fmtMin(minLeft) + "</b>" : "<b>" + done + " / " + total + "</b> gesehen · Pflicht <b>" + pD + " / " + pT + "</b> · Rest: <b>≈ " + fmtMin(minLeft) + "</b>";
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
      $("#ewlStats").innerHTML = EN ? "<b>" + d2 + " / " + t2 + "</b> watched · left: <b>≈ " + fmtMin(left) + "</b>" : "<b>" + d2 + " / " + t2 + "</b> gesehen · Rest: <b>≈ " + fmtMin(left) + "</b>";
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
    }).join("") || (EN ? '<div class="sd-empty">Nothing found — not even in the Void.</div>' : '<div class="sd-empty">Nichts gefunden — nicht mal im Void.</div>');
    gsDrop.hidden = false;
  }
  if (gsInput) {
    gsInput.addEventListener("focus", function () {
      if (!INDEX) fetch(EN ? "/assets/search-en.json" : "/assets/search.json").then(function (r) { return r.json(); }).then(function (d) { INDEX = d; gsRun(); });
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
  var drops = $$(".nav-drop");
  drops.forEach(function (drop) {
    var btn = $(".nav-drop-btn", drop);
    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      drops.forEach(function (d) { if (d !== drop) { d.classList.remove("open"); $(".nav-drop-btn", d).setAttribute("aria-expanded", "false"); } });
      var open = drop.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".nav-drop")) drops.forEach(function (d) { d.classList.remove("open"); $(".nav-drop-btn", d).setAttribute("aria-expanded", "false"); });
  });

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

  /* ---------- Startseite: Tages-Module ---------- */
  var dailyData = $("#dailyData");
  if (dailyData) {
    var dd = JSON.parse(dailyData.textContent);
    var now = new Date();
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    $$(".daily-card").forEach(function (card) {
      var list = dd[card.getAttribute("data-kind")];
      if (!list || !list.length) return;
      var e = list[(doy * 7 + now.getFullYear()) % list.length];
      card.href = e.u;
      $("b", card).textContent = e.t;
      $("small", card).textContent = e.s || "";
      var img = $("img", card);
      if (e.i) { img.src = e.i; img.hidden = false; }
    });
    // Jahrestage: heute, sonst ±3 Tage
    var ann = $("#annivMod");
    if (ann && dd.anniversaries) {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      function hits(offset) {
        var d = new Date(now.getTime() + offset * 864e5);
        var md = pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        return dd.anniversaries.filter(function (a2) { return a2.d.slice(5) === md && +a2.d.slice(0, 4) < now.getFullYear(); })
          .map(function (a2) { return { a: a2, off: offset, years: now.getFullYear() - +a2.d.slice(0, 4) }; });
      }
      var found = [];
      for (var off = 0; off <= 3 && found.length < 3; off++) {
        found = found.concat(hits(off));
        if (off > 0) found = found.concat(hits(-off));
      }
      ann.innerHTML = found.length
        ? found.slice(0, 3).map(function (h) {
            var when = EN ? (h.off === 0 ? "Today" : h.off > 0 ? "In " + h.off + " day" + (h.off > 1 ? "s" : "") : (-h.off) + " day" + (h.off < -1 ? "s" : "") + " ago") : (h.off === 0 ? "Heute" : h.off > 0 ? "In " + h.off + " Tag" + (h.off > 1 ? "en" : "") : "Vor " + (-h.off) + " Tag" + (h.off < -1 ? "en" : ""));
            return '<a class="anniv-row" href="' + h.a.u + '"><img src="' + h.a.i + '" alt="" loading="lazy"><div><b>' + when + (EN ? ", " + h.years + " years ago:</b> " : " vor " + h.years + " Jahren:</b> ") + h.a.t + " <span>(" + (EN ? "released " : "Kinostart ") + h.a.d.split("-").reverse().join(".") + ")</span></div></a>";
          }).join("")
        : (EN ? '<p class="anniv-empty">No release anniversary this week — the multiverse is taking a break.</p>' : '<p class="anniv-empty">Diese Woche jährt sich kein Kinostart — das Multiversum macht Pause.</p>');
    }
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
        (inn.length ? '<div class="pcm-d-label">' + (EN ? 'Comes from' : 'Kommt aus') + '</div>' + inn.map(function (l) { return '<button class="pcm-jump" data-jump="' + l.from + '">↑ ' + esc(titleOf(l.from)) + "</button>"; }).join("") : "") +
        (out.length ? '<div class="pcm-d-label">' + (EN ? 'Credits lead to' : 'Abspann führt zu') + '</div>' + out.map(function (l) { return '<button class="pcm-jump" data-jump="' + l.to + '">↓ ' + esc(titleOf(l.to)) + "</button>"; }).join("") : "") +
        '<a class="pcm-open" href="' + row.dataset.url + '">' + (EN ? 'Open film dossier →' : 'Film-Dossier öffnen →') + '</a>';
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
    var QUOTES = EN ? [
      "KNEEL.",
      "DOOM DOES NOT ASK. DOOM COMMANDS.",
      "EVERY STORY LEADS TO DOOM.",
      "YOU CALL IT CONQUEST. DOOM CALLS IT ORDER.",
      "NEW MASK. SAME TASK.",
      "GODS? THERE ARE NO GODS. ONLY DOOM.",
      "RICHARDS!",
      "DOOM DOES NOT REPEAT HIMSELF.",
      "THERE IS NO ONE LIKE DOOM.",
      "DOOM DOES NOT FORGIVE. DOOM DOES NOT FORGET.",
      "ONE COUNTRY. ONE KING. NO QUESTIONS.",
      "YOU HAVE YOUR HEROES. LATVERIA HAS DOOM.",
      "PERFECTION IS NOT AN ART. IT IS A DUTY.",
      "EVEN THE MULTIVERSE KNEELS.",
      "EVERYTHING YOU FEAR BEARS MY NAME.",
      "MASKS DO NOT LIE. FACES DO.",
      "TIME IS A TOOL. DOOM WIELDS IT.",
      "COPY DOOM AND DIE A COPY.",
      "DECEMBER 18. NO DELAYS.",
      "BATTLEWORLD AWAITS."
    ] : [
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

  /* ---------- Generischer Tage-Countdown (Roadmap-Heroes) ---------- */
  $$("[data-days-until]").forEach(function (el) {
    var d = Math.ceil((new Date(el.getAttribute("data-days-until") + "T00:00:00") - Date.now()) / 864e5);
    el.textContent = d > 0 ? d : "0";
  });

  /* ---------- Zitate: Suche ---------- */
  var qs = $("#quoteSearch");
  if (qs) {
    qs.addEventListener("input", function () {
      var q = qs.value.trim().toLowerCase();
      $$("#quoteGrid .q-card").forEach(function (card) {
        card.style.display = !q || card.getAttribute("data-t").indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  /* ---------- Tier-List-Builder ---------- */
  if (document.body.getAttribute("data-page") === "tierlist") {
    var TD = JSON.parse($("#tierData").textContent);
    var TSTR = TD.str;
    var LSKEY = TD.key || "msa-tierlist";
    var TIERS = ["s", "a", "b", "c", "d"];
    var board = $("#tierBoard"), poolEl = $("#tierPool");
    var state = {}, seq = null;
    try {
      var raw = JSON.parse(localStorage.getItem(LSKEY) || "{}");
      if (raw && raw.t) { state = raw.t; seq = raw.seq || null; } else state = raw;
    } catch (e) {}
    var sharedStr = new URLSearchParams(location.search).get("t");
    var shared = null;
    if (sharedStr) {
      shared = {};
      for (var si = 0; si < sharedStr.length && si < TD.order.length; si++) {
        if (TIERS.indexOf(sharedStr[si]) !== -1) shared[TD.order[si]] = sharedStr[si];
      }
    }
    var readOnly = !!shared;
    var active = shared || state;

    $("#tierHint").textContent = TSTR.hint;
    $("#tierShare").textContent = TSTR.share;
    $("#tierReset").textContent = TSTR.reset;
    if (readOnly) {
      $("#tierShared").hidden = false;
      $("#tierSharedT").textContent = TSTR.sharedTitle;
      $("#tierAdopt").textContent = TSTR.adopt;
      $("#tierOwn").textContent = TSTR.own;
      $("#tierShare").hidden = true;
      $("#tierReset").hidden = true;
    }

    function drops() {
      var m = { pool: poolEl };
      $$(".tier-drop", board).forEach(function (d) { m[d.getAttribute("data-tier")] = d; });
      return m;
    }
    var D = drops();
    function apply() {
      $$(".tier-item[data-id]").forEach(function (it) {
        var t = active[it.getAttribute("data-id")];
        (D[t && D[t] ? t : "pool"]).appendChild(it);
      });
      if (seq && !readOnly) for (var key in D) {
        var want = seq[key] || [];
        var have = {};
        $$(".tier-item[data-id]", D[key]).forEach(function (x) { have[x.getAttribute("data-id")] = x; });
        want.forEach(function (id) { if (have[id]) { D[key].appendChild(have[id]); delete have[id]; } });
        for (var rest in have) D[key].appendChild(have[rest]);
      }
      stats();
    }
    function stats() {
      var n = 0;
      for (var k in active) if (D[active[k]]) n++;
      $("#tierStats").textContent = n + " / " + TD.order.length + " " + TSTR.sorted;
    }
    function save() {
      if (readOnly) return;
      seq = {};
      for (var key in D) seq[key] = $$(".tier-item[data-id]", D[key]).map(function (x) { return x.getAttribute("data-id"); });
      try { localStorage.setItem(LSKEY, JSON.stringify({ t: active, seq: seq })); } catch (e) {}
    }
    function place(id, tier, before) {
      if (readOnly) return;
      if (tier === "pool") delete active[id]; else active[id] = tier;
      var it = $(".tier-item[data-id=\"" + id + "\"]");
      if (it) { D[tier].insertBefore(it, before && before !== it ? before : null); it.classList.remove("sel"); }
      selId = null;
      save(); stats();
    }
    /* Einfügeposition im (umbrechenden) Flex-Container aus Mausposition bestimmen */
    function beforeAt(container, x, y) {
      var kids = $$(".tier-item[data-id]", container);
      for (var i = 0; i < kids.length; i++) {
        var r = kids[i].getBoundingClientRect();
        if (y < r.top - 2) return kids[i];
        if (y <= r.bottom + 2 && x < r.left + r.width / 2) return kids[i];
      }
      return null;
    }

    /* Klick-Flow (Touch & Maus) */
    var selId = null;
    document.addEventListener("click", function (ev) {
      if (readOnly) return;
      var it = ev.target.closest(".tier-item[data-id]");
      if (it && !it.classList.contains("rt")) {
        var id = it.getAttribute("data-id");
        if (selId === id) { it.classList.remove("sel"); selId = null; }
        else {
          $$(".tier-item.sel").forEach(function (x) { x.classList.remove("sel"); });
          it.classList.add("sel"); selId = id;
        }
        return;
      }
      if (selId) {
        var row = ev.target.closest(".tier-row:not(.rt), #tierPool");
        if (row) place(selId, row.id === "tierPool" ? "pool" : row.getAttribute("data-tier"));
      }
    });

    /* Tastatur-Schnellmodus: über Poster hovern + S/A/B/C/D drücken, P = Pool */
    var hoverId = null;
    document.addEventListener("mouseover", function (ev) {
      var it = ev.target.closest(".tier-item[data-id]");
      hoverId = it && !it.classList.contains("rt") ? it.getAttribute("data-id") : null;
    });
    document.addEventListener("keydown", function (ev) {
      if (readOnly || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      var tag = (ev.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || ev.target.isContentEditable) return;
      var id = hoverId || selId;
      if (!id) return;
      var k = ev.key.toLowerCase();
      if (TIERS.indexOf(k) !== -1) { ev.preventDefault(); place(id, k); }
      else if (k === "p" || k === "backspace" || k === "0") { ev.preventDefault(); place(id, "pool"); }
    });

    /* Drag & Drop */
    var dragging = false;
    document.addEventListener("dragstart", function (ev) {
      var it = ev.target.closest(".tier-item[data-id]");
      if (!it || readOnly) return;
      dragging = true;
      ev.dataTransfer.setData("text/plain", it.getAttribute("data-id"));
      ev.dataTransfer.effectAllowed = "move";
    });
    document.addEventListener("dragend", function () { dragging = false; });
    /* Seite scrollt mit, wenn man beim Ziehen an den Rand kommt (z. B. Pool → S-Reihe) */
    document.addEventListener("dragover", function (ev) {
      if (!dragging) return;
      var m = 110, y = ev.clientY;
      if (y < m) window.scrollBy(0, -Math.ceil((m - y) / 4));
      else if (window.innerHeight - y < m) window.scrollBy(0, Math.ceil((m - (window.innerHeight - y)) / 4));
    });
    $$(".tier-row:not(.rt) .tier-drop, #tierPool").forEach(function (d) {
      d.addEventListener("dragover", function (ev) { if (!readOnly) { ev.preventDefault(); d.classList.add("over"); } });
      d.addEventListener("dragleave", function () { d.classList.remove("over"); });
      d.addEventListener("drop", function (ev) {
        ev.preventDefault(); d.classList.remove("over");
        var id = ev.dataTransfer.getData("text/plain");
        if (id) place(id, d.getAttribute("data-tier") === "pool" ? "pool" : d.getAttribute("data-tier"), beforeAt(d, ev.clientX, ev.clientY));
      });
    });

    /* Teilen */
    $("#tierShare").addEventListener("click", function () {
      var s = TD.order.map(function (id) { return D[active[id]] && active[id] !== undefined && TIERS.indexOf(active[id]) !== -1 ? active[id] : "-"; }).join("").replace(/-+$/, "");
      var url = location.origin + location.pathname + (s ? "?t=" + s : "");
      var done = function () {
        var b = $("#tierShare"), old = b.textContent;
        b.textContent = TSTR.copied;
        setTimeout(function () { b.textContent = old; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt(TSTR.copyFail, url); });
      else prompt(TSTR.copyFail, url);
    });

    /* Als Bild exportieren (Canvas → PNG-Download) */
    $("#tierImg").textContent = TSTR.img;
    if (readOnly) $("#tierImg").hidden = true;
    $("#tierImg").addEventListener("click", function () {
      var btn = $("#tierImg"), oldTxt = btn.textContent;
      var rows = TIERS.map(function (t) {
        return { t: t, items: $$(".tier-item[data-id]", D[t]).map(function (el) {
          var img = el.querySelector(".lbox-fg") || el.querySelector("img");
          return { src: img ? img.currentSrc || img.src : null, n: el.getAttribute("title") || "" };
        }) };
      });
      var total = rows.reduce(function (s, r) { return s + r.items.length; }, 0);
      if (!total) { btn.textContent = TSTR.imgEmpty; setTimeout(function () { btn.textContent = oldTxt; }, 2200); return; }
      btn.textContent = "…";
      var W = 1240, pad = 18, label = 86, tw = 68, th = 102, gap = 6;
      var perRow = Math.floor((W - pad * 2 - label - 12) / (tw + gap));
      var COLORS = { s: "#7c1f2b", a: "#8a5218", b: "#7d6a1e", c: "#2b6a38", d: "#24507f" };
      var loads = [];
      rows.forEach(function (r) { r.items.forEach(function (it) {
        if (!it.src) return;
        loads.push(new Promise(function (res) {
          var im = new Image();
          im.onload = function () { it.im = im; res(); };
          im.onerror = function () { res(); };
          im.src = it.src;
        }));
      }); });
      Promise.all(loads).then(function () {
        var headH = 78, footH = 52;
        var rowHs = rows.map(function (r) { return Math.max(1, Math.ceil(r.items.length / perRow)) * (th + gap) + 14; });
        var H = headH + rowHs.reduce(function (a, b) { return a + b + 8; }, 0) + footH;
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var cx = cv.getContext("2d");
        cx.fillStyle = "#0a0f0c"; cx.fillRect(0, 0, W, H);
        cx.fillStyle = "#eafff2"; cx.font = "700 30px 'Arial Narrow', Arial, sans-serif";
        cx.fillText(TD.heading, pad, 46);
        var y = headH;
        rows.forEach(function (r, ri) {
          var rh = rowHs[ri];
          cx.fillStyle = "rgba(255,255,255,0.04)";
          cx.fillRect(pad, y, W - pad * 2, rh);
          cx.fillStyle = COLORS[r.t];
          cx.fillRect(pad, y, label, rh);
          cx.fillStyle = "#f2ede6"; cx.font = "700 40px 'Arial Narrow', Arial, sans-serif";
          cx.textAlign = "center";
          cx.fillText(r.t.toUpperCase(), pad + label / 2, y + rh / 2 + 14);
          cx.textAlign = "left";
          r.items.forEach(function (it, i) {
            var tx = pad + label + 8 + (i % perRow) * (tw + gap);
            var ty = y + 7 + Math.floor(i / perRow) * (th + gap);
            if (it.im) {
              var iw = it.im.naturalWidth, ih = it.im.naturalHeight;
              var sc = Math.max(tw / iw, th / ih);
              var sw = tw / sc, sh = th / sc;
              cx.drawImage(it.im, (iw - sw) / 2, (ih - sh) * 0.15, sw, sh, tx, ty, tw, th);
            } else {
              cx.fillStyle = "#161d18"; cx.fillRect(tx, ty, tw, th);
              cx.fillStyle = "#9ab5a3"; cx.font = "700 26px Arial";
              cx.fillText((it.n || "?").charAt(0), tx + tw / 2 - 8, ty + th / 2 + 9);
            }
          });
          y += rh + 8;
        });
        cx.fillStyle = "#5f6f64"; cx.font = "14px Arial";
        cx.fillText("SANC\u00b7TUM \u2014 " + location.host + location.pathname, pad, H - 20);
        cv.toBlob(function (blob) {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = (TD.file || "tierlist") + ".png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
          btn.textContent = "\u2713";
          setTimeout(function () { btn.textContent = oldTxt; }, 2000);
        });
      });
    });

    /* Zurücksetzen (zweistufig) */
    var armed = false;
    $("#tierReset").addEventListener("click", function () {
      var b = $("#tierReset");
      if (!armed) { armed = true; b.textContent = TSTR.sure; setTimeout(function () { armed = false; b.textContent = TSTR.reset; }, 3000); return; }
      armed = false; b.textContent = TSTR.reset;
      active = {}; seq = null;
      try { localStorage.removeItem(LSKEY); } catch (e) {}
      TD.order.forEach(function (id) { var it = $(".tier-item[data-id=\"" + id + "\"]"); if (it) D.pool.appendChild(it); });
      stats();
    });

    /* Geteilte Liste übernehmen */
    if (readOnly) $("#tierAdopt").addEventListener("click", function () {
      try { localStorage.setItem(LSKEY, JSON.stringify({ t: shared, seq: null })); } catch (e) {}
      location.href = location.pathname;
    });

    apply();
  }
})();
