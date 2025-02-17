const express = require("express");
const path = require("path");
const open = require("open");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = 3000;

// Ruta temporal para los archivos estáticos
const tempDir = path.join(os.tmpdir(), "housefighters");
const distDir = path.join(__dirname, "dist");

// Copiar archivos de 'dist' a la carpeta temporal
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });

  fs.readdirSync(distDir).forEach(file => {
    fs.copyFileSync(path.join(distDir, file), path.join(tempDir, file));
  });
}

// Servir los archivos desde la carpeta temporal
app.use(express.static(tempDir));

// Redirigir todas las rutas al index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(tempDir, "index.html"));
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Servidor corriendo en ${url}`);
  open(url);
});
