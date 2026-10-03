// Genera una evidencia PNG estilo terminal a partir de la salida de un comando.
// Uso: node evidence.mjs "<titulo>" "<comando mostrado>" <salida.txt> <destino.png>
// Sin dependencias ni navegador: dibuja el texto con una fuente de consola PSF (Terminus)
// de /usr/share/consolefonts y codifica el PNG con zlib.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gunzipSync, deflateSync } from 'node:zlib';

const [titulo, comando, archivoSalida, destino] = process.argv.slice(2);
if (!titulo || !comando || !archivoSalida || !destino) {
  console.error('Uso: node evidence.mjs "<titulo>" "<comando>" <salida.txt> <destino.png>');
  process.exit(1);
}

// ---------- Fuente PSF ----------
const FUENTES = [
  '/usr/share/consolefonts/Uni2-Terminus20x10.psf.gz',
  '/usr/share/consolefonts/Lat15-Terminus20x10.psf.gz',
  '/usr/share/consolefonts/Lat15-Terminus16.psf.gz',
];
const rutaFuente = process.env.EVIDENCE_FONT || FUENTES.find(existsSync);
if (!rutaFuente) {
  console.error('No se encontró una fuente de consola (instala el paquete console-setup / kbd).');
  process.exit(1);
}

function cargarPsf(ruta) {
  let buf = readFileSync(ruta);
  if (ruta.endsWith('.gz')) buf = gunzipSync(buf);
  const mapa = new Map();
  let glifos, n, alto, ancho, tamGlifo, inicio, tabla;
  if (buf.readUInt32LE(0) === 0x864ab572) {
    // PSF2
    inicio = buf.readUInt32LE(8);
    const flags = buf.readUInt32LE(12);
    n = buf.readUInt32LE(16);
    tamGlifo = buf.readUInt32LE(20);
    alto = buf.readUInt32LE(24);
    ancho = buf.readUInt32LE(28);
    glifos = buf.subarray(inicio, inicio + n * tamGlifo);
    if (flags & 1) {
      tabla = buf.subarray(inicio + n * tamGlifo);
      let g = 0, i = 0;
      while (i < tabla.length && g < n) {
        const b = tabla[i];
        if (b === 0xff) { g++; i++; continue; }
        if (b === 0xfe) { // secuencias combinadas: se ignoran hasta el fin del glifo
          while (i < tabla.length && tabla[i] !== 0xff) i++;
          continue;
        }
        let len = b < 0x80 ? 1 : b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
        const cp = tabla.subarray(i, i + len).toString('utf8').codePointAt(0);
        if (!mapa.has(cp)) mapa.set(cp, g);
        i += len;
      }
    }
  } else if (buf[0] === 0x36 && buf[1] === 0x04) {
    // PSF1
    const modo = buf[2];
    alto = buf[3]; ancho = 8; tamGlifo = alto; inicio = 4;
    n = modo & 1 ? 512 : 256;
    glifos = buf.subarray(4, 4 + n * alto);
    if (modo & 2) {
      tabla = buf.subarray(4 + n * alto);
      let g = 0;
      for (let i = 0; i + 1 < tabla.length && g < n; i += 2) {
        const v = tabla.readUInt16LE(i);
        if (v === 0xffff) { g++; continue; }
        if (v === 0xfffe) continue;
        if (!mapa.has(v)) mapa.set(v, g);
      }
    }
  } else {
    throw new Error(`Formato de fuente no soportado: ${ruta}`);
  }
  if (mapa.size === 0) for (let c = 0; c < Math.min(n, 256); c++) mapa.set(c, c);
  return { glifos, alto, ancho, tamGlifo, bytesFila: Math.ceil(ancho / 8), mapa };
}

const F = cargarPsf(rutaFuente);

// ---------- Texto ----------
// Emojis comunes de los logs → etiquetas legibles; el resto de símbolos sin glifo se omite.
const EMOJIS = { '✅': '[OK]', '✔': '[OK]', '❌': '[ERROR]', '⚠': '[AVISO]', '🚀': '>>', '🔌': '[DB]', '🔗': '[DB]', '📦': '[*]', '🌱': '[SEED]', '⏭': '[SKIP]' };
const limpiar = (t) => [...t.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '').replace(/\t/g, '    ')]
  .map((ch) => EMOJIS[ch] ?? (F.mapa.has(ch.codePointAt(0)) || ch === '\n' ? ch : ''))
  .join('');
const COLS = 110;
const MAX_LINEAS = 60;

let lineas = limpiar(readFileSync(archivoSalida, 'utf8')).trimEnd().split('\n');
if (lineas.length === 1 && lineas[0] === '') lineas = ['(sin salida: comando exitoso)'];
if (lineas.length > MAX_LINEAS) lineas = [...lineas.slice(0, MAX_LINEAS), `... (${lineas.length - MAX_LINEAS} líneas más)`];

const COLOR = {
  fondo: [0x1c, 0x21, 0x28], marco: [0x44, 0x4c, 0x56], barra: [0x2d, 0x33, 0x3b], cuerpo: [0x22, 0x27, 0x2e],
  texto: [0xcd, 0xd9, 0xe5], tenue: [0x76, 0x83, 0x90], titulo: [0xad, 0xba, 0xc7], prompt: [0x57, 0xab, 0x5a],
  rojo: [0xff, 0x5f, 0x56], amarillo: [0xff, 0xbd, 0x2e], verde: [0x27, 0xc9, 0x3f],
};

// Ajuste de línea a COLS caracteres; cada fila visual lleva su color.
const filas = [];
const envolver = (texto, color) => {
  const chars = [...texto];
  if (chars.length === 0) { filas.push({ texto: '', color }); return; }
  for (let i = 0; i < chars.length; i += COLS) filas.push({ texto: chars.slice(i, i + COLS).join(''), color });
};
envolver(`$ ${comando}`, COLOR.prompt);
for (const l of lineas) envolver(l, COLOR.texto);

// ---------- Lienzo ----------
const MARGEN = 20, PAD = 16, BARRA = 36, INTERLINEA = 2;
const altoLinea = F.alto + INTERLINEA;
const anchoVentana = COLS * F.ancho + PAD * 2;
const altoVentana = BARRA + PAD * 2 + filas.length * altoLinea;
const W = anchoVentana + MARGEN * 2;
const H = altoVentana + MARGEN * 2;
const px = Buffer.alloc(W * H * 3);

const pintar = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
};
const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) pintar(i, j, c); };
const circulo = (cx, cy, r, c) => {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) pintar(cx + i, cy + j, c);
};
const dibujarTexto = (x, y, texto, c) => {
  for (const ch of texto) {
    const cp = ch.codePointAt(0);
    const g = F.mapa.get(cp) ?? F.mapa.get(0x3f) ?? 0;
    const base = g * F.tamGlifo;
    for (let fy = 0; fy < F.alto; fy++) {
      for (let fx = 0; fx < F.ancho; fx++) {
        const byte = F.glifos[base + fy * F.bytesFila + (fx >> 3)];
        if (byte & (0x80 >> (fx & 7))) pintar(x + fx, y + fy, c);
      }
    }
    x += F.ancho;
  }
};

rect(0, 0, W, H, COLOR.fondo);
rect(MARGEN - 1, MARGEN - 1, anchoVentana + 2, altoVentana + 2, COLOR.marco);
rect(MARGEN, MARGEN, anchoVentana, BARRA, COLOR.barra);
rect(MARGEN, MARGEN + BARRA, anchoVentana, altoVentana - BARRA, COLOR.cuerpo);

const cyBarra = MARGEN + BARRA / 2;
circulo(MARGEN + 18, cyBarra, 6, COLOR.rojo);
circulo(MARGEN + 38, cyBarra, 6, COLOR.amarillo);
circulo(MARGEN + 58, cyBarra, 6, COLOR.verde);
const yTextoBarra = cyBarra - Math.floor(F.alto / 2);
dibujarTexto(MARGEN + 80, yTextoBarra, titulo, COLOR.titulo);
const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
dibujarTexto(MARGEN + anchoVentana - PAD - [...fecha].length * F.ancho, yTextoBarra, fecha, COLOR.tenue);

filas.forEach((f, i) => dibujarTexto(MARGEN + PAD, MARGEN + BARRA + PAD + i * altoLinea, f.texto, f.color));

// ---------- PNG ----------
const crcTabla = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = crcTabla[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (tipo, datos) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8 bits, RGB
const crudo = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) px.copy(crudo, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(crudo, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(resolve(destino)), { recursive: true });
writeFileSync(destino, png);
console.log(`Evidencia generada: ${destino} (${W}x${H})`);
