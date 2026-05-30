require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const db = require('./db')

let app = express()
let PORT = process.env.PORT || 5000

app.use(cors())
app.use(bodyParser.json())

app.get('/api/rooms', async function(req, res) {
    try {
        let result = await db.query("SELECT id, name as title, description, image, category FROM rooms")
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/rooms/:id', async function(req, res) {
    try {
        let result = await db.query("SELECT id, name as title, description, image, category FROM rooms WHERE id = $1", [req.params.id])
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Не найдено' })
        }
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.post('/api/register', async function(req, res) {
    let login = req.body.login
    let password = req.body.password
    let full_name = req.body.full_name
    let phone = req.body.phone
    let email = req.body.email

    if (!login || !password || !full_name || !email) {
        return res.status(400).json({ message: 'Заполните обязательные поля' })
    }
    if (!/^[A-Za-z0-9]{6,}$/.test(login)) {
        return res.status(400).json({ message: 'Логин должен содержать только латинские буквы и цифры, минимум 6 символов' })
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Пароль минимум 8 символов' })
    }

    try {
        let hashed = db.hash(password)
        await db.query(
            "INSERT INTO users (login, password, full_name, phone, email) VALUES ($1, $2, $3, $4, $5)",
            [login, hashed, full_name, phone, email]
        )
        res.status(201).json({ message: 'Регистрация успешна!' })
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Логин уже занят' })
        }
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.post('/api/login', async function(req, res) {
    let login = req.body.login
    let password = req.body.password

    if (!login || !password) {
        return res.status(400).json({ message: 'Введите логин и пароль' })
    }

    try {
        let result = await db.query("SELECT * FROM users WHERE login = $1 AND password = $2",
            [login, db.hash(password)])
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' })
        }
        let user = result.rows[0]
        res.json({
            id: user.id,
            login: user.login,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email
        })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/profile/:id', async function(req, res) {
    try {
        let result = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id])
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Не найден' })
        }
        let user = result.rows[0]
        res.json({
            id: user.id,
            login: user.login,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email
        })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/profile/:id/bookings', async function(req, res) {
    try {
        let result = await db.query(
            "SELECT b.*, r.name as room_title FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.user_id = $1 ORDER BY b.created_at DESC",
            [req.params.id])
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.post('/api/bookings', async function(req, res) {
    let user_id = req.body.user_id
    let room_id = req.body.room_id
    let date = req.body.date
    let time = req.body.time
    let payment_method = req.body.payment_method || 'card'

    if (!user_id || !room_id || !date || !time) {
        return res.status(400).json({ message: 'Заполните все поля' })
    }

    try {
        await db.query(
            "INSERT INTO bookings (user_id, room_id, date, time, payment_method, status) VALUES ($1, $2, $3, $4, $5, 'Новая')",
            [user_id, room_id, date, time, payment_method])
        res.status(201).json({ message: 'Заявка отправлена!' })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.post('/api/reviews', async function(req, res) {
    let user_id = req.body.user_id
    let booking_id = req.body.booking_id
    let rating = req.body.rating
    let text = req.body.text || req.body.comment

    if (!user_id || !booking_id || !rating || !text) {
        return res.status(400).json({ message: 'Заполните все поля' })
    }

    try {
        await db.query(
            "INSERT INTO reviews (user_id, booking_id, rating, text) VALUES ($1, $2, $3, $4)",
            [user_id, booking_id, rating, text])
        res.status(201).json({ message: 'Спасибо за отзыв!' })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/reviews', async function(req, res) {
    try {
        let result = await db.query(
            "SELECT r.id, r.user_id, r.booking_id, r.rating, r.text as comment, r.created_at, u.full_name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC")
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/profile/:id/reviews', async function(req, res) {
    try {
        let result = await db.query(
            "SELECT r.*, b.room_id, rm.name as room_title FROM reviews r LEFT JOIN bookings b ON r.booking_id = b.id LEFT JOIN rooms rm ON b.room_id = rm.id WHERE r.user_id = $1 ORDER BY r.created_at DESC",
            [req.params.id])
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.put('/api/reviews/:id', async function(req, res) {
    let rating = req.body.rating
    let text = req.body.text || req.body.comment
    if (!rating || !text) {
        return res.status(400).json({ message: 'Заполните поля' })
    }
    try {
        let result = await db.query("UPDATE reviews SET rating = $1, text = $2 WHERE id = $3", [rating, text, req.params.id])
        if (result.rowCount === 0) return res.status(404).json({ message: 'Не найдено' })
        res.json({ message: 'Отзыв обновлен!' })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.delete('/api/reviews/:id', async function(req, res) {
    try {
        let result = await db.query("DELETE FROM reviews WHERE id = $1", [req.params.id])
        if (result.rowCount === 0) return res.status(404).json({ message: 'Не найдено' })
        res.json({ message: 'Отзыв удален!' })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.get('/api/admin/bookings', async function(req, res) {
    let status = req.query.status
    let page = Number(req.query.page) || 1
    let limit = Number(req.query.limit) || 10
    let offset = (page - 1) * limit

    let query = "SELECT b.*, r.name as room_title, u.full_name as user_name, u.email as user_email FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id LEFT JOIN users u ON b.user_id = u.id"
    let countQ = "SELECT COUNT(*) as total FROM bookings b"
    let params = []
    let countParams = []

    if (status && status !== 'all') {
        query += " WHERE b.status = $1"
        countQ += " WHERE b.status = $1"
        params.push(status)
        countParams.push(status)
    }

    query += " ORDER BY b.created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2)
    params.push(limit, offset)

    try {
        let rowsResult = await db.query(query, params)
        let countResult = await db.query(countQ, countParams)
        res.json({ bookings: rowsResult.rows, total: parseInt(countResult.rows[0].total) })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.put('/api/admin/bookings/:id/status', async function(req, res) {
    let status = req.body.status
    if (!status) {
        return res.status(400).json({ message: 'Укажите статус' })
    }

    try {
        let result = await db.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, req.params.id])
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Не найдено' })
        }
        res.json({ message: 'Статус обновлен!' })
    } catch (err) {
        res.status(500).json({ message: 'Ошибка' })
    }
})

app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')))
app.use(express.static(path.join(__dirname, '..', 'frontend')))

app.listen(PORT, function() {
    console.log('Сервер запущен на порту ' + PORT)
})
