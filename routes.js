const express = require('express');
const router = express.Router();
const domicilioController = require('./controller/Domicilio_controller');
const albergueController = require('./controller/Albergue_controller');
const sitioSeguroController = require('./controller/Sitio_seguro_controller');
const personaController = require('./controller/Persona_controller');

// Rutas para CRUD de Domicilio
router.get('/domicilios', domicilioController.getDomicilios);
router.post('/domicilios', domicilioController.createDomicilio);
router.put('/domicilios/:id', domicilioController.updateDomicilio); // Ruta para editar un domicilio
router.delete('/domicilios/:id', domicilioController.deleteDomicilio); // Ruta para eliminar un domicilio

// Rutas para CRUD de Albergue
router.get('/albergues', albergueController.getAlbergues);
router.post('/albergues', albergueController.createAlbergue);
router.put('/albergues/:id', albergueController.updateAlbergue); // Ruta para editar un albergue
router.delete('/albergues/:id', albergueController.deleteAlbergue); // Ruta para eliminar un albergue

// Rutas para CRUD de Sitios Seguros
router.get('/sitiosSeguros', sitioSeguroController.getSitiosSeguros);
router.post('/sitiosSeguros', sitioSeguroController.createSitioSeguro);
router.put('/sitiosSeguros/:id', sitioSeguroController.updateSitioSeguro); // Ruta para editar un sitio seguro
router.delete('/sitiosSeguros/:id', sitioSeguroController.deleteSitioSeguro); // Ruta para eliminar un sitio seguro

// Rutas para CRUD de Personas
router.get('/personas', personaController.getPersonas);
router.post('/personas', personaController.createPersona);
router.put('/personas/:id', personaController.updatePersona); // Ruta para editar una persona
router.delete('/personas/:id', personaController.deletePersona); // Ruta para eliminar una persona

//Ruta para login en la App
router.post('/login', personaController.login);

module.exports = router;
