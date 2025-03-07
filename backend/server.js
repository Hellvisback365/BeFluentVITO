import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import Specialista from './models/Specialista.js'; 
import { genSalt, hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Bambino from './models/Bambino.js'; 
import mongoose from 'mongoose';
import validator from 'validator';
import Report from './models/Report.js';
import Stripe from 'stripe';
import Iscrizione from './models/Iscrizione,js';
import { inviaEmailConferma } from '../src/Specialista/emailService.js';
import bodyParser from 'body-parser';

dotenv.config(); // Carica variabili d'ambiente



const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Estrae il token dal campo "Authorization"
    //Uso dell'operatore "optional chaining" (?.):
    //Se l'header non esiste, restituisce undefined e non si verifica alcun errore.
    //eseguito il parsing del token, si ottiene un array con due elementi: "Bearer" e il token vero e proprio.
    //Con [1] si estrae il token vero e proprio.
    // (parsing serve a dividere la stringa ottenuta dal bearer ed estrarre il token) 

    console.log("Token ricevuto:", token);  // Log per verificare il token

    if (!token) {
        return res.status(403).json({ error: "Token mancante!" });  // Se non c'è token, ritorna errore
    }

    try {
        // Decodifica il token JWT usando la chiave segreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Aggiungi i dati decodificati (id, email) all'oggetto req
        console.log("Token decodificato:", decoded);  // Log per vedere i dati decodificati
        next();  // Passa al prossimo middleware o route handler
    } catch (error) {
        console.error("Errore di decodifica del token:", error);
        res.status(401).json({ error: "Token non valido!" });  // Se il token non è valido, ritorna errore
    }
};


const app = express();
app.use(json());
app.use(cors());
app.use(bodyParser.json());
// Inizializza Stripe con la chiave segreta *dopo* aver caricato dotenv
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connessione a MongoDB (NUOVO senza errori)
connect(process.env.MONGO_URI) // Rimuovi le opzioni
  .then(() => console.log("✅ Connesso a MongoDB"))
  .catch(err => console.error(err));

  
// Endpoint per inviare l'email di conferma
app.post('/inviaEmailConferma', (req, res) => {
    const { emailGenitore, nomeBambino } = req.body;
    inviaEmailConferma(emailGenitore, nomeBambino);
    res.send({ message: 'Email inviata con successo!' });
});


  // 📌 REGISTRAZIONE SPECIALISTA + REDIRECT A STRIPE
app.post("/registrazione/specialista", async (req, res) => {
    try {
      const { nome, cognome, email, username, password, confermaPassword, sesso } = req.body;
  
      // Controllo password
      if (password !== confermaPassword) return res.status(400).json({ error: "Le password non coincidono!" });
  
      // Validazione email
      if (!validator.isEmail(email)) return res.status(400).json({ error: "Email non valida!" });
  
      // Controllo email/username esistenti
      const emailEsistente = await Specialista.findOne({ email });
      const usernameEsistente = await Specialista.findOne({ username });
      if (emailEsistente) return res.status(400).json({ error: "Email già registrata!" });
      if (usernameEsistente) return res.status(400).json({ error: "Username già in uso!" });
  
      // Hash della password
      const salt = await genSalt(10);
      const passwordHash = await hash(password, salt);
  
      // Creazione dello specialista
      const nuovoSpecialista = new Specialista({
        nome,
        cognome,
        email: email.toLowerCase(),
        username,
        password: passwordHash,
        sesso,
      });
  
      await nuovoSpecialista.save();
  
      // 🔹 CREA SESSIONE DI PAGAMENTO STRIPE
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `http://localhost:3000/success?email=${encodeURIComponent(email)}`, // Passa l'email come parametro
            cancel_url: "http://localhost:3000/cancel", // Modifica anche il cancel_url
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: "Iscrizione Specialista" },
              unit_amount: 5000, // 50.00€
            },
            quantity: 1,
          },
        ],
      });
  
      res.status(201).json({ message: "✅ Specialista registrato con successo!", paymentUrl: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errore durante la registrazione" });
    }
  });
  
  // 📌 ENDPOINT STRIPE PER CREARE UNA SESSIONE DI CHECKOUT MANUALE
  app.post("/create-checkout-session", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `http://localhost:3000/success?email=${encodeURIComponent(req.body.email)}`, // Passa l'email come parametro
            cancel_url: "http://localhost:3000/cancel",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: "Iscrizione Specialista" },
              unit_amount: 5000, // 50.00€
            },
            quantity: 1,
          },
        ],
      });
  
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/pagamento-successo", async (req, res) => {
    try {
        const { email } = req.body; // Riceviamo l'email dello specialista
        const specialista = await Specialista.findOne({ email });

        if (!specialista) {
            return res.status(404).json({ error: "Specialista non trovato!" });
        }

        // 🔹 Aggiorniamo il flag nel database
        specialista.pagamentoEffettuato = true;
        await specialista.save();

        res.status(200).json({ message: "Pagamento confermato!" });
    } catch (error) {
        console.error("Errore aggiornamento pagamento:", error);
        res.status(500).json({ error: "Errore durante l'aggiornamento del pagamento" });
    }
});

  

// 📌 API per effettuare il login di uno specialista
app.post('/login/specialista', async (req, res) => {
    try {
        const { email, password } = req.body;
        const specialista = await Specialista.findOne({ email: email.toLowerCase() });

        if (!specialista) {
            return res.status(400).json({ error: "Email non registrata!" });
        }

        // 🔹 BLOCCA L'ACCESSO SE NON HA PAGATO
        if (!specialista.pagamentoEffettuato) {
            return res.status(403).json({ error: "Accesso negato: Completa il pagamento per accedere." });
        }

        const passwordValida = await compare(password, specialista.password);
        if (!passwordValida) {
            return res.status(400).json({ error: "Password errata!" });
        }

        const token = jwt.sign(
            { id: specialista._id, email: specialista.email, nome: specialista.nome },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ 
            message: "✅ Login riuscito!", 
            token, 
            specialistaId: specialista._id,  
            nome: specialista.nome  
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante il login" });
    }
});


app.put('/specialista/update/:id', authMiddleware, async (req, res) => {
    try {
        const specialistaId = req.user.id; // Ottiene l'ID dal token JWT
        const { nome, cognome, email, telefono } = req.body;

        console.log("Dati ricevuti per l'aggiornamento:", { nome, cognome, email, telefono });

        // Verifica se l'email è valida
        if (email && !validator.isEmail(email)) {
            return res.status(400).json({ error: "Email non valida!" });
        }

        // Verifica se l'email o il telefono esistono già (evita duplicati)
        if (email) {
            const emailEsistente = await Specialista.findOne({ email, _id: { $ne: specialistaId } });
            if (emailEsistente) {
                return res.status(400).json({ error: "Email già in uso!" });
            }
        }

        if (telefono) {
            const telefonoEsistente = await Specialista.findOne({ telefono, _id: { $ne: specialistaId } });
            if (telefonoEsistente) {
                return res.status(400).json({ error: "Numero di telefono già in uso!" });
            }
        }

        // Aggiorna solo i campi ricevuti
        const specialistaAggiornato = await Specialista.findByIdAndUpdate(
            specialistaId,
            { $set: { nome, cognome, email, telefono } },
            { new: true } // Restituisce il documento aggiornato
        );
        console.log("Specialista aggiornato nel database:", specialistaAggiornato);

        if (!specialistaAggiornato) {
            return res.status(404).json({ error: "Specialista non trovato!" });
        }

        console.log("Specialista aggiornato:", specialistaAggiornato); // Log per conferma

        res.status(200).json({ message: "✅ Profilo aggiornato con successo!", specialista: specialistaAggiornato });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiornamento del profilo" });
    }
});



// 📌 API per ottenere i dati dello specialista
app.get('/specialista/:id', authMiddleware, async (req, res) => {
    try {
        const specialistaId = req.params.id; // Ottiene l'ID dallo URL
        const specialista = await Specialista.findById(specialistaId);
        if (!specialista) {
            return res.status(404).json({ error: "Specialista non trovato!" });
        }
        res.status(200).json(specialista); // Risponde con i dati dello specialista
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nel recupero dei dati dello specialista" });
    }
});

// 📌 API per cambiare la password dello specialista
app.put('/specialista/update-password', authMiddleware, async (req, res) => {
    try {
        const specialistaId = req.user.id; // Ottiene l'ID dal token
        const { oldPassword, newPassword } = req.body;

        console.log('ID dello specialista:', specialistaId);

        const specialista = await Specialista.findById(specialistaId);
        if (!specialista) {
            return res.status(404).json({ error: "Specialista non trovato!" });
        }

        const isMatch = await compare(oldPassword, specialista.password);
        if (!isMatch) {
            return res.status(400).json({ error: "La vecchia password è errata!" });
        }

        //  VALIDAZIONE DELLA NUOVA PASSWORD
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "La nuova password deve contenere almeno 8 caratteri." });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ error: "La nuova password deve contenere almeno un carattere minuscolo." });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ error: "La nuova password deve contenere almeno un carattere maiuscolo." });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: "La nuova password deve contenere almeno un numero." });
        }
        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            return res.status(400).json({ error: "La nuova password deve contenere almeno un carattere speciale." });
        }
        //  FINE VALIDAZIONE 

        // Log per il debug
        console.log("Cambio password per specialista:", specialistaId);
        console.log("Vecchia password validata con successo.");

        const salt = await genSalt(10);
        const newHashedPassword = await hash(newPassword, salt);

        // Log per tracciare l'aggiornamento
        console.log("Nuova password crittografata.");

        specialista.password = newHashedPassword;

        await specialista.save();

        // Genera un nuovo token JWT con il nuovo ID e password aggiornata
        const token = jwt.sign({ id: specialista._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Restituisci il nuovo token nella risposta
        res.status(200).json({
            message: "✅ Password cambiata con successo!",
            token: token // Invia il nuovo token al client
        });
        
    } catch (error) {
        console.error("Errore durante il cambio della password:", error);
        res.status(500).json({ error: "Errore durante il cambio della password" });
    }
});



// 📌 API per registrare un bambino
app.post('/registrazione/bambino', authMiddleware, async (req, res) => {
    try {
        console.log(req.body); // Debug per vedere i dati ricevuti
        const { nome, cognome, dataDiNascita, sesso, emailGenitore, ID } = req.body; // Estrae i dati dal corpo della richiesta

        // L'ID dello specialista viene preso dal token JWT, grazie a authMiddleware, che ha verificato JWT e popolato req.user con i dati dello specialista (id)
        const specialistaId = req.user.id; 


        if (!specialistaId) {
            return res.status(400).json({ error: 'ID dello specialista non trovato!' });
        }


        // Controllo se il bambino esiste già con quell'email
        const bambinoEsistente = await Bambino.findOne({ emailGenitore, specialistaId });
        if (bambinoEsistente) return res.status(400).json({ error: "Bambino già registrato per questo specialista!" }); //400 = Bad Request

        // Crea un nuovo bambino
        const nuovoBambino = new Bambino({
            nome,
            cognome,
            dataDiNascita,
            sesso,
            emailGenitore,
            ID,
            specialistaId // Salva l'ID dello specialista nel database
        });
        
        //Salvataggio del Nuovo Bambino nel Database
        await nuovoBambino.save();
        res.status(201).json({ message: "✅ Bambino registrato con successo!" }); //201 = Created
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante la registrazione" }); //500 = Internal Server Error
    }
});


// 📌 API per effettuare il login di un bambino
app.post('/login/bambino', async (req, res) => { 
    const { ID } = req.body; // Estrae l'ID dal corpo della richiesta

    try {
        const bambino = await Bambino.findOne({ ID, isDeleted: false }); // Cerca il bambino per ID e verifica che non sia stato eliminato (isDeleted = false) (soft delete)

        if (!bambino) {
            return res.status(400).json({ error: 'ID non trovato' });
        }

        res.json({  // Invia la risposta con il messaggio e l'ID del bambino, una risposta json
            message: 'Login riuscito',
            bambinoId: bambino._id  // Invia l'ID del bambino
        });

    } catch (error) {
        res.status(500).json({ error: 'Errore del server' });
    }
});


// 📌 API per recuperare i bambini di uno specialista
app.get('/bambini/', authMiddleware, async (req, res) => {
    try {
        const specialistaId = req.user.id;
        const bambini = await Bambino.find({ specialistaId, isDeleted: false });
        res.json(bambini);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nel recupero dei bambini" });
    }
});


// 📌 API per recuperare un bambino per ID
app.get('/bambino/:id', async (req, res) => {
    try {
        const id = req.params.id; // Estrae l'ID dalla richiesta
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID bambino non valido' });
        }

        const bambino = await Bambino.findById(id).where('isDeleted').equals(false); // Cerca il bambino per ID e verifica che non sia stato eliminato (isDeleted = false)

        console.log("Bambino trovato (o null):", bambino);

        if (!bambino) {
            return res.status(404).json({ error: 'Bambino non trovato' });
        }
        console.log("Sto per inviare la risposta JSON");
        res.json(bambino); // Invia il bambino come risposta JSON
        console.log("Risposta JSON inviata");
    } catch (error) {
        console.error("Errore nel recupero del bambino:", error);
        res.status(500).json({ error: 'Errore nel recupero del bambino', details: error.message, stack: error.stack });
    }
});

// 📌 API per eliminare il bambino (SOFT DELETE)
app.delete('/bambino/:id', async (req, res) => {
    try {
      const bambinoId = req.params.id;
      
      // Esegui il soft delete (aggiorna il flag isDeleted)
      const bambino = await Bambino.findByIdAndUpdate( 
        bambinoId, 
        { isDeleted: true }, // Imposta il flag isDeleted a true
        { new: true }  // Restituisci il bambino aggiornato
      );
      
      if (!bambino) {
        return res.status(404).json({ message: "Bambino non trovato" });
      }
  
      res.status(200).json({ message: "Bambino eliminato (soft delete)" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Errore nell'eliminazione del bambino" });
    }
  });



// 📌 API per aggiornare i dati di un bambino
  app.put("/bambino/:id", async (req, res) => {
    try {
        const bambino = await Bambino.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Aggiorna il bambino e restituisce il documento aggiornato
        res.json(bambino); // Invia il bambino aggiornato come risposta JSON
    } catch (error) {
        res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
});


app.post("/api/bambini/:id/reports", authMiddleware, async (req, res) => {
    try {
      console.log("BODY: ", req.body);
      console.log("UTENTE AUTENTICATO: ", req.user);
  
      const { testo, oggetto } = req.body;
      const bambino = await Bambino.findById(req.params.id);
  
      if (!bambino) {
        return res.status(404).json({ error: "Bambino non trovato" });
      }
  
      const nuovoReport = new Report({
        bambino: bambino._id,
        oggetto,
        testo,
        autore: req.user.id // ID dello specialista
      });
  
      await nuovoReport.save();
  
      // Assicurati che `reports` sia un array
      if (!bambino.reports) {
        bambino.reports = []; // Inizializza come array vuoto se non esiste
      }
      bambino.reports.push(nuovoReport._id);
      await bambino.save();
  
      res.status(201).json(nuovoReport);
    } catch (error) {
      console.error("Errore: ", error);
      res.status(500).json({ error: "Errore durante la creazione del report" });
    }
  });
  

  // Aggiungi la rotta GET per recuperare i report di un bambino
app.get("/api/bambini/:id/reports", authMiddleware, async (req, res) => {
    try {
      const bambinoId = req.params.id;
      
      // Trova il bambino per ID
      const bambino = await Bambino.findById(bambinoId).populate('reports');
      
      if (!bambino) {
        return res.status(404).json({ error: "Bambino non trovato" });
      }
      
      // Restituisci i report del bambino
      res.status(200).json(bambino.reports);
    } catch (error) {
      console.error("Errore: ", error);
      res.status(500).json({ error: "Errore durante il recupero dei report" });
    }
  });

// Avviare il server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server avviato su http://localhost:${PORT}`));
