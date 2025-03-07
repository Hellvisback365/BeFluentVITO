import React, { useState, useEffect, useContext } from 'react';


import './Report.css';

import BackButton from "../Components/UI/BackButton-ui";

import LogoProfile from "../Components/UI/LogoProfile";

import NavButton from "../Components/UI/NavButton";

import { useNavigate, useParams, Link } from 'react-router-dom';

import axios from 'axios';
import { useAuth } from '../Accesso/AuthContext'; // Importa useAuth

 

const Report = () => {

    const navigate = useNavigate();
const { auth } = useAuth(); // Usa useAuth invece di useContext direttamente

const { specialistaId, token } = auth;

    const { id } = useParams();

    const [reportText, setReportText] = useState("");

    const [initialChildInfo, setInitialChildInfo] = useState(null); // Inizializza a null

    const [objectValue, setObjectValue] = useState(""); // Manteniamo, ma con una modifica

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [successMessage, setSuccessMessage] = useState(null); //Per messaggi di successo



    const handleReportChange = (event) => {

        setReportText(event.target.value);

    }



    const handleSendReport = async () => { // Funzione asincrona

        setSuccessMessage(null); //Azzera messaggi precedenti

        setError(null);



        // Validazione di base (assicurati che ci sia del testo)

        if (!reportText.trim()) {

            setError("Inserisci del testo nel report.");

            return;

        }



        try {
    console.log("Id bambino:", id);
    const response = await axios.post(`http://localhost:5000/api/bambini/${id}/reports`, {
        testo: reportText,
        titolo: "Report da Report.jsx",
        oggetto: objectValue,
        autore: specialistaId ? { id: specialistaId } : undefined


      }, {
        headers: {
           'Authorization': `Bearer ${token}`
        }
      });



            console.log("Report inviato con successo:", response.data);

            setSuccessMessage("Report inviato con successo!"); //Messaggio di successo

            setReportText(""); // Svuota l'area di testo dopo l'invio

            //Potrei aggiungere un redirect, o ricaricare i dati



        } catch (error) {

             console.error("Errore durante l'invio del report:", error.response ? error.response.data : error.message);

            // Gestione più precisa degli errori, mostra un messaggio all'utente

            setError(error.response ? error.response.data.error : "Errore durante l'invio del report. Riprova.");

        }

    };



    const handleObjectChange = (event) => {

        setObjectValue(event.target.value); // Serve ancora se vuoi permettere modifiche *locali*

    };



    useEffect(() => {

        const fetchChildInfo = async () => {

            setLoading(true);

            setError(null);

            try {

                const response = await axios.get(`http://localhost:5000/Bambino/${id}`, {

                    headers: {

                        'Authorization': `Bearer ${localStorage.getItem('token')}`

                    }

                });

                console.log("Dati ricevuti dall'API:", response.data);

                const data = response.data;

                setInitialChildInfo(data);

                setObjectValue(`${data.nome || ''} ${data.cognome || ''}`);

   

            } catch (error) {

                setError(error.message);

                console.error("Errore nel recupero:", error);

            } finally {

                setLoading(false);

            }

        };

        fetchChildInfo();

    }, [id]);







     // Usa una variabile (o costante) per il titolo, invece di una funzione

     let titleContent;



     if (loading) {

         titleContent = "Caricamento...";

     } else if (error) {

         titleContent = "Errore nel caricamento dei dati.";

     } else if (!initialChildInfo) {

         titleContent = "Pagina di..."; // Fallback

     } else {

         let titolo = " ";

         if (initialChildInfo.sesso === 'Maschio') {

             titolo += "Bambino: ";

         } else if (initialChildInfo.sesso === 'Femmina') {

             titolo += "Bambina: ";

         } else {

             titolo += "di ";

         }

         titolo += `${initialChildInfo.nome || ''} ${initialChildInfo.cognome || ''}`;

         titleContent = titolo;

     }

   





    if (loading) {

        return <div>Caricamento...</div>; // Gestione del caricamento

    }



    if (error) {

        return <div>Errore: {error}</div>; // Gestione degli errori

    }

      if (!initialChildInfo) {

        return <div>Dati non disponibili</div>; //  ulteriore controllo, si attiva se c'è un errore nella chiamata API

    }



    console.log("Valore dell'oggetto prima del rendering:", objectValue); // Debug



    return (

        <div>

            <LogoProfile

                logoSrc="/BeFluent_logo_testo.png"

                profileSrc="/iconaDottore.png"

                logoClass="logoTesto-registrazioneSpecialista"

                profileClass="logoDottore-registrazioneSpecialista"

            />



            <div className="navigation-buttons">

                <NavButton to="/Home/Specialista" className="home-button" text="HOME" />

                <NavButton to="/Elenco/Bambini" className="bambini-button" text="BAMBINI" />

                <NavButton to="/report" className="report-button" text="REPORT" />

                <NavButton to="/Impostazioni" className="settings-button-elenco" text="IMPOSTAZIONI" />

                <NavButton to="#" className="strumenti-button" text="STRUMENTI" onClick={() => alert("Pagina in fase di implementazione!")} />

                <NavButton to="/Logout" className="logout-button" text="LOGOUT" />

            </div>



            <BackButton onClick={() => navigate("/Pagina/Bambino")} />



            <div className="report-container">

                {/* Usa la variabile titleContent */}

                <h1 className="report-title">{titleContent}</h1>



                <div className="child-info">

                <span className="label">OGGETTO</span>

                <input

                    type="text"

                    className="child-name-input"

                    value={objectValue}

                    onChange={(e) => setObjectValue(e.target.value)}

                />

            </div>

                <div className="report-section">

                    <span className="label">REPORT</span>

                    <textarea

                        className="report-textarea"

                        placeholder="Scrivi qui il tuo report..."

                        value={reportText}

                        onChange={handleReportChange}

                    />

                </div>

                {/* Visualizza messaggio di successo/errore */}

                {successMessage && <div className="success-message">{successMessage}</div>}

                {error && <div className="error-message">{error}</div>}

                <button className="send-report-button" onClick={handleSendReport}>INVIA REPORT</button>

                <Link to={`/Registro/Report/${id}`} className="view-reports-button">

                    VISUALIZZA REGISTRO REPORT

                </Link>

            </div>

        </div>

    );

};



export default Report;