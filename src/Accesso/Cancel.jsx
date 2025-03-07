import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Cancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Dopo 3 secondi, reindirizza alla registrazione
    setTimeout(() => navigate("/registrazione/specialista"), 3000);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>⚠️ Pagamento annullato</h1>
      <p>Non preoccuparti! Puoi riprovare quando vuoi.</p>
    </div>
  );
};

export default Cancel;
