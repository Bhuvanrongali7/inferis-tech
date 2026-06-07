/* =========================================================================
   INFERIS — Hero 3D scene
   A glowing wireframe icosahedron "core" with an inner solid, an orbiting
   ring, and a deep particle field. Reacts to mouse + idle drift.
   No build step — relies on global THREE (r128) loaded via CDN.
   ========================================================================= */
(function () {
  "use strict";

  function init() {
    if (typeof THREE === "undefined") return;
    var canvas = document.getElementById("hero3d");
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
    var camera = new THREE.PerspectiveCamera(48, s.w / s.h, 0.1, 100);
    camera.position.set(0, 0, 9);

    var group = new THREE.Group();
    scene.add(group);

    // Inner solid core
    var coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var coreMat = new THREE.MeshStandardMaterial({
      color: BLUE, emissive: VIOLET, emissiveIntensity: 0.55,
      metalness: 0.9, roughness: 0.25, flatShading: true
    });
    var core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Wireframe shell
    var shellGeo = new THREE.IcosahedronGeometry(2.5, 1);
    var shellMat = new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.35 });
    var shell = new THREE.Mesh(shellGeo, shellMat);
    group.add(shell);

    // Orbiting ring of small cubes
    var ring = new THREE.Group();
    var cubeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    var cubeMat = new THREE.MeshStandardMaterial({ color: MAG, emissive: MAG, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.3 });
    var RING_N = 16, RING_R = 3.6;
    for (var i = 0; i < RING_N; i++) {
      var a = (i / RING_N) * Math.PI * 2;
      var c = new THREE.Mesh(cubeGeo, cubeMat);
      c.position.set(Math.cos(a) * RING_R, Math.sin(a) * 0.4, Math.sin(a) * RING_R);
      ring.add(c);
    }
    ring.rotation.x = 0.5;
    group.add(ring);

    // Particle field
    var PCOUNT = reduce ? 250 : 900;
    var pPos = new Float32Array(PCOUNT * 3);
    for (var p = 0; p < PCOUNT; p++) {
      var r = 6 + Math.random() * 14;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      pPos[p * 3]     = r * Math.sin(ph) * Math.cos(th);
      pPos[p * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pPos[p * 3 + 2] = r * Math.cos(ph);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({ color: 0x9ab0ff, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Lights
    scene.add(new THREE.AmbientLight(0x404a7a, 1.2));
    var l1 = new THREE.PointLight(CYAN, 2.4, 40); l1.position.set(6, 5, 6); scene.add(l1);
    var l2 = new THREE.PointLight(MAG, 2.0, 40); l2.position.set(-6, -4, 4); scene.add(l2);
    var l3 = new THREE.PointLight(VIOLET, 1.6, 40); l3.position.set(0, 6, -4); scene.add(l3);

    // Mouse
    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    });

    // Scroll parallax of the whole group
    var scrollY = 0;
    window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });

    function onResize() {
      s = size();
      camera.aspect = s.w / s.h; camera.updateProjectionMatrix();
      renderer.setSize(s.w, s.h, false);
    }
    window.addEventListener("resize", onResize);

    var clock = new THREE.Clock();
    function loop() {
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

      group.rotation.y = t * 0.15 + mx * 0.8;
      group.rotation.x = my * 0.6;
      core.rotation.x = t * 0.3; core.rotation.y = t * 0.2;
      shell.rotation.x = -t * 0.12; shell.rotation.y = t * 0.18;
      ring.rotation.z = t * 0.4;
      particles.rotation.y = t * 0.02;

      // gentle scale breathing
      var b = 1 + Math.sin(t * 1.2) * 0.03;
      core.scale.set(b, b, b);

      // push group right & down a touch as user scrolls into hero
      group.position.y = -scrollY * 0.0015;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
