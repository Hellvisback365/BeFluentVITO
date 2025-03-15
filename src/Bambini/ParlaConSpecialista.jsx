import React, { useState, useEffect, useRef } from "react";
import "./ParlaConSpecialista.css";
import BackButton from "../Components/UI/BackButton-ui";
import LogoProfile from "../Components/UI/LogoProfile";

function ParlaConSpecialista() {
  // Stato per i messaggi: messaggio iniziale dello specialista
  const [messages, setMessages] = useState([
    { sender: "specialist", text: "Ciao! Sono l'assistente di BeFluent. Come posso aiutarti oggi?" },
  ]);
  // Stato per il testo in input
  const [inputText, setInputText] = useState("");
  // Stato per indicare se il bot sta "scrivendo"
  const [isTyping, setIsTyping] = useState(false);
  // Riferimento per lo scroll automatico
  const messagesEndRef = useRef(null);

  // Effetto per scorrere automaticamente ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


// Simulazione di un ritardo per la risposta del bot
const simulateTyping = (delay) => {
  return new Promise(resolve => setTimeout(resolve, delay));
}

  // Funzione per inviare una richiesta al server
  const fetchBotResponse = async (userInput) => {
    try {
      setIsTyping(true);
      await simulateTyping(1000); // Ritardo di 1 secondo

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userInput,
          // Non inviare dati personali non necessari
        }),
      });

        if (!response.ok) {
          const errorData = await response.json(); //Prova a leggere il corpo della risposta di errore.
          throw new Error(errorData.error || 'Errore nella comunicazione con il server'); //Usa il messaggio di errore del server, se disponibile.
      }

      const data = await response.json();
      
      // Aggiunge la risposta del bot
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: "specialist", text: data.response }
      ]);
      
    } catch (error) {
      console.error('Errore:', error);
      // Messaggio di fallback in caso di errore
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: "specialist", text: "Mi dispiace, non sono riuscito a rispondere. Riprova più tardi o chiedi aiuto al tuo specialista." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Funzione per inviare il messaggio
  const handleSend = () => {
    if (inputText.trim() === "") return; // Non inviare messaggi vuoti

    // Aggiunge il messaggio dell'utente alla lista
    const userMessage = inputText.trim();
    setMessages(prevMessages => [
      ...prevMessages,
      { sender: "user", text: userMessage }
    ]);
    setInputText("");

    // Ottiene la risposta dal bot
    fetchBotResponse(userMessage);
  };

  // Invio anche con il tasto Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      <main className="chatContainerDialogoSpecialista">
        <div className="chatHeaderDialogoSpecialista">CHAT CON L'ASSISTENTE</div>

        <div className="messageContainerDialogoSpecialista">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`messageBubbleDialogoSpecialista ${
                msg.sender === "user"
                  ? "userDialogoSpecialista"
                  : "specialistDialogoSpecialista"
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}

          {isTyping && (
            <div className="messageBubbleDialogoSpecialista specialistDialogoSpecialista">
                <p>Sto scrivendo<span className="dots">...</span></p> {/* Animazione puntini */}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="inputContainerDialogoSpecialista">
          <input
            type="text"
            placeholder="scrivi qui il messaggio..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            className="sendButtonDialogoSpecialista"
            disabled={isTyping || inputText.trim() === ""}
          >
            Invia
          </button>
        </div>
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