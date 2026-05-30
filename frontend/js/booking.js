var API_URL = 'http://localhost:5000/api'

var userId = localStorage.getItem('userId')

if (userId == null) {
    alert('Пожалуйста, войдите в аккаунт')
    window.location.href = 'login.html'
}

document.getElementById('logoutBtn').onclick = function(e) {
    e.preventDefault()
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userLogin')
    window.location.href = 'index.html'
}

function loadRooms() {
    var select = document.getElementById('roomSelect')

    fetch(API_URL + '/rooms')
        .then(function(res) { return res.json() })
        .then(function(rooms) {
            for (var i = 0; i < rooms.length; i++) {
                var option = document.createElement('option')
                option.value = rooms[i].id
                option.textContent = rooms[i].title
                select.appendChild(option)
            }

            var params = new URLSearchParams(window.location.search)
            var roomId = params.get('roomId')
            if (roomId) {
                select.value = roomId
            }
        })
        .catch(function() {
            alert('Ошибка загрузки помещений')
        })
}

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault()

    var errors = document.querySelectorAll('.error-message')
    for (var i = 0; i < errors.length; i++) {
        errors[i].textContent = ''
    }

    var room_id = document.getElementById('roomSelect').value
    var date = document.getElementById('bookingDate').value.trim()
    var time = document.getElementById('bookingTime').value
    var payment_method = document.getElementById('paymentSelect').value

    var isValid = true

    if (!room_id) {
        document.getElementById('roomError').textContent = 'Выберите помещение'
        isValid = false
    }

    var datePattern = /^\d{2}\.\d{2}\.\d{4}$/
    if (!date || !datePattern.test(date)) {
        document.getElementById('dateError').textContent = 'Введите дату в формате ДД.ММ.ГГГГ'
        isValid = false
    }

    if (!time) {
        document.getElementById('timeError').textContent = 'Выберите время'
        isValid = false
    }

    if (!isValid) return

    fetch(API_URL + '/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: Number(userId),
            room_id: Number(room_id),
            date: date,
            time: time,
            payment_method: payment_method
        })
    })
    .then(function(res) { return res.json() })
    .then(function(result) {
        if (result.message == 'Заявка отправлена!') {
            alert('Заявка отправлена! Ожидайте подтверждения администратора.')
            window.location.href = 'profile.html'
        } else {
            alert('Ошибка: ' + result.message)
        }
    })
    .catch(function() {
        alert('Ошибка соединения с сервером')
    })
})

document.addEventListener('DOMContentLoaded', function() {
    loadRooms()

    var burger = document.getElementById('burger')
    var nav = document.querySelector('.nav')
    if (burger && nav) {
        burger.addEventListener('click', function() {
            nav.classList.toggle('active')
        })
    }
})
