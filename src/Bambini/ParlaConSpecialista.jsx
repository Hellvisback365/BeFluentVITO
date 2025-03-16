import React from 'react';
import "./ParlaConSpecialista.css";
import BackButton from "../Components/UI/BackButton-ui";
import LogoProfile from "../Components/UI/LogoProfile";
import VoiceflowWidget from './VoiceflowWidget';

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importa useNavigate


function ParlaConSpecialista() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    return () => { // Funzione di cleanup
      // Controlla se siamo USCITI da /DialogoSpecialista
      if (location.pathname !== '/DialogoSpecialista') {
          navigate(location.pathname, { replace: true }); //Forzo il refresh, ma solo quando serve.
          window.location.reload(); // Forza il refresh

      }
    };
  }, [location, navigate]); // Aggiungi navigate alle dipendenze

  return (
     <>
      <main className="chatContainerDialogoSpecialista">
        <div className="chatHeaderDialogoSpecialista">CHAT CON L'ASSISTENTE</div>
        <VoiceflowWidget />
      </main>

      <BackButton />

      <LogoProfile
        logoSrc="/BeFluent_logo_testo.png"
        profileSrc="/iconaBambino.png"
        logoClass="logoTesto-registrazioneSpecialista"
        profileClass="logoDottore-registrazioneSpecialista"
      />
    </>
  );
}

export default ParlaConSpecialista;