/* MotionHouse — header, footer and theme (shared by every page) */
(function(){
  var root = document.documentElement;
  var store = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
  var read = function(k){ try { return localStorage.getItem(k); } catch (e) { return null; } };

  var PAGES = [
    ["services.html",    "Services",    "services"],
    ["how-we-work.html", "How we work", "how"],
    ["contact.html",     "Contact",     "contact"]
  ];
  var here = document.body.getAttribute("data-page");

  function logo(){
    return '<a class="logo" href="./" aria-label="MotionHouse home">' +
      '<img class="for-dark" src="logo-on-dark.png" alt="MotionHouse" width="900" height="178">' +
      '<img class="for-light" src="logo-on-light.png" alt="MotionHouse" width="900" height="178"></a>';
  }
  var links = function(cur){ return PAGES.map(function(p){
    return '<li><a href="' + p[0] + '"' + (cur && here === p[2] ? ' aria-current="page"' : "") + ">" + p[1] + "</a></li>"; }).join(""); };

  var head = document.getElementById("site-header");
  if (head) head.outerHTML =
    '<a class="skip" href="#main">Skip to content</a>' +
    '<header class="nav" id="nav"><div class="wrap nav-in">' + logo() +
    '<nav aria-label="Main"><ul id="navList">' + links(true) + "</ul></nav>" +
    '<div class="nav-end">' +
      '<button class="tool" id="themeBtn" type="button">' +
        '<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
        '<svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"/></svg></button>' +
      '<a class="btn btn-hot nav-cta" href="contact.html">Plan my campaign</a>' +
      '<button class="tool menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="navList" aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
    "</div></div></header>";

  var foot = document.getElementById("site-footer");
  if (foot) foot.outerHTML =
    '<footer class="foot"><div class="wrap foot-in">' + logo() +
    "<ul>" + links(false) + "</ul>" +
    '<p><span dir="ltr">© ' + new Date().getFullYear() + '</span> <span>MotionHouse. United Arab Emirates.</span></p>' +
    "</div></footer>";

  /* ---- mobile menu ---- */
  var nav = document.getElementById("nav"), menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.addEventListener("click", function(){ menuBtn.setAttribute("aria-expanded", nav.classList.toggle("open")); });

  /* ---- theme ---- */
  var themeBtn = document.getElementById("themeBtn");
  var mq = window.matchMedia("(prefers-color-scheme: light)");
  function isLight(){ var t = root.getAttribute("data-theme"); return t ? t === "light" : mq.matches; }
  function paintTheme(){
    var light = isLight();
    root.classList.toggle("is-light", light);
    themeBtn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", light ? "#fbf8f9" : "#0c0a0b");
  }
  themeBtn.addEventListener("click", function(){
    var next = isLight() ? "dark" : "light";
    root.setAttribute("data-theme", next); store("mh-theme", next); paintTheme();
    document.dispatchEvent(new CustomEvent("mh:theme"));
  });
  if (mq.addEventListener) mq.addEventListener("change", paintTheme);

  /* helper kept so the other scripts can stay as they are (English only) */
  window.MH = { lang: function(){ return "en"; }, t: function(en){ return en; } };
  try { localStorage.removeItem("mh-lang"); } catch (e) {}
  paintTheme();

  /* ---- hero screen: cycle through the media photos ---- */
  var shots = document.querySelectorAll(".screen img");
  if (shots.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    var i = 0, cap = document.getElementById("screenCap");
    setInterval(function(){
      shots[i].classList.remove("on"); i = (i + 1) % shots.length; shots[i].classList.add("on");
      if (cap) cap.textContent = shots[i].dataset.label;
    }, 3200);
  }
})();
