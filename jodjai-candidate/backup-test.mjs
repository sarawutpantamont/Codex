import assert from 'node:assert/strict';
import {capture,checkpoint,guardedWrite,snapshots,makeBackup,readBackup,validateRecords,mergeRecords,SNAPSHOTS_KEY} from './dist/backup.js';
const tx={id:1,date:'2026-11-06T12:00:00.000Z',amount:42.5,category:'credit_card',note:'original, "quoted"\nบันทึก'};
function memory(seed={}){const map=new Map(Object.entries(seed));return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{map.set(k,String(v));},removeItem:k=>map.delete(k)};}
const storage=memory({transactions:JSON.stringify([tx]),monthlyBudget:'1000',theme:'light',appPin:'1234'});
const before=capture(storage);checkpoint(storage);assert.deepEqual(capture(storage),before);assert.equal(storage.getItem('appPin'),'1234');
const backup=await makeBackup(before,'https://original.example');assert.deepEqual((await readBackup(JSON.stringify(backup))).records,before);
const altered=structuredClone(backup);altered.records.transactions='[]';await assert.rejects(()=>readBackup(JSON.stringify(altered)),/เสียหาย/);
await assert.rejects(()=>readBackup('{bad'),/JSON/);await assert.rejects(()=>readBackup(JSON.stringify({...backup,schema:99})),/รองรับ/);
const invalid=await makeBackup({...before,transactions:JSON.stringify([{...tx,date:'not-a-date'}])},'https://original.example');await assert.rejects(()=>readBackup(JSON.stringify(invalid)),/ไม่ถูกต้อง/);
for(let i=0;i<12;i++)guardedWrite(storage,'transactions',JSON.stringify([{...tx,amount:50+i}]));assert.equal(snapshots(storage).length,8);assert.deepEqual(snapshots(storage)[0].records,before);
const source=memory({transactions:JSON.stringify([tx])});source.setItem=()=>{throw Error('QuotaExceeded');};assert.throws(()=>guardedWrite(source,'transactions','[]'),/QuotaExceeded/);assert.equal(source.getItem('transactions'),JSON.stringify([tx]));
const damaged=memory({transactions:JSON.stringify([tx]),[SNAPSHOTS_KEY]:'broken'});assert.throws(()=>guardedWrite(damaged,'transactions','[]'));assert.equal(damaged.getItem('transactions'),JSON.stringify([tx]));
const same=await mergeRecords([tx],[{...tx,id:'1'}]);assert.equal(same.added,0);assert.equal(same.duplicates,1);
const incoming={...tx,amount:99};const merged=await mergeRecords([tx],[incoming]);assert.equal(merged.transactions.length,2);assert.equal(merged.transactions[0].amount,42.5);assert.equal(merged.transactions[1].amount,99);assert.equal(merged.conflicts,1);
const again=await mergeRecords(merged.transactions,[incoming]);assert.equal(again.transactions.length,2);assert.equal(again.added,0);
assert.throws(()=>validateRecords({...before,monthlyBudget:'-1'}));assert.throws(()=>validateRecords({...before,theme:'unexpected'}));
console.log('PASS: JSON integrity, raw data round trip, schema/record rejection, snapshots retained, quota/corruption blocks destructive writes, additive conflict recovery, repeated restore without duplication.');

const legacy={...tx,category:'unknown',date:'06/11/2569 12:00:00'};const norm=validateRecords({...before,transactions:JSON.stringify([legacy])});assert.equal(norm[0].category,'other');assert.equal(norm[0].date,'2026-11-06T12:00:00.000Z');const normalized=await mergeRecords([],norm);const repeat=await mergeRecords(normalized.transactions,[legacy]);assert.equal(repeat.added,0);console.log('PASS: supported legacy dates and unknown category normalize safely; repeat restore stable.');
