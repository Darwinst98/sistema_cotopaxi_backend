const Domicilio = require('../model/Domicilio_model');

// Controlador para obtener todos los domicilios
exports.getDomicilios = async (req, res) => {
  try {
    const domicilios = await Domicilio.find();
    res.json(domicilios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para crear un nuevo domicilio
exports.createDomicilio = async (req, res) => {
  const domicilio = new Domicilio({
    nombre: req.body.nombre,
    coordenadaX: req.body.coordenadaX,
    coordenadaY: req.body.coordenadaY,
  });

  try {
    const nuevoDomicilio = await domicilio.save();
    res.status(201).json(nuevoDomicilio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para editar un domicilio existente
exports.updateDomicilio = async (req, res) => {
  const { id } = req.params;
  
  try {
    const domicilio = await Domicilio.findByIdAndUpdate(id, req.body, { new: true });
    res.json(domicilio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
  
// Controlador para eliminar un domicilio
exports.deleteDomicilio = async (req, res) => {
  const { id } = req.params;
  
  try {
    await Domicilio.findByIdAndDelete(id);
    res.json({ message: 'Domicilio eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
