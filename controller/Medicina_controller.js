const Medicina = require('../model/Medicina_model');

// Controlador para obtener todos los medicamentos
exports.getMedicina = async (req, res) => {
  try {
    const medicinas = await Medicina.find();
    res.json(medicinas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para crear un nuevo medicamento
exports.createMedicina = async (req, res) => {
  const medicina = new Medicina({
    nombre: req.body.nombre,
  });

  try {
    const nuevaMedicina = await medicina.save();
    res.status(201).json(nuevaMedicina);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para editar un medicamento existente
exports.updateMedicina = async (req, res) => {
  const { id } = req.params;
  
  try {
    const medicina = await Medicina.findByIdAndUpdate(id, req.body, { new: true });
    res.json(medicina);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
  
// Controlador para eliminar un medicamento
exports.deleteMedicina = async (req, res) => {
  const { id } = req.params;
  
  try {
    await Medicina.findByIdAndDelete(id);
    res.json({ message: 'Medicamento eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
