const grid=document.querySelector('#story-grid');
const scriptUrl=document.currentScript?.src||new URL('assets/app.js',location.href).href;
const fromSiteRoot=path=>new URL('../'+path,scriptUrl).href;
let stories=[];
let activeFilter='All';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'story').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)||'story';
const dateLabel=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'Recently':new Intl.DateTimeFormat('en',{day:'numeric',month:'short'}).format(d)};
const fallbackImages={
  Aircraft:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=82',
  Airlines:'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=1000&q=82',
  India:'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1000&q=82',
  Safety:'https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&w=1000&q=82',
  Industry:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=82'
};
function storyImage(story){
  if(String(story.source||'').trim().toLowerCase()==='google news')return '';
  const candidate=String(story.image||'').trim();
  if(/news\.google\.com|lh3\.googleusercontent\.com|gstatic\.com/i.test(candidate))return '';
  return /^https?:\/\//i.test(candidate)?candidate:'';
}
function render(){
  const list=activeFilter==='All'?stories:stories.filter(s=>s.category===activeFilter);
  if(!list.length){grid.innerHTML='<div class="empty-state">No stories in this category yet. Check back after the next newsroom update.</div>';return}
  grid.innerHTML=list.slice(0,18).map(s=>{
    const href=fromSiteRoot((s.type==='original'?'originals/':'articles/')+(s.slug||slug(s.title))+'.html');
    const image=storyImage(s);
    const imageMarkup=image?'<img src="'+esc(image)+'" alt="'+esc(s.title)+'" loading="lazy" decoding="async" onerror="this.remove()">':'';
    return `<article class="story-card">
      <a class="story-image-link" href="${esc(href)}" aria-label="Open ${esc(s.title)}">
        <div class="story-image ${image?'has-image':'no-image'}">${imageMarkup}<span class="image-tag">${esc(s.category||'AVIATION')}</span></div>
      </a>
      <div class="story-content"><div class="story-meta"><span>${esc(s.type==='original'?'ORIGINAL REPORT':(s.source||'News desk'))}</span><time>${dateLabel(s.published)}</time></div>
      <h3>${esc(s.title)}</h3><p>${esc(s.summary||'Read the original report for the full story.')}</p>
      <div class="story-source"><a href="${esc(href)}"><span>Read our report ↗</span></a><a href="${esc(s.type==='original'?(s.sources?.[0]?.url||'#'):(s.url||'#'))}" target="_blank" rel="noopener noreferrer"><span>${s.type==='original'?'Research sources ↗':'Original source ↗'}</span></a></div></div></article>`;
  }).join('');
}
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelector('.filter.active')?.classList.remove('active');b.classList.add('active');activeFilter=b.dataset.filter;render();
}));
document.querySelector('[data-india-filter]')?.addEventListener('click',()=>document.querySelector('.filter[data-filter="All"]')?.click());
async function load(){
  try{
    const response=await fetch(fromSiteRoot('data/news.json'),{cache:'no-store'});if(!response.ok)throw Error('News feed unavailable');
    const data=await response.json();\n    const originalsResponse=await fetch(fromSiteRoot('data/original-reports.json'),{cache:'no-store'}).catch(()=>null);\n    const originalsData=originalsResponse?.ok?await originalsResponse.json():{articles:[]};\n    stories=[...(Array.isArray(data.articles)?data.articles:[]),...(Array.isArray(originalsData.articles)?originalsData.articles:[])];
    stories.sort((a,b)=>new Date(b.published)-new Date(a.published));
    const updated=document.querySelector('#updated-label');
    if(updated)updated.textContent=data.updated?'Updated '+new Date(data.updated).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}):'Waiting for first update';
    const today=document.querySelector('#today-label');
    if(today)today.textContent=new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();
    render();
  }catch(e){
    grid.innerHTML='<div class="empty-state">The newsroom feed is temporarily unavailable. Please try again shortly.</div>';
    const updated=document.querySelector('#updated-label');if(updated)updated.textContent='Feed temporarily unavailable';
  }
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
load();
