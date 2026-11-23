const { z } = require('zod');

const idSchema = z.object({
  id: z.string().uuid('El identificador debe ser un UUID válido'),
});

module.exports = { idSchema };
