import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';

const Pagamento = () => {
    const [abbonamento, setAbbonamento] = useState('mensile');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null); // Stato per l'userId
    const navigate = useNavigate(); // Hook per la navigazione


    useEffect(() => {
        // Recupera l'userId dal localStorage
        const storedUserId = localStorage.getItem('userId');  // <--- Usa 'userId', non 'user'
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            // GESTIONE MIGLIORE DELL'ERRORE (reindirizza al login)
            alert('Errore: Utente non autenticato. Effettua il login.');
            navigate('/login'); // Assicurati di avere una rotta '/login'
        }
    }, []);


    const handleAbbonamentoChange = (event) => {
        setAbbonamento(event.target.value);
    };

    const handlePagamento = async () => {
        if (!userId) {
            alert("User ID non trovato");
            return;
        }
    
        setLoading(true);
    
        try {
            // Chiamata all'API del tuo backend
            const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/creaCheckoutSession`, {
                userId,
                tipoAbbonamento: abbonamento
            });
    
            // Inizializza Stripe.js con la *CHIAVE PUBBLICA* (da .env)
            const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    
            // Reindirizza a Stripe Checkout
            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    
            if (error) {
                console.error(error);
                alert(`Errore durante il pagamento: ${error.message}`);
            }
    
        } catch (error) {
            console.error('Errore durante il pagamento:', error);
            alert('Errore durante il pagamento: ' + (error.response?.data?.error || error.message)); // Messaggio di errore più dettagliato
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="container mx-auto p-4 mt-20">
            <h2 className="text-2xl font-bold mb-4">Seleziona il piano di abbonamento</h2>

            <div className="mb-6">
                <label className="inline-flex items-center mr-4">
                    <input
                        type="radio"
                        value="mensile"
                        checked={abbonamento === 'mensile'}
                        onChange={handleAbbonamentoChange}
                        className="form-radio"
                    />
                    <span className="ml-2">Abbonamento Mensile (30€)</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        value="annuale"
                        checked={abbonamento === 'annuale'}
                        onChange={handleAbbonamentoChange}
                        className="form-radio"
                    />
                    <span className="ml-2">Abbonamento Annuale (330€)</span>
                </label>
            </div>

            <button
                onClick={handlePagamento}
                disabled={loading || !userId}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Caricamento...' : 'Procedi con il pagamento'}
            </button>
        </div>
    );
};

export default Pagamento;