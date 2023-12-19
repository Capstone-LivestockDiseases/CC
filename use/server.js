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
    user: 'root',
    password: '',
    database: 'animal_farm'
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

app.get('/getuser', (req, res) => {
    const query = "SELECT * FROM user";
    db.query(query, (error, result) => {
        if (error) throw error;
        return res.status(200).json({ users: result });
    });
});

app.get('/profile', isAuthorized, (req, res) => {
    return res.status(200).json({
        user: req.user
    });
});

app.put('/profile/:id', isAuthorized, (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: true, message: "Semua kolom harus diisi" });
    }

    const query = 'UPDATE user SET username = ?, email = ? WHERE id = ?';

    db.query(query, [username, email, userId], (error, result) => {
        if (error) {
            console.error('Error executing query: ', error);
            return res.status(500).json({ error: true, message: "Gagal mengubah profil" });
        }

        return res.status(200).json({ success: true, message: "Profil berhasil diubah" });
    });
});


app.post('/regsapi/:id', (req, res) => {
    const { demam, bengkak, tidakmakan } = req.body;

    if (!demam || !bengkak || !tidakmakan) {
        return res.status(400).json({ error: true, message: "Semua kolom harus diisi" });
    }

    const newData = { demam, bengkak, tidakmakan };
    const query = 'INSERT INTO lumpy (demam, bengkak, tidakmakan) VALUES (?, ?, ?)';
    db.query(query, [demam, bengkak, tidakmakan], (error, results) => {
        if (error) throw error;{
        return res.status(200).json({ success: true, message: "Data berhasil disimpan di database", newData });
    }});
});

app.get('/getsapi/:id', (req, res) => {
    const query = "SELECT * FROM lumpy";
    db.query(query, (error, result) => {
        if (error) throw error;
        return res.status(200).json({ sapi: result });
    });
});

app.put('/updatesapi/:sapi_id/:id', (req, res) => {
    const sapi_id = req.params.sapi_id;
    const { demam, bengkak, tidakmakan } = req.body;

    if (!demam || !bengkak || !tidakmakan) {
        return res.status(400).json({ error: true, message: "Data tidak sesuai dengan kondisi sapi lumpy" });
    }
    const query = 'UPDATE lumpy SET demam = ?, bengkak = ?, tidakmakan = ? WHERE sapi_id = ?';
        db.query(query, [demam, bengkak, tidakmakan, sapi_id], (error, result) => {
            if (error) {
                console.error('Error executing query: ', error);
                return res.status(500).json({ error: true, message: "Gagal mengubah" });
            }
    
            return res.status(200).json({ success: true, message: "Data sapi berhasil diperbarui", updatedsapi: sapi_id });
        });
});

app.post('/regdomba/:id', (req, res) => {
    const { demam, nafasberat, lidahbiru } = req.body;

    if (!demam || !nafasberat || !lidahbiru) {
        return res.status(400).json({ error: true, message: "Semua kolom harus diisi" });
    }

    const newData = { demam, nafasberat, lidahbiru };
    const query = 'INSERT INTO bluetongue (demam, nafasberat, lidahbiru) VALUES (?, ?, ?)';
    db.query(query, [demam, nafasberat, lidahbiru], (error, results) => {
        if (error) throw error;{
        return res.status(200).json({ success: true, message: "Data berhasil disimpan di database", newData });
    }});
});

// app.post('/regdomba', (req, res) => {
//     const { demam, nafasberat, lidahbiru } = req.body;

//     if (demam !== true || nafasberat !== true || lidahbiru !== true) {
//         return res.status(400).json({ error: true, message: "Data tidak sesuai dengan kondisi domba bluetongue" });
//     }

//     const newData = { demam, nafasberat, lidahbiru };
//     const query = 'INSERT INTO bluetongue_sheep (demam, nafasberat, lidahbiru) VALUES (?, ?, ?)';
//     db.query(query, [demam, nafasberat, lidahbiru], (error, results) => {
//         if (error) throw error;
//         return res.status(200).json({ success: true, message: "Data berhasil disimpan di database", newData });
//     });
// });

app.get('/getdomba/:id', (req, res) => {
    const query = "SELECT * FROM bluetongue";
    db.query(query, (error, result) => {
        if (error) throw error;
        return res.status(200).json({ sheep: result });
    });
});


app.put('/updatedomba/:domba_id/:id', (req, res) => {
    const domba_id = req.params.domba_id;
    const { demam, nafasberat, lidahbiru } = req.body;

    if (!demam || !nafasberat || !lidahbiru) {
        return res.status(400).json({ error: true, message: "Data tidak sesuai dengan kondisi domba bluetongue" });
    }

    const query = 'UPDATE bluetongue SET demam = ?, nafasberat = ?, lidahbiru = ? WHERE domba_id = ?';
    db.query(query, [demam, nafasberat, lidahbiru, domba_id], (error, result) => {
        if (error) {
            console.error('Error executing query: ', error);
            return res.status(500).json({ error: true, message: "Gagal mengubah" });
        }

        return res.status(200).json({ success: true, message: "Data domba berhasil diperbarui", updateddomba: domba_id });
    });
});

app.post('/focus_sapi/:id', (req, res) => {
    const { sapi_id, id } = req.body;

    const checkSapiQuery = 'SELECT * FROM lumpy WHERE sapi_id = ?';
    db.query(checkSapiQuery, [sapi_id], (checkError, checkResult) => {
        if (checkError) {
            console.error('Error executing check query: ', checkError);
            return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
        }

        if (checkResult.length > 0) {
            const checkUserQuery = 'SELECT * FROM user WHERE id = ?';
            db.query(checkUserQuery, [id], (userError, userResult) => {
                if (userError) {
                    console.error('Error executing user check query: ', userError);
                    return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                }

                if (userResult.length > 0) {
                    const checkFocusQuery = 'SELECT * FROM focus_sapi WHERE sapi_id = ?';
                    db.query(checkFocusQuery, [sapi_id], (focusError, focusResult) => {
                        if (focusError) {
                            console.error('Error executing focus check query: ', focusError);
                            return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                        }

                        if (focusResult.length === 0) {
                            const insertQuery = 'INSERT INTO focus_sapi (sapi_id) VALUES (?)';
                            db.query(insertQuery, [sapi_id], (insertError, insertResult) => {
                                if (insertError) {
                                    console.error('Error executing insert query: ', insertError);
                                    return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                                }

                                return res.status(200).json({ success: true, message: "Berhasil" });
                            });
                        } else {
                            return res.status(400).json({ error: true, message: "Sapi sudah ada dalam focus" });
                        }
                    });
                } else {
                    return res.status(404).json({ error: true, message: "User tidak ditemukan" });
                }
            });
        } else {
            return res.status(404).json({ error: true, message: "Sapi tidak ditemukan dalam lumpy" });
        }
    });
});

app.delete('/del_focus_sapi/:id', (req, res) => {
    const sapi_id = req.params.sapi_id;

    const checkSapiQuery = 'SELECT * FROM focus_sapi WHERE sapi_id = ?';
    db.query(checkSapiQuery, [sapi_id], (checkError, checkResult) => {
        if (checkError) {
            console.error('Error executing check query: ', checkError);
            return res.status(500).json({ error: true, message: "Gagal menghapus dari focus" });
        }

        if (checkResult.length > 0) {
            const deleteQuery = 'DELETE FROM focus_sapi WHERE sapi_id = ?';
            db.query(deleteQuery, [sapi_id], (deleteError, deleteResult) => {
                if (deleteError) {
                    console.error('Error executing delete query: ', deleteError);
                    return res.status(500).json({ error: true, message: "Gagal menghapus dari focus" });
                }

                if (deleteResult.affectedRows > 0) {
                    return res.status(200).json({ success: true, message: "Berhasil menghapus data dari focus_sapi" });
                } else {
                    return res.status(404).json({ error: true, message: "Data tidak ditemukan dalam focus_sapi" });
                }
            });
        } else {
            return res.status(404).json({ error: true, message: "Sapi tidak ditemukan dalam focus_sapi" });
        }
    });
});


app.post('/focus_domba/:id', (req, res) => {
    const { domba_id, id } = req.body;

    const checkDombaQuery = 'SELECT * FROM bluetongue WHERE domba_id = ?';
    db.query(checkDombaQuery, [domba_id], (checkError, checkResult) => {
        if (checkError) {
            console.error('Error executing check query: ', checkError);
            return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
        }

        if (checkResult.length > 0) {
            const checkUserQuery = 'SELECT * FROM user WHERE id = ?';
            db.query(checkUserQuery, [id], (userError, userResult) => {
                if (userError) {
                    console.error('Error executing user check query: ', userError);
                    return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                }

                if (userResult.length > 0) {
                    const checkFocusQuery = 'SELECT * FROM focus_domba WHERE domba_id = ?';
                    db.query(checkFocusQuery, [domba_id], (focusError, focusResult) => {
                        if (focusError) {
                            console.error('Error executing focus check query: ', focusError);
                            return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                        }

                        if (focusResult.length === 0) {
                            const insertQuery = 'INSERT INTO focus_domba (domba_id) VALUES (?)';
                            db.query(insertQuery, [domba_id], (insertError, insertResult) => {
                                if (insertError) {
                                    console.error('Error executing insert query: ', insertError);
                                    return res.status(500).json({ error: true, message: "Gagal menambahkan ke focus" });
                                }

                                return res.status(200).json({ success: true, message: "Berhasil" });
                            });
                        } else {
                            return res.status(400).json({ error: true, message: "Domba sudah ada dalam focus" });
                        }
                    });
                } else {
                    return res.status(404).json({ error: true, message: "User tidak ditemukan" });
                }
            });
        } else {
            return res.status(404).json({ error: true, message: "Domba tidak ditemukan dalam bluetongue" });
        }
    });
});

app.delete('/del_focus_domba/:id', (req, res) => {
    const domba_id = req.params.id;

    const checkDombaQuery = 'SELECT * FROM focus_domba WHERE domba_id = ?';
    db.query(checkDombaQuery, [domba_id], (checkError, checkResult) => {
        if (checkError) {
            console.error('Error executing check query: ', checkError);
            return res.status(500).json({ error: true, message: "Gagal menghapus dari focus" });
        }

        if (checkResult.length > 0) {
            const deleteQuery = 'DELETE FROM focus_domba WHERE domba_id = ?';
            db.query(deleteQuery, [domba_id], (deleteError, deleteResult) => {
                if (deleteError) {
                    console.error('Error executing delete query: ', deleteError);
                    return res.status(500).json({ error: true, message: "Gagal menghapus dari focus" });
                }

                if (deleteResult.affectedRows > 0) {
                    return res.status(200).json({ success: true, message: "Berhasil menghapus data dari focus_domba" });
                } else {
                    return res.status(404).json({ error: true, message: "Data tidak ditemukan dalam focus_domba" });
                }
            });
        } else {
            return res.status(404).json({ error: true, message: "Domba tidak ditemukan dalam focus_domba" });
        }
    });
});



app.listen(port, () => {
  console.log(`Animal Farm API is listening on port ${port}`);
});



