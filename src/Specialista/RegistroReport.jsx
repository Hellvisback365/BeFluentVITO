import React, { useState, useEffect } from 'react';

import './RegistroReport.css';

import { useParams, useNavigate } from 'react-router-dom';

import BackButton from "../Components/UI/BackButton-ui";

import LogoProfile from "../Components/UI/LogoProfile";

import NavButton from "../Components/UI/NavButton";

import axios from 'axios';





const RegistroReport = () => {

    const { id } = useParams(); // Ottieni l'ID del bambino dalla URL

    const [reports, setReports] = useState([]); // Stato per i report

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const [childInfo, setChildInfo] = useState({ nome: '', cognome: '', ID: '' });



    const handleBack = () => {

        navigate(-1);

    }





useEffect(() => {

    // Funzione per recuperare i dettagli del bambino

    const fetchChildInfo = async () => {

        try {

            const response = await axios.get(`http://localhost:5000/bambino/${id}`, { //URL corretto

                headers: {

                    'Authorization': `Bearer ${localStorage.getItem('token')}`

                }

            });

            setChildInfo({ nome: response.data.nome, cognome: response.data.cognome, ID: response.data.ID });

        } catch (childError) {

            console.error("Errore nel recupero delle informazioni del bambino:", childError);

        }

    };

    fetchChildInfo();

}, [id]);



useEffect(() => {

    const fetchReports = async () => {

        setLoading(true);

        setError(null);

        try {

            // Usa Axios per la chiamata GET

            const response = await axios.get(`http://localhost:5000/api/bambini/${id}/reports`, {

                headers: {

                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Passa il token JWT

                }

            });

            console.log("Dati ricevuti dall'API (RegistroReport):", response.data); // Debug

            setReports(response.data);



        } catch (error) {

            // Gestione degli errori migliorata con Axios

            setError(error.response ? error.response.data.error : error.message);

            console.error("Errore nel recupero dei report:", error.response ? error.response.data : error.message);

        } finally {

            setLoading(false);

        }

    };

    fetchReports();

}, [id]);





    if (loading) {

        return <div>Caricamento report...</div>;

    }



    if (error) {

        return <div>Errore: {error}</div>;

    }



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

                <NavButton to="/report" className="report-button" text="REPORT" />{/* Rimuovere il link a /report (se presente) o indirizzarlo correttamente */}

                <NavButton to="/Impostazioni" className="settings-button-elenco" text="IMPOSTAZIONI" />

                <NavButton to="#" className="strumenti-button" text="STRUMENTI" onClick={() => alert("Pagina in fase di implementazione!")} />

                <NavButton to="/Logout" className="logout-button" text="LOGOUT" />

            </div>



            <BackButton onClick={handleBack} />



            <div className="registro-report-container">

            <h1>Registro Report di {childInfo.nome} {childInfo.cognome} (ID: {childInfo.ID})</h1>



            <div className="report-list-wrapper">

                    {reports.length === 0 ? (

                        <p>Nessun report presente per questo bambino.</p>

                    ) : (

                        <ul className="report-list">

                            {reports.map((report, index) => (

                                <li key={index} className="report-item">

                                     <p><strong>Oggetto:</strong> {report.oggetto}</p>

                                    <p><strong>Data:</strong> {report.data ? new Date(report.data).toLocaleDateString() : 'Data non disponibile'}</p>

                                    <p><strong>Report:</strong></p>

                                    <div className='report-text-container'><p className='report-text'>{report.testo}</p></div>

                                </li>

                            ))}

                        </ul>

                )}

                </div>

            </div>

        </div>

    );

};



export default RegistroReport;