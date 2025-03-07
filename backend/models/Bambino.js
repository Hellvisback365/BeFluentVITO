import mongoose from "mongoose";

const BambinoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    dataDiNascita: { type: Date, required: true },
    sesso: { type: String, required: true },
    emailGenitore: { type: String, required: true, unique: true },
    ID: { type: String, required: true,  unique: true },
    specialistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialista', required: true },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    isDeleted: { type: Boolean, default: false } // Inizialmente non eliminato
});

const Bambino = mongoose.model("Bambino", BambinoSchema);

export default Bambino;
