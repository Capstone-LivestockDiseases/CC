const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const mysql = require("mysql");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

app.use(express.json());

const db = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: ''
});

db.connect((error) => {
    if (error) throw error;
    console.log("Connected to database");
});


const isAuthorized = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const splitToken = token.split(' ')[1];

    jwt.verify(splitToken, 'secret', (err, result) => {
        if (err) {
            return res.status(401).json({ message: "Token tidak valid" });
        }
        req.user = result;
        next();
    });
};

app.post('/register', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: true, message: "Semua kolom harus diisi" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: true, message: "Password dan konfirmasi password tidak cocok" });
    }

    const queryEmail = "SELECT * FROM user WHERE email = ?";
    db.query(queryEmail, [email], (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            return res.status(400).json({ error: true, message: "Email sudah digunakan" });
        } 
        const query = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
        db.query(query, [username, email, bcrypt.hashSync(password, saltRounds)], (error, result) => {
            if (error) throw error;
            return res.status(201).json({ success: true, message: "Pendaftaran berhasil" });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const cekEmail = "SELECT * FROM user WHERE email =?";
    db.query(cekEmail, [email], (error, result) => {
        if (error) throw error;
        if (result.length === 0) {
            return res.status(400).json({ error: true, message: "Email tidak ditemukan" });
        }
        const cekPassword = bcrypt.compareSync(password, result[0].password);
        if (!cekPassword) {
            return res.status(400).json({ error: true, message: "Password salah" });
        }
        const token = jwt.sign({
            id: result[0].id,
            email: result[0].email
        }, 'secret', { expiresIn: '1d' });

        return res.status(200).json({
            success: true,
            message: "Login berhasil",
            LoginResult: {
                Id: result[0].id,
                name: result[0].username,
                token: token
            }
        });
    });
});


app.post('/logout', (req, res) => {
    return res.status(200).json({ success: true, message: "Logout berhasil" });
});

app.get('/profile', isAuthorized, (req, res) => {
    const userId = req.user.id;
    const query = 'SELECT id, username, email, password FROM user WHERE id = ?';

    db.query(query, [userId], (error, result) => {
        if (error) {
            console.error('Error fetching user data: ', error);
            return res.status(500).json({ error: true, message: "Gagal mengambil data profil pengguna" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: true, message: "Data pengguna tidak ditemukan" });
        }

        const userData = result[0];

        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + (60 * 60 * 24); 

        const profileData = {
            ...userData,
            iat: currentTime,
            exp: expirationTime
        };

        return res.status(200).json({ user: profileData });
    });
});


app.put('/profile/:id', isAuthorized, (req, res) => {
    const userId = req.params.id;
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: true, message: "Semua kolom harus diisi" });
    }
    const query = 'UPDATE user SET username = ?, email = ?, password = ? WHERE id = ?';
    bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
            console.error('Error hashing password: ', hashError);
            return res.status(500).json({ error: true, message: "Gagal mengubah profil" });
        }
        db.query(query, [username, email, hashedPassword, userId], (error, result) => {
            if (error) {
                console.error('Error executing query: ', error);
                return res.status(500).json({ error: true, message: "Gagal mengubah profil" });
            }

            return res.status(200).json({ success: true, message: "Profil berhasil diubah" });
        });
    });
});

app.get('/getuser', (req, res) => {
    const query = "SELECT * FROM user";
    db.query(query, (error, result) => {
        if (error) throw error;
        return res.status(200).json({ users: result });
    });
});

app.listen(port, () => {
  console.log(`Animal Farm API is listening on port ${port}`);
});



