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
// Captura o sinal SIGINT para evitar o erro feio do Husky e permitir continuar o commit
const handleInterruption = () => {
  console.log("\n"); // Pula linha para não ficar grudado no ^C
  console.log(chalk.bgYellow.black(" ⚠️  INTERRUPÇÃO DETECTADA (Ctrl+C) "));
  console.log(
    chalk.yellow(
      "   O processo de atualização de versão foi cancelado pelo usuário."
    )
  );
  console.log(
    chalk.green(
      `   ✅ O commit continuará normalmente utilizando a versão atual: ${chalk.bold(
        pkg.version
      )}`
    )
  );
  console.log(
    chalk.dim("---------------------------------------------------\n")
  );

  // Sai com código 0 para o Husky/Git entenderem que está tudo bem e prosseguirem com o commit
  process.exit(0);
};

process.on("SIGINT", handleInterruption);

// Função genérica para pegar versão remota de uma branch específica
const getRemoteVersion = (branchName) => {
  try {
    // Tenta buscar informações do remote sem baixar todo o histórico pesado
    // Usa 'origin' como remote padrão
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

    // Busca versões remotas
    const developVersion =
      getRemoteVersion("development") ||
      chalk.gray("Não encontrada/Acesso falhou");
    const homologVersion =
      getRemoteVersion("homolog") || chalk.gray("Não encontrada/Acesso falhou");

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
        chalk.yellow("\n⏩ Continuando commit sem alterar versão...\n")
      );
      process.exit(0);
    }

    // Opções de Bump
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");

    // Definir padrão para custom version (usa develop, se existir, senão local)
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
    // Captura erros forçados do Inquirer se o SIGINT não pegar a tempo
    if (error.isTtyError) {
      console.log(chalk.red("Erro: O terminal não suporta interatividade."));
    } else {
      // Se for outro erro, pode ser interrupção
      handleInterruption();
    }
  }
};

const updateFiles = (version) => {
  console.log(chalk.blue("\n💾 Atualizando arquivos..."));

  // 1. Package.json
  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(chalk.green("   ✅ package.json atualizado."));

  // 2. App.json (Com lógica de VersionCode Android)
  // Lógica: 1.2.3 -> 1002003 (Major * 1M + Minor * 1K + Patch)
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
