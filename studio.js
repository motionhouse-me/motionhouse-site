(function(){
  const cv = document.getElementById("studioCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const DISPLAY = '"Archivo Black",Impact,sans-serif';
  const BODY = '"Archivo",system-ui,sans-serif';
  const state = { name: "", tag: "", color: "#95122C", scene: "billboard", mode: "text", img: null };
  const T = (en, ar) => window.MH ? window.MH.t(en, ar) : en;
  /* draw an uploaded image to fill a box, cropping the overflow */
  function cover(img, x, y, w, h){
    const r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  const useImg = () => state.mode === "image" && state.img;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  /* ---- helpers ---- */
  function rgb(h){ h = h.replace("#",""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; }
  function mix(h, to, a){ const c = rgb(h), t = rgb(to); return "rgb(" + c.map((v,i) => Math.round(v + (t[i]-v)*a)).join(",") + ")"; }
  function lum(h){ const [r,g,b] = rgb(h).map(v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*r + .7152*g + .0722*b; }
  const ink = (h) => lum(h) > .45 ? "#111111" : "#ffffff";
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function fit(text, maxW, size, font, weight){ let s = size; const w = weight ? weight + " " : ""; ctx.font = w + s + "px " + font; while (ctx.measureText(text).width > maxW && s > 16){ s -= 2; ctx.font = w + s + "px " + font; } return s; }
  function heart(x,y,s){ ctx.beginPath(); ctx.moveTo(x,y+s*.35); ctx.bezierCurveTo(x-s,y-s*.3,x-s*.5,y-s,x,y-s*.45); ctx.bezierCurveTo(x+s*.5,y-s,x+s,y-s*.3,x,y+s*.35); ctx.fill(); }
  const label = () => state.name.trim() || T("Your Brand", "علامتك");

  /* ---- night skyline, drawn once ---- */
  const bg = document.createElement("canvas"); bg.width = W; bg.height = H;
  (function(){
    const g = bg.getContext("2d"); let s = 7; const rnd = () => { s = (s*16807) % 2147483647; return s/2147483647; };
    const sky = g.createLinearGradient(0,0,0,H); sky.addColorStop(0,"#050507"); sky.addColorStop(.65,"#1a0a10"); sky.addColorStop(1,"#2b0d17");
    g.fillStyle = sky; g.fillRect(0,0,W,H);
    for (let i = 0; i < 70; i++){ g.fillStyle = "rgba(255,255,255," + (.15 + rnd()*.5) + ")"; g.fillRect(rnd()*W, rnd()*H*.5, 1.5, 1.5); }
    let x = -20;
    while (x < W){
      const bw = 50 + rnd()*90, bh = 120 + rnd()*300;
      g.fillStyle = "rgb(" + (10+rnd()*8|0) + "," + (10+rnd()*8|0) + "," + (14+rnd()*10|0) + ")";
      g.fillRect(x, H-bh, bw, bh);
      for (let wy = H-bh+14; wy < H-10; wy += 16) for (let wx = x+8; wx < x+bw-8; wx += 14){
        if (rnd() > .72){ g.fillStyle = "rgba(255," + (200+rnd()*40|0) + "," + (140+rnd()*60|0) + "," + (.25+rnd()*.4) + ")"; g.fillRect(wx, wy, 5, 7); }
      }
      x += bw + 4;
    }
  })();

  /* ---- LED dot pattern ---- */
  const dots = (function(){
    const p = document.createElement("canvas"); p.width = p.height = 6; const g = p.getContext("2d");
    g.fillStyle = "rgba(0,0,0,.62)"; g.fillRect(0,0,6,6);
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(3,3,1.9,0,7); g.fill();
    return ctx.createPattern(p, "repeat");
  })();

  function mark(){
    ctx.save(); ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
    ctx.font = "700 18px " + BODY; ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.fillText("Made with MotionHouse", W-28, H-26); ctx.restore();
  }

  /* ---- scene 1: billboard ---- */
  function billboard(t){
    const c = state.color, X = 150, Y = 80, BW = 980, BH = 470, tag = state.tag.trim();
    ctx.fillStyle = "#15151a"; ctx.fillRect(380, Y+BH, 34, H-(Y+BH)); ctx.fillRect(866, Y+BH, 34, H-(Y+BH));
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 70; ctx.fillStyle = "#0c0c0f"; rr(X-14, Y-14, BW+28, BH+28, 10); ctx.fill(); ctx.restore();
    const gr = ctx.createLinearGradient(X, Y, X+BW, Y+BH); gr.addColorStop(0, c); gr.addColorStop(1, mix(c,"#000000",.65));
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y, BW, BH); ctx.clip();
    ctx.fillStyle = gr; ctx.fillRect(X, Y, BW, BH);
    if (useImg()) cover(state.img, X, Y, BW, BH);
    const p = reduce ? .35 : ((t/2600) % 1.5) - .25, bx = X + p*BW;
    const band = ctx.createLinearGradient(bx-120, 0, bx+120, 0);
    band.addColorStop(0,"rgba(255,255,255,0)"); band.addColorStop(.5,"rgba(255,255,255,.16)"); band.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle = band; ctx.fillRect(bx-120, Y, 240, BH);
    const col = ink(c), name = label().toUpperCase(), s = fit(name, BW-120, 150, DISPLAY);
    ctx.font = s + "px " + DISPLAY; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.globalAlpha = reduce ? 1 : .94 + .06*Math.sin(t/180);
    const ny = Y + BH/2 - (tag ? 36 : 0);
    if (!useImg()) ctx.fillText(name, X+BW/2, ny);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    if (tag && !useImg()){ const ts = fit(tag, BW-200, 44, BODY, "700"); ctx.font = "700 " + ts + "px " + BODY; ctx.fillText(tag, X+BW/2, ny + s*.55 + 28); }
    ctx.fillStyle = dots; ctx.fillRect(X, Y, BW, BH);
    ctx.restore();
    for (let i = 0; i < 6; i++){ ctx.fillStyle = "#fff2c6"; ctx.beginPath(); ctx.arc(X+80+i*164, Y-28, 4, 0, 7); ctx.fill(); }
  }

  /* ---- scene 2: bus wrap ---- */
  function bus(){
    const c = state.color, X = 100, Y = 250, BW = 1080, BH = 260, tag = state.tag.trim();
    ctx.fillStyle = "#0d0d10"; ctx.fillRect(0, 530, W, H-530);
    ctx.fillStyle = "rgba(255,255,255,.25)"; for (let x = 20; x < W; x += 120) ctx.fillRect(x, 640, 60, 6);
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.ellipse(X+BW/2, 540, BW/2, 14, 0, 0, 7); ctx.fill();
    ctx.save(); rr(X, Y, BW, BH, 34); ctx.fillStyle = "#f2f2f4"; ctx.fill(); ctx.clip();
    const wr = ctx.createLinearGradient(X, Y, X+BW, Y+BH); wr.addColorStop(0, c); wr.addColorStop(1, mix(c,"#000000",.5));
    ctx.fillStyle = wr; ctx.fillRect(X, Y+86, BW, BH-86);
    if (useImg()) cover(state.img, X, Y+86, BW*.84, BH-86);
    const a = X + BW*.7;
    ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.moveTo(a, Y+86); ctx.lineTo(a+120, Y+86); ctx.lineTo(a+20, Y+BH); ctx.lineTo(a-100, Y+BH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#18232d"; for (let i = 0; i < 7; i++){ rr(X+40+i*138, Y+16, 112, 60, 10); ctx.fill(); }
    rr(X+BW-150, Y+16, 110, BH-40, 10); ctx.fill();
    const col = ink(c), name = label().toUpperCase(), s = fit(name, 780, 110, DISPLAY);
    ctx.font = s + "px " + DISPLAY; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col;
    const ty = Y + 86 + (BH-86)/2 - (tag ? 14 : 0);
    if (!useImg()) ctx.fillText(name, X+470, ty);
    if (tag && !useImg()){ const ts = fit(tag, 780, 34, BODY, "700"); ctx.font = "700 " + ts + "px " + BODY; ctx.fillText(tag, X+470, ty + s*.55 + 14); }
    ctx.restore();
    [[X+230, Y+BH], [X+BW-230, Y+BH]].forEach(function(w){
      ctx.fillStyle = "#0a0a0c"; ctx.beginPath(); ctx.arc(w[0], w[1], 50, 0, 7); ctx.fill();
      ctx.fillStyle = "#5a5a63"; ctx.beginPath(); ctx.arc(w[0], w[1], 22, 0, 7); ctx.fill();
    });
    ctx.fillStyle = "#ffe8a8"; rr(X+BW-18, Y+BH-70, 12, 26, 4); ctx.fill();
  }

  /* ---- scene 3: phone feed ---- */
  function phone(){
    const c = state.color, px = 490, py = 30, pw = 300, ph = 660, tag = state.tag.trim();
    const gl = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, 420); gl.addColorStop(0, mix(c,"#000000",.35)); gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 60; rr(px, py, pw, ph, 46); ctx.fillStyle = "#0b0b0d"; ctx.fill(); ctx.restore();
    const sx = px+10, sy = py+10, sw = pw-20, sh = ph-20;
    ctx.save(); rr(sx, sy, sw, sh, 38); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy, 0, sy+sh); sg.addColorStop(0, c); sg.addColorStop(1, mix(c,"#000000",.7));
    ctx.fillStyle = sg; ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.arc(sx+sw*.3, sy+sh*.38, 150, 0, 7); ctx.fill();
    if (useImg()) cover(state.img, sx, sy, sw, sh);
    const col = ink(c), name = label().toUpperCase();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col;
    ctx.font = "700 15px " + BODY; ctx.globalAlpha = .65; ctx.fillText("Following", sx+sw/2-52, sy+52); ctx.globalAlpha = 1; ctx.fillText("For you", sx+sw/2+36, sy+52);
    ctx.fillRect(sx+sw/2+19, sy+64, 34, 3);
    const s = fit(name, sw-70, 56, DISPLAY); ctx.font = s + "px " + DISPLAY; if (!useImg()) ctx.fillText(name, sx+sw/2-8, sy+sh*.42);
    if (tag && !useImg()){ const ts = fit(tag, sw-70, 22, BODY, "700"); ctx.font = "700 " + ts + "px " + BODY; ctx.fillText(tag, sx+sw/2-8, sy+sh*.42 + s*.6 + 18); }
    ctx.fillStyle = "#0b0b0d"; rr(sx+sw/2-45, sy+10, 90, 24, 12); ctx.fill();
    for (let i = 0; i < 4; i++){
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.beginPath(); ctx.arc(sx+sw-32, sy+sh*.5+i*62, 20, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; if (i === 0) heart(sx+sw-32, sy+sh*.5, 11); else { ctx.beginPath(); ctx.arc(sx+sw-32, sy+sh*.5+i*62, 5, 0, 7); ctx.fill(); }
    }
    const handle = "@" + (state.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbrand");
    ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "700 18px " + BODY; ctx.fillText(handle, sx+22, sy+sh-96);
    ctx.fillStyle = "rgba(255,255,255,.75)"; rr(sx+22, sy+sh-76, 170, 10, 5); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.45)"; rr(sx+22, sy+sh-56, 120, 10, 5); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.25)"; rr(sx+22, sy+sh-26, sw-44, 4, 2); ctx.fill();
    ctx.fillStyle = "#fff"; rr(sx+22, sy+sh-26, (sw-44)*.45, 4, 2); ctx.fill();
    ctx.restore();
  }

  /* ---- draw + animate ---- */
  const scenes = { billboard: billboard, bus: bus, phone: phone };
  const names = { billboard: ["a billboard","لوحة إعلانية"], bus: ["a bus","حافلة"], phone: ["a phone feed","شاشة هاتف"] };
  function draw(t){
    ctx.clearRect(0, 0, W, H); ctx.drawImage(bg, 0, 0);
    scenes[state.scene](t || 0); mark();
    cv.setAttribute("aria-label", T("Preview of " + (useImg() ? "your image" : label()) + " on " + names[state.scene][0], "معاينة على " + names[state.scene][1]));
  }
  let raf = 0, visible = true;
  function loop(t){ raf = 0; draw(t); if (state.scene === "billboard" && !reduce && visible) raf = requestAnimationFrame(loop); }
  function kick(){ if (!raf) raf = requestAnimationFrame(loop); }
  if ("IntersectionObserver" in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; if (visible) kick(); }).observe(cv);

  /* ---- controls ---- */
  const swatches = document.querySelectorAll(".swatch");
  function setColor(c){
    state.color = c; $("sColor").value = c;
    swatches.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.c.toLowerCase() === c.toLowerCase()); });
    kick();
  }
  $("sName").addEventListener("input", function(e){ state.name = e.target.value; kick(); });
  $("sTag").addEventListener("input", function(e){ state.tag = e.target.value; kick(); });
  $("sColor").addEventListener("input", function(e){ setColor(e.target.value); });
  swatches.forEach(function(b){ b.addEventListener("click", function(){ setColor(b.dataset.c); }); });
  document.querySelectorAll("#sceneSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      state.scene = b.dataset.scene;
      document.querySelectorAll("#sceneSeg button").forEach(function(x){ x.setAttribute("aria-pressed", x === b); });
      kick();
    });
  });
  /* text or uploaded image */
  function setMode(m){
    state.mode = m;
    document.querySelectorAll("#modeSeg button").forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.mode === m); });
    $("textCtrls").hidden = m !== "text"; $("imageCtrls").hidden = m !== "image";
    kick();
  }
  document.querySelectorAll("#modeSeg button").forEach(function(b){ b.addEventListener("click", function(){ setMode(b.dataset.mode); }); });
  function loadFile(file){
    if (!file || !/^image\//.test(file.type)) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = function(){ state.img = img; $("fileName").textContent = file.name; $("fileRow").hidden = false; setMode("image"); };
    img.src = url;
  }
  $("sFile").addEventListener("change", function(e){ loadFile(e.target.files[0]); });
  const drop = $("drop");
  ["dragenter","dragover"].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave","drop"].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function(e){ loadFile(e.dataTransfer.files[0]); });
  $("clearFile").addEventListener("click", function(){ state.img = null; $("sFile").value = ""; $("fileRow").hidden = true; kick(); });
  document.addEventListener("mh:lang", kick);
  $("sDownload").addEventListener("click", function(){
    draw(performance.now());
    cv.toBlob(function(blob){
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-brand-in-motion.png"; a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    });
  });
  $("sPlan").addEventListener("click", function(e){
    e.currentTarget.href = "contact.html?brand=" + encodeURIComponent(state.name.trim()) + "&color=" + encodeURIComponent(state.color);
  });

  kick();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);
})();