const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'db',
  database: 'my_database',
  password: 'password',
  port: 5432,
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
