import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido, com @ e domínio.")
    .refine((email) => !email.slice(0, email.indexOf("@")).endsWith("-"), {
      message: "O e-mail não pode ter um hífen antes do @.",
    }),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
