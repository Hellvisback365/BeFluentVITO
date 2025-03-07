import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'teresa19167@gmail.com',
        pass: 'Domenico5',  // Assicurati di usare variabili di ambiente per sicurezza
    },
});

const inviaEmailConferma = (emailGenitore, nomeBambino) => {
    const mailOptions = {
        from: 'teresa19167@gmail.com',
        to: emailGenitore,
        subject: 'Conferma Registrazione Bambino',
        text: `Ciao, \n\nHai appena registrato il bambino ${nomeBambino}. Per favore clicca sul link qui sotto per confermare la registrazione: \n\n[Link di conferma]`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Errore nell\'invio dell\'email: ', error);
        } else {
            console.log('Email inviata: ' + info.response);
        }
    });
};

export { inviaEmailConferma };
