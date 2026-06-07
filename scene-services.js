/* =========================================================================
   INFERIS — Services scroll scene: "Automation Network"
   As scroll progresses 0->1, nodes power on one-by-one, edges draw between
   them, and energy pulses flow along the connections — a system wiring
   itself together. Exposes window.InferisScene.setProgress(0..1).
   Renders onto #sceneCanvas. Relies on global THREE r128.
   ========================================================================= */
(function () {
  "use strict";
  var api = { setProgress: function () {} };
  window.InferisScene = api;

  function init() {
    if (typeof THREE === "undefined") return;
    var canvas = document.getElementById("sceneCanvas");
    if (!canvas) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var CYAN = 0x22d3ee, BLUE = 0x4f7cff, VIOLET = 0x8b5cf6, MAG = 0xe879f9;
    var COLORS = [CYAN, BLUE, VIOLET, MAG];

    function size() { return { w: canvas.clientWidth || innerWidth, h: canvas.clientHeight || innerHeight }; }
    var s = size();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(s.w, s.h, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, s.w / s.h, 0.1, 100);
    camera.position.set(0, 0, 14);

    var group = new THREE.Group();
    scene.add(group);

    // ---- Nodes ----
    var NODES = [];
    var hub = { pos: new THREE.Vector3(0, 0, 0), hub: true };
    NODES.push(hub);
    var N = reduce ? 9 : 15;
    for (var i = 0; i < N; i++) {
      var ring = 1 + (i % 3);            // 3 shells
      var ang = (i / N) * Math.PI * 2 * 1.7 + i * 0.5;
      var rad = 2.4 + ring * 1.7;
      NODES.push({
        pos: new THREE.Vector3(
          Math.cos(ang) * rad,
          (Math.sin(ang * 1.3) * 2.2) + (Math.random() - 0.5) * 1.5,
          Math.sin(ang) * rad * 0.6 + (Math.random() - 0.5) * 2
        ),
        hub: false
      });
    }

    // node meshes
    var nodeGeo = new THREE.IcosahedronGeometry(0.26, 0);
    var hubGeo = new THREE.IcosahedronGeometry(0.6, 1);
    NODES.forEach(function (n, idx) {
      var col = n.hub ? BLUE : COLORS[idx % COLORS.length];
      var mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.25 });
      var mesh = new THREE.Mesh(n.hub ? hubGeo : nodeGeo, mat);
      mesh.position.copy(n.pos);
      mesh.scale.setScalar(0.001);
      group.add(mesh);
      n.mesh = mesh; n.mat = mat; n.appear = n.hub ? 0 : (idx - 1) / N; // when it powers on
      // glow halo
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(n.hub ? 1.1 : 0.55, 16, 16),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      halo.position.copy(n.pos); group.add(halo); n.halo = halo;
    });

    // ---- Edges (each non-hub node connects to hub + maybe a neighbor) ----
    var EDGES = [];
    for (var e = 1; e < NODES.length; e++) {
      EDGES.push({ a: NODES[0], b: NODES[e], appear: NODES[e].appear });
      if (e > 1 && e % 2 === 0) EDGES.push({ a: NODES[e - 1], b: NODES[e], appear: NODES[e].appear });
    }
    // line geometry (positions updated for opacity via vertexColors not needed; we use one material w/ opacity)
    var linePositions = new Float32Array(EDGES.length * 2 * 3);
    EDGES.forEach(function (ed, k) {
      linePositions[k*6]   = ed.a.pos.x; linePositions[k*6+1] = ed.a.pos.y; linePositions[k*6+2] = ed.a.pos.z;
      linePositions[k*6+3] = ed.b.pos.x; linePositions[k*6+4] = ed.b.pos.y; linePositions[k*6+5] = ed.b.pos.z;
    });
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.0 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    // ---- Pulses traveling along edges ----
    var pulsePos = new Float32Array(EDGES.length * 3);
    var pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    var pulseMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
    var pulses = new THREE.Points(pulseGeo, pulseMat);
    group.add(pulses);

    // ---- Ambient particle dust ----
    var DUST = reduce ? 150 : 400;
    var dPos = new Float32Array(DUST * 3);
    for (var d = 0; d < DUST; d++) {
      dPos[d*3] = (Math.random()-0.5)*30; dPos[d*3+1] = (Math.random()-0.5)*20; dPos[d*3+2] = (Math.random()-0.5)*20;
    }
    var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x4a5680, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }));
    scene.add(dust);

    // ---- Lights ----
    scene.add(new THREE.AmbientLight(0x3a4474, 1.1));
    var l1 = new THREE.PointLight(CYAN, 2.0, 60); l1.position.set(8, 6, 10); scene.add(l1);
    var l2 = new THREE.PointLight(MAG, 1.6, 60); l2.position.set(-8, -5, 6); scene.add(l2);

    // ---- State ----
    var progress = 0, shown = 0;
    api.setProgress = function (p) { progress = Math.max(0, Math.min(1, p)); };
    var tx = 0, ty = 0, mx = 0, my = 0;
    addEventListener("mousemove", function (ev) { tx = ev.clientX / innerWidth - 0.5; ty = ev.clientY / innerHeight - 0.5; });
    addEventListener("resize", function () { s = size(); camera.aspect = s.w/s.h; camera.updateProjectionMatrix(); renderer.setSize(s.w, s.h, false); });

    function ease(x){ return x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
    var clock = new THREE.Clock();

    function loop() {
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.08;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

      // nodes power on
      NODES.forEach(function (n) {
        var a = ease(Math.max(0, Math.min(1, (shown - n.appear) / 0.18)));
        var base = n.hub ? 1.0 : 0.85;
        var pulse = 1 + Math.sin(t * 2 + n.pos.x) * 0.06;
        n.mesh.scale.setScalar(Math.max(0.001, a * base * pulse));
        n.mesh.rotation.y = t * 0.4; n.mesh.rotation.x = t * 0.2;
        n.mat.emissiveIntensity = 0.4 + a * 0.8;
        n.halo.material.opacity = a * 0.22 * (0.7 + Math.sin(t*2+n.pos.y)*0.3);
      });

      // edges draw
      var maxEdgeOpacity = 0.0;
      EDGES.forEach(function (ed) {
        var a = ease(Math.max(0, Math.min(1, (shown - ed.appear) / 0.2)));
        ed._a = a; if (a > maxEdgeOpacity) maxEdgeOpacity = a;
      });
      lineMat.opacity = 0.12 + maxEdgeOpacity * 0.38;

      // pulses along edges
      var anyPulse = 0;
      EDGES.forEach(function (ed, k) {
        var a = ed._a || 0;
        var ph = (t * 0.55 + k * 0.13) % 1;
        var x = ed.a.pos.x + (ed.b.pos.x - ed.a.pos.x) * ph;
        var y = ed.a.pos.y + (ed.b.pos.y - ed.a.pos.y) * ph;
        var z = ed.a.pos.z + (ed.b.pos.z - ed.a.pos.z) * ph;
        pulsePos[k*3] = x; pulsePos[k*3+1] = y; pulsePos[k*3+2] = z;
        if (a > 0.5) anyPulse = 1;
      });
      pulseGeo.attributes.position.needsUpdate = true;
      pulseMat.opacity = 0.2 + ease(shown) * 0.7;
      pulseMat.size = 0.12 + ease(shown) * 0.08;

      // rotate group
      group.rotation.y = t * 0.08 + mx * 0.6;
      group.rotation.x = my * 0.4 + Math.sin(t * 0.2) * 0.04;
      dust.rotation.y = t * 0.01;
      camera.position.z = 15 - ease(shown) * 3.2;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
