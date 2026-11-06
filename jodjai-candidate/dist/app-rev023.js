import {VERSION,DATA_KEYS,SNAPSHOTS_KEY,capture,checkpoint,guardedWrite,snapshots,makeBackup,readBackup,validateRecords,mergeRecords} from './backup.js';
import {categories,money,localDay,monthOf,normalizeDate,validateTransaction,exportCSV,importCSV,totals} from './core.js';
const $=id=>document.getElementById(id);
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
let storageAvailable=true;function read(key){try{return localStorage.getItem(key);}catch{storageAvailable=false;return null;}}async function write(key,value){
  const expected=loadedRecords?.[key];
  if(!navigator.locks){toast('เบราว์เซอร์นี้ไม่รองรับการป้องกันข้อมูลหลายแท็บ กรุณาส่งออกไฟล์และใช้เบราว์เซอร์รุ่นใหม่');return false;}
  try{return await navigator.locks.request('jodjai-data-write-v1',()=>{
    if(DATA_KEYS.includes(key)){
      if(!loadedRecords||localStorage.getItem(key)!==expected)throw Error('ข้อมูลเปลี่ยนในอีกแท็บ กรุณาเปิดข้อมูลล่าสุดก่อนบันทึก');
      guardedWrite(localStorage,key,value);loadedRecords[key]=value;
    }else localStorage.setItem(key,value);
    updateBackupStatus();refreshSnapshots();return true;
  });}catch(error){toast('บันทึกไม่ได้: '+error.message);return false;}
}
let loadedRecords=captureSafe();
let corruptData=false,transactions=[];try{const raw=loadedRecords?.transactions;if(raw){const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw Error();transactions=parsed.map(validateTransaction);if(transactions.some(x=>!x))throw Error();}}catch{transactions=[];corruptData=true;}
let budget=Number(loadedRecords?.monthlyBudget)||0;if(!Number.isFinite(budget)||budget<0)budget=0;
document.body.classList.toggle('dark-mode',loadedRecords?.theme!=='light');
let activeTab='home';
$('theme-toggle').onclick=async()=>{const dark=!document.body.classList.contains('dark-mode');document.body.classList.toggle('dark-mode',dark);if(!await write('theme',dark?'dark':'light')){document.body.classList.toggle('dark-mode',!dark);return;}$('theme-toggle').textContent=dark?'☀':'☾';};$('theme-toggle').textContent=document.body.classList.contains('dark-mode')?'☀':'☾';
function switchTab(tab){activeTab=tab;for(const name of ['home','analytics','settings'])$(name+'-panel').hidden=name!==tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});render();}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
let selectedCategory='';for(const cat of categories){for(const target of ['cat-scroll-container','modal-categories']){const b=el('button','cat-item');b.type='button';b.append(el('span','cat-icon',cat.icon),el('span','',cat.name));if(target==='modal-categories'){b.dataset.category=cat.id;b.setAttribute('aria-pressed','false');b.onclick=()=>selectCategory(cat.id);}else b.onclick=()=>openAdd(cat.id);$(target).append(b);}}
function selectCategory(id){selectedCategory=id;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===id)));}
function openAdd(category=''){$('transaction-form').reset();$('date-input').value=localDay();$('form-error').textContent='';selectCategory(category);$('add-modal').showModal();$('amount-input').focus();}
$('add-top').onclick=()=>openAdd();$('add-nav').onclick=()=>openAdd();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
async function persist(next){if(corruptData){toast('ข้อมูลเดิมเสียหาย จึงยังไม่เขียนทับ กรุณาสำรองข้อมูลดิบก่อน');return false;}if(!await write('transactions',JSON.stringify(next)))return false;transactions=next;render();return true;}
$('transaction-form').onsubmit=async e=>{e.preventDefault();if(!selectedCategory){$('form-error').textContent='กรุณาเลือกหมวดหมู่';return;}const tx=validateTransaction({id:crypto.randomUUID(),amount:Number($('amount-input').value),category:selectedCategory,note:$('note-input').value.trim(),date:normalizeDate($('date-input').value)});if(!tx){$('form-error').textContent='กรุณาตรวจสอบจำนวนเงินและวันที่';return;}if(await persist([...transactions,tx])){$('add-modal').close();toast('จดรายจ่ายเรียบร้อยแล้ว');}};
$('set-budget-btn').onclick=()=>{$('budget-input').value=budget;$('budget-modal').showModal();};$('budget-form').onsubmit=async e=>{e.preventDefault();const value=Number($('budget-input').value);if(!Number.isFinite(value)||value<0||value>999999999)return;if(await write('monthlyBudget',String(value))){budget=value;$('budget-modal').close();render();toast('บันทึกงบประมาณแล้ว');}};
function renderDashboard(){const t=totals(transactions);$('current-date-display').textContent=new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('today-total').textContent=money(t.today);$('month-total').textContent=money(t.month)+(budget?' / '+money(budget):'');$('month-total').classList.toggle('over-budget',budget>0&&t.month>budget);$('budget-fill').style.width=budget?Math.min(100,t.month/budget*100)+'%':'0%';$('budget-fill').style.background=budget&&t.month>budget?'#ed7e6c':'var(--gold)';$('budget-caption').textContent=budget?(t.month>budget?'เกินงบไป '+money(t.month-budget):'เหลืองบอีก '+money(budget-t.month)):'ตั้งงบสักนิด เพื่อวางแผนเดือนนี้';$('set-budget-btn').textContent=budget?'ปรับงบประมาณ →':'ตั้งงบประมาณ →';}
function renderTransactions(){const filter=$('list-filter').value;const now=localDay();const list=transactions.filter(t=>filter==='all'||(filter==='today'?localDay(new Date(t.date))===now:monthOf(t.date)===now.slice(0,7))).sort((a,b)=>new Date(b.date)-new Date(a.date));$('list-title').textContent=filter==='today'?'รายการวันนี้':filter==='month'?'รายการเดือนนี้':'รายการทั้งหมด';const container=$('transaction-list');container.replaceChildren();if(!list.length){const empty=el('div','empty-state');empty.append(el('span','empty-icon','✎'),el('strong','',filter==='today'?'วันนี้ยังว่างอยู่':'ยังไม่มีรายการในช่วงนี้'),el('p','','เริ่มจดรายจ่าย แล้วค่อย ๆ รู้จักการใช้เงินของตัวเอง'));container.append(empty);return;}for(const tx of list){const cat=categories.find(c=>c.id===tx.category);const item=el('article','transaction-item');const detail=el('div','tx-detail');detail.append(el('strong','',cat.name),el('small','',tx.note||'ไม่ได้ระบุหมายเหตุ'));if(filter!=='today')detail.append(el('small','',new Date(tx.date).toLocaleDateString('th-TH')));const remove=el('button','delete-btn','×');remove.setAttribute('aria-label',`ลบรายการ ${cat.name} ${money(tx.amount)}`);remove.onclick=()=>{if(confirm(`ลบรายจ่าย ${cat.name} ${money(tx.amount)}?`))persist(transactions.filter(t=>t.id!==tx.id));};item.append(el('span','cat-icon',cat.icon),detail,el('span','tx-amount',money(tx.amount)),remove);container.append(item);}}
$('list-filter').onchange=renderTransactions;$('analytics-month').value=localDay().slice(0,7);$('analytics-month').onchange=renderChart;
function renderChart(){const month=$('analytics-month').value;const sums=new Map();for(const t of transactions.filter(t=>monthOf(t.date)===month))sums.set(t.category,(sums.get(t.category)||0)+Math.round(t.amount*100));const rows=[...sums].sort((a,b)=>b[1]-a[1]);const total=rows.reduce((n,r)=>n+r[1],0);$('chart-total').textContent=money(total/100);$('donut').setAttribute('aria-label',`รายจ่ายรวม ${money(total/100)} จาก ${rows.length} หมวดหมู่`);const ranking=$('category-rankings');ranking.replaceChildren(el('h2','','อันดับรายจ่าย'));let position=0;const stops=[];rows.forEach(([id,cents],i)=>{const cat=categories.find(c=>c.id===id);const color=`hsl(${(38+i*137.508)%360} 55% 59%)`;const percent=cents/total*100;stops.push(`${color} ${position}% ${position+percent}%`);position+=percent;const row=el('div','ranking');row.append(el('span','',`${cat.icon} ${cat.name}`),el('strong','',money(cents/100)+' · '+Math.round(percent)+'%'));const bar=el('div','ranking-bar');const fill=el('i');fill.style.width=percent+'%';fill.style.background=color;bar.append(fill);row.append(bar);ranking.append(row);});$('donut').style.background=total?`conic-gradient(${stops.join(',')})`:'var(--line)';if(!rows.length)ranking.append(el('p','empty-state','ยังไม่มีข้อมูลรายจ่ายในเดือนนี้'));}
function render(){renderDashboard();renderTransactions();if(activeTab==='analytics')renderChart();}
function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-btn').onclick=()=>{if(corruptData){download(read('transactions')||'','JodJai_recovery.json','application/json');return;}if(!transactions.length){toast('ยังไม่มีข้อมูลให้ส่งออก');return;}download(exportCSV(transactions),`JodJai_${localDay()}.csv`,'text/csv;charset=utf-8');};
$('import-btn').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');const result=importCSV(await file.text(),transactions);const summary=`รายการใหม่ ${result.added} · รายการซ้ำ ${result.duplicates} · ไม่ถูกต้อง ${result.skipped}`;$('import-result').textContent=summary;if(!result.added){toast('ไม่พบรายการใหม่ที่ถูกต้อง');return;}if(!confirm(summary+'\nนำข้อมูลใหม่มารวมกับรายการเดิมหรือไม่?'))return;if(await persist(result.transactions))toast(`นำเข้าแล้ว ${result.added} รายการ`);}catch(error){$('import-result').textContent=error.message;toast(error.message);}finally{e.target.value='';}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});setInterval(()=>{if(!document.hidden)renderDashboard();},60000);
window.addEventListener('storage',e=>{if(DATA_KEYS.includes(e.key)||e.key===null){$('data-changed').hidden=false;verifiedRecords=null;updateBackupStatus();}});
$('reload-data').onclick=()=>{if(document.querySelector('dialog[open]')&&!confirm('เปิดข้อมูลล่าสุด? ข้อมูลในฟอร์มที่ยังไม่บันทึกจะถูกล้าง'))return;location.reload();};
let installPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install-btn').hidden=false;});$('install-btn').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('install-btn').hidden=true;}};

render();
if(corruptData)toast('ข้อมูลเดิมเสียหาย: หยุดการเขียนทับ กรุณาสำรองข้อมูลดิบจากหน้าตั้งค่า');
if(!storageAvailable)toast('เบราว์เซอร์ไม่อนุญาตให้จัดเก็บข้อมูล');

// Backups never change the existing data format or clear existing keys.
let verifiedRecords=null,waitingWorker=null;
function updateBackupStatus(){
  if(!document.getElementById('backup-status'))return;
  $('backup-origin').textContent=location.origin;
  let count=0;try{const raw=read('transactions');const parsed=raw?JSON.parse(raw):[];count=Array.isArray(parsed)?parsed.length:0;}catch{}
  $('backup-status').textContent=`ข้อมูลอยู่ในเบราว์เซอร์นี้ ${count} รายการ • ควรเก็บไฟล์สำรองใน Files หรือที่เก็บไฟล์ของคุณ`;
  const valid=verifiedRecords===JSON.stringify(captureSafe());
  $('apply-update').disabled=!valid;
  $('backup-verification').textContent=valid?'ตรวจไฟล์สำรองแล้ว ตรงกับข้อมูลปัจจุบัน':'ก่อนอัปเดต: ดาวน์โหลด JSON แล้วเลือกไฟล์ที่บันทึกไว้เพื่อตรวจสอบ';
}
function captureSafe(){try{return capture(localStorage);}catch{storageAvailable=false;return null;}}
async function exportBackup(records=captureSafe()){
  if(!records)throw Error('อ่านข้อมูลในเครื่องไม่ได้');
  const backup=await makeBackup(records,location.origin);
  download(JSON.stringify(backup,null,2),`JodJai_Backup_${localDay()}_${Date.now()}.json`,'application/json');
  toast('เริ่มดาวน์โหลดแล้ว โปรดตรวจว่าไฟล์อยู่ใน Files หรือ Downloads');
}
$('backup-json').onclick=()=>exportBackup().catch(e=>toast(e.message));
$('update-backup').onclick=()=>$('backup-json').click();
$('verify-backup').onclick=()=>$('verify-backup-file').click();
$('verify-backup-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const backup=await readBackup(await file.text());if(JSON.stringify(backup.records)!==JSON.stringify(capture(localStorage)))throw Error('ไฟล์นี้ไม่ตรงกับข้อมูลปัจจุบัน กรุณาดาวน์โหลดไฟล์สำรองใหม่');verifiedRecords=JSON.stringify(backup.records);updateBackupStatus();toast('ตรวจไฟล์สำรองแล้ว');}catch(error){verifiedRecords=null;toast(error.message);updateBackupStatus();}finally{e.target.value='';}};
async function importBackupRecords(records,label){
  if(corruptData)throw Error('ข้อมูลปัจจุบันเสียหาย กรุณาส่งออกข้อมูลดิบก่อน ไม่เขียนทับข้อมูลเดิม');
  const incoming=validateRecords(records);
  const source=read('transactions');const original=source===null?[]:JSON.parse(source);
  const result=await mergeRecords(original,incoming);
  const preview=`${label}\nรายการใหม่ ${result.added} • ซ้ำ ${result.duplicates} • ID ชนกัน ${result.conflicts} (เก็บทั้งสองรายการ)\nงบประมาณและธีมจะนำเข้าเฉพาะเมื่อเครื่องนี้ยังไม่มีค่า`;
  if(!confirm(preview+'\nนำข้อมูลมารวมกับเครื่องนี้หรือไม่?'))return;
  // Stop if a different tab changed records while this preview was open.
  if(read('transactions')!==source)throw Error('ข้อมูลเปลี่ยนระหว่างตรวจ กรุณานำเข้าใหม่');
  if(result.added&&!await persist(result.transactions))throw Error('บันทึกรายการนำเข้าไม่สำเร็จ');
  let settingsFailed=false;
  if(read('monthlyBudget')===null&&records.monthlyBudget!==null){if(await write('monthlyBudget',records.monthlyBudget))budget=Number(records.monthlyBudget);else settingsFailed=true;}
  if(read('theme')===null&&records.theme!==null){if(await write('theme',records.theme)){document.body.classList.toggle('dark-mode',records.theme==='dark');$('theme-toggle').textContent=records.theme==='dark'?'☀':'☾';}else settingsFailed=true;}
  $('list-filter').value='all';render();updateBackupStatus();refreshSnapshots();
  toast(settingsFailed?'รายการนำเข้าแล้ว แต่บางการตั้งค่าบันทึกไม่สำเร็จ กรุณาลองนำเข้าอีกครั้ง':`รวมข้อมูลแล้ว ${result.added} รายการ`);
}
$('restore-json').onclick=()=>$('restore-json-file').click();
$('restore-json-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024)throw Error('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');const backup=await readBackup(await file.text());await importBackupRecords(backup.records,`สำรองจาก ${backup.origin} เมื่อ ${backup.createdAt}`);}catch(error){toast(error.message);}finally{e.target.value='';}};
function refreshSnapshots(){const select=$('snapshot-list');select.replaceChildren();try{const list=snapshots(localStorage);list.forEach((item,i)=>{let count='อ่านไม่ได้';try{const txs=item.records.transactions?JSON.parse(item.records.transactions):[];if(Array.isArray(txs))count=txs.length;}catch{}const option=el('option','',`${new Date(item.createdAt).toLocaleString('th-TH')} • ${count} รายการ`);option.value=String(i);select.append(option);});if(list.length)select.value=String(list.length-1);$('restore-snapshot').disabled=!list.length;$('export-snapshot').disabled=!list.length;}catch(error){toast(error.message);}}
$('restore-snapshot').onclick=async()=>{try{const item=snapshots(localStorage)[Number($('snapshot-list').value)];if(item)await importBackupRecords(item.records,'สำเนาย้อนหลังในเบราว์เซอร์นี้');}catch(error){toast(error.message);}};
$('export-snapshot').onclick=()=>{try{const item=snapshots(localStorage)[Number($('snapshot-list').value)];if(item)exportBackup(item.records).catch(e=>toast(e.message));}catch(error){toast(error.message);}};
$('backup-history-raw').onclick=()=>download(JSON.stringify({origin:location.origin,records:captureSafe(),snapshots:read(SNAPSHOTS_KEY)},null,2),'JodJai_raw_recovery.json','application/json');
$('open-recovery').onclick=()=>{switchTab('settings');$('backup-card').scrollIntoView({behavior:'smooth'});};
$('apply-update').onclick=()=>{
  if(verifiedRecords!==JSON.stringify(captureSafe())){updateBackupStatus();toast('ข้อมูลเปลี่ยน กรุณาสำรองและตรวจไฟล์อีกครั้ง');return;}
  if(document.querySelector('dialog[open]')){toast('กรุณาบันทึกหรือปิดฟอร์มก่อนอัปเดต');return;}
  if(waitingWorker)waitingWorker.postMessage({type:'APPLY_UPDATE'});else location.reload();
};
function updateAvailable(worker){waitingWorker=worker;$('app-update').hidden=false;updateBackupStatus();}
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  let hadController=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController){hadController=true;return;}updateAvailable(null);$('update-message').textContent='เวอร์ชันใหม่พร้อมแล้ว ตรวจไฟล์สำรองก่อนเปิดใหม่';});
  navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(async registration=>{
    if(registration.waiting)updateAvailable(registration.waiting);
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)updateAvailable(registration.waiting);});});
    await navigator.serviceWorker.ready;
    $('offline-status').textContent='แอปพร้อมใช้ออฟไลน์ ข้อมูลยังอยู่ในเบราว์เซอร์นี้ โปรดเก็บไฟล์สำรองแยกไว้';
  }).catch(()=>{$('offline-status').textContent='ยังตรวจอัปเดตไม่ได้ แอปยังใช้ข้อมูลในเบราว์เซอร์นี้ กรุณาสำรองไฟล์ก่อนเปลี่ยนลิงก์';});
}else $('offline-status').textContent='เปิดผ่าน HTTPS หรือ localhost เพื่อใช้ออฟไลน์';
if(navigator.locks)navigator.locks.request('jodjai-data-write-v1',()=>checkpoint(localStorage)).catch(error=>toast('สำรองก่อนแก้ไขไม่ได้: '+error.message));
updateBackupStatus();refreshSnapshots();

if(corruptData||!loadedRecords){$('data-error').hidden=false;$('data-error').textContent='ข้อมูลในเบราว์เซอร์อ่านไม่ได้ แอปหยุดการเขียนทับ กรุณาส่งออกข้อมูลดิบจากหน้าตั้งค่าเพื่อเก็บไว้ก่อน';}
