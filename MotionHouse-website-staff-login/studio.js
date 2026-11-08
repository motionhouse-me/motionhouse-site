/* MotionHouse — "Picture your brand here".
   Draws the visitor's brand (or uploaded ad) onto real billboard photos, in perspective. */
(function(){
  var cv = document.getElementById("studioCanvas");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var $ = function(id){ return document.getElementById(id); };
  var DISPLAY = '"Archivo Black","Arial Black",Impact,sans-serif';
  var BODY = '"Archivo",system-ui,sans-serif';

  /* Each scene: the photo, and the four corners of the screen in it (top-left, top-right, bottom-right, bottom-left). */
  var SCENES = {
    unipole: { src: "unipole.jpg", w: 1037, h: 687, quad: [[273,163],[1000,108],[1000,547],[272,545]], kind: "board" },
    gantry:  { src: "gantry.jpg",  w: 1040, h: 687, quad: [[67,196],[887,94],[890,398],[65,447]],    kind: "wide" },
    mall:    { src: "mall-screen.jpg", w: 910, h: 1264, quad: [[285,291],[627,291],[627,897],[285,897]], kind: "tall", glow: true },
    phone:   { src: "social.jpg",  w: 1541, h: 672, quad: [[646,190],[909,190],[909,471],[647,472]], kind: "post", glow: true }
  };
  var state = { scene: "unipole", name: "", tag: "", color: "#95122C", img: null };
  var photos = {};

  function load(key){
    return new Promise(function(res){
      if (photos[key]) return res(photos[key]);
      var im = new Image(); im.onload = function(){ photos[key] = im; res(im); }; im.src = SCENES[key].src;
    });
  }

  /* ---------- colour helpers ---------- */
  function rgb(h){ h = h.replace("#",""); var n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; }
  function mix(h, to, a){ var c = rgb(h), t = rgb(to); return "rgb(" + c.map(function(v,i){ return Math.round(v + (t[i]-v)*a); }).join(",") + ")"; }
  function lum(h){ var c = rgb(h).map(function(v){ v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*c[0] + .7152*c[1] + .0722*c[2]; }
  function fit(g, text, maxW, size, font){ var s = size; g.font = font.replace("{s}", s); while (g.measureText(text).width > maxW && s > 10){ s -= 2; g.font = font.replace("{s}", s); } return s; }

  /* ---------- the ad itself, drawn flat ---------- */
  function drawAd(kind){
    var dims = { board: [1200, 700], wide: [1500, 520], tall: [600, 1060], post: [800, 850] }[kind];
    var W = dims[0], H = dims[1];
    var a = document.createElement("canvas"); a.width = W; a.height = H;
    var g = a.getContext("2d");

    if (state.img){
      var im = state.img, r = Math.max(W / im.width, H / im.height);
      g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
      g.drawImage(im, (W - im.width * r) / 2, (H - im.height * r) / 2, im.width * r, im.height * r);
      return a;
    }

    var c = state.color, light = lum(c) > .5, ink = light ? "#111" : "#fff";
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, light ? c : mix(c, "#000000", .55)); bg.addColorStop(1, c);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    var name = state.name.trim() || "Your Brand", tag = state.tag.trim();
    var pad = Math.round(Math.min(W, H) * .1);
    g.fillStyle = ink; g.textBaseline = "alphabetic";

    if (kind === "tall"){
      g.textAlign = "left";
      var s1 = fit(g, name, W - pad * 2, 130, "{s}px " + DISPLAY);
      g.fillText(name, pad, H * .42);
      if (tag){ var t1 = fit(g, tag, W - pad * 2, 44, "600 {s}px " + BODY); g.globalAlpha = .85; g.fillText(tag, pad, H * .42 + s1 * .4 + t1 + 20); g.globalAlpha = 1; }
    } else {
      g.textAlign = "center";
      var maxS = { board: 170, wide: 160, post: 120 }[kind];
      var s = fit(g, name, W - pad * 2, maxS, "{s}px " + DISPLAY);
      var y = H / 2 + s * .32 - (tag ? s * .3 : 0);
      g.fillText(name, W / 2, y);
      if (tag){ var t = fit(g, tag, W - pad * 2, Math.round(s * .34), "600 {s}px " + BODY); g.globalAlpha = .85; g.fillText(tag, W / 2, y + t + s * .32); g.globalAlpha = 1; }
    }
    g.globalAlpha = .7; g.textAlign = "right"; g.font = "700 " + Math.round(Math.min(W, H) * .035) + "px " + BODY;
    g.fillText("Set your brand in motion", W - pad * .6, H - pad * .5);
    return a;
  }

  /* ---------- perspective warp: map the flat ad onto the 4 corners ---------- */
  function homography(q, W, H){
    var s = [[0,0],[W,0],[W,H],[0,H]], A = [], b = [];
    for (var i = 0; i < 4; i++){
      var x = s[i][0], y = s[i][1], u = q[i][0], v = q[i][1];
      A.push([x, y, 1, 0, 0, 0, -u*x, -u*y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v*x, -v*y]); b.push(v);
    }
    for (var c = 0; c < 8; c++){
      var p = c; for (var r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      var tA = A[c]; A[c] = A[p]; A[p] = tA; var tb = b[c]; b[c] = b[p]; b[p] = tb;
      for (r = c + 1; r < 8; r++){ var f = A[r][c] / A[c][c]; for (var k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    var h = new Array(8);
    for (r = 7; r >= 0; r--){ var sum = b[r]; for (k = r + 1; k < 8; k++) sum -= A[r][k] * h[k]; h[r] = sum / A[r][r]; }
    return function(x, y){ var d = h[6]*x + h[7]*y + 1; return [(h[0]*x + h[1]*y + h[2]) / d, (h[3]*x + h[4]*y + h[5]) / d]; };
  }
  function tri(img, s0, s1, s2, d0, d1, d2){
    var cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3;
    var grow = function(p){ var dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * .9, p[1] + dy / l * .9]; };
    var e0 = grow(d0), e1 = grow(d1), e2 = grow(d2);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(e0[0], e0[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.closePath(); ctx.clip();
    var den = s0[0]*(s1[1]-s2[1]) + s1[0]*(s2[1]-s0[1]) + s2[0]*(s0[1]-s1[1]);
    var a = (d0[0]*(s1[1]-s2[1]) + d1[0]*(s2[1]-s0[1]) + d2[0]*(s0[1]-s1[1])) / den;
    var b = (d0[1]*(s1[1]-s2[1]) + d1[1]*(s2[1]-s0[1]) + d2[1]*(s0[1]-s1[1])) / den;
    var c = (d0[0]*(s2[0]-s1[0]) + d1[0]*(s0[0]-s2[0]) + d2[0]*(s1[0]-s0[0])) / den;
    var d = (d0[1]*(s2[0]-s1[0]) + d1[1]*(s0[0]-s2[0]) + d2[1]*(s1[0]-s0[0])) / den;
    var e = (d0[0]*(s1[0]*s2[1]-s2[0]*s1[1]) + d1[0]*(s2[0]*s0[1]-s0[0]*s2[1]) + d2[0]*(s0[0]*s1[1]-s1[0]*s0[1])) / den;
    var f = (d0[1]*(s1[0]*s2[1]-s2[0]*s1[1]) + d1[1]*(s2[0]*s0[1]-s0[0]*s2[1]) + d2[1]*(s0[0]*s1[1]-s1[0]*s0[1])) / den;
    ctx.setTransform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  function warp(ad, q){
    var W = ad.width, H = ad.height, map = homography(q, W, H), N = 14;
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++){
      var x0 = W*i/N, x1 = W*(i+1)/N, y0 = H*j/N, y1 = H*(j+1)/N;
      var p00 = map(x0,y0), p10 = map(x1,y0), p11 = map(x1,y1), p01 = map(x0,y1);
      tri(ad, [x0,y0],[x1,y0],[x1,y1], p00,p10,p11);
      tri(ad, [x0,y0],[x1,y1],[x0,y1], p00,p11,p01);
    }
  }

  /* ---------- draw ---------- */
  var drawing = 0;
  function draw(){
    var id = ++drawing, sc = SCENES[state.scene];
    load(state.scene).then(function(photo){
      if (id !== drawing) return;
      cv.width = sc.w; cv.height = sc.h;
      cv.classList.toggle("tall", sc.h > sc.w);
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(photo, 0, 0);
      warp(drawAd(sc.kind), sc.quad);
      /* soft light so it sits in the photo */
      var q = sc.quad;
      ctx.save(); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (var k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath(); ctx.clip();
      var sh = ctx.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]);
      sh.addColorStop(0, "rgba(255,255,255,.10)"); sh.addColorStop(.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,.18)");
      ctx.fillStyle = sh; ctx.fillRect(0, 0, sc.w, sc.h); ctx.restore();
      if (sc.kind === "post"){
        /* replace the handle under the post */
        ctx.fillStyle = "#121212"; ctx.fillRect(642, 505, 230, 30);
        ctx.fillStyle = "#fff"; ctx.font = "600 15px " + BODY; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText("@" + ((state.name || "yourbrand").toLowerCase().replace(/[^a-z0-9_.]/g, "") || "yourbrand"), 647, 520);
      }
      cv.setAttribute("aria-label", (state.img ? "Your ad" : (state.name || "Your brand")) + " shown on a " + ({ unipole: "roadside billboard", gantry: "highway billboard", mall: "mall screen", phone: "phone feed" })[state.scene]);
    });
  }

  /* ---------- controls ---------- */
  $("sName").addEventListener("input", function(e){ state.name = e.target.value; draw(); });
  $("sTag").addEventListener("input", function(e){ state.tag = e.target.value; draw(); });
  var sw = document.querySelectorAll(".swatch");
  function setColor(c){ state.color = c; $("sColor").value = c; sw.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.c.toLowerCase() === c.toLowerCase()); }); draw(); }
  sw.forEach(function(b){ b.addEventListener("click", function(){ setColor(b.dataset.c); }); });
  $("sColor").addEventListener("input", function(e){ setColor(e.target.value); });

  document.querySelectorAll("#sceneSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      state.scene = b.dataset.scene;
      document.querySelectorAll("#sceneSeg button").forEach(function(x){ x.setAttribute("aria-pressed", x === b); });
      draw();
    });
  });

  $("sFile").addEventListener("change", function(e){
    var f = e.target.files[0]; if (!f || !/^image\//.test(f.type)) return;
    var im = new Image();
    im.onload = function(){ state.img = im; $("upLabel").textContent = f.name.length > 22 ? f.name.slice(0, 20) + "…" : f.name; $("clearFile").hidden = false; draw(); };
    im.src = URL.createObjectURL(f);
  });
  $("clearFile").addEventListener("click", function(){ state.img = null; $("sFile").value = ""; $("upLabel").textContent = "Upload image"; this.hidden = true; draw(); });

  $("sDownload").addEventListener("click", function(){
    try {
      cv.toBlob(function(blob){
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-brand-motionhouse.png"; a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
      });
    } catch (err) {}
  });
  $("sPlan").addEventListener("click", function(e){
    var n = state.name.trim();
    e.currentTarget.href = "contact.html" + (n ? "?brand=" + encodeURIComponent(n) : "");
  });

  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
