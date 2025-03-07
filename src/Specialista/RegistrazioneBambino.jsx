import React, { useState } from 'react';
import axios from 'axios';
import './RegistrazioneBambino.css';
import { useAuth } from '../Accesso/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BackButton from "../Components/UI/BackButton-ui";
import LogoProfile from "../Components/UI/LogoProfile";

const RegistrazioneBambino = () => {
    const { auth } = useAuth();  
    const token = auth?.token;  // Prende il token JWT

    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        dataDiNascita: new Date(),
        sesso: '',
        emailGenitore: '',
        ID: ''
    });

    const [messaggio, setMessaggio] = useState('');
    const [errore, setErrore] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, dataDiNascita: date });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessaggio('');
        setErrore('');
    
        // Aggiungi l'ID dello specialista ai dati del bambino
        const bambinoData = {...formData, specialistaId: auth.specialistaId }; // <--- Sposta qui
    
        console.log(bambinoData); // Ora bambinoData è definito
    
        try {
            // Aggiungi la registrazione nel database del bambino
            const response = await axios.post('http://localhost:5000/registrazione/bambino', bambinoData, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            // Chiamata per inviare l'email di conferma
            const responseEmail = await axios.post('http://localhost:5000/inviaEmailConferma', {
                emailGenitore: formData.emailGenitore,
                nomeBambino: `${formData.nome} ${formData.cognome}`
            });
    
            setMessaggio(response.data.message);
            setFormData({
                nome: '',
                cognome: '',
                dataDiNascita: new Date(),
                sesso: '',
                emailGenitore: '',
                ID: ''
            });
        } catch (error) {
            setErrore(error.response?.data?.error || 'Errore durante la registrazione');
        }
    };

    return (
        <div>
            <div className="container-registrazioneBambino">
                <h2 className="titolo-registrazioneBambino">Registrazione Bambino</h2>
                {messaggio && <p className="successo-registrazioneBambino">{messaggio}</p>}
                {errore && <p className="errore-registrazioneBambino">{errore}</p>}
                <form className="form-registrazioneBambino" onSubmit={handleSubmit}>
                    <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required className="input-registrazioneBambino"/>
                    <input type="text" name="cognome" placeholder="Cognome" value={formData.cognome} onChange={handleChange} required className="input-registrazioneBambino"/>
                    <DatePicker
                        selected={formData.dataDiNascita}
                        onChange={handleDateChange}
                        dateFormat="dd/MM/yyyy"
                        className="input-registrazioneBambino"
                        placeholderText="Data di Nascita"
                        showYearDropdown
                        scrollableYearDropdown
                    />
                    <select name="sesso" value={formData.sesso} onChange={handleChange} required className="input-registrazioneBambino">
                        <option value="">Seleziona Sesso</option>
                        <option value="Maschio">Maschio</option>
                        <option value="Femmina">Femmina</option>
                        <option value="Altro">Altro</option>
                    </select>
                    <input type="email" name="emailGenitore" placeholder="Email Genitore" value={formData.emailGenitore} onChange={handleChange} required className="input-registrazioneBambino"/>
                    <input type="text" name="ID" placeholder="ID Bambino" value={formData.ID} onChange={handleChange} required className="input-registrazioneBambino"/>
                    <button type="submit" className="bottone-registrazioneBambino">Registra</button>
                </form>
            </div>
           
           <img src="/BeFluent_logo_testo.png" alt="Logo BeFluent" className="logo-registrazioneBambino"/>
           <img src="/iconaDottore.png" alt="Dottore" className="dottore-registrazioneBambino"/>
           <div className="testoRegistrazioneBambino">
                <p>Registrare un bambino è molto semplice, compila i dati sottostanti e clicca su REGISTRA.</p>
           </div>
           <img src="/robotRegistrazioneBambino.png" alt="Robot" className="robot-registrazioneBambino"/>

            <BackButton />
        </div>
            
    );
};

export default RegistrazioneBambino;