const canvas=document.querySelector("#ambient-three-canvas");
if(canvas){(async()=>{try{
const T=await import("https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color(0x080e14);scene.fog=new T.FogExp2(0x101b22,.022);
const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,180);camera.position.set(0,5.5,25);
scene.add(new T.HemisphereLight(0x9eb8c8,0x080d12,1.05));const moonLight=new T.DirectionalLight(0xaec5d1,1.6);moonLight.position.set(-12,18,8);scene.add(moonLight);
const moon=new T.Mesh(new T.SphereGeometry(2.25,32,32),new T.MeshBasicMaterial({color:0xe0d2b9}));moon.position.set(-11,10,-32);scene.add(moon);
for(const q of [{z:-38,y:-1.8,c:0x1a2a31,s:1},{z:-30,y:-3.5,c:0x122128,s:3},{z:-22,y:-5.1,c:0x0c171e,s:5}]){const pts=[];for(let i=0;i<=48;i++){const x=-42+i*1.75;pts.push(new T.Vector2(x,q.y+Math.sin(i*.37+q.s)*1.9+Math.sin(i*.13+q.s*2)*3.2));}pts.push(new T.Vector2(42,-16),new T.Vector2(-42,-16));const ridge=new T.Mesh(new T.ShapeGeometry(new T.Shape(pts)),new T.MeshBasicMaterial({color:q.c}));ridge.position.z=q.z;scene.add(ridge);}
const wood=new T.MeshStandardMaterial({color:0x202c30,roughness:1}),roofMat=new T.MeshStandardMaterial({color:0x111b20,roughness:.92}),lanternMat=new T.MeshStandardMaterial({color:0xb98553,emissive:0x9b5728,emissiveIntensity:1.5});
function block(p,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;}
function roof(p,w,y){const r=new T.Mesh(new T.ConeGeometry(w*.78,.72,4),roofMat);r.rotation.y=Math.PI/4;r.scale.z=.62;r.position.y=y;p.add(r);block(p,w*1.18,.12,1.65,0,y-.28,0,roofMat);}
const temple=new T.Group();temple.position.set(5,-2.1,-16);temple.scale.setScalar(2.15);scene.add(temple);
block(temple,5.2,.38,2.8,0,.15,0,wood);block(temple,4.35,1.55,2.15,0,1.05,0,wood);
for(const x of [-1.35,-.45,.45,1.35])block(temple,.42,.75,.035,x,1.1,1.09,lanternMat);
roof(temple,4.1,2.15);roof(temple,5.15,2.62);
const pagoda=new T.Group();pagoda.position.set(-4.2,-.1,-1.1);temple.add(pagoda);block(pagoda,1.65,.48,1.55,0,.2,0,wood);
for(let i=0;i<3;i++){const y=.8+i*1.05;block(pagoda,1.2-i*.22,.72,1.05-i*.18,0,y,0,wood);roof(pagoda,2.35-i*.38,y+.48);}
const finial=new T.Mesh(new T.CylinderGeometry(.035,.09,1.45,8),lanternMat);finial.position.y=4.1;pagoda.add(finial);
const trunkMat=new T.MeshStandardMaterial({color:0x101a1e}),pineMat=new T.MeshStandardMaterial({color:0x0b171b});
for(let i=0;i<22;i++){const x=-25+i*2.4+Math.sin(i*4.1)*1.2,z=-9-(i%5)*3.2,h=3.2+(i%4)*.8,g=new T.Group();g.position.set(x,-4.2,z);scene.add(g);const tr=new T.Mesh(new T.CylinderGeometry(.09,.16,h*.65,5),trunkMat);tr.position.y=h*.3;g.add(tr);for(let k=0;k<3;k++){const c=new T.Mesh(new T.ConeGeometry(1.05-k*.19,h*.48,6),pineMat);c.position.y=h*.35+k*h*.19;g.add(c);}}
for(const x of [-2.9,2.9,7.1]){const g=new T.Group();g.position.set(x,-1.9,-12);scene.add(g);block(g,.34,.58,.34,0,0,0,wood);const l=new T.PointLight(0xd99a5c,3.2,8);l.position.y=.25;g.add(l);}
const mistMat=new T.MeshBasicMaterial({color:0x9baeb2,transparent:true,opacity:.075,depthWrite:false}),mists=[];
for(let i=0;i<7;i++){const m=new T.Mesh(new T.PlaneGeometry(22,2.6),mistMat);m.position.set((Math.random()-.5)*28,-3.5+Math.random()*2.4,-11-Math.random()*18);scene.add(m);mists.push(m);}
const pointer={x:0,y:0,tx:0,ty:0};addEventListener("pointermove",e=>{pointer.tx=(e.clientX/innerWidth-.5)*.42;pointer.ty=(e.clientY/innerHeight-.5)*.18;},{passive:true});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener("resize",resize,{passive:true});
let raf=0;function render(){if(document.hidden){raf=0;return;}pointer.x+=(pointer.tx-pointer.x)*.018;pointer.y+=(pointer.ty-pointer.y)*.018;camera.position.x=pointer.x;camera.position.y=5.5-pointer.y;camera.lookAt(pointer.x*.18,-1,-13);if(!reduced){mists.forEach((m,i)=>{m.position.x+=.003+(i%3)*.001;if(m.position.x>23)m.position.x=-23;});temple.rotation.y=Math.sin(performance.now()*.00012)*.008;}renderer.render(scene,camera);raf=requestAnimationFrame(render);}
function start(){if(!document.hidden&&!raf)raf=requestAnimationFrame(render);}function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
document.addEventListener("visibilitychange",()=>document.hidden?stop():start());addEventListener("pagehide",()=>{stop();renderer.dispose();},{once:true});start();
}catch(e){console.warn("Temple Night background unavailable:",e);canvas.style.display="none";}})();}
