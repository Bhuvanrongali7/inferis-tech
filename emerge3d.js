/* =========================================================================
   INFERIS — "From idea to reality" scroll scene
   A 3D monitor. As scroll progress goes 0 -> 1, particles stream OUT of the
   screen and floating UI panels rise and assemble into a built website.
   Exposes window.InferisEmerge.setProgress(0..1), driven by app.js ScrollTrigger.
   ========================================================================= */
(function () {
  "use strict";

  var api = { setProgress: function () {} };
  window.InferisEmerge = api;

  function init() {
    if (typeof THREE === "undefined") return;
    var canvas = document.getElementById("emerge3d");
    if (!canvas) return;

    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var CYAN = 0x22d3ee, BLUE = 0x4f7cff, VIOLET = 0x8b5cf6, MAG = 0xe879f9;

    function size() {
      return { w: canvas.clientWidth || window.innerWidth,
               h: canvas.clientHeight || window.innerHeight };
    }
    var s = size();

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(s.w, s.h, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, s.w / s.h, 0.1, 100);
    camera.position.set(0, 0.6, 13);
    camera.lookAt(0, 0.4, 0);

    var world = new THREE.Group();
    scene.add(world);

    // ---------- Monitor ----------
    var monitor = new THREE.Group();
    world.add(monitor);

    var SCREEN_W = 6.2, SCREEN_H = 3.8;
    // frame
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x10131f, metalness: 0.7, roughness: 0.4 });
    var frame = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.5, SCREEN_H + 0.5, 0.3), frameMat);
    monitor.add(frame);
    // screen (emissive)
    var screenMat = new THREE.MeshStandardMaterial({ color: 0x0a0e1c, emissive: BLUE, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.3 });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
    screen.position.z = 0.16;
    monitor.add(screen);
    // stand
    var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16), frameMat);
    stand.position.y = -(SCREEN_H / 2 + 0.8);
    monitor.add(stand);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 0.12, 24), frameMat);
    base.position.y = -(SCREEN_H / 2 + 1.4);
    monitor.add(base);

    // ---------- Emerging particles ----------
    var N = reduce ? 350 : 1100;
    var start = new Float32Array(N * 3);
    var target = new Float32Array(N * 3);
    var pos = new Float32Array(N * 3);
    var seed = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      // start: scattered across the screen surface
      start[i*3]   = (Math.random() - 0.5) * SCREEN_W * 0.9;
      start[i*3+1] = (Math.random() - 0.5) * SCREEN_H * 0.9;
      start[i*3+2] = 0.2;
      // target: a glowing cloud in front of + around the monitor
      var r = 2.5 + Math.random() * 4.5;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      target[i*3]   = r * Math.sin(ph) * Math.cos(th);
      target[i*3+1] = r * Math.sin(ph) * Math.sin(th) * 0.7 + 0.4;
      target[i*3+2] = Math.abs(r * Math.cos(ph)) * 0.8 + 0.5; // bias toward camera
      pos[i*3] = start[i*3]; pos[i*3+1] = start[i*3+1]; pos[i*3+2] = start[i*3+2];
      seed[i] = Math.random();
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var pMat = new THREE.PointsMaterial({ color: CYAN, size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    var points = new THREE.Points(pGeo, pMat);
    world.add(points);

    // ---------- Floating "built" panels ----------
    var panels = [];
    function makePanel(w, h, color, ox, oy, oz) {
      var g = new THREE.Group();
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ color: 0x0e1322, emissive: color, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.95 })
      );
      var edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
        new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.9 })
      );
      g.add(m); g.add(edge);
      g.userData = { ox: ox, oy: oy, oz: oz };
      g.scale.set(0.01, 0.01, 0.01);
      world.add(g);
      panels.push(g);
      return g;
    }
    makePanel(2.6, 1.6, CYAN,   -3.4, 1.3, 2.2);
    makePanel(2.2, 2.6, VIOLET,  3.3, 0.2, 1.4);
    makePanel(3.0, 1.2, MAG,    -2.2,-1.7, 3.0);
    makePanel(1.6, 1.6, BLUE,    2.0, 2.0, 3.2);

    // ---------- Lights ----------
    scene.add(new THREE.AmbientLight(0x3a4474, 1.1));
    var lA = new THREE.PointLight(CYAN, 2.2, 50); lA.position.set(5, 4, 8); scene.add(lA);
    var lB = new THREE.PointLight(MAG, 1.8, 50); lB.position.set(-6, -3, 6); scene.add(lB);
    var lScreen = new THREE.PointLight(BLUE, 1.5, 30); lScreen.position.set(0, 0.4, 2); scene.add(lScreen);

    // ---------- State ----------
    var progress = 0, shown = 0;
    api.setProgress = function (p) { progress = Math.max(0, Math.min(1, p)); };

    var mx = 0, tx = 0, my = 0, ty = 0;
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    });

    function onResize() {
      s = size();
      camera.aspect = s.w / s.h; camera.updateProjectionMatrix();
      renderer.setSize(s.w, s.h, false);
    }
    window.addEventListener("resize", onResize);

    function easeInOut(x){ return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2,2)/2; }

    var clock = new THREE.Clock();
    var posAttr = pGeo.attributes.position;

    function loop() {
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.08;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

      // ----- phase mapping -----
      // 0.00-0.45 : particles stream out of screen
      // 0.35-1.00 : panels assemble
      var emit = easeInOut(Math.min(1, shown / 0.5));
      var assemble = easeInOut(Math.max(0, (shown - 0.4) / 0.6));

      // particles travel from screen -> cloud, with a little turbulence
      for (var i = 0; i < N; i++) {
        var k = emit * (0.6 + seed[i] * 0.4);
        if (k > 1) k = 1;
        var wob = Math.sin(t * 1.5 + seed[i] * 6.28) * 0.15 * emit;
        posAttr.array[i*3]   = start[i*3]   + (target[i*3]   - start[i*3])   * k + wob;
        posAttr.array[i*3+1] = start[i*3+1] + (target[i*3+1] - start[i*3+1]) * k + wob;
        posAttr.array[i*3+2] = start[i*3+2] + (target[i*3+2] - start[i*3+2]) * k;
      }
      posAttr.needsUpdate = true;
      pMat.opacity = 0.12 + emit * 0.5 * (1 - assemble * 0.4);
      pMat.size = 0.05 + emit * 0.05;

      // screen glow intensifies then settles (kept moderate so copy stays readable)
      screenMat.emissiveIntensity = 0.2 + emit * 0.5;
      lScreen.intensity = 1.0 + emit * 1.4;

      // panels rise from the screen position to their target, scale up
      for (var j = 0; j < panels.length; j++) {
        var pn = panels[j];
        var d = pn.userData;
        var a = easeInOut(Math.max(0, Math.min(1, (assemble - j * 0.08) / (1 - 0.24))));
        var sc = 0.01 + a * 0.99;
        pn.scale.set(sc, sc, sc);
        pn.position.x = d.ox * a;
        pn.position.y = d.oy * a;
        pn.position.z = (0.2) + (d.oz - 0.2) * a;
        pn.rotation.y = (1 - a) * 0.8 + mx * 0.3;
        pn.rotation.x = my * 0.2 + Math.sin(t * 0.6 + j) * 0.04 * a;
        pn.children[0].material.opacity = 0.95 * a;
        pn.children[1].material.opacity = 0.9 * a;
      }

      // whole world subtle tilt + camera ease in
      world.rotation.y = mx * 0.4 + Math.sin(t * 0.2) * 0.05;
      world.rotation.x = my * 0.2;
      camera.position.z = 13 - shown * 1.2;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
