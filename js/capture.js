/* i Court Forms — photo fields (type 'photo', e.g. the surety's photo box in Bail Bonds): a picture from the
   camera or the gallery, cut to the box's shape and kept small (JPEG) with the form, on this phone only.
   (Filling details from ID-card photos was tried and removed at the owner's request: details are typed.) */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const t = (k, v) => CF.i18n.t(k, v);

  // ------------------------------------------------------------ picking pictures
  function pick(camera, multiple) {
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      if (camera) inp.setAttribute('capture', 'environment');
      inp.multiple = !!multiple && !camera;
      inp.style.display = 'none';
      inp.onchange = () => { resolve([...inp.files]); inp.remove(); };
      document.body.appendChild(inp); inp.click();
    });
  }
  function loadImage(file) {
    return new Promise((ok, no) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { ok(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = () => { URL.revokeObjectURL(url); no(new Error('image')); };
      img.src = url;
    });
  }
  // ------------------------------------------------------------ photo fields (the surety's photo box)
  async function takePhoto(key, camera) {
    const F = CF.formApi, form = F.form(); if (!form) return;
    const f = form.fields.find(x => x.key === key); if (!f) return;
    const [file] = await pick(camera, false); if (!file) return;
    const img = await loadImage(file);
    const [bw, bh] = f.box || [3, 4];                               // keep the box's shape (width : height)
    const W = 330, H = Math.round(W * bh / bw);
    const iw = img.naturalWidth, ih = img.naturalHeight, k = Math.max(W / iw, H / ih);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
    F.set({ [key]: c.toDataURL('image/jpeg', 0.82) });
    if (CF.act) CF.act.log('photo', form.id);
  }
  function paintPhoto(el, src) {
    const img = el.querySelector('img'), del = el.querySelector('[data-photo-del]');
    img.hidden = !src; if (src) img.src = src; else img.removeAttribute('src');
    del.hidden = !src;
  }

  document.addEventListener('click', e => {
    const ph = e.target.closest('[data-photo-cam],[data-photo-gal]');
    if (ph) { e.preventDefault(); takePhoto(ph.closest('[data-photo]').dataset.photo, ph.hasAttribute('data-photo-cam')); return; }
    const pd = e.target.closest('[data-photo-del]');
    if (pd) { e.preventDefault(); CF.formApi.set({ [pd.closest('[data-photo]').dataset.photo]: '' }); }
  });

  CF.capture = { paintPhoto };
})();
