/* Makes the MADE-UP Aadhaar-style test cards in this folder (no real person; the number is invented and only
   passes the check digit). Needs: npm i qrcode, Playwright. Run from this folder: node make-aadhaar-test-cards.js */
const QR = require('qrcode'), zlib = require('zlib'), fs = require('fs');
const { chromium } = require('playwright');
const VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const INV = [0,4,3,2,1,5,6,7,8,9];
const check = s => { let c = 0; (s + '0').split('').reverse().forEach((d, i) => { c = VD[c][VP[i % 8][+d]]; }); return INV[c]; };
const num = '23456789012' + check('23456789012');
const fields = ['V2', '3', num.slice(8) + '20250101120000000', 'Test Kumar', '15-08-1985', 'M', 'S/O: Ram Lal', 'Jalandhar', 'Near Test School', 'House No. 12', 'Model Town', '144001', 'Model Town', 'Punjab', 'Main Road', 'Jalandhar-1', 'Jalandhar'];
const raw = Buffer.concat(fields.map(f => Buffer.concat([Buffer.from(f, 'latin1'), Buffer.from([255])])).concat([Buffer.from('fakephotodata', 'latin1')]));
const gz = zlib.gzipSync(raw);
const secure = BigInt('0x' + gz.toString('hex')).toString(10);
const xml = `<?xml version="1.0" encoding="UTF-8"?><PrintLetterBarcodeData uid="${num}" name="Old Card Singh" gender="F" yob="1990" co="W/O Test Singh" house="12" street="Gali 3" lm="" loc="Basti Test" vtc="Jalandhar" po="Basti Sheikh" dist="Jalandhar" subdist="Jalandhar-2" state="Punjab" pc="144002" dob="01/02/1990"/>`;
(async () => {
  const qrS = await QR.toDataURL([{ data: secure, mode: 'numeric' }], { errorCorrectionLevel: 'M', margin: 2, scale: 4 });
  const qrX = await QR.toDataURL(xml, { errorCorrectionLevel: 'M', margin: 2, scale: 4 });
  const card = (body, qr) => `<div class="card" style="width:860px;height:540px;background:#fbf7ee;border:1px solid #ccc;border-radius:18px;font-family:Arial;position:relative;padding:28px;box-sizing:border-box">${body}${qr ? `<img src="${qr}" style="position:absolute;right:30px;bottom:30px;width:300px">` : ''}</div>`;
  const front = card(`<div style="font-size:26px;font-weight:bold">Government of India</div><div style="margin-top:70px;font-size:30px;line-height:1.6">Test Kumar<br>DOB: 15/08/1985<br>MALE</div><div style="margin-top:60px;font-size:44px;font-weight:bold;letter-spacing:2px">${num.replace(/(\d{4})(?=\d)/g, '$1 ')}</div>`);
  const back = card(`<div style="font-size:24px;font-weight:bold">Unique Identification Authority of India</div><div style="margin-top:40px;font-size:26px;line-height:1.5;width:470px">Address:<br>S/O: Ram Lal, House No. 12, Main Road, Near Test School, Model Town, Jalandhar, Punjab - 144001</div><div style="margin-top:30px;font-size:36px;font-weight:bold">${num.replace(/(\d{4})(?=\d)/g, '$1 ')}</div>`, qrS);
  const old = card(`<div style="font-size:26px;font-weight:bold">Government of India</div><div style="margin-top:70px;font-size:30px;line-height:1.6;width:420px">Old Card Singh<br>DOB: 01/02/1990<br>FEMALE</div>`, qrX);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  for (const [n, html] of [['front', front], ['back', back], ['old', old]]) { await p.setContent(html); await (await p.$('.card')).screenshot({ path: n + '.png' }); }
  // a phone-like photo: the back, rotated a little and smaller
  await p.setContent(`<div style="padding:60px;background:#777"><div style="transform:rotate(-4deg)">${back}</div></div>`); await p.screenshot({ path: 'back-photo.jpg', quality: 80, type: 'jpeg' });
  await b.close();
  fs.writeFileSync('num.txt', num);
  console.log('aadhaar', num, 'secure digits', secure.length);
})();
