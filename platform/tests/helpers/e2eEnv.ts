/** G-20 E2E env — prefer MOVVO_*, fallback ATHENA_* during transition. */
export const E2E_EMAIL =
  process.env.MOVVO_E2E_EMAIL ||
  process.env.ATHENA_E2E_EMAIL ||
  'teste@athena.local';

export const E2E_PASSWORD =
  process.env.MOVVO_E2E_PASSWORD ||
  process.env.ATHENA_E2E_PASSWORD ||
  'teste123';

export const E2E_STUDENT_EMAIL =
  process.env.MOVVO_E2E_STUDENT_EMAIL ||
  process.env.ATHENA_E2E_STUDENT_EMAIL ||
  'renan.aluno@athena.local';

export const E2E_TRAINER_EMAIL =
  process.env.MOVVO_E2E_TRAINER_EMAIL ||
  process.env.ATHENA_E2E_TRAINER_EMAIL ||
  'bruna.professora@athena.local';
