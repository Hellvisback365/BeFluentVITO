// registraBambino.js
import Bambino from './models/Bambino.js'; // Importa Bambino da server.js (dove è definito il modello) - CORREGGI IL PERCORSO
import jwt from 'jsonwebtoken'; // Importa jwt se lo usi (altrimenti rimuovilo)

const registraBambino = async (req, res) => {
    try {
        const bambinoData = req.body;
        console.log("Dati del bambino ricevuti:", bambinoData);

        // Controlla se il bambino esiste già
        const existingBambino = await Bambino.findOne({
            emailGenitore: bambinoData.emailGenitore,
            ID: bambinoData.ID,
            specialistaId: bambinoData.specialistaId // Aggiunto controllo specialistaId
        });

        if (existingBambino) {
            return res.status(409).send({ error: 'Un bambino con questa email e ID è già registrato da questo specialista.' });
        }

        // Crea un nuovo bambino
        const nuovoBambino = new Bambino(bambinoData);
        await nuovoBambino.save();

        // Invia una risposta di successo
        res.status(201).send({ message: 'Bambino registrato con successo!', bambino: nuovoBambino });

    } catch (error) {
        console.error("Errore durante la registrazione del bambino:", error);
        res.status(500).send({ error: 'Errore durante la registrazione del bambino' });
    }
};

export { registraBambino }; // Usa export invece di module.exports