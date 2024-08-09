const Joi = require("@hapi/joi");
const Bodega = require("../model/Bodega");
const Albergue = require("../model/Albergue");
const Producto = require("../model/Producto");

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
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

    const albergue = await Albergue.findById(value.albergue);
    if (!albergue) {
      return res.status(400).json({ error: "Albergue no encontrado" });
    }

    if (albergue.bodegas.length >= albergue.capacidadBodegas) {
      return res.status(400).json({ error: "Capacidad máxima de bodegas alcanzada en el albergue" });
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

exports.getBodegas = async (req, res) => {
  try { 
    const bodegas = await Bodega.find().populate('albergue', 'nombre').populate('productos');
    
    const bodegasConAlerta = bodegas.map(bodega => {
      const cantidadProductos = bodega.productos.length;
      const porcentajeOcupacion = (cantidadProductos / bodega.capacidad) * 100;
      let alerta = null;
      
      if (porcentajeOcupacion >= 90) {
        alerta = "Crítico: La bodega está casi llena";
      } else if (porcentajeOcupacion >= 75) {
        alerta = "Advertencia: La bodega está llegando a su capacidad máxima";
      }
      
      return {
        ...bodega.toObject(),
        cantidadProductos,
        porcentajeOcupacion,
        alerta
      };
    });

    res.json(bodegasConAlerta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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


exports.deleteBodega = async (req, res) => {
  try {
    const bodegaEliminada = await Bodega.findByIdAndDelete(req.params.id);
    if (!bodegaEliminada) {
      return res.status(404).json({ message: "Bodega no encontrada" });
    }

    const productos = await Producto.find({ bodega: bodegaEliminada._id });
    for (let producto of productos) {
      await Producto.findByIdAndDelete(producto._id);
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

exports.getBodegasAlBergue = async (req, res) => {
  try {
    const bodegas = await Bodega.find({ albergue: req.params.id }).populate('productos');

    const bodegasConAlerta = bodegas.map(bodega => {
      const cantidadProductos = bodega.productos.length;
      const porcentajeOcupacion = (cantidadProductos / bodega.capacidad) * 100;
      let alerta = null;
      
      if (porcentajeOcupacion >= 90) {
        alerta = "Crítico: La bodega está casi llena";
      } else if (porcentajeOcupacion >= 75) {
        alerta = "Advertencia: La bodega está llegando a su capacidad máxima";
      }
      
      return {
        ...bodega.toObject(),
        cantidadProductos,
        porcentajeOcupacion,
        alerta
      };
    });

    res.json({
      success: true,
      data: bodegasConAlerta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener las bodegas. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

//Controlador para traer el numero total de bodegaas
exports.getTotalBodegas = async (req, res) => {
  try {
    const totalBodegas = await Bodega.countDocuments();
    res.json({
      success: true,
      totalBodegas: totalBodegas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener el total de bodegas. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};