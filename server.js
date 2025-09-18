
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cafes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        direccion VARCHAR(255),
        cafes_pendientes INTEGER DEFAULT 0,
        usuario_id INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// API Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { usuario, password, nombreCafe, direccion } = req.body;
    
    // Insert user
    const userResult = await pool.query(
      'INSERT INTO usuarios (usuario, password) VALUES ($1, $2) RETURNING id',
      [usuario, password]
    );
    
    const userId = userResult.rows[0].id;
    
    // Insert cafe
    await pool.query(
      'INSERT INTO cafes (nombre, direccion, usuario_id) VALUES ($1, $2, $3)',
      [nombreCafe, direccion, userId]
    );
    
    res.json({ success: true, message: 'Usuario y café registrados exitosamente' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ success: false, message: 'El usuario ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    const result = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1 AND password = $2',
      [usuario, password]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, userId: result.rows[0].id });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Get all cafes
app.get('/api/cafes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, direccion, cafes_pendientes FROM cafes ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Get specific cafe
app.get('/api/cafes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nombre, direccion, cafes_pendientes FROM cafes WHERE id = $1',
      [id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ success: false, message: 'Café no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Update cafe coffee count
app.put('/api/cafes/:id/count', async (req, res) => {
  try {
    const { id } = req.params;
    const { cafes_pendientes } = req.body;
    
    const result = await pool.query(
      'UPDATE cafes SET cafes_pendientes = $1 WHERE id = $2 RETURNING *',
      [cafes_pendientes, id]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, cafe: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Café no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
