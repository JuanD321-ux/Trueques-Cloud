const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const nombreUnico = Date.now() + path.extname(file.originalname);
        cb(null, nombreUnico);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/jpg'];

    if (tipos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;