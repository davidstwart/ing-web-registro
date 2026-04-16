const express = require('express');
const db = require('./database');
const { calcularPermanencia } = require('./utils');
const { parse } = require('json2csv');
const XLSX = require('xlsx');

const app = express();
app.use(express.json());

// 1. Registro de entrada
app.post('/visitas', (req, res) => {
  const { nombre_visitante, dni, funcionario_visitado, despacho, hora_entrada } = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  const sql = `INSERT INTO visitas (nombre_visitante, dni, funcionario_visitado, despacho, fecha, hora_entrada)
                 VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(sql, [nombre_visitante, dni, funcionario_visitado, despacho, fecha, hora_entrada], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: "Entrada registrada" });
  });
});

// 2. Registro de salida
app.put('/visitas/:id/salida', (req, res) => {
  const { id } = req.params;
  const { hora_salida } = req.body;

  const sql = "UPDATE visitas SET hora_salida = ? WHERE id = ?";
  db.run(sql, [hora_salida, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Visita no encontrada" });
    res.json({ message: "Salida registrada exitosamente" });
  });
});

// 3. Consultas con filtros
app.get('/visitas', (req, res) => {
  const { dni, despacho, fecha } = req.query;
  let sql = "SELECT * FROM visitas WHERE 1=1";
  const params = [];

  if (dni) { sql += " AND dni = ?"; params.push(dni); }
  if (despacho) { sql += " AND despacho = ?"; params.push(despacho); }
  if (fecha) { sql += " AND fecha = ?"; params.push(fecha); }

  db.all(sql, params, (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });

    const resultado = filas.map(v => ({
      ...v,
      permanencia: calcularPermanencia(v.hora_entrada, v.hora_salida)
    }));
    res.json(resultado);
  });
});

// 4. Exportación (CSV o Excel)
app.get('/exportar/:formato', (req, res) => {
  const { formato } = req.params;

  db.all("SELECT * FROM visitas", [], (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });

    const datos = filas.map(v => ({
      "Visitante": v.nombre_visitante,
      "DNI": v.dni,
      "Funcionario": v.funcionario_visitado,
      "Despacho": v.despacho,
      "Fecha": v.fecha,
      "Entrada": v.hora_entrada,
      "Salida": v.hora_salida || "No registrada",
      "Permanencia": calcularPermanencia(v.hora_entrada, v.hora_salida)
    }));

    if (formato === 'csv') {
      const csv = parse(datos);
      res.header('Content-Type', 'text/csv');
      res.attachment('reporte.csv');
      return res.send(csv);
    }

    if (formato === 'excel') {
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Visitas");
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment('reporte.xlsx');
      return res.send(buf);
    }

    res.status(400).json({ error: "Formato no válido" });
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});