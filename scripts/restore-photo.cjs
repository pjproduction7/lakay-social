(async () => {
  try {
    const fetch = global.fetch;
    const base = 'http://localhost:4000';
    const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const lj = await login.json();
    const token = lj.token;
    console.log('tokenLen', token ? token.length : 0);

    const photoId = 14;
    console.log('restoring', photoId);
    let r = await fetch(`${base}/profiles/photos/${photoId}/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    console.log('restore status', r.status);
    console.log('restore body', await r.text());

    r = await fetch(`${base}/profiles/admin`);
    const p = await r.json();
    console.log('photoIds now', (p.photos||[]).map(x=>x.id));
  } catch (e) {
    console.error('err', e.message || e);
  }
})();