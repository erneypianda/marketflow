import { AppError } from "./app-error.js";

export function registerErrorHandlers(app) {
  app.setNotFoundHandler(async function notFound(_request, reply) {
    return reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "No existe esa ruta.",
      },
    });
  });

  app.setErrorHandler(async function handleError(error, request, reply) {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    const statusCode =
      error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    if (statusCode >= 500) {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Ha ocurrido un error interno.",
        },
      });
    }

    return reply.status(statusCode).send({
      error: {
        code: "REQUEST_ERROR",
        message: "La petición no se pudo completar.",
      },
    });
  });
}
