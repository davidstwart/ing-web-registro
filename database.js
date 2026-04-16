const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('visitantes.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS visitas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_visitante TEXT,
      dni TEXT,
      funcionario_visitado TEXT,
      despacho TEXT,
      fecha TEXT,
      hora_entrada TEXT,
      hora_salida TEXT
    )
  `);
});

module.exports = db;