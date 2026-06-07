/* =========================================================================
   INFERIS — Work scroll scene: "Portfolio Corridor"
   As scroll progresses, the camera flies forward through a corridor of
   floating project screens. Panels glow as you pass them; light streaks
   convey motion. Exposes window.InferisScene.setProgress(0..1).
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

    var GRADS = [[0x22d3ee,0x4f7cff],[0xa855f7,0x6366f1],[0xf472b6,0xa855f7],[0x34d399,0x22d3ee],[0x4f7cff,0x8b5cf6],[0xe879f9,0x4f7cff]];

    function size(){ return { w: canvas.clientWidth||innerWidth, h: canvas.clientHeight||innerHeight }; }
    var s = size();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(s.w, s.h, false);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06070d, 0.035);
    var camera = new THREE.PerspectiveCamera(60, s.w/s.h, 0.1, 200);

    var world = new THREE.Group(); scene.add(world);

    // ---- Panels along the corridor ----
    var PANELS = [];
    var COUNT = reduce ? 8 : 14;
    var GAP = 7;                 // z spacing
    for (var i = 0; i < COUNT; i++) {
      var g = GRADS[i % GRADS.length];
      var side = (i % 2 === 0) ? -1 : 1;
      var w = 4.2 + (i % 3) * 0.6, h = 2.6 + (i % 2) * 0.5;
      var grp = new THREE.Group();
      var face = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ color: 0x0e1322, emissive: g[0], emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.4, transparent: true })
      );
      var edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
        new THREE.LineBasicMaterial({ color: g[0] })
      );
      // inner "screen rows" to read like a website
      var rows = new THREE.Group();
      for (var r = 0; r < 4; r++) {
        var rw = w * (0.7 - r * 0.08);
        var bar = new THREE.Mesh(new THREE.PlaneGeometry(rw, 0.12),
          new THREE.MeshBasicMaterial({ color: g[1], transparent: true, opacity: 0.55 }));
        bar.position.set(-(w/2) + rw/2 + 0.3, h/2 - 0.55 - r * 0.42, 0.02);
        rows.add(bar);
      }
      grp.add(face); grp.add(edge); grp.add(rows);
      grp.position.set(side * (2.6 + (i%3)*0.4), (i % 3 - 1) * 1.1, -i * GAP - 4);
      grp.rotation.y = side * -0.5;
      world.add(grp);
      PANELS.push({ grp: grp, face: face, edge: edge, baseZ: grp.position.z, color: g[0] });
    }
    var TOTAL = COUNT * GAP;

    // ---- Motion streaks ----
    var SC = reduce ? 120 : 350;
    var sp = new Float32Array(SC*3);
    for (var k=0;k<SC;k++){ sp[k*3]=(Math.random()-0.5)*22; sp[k*3+1]=(Math.random()-0.5)*14; sp[k*3+2]=-Math.random()*TOTAL; }
    var streakGeo = new THREE.BufferGeometry(); streakGeo.setAttribute("position", new THREE.BufferAttribute(sp,3));
    var streaks = new THREE.Points(streakGeo, new THREE.PointsMaterial({ color: 0x9ab0ff, size: 0.06, transparent: true, opacity: 0.6, depthWrite:false }));
    scene.add(streaks);

    // ---- Lights ----
    scene.add(new THREE.AmbientLight(0x39426e, 1.2));
    var moving = new THREE.PointLight(0x4f7cff, 2.4, 30); scene.add(moving);
    var l2 = new THREE.PointLight(0xe879f9, 1.4, 40); l2.position.set(0,0,-TOTAL*0.5); scene.add(l2);

    // ---- State ----
    var progress = 0, shown = 0;
    api.setProgress = function(p){ progress = Math.max(0, Math.min(1, p)); };
    var tx=0,ty=0,mx=0,my=0;
    addEventListener("mousemove", function(ev){ tx=ev.clientX/innerWidth-0.5; ty=ev.clientY/innerHeight-0.5; });
    addEventListener("resize", function(){ s=size(); camera.aspect=s.w/s.h; camera.updateProjectionMatrix(); renderer.setSize(s.w,s.h,false); });

    function ease(x){ return x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
    var clock = new THREE.Clock();

    function loop(){
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.07;
      mx += (tx-mx)*0.05; my += (ty-my)*0.05;

      // fly forward through the corridor
      var camZ = 6 - ease(shown) * (TOTAL + 2);
      camera.position.set(mx * 1.6, -my * 1.2, camZ);
      camera.lookAt(mx * 0.5, -my * 0.4, camZ - 10);
      moving.position.set(0, 0, camZ - 2);

      // panel glow based on proximity to camera
      PANELS.forEach(function(p){
        var dist = Math.abs(p.baseZ - camZ);
        var near = Math.max(0, 1 - dist / 9);
        p.face.material.emissiveIntensity = 0.35 + near * 1.3;
        p.edge.material.opacity = 1;
        p.grp.position.y += Math.sin(t * 0.8 + p.baseZ) * 0.0015;
        p.grp.rotation.z = Math.sin(t * 0.4 + p.baseZ) * 0.02;
      });

      // recycle streaks forward for continuous motion
      var arr = streakGeo.attributes.position.array;
      for (var i=0;i<SC;i++){
        arr[i*3+2] += 0.0; // streaks are world-fixed; camera moves through them
      }
      streaks.rotation.z = t * 0.01;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
