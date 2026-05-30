var API_URL = 'http://localhost:5000/api'

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault()

    document.getElementById('loginError').textContent = ''
    document.getElementById('passwordError').textContent = ''

    var login = document.getElementById('login').value.trim()
    var password = document.getElementById('password').value

    if (!login) {
        document.getElementById('loginError').textContent = 'Введите логин'
        return
    }
    if (!password) {
        document.getElementById('passwordError').textContent = 'Введите пароль'
        return
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', API_URL + '/login', true)
    xhr.setRequestHeader('Content-Type', 'application/json')

    xhr.onload = function() {
        var result = JSON.parse(xhr.responseText)
        if (xhr.status == 200) {
            localStorage.setItem('userId', result.id)
            localStorage.setItem('userName', result.full_name)
            localStorage.setItem('userLogin', result.login)

            if (result.login == 'Admin26') {
                window.location.href = 'admin.html'
            } else {
                window.location.href = 'profile.html'
            }
        } else {
            document.getElementById('loginError').textContent = result.message
        }
    }

    xhr.onerror = function() {
        alert('Ошибка соединения с сервером')
    }

    xhr.send(JSON.stringify({ login: login, password: password }))
})
