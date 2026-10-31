/* MotionHouse — interactive UAE map. Pick an emirate and its area lights up. */
(function(){
  var svg = document.getElementById("uaeMap");
  if (!svg) return;
  var T = function(en, ar){ return window.MH ? window.MH.t(en, ar) : en; };

  /* =====================================================================
     EDIT THIS: the media available in each emirate.
     Use any of: ooh, dooh, bus, kiosk, social, events, radio
     ===================================================================== */
  var MEDIA = {
    ooh:["Billboards","لوحات إعلانية"], dooh:["Digital screens","شاشات رقمية"], bus:["Buses & taxis","حافلات وسيارات أجرة"],
    kiosk:["Kiosks","أكشاك"], social:["Social media","تواصل اجتماعي"], events:["Events","فعاليات"], radio:["Radio","إذاعة"]
  };
  var EMIRATES = [
    { id:"abudhabi", name:"Abu Dhabi",      ar:"أبوظبي",      lon:54.37, lat:24.47, side:"l", media:["ooh","dooh","bus","kiosk","social","events","radio"] },
    { id:"dubai",    name:"Dubai",          ar:"دبي",          lon:55.27, lat:25.20, side:"l", media:["ooh","dooh","bus","kiosk","social","events","radio"] },
    { id:"sharjah",  name:"Sharjah",        ar:"الشارقة",      lon:55.42, lat:25.33, side:"l", media:["ooh","dooh","bus","kiosk","social","events","radio"] },
    { id:"ajman",    name:"Ajman",          ar:"عجمان",        lon:55.51, lat:25.41, side:"r", media:["ooh","dooh","social","events","radio"] },
    { id:"uaq",      name:"Umm Al Quwain",  ar:"أم القيوين",   lon:55.68, lat:25.55, side:"r", media:["ooh","social","radio"] },
    { id:"rak",      name:"Ras Al Khaimah", ar:"رأس الخيمة",   lon:55.95, lat:25.78, side:"r", media:["ooh","dooh","social","events","radio"] },
    { id:"fujairah", name:"Fujairah",       ar:"الفجيرة",      lon:56.33, lat:25.12, side:"r", media:["ooh","social","events","radio"] }
  ];

  /* ---- drawing ---- */
  var VW = 800, VH = 640, LON0 = 51.2, LON1 = 57.9, LAT0 = 22.4, LAT1 = 26.4;
  var px = function(lon){ return (lon - LON0) / (LON1 - LON0) * VW; };
  var py = function(lat){ return (LAT1 - lat) / (LAT1 - LAT0) * VH; };
  var OUTLINE = [
    [51.58,24.25],[51.8,24.05],[52.2,24.0],[52.6,24.12],[53.0,24.15],[53.5,24.1],[53.9,24.25],[54.2,24.35],[54.45,24.42],[54.6,24.6],[54.9,24.85],
    [55.1,25.05],[55.27,25.25],[55.4,25.38],[55.52,25.47],[55.75,25.6],[55.92,25.75],[56.02,25.95],[56.08,26.07],[56.15,25.9],[56.2,25.7],
    [56.27,25.6],[56.36,25.35],[56.38,25.1],[56.35,24.92],[56.12,24.72],[55.95,24.5],[55.8,24.25],[55.5,24.05],[55.3,23.8],[55.25,23.4],[55.15,23.0],[55.0,22.65],
    [54.2,22.68],[53.2,22.75],[52.5,22.85],[52.0,22.95],[51.6,23.6],[51.5,24.05]
  ].map(function(p){ return [px(p[0]), py(p[1])]; });
  function inside(x, y){
    var c = false;
    for (var i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++){
      var a = OUTLINE[i], b = OUTLINE[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  EMIRATES.forEach(function(e){ e.x = px(e.lon); e.y = py(e.lat); });

  /* each dot belongs to its nearest emirate, so a whole area can light up */
  var groups = {}; EMIRATES.forEach(function(e){ groups[e.id] = ""; });
  for (var y = 8, r = 0; y < VH; y += 11, r++)
    for (var x = 8 + (r % 2 ? 5.5 : 0); x < VW; x += 11){
      if (!inside(x, y)) continue;
      var best = null, bd = 1e9;
      EMIRATES.forEach(function(e){ var w = e.id === "abudhabi" ? .45 : 1, d = ((x - e.x) * (x - e.x) + (y - e.y) * (y - e.y)) * w; if (d < bd){ bd = d; best = e.id; } });
      groups[best] += '<circle cx="' + x + '" cy="' + y + '" r="2.3"/>';
    }

  var dots = EMIRATES.map(function(e){ return '<g class="map-dots" data-g="' + e.id + '">' + groups[e.id] + "</g>"; }).join("");
  var pins = EMIRATES.map(function(e){
    var left = e.side === "l";
    return '<g class="pin" data-id="' + e.id + '" transform="translate(' + e.x.toFixed(1) + " " + e.y.toFixed(1) + ')" tabindex="0" role="button">' +
      '<circle class="pin-halo" r="70"/><circle class="pin-hit" r="18"/><circle class="pin-ping" r="7"/><circle class="pin-core" r="7"/>' +
      '<text class="pin-label" x="' + (left ? -16 : 16) + '" y="6" text-anchor="' + (left ? "end" : "start") + '"></text></g>';
  }).join("");
  svg.innerHTML = '<defs><radialGradient id="halo"><stop offset="0" stop-color="#b8213f" stop-opacity=".7"/><stop offset="1" stop-color="#b8213f" stop-opacity="0"/></radialGradient></defs>' +
    dots + '<g id="pins">' + pins + "</g>";

  /* ---- interaction ---- */
  var $ = function(id){ return document.getElementById(id); };
  var byId = {}; EMIRATES.forEach(function(e){ byId[e.id] = e; });
  var sel = "dubai", filter = "all";
  var nm = function(e){ return T(e.name, e.ar); };

  function buildChips(){
    $("emiratePick").innerHTML = '<button class="chip" type="button" data-e="all">' + T("All UAE", "كل الإمارات") + "</button>" +
      EMIRATES.map(function(e){ return '<button class="chip" type="button" data-e="' + e.id + '">' + nm(e) + "</button>"; }).join("");
    $("mapFilters").innerHTML = '<button class="chip" type="button" data-f="all">' + T("All media", "كل الأنواع") + "</button>" +
      Object.keys(MEDIA).map(function(k){ return '<button class="chip" type="button" data-f="' + k + '">' + T(MEDIA[k][0], MEDIA[k][1]) + "</button>"; }).join("");
    svg.querySelectorAll(".pin").forEach(function(g){ var e = byId[g.dataset.id]; g.querySelector("text").textContent = nm(e); g.setAttribute("aria-label", nm(e)); });
  }

  $("mapFilters").addEventListener("click", function(ev){ var b = ev.target.closest("[data-f]"); if (b){ filter = b.dataset.f; update(); } });
  $("emiratePick").addEventListener("click", function(ev){ var b = ev.target.closest("[data-e]"); if (b){ sel = b.dataset.e; update(); } });
  function pick(g){ sel = sel === g.dataset.id ? "all" : g.dataset.id; update(); }
  svg.addEventListener("click", function(ev){ var g = ev.target.closest(".pin"); if (g) pick(g); });
  svg.addEventListener("keydown", function(ev){ var g = ev.target.closest(".pin"); if (g && (ev.key === "Enter" || ev.key === " ")){ ev.preventDefault(); pick(g); } });

  function update(){
    var all = sel === "all", e = byId[sel], f = filter !== "all";
    svg.querySelectorAll(".pin").forEach(function(g){
      var has = byId[g.dataset.id].media.indexOf(filter) > -1;
      g.classList.toggle("on", g.dataset.id === sel);
      g.classList.toggle("hit", f && has);
      g.classList.toggle("dim", f && !has);
    });
    svg.querySelectorAll("[data-g]").forEach(function(gr){
      var id = gr.dataset.g, lit = all ? (!f || byId[id].media.indexOf(filter) > -1) : id === sel;
      gr.setAttribute("class", lit ? "map-hot" : "map-dots");
      gr.style.opacity = lit ? (all ? ".55" : "1") : "";
    });
    var on = svg.querySelector(".pin.on"); if (on) on.parentNode.appendChild(on);
    document.querySelectorAll("#mapFilters .chip").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.f === filter); });
    document.querySelectorAll("#emiratePick .chip").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.e === sel); });

    var list = all ? Object.keys(MEDIA).filter(function(k){ return EMIRATES.some(function(x){ return x.media.indexOf(k) > -1; }); }) : e.media;
    $("mpName").textContent = all ? T("Across the UAE", "في كل الإمارات") : nm(e);
    $("mpSub").textContent = all ? T("Pick an emirate to see what's available there.", "اختر إمارة لترى ما هو متاح فيها.") : T("Media we can book in " + e.name, "الإعلانات المتاحة في " + e.ar);
    $("mpTags").innerHTML = list.map(function(k){ return "<li" + (k === filter ? ' class="hit"' : "") + ">" + T(MEDIA[k][0], MEDIA[k][1]) + "</li>"; }).join("");
    var p = $("mpPlan");
    p.textContent = all ? T("Plan a campaign", "خطّط حملة") : T("Plan a campaign in " + e.name, "خطّط حملة في " + e.ar);
    p.href = all ? "contact.html" : "contact.html?area=" + encodeURIComponent(e.name);
  }
  document.addEventListener("mh:lang", function(){ buildChips(); update(); });
  buildChips(); update();
})();
