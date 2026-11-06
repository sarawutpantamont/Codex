export const categories=[['food','อาหาร','🍽️'],['drink','เครื่องดื่ม','☕'],['transport','เดินทาง','🚌'],['shopping','ช้อปปิ้ง','🛍️'],['bill','บิล','🧾'],['credit_card','บัตรเครดิต','💳'],['health','สุขภาพ','💖'],['entertainment','บันเทิง','🎬'],['home','บ้าน','🏠'],['education','การศึกษา','📚'],['it','IT','💻'],['investment','ลงทุน','📈'],['donate','บริจาค','🕊️'],['water','ค่าน้ำ','💧'],['electric','ค่าไฟ','⚡'],['other','อื่นๆ','💬']].map(([id,name,icon])=>({id,name,icon}));
export const money=n=>new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',minimumFractionDigits:2}).format(n);
export const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const monthOf=d=>localDay(new Date(d)).slice(0,7);
export function normalizeDate(value){
 if(typeof value!=='string')return null;
 const thai=value.replace(/[๐-๙]/g,c=>String(c.charCodeAt(0)-3664)).trim();
 let m=thai.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
 if(m){let [d,mo,y,h,mi,s]=[m[1],m[2],m[3],m[4]??12,m[5]??0,m[6]??0].map(Number);y=y>2400?y-543:y;const date=new Date(y,mo-1,d,h,mi,s);return date.getFullYear()===y&&date.getMonth()===mo-1&&date.getDate()===d&&h<24&&mi<60&&s<60?date.toISOString():null;}
 m=thai.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);if(!m)return null;
 const [,y,mo,d,rest]=m;const check=new Date(Number(y),Number(mo)-1,Number(d),12);if(check.getFullYear()!==+y||check.getMonth()!==+mo-1||check.getDate()!==+d)return null;
 const date=rest?new Date(thai):check;return Number.isFinite(date.getTime())?date.toISOString():null;
}
export function validateTransaction(tx){
 if(!tx||typeof tx!=='object')return null;
 const id=typeof tx.id==='number'&&Number.isSafeInteger(tx.id)?String(tx.id):tx.id;
 if(typeof id!=='string'||!id.trim()||id.length>120)return null;
 if(typeof tx.amount!=='number'||!Number.isFinite(tx.amount)||tx.amount<0.01||tx.amount>999999999)return null;
 const date=normalizeDate(tx.date);if(!date)return null;
 if(tx.note!=null&&typeof tx.note!=='string')return null;
 return {id,amount:Math.round(tx.amount*100)/100,category:categories.some(c=>c.id===tx.category)?tx.category:'other',note:(tx.note||'').slice(0,500),date};
}
export function parseCSV(text){
 const rows=[];let row=[],field='',quoted=false,closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;}else if(c==='"'){if(field||closed)throw Error('รูปแบบ CSV ไม่ถูกต้อง');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(field);field='';closed=false;if(c!==','){if(row.some(x=>x!==''))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else{if(closed&&!/\s/.test(c))throw Error('รูปแบบ CSV ไม่ถูกต้อง');if(!closed)field+=c;}}
 if(quoted)throw Error('เครื่องหมายคำพูดใน CSV ไม่ครบ');row.push(field);if(row.some(x=>x!==''))rows.push(row);return rows;
}
const safeCell=s=>{s=String(s);if(/^(?:'|[\s]*[=+\-@\t\r])/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
export function exportCSV(txs){return '\uFEFFID,Date,Category,Amount,Note,Format\r\n'+txs.map(t=>[t.id,t.date,t.category,t.amount,t.note,'JodJai-v2'].map(safeCell).join(',')).join('\r\n');}
export function importCSV(text,existing){const rows=parseCSV(text);const header=rows.shift();if(!header||['ID','Date','Category','Amount','Note'].some((v,i)=>header[i]?.trim()!==v))throw Error('หัวตารางต้องเป็น ID,Date,Category,Amount,Note');if(rows.length>10000)throw Error('นำเข้าได้ไม่เกิน 10,000 รายการต่อครั้ง');const seen=new Set(existing.map(t=>String(t.id)));let skipped=0,duplicates=0;const added=[];for(const row of rows){if(row.length<5){skipped++;continue;}const unescape=s=>row[5]==='JodJai-v2'&&/^'(?:'|[\s]*[=+\-@\t\r])/.test(s)?s.slice(1):s;const tx=validateTransaction({id:unescape(row[0]),date:row[1],category:row[2],amount:Number(row[3]),note:unescape(row[4])});if(!tx){skipped++;continue;}if(seen.has(tx.id)){duplicates++;continue;}seen.add(tx.id);added.push(tx);}return {transactions:[...existing,...added],added:added.length,skipped,duplicates};}
export function totals(txs,now=new Date()){let today=0,month=0;for(const tx of txs){if(localDay(new Date(tx.date))===localDay(now))today+=Math.round(tx.amount*100);if(monthOf(tx.date)===localDay(now).slice(0,7))month+=Math.round(tx.amount*100);}return {today:today/100,month:month/100};}
