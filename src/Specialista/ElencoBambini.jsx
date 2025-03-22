import React, { useState, useEffect } from 'react';
import './ElencoBambini.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BackButton from "../Components/UI/BackButton-ui";
import NavButton from "../Components/UI/NavButton";
import LogoProfile from "../Components/UI/LogoProfile";
import { useAuth } from '../Accesso/AuthContext';
import axios from 'axios';


function ElencoBambini() {
  const { auth } = useAuth();  
  const token = auth?.token;  // Prende il token JWT
  console.log("Token:", token);
  const [bambini, setBambini] = useState([]);
  const navigate = useNavigate(); 
  const location = useLocation(); 

  useEffect(() => {
    const fetchBambini = async () => {
      try {
        if (!token) {
          console.error("Token non trovato!");
          return;
        }
  
        const response = await axios.get('http://localhost:5000/bambini', {
          headers: {
            Authorization: `Bearer ${token}`, // Invia il token JWT
          }
        });
  
       // Filtra solo i bambini confermati
       const bambiniConfermati = response.data.filter(bambino => bambino.confermato);

       setBambini(bambiniConfermati);
     } catch (error) {
       console.error("Errore nel recupero dei bambini:", error);
     }
   };
 
   fetchBambini();
 }, [token]);

  return (
    <div>
      <LogoProfile 
        logoSrc="/BeFluent_logo_testo.png"
        profileSrc="/iconaDottore.png"
        logoClass="logoTesto-registrazioneSpecialista"
        profileClass="logoDottore-registrazioneSpecialista"
      />

  <div className="elenco-bambini">
  <div className="header">
    <div className="title-elenco-bambini">ELENCO BAMBINI</div>
  </div>

  <div className="main-content">
    <div className="children-list-elenco-bambini">
      <ul>
        {bambini.length > 0 ? (
          bambini.map((bambino) => (
            <li key={bambino._id} className="child-item-elenco-bambini">
              <Link to={`/Pagina/Bambino/${bambino._id}`} className="child-link">
                {bambino.nome} {bambino.cognome}
              </Link>
            </li>
          ))
        ) : (
          <p>Nessun bambino trovato.</p>
        )}
      </ul>
    </div>


          <Link to="/Registrazione/Bambino">    
            <div className="add-child-button-elenco-bambini">
              <button>AGGIUNGI BAMBINO</button>
            </div>
          </Link>

          <div className="navigation-buttons">
            <NavButton to="/Home/Specialista" className="home-button" text="HOME" />
            <NavButton to="/Elenco/Bambini" className="bambini-button" text="BAMBINI" /> 
            <NavButton to="/Impostazioni" className="settings-button-elenco" text="IMPOSTAZIONI" />
            <NavButton to="#" className="strumenti-button" text="STRUMENTI" onClick={() => alert("Pagina in fase di implementazione!")} />
            <NavButton to="/Logout" className="logout-button-elenco" text="LOGOUT" />
          </div>

          <BackButton />
        </div>
      </div>
    </div>
  );
}

export default ElencoBambini;
