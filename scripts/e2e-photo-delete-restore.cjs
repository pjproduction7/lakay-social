const fs = require('fs');
const path = require('path');
const fetch = global.fetch;
(async () => {
  try {
    const base = 'http://localhost:4000';

    // 1) Login
    console.log('Logging in as admin...');
    let r = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    if (!r.ok) throw new Error(`Login failed: ${r.status} ${await r.text()}`);
    const loginJson = await r.json();
    const token = loginJson.token;
    console.log('Got token (len):', token ? token.length : 'none');

    // 2) Get profile
    const username = loginJson.user.username;
    console.log('Fetching profile for', username);
    r = await fetch(`${base}/profiles/${username}`);
    if (!r.ok) throw new Error(`Profile fetch failed: ${r.status} ${await r.text()}`);
    let profile = await r.json();
    console.log('Profile photos count:', (profile.photos || []).length);

    // 3) If no photos, upload a tiny PNG
    let targetPhotoId = null;
    if (!profile.photos || profile.photos.length === 0) {
      console.log('No photos found — uploading a tiny PNG as test...');
      const tmpFile = path.join(process.cwd(), 'scripts', 'tiny.png');
      // 1x1 transparent PNG base64
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAKb7B0sAAAAASUVORK5CYII=';
      fs.writeFileSync(tmpFile, Buffer.from(b64, 'base64'));

      const FormData = global.FormData;
      const fd = new FormData();
      fd.append('photos', fs.createReadStream(tmpFile));

      r = await fetch(`${base}/profiles/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (!r.ok) throw new Error(`Upload failed: ${r.status} ${await r.text()}`);
      const up = await r.json();
      console.log('Uploaded photos:', up.photos.length);
      targetPhotoId = up.photos[0].id;
    } else {
      targetPhotoId = profile.photos[0].id;
      console.log('Using existing photo id', targetPhotoId);
    }

    // 4) Delete the photo (soft-delete)
    console.log('Deleting photo id', targetPhotoId);
    r = await fetch(`${base}/profiles/photos/${targetPhotoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete status', r.status, 'body', await r.text());

    // 5) Confirm delete via GET profile
    r = await fetch(`${base}/profiles/${username}`);
    profile = await r.json();
    const foundAfterDelete = (profile.photos || []).find(p => p.id === targetPhotoId);
    console.log('Found after delete?', Boolean(foundAfterDelete));

    // 6) Restore
    console.log('Restoring photo id', targetPhotoId);
    r = await fetch(`${base}/profiles/photos/${targetPhotoId}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' }
    });
    console.log('Restore status', r.status, 'body', await r.text());

    // 7) Confirm restore via GET profile
    r = await fetch(`${base}/profiles/${username}`);
    profile = await r.json();
    const foundAfterRestore = (profile.photos || []).find(p => p.id === targetPhotoId);
    console.log('Found after restore?', Boolean(foundAfterRestore));

    console.log('E2E photo delete/restore sequence complete.');
  } catch (err) {
    console.error('E2E script failed:', err);
    process.exit(1);
  }
})();