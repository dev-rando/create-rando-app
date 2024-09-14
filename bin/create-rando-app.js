#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const API_URL = 'https://dev-rando.vercel.app/api/trpc/challenge.getCurrentChallenge';

async function fetchCurrentChallenge() {
  const spinner = ora({
    text: chalk.greenBright.bold('Fetching challenge...'),
    color: 'cyan',
    spinner: 'dots'
  }).start();
  try {
    const response = await axios.get(API_URL);
    spinner.succeed(chalk.greenBright.bold('Challenge fetched successfully'));
    return response.data.result.data.json;
  } catch (error) {
    spinner.fail(chalk.redBright.bold('Failed to fetch challenge'));
    console.error(chalk.red('Error:', error.message));
    process.exit(1);
  }
}

async function createProject(projectName, challenge) {
  const spinner = ora({
    text: 'Creating project directory',
    color: 'cyan',
    spinner: 'dots'
  }).start();
  try {
    await fs.promises.mkdir(projectName);
  } catch (error) {
    if (error.code === 'EEXIST') {
      spinner.fail(chalk.red.bold(`Project directory '${projectName}' already exists`));
      console.log(chalk.yellow.bold('Installation cancelled.'));
      process.exit(0);
    } else {
      spinner.fail(chalk.red.bold('Failed to create project directory'));
      console.error(chalk.red('Error:', error.message));
      throw error;
    }
  }

  process.chdir(projectName);
  spinner.succeed(chalk.greenBright.bold(`Project directory '${projectName}' created`));

  spinner.start('Creating package.json');
  await fs.promises.writeFile('package.json', JSON.stringify(challenge, null, 2));
  spinner.succeed(chalk.greenBright.bold('package.json created'));

  spinner.start('Creating devrando.config.json');
  const devrandoConfig = {
    challengeHash: challenge.devrandoMetadata.challengeHash,
    generatedAt: challenge.devrandoMetadata.generatedAt,
    totalDependencies: challenge.devrandoMetadata.totalDependencies
  };
  await fs.promises.writeFile('devrando.config.json', JSON.stringify(devrandoConfig, null, 2));
  spinner.succeed(chalk.greenBright.bold('devrando.config.json created'));
}

async function initGitRepo() {
  const spinner = ora({
    text: 'Initializing git repository',
    color: 'green',
    spinner: 'dots'
  }).start();
  try {
    fs.writeFileSync('.gitignore', 'node_modules\n');
    execSync('git init -b main');
    execSync('git add .gitignore');
    execSync('git commit -m "Initial commit: Add .gitignore"');
    spinner.succeed(chalk.greenBright.bold('Git repository initialized'));
  } catch (error) {
    spinner.fail(chalk.red.bold('Failed to initialize git repository'));
    throw new Error(`Git initialization failed: ${error.message}`);
  }
}

async function installDependencies(challenge) {
  const numDependencies = Object.keys(challenge.devDependencies).length + Object.keys(challenge.dependencies).length;
  const spinner = ora({
    text: chalk.greenBright.bold(`Installing ${numDependencies} dependencies, this will take a moment...`),
    color: 'green',
    spinner: 'grenade'
  }).start();

  return new Promise((resolve, reject) => {
    const npmInstall = spawn('npm', ['install', '--force'], {
      stdio: ['ignore', 'ignore', 'pipe'] // Ignore stdout, pipe only stderr
    });

    npmInstall.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(chalk.greenBright.bold('Dependencies installed successfully'));
        resolve();
      } else {
        spinner.fail(chalk.redBright.bold('Failed to install dependencies'));
        reject(new Error(`npm install exited with code ${code}`));
      }
    });

    // Handle SIGINT during npm install
    const handleSIGINT = () => {
      npmInstall.kill('SIGINT');
      spinner.fail(chalk.redBright.bold('Installation interrupted'));
      reject(new Error('Installation interrupted'));
    };

    process.on('SIGINT', handleSIGINT);

    npmInstall.on('close', () => {
      process.removeListener('SIGINT', handleSIGINT);
    });
  });
}

async function main() {
  const interpolateColor = (color1, color2, factor) => {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
      result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
  };

  const rainbowGradient = (numColors) => {
    const rainbow = [
      [255, 0, 0],    // Red
      [255, 127, 0],  // Orange
      [255, 255, 0],  // Yellow
      [0, 255, 0],    // Green
      [0, 0, 255],    // Blue
      [75, 0, 130],   // Indigo
      [143, 0, 255],  // Violet
    ];
    const gradientColors = [];
    for (let i = 0; i < numColors; i++) {
      const rainbowIndex = (i / numColors) * (rainbow.length - 1);
      const start = Math.floor(rainbowIndex);
      const end = Math.ceil(rainbowIndex);
      const factor = rainbowIndex - start;
      gradientColors.push(interpolateColor(rainbow[start], rainbow[end], factor));
    }
    return gradientColors;
  };

  const asciiArt = `
    ____                _         ____                _         _              
   / ___|_ __ ___  __ _| |_ ___  |  _ \\ __ _ _ __   __| | ___   / \\   _ __  _ __
  | |   | '__/ _ \\/ _\` | __/ _ \\ | |_) / _\` | '_ \\ / _\` |/ _ \\ / _ \\ | '_ \\| '_ \\
  | |___| | |  __/ (_| | ||  __/ |  _ < (_| | | | | (_| | (_) / ___ \\| |_) | |_) |
   \\____|_|  \\___|\\__,_|\\__\\___| |_| \\_\\__,_|_| |_|\\__,_|\\___/_/   \\_\\ .__/| .__/
                                                                      |_|   |_|   
  `;

  const chars = asciiArt.split('');
  const colors = rainbowGradient(chars.length);
  
  const rainbowArt = chars.map((char, index) => {
    if (char !== ' ' && char !== '\n') {
      const [r, g, b] = colors[index];
      return chalk.rgb(r, g, b)(char);
    }
    return char;
  }).join('');

  console.log(rainbowArt);
  console.log(chalk.yellow.bold('🎲 Welcome to Dev Rando! 🎲\n'));

  const promptProjectName = async () => {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: chalk.magentaBright('What is the name of your project?'),
        default: 'my-rando-app',
      }
    ]);

    return projectName;
  };

  try {
    const projectName = await promptProjectName();

    const { initGit, installDeps } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'initGit',
        message: chalk.magentaBright('Initialize a new git repository?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: chalk.magentaBright('Install packages now?'),
        default: true
      }
    ]);

    answers = { projectName, initGit, installDeps };

    const challenge = await fetchCurrentChallenge();
    await createProject(answers.projectName, challenge);

    if (answers.initGit) {
      try {
        await initGitRepo();
      } catch (gitError) {
        console.error(chalk.red.bold(gitError.message));
        console.log(chalk.yellow.bold('Continuing without git initialization...'));
      }
    }

    console.log(chalk.greenBright.bold('⏳ Project setup in progress... ⏳'));
    if (answers.installDeps) {
      await installDependencies(challenge);
      console.log(chalk.greenBright.bold('\n✨ Project setup completed successfully! ✨'));
      console.log(chalk.greenBright.bold('\n Your Dev Rando challenge app is ready! \n'));
      console.log(chalk.greenBright.bold('Next steps:'));
      console.log(chalk.greenBright.bold(`1. cd ${answers.projectName}`));
      console.log(chalk.greenBright.bold(`2. Examine the dependencies and start building with them`));
      console.log(chalk.greenBright.bold(`3. Have fun!`));
      console.log(chalk.redBright.bold(`4. (Optional) Survive.`));
    } else {
      console.log(chalk.yellow.bold('\nDependencies not installed. You can install dependencies manually later.'));
      console.log(chalk.greenBright.bold('\n✨ Project setup completed successfully! ✨'));
      console.log(chalk.greenBright.bold('\nNext steps:'));
      console.log(chalk.greenBright.bold(`1. cd ${answers.projectName}`));
      console.log(chalk.greenBright.bold("2. Run 'npm install --force' to install dependencies"));
      console.log(chalk.greenBright.bold("** Note: you -must- use the '--force' flag for the rando to properly install! **"));
      console.log(chalk.greenBright.bold(`3. Examine the dependencies and start building with them`));
      console.log(chalk.greenBright.bold(`4. Have fun!`));
      console.log(chalk.redBright.bold(`5. (Optional) Survive.`));
    }
  } catch (error) {
    console.error(chalk.red.bold('\n An error occurred during the installation process: \n'));
    console.error(chalk.red.bold(error.message));
    
    await cleanup(answers);
    process.exit(1);
  }
}

async function cleanup(answers) {
  if (answers && answers.projectName) {
    console.log(chalk.yellow.bold('\nCleaning up...'));
    try {
      process.chdir('..');
      if (fs.promises.rm) {
        // Node.js 14.14.0 and later
        await fs.promises.rm(answers.projectName, { recursive: true, force: true });
      } else {
        // Earlier versions of Node.js
        await recursiveRemove(answers.projectName);
      }
      console.log(chalk.cyan.bold(`Project folder '${answers.projectName}' has been removed.`));
      console.log(chalk.green.bold(`Cleanup complete!`));
    } catch (cleanupError) {
      console.error(chalk.red.bold(`Failed to remove project folder: ${cleanupError.message}`));
      console.log(chalk.yellow.bold(`Please manually remove the '${answers.projectName}' folder.`));
    }
  }
}

async function recursiveRemove(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await recursiveRemove(fullPath);
    } else {
      await fs.promises.unlink(fullPath);
    }
  }));
  await fs.promises.rmdir(dir);
}

main().catch(console.error);