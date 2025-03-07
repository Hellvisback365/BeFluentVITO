import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegistrazioneSpecialistaForm.css";
import BackButton from "../Components/UI/BackButton-ui";
import LogoProfile from "../Components/UI/LogoProfile";

const RegistrazioneSpecialistaForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    username: "",
    sesso: "",
    password: "",
    confermaPassword: "",
  });

  const [messaggio, setMessaggio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validatePassword = (password) => {
    if (password.length < 8) return "La password deve contenere almeno 8 caratteri.";
    if (!/[a-z]/.test(password)) return "La password deve contenere almeno un carattere minuscolo.";
    if (!/[A-Z]/.test(password)) return "La password deve contenere almeno un carattere maiuscolo.";
    if (!/[0-9]/.test(password)) return "La password deve contenere almeno un numero.";
    if (!/[^a-zA-Z0-9]/.test(password)) return "La password deve contenere almeno un carattere speciale.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validazione password
    if (formData.password !== formData.confermaPassword) {
      setError("Le password non coincidono!");
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/registrazione/specialista", formData);
      setMessaggio(res.data.message);

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl; // 🔹 Reindirizza a Stripe
      } else {
        setMessaggio("Registrazione completata, ma problema con il pagamento.");
      }
    } catch (error) {
      console.error("Errore nella registrazione:", error);
      setMessaggio(error.response?.data?.error || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <LogoProfile
          logoSrc="/BeFluent_logo_testo.png"
          profileSrc="/iconaDottore.png"
          logoClass="logoTesto-registrazioneSpecialista"
          profileClass="logoDottore-registrazioneSpecialista"
        />

        <div className="registrazione-containerSpecialista">
          <h1 className="titleRegistrazioneSpecialista">Registrati come Specialista</h1>

          <form onSubmit={handleSubmit} className="registrazioneSpecialista-form">
            <div className="form-rowRegistrazioneSpecialista">
              <div className="form-groupRegistrazioneSpecialista">
                <label htmlFor="nome">Nome</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
              </div>

              <div className="form-groupRegistrazioneSpecialista">
                <label htmlFor="cognome">Cognome</label>
                <input type="text" name="cognome" value={formData.cognome} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-groupRegistrazioneSpecialista">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-groupRegistrazioneSpecialista">
              <label htmlFor="username">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="form-groupRegistrazioneSpecialista">
              <label htmlFor="sesso">Sesso</label>
              <select name="sesso" value={formData.sesso} onChange={handleChange} required>
                <option value="">Seleziona il sesso</option>
                <option value="maschio">Maschio</option>
                <option value="femmina">Femmina</option>
              </select>
            </div>

            <div className="form-rowRegistrazioneSpecialista">
              {/* Input Password */}
              <div className="form-groupRegistrazioneSpecialista">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required />
                  <button type="button" className="password-toggle-button" onClick={toggleShowPassword}>
                    {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                  </button>
                </div>
              </div>

              {/* Input Conferma Password */}
              <div className="form-groupRegistrazioneSpecialista">
                <label htmlFor="confermaPassword">Conferma Password</label>
                <div className="password-input-container">
                  <input type={showConfirmPassword ? "text" : "password"} name="confermaPassword" value={formData.confermaPassword} onChange={handleChange} required />
                  <button type="button" className="password-toggle-button" onClick={toggleShowConfirmPassword}>
                    {showConfirmPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="pulsanteRegistratiSpecialista" type="submit" disabled={loading}>
              {loading ? "Registrazione in corso..." : "Registrati"}
            </button>
          </form>

          {messaggio && <p>{messaggio}</p>}

          <BackButton onClick={() => navigate(-1)} />
        </div>
      </div>
    </>
  );
};

export default RegistrazioneSpecialistaForm;
