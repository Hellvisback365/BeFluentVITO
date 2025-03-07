import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  bambino: { type: mongoose.Schema.Types.ObjectId, ref: "Bambino", required: true },
  oggetto: { type: String, required: true },
  testo: { type: String, required: true },
  data: { type: Date, default: Date.now },
  autore: { type: mongoose.Schema.Types.ObjectId, ref: "Specialista" },
  creatoIl: { type: Date, default: Date.now },
  modificatoIl: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", ReportSchema);

export default Report;