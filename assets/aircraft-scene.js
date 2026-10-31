import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const canvas=document.querySelector('#aircraft-canvas');
const stage=document.querySelector('#aircraft-stage');

if(canvas&&stage){
  try{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'default'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.18;

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(38,1,.1,120);
    camera.position.set(5.2,4.0,18.5);
    camera.lookAt(0,0,0);

    scene.add(new THREE.HemisphereLight(0xd8edff,0x142033,2.1));
    const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(-6,8,10);scene.add(key);
    const rim=new THREE.DirectionalLight(0x65baff,2.8);rim.position.set(7,3,-8);scene.add(rim);
    const fill=new THREE.PointLight(0x3b8ed0,15,24);fill.position.set(0,-4,3);scene.add(fill);

    const aircraft=new THREE.Group();scene.add(aircraft);
    const finish=new THREE.MeshPhysicalMaterial({color:0xdce8f4,metalness:.32,roughness:.3,clearcoat:.85,clearcoatRoughness:.22});
    const engineMat=new THREE.MeshStandardMaterial({color:0x263c52,metalness:.55,roughness:.36});
    const windowMat=new THREE.MeshPhysicalMaterial({color:0x102940,metalness:.25,roughness:.14,clearcoat:1});
    const blue=new THREE.MeshStandardMaterial({color:0x82c5ff,emissive:0x12395c,emissiveIntensity:.35,metalness:.35,roughness:.25});
    function add(geo,mat,x=0,y=0,z=0,parent=aircraft){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}

    // Build around the fuselage's longitudinal Z axis.
    const profile=[new THREE.Vector2(0,-5.3),new THREE.Vector2(.12,-5.12),new THREE.Vector2(.3,-4.7),new THREE.Vector2(.43,-3.8),new THREE.Vector2(.48,-2),new THREE.Vector2(.48,2.7),new THREE.Vector2(.4,4),new THREE.Vector2(.22,4.8),new THREE.Vector2(0,5.15)];
    const fuselage=add(new THREE.LatheGeometry(profile,48),finish);fuselage.rotation.x=Math.PI/2;

    // Cockpit glazing and cabin windows.
    const cockpit=add(new THREE.SphereGeometry(.34,24,16),windowMat,0,.37,4.62);cockpit.scale.set(1.05,.48,.78);
    for(const side of [-1,1])for(let i=0;i<19;i++){
      const z=2.8-i*.34;
      const w=add(new THREE.SphereGeometry(.047,10,8),windowMat,side*.465,.18,z);w.scale.set(.55,1,.8);
    }

    // Swept wings with a single continuous profile on each side.
    function makeWing(side){
      const shape=new THREE.Shape();
      shape.moveTo(0,-1.25);shape.lineTo(side*5.25,-.1);shape.lineTo(side*5.25,.42);shape.lineTo(side*.5,1.3);shape.lineTo(0,1.3);shape.closePath();
      const wing=add(new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.025}),finish,0,-.12,0);
      wing.rotation.x=Math.PI/2;
    }
    makeWing(1);makeWing(-1);

    // Tailplane and vertical stabiliser.
    for(const side of [-1,1]){
      const tail=add(new THREE.BoxGeometry(2.45,.12,.82),finish,side*.92,.05,-4.45);
      tail.rotation.y=side*.16;
    }
    const fin=add(new THREE.BoxGeometry(.14,1.8,1.25),finish,0,.82,-4.35);fin.rotation.x=-.12;

    // Two turbofan engines under the wings.
    for(const side of [-1,1]){
      const x=side*1.85;
      const nacelle=add(new THREE.CylinderGeometry(.48,.54,1.65,32),engineMat,x,-.48,.15);nacelle.rotation.x=Math.PI/2;
      const lip=add(new THREE.TorusGeometry(.46,.065,12,36),blue,x,-.48,.99);lip.rotation.x=Math.PI/2;
      const intake=add(new THREE.CircleGeometry(.39,32),windowMat,x,-.48,1.005);intake.rotation.x=0;
      const pylon=add(new THREE.BoxGeometry(.18,.52,.7),engineMat,x,-.22,.05);
      const gear=add(new THREE.CylinderGeometry(.045,.045,.62,12),engineMat,side*3.65,-.38,-1.15);gear.rotation.z=side*.1;
    }

    // Small wingtip lights.
    for(const side of [-1,1])add(new THREE.SphereGeometry(.07,12,12),blue,side*5.12,-.02,.05);

    const planeBounds=new THREE.Box3().setFromObject(aircraft);
    const center=planeBounds.getCenter(new THREE.Vector3());aircraft.position.sub(center);
    aircraft.scale.setScalar(.88);

    const halo=new THREE.Mesh(new THREE.TorusGeometry(6.5,.009,6,180),new THREE.MeshBasicMaterial({color:0x8fcaff,transparent:true,opacity:.17}));
    halo.rotation.set(1.12,0,-.2);halo.position.y=-.2;scene.add(halo);

    const starsGeo=new THREE.BufferGeometry(),coords=[];
    for(let i=0;i<150;i++)coords.push((Math.random()-.5)*22,(Math.random()-.5)*12,(Math.random()-.5)*16-3);
    starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
    scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb6dcff,size:.018,transparent:true,opacity:.38})));

    const pointer={x:0,y:0,tx:0,ty:0};
    stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();pointer.tx=((e.clientX-r.left)/r.width-.5)*.42;pointer.ty=((e.clientY-r.top)/r.height-.5)*.2;},{passive:true});
    stage.addEventListener('pointerleave',()=>{pointer.tx=0;pointer.ty=0;},{passive:true});

    function resize(){
      const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight),aspect=w/h;
      renderer.setSize(w,h,false);camera.aspect=aspect;
      // Pull the camera back on portrait screens so both wingtips stay in frame.
      camera.position.z=aspect<1.05?22.5:aspect<1.45?19.5:17.5;
      camera.position.x=aspect<1.05?2.8:5.2;
      camera.position.y=aspect<1.05?3.3:4;
      camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    }
    const observer=new ResizeObserver(resize);observer.observe(stage);resize();

    let frame=0,raf=0;
    function animate(){
      if(document.hidden){raf=requestAnimationFrame(animate);return;}
      frame+=.006;
      pointer.x+=(pointer.tx-pointer.x)*.035;pointer.y+=(pointer.ty-pointer.y)*.035;
      aircraft.rotation.y=(reduced?-.12:Math.sin(frame*.55)*.08)+pointer.x;
      aircraft.rotation.x=-.025+pointer.y;
      aircraft.position.y=Math.sin(frame*.7)*.055;
      halo.rotation.z=frame*.018;
      renderer.render(scene,camera);
      raf=requestAnimationFrame(animate);
    }
    animate();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else animate();});
    window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(raf);renderer.dispose();},{once:true});
  }catch(error){
    console.warn('3D aircraft scene unavailable:',error);
    stage.classList.add('scene-fallback');
    canvas.hidden=true;
  }
}
