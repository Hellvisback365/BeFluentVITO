import mongoose from 'mongoose';
import validator from "validator";

const SpecialistaSchema = new mongoose.Schema({
    specialistaId: { type: mongoose.Schema.Types.ObjectId, unique: true, default: () => new mongoose.Types.ObjectId() },
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    email: { type: String, 
        required: true, 
        unique: true,  
        validate: 
        {
            validator: function(v) {
                return validator.isEmail(v);  // Verifica se l'email è valida
                },
                message: props => `${props.value} non è una email valida!` 
            }
        },

        
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sesso: { type: String, required: true },
    telefono: { type: String, required: false },  // Campo opzionale
    //specialistaId: { type: String, required: false, unique: true }
    pagamentoEffettuato: { type: Boolean, default: false } // Inizialmente non pagato
},  { timestamps: true }); // Aggiunge createdAt e updatedAt

const Specialista = mongoose.model("Specialista", SpecialistaSchema);

export default Specialista;