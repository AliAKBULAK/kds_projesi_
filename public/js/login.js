const API_URL = 'http://localhost:3000/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameIn = document.getElementById('username').value;
    const passwordIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    errorMsg.style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameIn, password: passwordIn })
        });

        const data = await res.json();

        if (res.ok) {
            // Success: Save Token
            localStorage.setItem('kds_token', data.token);
            localStorage.setItem('kds_user', data.username);

            // Redirect
            window.location.href = 'index.html';
        } else {
            // Error
            errorMsg.innerText = data.error || 'Giriş başarısız.';
            errorMsg.style.display = 'block';
        }

    } catch (err) {
        console.error(err);
        errorMsg.innerText = 'Sunucu bağlantı hatası.';
        errorMsg.style.display = 'block';
    }
});
