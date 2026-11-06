# rev02 — 2026-10-24

เปิดลิงก์เดิมให้ทุกคนเข้าใช้ได้ เพิ่มหมวดหมู่บัตรเครดิตในรายการรายจ่าย สรุป และ CSV พร้อมปรับแคชออฟไลน์เป็น rev02

ข้อมูลเดิมและ PIN ยังคงอยู่ในเบราว์เซอร์ของแต่ละคน ไม่มีการนำข้อมูลรายจ่ายมาแชร์รวมกัน

## rev02.1 — 2026-10-24

แก้การอัปเดตจากเวอร์ชันเก่าที่อาจใช้ JavaScript ค้างในแคช: เปลี่ยนรุ่นแคชและโหลดไฟล์ใหม่ครบชุด รีเฟรชเมื่อ service worker ใหม่พร้อม หากมีข้อมูลที่ยังกรอกอยู่จะแสดงปุ่มอัปเดตและขอยืนยันก่อนล้างฟอร์ม ไม่ล้าง PIN หรือรายการที่บันทึกแล้ว

## rev02.2 — 2026-11-06

เปิดแอปโดยตรงโดยไม่ต้องใช้ PIN; คงข้อมูลรายจ่าย งบประมาณ ธีม และ PIN เดิมในพื้นที่จัดเก็บเพื่อความเข้ากันได้กับเวอร์ชันก่อนหน้า

## rev02.3 — prepared 2026-11-06, pending approval

Local-only data safety: complete checksummed JSON export/import with non-destructive merge; keep first and seven recent local snapshots before edits; backup verification before user-requested update activation. Offline shell remains on its original origin and refuses redirected update assets. No account, server storage or automatic cross-origin recovery. Existing data formats and legacy PIN keys remain unchanged. A file kept outside the browser is required to recover after browser data loss or a forced new-origin first visit.
