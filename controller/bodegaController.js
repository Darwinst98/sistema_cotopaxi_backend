const Joi = require("@hapi/joi");
const Bodega = require("../model/Bodega");
const Albergue = require("../model/Albergue");

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  descripcion: Joi.string().min(2).max(200),
  categoria: Joi.string().min(2).max(100).required(),
  capacidad: Joi.number().required(),
  albergue: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

exports.createBodega = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const nuevoBodega = new Bodega(value);
    await nuevoBodega.save();

    await Albergue.findByIdAndUpdate(
      nuevoBodega.albergue,
      { $push: { bodegas: nuevoBodega._id } },
      { new: true, useFindAndModify: false }
    );

    
    const populatedBodega = await nuevoBodega.populate('albergue', 'nombre');
    
    
    const responseObject = {
      success: true,
      bodega: populatedBodega,
    };

    res.status(201).json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar registrarte. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Obtener todas las bodegas con el nombre del albergue al que pertenecen
exports.getBodegas = async (req, res) => {
  try { 
    const bodegas = await Bodega.find().populate('albergue', 'nombre');
    res.json(bodegas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una bodega por ID
exports.getBodegaById = async (req, res) => {
  try {
    const bodega = await Bodega.findById(req.params.id).populate('albergue', 'nombre');
    if (!bodega) {
      return res.status(404).json({ message: "Bodega no encontrada" });
    }
    res.json(bodega);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una bodega por ID
exports.updateBodega = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const bodegaActualizada = await Bodega.findByIdAndUpdate(req.params.id, value, { new: true }).populate('albergue', 'nombre');
    if (!bodegaActualizada) {
      return res.status(404).json({ message: "Bodega no encontrada" });
    }

    res.json({
      success: true,
      bodega: bodegaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar actualizar la bodega. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Eliminar una bodega por ID
exports.deleteBodega = async (req, res) => {
  try {
    const bodegaEliminada = await Bodega.findByIdAndDelete(req.params.id);
    if (!bodegaEliminada) {
      return res.status(404).json({ message: "Bodega no encontrada" });
    }

    res.json({
      success: true,
      message: "Bodega eliminada exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar la bodega. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Controlador para obtener todas las bodegas que pertenecen a un albergue
exports.getBodegasAlBergue = async (req, res) => {
  try {
    const bodegas = await Bodega.find({ albergue: req.params.id });

    res.json(bodegas);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener las bodegas. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};