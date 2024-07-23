const Enfermedad = require('../model/Enfermedad');
const Medicamento = require('../model/Medicamento');
const Joi = require('@hapi/joi');

const xlsx = require('xlsx');

// Esquemas de validación
const enfermedadSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().required(),
  medicamentos: Joi.array().items(Joi.object({
    nombre: Joi.string().required(),
    codigo: Joi.string().required(),
    descripcion: Joi.string(),
    fechaVencimiento: Joi.date()

  })).required()
});

const medicamentoSchema = Joi.object({
  nombre: Joi.string().required(),
  codigo: Joi.string().required(),
  descripcion: Joi.string(),
  fechaVencimiento: Joi.date()
});

exports.crearEnfermedad = async (req, res) => {
  try {
    // Validar los datos de entrada
    const { error } = enfermedadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nombre, descripcion, medicamentos } = req.body;
    
    // Crear los medicamentos primero
    const medicamentosCreados = await Promise.all(
      medicamentos.map(med => Medicamento.create(med))
    );

    // Crear la enfermedad con los IDs de los medicamentos
    const enfermedad = new Enfermedad({
      nombre,
      descripcion,
      medicamentos: medicamentosCreados.map(med => med._id)
    });

    await enfermedad.save();
    
    res.status(201).json(enfermedad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.eliminarEnfermedad = async (req, res) => {
    try {
      const enfermedad = await Enfermedad.findById(req.params.id);
      if (!enfermedad) {
        return res.status(404).json({ message: 'Enfermedad no encontrada' });
      }
      
      // Eliminar los medicamentos asociados
      await Medicamento.deleteMany({ _id: { $in: enfermedad.medicamentos } });
      
      // Eliminar la enfermedad
      await Enfermedad.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Enfermedad y medicamentos asociados eliminados' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.editarEnfermedad = async (req, res) => {
  try {
    // Validar los datos de entrada
    const { error } = enfermedadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { nombre, descripcion, medicamentos } = req.body;
    const enfermedad = await Enfermedad.findById(req.params.id);
    
    if (!enfermedad) {
      return res.status(404).json({ message: 'Enfermedad no encontrada' });
    }

    enfermedad.nombre = nombre;
    enfermedad.descripcion = descripcion;

    // Actualizar medicamentos existentes y crear nuevos
    const medicamentosActualizados = await Promise.all(
      medicamentos.map(async (med) => {
        const { error } = medicamentoSchema.validate(med);
        if (error) {
          throw new Error(`Medicamento inválido: ${error.details[0].message}`);
        }
        if (med._id) {
          return Medicamento.findByIdAndUpdate(med._id, med, { new: true });
        } else {
          return Medicamento.create(med);
        }
      })
    );

    enfermedad.medicamentos = medicamentosActualizados.map(med => med._id);
    await enfermedad.save();
    
    res.json(enfermedad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.obtenerEnfermedad = async (req, res) => {
  try {
    const enfermedad = await Enfermedad.findById(req.params.id).populate('medicamentos');
    if (!enfermedad) {
      return res.status(404).json({ message: 'Enfermedad no encontrada' });
    }
    res.json(enfermedad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.obtenerTodasEnfermedades = async (req, res) => {
  try {
    const enfermedades = await Enfermedad.find().populate('medicamentos');
    res.json(enfermedades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enfermedades', error });
  }
  };


  exports.procesarExcel = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ningún archivo' });
      }
  
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
  
      const resultados = await Promise.all(data.map(async (row) => {
        try {
          // Validar los datos de la enfermedad
          const { error: enfermedadError } = enfermedadSchema.validate({
            nombre: row.nombre,
            descripcion: row.descripcion,
            medicamentos: [{
              nombre: row.medicamentoNombre,
              codigo: row.medicamentoCodigo,
              descripcion: row.medicamentoDescripcion,
              fechaVencimiento: row.medicamentoFechaVencimiento
            }]
          });
  
          if (enfermedadError) {
            return { error: `Fila inválida: ${enfermedadError.details[0].message}` };
          }
  
          // Crear o actualizar el medicamento
          const medicamento = await Medicamento.findOneAndUpdate(
            { codigo: row.medicamentoCodigo },
            {
              nombre: row.medicamentoNombre,
              descripcion: row.medicamentoDescripcion,
              fechaVencimiento: row.medicamentoFechaVencimiento
            },
            { upsert: true, new: true }
          );
  
          // Crear o actualizar la enfermedad
          const enfermedad = await Enfermedad.findOneAndUpdate(
            { nombre: row.nombre },
            {
              $set: { descripcion: row.descripcion },
              $addToSet: { medicamentos: medicamento._id }
            },
            { upsert: true, new: true }
          );
  
          return { success: `Enfermedad ${enfermedad.nombre} procesada con éxito` };
        } catch (error) {
          return { error: `Error procesando fila: ${error.message}` };
        }
      }));
  
      res.json({
        message: 'Archivo Excel procesado',
        resultados
      });
    } catch (error) {
      res.status(500).json({ message: 'Error procesando el archivo Excel', error: error.message });
    }
  };


  exports.procesarExcel = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ningún archivo' });
      }
  
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
  
      const resultados = await Promise.all(data.map(async (row) => {
        try {
          // Validar los datos de la enfermedad
          const { error: enfermedadError } = enfermedadSchema.validate({
            nombre: row.nombre,
            descripcion: row.descripcion,
            medicamentos: [{
              nombre: row.medicamentoNombre,
              codigo: row.medicamentoCodigo,
              descripcion: row.medicamentoDescripcion,
              fechaVencimiento: row.medicamentoFechaVencimiento
            }]
          });
  
          if (enfermedadError) {
            return { error: `Fila inválida: ${enfermedadError.details[0].message}` };
          }
  
          // Crear o actualizar el medicamento
          const medicamento = await Medicamento.findOneAndUpdate(
            { codigo: row.medicamentoCodigo },
            {
              nombre: row.medicamentoNombre,
              descripcion: row.medicamentoDescripcion,
              fechaVencimiento: row.medicamentoFechaVencimiento
            },
            { upsert: true, new: true }
          );
  
          // Crear o actualizar la enfermedad
          const enfermedad = await Enfermedad.findOneAndUpdate(
            { nombre: row.nombre },
            {
              $set: { descripcion: row.descripcion },
              $addToSet: { medicamentos: medicamento._id }
            },
            { upsert: true, new: true }
          );
  
          return { success: `Enfermedad ${enfermedad.nombre} procesada con éxito` };
        } catch (error) {
          return { error: `Error procesando fila: ${error.message}` };
        }
      }));
  
      res.json({
        message: 'Archivo Excel procesado',
        resultados
      });
    } catch (error) {
      res.status(500).json({ message: 'Error procesando el archivo Excel', error: error.message });
    }
  };