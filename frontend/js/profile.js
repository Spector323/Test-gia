var API_URL = 'http://localhost:5000/api'

var userId = localStorage.getItem('userId')
var userName = localStorage.getItem('userName')

if (!userId) {
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

// слайдер
var slideIndex = 0
var slideInterval

function showSlide(index) {
    var slides = document.querySelectorAll('.slider-img')
    var dots = document.querySelectorAll('.dot')

    if (index >= slides.length) slideIndex = 0
    if (index < 0) slideIndex = slides.length - 1

    for (var i = 0; i < slides.length; i++) {
        slides[i].classList.remove('active')
        if (dots[i]) dots[i].classList.remove('active')
    }

    slides[slideIndex].classList.add('active')
    if (dots[slideIndex]) dots[slideIndex].classList.add('active')
}

function nextSlide() {
    slideIndex++
    showSlide(slideIndex)
}

function prevSlide() {
    slideIndex--
    showSlide(slideIndex)
}

function startSlider() {
    var slides = document.querySelectorAll('.slider-img')
    var dotsContainer = document.getElementById('sliderDots')

    for (var i = 0; i < slides.length; i++) {
        var dot = document.createElement('span')
        dot.className = 'dot'
        if (i == 0) dot.className = 'dot active'
        dot.onclick = (function(index) {
            return function() {
                slideIndex = index
                showSlide(slideIndex)
                clearInterval(slideInterval)
                slideInterval = setInterval(nextSlide, 3000)
            }
        })(i)
        dotsContainer.appendChild(dot)
    }

    document.getElementById('sliderNext').onclick = function() {
        nextSlide()
        clearInterval(slideInterval)
        slideInterval = setInterval(nextSlide, 3000)
    }

    document.getElementById('sliderPrev').onclick = function() {
        prevSlide()
        clearInterval(slideInterval)
        slideInterval = setInterval(nextSlide, 3000)
    }

    slideInterval = setInterval(nextSlide, 3000)
}

function loadProfile() {
    var profileDiv = document.getElementById('profileInfo')

    fetch(API_URL + '/profile/' + userId)
        .then(function(res) { return res.json() })
        .then(function(user) {
            var html = ''
            html += '<p><strong>ФИО:</strong> ' + user.full_name + '</p>'
            html += '<p><strong>Email:</strong> ' + user.email + '</p>'
            if (user.phone) {
                html += '<p><strong>Телефон:</strong> ' + user.phone + '</p>'
            } else {
                html += '<p><strong>Телефон:</strong> не указан</p>'
            }
            html += '<p><strong>Логин:</strong> ' + user.login + '</p>'
            profileDiv.innerHTML = html
        })
        .catch(function() {
            profileDiv.innerHTML = '<p>Ошибка загрузки профиля</p>'
        })
}

function loadBookings() {
    var bookingsDiv = document.getElementById('bookingsList')

    fetch(API_URL + '/profile/' + userId + '/bookings')
        .then(function(res) { return res.json() })
        .then(function(bookings) {
            if (bookings.length == 0) {
                bookingsDiv.innerHTML = '<p>У вас пока нет заявок. <a href="booking.html">Создать заявку</a></p>'
                return
            }

            var html = ''
            for (var i = 0; i < bookings.length; i++) {
                var b = bookings[i]
                var statusClass = ''
                if (b.status == 'Новая') statusClass = 'status-new'
                else if (b.status == 'Мероприятие назначено') statusClass = 'status-approved'
                else if (b.status == 'Мероприятие завершено') statusClass = 'status-done'

                html += '<div class="booking-item">'
                html += '<div class="booking-header">'
                if (b.room_title) {
                    html += '<span class="booking-room">' + b.room_title + '</span>'
                } else {
                    html += '<span class="booking-room">Помещение #' + b.room_id + '</span>'
                }
                html += '<span class="booking-status ' + statusClass + '">' + b.status + '</span>'
                html += '</div>'
                html += '<div class="booking-details">'
                html += '<p>Дата: ' + b.date + ' | Время: ' + b.time + '</p>'
                if (b.payment_method == 'card') {
                    html += '<p>Оплата: Карта</p>'
                } else {
                    html += '<p>Оплата: Наличные</p>'
                }

                if (b.status == 'Мероприятие завершено') {
                    html += '<button class="btn review-btn" data-booking="' + b.id + '">Оставить отзыв</button>'
                }
                html += '</div></div>'
            }
            bookingsDiv.innerHTML = html

            var reviewBtns = document.querySelectorAll('.review-btn')
            for (var i = 0; i < reviewBtns.length; i++) {
                reviewBtns[i].onclick = function() {
                    var bookingId = this.dataset.booking
                    var rating = prompt('Оцените мероприятие от 1 до 5:')
                    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
                        var comment = prompt('Ваш отзыв:')
                        if (comment) {
                            submitReview(bookingId, rating, comment)
                        }
                    }
                }
            }
        })
        .catch(function() {
            bookingsDiv.innerHTML = '<p>Ошибка загрузки заявок</p>'
        })
}

function submitReview(bookingId, rating, comment) {
    fetch(API_URL + '/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: Number(userId),
            booking_id: Number(bookingId),
            rating: Number(rating),
            comment: comment
        })
    })
    .then(function(res) { return res.json() })
    .then(function(result) {
        if (result.message == 'Спасибо за отзыв!') {
            alert('Спасибо за отзыв!')
        } else {
            alert('Ошибка: ' + result.message)
        }
    })
    .catch(function() {
        alert('Ошибка отправки отзыва')
    })
}

function loadMyReviews() {
    var div = document.getElementById('myReviews')
    if (!div) return
    fetch(API_URL + '/profile/' + userId + '/reviews')
        .then(function(res) { return res.json() })
        .then(function(reviews) {
            if (reviews.length == 0) {
                div.innerHTML = '<p>У вас пока нет отзывов</p>'
                return
            }
            var html = ''
            for (var i = 0; i < reviews.length; i++) {
                var r = reviews[i]
                var stars = ''
                for (var j = 0; j < r.rating; j++) stars += '★'
                for (var j = r.rating; j < 5; j++) stars += '☆'
                html += '<div class="booking-item">'
                html += '<div class="booking-header"><span class="booking-room">' + (r.room_title || '') + '</span><span>' + stars + '</span></div>'
                html += '<div class="booking-details"><p>' + r.text + '</p>'
                html += '<button class="btn btn-small edit-review-btn" data-id="' + r.id + '" data-rating="' + r.rating + '" data-text="' + encodeURIComponent(r.text) + '">Изменить</button> '
                html += '<button class="btn btn-small btn-delete del-review-btn" data-id="' + r.id + '">Удалить</button>'
                html += '</div></div>'
            }
            div.innerHTML = html

            var editBtns = div.querySelectorAll('.edit-review-btn')
            for (var i = 0; i < editBtns.length; i++) {
                editBtns[i].onclick = function() {
                    var id = this.dataset.id
                    var rating = prompt('Оцените от 1 до 5:', this.dataset.rating)
                    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
                        var text = prompt('Ваш отзыв:', decodeURIComponent(this.dataset.text))
                        if (text) {
                            fetch(API_URL + '/reviews/' + id, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ rating: Number(rating), comment: text })
                            })
                            .then(function(res) { return res.json() })
                            .then(function(result) { alert(result.message); loadMyReviews() })
                            .catch(function() { alert('Ошибка') })
                        }
                    }
                }
            }

            var delBtns = div.querySelectorAll('.del-review-btn')
            for (var i = 0; i < delBtns.length; i++) {
                delBtns[i].onclick = function() {
                    if (!confirm('Удалить отзыв?')) return
                    fetch(API_URL + '/reviews/' + this.dataset.id, { method: 'DELETE' })
                        .then(function(res) { return res.json() })
                        .then(function(result) { alert(result.message); loadMyReviews() })
                        .catch(function() { alert('Ошибка') })
                }
            }
        })
        .catch(function() { div.innerHTML = '<p>Ошибка загрузки отзывов</p>' })
}

document.addEventListener('DOMContentLoaded', function() {
    startSlider()
    loadProfile()
    loadBookings()
    loadMyReviews()

    var burger = document.getElementById('burger')
    var nav = document.querySelector('.nav')
    if (burger && nav) {
        burger.addEventListener('click', function() {
            nav.classList.toggle('active')
        })
    }
})
