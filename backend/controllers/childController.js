// controllers/bambinoController.js
import Bambino from '../models/Bambino.js'; // Il tuo modello "Bambino"
import jwt from 'jsonwebtoken';

export const confirmBambinoRegistration = async (token) => {
  try {
    // Decodifica il token per ottenere l'ID del bambino
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const bambinoId = decoded.bambinoId; // Assicurati di includere "bambinoId" nel token

    // Trova il record del bambino e aggiorna il flag di conferma
    const bambino = await Bambino.findById(bambinoId);
    if (!bambino) {
      console.error('Bambino non trovato');
      return false; // Bambino non trovato
    }

    if (bambino.confermato) {
      console.log('Questo bambino è già confermato');
      return false; // Bambino già confermato
    }

    // Conferma il bambino
    bambino.confermato = true;
    await bambino.save();
    return true; // Registrazione confermata con successo
  } catch (error) {
    console.error('Errore nella verifica del token:', error);
    return false; // Errore durante il processo
  }
};
