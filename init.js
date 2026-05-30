const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://car_bazadanych_user:WiliP47LvUD6yw9kvyTC6tT0H7XuGQdY@dpg-d8abfup9rddc73a028j0-a.frankfurt-postgres.render.com/car_bazadanych",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id SERIAL PRIMARY KEY,
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INTEGER,
      price DECIMAL(10, 2),
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Tabela stworzona!");
  await client.end();
}
run();