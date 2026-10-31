const canvas=document.querySelector("#ambient-three-canvas");
if(canvas){
(async()=>{
 try{
  const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x080d12);
  scene.fog=new THREE.FogExp2(0x101b20,.027);
  const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,180);
  camera.position.set(0,5,24);
  scene.add(new THREE.HemisphereLight(0x9eb8c5,0x080d12,1.15));
  const moon=new THREE.DirectionalLight(0xc7dce0,1.5);moon.position.set(-8,12,5);scene.add(moon);
  const glow=new THREE.PointLight(0xc18a5a,26,42);glow.position.set(5,2,-10);scene.add(glow);
  // Layered mountain silhouettes create the distant, cinematic Temple Night horizon.
  function ridge(z,y,scale,color,seed){
   const points=[];for(let i=0;i<=36;i++){const x=-38+i*2.1;const h=y+Math.sin(i*.47+seed)*1.7+Math.sin(i*.19+seed*2)*2.8;points.push(new THREE.Vector2(x,h));}
   points.push(new THREE.Vector2(38,-12),new THREE.Vector2(-38,-12));
   const shape=new THREE.Shape(points);const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.94}));
   mesh.position.z=z;mesh.scale.setScalar(scale);scene.add(mesh);
  }
  ridge(-28,-1,1,0x142329,1);ridge(-21,-3,1,0x101c21,3);ridge(-15,-5,1,0x0b151a,5);
  // A small distant temple silhouette on the ridge, intentionally atmospheric rather than literal foreground art.
  const temple=new THREE.Group();scene.add(temple);temple.position.set(7,-1.1,-12);
  const stone=new THREE.MeshStandardMaterial({color:0x172328,roughness:1});
  function block(w,h,d,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),stone);m.position.set(x,y,z);temple.add(m);}
  block(4,.28,1.8,0,0,0);block(3.2,.22,1.4,0,.55,0);block(2.5,.18,1.2,0,1.05,0);block(.28,1.1,.35,0,1.7,0);
  for(const [w,y] of [[5.2,.22],[4.1,.77],[3.2,1.25]]){const roof=new THREE.Mesh(new THREE.ConeGeometry(w*.62,.55,4),stone);roof.rotation.y=Math.PI/4;roof.position.set(0,y,0);temple.add(roof);}
  const warm=new THREE.PointLight(0xe0a66c,3,9);warm.position.set(0,.5,1.1);temple.add(warm);
  // Mist banks: low-opacity planes drift slowly across the distant valley.
  const mistMat=new THREE.MeshBasicMaterial({color:0x9aadb0,transparent:true,opacity:.055,depthWrite:false});
  const mists=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(17,2.2),mistMat);m.position.set((Math.random()-.5)*30,-3+Math.random()*4,-8-Math.random()*18);scene.add(m);mists.push(m);}
  // Sparse floating rain / dust particles, with a restrained glow.
  const count=650,positions=new Float32Array(count*3),speeds=[];
  for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*48;positions[i*3+1]=Math.random()*24-5;positions[i*3+2]=(Math.random()-.5)*38-4;speeds.push(.008+Math.random()*.022);}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(geo,new THREE.PointsMaterial({color:0xc5d7d5,size:.045,transparent:true,opacity:.48,depthWrite:false}));scene.add(particles);
  const pointer={x:0,y:0,tx:0,ty:0};
  addEventListener("pointermove",e=>{pointer.tx=(e.clientX/innerWidth-.5)*.7;pointer.ty=(e.clientY/innerHeight-.5)*.28;},{passive:true});
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  addEventListener("resize",resize,{passive:true});
  let frame=0,raf=0;
  function animate(){
   if(document.hidden){raf=requestAnimationFrame(animate);return;}
   frame+=.004;pointer.x+=(pointer.tx-pointer.x)*.018;pointer.y+=(pointer.ty-pointer.y)*.018;
   camera.position.x=pointer.x;camera.position.y=5-pointer.y;camera.lookAt(pointer.x*.25,0,-8);
   if(!reduced){mists.forEach((m,i)=>{m.position.x+=.004+(i%3)*.001;if(m.position.x>22)m.position.x=-22;});}
   const p=geo.attributes.position.array;
   if(!reduced){for(let i=0;i<count;i++){p[i*3+1]-=speeds[i];p[i*3]+=.002;if(p[i*3+1]<-6){p[i*3+1]=19;p[i*3]=(Math.random()-.5)*48;}}geo.attributes.position.needsUpdate=true;temple.rotation.y=Math.sin(frame*.25)*.012;}
   renderer.render(scene,camera);raf=requestAnimationFrame(animate);
  }
  animate();
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else animate();});
  addEventListener("pagehide",()=>{cancelAnimationFrame(raf);renderer.dispose();geo.dispose();},{once:true});
 }catch(error){console.warn("Ambient Three.js background unavailable:",error);canvas.style.display="none";}
})();
}