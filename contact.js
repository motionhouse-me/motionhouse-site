/* MotionHouse — contact form with a live brief card */
(function(){
  var form = document.getElementById("contactForm");
  if (!form) return;

  /* ===== EDIT THIS: where enquiries go ===== */
  var EMAIL = "sales@motionhouse.me";

  /* ===== EDIT THIS: to send briefs straight to the inbox =====
     1. Go to web3forms.com and enter the email above (free).
     2. Paste the access key they email you between the quotes.
     Leave it empty and the form opens the visitor's email app instead. */
  var ACCESS_KEY = "0c1c83c7-22bf-4733-bdc2-b5ed0606b18d";

  var $ = function(id){ return document.getElementById(id); };
  var T = function(en, ar){ return window.MH ? window.MH.t(en, ar) : en; };
  $("mailLink").href = "mailto:" + EMAIL; $("mailLink").textContent = EMAIL; $("mailText").textContent = EMAIL;

  /* details passed from the studio or the map */
  var q = new URLSearchParams(location.search);
  var clean = function(s){ return (s || "").trim().slice(0, 60); };
  var fromBrand = clean(q.get("brand")), fromArea = clean(q.get("area"));
  if (fromBrand) form.elements.company.value = fromBrand;
  if (fromArea) form.querySelectorAll('[name="area"]').forEach(function(c){ if (c.value === fromArea) c.checked = true; });

  /* budget steps (AED) */
  var STEPS = ["AED 10,000", "AED 25,000", "AED 50,000", "AED 100,000", "AED 250,000", "AED 500,000", "AED 750,000", "AED 1,000,000+"];
  var range = $("budget"), bud = $("bud"), touched = false;
  function paintBudget(){
    var v = +range.value, p = v / (STEPS.length - 1) * 100;
    range.style.setProperty("--p", p + "%");
    var monthly = form.elements.btype.value === "Per month";
    $("budgetVal").textContent = touched ? STEPS[v] + (monthly ? T(" / month", " / شهرياً") : "") : T("Drag to set a rough budget", "اسحب لتحديد ميزانية تقريبية");
    $("budgetHint").textContent = touched ? T("approx.", "تقريباً") : "";
    bud.classList.toggle("untouched", !touched);
  }
  range.addEventListener("input", function(){ touched = true; paintBudget(); renderBrief(); });
  form.querySelectorAll('[name="btype"]').forEach(function(r){ r.addEventListener("change", function(){ paintBudget(); renderBrief(); }); });

  /* live brief card */
  function setLine(id, text){ var el = $(id); el.textContent = text || "—"; el.classList.toggle("empty", !text); }
  function renderBrief(){
    var f = new FormData(form);
    setLine("bBrand", (f.get("company") || "").trim());
    setLine("bNeed", f.getAll("need").join(", "));
    setLine("bBudget", touched ? STEPS[+range.value] + (f.get("btype") === "Per month" ? " / mo" : "") : "");
    setLine("bArea", f.getAll("area").join(", "));
    setLine("bContact", [(f.get("name") || "").trim(), (f.get("email") || "").trim() || (f.get("phone") || "").trim()].filter(Boolean).join(" · "));
  }
  form.addEventListener("input", renderBrief);
  form.addEventListener("change", renderBrief);
  document.addEventListener("mh:lang", paintBudget);

  /* send */
  var status = $("formStatus");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var f = new FormData(form);
    var name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim(), phone = (f.get("phone") || "").trim();
    status.className = "status err";
    if (!name){ status.textContent = T("Add your name so we know who to reply to.", "أضف اسمك حتى نعرف لمن نرد."); form.elements.name.focus(); return; }
    if (!email && !phone){ status.textContent = T("Add an email or a phone number so we can reach you.", "أضف بريداً إلكترونياً أو رقم هاتف لنتواصل معك."); form.elements.email.focus(); return; }
    if (email && !form.elements.email.checkValidity()){ status.textContent = T("That email address looks incomplete. Check it and try again.", "يبدو أن البريد الإلكتروني غير مكتمل. تحقق منه وحاول مجدداً."); form.elements.email.focus(); return; }

    var needs = f.getAll("need");
    var lines = [
      "Name: " + name,
      "Brand or company: " + ((f.get("company") || "").trim() || "-"),
      "Email: " + (email || "-"),
      "Phone: " + (phone || "-"),
      "Needs: " + (needs.length ? needs.join(", ") : "Not sure yet"),
      "Budget: " + (touched ? STEPS[+range.value] + " (" + f.get("btype") + ")" : "Not given")
    ];
    var areas = f.getAll("area");
    lines.push("Area: " + (areas.length ? areas.join(", ") : "Not given"));
    var msg = (f.get("message") || "").trim();
    if (msg) lines.push("", msg);
    var body = lines.join("\n");

    var subject = "Campaign brief from " + name + (f.get("company") ? " (" + f.get("company") + ")" : "");

    function viaEmailApp(){
      $("briefText").textContent = body;
      $("sent").hidden = false;
      status.className = "status";
      status.textContent = T("Your email app should open with the brief ready to send.", "سيُفتح تطبيق البريد والملخص جاهز للإرسال.");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }
    if (!ACCESS_KEY) return viaEmailApp();

    var btn = form.querySelector(".c-send"); btn.disabled = true;
    status.className = "status"; status.textContent = T("Sending…", "جارٍ الإرسال…");
    fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ access_key: ACCESS_KEY, subject: subject, from_name: "MotionHouse website", email: email || undefined, replyto: email || undefined, message: body })
    }).then(function(r){ return r.json(); }).then(function(res){
      btn.disabled = false;
      if (!res.success) throw new Error("not sent");
      form.reset(); touched = false; paintBudget(); renderBrief();
      status.textContent = T("Sent. We'll get back to you with a plan.", "تم الإرسال. سنعود إليك بخطة.");
    }).catch(function(){
      btn.disabled = false;
      viaEmailApp();
    });
  });

  $("copyBtn").addEventListener("click", function(){
    var b = this, t = $("briefText").textContent;
    function done(){ b.textContent = T("Copied", "تم النسخ"); setTimeout(function(){ b.textContent = T("Copy brief", "انسخ الملخص"); }, 1800); }
    function fallback(){ var r = document.createRange(); r.selectNodeContents($("briefText")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = T("Selected. Press Ctrl+C", "تم التحديد. اضغط Ctrl+C"); }
    try { navigator.clipboard.writeText(t).then(done, fallback); } catch (err) { fallback(); }
  });

  paintBudget(); renderBrief();
})();
