import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email"); // Prendiamo l'email dallo URL

  useEffect(() => {
    const confermaPagamento = async () => {
      if (!email) return; // Se manca l'email, non facciamo nulla

      try {
        await axios.post("http://localhost:5000/pagamento-successo", { email });
        console.log("Pagamento confermato nel DB!");
      } catch (error) {
        console.error("Errore nell'aggiornamento del pagamento:", error);
      }
    };

    confermaPagamento();

    // Dopo 3 secondi, reindirizza alla login
    setTimeout(() => navigate("/login"), 3000);
  }, [navigate, email]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>✅ Pagamento completato!</h1>
      <p>Grazie per la registrazione. Verrai reindirizzato alla pagina di login...</p>
    </div>
  );
};

export default Success;
