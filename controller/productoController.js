const Bodega = require('../model/Bodega');
const Producto = require('../model/Producto');
const Joi = require('@hapi/joi');

const schemaRegisters = Joi.object({
  nombre: Joi.string().required(),
  stockMin: Joi.number().required().min(0),
  stockMax: Joi.number().required().min(Joi.ref('stockMin')),
  descripcion: Joi.string().optional(),
  fechaVencimiento: Joi.date().optional(),
  bodega: Joi.string().required()
});

exports.createProducto = async (req, res) => {
try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { bodega: bodegaId, stockMax } = value;

    // Obtener la bodega
    const bodega = await Bodega.findById(bodegaId);
    if (!bodega) {
        return res.status(404).json({ error: 'Bodega no encontrada' });
    }

    // Calcular el stock total actual de la bodega
    const productosEnBodega = await Producto.find({ bodega: bodegaId });
    const stockTotalActual = productosEnBodega.reduce((total, producto) => total + producto.stockMax, 0);

    // Verificar si el nuevo stock máximo excederá la capacidad
    if (stockTotalActual + stockMax > bodega.capacidad) {
        return res.status(400).json({ error: 'El stock máximo excede la capacidad de la bodega' });
    }

    const nuevoProducto = new Producto(value);

    await Bodega.findByIdAndUpdate(
      nuevoProducto.bodega,
      { $push: { productos: nuevoProducto._id } },
      { new: true, useFindAndModify: false }
    );

    await nuevoProducto.save();
    const populatedProducto = await nuevoProducto.populate('bodega', 'nombre');
    const responseObject = {
        success: true,
        producto: populatedProducto,
    };

    res.status(201).json(responseObject);
} catch (error) {
    res.status(500).json({
        success: false,
        message: "¡Ups! Algo salió mal al intentar registrar el producto. Por favor, inténtalo nuevamente más tarde.",
        error: error.message,
    });
}
};
exports.getProductos = async (req, res) => {
    try { 
      const productos = await Producto.find();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Obtener un producto por ID
exports.getProductoById = async (req, res) => {
    try {
      const producto = await Producto.findById(req.params.id).populate('bodega', 'nombre');
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Actualizar un producto por ID
exports.updateProducto = async (req, res) => {
    try {
      const { error, value } = schemaRegisters.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
  
      const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, value, { new: true }).populate('bodega', 'nombre');
      if (!productoActualizado) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
  
      res.json({
        success: true,
        producto: productoActualizado,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "¡Ups! Algo salió mal al intentar actualizar el producto. Por favor, inténtalo nuevamente más tarde.",
        error: error.message,
      });
    }
  };
   

// Eliminar un producto por ID
exports.deleteProducto = async (req, res) => {
    try {
      const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
      if (!productoEliminado) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }
  
      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "¡Ups! Algo salió mal al intentar eliminar el producto. Por favor, inténtalo nuevamente más tarde.",
        error: error.message,
      });
    }
  };
