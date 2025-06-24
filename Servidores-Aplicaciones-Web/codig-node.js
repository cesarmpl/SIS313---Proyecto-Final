
// Cargamos las librerías
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Creamos la app Express
const app = express();
const port = 3000;

// Habilitamos el parser de JSON
app.use(bodyParser.json());

// Configuración de conexión a la base de datos (DB Master)
const db = mysql.createConnection({
    host: 'db-master',   // el hostname del master 
    user: 'appuser',          // el usuario de MySQL (appuser)
    password: '12345678',  // la contraseña de appuser
    database: 'crud_db'    // la base de datos que se creó en el servidor
});

// Nos conectamos a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

// --- RUTAS CRUD ---

// READ - obtener todos los registros
app.get('/items', (req, res) => {
    db.query('SELECT * FROM test_table', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

// CREATE - agregar un registro
app.post('/items', (req, res) => {
    const { data } = req.body;
    db.query('INSERT INTO test_table (data) VALUES (?)', [data], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro creado', id: result.insertId });
    });
});

// UPDATE - modificar un registro
app.put('/items/:id', (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    db.query('UPDATE test_table SET data = ? WHERE id = ?', [data, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro actualizado' });
    });
});

// DELETE - eliminar un registro
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM test_table WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json({ message: 'Registro eliminado' });
    });
});

// Iniciamos el servidor
app.listen(port, () => {
    console.log(`App escuchando en http://0.0.0.0:${port}`);
});
