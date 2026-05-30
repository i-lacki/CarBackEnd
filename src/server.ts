import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wymagane dla Render/AWS
  }
});

// Bezpieczna inicjalizacja bazy bez await na poziomie głównym
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
  );
`).then(() => {
  return pool.query(`
    INSERT INTO users (username, role) 
    VALUES ('admin', 'ADMIN') 
    ON CONFLICT (username) DO NOTHING;
  `);
}).then(() => {
  console.log("Baza danych zainicjalizowana pomyślnie!");
}).catch(err => {
  console.error("Błąd podczas inicjalizacji bazy:", err);
});

// Routes
app.get('/cars', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM cars ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/cars', async (req: Request, res: Response) => {
  const { make, model, year, price, imageUrl, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO cars (make, model, year, price, image_url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [make, model, year, price, imageUrl, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login route - obsługuje role ADMIN/USER
app.post('/login', async (req: Request, res: Response) => {
  const { username } = req.body;

  try {
    // Prosta logika: jeśli username to 'admin', dajemy ADMINA, inaczej zwykłego USERA
    // Możesz to później rozbudować o zapytanie do bazy (pool.query)
    if (username.toLowerCase() === 'admin') {
      res.json({
        id: '1',
        username: 'admin',
        role: 'ADMIN'
      });
    } else {
      res.json({
        id: Date.now().toString(), // Generujemy tymczasowe ID
        username: username,
        role: 'USER'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check
app.get('/health', (req, res) => res.send('Server is running!'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})