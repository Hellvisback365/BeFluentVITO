import { Routes, Route } from 'react-router-dom';
import { GameTimerProvider } from './Bambini/GameTimerContext';

import './App.css';
import Home from './Home';
import Login from './Accesso/Login';
import LoginBambino from './Accesso/LoginBambino';
import LoginSpecialistaForm from './Accesso/LoginSpecialistaForm';
import RegistrazioneSpecialistaForm from './Accesso/RegistrazioneSpecialistaForm';
import PswDimenticata from './Accesso/PswDimenticata';
import HomeSpecialista from './Specialista/HomeSpecialista';
import ElencoBambini from './Specialista/ElencoBambini'; 
import Logout from './Specialista/Logout';
import Impostazioni from './Specialista/Impostazioni';
import NavButton from './Components/UI/NavButton';
import RegistrazioneBambino from './Specialista/RegistrazioneBambino';
import HomeBambini from './Bambini/HomeBambini';
import CambioPsw from './Specialista/CambioPsw';
import EliminaAccount from './Specialista/EliminaAccount';
import Appuntamenti from './Specialista/Appuntamenti';
import AssegnaGioco from './Specialista/AssegnaGioco';
//import Home from './Home';  // Componenti per le varie pagine
import Report from './Specialista/Report';
import RegistroReport from './Specialista/RegistroReport'; 
import { AuthProvider } from './Accesso/AuthContext';
import PaginaBambino from './Specialista/PaginaBambino'
import EserciziGiornalieri from './Bambini/EserciziGiornalieri';
import GiudizioOrtografico1 from './Bambini/GiudizioOrtografico1';
import AbbinamentoParole1 from './Bambini/AbbinamentoParole1';
import AbbinamentoParoleIntro from './Bambini/AbbinamentoParoleIntro';
import AbbinamentoParole2 from './Bambini/AbbinamentoParole2';
import AbbinamentoParole3 from './Bambini/AbbinamentoParole3';
import AbbinamentoParole4 from './Bambini/AbbinamentoParole4';
import AbbinamentoParole5 from './Bambini/AbbinamentoParole5';
import GiudizioOrtografico2 from './Bambini/GiudizioOrtografico2';
import TestIniziale from './Bambini/TestIniziale';
import TestIniziale1 from './Bambini/TestIniziale1';
import ParlaConSpecialista from './Bambini/ParlaConSpecialista';
import ProfiloBambino from './Bambini/ProfiloBambino';
import EliminaAccountBambino from './Bambini/EliminaAccountBambino';


import Pagamento from './Accesso/Pagamento';             // Importa il componente Pagamento
import Success from "./Accesso/Success";
import Cancel from "./Accesso/Cancel";

function App() {
  return (
    <GameTimerProvider>  {/* Avvolgi tutto l'applicativo con il provider */}
      <AuthProvider>  {/* Avvolgi tutto l'applicativo con il provider */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/bambino" element={<LoginBambino />} />
          <Route path="/Home/Specialista/:specialistaId" element={<HomeSpecialista />} />
          <Route path="/login/specialista/form" element={<LoginSpecialistaForm />} />
          <Route path="/Registrazione/Specialista/Form" element={<RegistrazioneSpecialistaForm />} />
          <Route path="/Psw/Dimenticata" element={<PswDimenticata />} />
          <Route path="/Home/Specialista" element={<HomeSpecialista />} />
          <Route path="/Elenco/Bambini" element={<ElencoBambini />} />
          <Route path="/Logout" element={<Logout />} />
          <Route path="/Elenco/Bambini/refresh" element={<></>} /> {/* Questa rotta non mostrerà nulla */}
          <Route path="/Impostazioni" element={<Impostazioni />} />
          <Route path="/Registrazione/Bambino" element={<RegistrazioneBambino />} />
          <Route path="/Home/Bambini" element={<HomeBambini />} />
          <Route path="/Cambio/Psw" element={<CambioPsw />} />
          <Route path="/Elimina/Account" element={<EliminaAccount />} />
          <Route path="/Pagina/Bambino/:id" element={<PaginaBambino />} />
          <Route path="/Appuntamenti/:id" element={<Appuntamenti />} />
          <Route path="/Assegna/Gioco/:id" element={<AssegnaGioco />} />
          <Route path="/Report/:id" element={<Report />} />
          <Route path="/Registro/Report/:id" element={<RegistroReport />} />
          <Route path="/Esercizi/Giornalieri" element={<EserciziGiornalieri />} />
          <Route path="/Giudizio/Ortografico/1" element={<GiudizioOrtografico1 />} />
          <Route path="/Abbinamento/Parole/1" element={<AbbinamentoParole1 />} />
          <Route path="/Abbinamento/Parole/Intro" element={<AbbinamentoParoleIntro />} />
          <Route path="/Abbinamento/Parole/2" element={<AbbinamentoParole2 />} />
          <Route path="/Abbinamento/Parole/3" element={<AbbinamentoParole3 />} />
          <Route path="/Abbinamento/Parole/4" element={<AbbinamentoParole4 />} />
          <Route path="/Abbinamento/Parole/5" element={<AbbinamentoParole5 />} />
          <Route path="/Giudizio/Ortografico/2" element={<GiudizioOrtografico2 />} />
          <Route path="/Test/Iniziale" element={<TestIniziale />} />
          <Route path="/Test/Iniziale/1" element={<TestIniziale1 />} />
          <Route path="/DialogoSpecialista" element={<ParlaConSpecialista />} />
          <Route path="/Profilo/Bambino" element={<ProfiloBambino />} />
          <Route path="/Elimina/Bambino" element={<EliminaAccountBambino />} />

          <Route path="/abbonamenti" element={<Pagamento />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>
      </AuthProvider>
    </GameTimerProvider>
  )
}

export default App;