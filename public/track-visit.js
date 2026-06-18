(() => {
  fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathname: window.location.pathname }),
    keepalive: true,
  }).catch(() => {})
})()
