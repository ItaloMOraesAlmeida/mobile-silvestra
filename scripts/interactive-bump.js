const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");
const chalk = require("chalk");
const semver = require("semver");

// Caminhos dos arquivos
const packagePath = path.resolve(__dirname, "../package.json");
const appPath = path.resolve(__dirname, "../app.json");

// Ler arquivos atuais
const pkg = require(packagePath);
const app = require(appPath);

// --- TRATAMENTO DE INTERRUPÇÃO (CTRL+C) ---
// Definido logo no início para garantir captura
process.on("SIGINT", () => {
  // Usamos console.error para garantir que a saída não seja engolida por buffers de pipe
  // e adicionamos quebras de linha extras para separar da UI do inquirer
  process.stderr.write("\n\n");
  console.error(chalk.bgYellow.black(" ⚠️  INTERRUPÇÃO DETECTADA (Ctrl+C) "));
  console.error(chalk.yellow("   Você cancelou a atualização de versão."));
  console.error(
    chalk.green(
      `   ✅ O commit SERÁ REALIZADO normally mantendo a versão: ${chalk.bold(
        pkg.version
      )}`
    )
  );
  console.error(
    chalk.dim("---------------------------------------------------\n")
  );

  // Sai com código 0: Sucesso para o Git continuar
  process.exit(0);
});

// Função genérica para pegar versão remota de uma branch específica
const getRemoteVersion = (branchName) => {
  try {
    execSync(`git fetch origin ${branchName} --quiet`, { stdio: "ignore" });
    const remotePackage = execSync(
      `git show origin/${branchName}:package.json`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    return JSON.parse(remotePackage).version;
  } catch (e) {
    return null;
  }
};

// Função principal
const run = async () => {
  try {
    console.clear();
    console.log(
      chalk.bold.blue("\n🚀 Preparando para o Commit no Silvestra App\n")
    );

    const currentVersion = pkg.version;

    const developVersion =
      getRemoteVersion("development") || chalk.gray("Não encontrada");
    const homologVersion =
      getRemoteVersion("homolog") || chalk.gray("Não encontrada");

    console.log(
      chalk.white(`📦 Versão Local Atual:   `) +
        chalk.bold.yellow(currentVersion)
    );
    console.log(
      chalk.white(`🛠️  Versão em Develop:    `) +
        chalk.bold.cyan(developVersion)
    );
    console.log(
      chalk.white(`🚀 Versão em Homolog:    `) +
        chalk.bold.magenta(homologVersion)
    );
    console.log(
      chalk.dim("---------------------------------------------------")
    );

    // Pergunta 1: Deseja alterar a versão?
    const { shouldUpdate } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldUpdate",
        message: "Deseja atualizar a versão do app para este commit?",
        default: false,
      },
    ]);

    if (!shouldUpdate) {
      console.log(
        chalk.yellow("\n⏩Continuando commit sem alterar versão...\n")
      );
      process.exit(0);
    }

    // Opções de Bump
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");

    // Definir padrão para custom version
    const defaultCustomVersion =
      developVersion && semver.valid(developVersion)
        ? developVersion
        : currentVersion;

    // Pergunta 2: Qual tipo de versão?
    const { bumpType } = await inquirer.prompt([
      {
        type: "list",
        name: "bumpType",
        message: "Selecione o tipo de atualização:",
        choices: [
          {
            name: `🐛 Patch (${currentVersion} ➔ ${chalk.green(patch)})`,
            value: "patch",
          },
          {
            name: `✨ Minor (${currentVersion} ➔ ${chalk.green(minor)})`,
            value: "minor",
          },
          {
            name: `💥 Major (${currentVersion} ➔ ${chalk.green(major)})`,
            value: "major",
          },
          { name: `✍️  Custom (Digitar manualmente)`, value: "custom" },
        ],
      },
    ]);

    let newVersion;

    if (bumpType === "custom") {
      const { customVersion } = await inquirer.prompt([
        {
          type: "input",
          name: "customVersion",
          message: "Digite a nova versão (ex: 1.2.3):",
          validate: (input) => {
            if (semver.valid(input)) return true;
            return "❌ Formato inválido. Use o formato x.x.x (ex: 1.0.5)";
          },
          default: defaultCustomVersion,
        },
      ]);
      newVersion = customVersion;
    } else {
      newVersion = semver.inc(currentVersion, bumpType);
    }

    console.log(
      chalk.dim("\n---------------------------------------------------")
    );
    console.log(chalk.bold.white("🔍 Resumo das Alterações:"));
    console.log(`   De:   ${chalk.red(currentVersion)}`);
    console.log(`   Para: ${chalk.green(newVersion)}`);
    console.log(
      chalk.dim("---------------------------------------------------")
    );

    // Pergunta 3: Confirmação final
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Confirma a atualização e aplicação nos arquivos?",
        default: true,
      },
    ]);

    if (!confirm) {
      const { retry } = await inquirer.prompt([
        {
          type: "confirm",
          name: "retry",
          message: "Deseja tentar digitar a versão novamente?",
          default: false,
        },
      ]);

      if (retry) {
        const { retryVersion } = await inquirer.prompt([
          {
            type: "input",
            name: "retryVersion",
            message: "Digite a nova versão:",
            validate: (input) => {
              if (semver.valid(input)) return true;
              return "❌ Formato inválido. Use o formato x.x.x";
            },
            default: currentVersion,
          },
        ]);
        newVersion = retryVersion;
      } else {
        console.log(
          chalk.red(
            "\n❌ Atualização de versão cancelada. O commit continuará com a versão antiga.\n"
          )
        );
        process.exit(0);
      }
    }

    // Atualizar Arquivos
    updateFiles(newVersion);
  } catch (error) {
    // Se o erro for "Force closed" (comum no inquirer ao dar Ctrl+C), o handler SIGINT deve pegar,
    // mas por garantia tratamos aqui também se a promise rejeitar antes do sinal.
    if (error.message && error.message.includes("force closed")) {
      // Já tratado pelo SIGINT, mas caso escape:
      process.kill(process.pid, "SIGINT");
    } else if (error.isTtyError) {
      console.error(chalk.red("Erro: Terminal não suporta interatividade."));
    } else {
      // Erros reais
      console.error(error);
      process.exit(1);
    }
  }
};

const updateFiles = (version) => {
  console.log(chalk.blue("\n💾 Atualizando arquivos..."));

  // 1. Package.json
  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(chalk.green("   ✅ package.json atualizado."));

  // 2. App.json
  const parsed = semver.parse(version);
  const versionCode =
    parsed.major * 1000000 + parsed.minor * 1000 + parsed.patch;

  app.expo.version = version;

  if (!app.expo.android) app.expo.android = {};
  app.expo.android.versionCode = versionCode;

  if (!app.expo.ios) app.expo.ios = {};
  app.expo.ios.buildNumber = version;

  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + "\n");
  console.log(
    chalk.green(
      `   ✅ app.json atualizado (Android Code: ${versionCode}, iOS Build: ${version}).`
    )
  );

  // 3. Git Add
  try {
    execSync(`git add package.json app.json`);
    console.log(chalk.green("   ✅ Arquivos adicionados ao stage do git."));
    console.log(
      chalk.bold.magenta(
        "\n✨ Versão atualizada com sucesso! Prosseguindo com o commit...\n"
      )
    );
  } catch (error) {
    console.error(chalk.red("❌ Erro ao adicionar arquivos ao git."));
    process.exit(1);
  }
};

run();
