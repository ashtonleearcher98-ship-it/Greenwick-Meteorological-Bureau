const W=window.GreenwickWeather;
const $=id=>document.getElementById(id);
let data;
function render(){
  const q=$('city-search').value.trim().toLowerCase(),district=$('district-filter').value;
  const places=data.locations.filter(x=>(!district||x.district===district)&&(!q||`${x.electorate} ${x.town} ${x.district}`.toLowerCase().includes(q)));
  $('city-count').textContent=`Showing ${places.length} of ${data.locations.length} forecast locations`;
  $('city-grid').innerHTML=places.map(loc=>{const d=loc.days[0],alerts=W.warningsFor(loc,0);return `<article class="city-card"><div class="city-card-top"><span class="city-pin">⌖</span><span class="city-district">${loc.district}</span></div><p class="city-electorate">${loc.electorate} ELECTORATE</p><h3>${loc.town}</h3><div class="city-weather"><span class="city-weather-icon">${W.iconFor(d.condition)}</span><div><b>${d.maxC}° <small>/ ${d.minC}°C</small></b><span>${d.condition}</span></div><span class="city-wind">≋ ${d.windKph} km/h</span></div><div class="city-card-foot"><span>${alerts.length?`<b class="city-alert">! ${alerts.length} alert${alerts.length===1?'':'s'}</b>`:'<span class="city-clear">No alerts today</span>'}</span><a href="index.html?electorate=${encodeURIComponent(loc.electorate)}">Forecast <span>→</span></a></div></article>`}).join('');
  $('city-grid').hidden=!places.length;$('city-empty').hidden=Boolean(places.length);
}
async function start(){try{data=await W.loadData();const navCount=$('nav-warning-count');if(navCount)navCount.textContent=W.allWarnings(data.locations,10).length;const districts=[...new Set(data.locations.map(x=>x.district))].sort();$('district-filter').insertAdjacentHTML('beforeend',districts.map(x=>`<option>${x}</option>`).join(''));$('city-search').addEventListener('input',render);$('district-filter').addEventListener('change',render);render();}catch(error){document.querySelector('.page-content').innerHTML=`<div class="load-error"><h2>City data unavailable</h2><p>${error.message}</p></div>`;console.error(error)}}
start();
