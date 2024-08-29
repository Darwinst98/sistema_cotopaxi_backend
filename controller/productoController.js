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
      const productoDestino = await Producto.findOne({ _id: producto, bodega: bodegaDestinoId, nombre: productoOrigen.nombre,
        codigo: productoOrigen.codigo });
    
      if (productoDestino) {
        // Si el producto ya existe en la bodega de destino, aumentar la cantidad
        productoDestino.stockMin += cantidad;
        if (productoOrigen.fechaVencimiento) {
          productoDestino.fechaVencimiento = productoOrigen.fechaVencimiento;
        }
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
        // Si el stock llega a cero, eliminar el producto de la bodega de origen
        await Producto.findByIdAndDelete(productoOrigen._id);
        // Remover el producto de la lista de productos de la bodega de origen
        bodegaOrigen.productos = bodegaOrigen.productos.filter(p => p.toString() !== productoOrigen._id.toString());
      } else {
        await productoOrigen.save();
      }
    }
    
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


  exports.actualizarProductoPorQR = async (req, res) => {
    try {
      const { qrData, bodegaId } = req.body;
  
      let qrText;
      if (typeof qrData === 'object' && qrData.text) {
        qrText = qrData.text;
      } else if (typeof qrData === 'string') {
        qrText = qrData;
      } else {
        throw new Error('Formato de datos QR inválido');
      }
  
      const [categoria, nombre, codigo, fechaVencimiento] = qrText.split('/');
  
      // Buscar la bodega
      const bodega = await Bodega.findById(bodegaId);
      if (!bodega) {
        return res.status(404).json({ status: 'error', message: 'Bodega no encontrada' });
      }
  
      // Verificar si la categoría coincide
      if (bodega.categoria !== categoria) {
        return res.status(400).json({ status: 'error', message: 'La categoría del producto no coincide con la de la bodega' });
      }
  
      // Buscar el producto en la bodega
      let producto = await Producto.findOne({ nombre, codigo, bodega: bodegaId });
  
      if (bodega.categoria === 'Medicamentos') {
        if (producto) {
          // Actualizar producto existente sin cambiar el stock
          producto.fechaVencimiento = new Date(fechaVencimiento);
          await producto.save();
          return res.status(200).json({ status: 'success', message: 'Producto de Medicamentos actualizado exitosamente', producto });
        } else {
          return res.status(400).json({ status: 'error', message: 'No se pueden crear nuevos productos en la bodega de Medicamentos' });
        }
      } else {
        if (producto) {
          // Actualizar producto existente y aumentar stock
          producto.fechaVencimiento = new Date(fechaVencimiento);
          producto.stockMin = producto.stockMin + 1;
          await producto.save();
          return res.status(200).json({ status: 'success', message: 'Producto actualizado y stock incrementado', producto });
        } else {
          // Crear nuevo producto con stock inicial de 1
          producto = new Producto({
            nombre,
            codigo,
            fechaVencimiento: new Date(fechaVencimiento),
            bodega: bodegaId,
            stock: 1,
            stockMin: 1,
            stockMax: 100,
            descripcion: 'Nuevo producto escaneado por QR'
          });
          await producto.save();
          return res.status(201).json({ status: 'success', message: 'Nuevo producto creado con stock inicial', producto });
        }
      }
    } catch (error) {
      console.error('Error al actualizar/crear producto por QR:', error);
      res.status(500).json({ status: 'error', message: error.message || 'Error al procesar la solicitud' });
    }
  };