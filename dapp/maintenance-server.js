import express from 'express';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const MAINTENANCE_FILE = join(__dirname, 'maintenance-status.json');

// Leggi lo stato corrente
app.get('/maintenance-status', async (req, res) => {
  try {
    const data = await fs.readFile(MAINTENANCE_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Errore nella lettura del file:', error);
    res.status(500).json({ error: 'Errore nel recupero dello stato' });
  }
});

// Aggiorna lo stato
app.post('/maintenance-status', async (req, res) => {
  try {
    await fs.writeFile(MAINTENANCE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Errore nella scrittura del file:', error);
    res.status(500).json({ error: 'Errore nel salvataggio dello stato' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server di manutenzione in esecuzione su porta ${PORT}`);
});
