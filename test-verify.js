const http = require('http');
fetch('http://localhost:4001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'artista@piums.com', password: 'password123' })
}).then(res => res.json()).then(data => {
  return fetch('http://localhost:4001/auth/verify', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${data.token}` }
  }).then(res2 => res2.json()).then(verifyData => console.log(verifyData));
});
