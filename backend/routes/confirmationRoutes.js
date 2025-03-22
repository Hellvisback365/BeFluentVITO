// routes/confirmationRoutes.js
import express from 'express';
import { confirmBambinoRegistration } from '../controllers/bambinoController.js';

const router = express.Router();

router.get('/conferma/registrazione/:token', async (req, res) => {
    console.log('Rotta di conferma raggiunta'); // Log per il debug
  const { token } = req.params;
  try {
    const confirmationResult = await confirmBambinoRegistration(token);
    if (confirmationResult) {
        res.send('<h1>Registrazione confermata con successo!</h1>');

    } else {
      res.status(400).send('Token non valido o scaduto.');
    }
  } catch (error) {
    console.error('Errore nella conferma della registrazione:', error);
    res.status(500).send('Errore interno del server.');
  }
});

export default router;
