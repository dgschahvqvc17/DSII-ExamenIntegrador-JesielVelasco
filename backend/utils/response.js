const enviar = (res, status, payload) => res.status(status).json(payload);

const exito = (res, data, message, status = 200) =>
  enviar(res, status, {
    success: true,
    ...(message ? { message } : {}),
    data,
  });

const creado = (res, data, message = 'Registro creado correctamente') =>
  exito(res, data, message, 201);

module.exports = { exito, creado };
