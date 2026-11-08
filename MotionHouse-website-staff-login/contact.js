/* MotionHouse — contact form */
(function(){
  var form = document.getElementById("contactForm");
  if (!form) return;

  /* ===== EDIT THIS: where enquiries go ===== */
  var EMAIL = "sales@motionhouse.me";

  /* ===== Web3Forms key: sends briefs straight to the inbox =====
     Leave it empty and the form opens the visitor's email app instead. */
  var ACCESS_KEY = "0c1c83c7-22bf-4733-bdc2-b5ed0606b18d";

  /* ===== EDIT THIS: the smallest total budget (AED) each option needs =====
     A monthly budget is counted over MONTHS months (10k/month x 3 = 30k).
     Change these numbers to your real minimums. */
  var MONTHS = 3;
  var MIN_BUDGET = {
    "Social":          10000,
    "Digital screens": 15000,
    "Kiosks":          15000,
    "Radio":           20000,
    "Events":          25000,
    "Billboards":      30000,
    "Buses & taxis":   30000
  };

  var $ = function(id){ return document.getElementById(id); };
  $("mailLink").href = "mailto:" + EMAIL; $("mailLink").textContent = EMAIL; $("mailText").textContent = EMAIL;

  /* details passed from the studio or the map */
  var q = new URLSearchParams(location.search);
  var clean = function(s){ return (s || "").trim().slice(0, 60); };
  var fromBrand = clean(q.get("brand")), fromArea = clean(q.get("area"));
  if (fromBrand) form.elements.company.value = fromBrand;
  if (fromArea) form.querySelectorAll('[name="area"]').forEach(function(c){ if (c.value === fromArea) c.checked = true; });

  /* ---------- budget ---------- */
  var STEPS = [10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000];
  var aed = function(n){ return "AED " + n.toLocaleString("en-US") + (n >= 1000000 ? "+" : ""); };
  var short = function(n){ return n >= 1000000 ? (n / 1000000) + "M" : (n / 1000) + "k"; };
  var range = $("budget"), bud = $("bud"), touched = false;
  var monthly = function(){ return form.elements.btype.value === "Per month"; };
  var total = function(){ return STEPS[+range.value] * (monthly() ? MONTHS : 1); };

  function paintBudget(){
    var v = +range.value;
    range.style.setProperty("--p", (v / (STEPS.length - 1) * 100) + "%");
    $("budgetVal").textContent = touched ? aed(STEPS[v]) + (monthly() ? " / month" : "") : "Drag to set a rough budget";
    bud.classList.toggle("untouched", !touched);
    gateNeeds();
  }

  /* options the budget can't cover are switched off, with the amount they need */
  function gateNeeds(){
    var t = total(), locked = [], dropped = [];
    form.querySelectorAll('[name="need"]').forEach(function(box){
      var min = MIN_BUDGET[box.value], label = box.closest(".opt"), off = touched && min && t < min;
      box.disabled = !!off;
      label.classList.toggle("locked", !!off);
      label.title = off ? "Needs a budget from AED " + short(min) + (monthly() ? " (about AED " + short(Math.ceil(min / MONTHS / 1000) * 1000) + " / month)" : "") : "";
      if (off){ locked.push(box.value + " from AED " + short(min)); if (box.checked){ box.checked = false; dropped.push(box.value); } }
    });
    var note = $("needNote");
    note.hidden = !locked.length;
    note.textContent = locked.length ? "Not available at this budget: " + locked.join(", ") + "." + (dropped.length ? " We unticked " + dropped.join(", ") + "." : "") : "";
  }
  range.addEventListener("input", function(){ touched = true; paintBudget(); });
  form.querySelectorAll('[name="btype"]').forEach(function(r){ r.addEventListener("change", paintBudget); });

  /* ---------- field checks ---------- */
  var nameIn = form.elements.name, emailIn = form.elements.email, phoneIn = form.elements.phone;
  var EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

  /* phone: only digits, spaces, +, - and brackets can be typed or pasted */
  phoneIn.addEventListener("input", function(){
    var v = phoneIn.value, c = v.replace(/[^\d+\s()-]/g, "").replace(/(?!^)\+/g, "");
    if (c !== v) phoneIn.value = c;
    clearErr(phoneIn, "ePhone");
  });
  /* email: no spaces */
  emailIn.addEventListener("input", function(){
    var c = emailIn.value.replace(/\s/g, "");
    if (c !== emailIn.value) emailIn.value = c;
    clearErr(emailIn, "eEmail");
  });
  /* name: letters, spaces and . ' - only */
  nameIn.addEventListener("input", function(){
    var c = nameIn.value.replace(/[^\p{L}\s.'-]/gu, "");
    if (c !== nameIn.value) nameIn.value = c;
    clearErr(nameIn, "eName");
  });

  function setErr(input, id, msg){ input.classList.add("bad"); input.setAttribute("aria-invalid", "true"); $(id).textContent = msg; }
  function clearErr(input, id){
    input.classList.remove("bad"); input.removeAttribute("aria-invalid"); $(id).textContent = "";
    var st = $("formStatus"); if (st && st.classList.contains("err") && !form.querySelector(".bad")){ st.textContent = ""; st.className = "status"; }
  }
  var digits = function(s){ return s.replace(/\D/g, ""); };

  function check(){
    var name = nameIn.value.trim(), email = emailIn.value.trim(), phone = phoneIn.value.trim(), first = null;
    var fail = function(input, id, msg){ setErr(input, id, msg); if (!first) first = input; };
    clearErr(nameIn, "eName"); clearErr(emailIn, "eEmail"); clearErr(phoneIn, "ePhone");

    if ((name.match(/\p{L}/gu) || []).length < 2) fail(nameIn, "eName", "Add your name.");
    if (!email && !phone){
      fail(emailIn, "eEmail", "Add an email or a phone number.");
      fail(phoneIn, "ePhone", "Add a phone number or an email.");
    }
    if (email && !EMAIL_RE.test(email)) fail(emailIn, "eEmail", "Enter a full email address, like name@company.com.");
    if (phone){
      var d = digits(phone);
      if (d.length < 9 || d.length > 15) fail(phoneIn, "ePhone", "Enter a full phone number, like +971 50 123 4567.");
      else if (/^(\d)\1+$/.test(d)) fail(phoneIn, "ePhone", "That number doesn't look real. Check it and try again.");
    }
    return first;
  }

  /* ---------- send ---------- */
  var status = $("formStatus");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var bad = check();
    if (bad){ status.className = "status err"; status.textContent = "Check the highlighted fields."; bad.focus(); return; }

    var f = new FormData(form);
    var name = f.get("name").trim(), email = f.get("email").trim(), phone = f.get("phone").trim();
    var needs = f.getAll("need"), areas = f.getAll("area");
    var lines = [
      "Name: " + name,
      "Brand or company: " + ((f.get("company") || "").trim() || "-"),
      "Email: " + (email || "-"),
      "Phone: " + (phone || "-"),
      "Budget: " + (touched ? aed(STEPS[+range.value]) + (monthly() ? " per month" : " one-off") : "Not given"),
      "Needs: " + (needs.length ? needs.join(", ") : "Not sure yet"),
      "Area: " + (areas.length ? areas.join(", ") : "Not given")
    ];
    var msg = (f.get("message") || "").trim();
    if (msg) lines.push("", msg);
    var body = lines.join("\n");
    var subject = "Campaign brief from " + name + (f.get("company") ? " (" + f.get("company") + ")" : "");

    function viaEmailApp(){
      $("briefText").textContent = body;
      $("sent").hidden = false;
      status.className = "status";
      status.textContent = "Your email app should open with the brief ready to send.";
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }
    if (!ACCESS_KEY) return viaEmailApp();

    var btn = form.querySelector(".c-send"); btn.disabled = true;
    status.className = "status"; status.textContent = "Sending…";
    fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ access_key: ACCESS_KEY, subject: subject, from_name: "MotionHouse website", email: email || undefined, replyto: email || undefined, message: body })
    }).then(function(r){ return r.json(); }).then(function(res){
      btn.disabled = false;
      if (!res.success) throw new Error("not sent");
      form.reset(); touched = false; paintBudget();
      status.textContent = "Sent. We'll get back to you with a plan.";
    }).catch(function(){
      btn.disabled = false;
      viaEmailApp();
    });
  });

  $("copyBtn").addEventListener("click", function(){
    var b = this, t = $("briefText").textContent;
    function done(){ b.textContent = "Copied"; setTimeout(function(){ b.textContent = "Copy brief"; }, 1800); }
    function fallback(){ var r = document.createRange(); r.selectNodeContents($("briefText")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected. Press Ctrl+C"; }
    try { navigator.clipboard.writeText(t).then(done, fallback); } catch (err) { fallback(); }
  });

  paintBudget();
})();
