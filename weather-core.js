(() => {
  const TIME_ZONE = 'America/Belize';
  const DATA_URL = 'data/forecasts-200.json';
  const TYPES = {
    flood: {label:'Flood watch', group:'Flooding', icon:'≋', severity:'Warning'},
    storm: {label:'Severe storm warning', group:'Severe weather', icon:'ϟ', severity:'Severe'},
    cyclone: {label:'Tropical low watch', group:'Severe weather', icon:'◉', severity:'Severe'},
    wind: {label:'Damaging wind warning', group:'Severe weather', icon:'➤', severity:'Warning'},
    fire: {label:'Fire weather warning', group:'Fire weather', icon:'♨', severity:'Severe'},
    heat: {label:'Heatwave warning', group:'Heat', icon:'☀', severity:'Warning'},
    frost: {label:'Frost advisory', group:'Cold weather', icon:'❄', severity:'Advice'},
    uv: {label:'Very high UV alert', group:'Health', icon:'☼', severity:'Advice'},
    dry: {label:'Dry conditions advisory', group:'Fire weather', icon:'⌁', severity:'Advice'}
  };
  const partsDate = date => Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const todayISO = () => {const p=partsDate(new Date());return `${p.year}-${p.month}-${p.day}`;};
  const dateObj = iso => new Date(`${iso}T18:00:00Z`);
  const formatDate = (iso, opts={weekday:'long',day:'numeric',month:'long'}) => new Intl.DateTimeFormat('en', {...opts,timeZone:TIME_ZONE}).format(dateObj(iso));
  const formatClock = date => new Intl.DateTimeFormat('en',{timeZone:TIME_ZONE,hour:'numeric',minute:'2-digit'}).format(date);
  const iconFor = condition => ({'Sunny':'☀','Mostly sunny':'☀','Partly cloudy':'◒','Cloudy':'☁','Showers':'☂','Rain':'☂','Thunderstorms':'ϟ','Windy':'≋','Hazy':'◉'})[condition]||'◒';
  function warningsFor(location,index){
    const d=location.days[index]; if(!d)return [];
    const result=[];
    const prior=location.days.slice(Math.max(0,index-2),index+1);
    const rain3=prior.reduce((sum,x)=>sum+x.rainMm,0);
    const add=(type,detail)=>result.push({type,...TYPES[type],detail,date:d.date,index,electorate:location.electorate,town:location.town,district:location.district});
    if(d.rainMm>=85||rain3>=150)add('flood',`${d.rainMm.toFixed(0)} mm forecast; ${rain3.toFixed(0)} mm across three days.`);
    const storm=d.gustKph>=85&&d.rainMm>=24;
    if(storm)add('storm',`Wind gusts up to ${d.gustKph} km/h with heavy rain forecast.`);
    if(d.system==='Tropical low'&&d.gustKph>=90&&d.rainMm>=50)add('cyclone',`Coastal low pressure system; gusts to ${d.gustKph} km/h and heavy rain.`);
    if(d.gustKph>=80&&!storm)add('wind',`Damaging gusts up to ${d.gustKph} km/h forecast.`);
    if(d.fireDanger==='Extreme'||d.fireDanger==='High')add('fire',`${d.fireDanger} fire danger; maximum ${d.maxC}°C, humidity ${d.humidity}%, wind ${d.windKph} km/h.`);
    if(prior.length===3&&prior.every(x=>x.maxC>=38))add('heat',`Three consecutive days at or above 38°C; today's maximum ${d.maxC}°C.`);
    if(d.minC<=2)add('frost',`Minimum near ${d.minC}°C expected in exposed areas.`);
    if(d.uv>=11)add('uv',`UV index ${d.uv}; use sun protection outdoors.`);
    const dryRun=location.days.slice(index,Math.min(index+5,location.days.length));
    if(dryRun.length===5&&dryRun.every(x=>x.rainMm<1)&&d.fireDanger==='Moderate')add('dry',`Little rain expected over five days with dry vegetation.`);
    return result;
  }
  function allWarnings(locations,count=10){
    const result=[];
    for(const loc of locations)for(let i=0;i<Math.min(count,loc.days.length);i++)result.push(...warningsFor(loc,i));
    result.sort((a,b)=>a.date.localeCompare(b.date)||({Severe:0,Warning:1,Advice:2}[a.severity]-({Severe:0,Warning:1,Advice:2}[b.severity]))||a.electorate.localeCompare(b.electorate));
    return result;
  }
  async function loadData(){const res=await fetch(DATA_URL,{cache:'no-cache'});if(!res.ok)throw new Error('Forecast cache could not be loaded.');const data=await res.json();if(data.locations?.length!==42||data.cachedDays!==200)throw new Error('The forecast cache is incomplete.');return data;}
  function mountLocalDate(){
    const update=()=>{const now=new Date();document.querySelectorAll('[data-local-date]').forEach(el=>el.textContent=new Intl.DateTimeFormat('en',{timeZone:TIME_ZONE,weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(now));document.querySelectorAll('[data-local-time]').forEach(el=>el.textContent=formatClock(now));};
    update();setInterval(update,60_000);
  }
  mountLocalDate();
  window.GreenwickWeather={TIME_ZONE,DATA_URL,TYPES,todayISO,formatDate,formatClock,iconFor,warningsFor,allWarnings,loadData};
})();
