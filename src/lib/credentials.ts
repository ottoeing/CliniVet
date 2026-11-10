import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido, com @ e domínio."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
