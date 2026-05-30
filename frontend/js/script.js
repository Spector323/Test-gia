var API_URL = 'http://localhost:5000/api'

var roomsData = [
    {
        id: 1,
        title: 'Аудитория',
        description: 'Комфортная аудитория для лекций, семинаров и презентаций. Есть проектор, доска, современное оборудование.',
        image: 'assets/2.jpg'
    },
    {
        id: 2,
        title: 'Коворкинг',
        description: 'Просторное место для работы в команде, можно перепланировать. Wi-Fi и напитки включены.',
        image: 'assets/1.jpg'
    },
    {
        id: 3,
        title: 'Кинозал',
        description: 'Небольшой кинозал для просмотров, презентаций и закрытых показов. Вместимость до 50 человек.',
        image: 'assets/1643087798_5-bigfoto-name-p-id.jpg'
    }
]

function renderRooms() {
    var container = document.getElementById('roomCards')
    if (container == null) return

    for (var i = 0; i < roomsData.length; i++) {
        var room = roomsData[i]
        var card = document.createElement('div')
        card.className = 'room-card'

        var img = document.createElement('img')
        img.src = room.image
        img.alt = room.title
        img.onerror = function() { this.src = 'assets/3.jpg' }
        card.appendChild(img)

        var content = document.createElement('div')
        content.className = 'room-card-content'

        var h3 = document.createElement('h3')
        h3.textContent = room.title
        content.appendChild(h3)

        var p = document.createElement('p')
        p.textContent = room.description
        content.appendChild(p)

        var btn = document.createElement('button')
        btn.className = 'btn book-btn'
        btn.textContent = 'Забронировать'
        btn.setAttribute('data-id', room.id)
        btn.addEventListener('click', function() {
            var userId = localStorage.getItem('userId')
            if (userId) {
                window.location.href = 'booking.html?roomId=' + this.dataset.id
            } else {
                alert('Пожалуйста, войдите или зарегистрируйтесь чтобы забронировать помещение.')
                window.location.href = 'login.html'
            }
        })
        content.appendChild(btn)

        card.appendChild(content)
        container.appendChild(card)
    }
}

function updateHeader() {
    var userId = localStorage.getItem('userId')
    var userName = localStorage.getItem('userName')
    var nav = document.querySelector('.nav ul')

    if (nav) {
        if (userId) {
            var profileLink = document.createElement('li')
            var a = document.createElement('a')
            a.href = 'profile.html'
            a.textContent = 'Личный кабинет'
            profileLink.appendChild(a)

            var logoutLi = document.createElement('li')
            var logoutA = document.createElement('a')
            logoutA.href = '#'
            logoutA.textContent = 'Выйти (' + userName + ')'
            logoutA.onclick = function(e) {
                e.preventDefault()
                localStorage.removeItem('userId')
                localStorage.removeItem('userName')
                localStorage.removeItem('userLogin')
                window.location.href = 'index.html'
            }
            logoutLi.appendChild(logoutA)

            var loginLink = nav.querySelector('a[href="login.html"]')
            var regLink = nav.querySelector('a[href="register.html"]')
            if (loginLink) loginLink.parentElement.remove()
            if (regLink) regLink.parentElement.remove()

            nav.appendChild(profileLink)
            nav.appendChild(logoutLi)
        }
    }
}

function loadReviews() {
    var reviewsList = document.getElementById('reviewsList')
    if (!reviewsList) return

    fetch(API_URL + '/reviews')
        .then(function(res) { return res.json() })
        .then(function(reviews) {
            if (reviews.length == 0) {
                reviewsList.innerHTML = '<p>Пока нет отзывов. Будьте первым!</p>'
                return
            }

            var html = ''
            for (var i = 0; i < reviews.length; i++) {
                var r = reviews[i]
                var stars = ''
                for (var j = 0; j < r.rating; j++) {
                    stars += '★'
                }
                for (var j = r.rating; j < 5; j++) {
                    stars += '☆'
                }

                html += '<div class="review-item">'
                html += '<div class="review-header">'
                html += '<strong>' + (r.user_name || 'Аноним') + '</strong>'
                html += '<span class="review-stars">' + stars + '</span>'
                html += '</div>'
                html += '<p class="review-comment">' + r.comment + '</p>'
                html += '</div>'
            }
            reviewsList.innerHTML = html
        })
        .catch(function() {
            reviewsList.innerHTML = '<p>Ошибка загрузки отзывов</p>'
        })
}

document.addEventListener('DOMContentLoaded', function() {
    renderRooms()
    updateHeader()
    loadReviews()

    var burger = document.getElementById('burger')
    var nav = document.querySelector('.nav')

    if (burger && nav) {
        burger.addEventListener('click', function() {
            nav.classList.toggle('active')
        })

        var links = document.querySelectorAll('.nav a')
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function() {
                nav.classList.remove('active')
            })
        }
    }
})
