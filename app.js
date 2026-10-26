const $ = id => document.getElementById(id);
const W = window.GreenwickWeather;
const areaSelect = $('electorate-select');
let dataset, activeArea = new URLSearchParams(location.search).get('electorate') || 'Silvershore';
let selectedDay = 0, useFahrenheit = false;
const tempValue = c => useFahrenheit ? Math.round(c*9/5+32) : c;
const tempText = c => `${tempValue(c)}°`;
function populate(){
  areaSelect.innerHTML=dataset.locations.map(x=>`<option value="${x.electorate}">${x.electorate} — ${x.town}</option>`).join('');
  $('electorate-chips').innerHTML=dataset.locations.map(x=>`<button class="electorate-chip" data-area="${x.electorate}" aria-label="Forecast for ${x.electorate}, ${x.town}"><b>${x.electorate}</b><span>→</span></button>`).join('');
  document.querySelectorAll('.electorate-chip').forEach(el=>el.addEventListener('click',()=>selectArea(el.dataset.area,true)));
}
function render(){
  const loc=dataset.locations.find(x=>x.electorate===activeArea)||dataset.locations[0];
  const d=loc.days[selectedDay];
  areaSelect.value=loc.electorate;
  $('breadcrumb-area').textContent=loc.electorate;$('location-title').textContent=loc.town;
  $('location-meta').textContent=`${loc.electorate} electorate · ${loc.district} district`;$('location-code').textContent=`GW ${String(loc.code).padStart(2,'0')}`;
  $('current-heading').textContent=selectedDay===0?'Today':W.formatDate(d.date,{weekday:'long'});$('current-date').textContent=W.formatDate(d.date);
  $('current-temp').textContent=tempValue(d.maxC);$('current-condition').textContent=d.condition;$('current-icon').textContent=W.iconFor(d.condition);
  $('current-feels').textContent=tempText(d.feelsLikeC);$('sunrise').textContent=loc.sunrise;$('sunset').textContent=loc.sunset;
  $('humidity').textContent=`${d.humidity}%`;$('humidity-bar').style.width=`${d.humidity}%`;$('wind').textContent=d.windKph;$('gust').textContent=d.gustKph;
  $('rain-prob').textContent=d.rainChance;$('rain-bar').style.width=`${d.rainChance}%`;$('uv').textContent=d.uv;
  $('uv-level').textContent=d.uv<=2?'Low':d.uv<=5?'Moderate':d.uv<=7?'High':d.uv<=10?'Very high':'Extreme';
  $('rain-mm').textContent=d.rainMm.toFixed(1);$('fire-danger').textContent=d.fireDanger;
  $('details-date').textContent=W.formatDate(d.date,{weekday:'short',day:'numeric',month:'short'}).toUpperCase();
  $('updated-time').textContent=W.formatClock(new Date(dataset.generatedAt));
  const warnings=W.allWarnings([loc],10);
  $('warning-summary').textContent=warnings.length?`${warnings.length} alert${warnings.length===1?'':'s'} for ${loc.electorate} over the next ten days.`:`No alerts forecast for ${loc.electorate} over the next ten days.`;
  $('warning-list').innerHTML=warnings.slice(0,4).map(w=>`<div class="warning-item ${w.severity==='Severe'?'severe':''}"><span class="warning-level"></span><div><b>${w.label} · ${W.formatDate(w.date,{weekday:'short',day:'numeric',month:'short'})}</b><small>${w.detail}</small></div><span class="w-icon" aria-hidden="true">${w.icon}</span></div>`).join('');
  $('warning-list').hidden=!warnings.length;$('no-warnings').hidden=Boolean(warnings.length);
  $('forecast-strip').innerHTML=loc.days.slice(0,10).map((day,index)=>{const dayWarnings=W.warningsFor(loc,index);return `<button class="day-card${selectedDay===index?' selected':''}" data-index="${index}" aria-label="${W.formatDate(day.date)}: ${day.condition}, high ${tempValue(day.maxC)} degrees, low ${tempValue(day.minC)} degrees${dayWarnings.length?', weather warning':''}">${dayWarnings.length?'<span class="forecast-warn" title="Warning threshold reached">!</span>':''}<div class="day-name">${index===0?'TODAY':W.formatDate(day.date,{weekday:'short'}).toUpperCase()}</div><div class="day-date">${W.formatDate(day.date,{day:'numeric',month:'short'})}</div><div class="day-icon" aria-hidden="true">${W.iconFor(day.condition)}</div><div class="day-temps"><b>${tempValue(day.maxC)}°</b><span>${tempValue(day.minC)}°</span></div><div class="day-rain${day.rainChance<20?' none':''}">☂ ${day.rainChance}%</div></button>`}).join('');
  document.querySelectorAll('.day-card').forEach(el=>el.addEventListener('click',()=>{selectedDay=Number(el.dataset.index);render()}));
  document.querySelectorAll('.electorate-chip').forEach(el=>el.classList.toggle('active',el.dataset.area===loc.electorate));
  const national=W.allWarnings(dataset.locations,10);$('nav-warning-count').textContent=national.length;$('hero-warning-count').textContent=national.length;
  $('cache-status').textContent=`${dataset.cachedDays}-DAY CACHE · ${dataset.locations.length} ELECTORATES`;
}
function selectArea(name,scroll=false){activeArea=name;selectedDay=0;render();if(scroll)$('forecast').scrollIntoView({behavior:'smooth'});}
function setupSearch(){
  const input=$('electorate-search'), results=$('search-results');
  const show=()=>{const q=input.value.trim().toLowerCase();const found=dataset.locations.filter(x=>!q||`${x.electorate} ${x.town} ${x.district}`.toLowerCase().includes(q)).slice(0,8);results.innerHTML=found.map(x=>`<button class="search-result" role="option" data-area="${x.electorate}"><span class="result-pin">⌖</span><span><b>${x.electorate}</b><small>${x.town} · ${x.district}</small></span></button>`).join('')||'<div class="search-result">No matching location.</div>';results.hidden=false;results.querySelectorAll('[data-area]').forEach(el=>el.addEventListener('click',()=>{input.value='';results.hidden=true;selectArea(el.dataset.area,true)}));};
  input.addEventListener('input',show);input.addEventListener('focus',show);document.addEventListener('click',e=>{if(!e.target.closest('.hero-tools'))results.hidden=true});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}if(e.key==='Escape'){results.hidden=true;input.blur()}});
}
async function start(){try{dataset=await W.loadData();populate();setupSearch();areaSelect.addEventListener('change',()=>selectArea(areaSelect.value));$('units-toggle').addEventListener('click',()=>{useFahrenheit=!useFahrenheit;$('units-toggle').textContent=useFahrenheit?'°F':'°C';render()});selectArea(activeArea);}catch(error){document.querySelector('.content-shell').innerHTML=`<div class="load-error"><h2>Forecast data unavailable</h2><p>${error.message} Please reload the page.</p></div>`;console.error(error)}}
start();
