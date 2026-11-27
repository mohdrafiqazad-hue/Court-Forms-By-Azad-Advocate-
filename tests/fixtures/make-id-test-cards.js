/* Makes the MADE-UP ID test cards in this folder (no real person, invented numbers). Needs Playwright and aadhaar-test-front.png. Run from this folder. */
const { chromium } = require('playwright');
const card = body => `<div class="card" style="width:860px;height:540px;background:#f4f2ea;border:1px solid #bbb;border-radius:16px;font-family:Arial;position:relative;padding:28px;box-sizing:border-box;line-height:1.45">${body}</div>`;
const pan = card(`<div style="font-size:24px;font-weight:bold">INCOME TAX DEPARTMENT &nbsp; GOVT. OF INDIA</div><div style="font-size:20px;margin-top:6px">Permanent Account Number Card</div><div style="font-size:30px;font-weight:bold;margin-top:8px">ABCPK1234D</div>
  <div style="margin-top:24px;font-size:18px">Name</div><div style="font-size:26px;font-weight:bold">HARPREET KAUR</div><div style="margin-top:10px;font-size:18px">Father's Name</div><div style="font-size:26px;font-weight:bold">GURDEV SINGH</div>
  <div style="margin-top:10px;font-size:18px">Date of Birth</div><div style="font-size:26px;font-weight:bold">05/03/1992</div>`);
const voter = card(`<div style="font-size:24px;font-weight:bold">ELECTION COMMISSION OF INDIA</div><div style="font-size:20px">ELECTOR PHOTO IDENTITY CARD</div><div style="font-size:28px;font-weight:bold;margin-top:8px">XYZ1234567</div>
  <div style="font-size:24px;margin-top:22px">Elector's Name : Balwinder Kumar</div><div style="font-size:24px">Father's Name : Jagdish Ram</div><div style="font-size:24px">Sex : Male</div><div style="font-size:24px">Date of Birth : 12/07/1978</div>`);
const voterBack = card(`<div style="font-size:24px;margin-top:20px">Address : House No. 45, Gali No. 2, Basti Test, Jalandhar, Punjab 144002</div><div style="font-size:20px;margin-top:30px">Electoral Registration Officer</div>`);
const dl = card(`<div style="font-size:24px;font-weight:bold">Union of India &nbsp; DRIVING LICENCE</div><div style="font-size:20px">Punjab Transport Department</div><div style="font-size:26px;font-weight:bold;margin-top:12px">DL No: PB08 20150001234</div>
  <div style="font-size:24px;margin-top:18px">Name : Simran Arora</div><div style="font-size:24px">D/O : Rakesh Arora</div><div style="font-size:24px">DOB : 21-11-1995</div><div style="font-size:22px">Address : 12, Model Town, Jalandhar, Punjab 144003</div>`);
const passport = card(`<div style="font-size:24px;font-weight:bold">REPUBLIC OF INDIA &nbsp; PASSPORT</div><div style="font-size:22px;margin-top:20px">Surname: SHARMA &nbsp; Given Name(s): ANIL KUMAR</div><div style="font-size:22px">Date of Birth: 14/01/1980 &nbsp; Sex: M</div>
  <div style="position:absolute;left:28px;bottom:40px;font-family:'DejaVu Sans Mono',monospace;font-size:27px;letter-spacing:1px;line-height:1.5">P&lt;INDSHARMA&lt;&lt;ANIL&lt;KUMAR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>Z1234567&lt;4IND8001148M3001019&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6</div>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  for (const [n, html] of [['pan', pan], ['voter', voter], ['voter-back', voterBack], ['dl', dl], ['passport', passport]]) { await p.setContent(html); await (await p.$('.card')).screenshot({ path: 'test-id-' + n + '.png' }); }
  // a phone photo of the Aadhaar front taken sideways (turned 90°), a bit blurred
  const front = require('fs').readFileSync('aadhaar-test-front.png').toString('base64');
  await p.setContent(`<div id="w" style="display:inline-block;padding:30px;background:#666"><img src="data:image/png;base64,${front}" style="transform:rotate(90deg);transform-origin:center;margin:160px -160px;filter:blur(0.6px) contrast(0.8)"></div>`);
  await (await p.$('#w')).screenshot({ path: 'test-id-aadhaar-sideways.jpg', type: 'jpeg', quality: 70 });
  await b.close();
})();
