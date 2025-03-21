import nodemailer from 'nodemailer';

const inviaEmailConferma = async (emailGenitore, nomeBambino, confirmationToken) => {

    // Configurazione del transporter (usa variabili d'ambiente!)
     const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: process.env.GMAIL_ACCESS_TOKEN, // Aggiungi se lo hai già
        },
    });


    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: emailGenitore,
        subject: 'Conferma Registrazione Bambino',
        // Usa un template HTML per l'email (molto più professionale)
        html: `
            <h1>Ciao!</h1>
            <p>Hai appena registrato il bambino ${nomeBambino} su BeFluent.</p>
            <p>Per favore clicca sul link qui sotto per confermare la registrazione:</p>
            <a href="${process.env.FRONTEND_URL}/conferma-registrazione/${confirmationToken}">Conferma Registrazione</a>
            <p>Questo link scadrà tra 24 ore.</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email inviata: ' + info.response);
    } catch (error) {
        console.error('Errore nell\'invio dell\'email: ', error);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
};


export { inviaEmailConferma };