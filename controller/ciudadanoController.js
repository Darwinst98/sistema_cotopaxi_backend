const Joi = require("@hapi/joi");
const Ciudadano = require('../model/Ciudadano');
const Albergue = require('../model/Albergue');
const Domicilio = require('../model/Domicilio');
const Enfermedad = require('../model/Enfermedad');
const Medicamento = require('../model/Medicamento');
const Bodega = require('../model/Bodega');
const Producto = require('../model/Producto'); // Asegúrate de requerir el modelo Producto

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  edad: Joi.number().required(),
  cedula: Joi.string().min(10).max(10).required(),
  email: Joi.string().min(4).max(100).required().email(),
  telefono: Joi.string().min(10).max(10).required(),
  enfermedades: Joi.string().optional(),
  qrURL: Joi.string().required(),
  domicilio: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
});

// Función para calcular la distancia entre dos puntos en coordenadas cartesianas
function calcularDistancia(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

exports.createCiudadano = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeEmail = await Ciudadano.findOne({ email: value.email });
    if (existeEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const existeCedula = await Ciudadano.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
    }

    const existeTelefono = await Ciudadano.findOne({ telefono: value.telefono });
    if (existeTelefono) {
      return res.status(400).json({ error: "El telefono ya está registrado" });
    }

    const domicilioSeleccionado = await Domicilio.findById(value.domicilio);
    if (!domicilioSeleccionado) {
      return res.status(400).json({ error: "Domicilio no encontrado" });
    }

    const albergues = await Albergue.find();
    const distancias = albergues.map(albergue => ({
      albergue,
      distancia: calcularDistancia(
        albergue.cordenadas_x, albergue.cordenadas_y,
        domicilioSeleccionado.cordenadas_x, domicilioSeleccionado.cordenadas_y
      )
    }));

    const albergueMasProximo = distancias.reduce((prev, curr) => 
      prev.distancia < curr.distancia ? prev : curr
    ).albergue;

    let medicamentos = [];
    if (value.enfermedades) {
      const enfermedades = value.enfermedades.split(',');
      for (let enfermedadNombre of enfermedades) {
        const enfermedad = await Enfermedad.findOne({ nombre: enfermedadNombre.trim() }).populate('medicamentos');
        if (enfermedad) {
          medicamentos.push(...enfermedad.medicamentos);
        }
      }
    }

    const nuevoCiudadano = new Ciudadano({
      nombre: value.nombre,
      apellido: value.apellido,
      edad: value.edad,
      cedula: value.cedula,
      email: value.email,
      telefono: value.telefono,
      enfermedades: value.enfermedades ? value.enfermedades.split(',') : [],
      albergue: albergueMasProximo._id,
      domicilio: domicilioSeleccionado._id,
      qrURL: value.qrURL,
      medicamentos
    });

    await nuevoCiudadano.save();

    // Actualizar el albergue con el nuevo ciudadano
    await Albergue.findByIdAndUpdate(
      albergueMasProximo._id,
      { $push: { ciudadanos: nuevoCiudadano._id } },
      { new: true, useFindAndModify: false }
    );

    // Asignar medicamentos a la bodega del albergue
    for (let medicamento of medicamentos) {
      const bodegas = await Bodega.find({ _id: { $in: albergueMasProximo.bodegas } });

      let bodegaMedicamentos = bodegas.find(b => b.categoria === 'Medicamentos');

        
        let producto = await Producto.findOne({ nombre: medicamento.nombre, bodega: bodegaMedicamentos._id });
        if (producto) {
          producto.stock += 1;
        } else {
          producto = new Producto({
            nombre: medicamento.nombre,
            stock: 1,
            descripcion: medicamento.descripcion,
            bodega: bodegaMedicamentos._id
          });
        }

        await producto.save();
        if (!bodegaMedicamentos.productos.includes(producto._id)) {
          bodegaMedicamentos.productos.push(producto._id);
          await bodegaMedicamentos.save();
        }
    }

    const responseObject = {
      success: true,
      ciudadano: nuevoCiudadano,
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



exports.getCiudadanos = async (req, res) => {
  try {
    let ciudadanos = await Ciudadano.find({ albergue: req.params.id });

    // Obtener todos los IDs de medicamentos
    const medicamentoIds = ciudadanos.flatMap(c => c.medicamentos);

    // Obtener los nombres de los medicamentos
    const medicamentos = await Medicamento.find({ _id: { $in: medicamentoIds } }, 'nombre');
    const medicamentoMap = new Map(medicamentos.map(m => [m._id.toString(), m.nombre]));

    // Transformar los resultados
    ciudadanos = ciudadanos.map(ciudadano => {
      const ciudadanoObject = ciudadano.toObject();
      ciudadanoObject.medicamentos = ciudadanoObject.medicamentos.map(id => medicamentoMap.get(id.toString()) || id.toString());
      return ciudadanoObject;
    });

    res.json(ciudadanos);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener los ciudadanos. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.deleteCiudadano = async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByIdAndDelete(req.params.id);
    if (!ciudadano) {
      return res.status(404).json({ error: "Ciudadano no encontrado" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar el ciudadano. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.updateCiudadano = async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      useFindAndModify: false,
    });
    if (!ciudadano) {
      return res.status(404).json({ error: "Ciudadano no encontrado" });
    }

    res.status(200).json({ success: true, ciudadano });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar actualizar el ciudadano. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};