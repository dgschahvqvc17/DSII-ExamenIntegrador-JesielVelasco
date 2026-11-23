const { z } = require('zod');

const listarEquiposSchema = z.object({
  q: z.string().trim().max(120).optional(),
});

module.exports = { listarEquiposSchema };
