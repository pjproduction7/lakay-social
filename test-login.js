const response = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'Titoutou7@Delmas19' })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data);