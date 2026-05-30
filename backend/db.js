require('dotenv').config()
const { Client } = require('pg')
const crypto = require('crypto')

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'conference',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
})

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

client.connect()

async function initDB() {
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            login VARCHAR(50) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `)

    await client.query(`
        CREATE TABLE IF NOT EXISTS rooms (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image TEXT,
            category VARCHAR(50)
        )
    `)

    await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            room_id INTEGER REFERENCES rooms(id),
            date VARCHAR(20),
            time VARCHAR(10),
            payment_method VARCHAR(20) DEFAULT 'card',
            status VARCHAR(50) DEFAULT 'Новая',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `)

    await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            booking_id INTEGER REFERENCES bookings(id),
            rating INTEGER,
            text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `)

    const users = await client.query("SELECT COUNT(*) as cnt FROM users")
    if (parseInt(users.rows[0].cnt) === 0) {
        await client.query(
            "INSERT INTO users (login, password, full_name, phone, email) VALUES ($1, $2, $3, $4, $5)",
            [process.env.ADMIN_LOGIN || 'Admin26', hashPassword(process.env.ADMIN_PASSWORD || 'Demo20'),
             process.env.ADMIN_NAME || 'Администратор', process.env.ADMIN_PHONE || '+7 (000) 000-00-00',
             process.env.ADMIN_EMAIL || 'admin@conferences.ru']
        )
    }

    const rooms = await client.query("SELECT COUNT(*) as cnt FROM rooms")
    if (parseInt(rooms.rows[0].cnt) === 0) {
        await client.query(
            "INSERT INTO rooms (name, description, image, category) VALUES ($1, $2, $3, $4)",
            ['Аудитория', 'Комфортная аудитория для лекций, семинаров и презентаций. Есть проектор, доска, современное оборудование.', 'assets/2.jpg', 'auditorium']
        )
        await client.query(
            "INSERT INTO rooms (name, description, image, category) VALUES ($1, $2, $3, $4)",
            ['Коворкинг', 'Просторное место для работы в команде, можно перепланировать. Wi-Fi и напитки включены.', 'assets/1.jpg', 'coworking']
        )
        await client.query(
            "INSERT INTO rooms (name, description, image, category) VALUES ($1, $2, $3, $4)",
            ['Кинозал', 'Небольшой кинозал для просмотров, презентаций и закрытых показов. Вместимость до 50 человек.', 'assets/3.jpg', 'cinema']
        )
    }
}

initDB().catch(err => console.log(err))

module.exports = client
module.exports.hash = hashPassword
