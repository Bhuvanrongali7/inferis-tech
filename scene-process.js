/* =========================================================================
   INFERIS — Process scroll scene: "The Journey"
   The camera travels along a glowing 3D path through 4 waypoints
   (Discovery -> Design -> Build -> Launch). Waypoints ignite as you reach
   them. Exposes window.InferisScene.setProgress(0..1).
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
    var WP_COLORS = [CYAN, BLUE, VIOLET, MAG];

    function size(){ return { w: canvas.clientWidth||innerWidth, h: canvas.clientHeight||innerHeight }; }
    var s = size();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(s.w, s.h, false);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06070d, 0.022);
    var camera = new THREE.PerspectiveCamera(62, s.w/s.h, 0.1, 300);

    // ---- The path ----
    var pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-8, 3, -14),
      new THREE.Vector3(7, -2, -30),
      new THREE.Vector3(-5, 4, -48),
      new THREE.Vector3(6, 1, -64),
      new THREE.Vector3(0, 0, -80)
    ];
    var curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);

    var tubeGeo = new THREE.TubeGeometry(curve, 240, 0.08, 12, false);
    var tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: 0x4f7cff, transparent: true, opacity: 0.5 }));
    scene.add(tube);
    // outer glow tube
    var glowTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.22, 12, false),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(glowTube);

    // ---- Waypoints along the curve ----
    var WP = [];
    var wpAt = [0.12, 0.38, 0.64, 0.9];
    var labels = ["Discovery", "Design", "Build", "Launch"];
    wpAt.forEach(function (u, i) {
      var p = curve.getPointAt(u);
      var col = WP_COLORS[i];
      var g = new THREE.Group();
      var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.25 }));
      var ringGeo = new THREE.TorusGeometry(1.1, 0.04, 12, 48);
      var ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 }));
      var halo = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(core); g.add(ring); g.add(halo);
      g.position.copy(p);
      scene.add(g);
      WP.push({ g: g, core: core, ring: ring, halo: halo, u: u, color: col });
    });

    // ---- Flowing particles along path ----
    var FP = reduce ? 120 : 320;
    var fp = new Float32Array(FP*3); var fpu = new Float32Array(FP);
    for (var i=0;i<FP;i++){ fpu[i]=Math.random(); var p=curve.getPointAt(fpu[i]); fp[i*3]=p.x+(Math.random()-0.5)*0.6; fp[i*3+1]=p.y+(Math.random()-0.5)*0.6; fp[i*3+2]=p.z+(Math.random()-0.5)*0.6; }
    var fGeo = new THREE.BufferGeometry(); fGeo.setAttribute("position", new THREE.BufferAttribute(fp,3));
    var flow = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0x9fe9ff, size: 0.08, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite:false }));
    scene.add(flow);

    // ---- Ambient stars ----
    var ST = reduce ? 150 : 500; var sp = new Float32Array(ST*3);
    for (var k=0;k<ST;k++){ sp[k*3]=(Math.random()-0.5)*80; sp[k*3+1]=(Math.random()-0.5)*50; sp[k*3+2]=-Math.random()*90+5; }
    var stGeo = new THREE.BufferGeometry(); stGeo.setAttribute("position", new THREE.BufferAttribute(sp,3));
    scene.add(new THREE.Points(stGeo, new THREE.PointsMaterial({ color: 0x4a5680, size: 0.06, transparent:true, opacity:0.6, depthWrite:false })));

    // ---- Lights ----
    scene.add(new THREE.AmbientLight(0x39426e, 1.2));
    var travelLight = new THREE.PointLight(0x6fb6ff, 2.4, 24); scene.add(travelLight);

    // ---- State ----
    var progress = 0, shown = 0;
    api.setProgress = function(p){ progress = Math.max(0, Math.min(1, p)); };
    var tx=0,ty=0,mx=0,my=0;
    addEventListener("mousemove", function(ev){ tx=ev.clientX/innerWidth-0.5; ty=ev.clientY/innerHeight-0.5; });
    addEventListener("resize", function(){ s=size(); camera.aspect=s.w/s.h; camera.updateProjectionMatrix(); renderer.setSize(s.w,s.h,false); });

    var clock = new THREE.Clock();
    var up = new THREE.Vector3(0,1,0);

    function loop(){
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.06;
      mx += (tx-mx)*0.05; my += (ty-my)*0.05;

      // travel the curve; keep camera a bit behind the leading point
      var u = Math.min(0.999, Math.max(0.001, shown * 0.92 + 0.02));
      var camPos = curve.getPointAt(Math.max(0, u - 0.06));
      var look = curve.getPointAt(Math.min(1, u + 0.04));
      // offset camera up/side so the path is visible ahead
      camera.position.set(camPos.x + mx * 2.2, camPos.y + 1.4 - my * 1.5, camPos.z + 2.2);
      camera.up.copy(up);
      camera.lookAt(look.x, look.y, look.z);
      travelLight.position.set(camPos.x, camPos.y, camPos.z);

      // waypoints ignite as we pass
      WP.forEach(function(w){
        var reached = shown >= (w.u - 0.04);
        var a = reached ? Math.min(1, (shown - (w.u - 0.04)) / 0.08) : 0;
        var pulse = 1 + Math.sin(t * 2 + w.u * 10) * 0.08;
        w.core.material.emissiveIntensity = 0.4 + a * 1.4;
        w.core.scale.setScalar(0.6 + a * 0.5 * pulse);
        w.ring.rotation.z = t * 0.6; w.ring.rotation.x = t * 0.3;
        w.ring.material.opacity = 0.2 + a * 0.6;
        w.ring.scale.setScalar(0.7 + a * 0.5);
        w.halo.material.opacity = a * 0.3 * (0.7 + Math.sin(t*2)*0.3);
        w.g.rotation.y = t * 0.3;
      });

      // flow particles drift forward along path
      var arr = fGeo.attributes.position.array;
      for (var i=0;i<FP;i++){
        fpu[i] += 0.0009; if (fpu[i] > 1) fpu[i] -= 1;
        var pp = curve.getPointAt(fpu[i]);
        arr[i*3]   = pp.x + Math.sin(t + i) * 0.25;
        arr[i*3+1] = pp.y + Math.cos(t * 0.8 + i) * 0.25;
        arr[i*3+2] = pp.z;
      }
      fGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
