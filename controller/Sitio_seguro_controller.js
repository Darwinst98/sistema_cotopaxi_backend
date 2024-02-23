const SitioSeguro = require('../model/Sitio_seguro_model');

// Controlador para obtener todos los sitios seguros
exports.getSitiosSeguros = async (req, res) => {
  try {
    const sitiosSeguros = await SitioSeguro.find();
    res.json(sitiosSeguros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para crear un nuevo sitio seguro
exports.createSitioSeguro = async (req, res) => {
  const sitioSeguro = new SitioSeguro({
    nombre: req.body.nombre,
    coordenadaX: req.body.coordenadaX,
    coordenadaY: req.body.coordenadaY,
  });

  try {
    const nuevoSitioSeguro = await sitioSeguro.save();
    res.status(201).json(nuevoSitioSeguro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para editar un sitio seguro existente
exports.updateSitioSeguro = async (req, res) => {
  const { id } = req.params;
  
  try {
    const sitioSeguro = await SitioSeguro.findByIdAndUpdate(id, req.body, { new: true });
    res.json(sitioSeguro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
  
// Controlador para eliminar un sitio seguro
exports.deleteSitioSeguro = async (req, res) => {
  const { id } = req.params;
  
  try {
    await SitioSeguro.findByIdAndDelete(id);
    res.json({ message: 'Sitio seguro eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
