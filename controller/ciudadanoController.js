const Joi = require("@hapi/joi");
const Ciudadano = require("../model/Ciudadano");
const Albergue = require("../model/Albergue");
const Domicilio = require("../model/Domicilio");
const Enfermedad = require("../model/Enfermedad");
const Medicamento = require("../model/Medicamento");
const Bodega = require("../model/Bodega");
const Producto = require("../model/Producto");
const Usuario = require("../model/Usuario");

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  edad: Joi.number().required(),
  cedula: Joi.string().min(10).max(10).required(),
  email: Joi.string().min(4).max(100).required().email(),
  telefono: Joi.string().min(10).max(10).required(),
  enfermedades: Joi.string().optional(),
  medicamentos: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  qrURL: Joi.string().optional(),
  imgPerfil: Joi.string().optional(),
  domicilio: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
});

exports.createCiudadano = async (req, res) => {
  try {
    // Convertir medicamentos a un array si no lo es
    if (typeof req.body.medicamentos === "string") {
      req.body.medicamentos = [req.body.medicamentos];
    }

    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeCedula = await Ciudadano.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
    }

    const domicilioSeleccionado = await Domicilio.findById(value.domicilio);
    if (!domicilioSeleccionado) {
      return res.status(400).json({ error: "Domicilio no encontrado" });
    }

    let medicamentos = [];
    if (value.enfermedades) {
      const enfermedades = value.enfermedades.split(",");
      for (let enfermedadNombre of enfermedades) {
        const enfermedad = await Enfermedad.findOne({
          nombre: enfermedadNombre.trim(),
        }).populate("medicamentos");
        if (enfermedad) {
          medicamentos.push(...enfermedad.medicamentos);
        }
      }
    }

    // Convertir nombres de medicamentos a ObjectIds
    const medicamentosSeleccionados = [];
    for (let medicamentoNombre of value.medicamentos) {
      const medicamento = await Medicamento.findOne({
        nombre: medicamentoNombre,
      });
      if (medicamento) {
        medicamentosSeleccionados.push(medicamento._id);
      } else {
        return res
          .status(400)
          .json({ error: `Medicamento ${medicamentoNombre} no encontrado` });
      }
    }

    const nuevoCiudadano = new Ciudadano({
      nombre: value.nombre,
      apellido: value.apellido,
      edad: value.edad,
      cedula: value.cedula,
      email: value.email,
      telefono: value.telefono,
      enfermedades: value.enfermedades ? value.enfermedades.split(",") : [],
      domicilio: domicilioSeleccionado._id,
      salvaldo: false,
      qrURL: value.qrURL,
      medicamentos: medicamentosSeleccionados, // Guardar ObjectIds de los medicamentos seleccionados
    });

    await nuevoCiudadano.save();

    // Distribuir medicamentos proporcionalmente entre las bodegas
    const bodegas = await Bodega.find({ categoria: "Medicamentos" });

    for (let medicamentoId of medicamentosSeleccionados) {
      const medicamento = await Medicamento.findById(medicamentoId);
      if (medicamento) {
        // Buscar la bodega que tenga menos cantidad de este medicamento
        let bodegaSeleccionada = null;
        let menorCantidad = Infinity;

        for (let bodega of bodegas) {
          const productoExistente = await Producto.findOne({
            nombre: medicamento.nombre,
            bodega: bodega._id,
          });
          const cantidadActual = productoExistente
            ? productoExistente.stockMin
            : 0;

          if (cantidadActual < menorCantidad) {
            menorCantidad = cantidadActual;
            bodegaSeleccionada = bodega;
          }
        }

        if (bodegaSeleccionada) {
          let producto = await Producto.findOne({
            nombre: medicamento.nombre,
            bodega: bodegaSeleccionada._id,
          });
          if (producto) {
            if (producto.stockMax > producto.stockMin) {
              producto.stockMin += 1;
              producto.stockMax += 1;
            } else {
              console.log(
                `No se puede aumentar el stock de ${medicamento.nombre} en la bodega ${bodegaSeleccionada._id}. Ya está en su máximo.`
              );
            }
          } else {
            producto = new Producto({
              nombre: medicamento.nombre,
              stockMin: 1,
              stockMax: 10,
              codigo: medicamento.codigo,
              descripcion: medicamento.descripcion,
              fechaVencimiento: medicamento.fechaVencimiento,
              bodega: bodegaSeleccionada._id,
            });
          }
          await producto.save();

          if (!bodegaSeleccionada.productos.includes(producto._id)) {
            bodegaSeleccionada.productos.push(producto._id);
            await bodegaSeleccionada.save();
          }
        }
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

// Controlador para actualizar la imagen de perfil
exports.updateProfileImage = async (req, res) => {
  const { cedula, imgPerfil } = req.body;

  console.log(
    "Recibí una solicitud de actualización de ProfileImage con cédula:",
    cedula,
    "e imgPerfil:",
    imgPerfil
  );

  if (!cedula || !imgPerfil) {
    return res
      .status(400)
      .json({ message: "Cédula e imagen de perfil son requeridos" });
  }

  try {
    const ciudadano = await Ciudadano.findOneAndUpdate(
      { cedula: cedula },
      { imgPerfil: imgPerfil },
      { new: true }
    );

    if (!ciudadano) {
      return res.status(404).json({ message: "Ciudadano no encontrado" });
    }

    res
      .status(200)
      .json({ message: "Imagen de perfil actualizada", ciudadano: ciudadano });
  } catch (error) {
    console.error("Error al actualizar la imagen del perfil:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

exports.createCiudadanoUser = async (req, res) => {
  try {
    const userId = req.user.id; // Suponiendo que el ID del usuario está en req.user.id
    const user = await Usuario.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const albergueId = user.albergue; // Suponiendo que el albergue está en el campo `albergue` del usuario
    const albergue = await Albergue.findById(albergueId);

    if (!albergue) {
      return res.status(404).json({ message: "Albergue no encontrado" });
    }

    // Convertir medicamentos a un array si no lo es
    if (typeof req.body.medicamentos === "string") {
      req.body.medicamentos = [req.body.medicamentos];
    }

    // Validar el cuerpo de la solicitud
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeCedula = await Ciudadano.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
    }

    const domicilioSeleccionado = await Domicilio.findById(value.domicilio);
    if (!domicilioSeleccionado) {
      return res.status(400).json({ error: "Domicilio no encontrado" });
    }

    let medicamentos = [];
    if (value.enfermedades) {
      const enfermedades = value.enfermedades.split(",");
      for (let enfermedadNombre of enfermedades) {
        const enfermedad = await Enfermedad.findOne({
          nombre: enfermedadNombre.trim(),
        }).populate("medicamentos");
        if (enfermedad) {
          medicamentos.push(...enfermedad.medicamentos);
        }
      }
    }

    const medicamentosSeleccionados = [];
    for (let medicamentoNombre of value.medicamentos) {
      const medicamento = await Medicamento.findOne({
        nombre: medicamentoNombre,
      });
      if (medicamento) {
        medicamentosSeleccionados.push(medicamento._id);
      } else {
        return res
          .status(400)
          .json({ error: `Medicamento ${medicamentoNombre} no encontrado` });
      }
    }

    const nuevoCiudadano = new Ciudadano({
      nombre: value.nombre,
      apellido: value.apellido,
      edad: value.edad,
      cedula: value.cedula,
      email: value.email,
      telefono: value.telefono,
      enfermedades: value.enfermedades ? value.enfermedades.split(",") : [],
      domicilio: domicilioSeleccionado._id,
      salvaldo: true,
      qrURL: value.qrURL,
      medicamentos: medicamentosSeleccionados,
      albergue: albergueId, // Asignar albergue del usuario que registra
    });

    await nuevoCiudadano.save();

    const bodegas = await Bodega.find({
      albergue: albergueId,
      categoria: "Medicamentos",
    });

    for (let medicamentoId of medicamentosSeleccionados) {
      const medicamento = await Medicamento.findById(medicamentoId);
      if (medicamento) {
        // Buscar la bodega que tenga menos cantidad de este medicamento
        let bodegaSeleccionada = null;
        let menorCantidad = Infinity;

        for (let bodega of bodegas) {
          const productoExistente = await Producto.findOne({
            nombre: medicamento.nombre,
            bodega: bodega._id,
          });
          const cantidadActual = productoExistente
            ? productoExistente.stockMin
            : 0;

          if (cantidadActual < menorCantidad) {
            menorCantidad = cantidadActual;
            bodegaSeleccionada = bodega;
          }
        }

        if (bodegaSeleccionada) {
          let producto = await Producto.findOne({
            nombre: medicamento.nombre,
            bodega: bodegaSeleccionada._id,
          });
          if (producto) {
            if (producto.stockMax > producto.stockMin) {
              producto.stockMin += 1;
              producto.stockMax += 1;
            } else {
              console.log(
                `No se puede aumentar el stock de ${medicamento.nombre} en la bodega ${bodegaSeleccionada._id}. Ya está en su máximo.`
              );
            }
          } else {
            producto = new Producto({
              nombre: medicamento.nombre,
              stockMin: 1,
              stockMax: 10,
              codigo: medicamento.codigo,
              descripcion: medicamento.descripcion,
              fechaVencimiento: medicamento.fechaVencimiento,
              bodega: bodegaSeleccionada._id,
            });
          }
          await producto.save();

          if (!bodegaSeleccionada.productos.includes(producto._id)) {
            bodegaSeleccionada.productos.push(producto._id);
            await bodegaSeleccionada.save();
          }
        }
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
        "¡Ups! Algo salió mal al intentar registrar al ciudadano. Por favor, inténtelo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getCiudadanos = async (req, res) => {
  try {
    let ciudadanos = await Ciudadano.find({ albergue: req.params.id });

    // Obtener todos los IDs de medicamentos
    const medicamentoIds = ciudadanos.flatMap((c) => c.medicamentos);

    // Obtener los nombres de los medicamentos
    const medicamentos = await Medicamento.find(
      { _id: { $in: medicamentoIds } },
      "nombre"
    );
    const medicamentoMap = new Map(
      medicamentos.map((m) => [m._id.toString(), m.nombre])
    );

    // Transformar los resultados
    ciudadanos = ciudadanos.map((ciudadano) => {
      const ciudadanoObject = ciudadano.toObject();
      ciudadanoObject.medicamentos = ciudadanoObject.medicamentos.map(
        (id) => medicamentoMap.get(id.toString()) || id.toString()
      );
      return ciudadanoObject;
    });

    res.json(ciudadanos);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar obtener los ciudadanos. Por favor, inténtalo nuevamente más tarde.",
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
      message:
        "¡Ups! Algo salió mal al intentar eliminar el ciudadano. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.updateCiudadano = async (req, res) => {
  try {
    const ciudadano = await Ciudadano.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        useFindAndModify: false,
      }
    );
    if (!ciudadano) {
      return res.status(404).json({ error: "Ciudadano no encontrado" });
    }

    res.status(200).json({ success: true, ciudadano });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar actualizar el ciudadano. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getTotalCiudadanos = async (req, res) => {
  try {
    const totalCiudadanos = await Ciudadano.countDocuments();
    res.json({
      success: true,
      totalCiudadanos: totalCiudadanos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar obtener el total de ciudadanos. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getCiudadanosDeTodosLosAlbergues = async (req, res) => {
  try {
    const ciudadanos = await Ciudadano.find()
      .populate({
        path: "medicamentos",
        select: "nombre",
      })
      .populate("domicilio", "nombre")
      .populate("albergue", "nombre")
      .lean();

    const ciudadanosFormateados = ciudadanos.map((ciudadano) => ({
      ...ciudadano,
      medicamentos: ciudadano.medicamentos.map((med) => med.nombre),
    }));

    res.json(ciudadanosFormateados);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar obtener los ciudadanos. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.scanQrCode = async (req, res) => {
  try {
    const { ciudadanoData } = req.body;
    const adminId = req.user.id;

    console.log(ciudadanoData);
    const { error } = schemaRegisters.validate(ciudadanoData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const admin = await Usuario.findById(adminId).populate("albergue");
    if (!admin || !admin.albergue) {
      return res
        .status(400)
        .json({ error: "Admin not associated with an albergue" });
    }

    let ciudadano = await Ciudadano.findOne({ cedula: ciudadanoData.cedula });

    if (!ciudadano) {
      return res.status(404).json({ error: "Ciudadano no encontrado" });
    }

    ciudadano.albergue = admin.albergue._id;
    ciudadano.salvaldo = true;
    await ciudadano.save();

    const bodega = await Bodega.findOne({
      albergue: admin.albergue._id,
    });

    console.log(bodega);
    const medicamento = await Producto.findOne({
      nombre: ciudadanoData.medicamentos,
      bodega: bodega._id,
    });

    if (!medicamento) {
      return res
        .status(400)
        .json({ error: "Medication not found in the albergue's warehouse" });
    }

    if (medicamento.stockMax <= 0) {
      return res
        .status(400)
        .json({ error: "No stock available for the required medication" });
    }

    medicamento.stockMax -= 1;
    await medicamento.save();

    res.json({
      message: "Citizen successfully updated/added to albergue",
      ciudadano,
    });
  } catch (error) {
    console.log("Server error:", error);
    res.status(400).json({ error: error.message });
  }
};

// exports.scanQrCode = async (req, res) => {
//   try {
//     const { ciudadanoData } = req.body;
//     const adminId = req.user.id;

//     console.log(ciudadanoData);
//     const { error } = schemaRegisters.validate(ciudadanoData);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     const admin = await Usuario.findById(adminId).populate('albergue');
//     if (!admin || !admin.albergue) {
//       return res.status(400).json({ error: "Admin not associated with an albergue" });
//     }

//     let ciudadano = await Ciudadano.findOne({ cedula: ciudadanoData.cedula });

//     if (ciudadano) {
//       ciudadano.albergue = admin.albergue._id;
//       ciudadano.salvaldo = true;
//       await ciudadano.save();
//     } else {
//       ciudadano = new Ciudadano({
//         ...ciudadanoData,
//         albergue: admin.albergue._id,
//         salvaldo: true
//       });
//       await ciudadano.save();
//     }

//     // Reduce stock of the needed medication
//     const medicamento = await Producto.findOne({
//       nombre: ciudadanoData.medicamentos,
//       bodega: admin.albergue._id
//     });

//     if (!medicamento) {
//       return res.status(400).json({ error: "Medication not found in the albergue's warehouse" });
//     }

//     if (medicamento.stockMax <= 0) {
//       return res.status(400).json({ error: "No stock available for the required medication" });
//     }

//     medicamento.stockMax -= 1;
//     await medicamento.save();

//     res.json({ message: "Citizen successfully updated/added to albergue and medication stock reduced", ciudadano });
//   } catch (error) {
//     console.log('Server error:', error);
//     res.status(400).json({ error: error.message });
//   }
// };
