import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testsDirectory = join(projectRoot, "tests");
const tempRoot = await mkdtemp(join(testsDirectory, ".mutation-"));
const tsxCli = join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
const files = ["src/lib/credentials.ts", "src/lib/appointments.ts", "tests/validation.test.ts"];
const mutants = [
  { name: "e-mail sem formato válido", file: files[0], from: '.email("Informe um e-mail válido, com @ e domínio.")', to: "" },
  { name: "senha de um caractere", file: files[0], from: "password: z.string().min(6,", to: "password: z.string().min(1," },
  { name: "hífen antes do arroba", file: files[0], from: '!email.slice(0, email.indexOf("@")).endsWith("-")', to: "true" },
  { name: "campo obrigatório vazio", file: files[1], from: "z.string().trim().min(1,", to: "z.string().trim().min(0," },
  { name: "data inválida aceita", file: files[1], from: "Number.isNaN(scheduledAt.getTime())", to: "false" },
  { name: "data passada aceita", file: files[1], from: "scheduledAt.getTime() <= Date.now()", to: "scheduledAt.getTime() >= Date.now()" },
  { name: "status desconhecido aceito", file: files[1], from: "z.enum(APPOINTMENT_STATUSES)", to: "z.string()" },
];

function runTests() {
  return spawnSync(process.execPath, [tsxCli, "--test", "--test-reporter=tap", join(tempRoot, files[2])], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 30_000,
  });
}

try {
  for (const file of files) {
    const destination = join(tempRoot, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(join(projectRoot, file)));
  }

  const baseline = runTests();
  if (baseline.status !== 0) throw new Error(`Testes originais falharam:\n${baseline.stdout}\n${baseline.stderr}`);

  let killed = 0;
  for (const mutant of mutants) {
    const source = await readFile(join(projectRoot, mutant.file), "utf8");
    if (!source.includes(mutant.from)) throw new Error(`Trecho do mutante não encontrado: ${mutant.name}`);
    await writeFile(join(tempRoot, mutant.file), source.replace(mutant.from, mutant.to));
    const result = runTests();
    await writeFile(join(tempRoot, mutant.file), source);
    const detected = result.status !== 0 && result.stdout.includes("not ok ") && !result.error;
    if (detected) killed++;
    console.log(`${detected ? "DETECTADO" : "SOBREVIVEU"}: ${mutant.name}`);
    if (result.error) throw result.error;
  }

  console.log(`Mutantes detectados: ${killed}/${mutants.length}`);
  if (killed !== mutants.length) process.exitCode = 1;
} finally {
  if (dirname(tempRoot) !== testsDirectory || !basename(tempRoot).startsWith(".mutation-")) {
    throw new Error("Diretório temporário inesperado; limpeza interrompida.");
  }
  await rm(tempRoot, { recursive: true, force: true });
}
