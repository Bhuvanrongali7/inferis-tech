/* =========================================================================
   INFERIS — About scroll scene: "Anything is possible"
   A single cloud of particles morphs between forms as you scroll:
   sphere -> cube grid -> torus knot -> wordmark plane. Represents raw
   potential taking any shape. Exposes window.InferisScene.setProgress(0..1).
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
    var camera = new THREE.PerspectiveCamera(50, s.w/s.h, 0.1, 100);
    camera.position.set(0, 0, 12);

    var group = new THREE.Group(); scene.add(group);

    var N = reduce ? 1200 : 4000;

    // ---- Build several shape targets (each: Float32Array of N*3) ----
    function sphereShape() {
      var a = new Float32Array(N*3);
      for (var i=0;i<N;i++){ var r=4.2; var th=Math.random()*Math.PI*2; var ph=Math.acos(2*Math.random()-1);
        a[i*3]=r*Math.sin(ph)*Math.cos(th); a[i*3+1]=r*Math.sin(ph)*Math.sin(th); a[i*3+2]=r*Math.cos(ph); }
      return a;
    }
    function cubeShape() {
      var a = new Float32Array(N*3); var side=7;
      for (var i=0;i<N;i++){ // points on cube surface
        var face=Math.floor(Math.random()*6); var u=(Math.random()-0.5)*side; var v=(Math.random()-0.5)*side; var h=side/2;
        var x,y,z;
        if(face===0){x=h;y=u;z=v;} else if(face===1){x=-h;y=u;z=v;}
        else if(face===2){x=u;y=h;z=v;} else if(face===3){x=u;y=-h;z=v;}
        else if(face===4){x=u;y=v;z=h;} else {x=u;y=v;z=-h;}
        a[i*3]=x; a[i*3+1]=y; a[i*3+2]=z;
      }
      return a;
    }
    function knotShape() {
      var geo = new THREE.TorusKnotGeometry(3, 0.95, 220, 26, 2, 3);
      var pos = geo.attributes.position; var c = pos.count; var a = new Float32Array(N*3);
      for (var i=0;i<N;i++){ var j=Math.floor(Math.random()*c); a[i*3]=pos.getX(j); a[i*3+1]=pos.getY(j); a[i*3+2]=pos.getZ(j); }
      geo.dispose(); return a;
    }
    function ringsShape() {
      var a = new Float32Array(N*3);
      for (var i=0;i<N;i++){ var ring=i%3; var rad=2+ring*1.6; var ang=Math.random()*Math.PI*2;
        var tilt=ring*0.7;
        var x=Math.cos(ang)*rad; var y=Math.sin(ang)*rad*Math.cos(tilt); var z=Math.sin(ang)*rad*Math.sin(tilt);
        a[i*3]=x; a[i*3+1]=y+ (Math.random()-0.5)*0.3; a[i*3+2]=z; }
      return a;
    }

    var SHAPES = [sphereShape(), cubeShape(), knotShape(), ringsShape()];
    var SEG = SHAPES.length - 1; // morph segments

    // current positions start at shape 0
    var cur = new Float32Array(N*3); cur.set(SHAPES[0]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
    // per-point color along gradient
    var col = new Float32Array(N*3);
    var cA = new THREE.Color(0x22d3ee), cB = new THREE.Color(0xe879f9), cM = new THREE.Color(0x8b5cf6), tmp = new THREE.Color();
    for (var i=0;i<N;i++){ var f=i/N; tmp.copy(cA).lerp(cM, f).lerp(cB, f*0.5); col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b; }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    var points = new THREE.Points(geo, mat);
    group.add(points);

    // faint connecting core glow
    var coreGlow = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x4f7cff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite:false }));
    group.add(coreGlow);

    scene.add(new THREE.AmbientLight(0x39426e, 1.0));

    // ---- State ----
    var progress = 0, shown = 0;
    api.setProgress = function(p){ progress = Math.max(0, Math.min(1, p)); };
    var tx=0,ty=0,mx=0,my=0;
    addEventListener("mousemove", function(ev){ tx=ev.clientX/innerWidth-0.5; ty=ev.clientY/innerHeight-0.5; });
    addEventListener("resize", function(){ s=size(); camera.aspect=s.w/s.h; camera.updateProjectionMatrix(); renderer.setSize(s.w,s.h,false); });

    function ease(x){ return x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
    var clock = new THREE.Clock();
    var arr = geo.attributes.position.array;

    function loop(){
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      shown += (progress - shown) * 0.06;
      mx += (tx-mx)*0.05; my += (ty-my)*0.05;

      // which segment + local blend
      var seg = Math.min(SEG - 1, Math.floor(shown * SEG));
      var local = ease(Math.min(1, Math.max(0, shown * SEG - seg)));
      var A = SHAPES[seg], B = SHAPES[seg + 1];

      for (var i=0;i<N*3;i++){
        var target = A[i] + (B[i] - A[i]) * local;
        // breathing turbulence
        arr[i] += (target - arr[i]) * 0.12;
      }
      // add subtle shimmer
      for (var p=0;p<N;p++){
        arr[p*3]   += Math.sin(t*1.5 + p*0.7) * 0.004;
        arr[p*3+1] += Math.cos(t*1.3 + p*0.5) * 0.004;
      }
      geo.attributes.position.needsUpdate = true;

      group.rotation.y = t * 0.12 + mx * 0.8;
      group.rotation.x = my * 0.5 + Math.sin(t*0.3)*0.05;
      mat.opacity = 0.85;
      coreGlow.scale.setScalar(1 + Math.sin(t*1.2)*0.08);
      camera.position.z = 13 - ease(shown) * 2;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
