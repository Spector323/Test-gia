var API_URL = 'http://localhost:5000/api'

var userLogin = localStorage.getItem('userLogin')

if (!userLogin || userLogin != 'Admin26') {
    alert('Доступ запрещен')
    window.location.href = 'login.html'
}

var currentPage = 1
var currentFilter = 'all'
var totalBookings = 0
var LIMIT = 10

document.getElementById('logoutBtn').onclick = function(e) {
    e.preventDefault()
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userLogin')
    window.location.href = 'index.html'
}

function showNotif(text) {
    document.getElementById('notifText').textContent = text
    document.getElementById('notifModal').style.display = 'flex'
}

document.getElementById('notifClose').onclick = function() {
    document.getElementById('notifModal').style.display = 'none'
}

document.getElementById('applyFilter').onclick = function() {
    currentFilter = document.getElementById('statusFilter').value
    currentPage = 1
    loadBookings()
}

function loadBookings() {
    var tbody = document.getElementById('adminTableBody')
    tbody.innerHTML = '<tr><td colspan="8">Загрузка...</td></tr>'

    var url = API_URL + '/admin/bookings?page=' + currentPage + '&limit=' + LIMIT
    if (currentFilter != 'all') {
        url += '&status=' + encodeURIComponent(currentFilter)
    }

    fetch(url)
        .then(function(res) { return res.json() })
        .then(function(data) {
            var bookings = data.bookings
            totalBookings = data.total

            if (bookings.length == 0) {
                tbody.innerHTML = '<tr><td colspan="8">Нет заявок</td></tr>'
                renderPagination()
                return
            }

            var html = ''
            for (var i = 0; i < bookings.length; i++) {
                var b = bookings[i]

                var statusBadge = ''
                if (b.status == 'Новая') statusBadge = 'status-new'
                else if (b.status == 'Мероприятие назначено') statusBadge = 'status-approved'
                else if (b.status == 'Мероприятие завершено') statusBadge = 'status-done'

                var actions = ''
                if (b.status == 'Новая') {
                    actions += '<button class="btn btn-small btn-approve" data-id="' + b.id + '" data-status="Мероприятие назначено">Назначить</button> '
                }
                if (b.status == 'Мероприятие назначено') {
                    actions += '<button class="btn btn-small btn-done" data-id="' + b.id + '" data-status="Мероприятие завершено">Завершить</button> '
                }
                actions += '<button class="btn btn-small btn-delete" data-id="' + b.id + '" data-status="delete">Удалить</button>'

                html += '<tr>'
                html += '<td>' + b.id + '</td>'
                if (b.user_name) {
                    html += '<td>' + b.user_name + '</td>'
                } else {
                    html += '<td>Неизвестно</td>'
                }
                if (b.room_title) {
                    html += '<td>' + b.room_title + '</td>'
                } else {
                    html += '<td>#' + b.room_id + '</td>'
                }
                html += '<td>' + b.date + '</td>'
                html += '<td>' + b.time + '</td>'
                if (b.payment_method == 'card') {
                    html += '<td>Карта</td>'
                } else {
                    html += '<td>Наличные</td>'
                }
                html += '<td><span class="' + statusBadge + '">' + b.status + '</span></td>'
                html += '<td>' + actions + '</td>'
                html += '</tr>'
            }

            tbody.innerHTML = html

            var actionBtns = document.querySelectorAll('.btn-approve, .btn-done')
            for (var i = 0; i < actionBtns.length; i++) {
                actionBtns[i].onclick = function() {
                    updateStatus(this.dataset.id, this.dataset.status)
                }
            }

            renderPagination()
        })
        .catch(function() {
            tbody.innerHTML = '<tr><td colspan="8">Ошибка загрузки</td></tr>'
        })
}

function updateStatus(id, status) {
    if (status == 'delete') {
        if (!confirm('Удалить заявку?')) return
    }

    fetch(API_URL + '/admin/bookings/' + id + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
    })
    .then(function(res) { return res.json() })
    .then(function(result) {
        if (result.message) {
            showNotif(result.message)
            loadBookings()
        }
    })
    .catch(function() {
        showNotif('Ошибка обновления')
    })
}

function renderPagination() {
    var pagination = document.getElementById('pagination')
    var totalPages = Math.ceil(totalBookings / LIMIT)

    if (totalPages <= 1) {
        pagination.innerHTML = ''
        return
    }

    var html = ''
    for (var i = 1; i <= totalPages; i++) {
        var active = ''
        if (i == currentPage) active = ' btn-active'
        html += '<button class="btn btn-small' + active + '" data-page="' + i + '">' + i + '</button> '
    }

    pagination.innerHTML = html

    var pageBtns = document.querySelectorAll('[data-page]')
    for (var i = 0; i < pageBtns.length; i++) {
        pageBtns[i].onclick = function() {
            currentPage = Number(this.dataset.page)
            loadBookings()
        }
    }
}

function loadAdminReviews() {
    var tbody = document.getElementById('reviewsTableBody')
    if (!tbody) return
    fetch(API_URL + '/reviews')
        .then(function(res) { return res.json() })
        .then(function(reviews) {
            if (reviews.length == 0) {
                tbody.innerHTML = '<tr><td colspan="6">Нет отзывов</td></tr>'
                return
            }
            var html = ''
            for (var i = 0; i < reviews.length; i++) {
                var r = reviews[i]
                var stars = ''
                for (var j = 0; j < r.rating; j++) stars += '★'
                for (var j = r.rating; j < 5; j++) stars += '☆'
                html += '<tr>'
                html += '<td>' + r.id + '</td>'
                html += '<td>' + (r.user_name || 'Аноним') + '</td>'
                html += '<td>' + stars + '</td>'
                html += '<td>' + (r.comment || '') + '</td>'
                html += '<td>' + (r.created_at || '') + '</td>'
                html += '<td>'
                html += '<button class="btn btn-small btn-approve edit-admin-review" data-id="' + r.id + '" data-rating="' + r.rating + '" data-text="' + encodeURIComponent(r.comment || '') + '">Изменить</button> '
                html += '<button class="btn btn-small btn-delete del-admin-review" data-id="' + r.id + '">Удалить</button>'
                html += '</td></tr>'
            }
            tbody.innerHTML = html

            var editBtns = tbody.querySelectorAll('.edit-admin-review')
            for (var i = 0; i < editBtns.length; i++) {
                editBtns[i].onclick = function() {
                    var id = this.dataset.id
                    var rating = prompt('Рейтинг от 1 до 5:', this.dataset.rating)
                    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
                        var text = prompt('Текст отзыва:', decodeURIComponent(this.dataset.text))
                        if (text) {
                            fetch(API_URL + '/reviews/' + id, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ rating: Number(rating), comment: text })
                            })
                            .then(function(res) { return res.json() })
                            .then(function(result) { showNotif(result.message); loadAdminReviews() })
                            .catch(function() { showNotif('Ошибка') })
                        }
                    }
                }
            }

            var delBtns = tbody.querySelectorAll('.del-admin-review')
            for (var i = 0; i < delBtns.length; i++) {
                delBtns[i].onclick = function() {
                    if (!confirm('Удалить отзыв?')) return
                    fetch(API_URL + '/reviews/' + this.dataset.id, { method: 'DELETE' })
                        .then(function(res) { return res.json() })
                        .then(function(result) { showNotif(result.message); loadAdminReviews() })
                        .catch(function() { showNotif('Ошибка') })
                }
            }
        })
        .catch(function() { tbody.innerHTML = '<tr><td colspan="6">Ошибка загрузки</td></tr>' })
}

document.addEventListener('DOMContentLoaded', function() {
    loadBookings()
    loadAdminReviews()

    var burger = document.getElementById('burger')
    var nav = document.querySelector('.nav')
    if (burger && nav) {
        burger.addEventListener('click', function() {
            nav.classList.toggle('active')
        })
    }
})
