const Enfermedad = require('../model/Enfermedad_model');

// Controlador para obtener todas las enfermedades
exports.getEnfermedades = async (req, res) => {
  try {
    const enfermedades = await Enfermedad.find().populate('medicamentos');
    res.json(enfermedades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para crear una nueva enfermedad
exports.createEnfermedad = async (req, res) => {
  const enfermedad = new Enfermedad({
    nombre: req.body.nombre,
    medicamentos: req.body.medicamentos // Array de IDs de medicamentos
  });

  try {
    const nuevaEnfermedad = await enfermedad.save();
    res.status(201).json(nuevaEnfermedad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para editar una enfermedad existente
exports.updateEnfermedad = async (req, res) => {
  const { id } = req.params;
  
  try {
    const enfermedad = await Enfermedad.findByIdAndUpdate(id, req.body, { new: true }).populate('medicamentos');
    res.json(enfermedad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para eliminar una enfermedad
exports.deleteEnfermedad = async (req, res) => {
  const { id } = req.params;
  
  try {
    await Enfermedad.findByIdAndDelete(id);
    res.json({ message: 'Enfermedad eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
