const response = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data);

// If login successful, try to access admin endpoint
if (response.ok && data.token) {
  console.log('Login successful, token:', data.token);

  // Try to access admin stats
  const adminResponse = await fetch('http://localhost:4000/admin/stats', {
    headers: { 'Authorization': `Bearer ${data.token}` }
  });

  console.log('Admin stats status:', adminResponse.status);
  if (adminResponse.ok) {
    console.log('Admin access granted');
  } else {
    console.log('Admin access denied:', await adminResponse.text());
  }

  // Simulate logout by just logging the token (client-side logout)
  console.log('Logging out...');
} else {
  console.log('Login failed');
}