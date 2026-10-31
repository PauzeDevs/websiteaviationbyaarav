import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const canvas = document.querySelector('#aircraft-canvas');
const stage = document.querySelector('#aircraft-stage');
if (canvas && stage) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, stage.clientWidth / stage.clientHeight, .1, 100);
  camera.position.set(0, 3.1, 13.5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xc7e4ff, 0x101a2a, 2.0));
  const key = new THREE.DirectionalLight(0xf2f8ff, 3.4);
  key.position.set(-5, 7, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x68b9ff, 3.1);
  rim.position.set(6, 2, -7); scene.add(rim);
  const under = new THREE.PointLight(0x367fc1, 24, 18);
  under.position.set(0, -3, 1); scene.add(under);

  const aircraft = new THREE.Group();
  scene.add(aircraft);
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xdce9f5, metalness: .62, roughness: .27, clearcoat: .8, clearcoatRoughness: .2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263d56, metalness: .72, roughness: .32 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x142b43, metalness: .42, roughness: .12, clearcoat: 1 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x79bfff, metalness: .55, roughness: .23, emissive: 0x102c49, emissiveIntensity: .45 });

  function mesh(geometry, material, parent=aircraft) {
    const item = new THREE.Mesh(geometry, material);
    item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
  }
  function cylinderBetween(radiusA, radiusB, length, material, x, y, z, rotationX=Math.PI/2) {
    const item = mesh(new THREE.CylinderGeometry(radiusA, radiusB, length, 32, 1, false), material);
    item.position.set(x,y,z); item.rotation.x=rotationX; return item;
  }

  // Smooth tapered fuselage, nose pointing toward the viewer.
  const fuselageProfile = [
    new THREE.Vector2(0, -5.25), new THREE.Vector2(.10, -5.08), new THREE.Vector2(.28, -4.65),
    new THREE.Vector2(.43, -3.7), new THREE.Vector2(.49, -2.2), new THREE.Vector2(.50, 1.8),
    new THREE.Vector2(.46, 3.6), new THREE.Vector2(.34, 4.45), new THREE.Vector2(.12, 5.05),
    new THREE.Vector2(0, 5.2)
  ];
  const body = mesh(new THREE.LatheGeometry(fuselageProfile, 48), paint);
  body.rotation.x = Math.PI/2;
  // Cockpit glazing on the forward upper fuselage.
  const cockpit = mesh(new THREE.SphereGeometry(.39, 24, 12, 0, Math.PI*2, 0, Math.PI*.42), glass);
  cockpit.scale.set(1.02,.45,.78); cockpit.position.set(0,.36,4.36); cockpit.rotation.x=.15;

  // Wing planforms are extruded for a clean, solid silhouette.
  function wingShape(span, rootChord, tipChord, sweep) {
    const s = new THREE.Shape();
    s.moveTo(-.42, -rootChord*.48);
    s.lineTo(span, -rootChord*.48+sweep);
    s.lineTo(span, -rootChord*.48+sweep+tipChord);
    s.lineTo(.42, rootChord*.48);
    s.closePath();
    return new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.035});
  }
  const wings = mesh(wingShape(5.4,2.65,.55,1.25), paint);
  wings.rotation.x=Math.PI/2; wings.position.y=-.12;
  // Opposite wing half.
  const wing2=mesh(wingShape(5.4,2.65,.55,1.25),paint);
  wing2.rotation.x=Math.PI/2; wing2.rotation.z=Math.PI; wing2.position.y=-.12;

  // Horizontal stabilisers and upright tail.
  const tailGeo = wingShape(2.25,1.45,.42,.45);
  const tail=mesh(tailGeo,paint); tail.scale.set(.52,.52,.72); tail.rotation.x=Math.PI/2; tail.position.set(0,.1,-4.35);
  const finShape = new THREE.Shape();
  finShape.moveTo(0,0); finShape.lineTo(0,2.05); finShape.lineTo(.72,1.48); finShape.lineTo(.9,0); finShape.closePath();
  const fin=mesh(new THREE.ExtrudeGeometry(finShape,{depth:.13,bevelEnabled:true,bevelSegments:2,bevelSize:.04,bevelThickness:.035}),paint);
  fin.position.set(0,.25,-4.25);

  // Two turbofan nacelles, pylons and dark intakes.
  for (const side of [-1,1]) {
    const x=side*1.85;
    const engine=cylinderBetween(.48,.57,1.75,dark,x,-.48,.35);
    const intake=mesh(new THREE.TorusGeometry(.47,.075,12,36),accent);
    intake.position.set(x,-.48,.35); intake.rotation.x=Math.PI/2;
    const fan=mesh(new THREE.CylinderGeometry(.34,.34,.035,32),glass);
    fan.position.set(x,-.48,.39); fan.rotation.x=Math.PI/2;
    for(let i=0;i<8;i++){
      const blade=mesh(new THREE.BoxGeometry(.035,.025,.27),accent);
      blade.position.set(x+Math.cos(i*Math.PI/4)*.18,-.48+Math.sin(i*Math.PI/4)*.18,.415);
      blade.rotation.z=i*Math.PI/4;
    }
    const pylon=mesh(new THREE.BoxGeometry(.16,.55,.72),dark);
    pylon.position.set(x,-.24,.2);
    const gear=mesh(new THREE.CylinderGeometry(.045,.045,.8,12),dark);
    gear.position.set(side*3.7,-.12,-1.3); gear.rotation.z=side*.14;
  }

  // Subtle cabin windows along both visible sides.
  for (const side of [-1,1]) {
    for(let i=0;i<18;i++){
      const z=2.65-i*.34;
      const w=mesh(new THREE.SphereGeometry(.045,8,8),glass);
      w.scale.set(.55,1,.72); w.position.set(side*.475,.17,z);
    }
  }
  // Wingtip navigation lights.
  for (const side of [-1,1]) {
    const light=mesh(new THREE.SphereGeometry(.075,12,12),accent);
    light.position.set(side*5.15,-.04,-.65);
  }

  // A floating orbital ring and soft point field establish depth without visual noise.
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(6.1,.008,6,180), new THREE.MeshBasicMaterial({color:0x8fcaff,transparent:true,opacity:.22}));
  orbit.rotation.x=1.12; orbit.rotation.y=-.18; orbit.position.y=-.15; scene.add(orbit);
  const points = new THREE.BufferGeometry();
  const positions=[];
  for(let i=0;i<260;i++){positions.push((Math.random()-.5)*23,(Math.random()-.5)*13,(Math.random()-.5)*18-4);}
  points.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  scene.add(new THREE.Points(points,new THREE.PointsMaterial({color:0xaed8ff,size:.018,transparent:true,opacity:.48})));

  const pointer={x:0,y:0,tx:0,ty:0};
  stage.addEventListener('pointermove',e=>{
    const r=stage.getBoundingClientRect();
    pointer.tx=((e.clientX-r.left)/r.width-.5)*.7;
    pointer.ty=((e.clientY-r.top)/r.height-.5)*.28;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.tx=0;pointer.ty=0;},{passive:true});
  let frame=0;
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize); observer.observe(stage);
  function animate(){
    if(document.hidden){requestAnimationFrame(animate);return;}
    frame+=.006;
    pointer.x+=(pointer.tx-pointer.x)*.035; pointer.y+=(pointer.ty-pointer.y)*.035;
    aircraft.rotation.y=(reduced?-.18:Math.sin(frame*.7)*.12)+pointer.x;
    aircraft.rotation.x=-.035+pointer.y;
    aircraft.position.y=Math.sin(frame*.8)*.09;
    orbit.rotation.z=frame*.035;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('pagehide',()=>{observer.disconnect();renderer.dispose();},{once:true});
}
