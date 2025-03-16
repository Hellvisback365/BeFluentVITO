import React, { useEffect } from 'react'; // Rimuovi useState e useLocation se non più necessari

function VoiceflowWidget() {
  useEffect(() => {
    // Controlla se lo script è già stato caricato
    if (window.voiceflow?.chat) {
      return; // Se esiste, esci (evita caricamenti multipli)
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';

    script.onload = () => {
      window.voiceflow.chat.load({
        verify: { projectID: '67d6b57f21b78ba30f3ae624' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
        voice: {
          url: "https://runtime-api.voiceflow.com"
        }
      });
    };

    document.body.appendChild(script);

    return () => {
      if (window.voiceflow?.chat) {
        window.voiceflow.chat.destroy();
      }
      //rimuovo elemento
      document.body.removeChild(script);

    };
  }, []); // Dipendenze vuote: esegui solo al montaggio/smontaggio

  return <div id="voiceflow-widget-container"></div>;
}

export default VoiceflowWidget;