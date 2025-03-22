import SibApiV3Sdk from 'sib-api-v3-sdk';
import 'dotenv/config';

// Configura il client API di Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Crea un'istanza dell'API per le email transazionali
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const inviaEmailConferma = async (emailGenitore, nomeBambino, confirmationToken, ID) => {
  const sendSmtpEmail = {
    sender: { email: 'teresa19167@gmail.com', name: 'BeFluent' },
    to: [{ email: emailGenitore }],
    subject: 'Conferma Registrazione Bambino',
    htmlContent: `
  <div style="font-family: Arial, sans-serif;">
    <h2>Conferma la registrazione di ${nomeBambino}</h2>
    <p>ID di registrazione: <strong>${ID}</strong></p>
    <a href="${process.env.FRONTEND_URL}/conferma/registrazione/${confirmationToken}?id=${ID}" 
   style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none;">
   Conferma Ora
</a>

    <p>Link valido per 24 ore.</p>
  </div>
`,

  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email inviata correttamente:', data);
    return true;
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di conferma:', error.response ? error.response.body : error.message);
    throw new Error(`Invio email fallito: ${error.message}`);
  }
};

export { inviaEmailConferma };
