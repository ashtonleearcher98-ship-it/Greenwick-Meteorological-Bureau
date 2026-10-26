const W=window.GreenwickWeather;
const $=id=>document.getElementById(id);
let data, all=[];
function fillFilters(){
  $('area-filter').insertAdjacentHTML('beforeend',data.locations.map(x=>`<option value="${x.electorate}">${x.electorate} — ${x.town}</option>`).join(''));
  const types=[...new Set(all.map(x=>x.type))];
  $('type-filter').insertAdjacentHTML('beforeend',types.map(t=>`<option value="${t}">${W.TYPES[t].label}</option>`).join(''));
}
function render(){
  const area=$('area-filter').value,type=$('type-filter').value,q=$('warning-search').value.trim().toLowerCase();
  const filtered=all.filter(w=>(!area||w.electorate===area)&&(!type||w.type===type)&&(!q||`${w.electorate} ${w.town} ${w.district}`.toLowerCase().includes(q)));
  $('results-total').textContent=`${filtered.length} alert${filtered.length===1?'':'s'}`;
  $('warning-results').innerHTML=filtered.map(w=>`<article class="alert-row severity-${w.severity.toLowerCase()}"><div class="alert-kind-icon">${w.icon}</div><div class="alert-main"><div class="alert-meta"><span class="severity-tag">${w.severity}</span><span>${W.formatDate(w.date,{weekday:'short',day:'numeric',month:'short'})}</span><span>${w.group}</span></div><h3>${w.label}</h3><p>${w.detail}</p><div class="alert-location"><b>${w.electorate}</b><span>${w.town}</span><span>${w.district}</span></div></div><a class="alert-action" href="index.html?electorate=${encodeURIComponent(w.electorate)}">Local forecast <span>→</span></a></article>`).join('');
  $('warning-results').hidden=!filtered.length;$('no-warning-results').hidden=Boolean(filtered.length);
}
async function start(){try{
  data=await W.loadData();all=W.allWarnings(data.locations,10);
  fillFilters();
  const firstIndex=W.currentDayIndex(data.locations[0].days),first=data.locations[0].days[firstIndex].date,last=data.locations[0].days[Math.min(firstIndex+9,data.locations[0].days.length-1)].date;
  $('warning-dates').textContent=`${W.formatDate(first,{day:'numeric',month:'short'})} – ${W.formatDate(last,{day:'numeric',month:'short',year:'numeric'})}`;
  $('board-count').textContent=`${all.length} alert${all.length===1?'':'s'} forecast`;
  const electorates=[...new Map(all.map(w=>[w.electorate,{electorate:w.electorate,town:w.town,warnings:0,highest:'Advice'}])).values()];
  for(const w of all){const e=electorates.find(x=>x.electorate===w.electorate);e.warnings++;if(({Severe:0,Warning:1,Advice:2}[w.severity])<({Severe:0,Warning:1,Advice:2}[e.highest]))e.highest=w.severity;}
  $('board-intro-count').textContent=`${electorates.length} electorates with an alert`;
  $('warnings-by-electorate').innerHTML=electorates.sort((a,b)=>({Severe:0,Warning:1,Advice:2}[a.highest]-({Severe:0,Warning:1,Advice:2}[b.highest]))||a.electorate.localeCompare(b.electorate)).map(e=>`<a class="electorate-warning-row" href="index.html?electorate=${encodeURIComponent(e.electorate)}"><span class="board-count ${e.highest.toLowerCase()}">${e.warnings}</span><span><b>${e.electorate}</b><small>${e.town}</small></span><span class="row-status">${e.highest}</span><span class="row-arrow">→</span></a>`).join('')||'<p class="board-empty">No warning thresholds are currently met.</p>';
  const countByType=Object.keys(W.TYPES).map(t=>[t,all.filter(x=>x.type===t).length]).filter(x=>x[1]);
  const severe=all.filter(w=>w.severity==='Severe').length;
  $('warning-stats').innerHTML=`<article><span>ACTIVE ALERTS</span><b>${all.length}</b><small>Across the next ten days</small></article><article><span>AFFECTED ELECTORATES</span><b>${electorates.length}<small> / 42</small></b><small>Local area alerts</small></article><article><span>SEVERE ALERTS</span><b>${severe}</b><small>Storm or fire warnings</small></article><article><span>WARNING TYPES</span><b>${countByType.length}</b><small>${countByType.map(x=>W.TYPES[x[0]].group).filter((x,i,a)=>a.indexOf(x)===i).join(' · ')}</small></article>`;
  $('nav-warning-count').textContent=all.length;render();
  for(const id of ['area-filter','type-filter'])$(id).addEventListener('change',render);$('warning-search').addEventListener('input',render);
}catch(error){document.querySelector('.page-content').innerHTML=`<div class="load-error"><h2>Warning data unavailable</h2><p>${error.message}</p></div>`;console.error(error)}}
start();
