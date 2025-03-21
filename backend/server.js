import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import Specialista from './models/Specialista.js'; 
import { genSalt, hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import Bambino from './models/Bambino.js'; 
import mongoose from 'mongoose';
import validator from 'validator';
import Report from './models/Report.js';
import Stripe from 'stripe';
import Iscrizione from './models/Iscrizione,js';
import { inviaEmailConferma } from './emailService.js'; //CORREGGI
import { registraBambino } from './RegistraBambino.js';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config(); // Carica variabili d'ambiente



const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(json());
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Inizializza Stripe con la chiave segreta *dopo* aver caricato dotenv
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connessione a MongoDB (NUOVO senza errori)
connect(process.env.MONGO_URI) // Rimuovi le opzioni
  .then(() => console.log("✅ Connesso a MongoDB"))
  .catch(err => console.error(err));

  
// Endpoint per registrare un bambino (protetto da JWT)
app.post('/registrazione/bambino', authMiddleware, registraBambino );
  

// Endpoint per inviare l'email di conferma
app.post('/inviaEmailConferma', authMiddleware, async (req, res) => {
    const { emailGenitore, nomeBambino, specialistaId } = req.body; // Estrai specialistaId
    const token = req.token;  //il token preso dal middleware

    if (!specialistaId) {
        return res.status(400).send({ error: 'ID dello specialista mancante.' });
    }
      if (!token) {
        return res.status(400).send({ error: 'Token mancante.' });
    }

    try {
        // Genera un token di conferma
        const confirmationToken = jwt.sign(
            { emailGenitore, nomeBambino, specialistaId }, // Includi specialistaId nel token
            process.env.JWT_SECRET_CONFIRM, // Usa una chiave segreta diversa per i token di conferma!
            { expiresIn: '24h' } // Il token di conferma scade dopo 24 ore
        );
       
        // Invia l'email di conferma
        await inviaEmailConferma(emailGenitore, nomeBambino, confirmationToken); // Passa il token
        res.send({ message: 'Email inviata con successo!' });

    } catch (error) {
        console.error("Errore nell'invio dell'email di conferma:", error);
        res.status(500).send({ error: 'Errore nell\'invio dell\'email di conferma.' });
    }
});

// Endpoint di conferma registrazione
app.get('/conferma-registrazione/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET_CONFIRM);

        // Trova il bambino basandosi sull'email del genitore e l'ID dello specialista, *NON* sul token
        const bambino = await Bambino.findOne({
            emailGenitore: decoded.emailGenitore,
            specialistaId: decoded.specialistaId // Usa specialistaId per trovare il bambino corretto
        });


        if (!bambino) {
           
            return res.status(404).send('<h1>Richiesta non valida o scaduta.</h1>');
        }

       
        // Aggiorna lo stato del bambino a confermato
        bambino.confermato = true;
        await bambino.save();
       
        // Mostra un messaggio di conferma all'utente
        res.send('<h1>Registrazione confermata con successo!</h1>');

    } catch (error) {
        console.error("Errore durante la conferma della registrazione:", error);
         if (error.name === 'TokenExpiredError') {
            return res.status(401).send('<h1>Il link di conferma è scaduto.</h1>');
         }
        res.status(500).send('<h1>Errore durante la conferma della registrazione.</h1>');
    }
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
/*app.post('/registrazione/bambino', authMiddleware, async (req, res) => {
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
});*/


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
  
  // Configurazione rate limiting (limita richieste per evitare abuso)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // Max 100 richieste ogni 15 minuti
    message: "Troppe richieste. Riprova più tardi.",
  });
  app.use("/api/chatbot", limiter);
  
  // 🛑 Lista domande bloccate (GDPR - dati personali)
  const forbiddenQuestions = [
    "come ti chiami", "dove abiti", "qual è il tuo numero", "dammi il tuo contatto", "come posso decriptare la password", "come crackare una password", "come ottenere una password wifi"
  ];
  const containsForbiddenQuestions = (text) =>
    forbiddenQuestions.some((question) => text.toLowerCase().includes(question));
  
  // Funzione di validazione input utente
  const validateUserInput = (message) => {
    if (!message) {
      return "Il messaggio non può essere vuoto.";
    }
    if (message.length > 1000) {
      return "Il messaggio è troppo lungo.";
    }
    return null;
  };
  
  // Inizializza il modello Gemini con impostazioni di sicurezza
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,  // Blocca contenuti pericolosi
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,  // Blocca molestie
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,  // Blocca contenuti sessuali espliciti
      },
    ],
  });
  
  // Funzione per chiamare Gemini e analizzare il contenuto per problematiche
  async function analyzeMessageWithGemini(message) {
    try {
      // Utilizziamo Gemini per analizzare il testo e rilevare contenuti problematici
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }]
      });
  
      const responseText = result.response.candidates[0].content.parts[0].text;
  
      // Analizzare se il risultato contiene messaggi problematici (come "suicidio", "violenza", ecc.)
      const harmfulContentFound = checkForHarmfulContent(responseText);
  
      if (harmfulContentFound) {
        return "Il messaggio contiene contenuti problematici.";
      }
  
      return null; // Nessun problema trovato
    } catch (error) {
      console.error("Errore durante l'analisi del messaggio:", error);
      return "Errore nel valutare il messaggio.";
    }
  }
  
  // Funzione per verificare se il contenuto generato contiene parole o concetti pericolosi
  function checkForHarmfulContent(responseText) {
    const harmfulKeywords = [
      "suicidio", "violenza", "abuso", "odio", "discriminazione", "droghe", "bullying", "sessuale"
    ];
  
    return harmfulKeywords.some(keyword => responseText.toLowerCase().includes(keyword));
  }
  
  // Funzione per chiamare Gemini con retry (evita crash in caso di errore)
  async function callGeminiWithRetry(prompt, retries = 3, delay = 1000) {
    try {
      const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048, // Limita la lunghezza della risposta
      };
  
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }], // Invio il prompt al modello
      });
  
      return result.response.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error.message.includes("429") && retries > 0) {
        console.warn(`Rate limit superato. Riprovo tra ${delay / 1000} secondi...`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // Aspetta
        return callGeminiWithRetry(prompt, retries - 1, delay * 2);
      }
      console.error("Errore con Gemini:", error);
      throw error;
    }
  }
  
  // Endpoint per il chatbot con protezione GDPR e contenuti sicuri
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message } = req.body;
      const validationError = validateUserInput(message);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
  
      // 🛑 Controllo domande sensibili (GDPR)
      if (containsForbiddenQuestions(message)) {
        return res.status(403).json({ error: "Non posso rispondere a questa domanda." });
      }
  
      // ✅ Analizza il messaggio con Gemini per contenuti problematici
      const analysisError = await analyzeMessageWithGemini(message);
      if (analysisError) {
        return res.status(400).json({ error: analysisError });
      }
  
      // ✅ Se il messaggio è sicuro, chiamiamo Gemini per generare la risposta
      const botResponse = await callGeminiWithRetry(message);
      res.json({ response: botResponse });
    } catch (error) {
      console.error("Errore interno:", error);  // Log degli errori
      res.status(500).json({ error: "Errore interno del server." });
    }
  });
  
  // Configurazione Express per Vite (serve per servire il frontend)
  const staticPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  

  


// Avviare il server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server avviato su http://localhost:${PORT}`));
