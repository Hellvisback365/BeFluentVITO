import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const ConfermaRegistrazione = () => {
    const { token } = useParams();
    const [messaggio, setMessaggio] = useState('Conferma in corso...');

    console.log("Token ricevuto:", token); // DEBUG

    useEffect(() => {
        const confermaRegistrazione = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/conferma/registrazione/${token}`);
                console.log("Risposta dal server:", response.data); // DEBUG
                setMessaggio(response.data);
            } catch (error) {
                console.error("Errore durante la conferma:", error); // DEBUG
                setMessaggio('Errore nella conferma della registrazione.');
            }
        };

        if (token) confermaRegistrazione();
    }, [token]);

    return <h2>{messaggio}</h2>;
};

export default ConfermaRegistrazione;
