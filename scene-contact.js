/* =========================================================================
   INFERIS — Contact scroll scene: "Signal Wave"
   A flowing grid of points ripples like a signal field; as you scroll the
   waves build energy and color shifts toward magenta. Reacts to the mouse
   like a ripple in water. Exposes window.InferisScene.setProgress(0..1).
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

    function size(){ return { w: canvas.clientWidth||innerWidth, h: canvas.clientHeight||innerHeight }; }
    var s = size();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(s.w, s.h, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, s.w/s.h, 0.1, 100);
    camera.position.set(0, 5.5, 9);
    camera.lookAt(0, 0, -2);

    var group = new THREE.Group(); scene.add(group);

    // ---- Wave grid of points ----
    var GX = reduce ? 50 : 90, GZ = reduce ? 40 : 70;
    var SPX = 0.42, SPZ = 0.42;
    var N = GX * GZ;
    var base = new Float32Array(N*3);
    var pos = new Float32Array(N*3);
    var col = new Float32Array(N*3);
    var idx = 0;
    for (var z=0; z<GZ; z++){
      for (var x=0; x<GX; x++){
        var px = (x - GX/2) * SPX;
        var pz = (z - GZ/2) * SPZ;
        base[idx*3]=px; base[idx*3+1]=0; base[idx*3+2]=pz;
        pos[idx*3]=px; pos[idx*3+1]=0; pos[idx*3+2]=pz;
        col[idx*3]=0.13; col[idx*3+1]=0.83; col[idx*3+2]=0.93;
        idx++;
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    var grid = new THREE.Points(geo, mat);
    group.add(grid);

    scene.add(new THREE.AmbientLight(0x39426e, 1.0));

    // ---- State ----
    var progress = 0, shown = 0;
    api.setProgress = function(p){ progress = Math.max(0, Math.min(1, p)); };
    var mxN = 0, myN = 0, tmx = 0, tmy = 0;
    addEventListener("mousemove", function(ev){ tmx = ev.clientX/innerWidth - 0.5; tmy = ev.clientY/innerHeight - 0.5; });
    addEventListener("resize", function(){ s=size(); camera.aspect=s.w/s.h; camera.updateProjectionMatrix(); renderer.setSize(s.w,s.h,false); });

    var cCyan = new THREE.Color(0x22d3ee), cViolet = new THREE.Color(0x8b5cf6), cMag = new THREE.Color(0xe879f9), tcol = new THREE.Color();
    var clock = new THREE.Clock();
    var arr = geo.attributes.position.array;
    var carr = geo.attributes.color.array;

    function loop(){
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.06;
      mxN += (tmx - mxN) * 0.05; myN += (tmy - myN) * 0.05;

      var amp = 0.35 + shown * 1.4;        // wave height grows with scroll
      var mouseX = mxN * (GX*SPX);          // mouse ripple center
      var mouseZ = myN * (GZ*SPZ);

      for (var i=0;i<N;i++){
        var bx = base[i*3], bz = base[i*3+2];
        var d = Math.sqrt(bx*bx + bz*bz);
        var dm = Math.sqrt((bx-mouseX)*(bx-mouseX) + (bz-mouseZ)*(bz-mouseZ));
        var y = Math.sin(d * 0.7 - t * 1.8) * amp * 0.6
              + Math.sin(bx * 0.4 + t * 1.2) * amp * 0.3
              + Math.cos(bz * 0.5 - t * 1.0) * amp * 0.3
              + Math.sin(dm * 1.1 - t * 3.0) * Math.max(0, 1 - dm * 0.12) * 1.2; // mouse ripple
        arr[i*3+1] = y;
        // color by height
        var h = (y / (amp + 1.4)) * 0.5 + 0.5;
        tcol.copy(cCyan).lerp(cViolet, h).lerp(cMag, shown * 0.5 * h);
        carr[i*3]=tcol.r; carr[i*3+1]=tcol.g; carr[i*3+2]=tcol.b;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;

      group.rotation.y = mxN * 0.3 + Math.sin(t*0.1)*0.05;
      camera.position.x = mxN * 1.5;
      camera.position.y = 5.5 - shown * 1.4;
      camera.lookAt(0, 0, -2);

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
