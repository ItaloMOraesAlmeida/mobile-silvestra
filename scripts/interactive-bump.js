const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");
const chalk = require("chalk");
const semver = require("semver");
const readline = require("readline");

// Caminhos dos arquivos
const packagePath = path.resolve(__dirname, "../package.json");
const appPath = path.resolve(__dirname, "../app.json");

// Ler arquivos atuais
const pkg = require(packagePath);
const app = require(appPath);

// --- TRATAMENTO DE INTERRUPÇÃO (CTRL+C) ---
const handleInterruption = () => {
  // Restaura o terminal se estiver em modo raw
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();

  process.stderr.write("\n\n");
  console.error(chalk.bgYellow.black(" ⚠️  INTERRUPÇÃO DETECTADA (Ctrl+C) "));
  console.error(chalk.yellow("   Você cancelou a atualização de versão."));
  console.error(
    chalk.green(
      `   ✅ O commit SERÁ REALIZADO normalmente mantendo a versão: ${chalk.bold(
        pkg.version
      )}`
    )
  );
  console.error(
    chalk.dim("---------------------------------------------------\n")
  );
  process.exit(0);
};

process.on("SIGINT", handleInterruption);

// --- FUNÇÕES AUXILIARES GIT ---

const getRemoteVersion = (branchName) => {
  try {
    // Remove 'origin/' se já vier com ele para evitar duplicação no fetch
    const cleanBranch = branchName.replace("origin/", "");
    execSync(`git fetch origin ${cleanBranch} --quiet`, { stdio: "ignore" });
    const remotePackage = execSync(
      `git show origin/${cleanBranch}:package.json`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    return JSON.parse(remotePackage).version;
  } catch (e) {
    return null;
  }
};

const getRecentBranches = () => {
  try {
    // 1. Atualiza referências (SEM prune, para segurança total das suas branches locais)
    execSync("git fetch --all --quiet", { stdio: "ignore" });

    // 2. Busca a lista da verdade diretamente do GitHub (o que realmente existe lá)
    // Formato saída: "HASH refs/heads/nome-da-branch"
    const lsRemoteOutput = execSync("git ls-remote --heads origin", {
      encoding: "utf8",
    });

    // Cria um conjunto (Set) de branches válidas no formato 'origin/nome-da-branch'
    const validRemoteBranches = new Set(
      lsRemoteOutput
        .split("\n")
        .map((line) => {
          const parts = line.split(/\s+/); // Divide por espaços/tabs
          if (parts.length < 2) return null;
          // Converte 'refs/heads/minha-branch' para 'origin/minha-branch'
          return parts[1].replace("refs/heads/", "origin/");
        })
        .filter(Boolean)
    );

    // 3. Busca branches locais ordenadas por data (cache local)
    const sortedOutput = execSync(
      'git branch -r --sort=-committerdate --format="%(refname:short)"',
      { encoding: "utf8" }
    );
    const sortedLocalCache = sortedOutput
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b && !b.includes("HEAD"));

    // 4. Filtra: Mantém a ordenação de data, mas EXCLUI as que não estão na lista do 'ls-remote'
    // Assim, branches deletadas no GitHub não aparecem, mas nada é apagado na sua máquina.
    return sortedLocalCache.filter((branch) => validRemoteBranches.has(branch));
  } catch (e) {
    // Em caso de erro (ex: sem internet), retorna o cache local puro como fallback
    try {
      const output = execSync(
        'git branch -r --sort=-committerdate --format="%(refname:short)"',
        { encoding: "utf8" }
      );
      return output
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b && !b.includes("HEAD"));
    } catch (err) {
      return [];
    }
  }
};

// --- LÓGICA DE INTERAÇÃO (TAB) ---

const showInitialDashboard = async () => {
  console.clear();
  console.log(
    chalk.bold.blue("\n🚀 Preparando para o Commit no Silvestra App\n")
  );

  const currentVersion = pkg.version;

  // Branches Fixas
  const developVersion =
    getRemoteVersion("development") || chalk.gray("Não encontrada");
  const homologVersion =
    getRemoteVersion("homolog") || chalk.gray("Não encontrada");
  const mainVersion = getRemoteVersion("main") || chalk.gray("Não encontrada");

  console.log(
    chalk.white(`📦 Versão Local Atual:     `) +
      chalk.bold.yellow(currentVersion)
  );
  console.log(chalk.dim("---------------------"));
  console.log(
    chalk.white(`🏆 Versão em Main:         `) + chalk.bold.green(mainVersion)
  );
  console.log(
    chalk.white(`🚀 Versão em Homolog:      `) +
      chalk.bold.magenta(homologVersion)
  );
  console.log(
    chalk.white(`🛠️  Versão em Development:  `) +
      chalk.bold.cyan(developVersion)
  );
  console.log(chalk.dim("--------------------------------------------------"));

  // Estado para controle de paginação das branches extras
  const allBranches = getRecentBranches();
  // Ignora branches já mostradas
  const ignoreList = [
    "origin/development",
    "origin/develop",
    "origin/homolog",
    "origin/main",
    "origin/master",
  ];
  let availableBranches = allBranches.filter((b) => !ignoreList.includes(b));
  let currentIndex = 0;

  console.log(
    chalk.dim(
      "Pressione [TAB] para ver versões de outras branches ou [ENTER] para continuar..."
    )
  );

  // Promessa para aguardar o ENTER ou TAB
  await new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const onKeypress = (str, key) => {
      if (key.ctrl && key.name === "c") {
        handleInterruption();
      } else if (key.name === "return" || key.name === "enter") {
        // Limpa listeners e segue
        process.stdin.removeListener("keypress", onKeypress);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        resolve();
      } else if (key.name === "tab") {
        // Lógica de mostrar mais branches
        if (currentIndex >= availableBranches.length) {
          console.log(
            chalk.italic.gray(
              "\n   (Não há mais branches recentes para exibir)"
            )
          );
        } else {
          console.log(chalk.bold.white("\n   Outras Branches Recentes:"));
          const nextBatch = availableBranches.slice(
            currentIndex,
            currentIndex + 5
          );

          if (nextBatch.length === 0) {
            console.log(
              chalk.italic.gray("   (Nenhuma branch extra encontrada)")
            );
          }

          nextBatch.forEach((branch) => {
            process.stdout.write(`   ⏳ Buscando ${branch}... `);
            const v = getRemoteVersion(branch);
            // Limpa a linha atual
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            if (v) {
              console.log(`   🌿 ${branch.padEnd(30)} : ${chalk.green(v)}`);
            } else {
              console.log(
                `   🌿 ${branch.padEnd(30)} : ${chalk.gray("Sem package.json")}`
              );
            }
          });
          currentIndex += 5;
        }
      }
    };

    process.stdin.on("keypress", onKeypress);
  });

  return { developVersion, homologVersion }; // Retorna contexto útil
};

// --- FLUXO PRINCIPAL ---

const run = async () => {
  try {
    // 1. Dashboard interativo
    const context = await showInitialDashboard();

    console.log(
      chalk.dim("\n---------------------------------------------------")
    );

    // 2. Perguntas Inquirer
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

    const currentVersion = pkg.version;
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");

    const defaultCustomVersion =
      context.developVersion && semver.valid(context.developVersion)
        ? context.developVersion
        : currentVersion;

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

    updateFiles(newVersion);
  } catch (error) {
    if (error.message && error.message.includes("force closed")) {
      // Ignore, tratado pelo SIGINT
    } else if (error.isTtyError) {
      console.error(chalk.red("Erro: Terminal não suporta interatividade."));
    } else {
      console.error(error);
      process.exit(1);
    }
  }
};

const updateFiles = (version) => {
  console.log(chalk.blue("\n💾 Atualizando arquivos..."));

  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(chalk.green("   ✅ package.json atualizado."));

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
