const Bodega = require('../model/Bodega');
const Producto = require('../model/Producto');
const Joi = require('@hapi/joi');

const schemaRegisters = Joi.object({
  nombre: Joi.string().required(),
  stockMin: Joi.number().required().min(0),
  stockMax: Joi.number().required().min(Joi.ref('stockMin')),
  codigo: Joi.string().required(),
  descripcion: Joi.string().optional(),
  fechaVencimiento: Joi.date().optional(),
  bodega: Joi.string().required()
});

const transferSchema = Joi.object({
  bodegaOrigenId: Joi.string().required(),
  productos: Joi.array().items(Joi.object({
    producto: Joi.string().required(),
    cantidad: Joi.number().required().min(1)
  })).required(),
  bodegaDestinoId: Joi.string().required()
});

exports.transferirProductos = async (req, res) => {
  const { error } = transferSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { bodegaOrigenId, productos, bodegaDestinoId } = req.body;

  try {
    // Verificar que ambas bodegas existen
    const bodegaOrigen = await Bodega.findById(bodegaOrigenId);
    if (!bodegaOrigen) return res.status(404).send('Bodega de origen no encontrada.');

    const bodegaDestino = await Bodega.findById(bodegaDestinoId);
    if (!bodegaDestino) return res.status(404).send('Bodega de destino no encontrada.');

    // Verificar que ambas bodegas pertenecen a la misma categoría
    if (bodegaOrigen.categoria !== bodegaDestino.categoria) {
      return res.status(400).send('Las bodegas no pertenecen a la misma categoría.');
    }

    // Procesar cada producto
    for (const item of productos) {
      const { producto, cantidad } = item;

      // Verificar que el producto existe en la bodega de origen y que tiene suficiente cantidad
      const productoOrigen = await Producto.findOne({ _id: producto, bodega: bodegaOrigenId });
      if (!productoOrigen) return res.status(404).send(`Producto con ID ${producto} no encontrado en la bodega de origen.`);
      if (productoOrigen.stockMin < cantidad) return res.status(400).send(`No hay suficiente cantidad del producto con ID ${producto} en la bodega de origen.`);

      // Verificar si el producto ya existe en la bodega de destino
      const productoDestino = await Producto.findOne({ _id: producto, bodega: bodegaDestinoId });

      if (productoDestino) {
        // Si el producto ya existe en la bodega de destino, aumentar la cantidad
        productoDestino.stockMin += cantidad;
        await productoDestino.save();
      } else {
        // Si el producto no existe en la bodega de destino, crear uno nuevo
        const newProducto = new Producto({
          nombre: productoOrigen.nombre,
          stockMin: cantidad,
          stockMax: productoOrigen.stockMax,
          codigo: productoOrigen.codigo,
          descripcion: productoOrigen.descripcion,
          fechaVencimiento: productoOrigen.fechaVencimiento,
          bodega: bodegaDestinoId
        });
        await newProducto.save();

        // Agregar el nuevo producto a la lista de productos de la bodega de destino
        bodegaDestino.productos.push(newProducto._id);
      }

      // Reducir la cantidad en la bodega de origen
      productoOrigen.stockMin -= cantidad;
      if (productoOrigen.stockMin === 0) {
        // Quitar el producto de la lista de productos de la bodega de origen si el stock es cero
        bodegaOrigen.productos.pull(productoOrigen._id);
        await productoOrigen.remove();
      } else {
        await productoOrigen.save();
      }
    }

    // Guardar cambios en las bodegas
    await bodegaOrigen.save();
    await bodegaDestino.save();

    res.send('Productos transferidos con éxito.');
  } catch (err) {
    res.status(500).send('Error del servidor.');
  }
};


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
