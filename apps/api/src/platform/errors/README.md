# Platform Errors

This directory contains the API's shared HTTP error primitives.

- `BusinessException` and its subclasses return a stable `{ message, code, statusCode }` response.
- `AllExceptionsFilter` converts thrown values into JSON containing the status, timestamp, request path and method, message, and optional validation errors.

Register `AllExceptionsFilter` globally or on selected controllers. In non-production environments it also writes the original exception to `console.error`.
