var API_URL = 'http://localhost:5000/api'

function showError(id, text) {
    document.getElementById(id).textContent = text
}

function clearErrors() {
    var errors = document.querySelectorAll('.error-message')
    for (var i = 0; i < errors.length; i++) {
        errors[i].textContent = ''
    }
}

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault()
    clearErrors()

    var login = document.getElementById('login').value.trim()
    var password = document.getElementById('password').value
    var full_name = document.getElementById('full_name').value.trim()
    var phone = document.getElementById('phone').value.trim()
    var email = document.getElementById('email').value.trim()

    var isValid = true

    if (!/^[A-Za-z0-9]{6,}$/.test(login)) {
        showError('loginError', 'Логин: только латинские буквы и цифры, мин. 6 символов')
        isValid = false
    }

    if (password.length < 8) {
        showError('passwordError', 'Пароль должен быть минимум 8 символов')
        isValid = false
    }

    if (full_name.length < 3) {
        showError('nameError', 'Введите полное имя')
        isValid = false
    }

    if (email.indexOf('@') == -1 || email.indexOf('.') == -1) {
        showError('emailError', 'Введите корректный email')
        isValid = false
    }

    if (!isValid) return

    fetch(API_URL + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            login: login,
            password: password,
            full_name: full_name,
            phone: phone,
            email: email
        })
    })
    .then(function(res) { return res.json() })
    .then(function(result) {
        if (result.message == 'Регистрация успешна!') {
            alert('Регистрация прошла успешно! Теперь войдите в аккаунт.')
            window.location.href = 'login.html'
        } else {
            alert('Ошибка: ' + result.message)
        }
    })
    .catch(function() {
        alert('Ошибка соединения с сервером')
    })
})
