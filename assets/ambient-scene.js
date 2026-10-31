// Aviation by Aarav | ThreeUI Bestsellers Book Showcase-inspired 3D background
// Original Three.js implementation. Decorative background only; no page content or branding is modified.
const canvas=document.querySelector("#ambient-three-canvas");
if(canvas){
(async()=>{
 let renderer;
 try{
  let THREE;
  for(const url of [
   "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js",
   "https://unpkg.com/three@0.166.1/build/three.module.js"
  ]){try{THREE=await import(url);break;}catch(e){console.warn("Three.js CDN failed",url,e);}}
  if(!THREE)throw new Error("Three.js could not load");
  const mobile=()=>matchMedia("(max-width: 700px)").matches;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!mobile(),powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.25:1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x09121a);
  scene.fog=new THREE.FogExp2(0x0b1720,.026);
  const camera=new THREE.PerspectiveCamera(42,1,.1,120);
  camera.position.set(0,0,15);
  scene.add(new THREE.HemisphereLight(0xc2d4dc,0x111923,2.0));
  const key=new THREE.DirectionalLight(0xffdfb6,3.0);key.position.set(-5,8,9);scene.add(key);
  const rim=new THREE.PointLight(0x4e91b5,22,36);rim.position.set(7,1,5);scene.add(rim);
  const warm=new THREE.PointLight(0xc98b58,13,28);warm.position.set(-7,-3,3);scene.add(warm);
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(200,120),new THREE.MeshBasicMaterial({color:0x09121a}));
  backdrop.position.z=-22;scene.add(backdrop);

  function coverTexture(title,subtitle,accent,number){
   const c=document.createElement("canvas");c.width=768;c.height=1024;
   const x=c.getContext("2d");
   const g=x.createLinearGradient(0,0,768,1024);g.addColorStop(0,accent);g.addColorStop(1,"#101d29");
   x.fillStyle=g;x.fillRect(0,0,768,1024);
   x.strokeStyle="rgba(236,224,202,.55)";x.lineWidth=3;x.strokeRect(34,34,700,956);
   x.strokeStyle="rgba(236,224,202,.2)";x.lineWidth=1;x.strokeRect(52,52,664,920);
   x.fillStyle="rgba(7,16,24,.42)";x.beginPath();x.moveTo(0,590);x.lineTo(768,410);x.lineTo(768,1024);x.lineTo(0,1024);x.fill();
   // Original aviation line art: wings, fuselage and horizon, not a stock aircraft photo.
   x.save();x.translate(384,430);x.strokeStyle="rgba(239,225,201,.8)";x.lineWidth=8;x.lineCap="round";
   x.beginPath();x.moveTo(-245,20);x.lineTo(-70,-12);x.lineTo(-22,-115);x.lineTo(12,-115);x.lineTo(55,-12);x.lineTo(245,20);x.lineTo(55,48);x.lineTo(18,18);x.lineTo(-18,18);x.lineTo(-55,48);x.closePath();x.stroke();x.restore();
   x.fillStyle="#e9e2d5";x.font="600 25px Arial";x.letterSpacing="8px";x.fillText("AVIATION BY AARAV",78,112);
   x.fillStyle="#f4eee4";x.font="700 68px Georgia";x.letterSpacing="0px";
   const words=title.split(" ");let lines=[],line="";
   for(const word of words){const test=(line+" "+word).trim();if(x.measureText(test).width>610&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
   lines.slice(0,3).forEach((s,i)=>x.fillText(s,78,690+i*82));
   x.fillStyle="#d8b98f";x.font="28px Arial";x.fillText(subtitle.toUpperCase(),80,940);
   x.fillStyle="rgba(255,255,255,.55)";x.font="22px Arial";x.fillText(number,650,940);
   const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex;
  }
  const materials=[
   new THREE.MeshStandardMaterial({color:0x18232c,roughness:.82}),
   new THREE.MeshStandardMaterial({color:0x18232c,roughness:.82}),
   new THREE.MeshStandardMaterial({color:0x18232c,roughness:.82}),
   new THREE.MeshStandardMaterial({color:0x18232c,roughness:.82}),
   new THREE.MeshStandardMaterial({color:0xd9d0bd,roughness:1}),
   new THREE.MeshStandardMaterial({map:coverTexture("THE ART OF FLIGHT","A field guide to the skies","#34566a","VOL. 01"),roughness:.7})
  ];
  function makeBook({title,subtitle,accent,number,w=2.8,h=3.9,d=.42,x=0,y=0,z=0,rot=0,scale=1}){
   const group=new THREE.Group();group.position.set(x,y,z);group.rotation.z=rot;group.scale.setScalar(scale);scene.add(group);
   const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials[4]);group.add(body);
   const cover=coverTexture(title,subtitle,accent,number);
   const front=new THREE.Mesh(new THREE.BoxGeometry(w+.035,h+.035,.055),[
    new THREE.MeshStandardMaterial({color:0x18232c}),new THREE.MeshStandardMaterial({color:0x18232c}),
    new THREE.MeshStandardMaterial({color:0x18232c}),new THREE.MeshStandardMaterial({color:0x18232c}),
    new THREE.MeshStandardMaterial({color:0x18232c}),new THREE.MeshStandardMaterial({map:cover,roughness:.72})
   ]);
   front.position.z=d/2+.028;group.add(front);
   const spine=new THREE.Mesh(new THREE.BoxGeometry(.16,h,.07),new THREE.MeshStandardMaterial({color:accent,roughness:.78}));spine.position.x=-w/2+.05;spine.position.z=d/2+.055;group.add(spine);
   // Fine page signatures on the fore edge.
   for(let i=0;i<5;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(.012,h*.94,.012),new THREE.MeshBasicMaterial({color:0x9f967f,transparent:true,opacity:.35}));line.position.set(w/2-.012-i*.018,0,d/2+.01);group.add(line);}
   group.userData={baseY:y,baseRot:rot,phase:Math.random()*6.28};return group;
  }
  const books=[
   makeBook({title:"THE ART OF FLIGHT",subtitle:"A field guide to the skies",accent:"#31576a",number:"01",w:3.0,h:4.15,d:.48,x:-4.7,y:.1,z:-1.8,rot:-.19,scale:1.0}),
   makeBook({title:"INDIA ABOVE",subtitle:"Aviation in a changing nation",accent:"#76533c",number:"02",w:2.65,h:3.65,d:.4,x:4.1,y:-.45,z:-3.0,rot:.17,scale:1.0}),
   makeBook({title:"AIRCRAFT ATLAS",subtitle:"Machines that shape the sky",accent:"#385c50",number:"03",w:2.2,h:3.05,d:.36,x:-1.8,y:-2.55,z:-5.2,rot:.1,scale:.82}),
   makeBook({title:"RUNWAY STORIES",subtitle:"People places departures",accent:"#6b493d",number:"04",w:2.0,h:2.8,d:.34,x:2.35,y:2.35,z:-6.0,rot:-.12,scale:.8})
  ];
  // A restrained stack of closed volumes adds depth without visual clutter.
  const stack=new THREE.Group();stack.position.set(6.4,-3.1,-7);stack.rotation.z=-.08;scene.add(stack);
  for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(2.8,.18,.95),new THREE.MeshStandardMaterial({color:[0x263b48,0x73533e,0x293f43][i],roughness:.85}));m.position.y=i*.2;stack.add(m);}
  const dust=new THREE.Mesh(new THREE.PlaneGeometry(200,120),new THREE.MeshBasicMaterial({color:0x0b1720,transparent:true,opacity:.12,depthWrite:false}));dust.position.z=-12;scene.add(dust);
  const pointer={x:0,y:0,tx:0,ty:0};
  addEventListener("pointermove",e=>{pointer.tx=(e.clientX/innerWidth-.5)*.35;pointer.ty=(e.clientY/innerHeight-.5)*.22;},{passive:true});
  function resize(){
   const w=Math.max(1,document.documentElement.clientWidth||innerWidth),h=Math.max(1,visualViewport?.height||innerHeight);
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.25:1.65));renderer.setSize(w,h,false);
   canvas.style.width="100%";canvas.style.height="100%";
   camera.aspect=w/h;camera.fov=mobile()?53:42;camera.position.z=mobile()?19:15;camera.updateProjectionMatrix();
   // Keep the books inside the narrower phone viewport while retaining the editorial desktop spread.
   books[0].position.x=mobile()?-2.25:-4.7;books[0].position.y=mobile()?1.6:.1;books[0].scale.setScalar(mobile()?.62:1);
   books[1].position.x=mobile()?2.25:4.1;books[1].position.y=mobile()?-.7:-.45;books[1].scale.setScalar(mobile()?.62:1);
   books[2].position.x=mobile()?-1.45:-1.8;books[2].position.y=mobile()?-2.7:-2.55;books[2].scale.setScalar(mobile()?.52:.82);
   books[3].visible=!mobile();stack.visible=!mobile();
  }
  addEventListener("resize",resize,{passive:true});addEventListener("orientationchange",()=>setTimeout(resize,150),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener("resize",resize,{passive:true});resize();
  let raf=0;
  function render(){
   if(document.hidden){raf=0;return;}
   pointer.x+=(pointer.tx-pointer.x)*.025;pointer.y+=(pointer.ty-pointer.y)*.025;
   camera.position.x=pointer.x;camera.position.y=pointer.y*.45;
   camera.lookAt(0,0,-1.5);
   if(!reduced){const t=performance.now()*.00035;books.forEach((b,i)=>{b.position.y+=Math.sin(t+b.userData.phase)*.0009;b.rotation.y=Math.sin(t*.7+b.userData.phase)*.035;});}
   renderer.render(scene,camera);raf=requestAnimationFrame(render);
  }
  function start(){if(!document.hidden&&!raf)raf=requestAnimationFrame(render);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  document.addEventListener("visibilitychange",()=>document.hidden?stop():start());
  addEventListener("pagehide",()=>{stop();renderer.dispose();},{once:true});start();
 }catch(e){console.warn("Aviation book showcase background unavailable:",e);canvas.style.display="none";}
})();
}
