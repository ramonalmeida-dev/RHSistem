#!/usr/bin/env node

/**
 * 🚀 Script de Pré-Build - Lotus Recruit Hub
 * Verifica se tudo está pronto para o build de produção
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, '✅', message);
}

function error(message) {
  log(colors.red, '❌', message);
}

function warning(message) {
  log(colors.yellow, '⚠️', message);
}

function info(message) {
  log(colors.blue, 'ℹ️', message);
}

async function checkEnvironmentVariables() {
  info('Verificando variáveis de ambiente...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`${varName} configurada`);
    } else {
      error(`${varName} não encontrada`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    error('Variáveis de ambiente obrigatórias não encontradas!');
    info('Consulte ENV_VARIABLES.md para configuração');
    return false;
  }

  return true;
}

function checkPackageJson() {
  info('Verificando package.json...');
  
  try {
    const packagePath = resolve('package.json');
    const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    // Verificar scripts obrigatórios
    const requiredScripts = ['build', 'dev', 'preview'];
    for (const script of requiredScripts) {
      if (packageContent.scripts[script]) {
        success(`Script '${script}' encontrado`);
      } else {
        error(`Script '${script}' não encontrado`);
        return false;
      }
    }

    // Verificar dependências críticas
    const criticalDeps = ['react', 'react-dom', 'vite'];
    for (const dep of criticalDeps) {
      if (packageContent.dependencies[dep] || packageContent.devDependencies[dep]) {
        success(`Dependência '${dep}' encontrada`);
      } else {
        error(`Dependência crítica '${dep}' não encontrada`);
        return false;
      }
    }

    return true;
  } catch (err) {
    error('Erro ao ler package.json: ' + err.message);
    return false;
  }
}

function checkConfigFiles() {
  info('Verificando arquivos de configuração...');
  
  const requiredFiles = [
    'vite.config.ts',
    'tsconfig.json',
    'vercel.json',
    'index.html'
  ];

  let allPresent = true;

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      error(`${file} não encontrado`);
      allPresent = false;
    }
  }

  return allPresent;
}

function checkSourceFiles() {
  info('Verificando arquivos fonte...');
  
  const requiredSrcFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/lib/supabase.ts'
  ];

  let allPresent = true;

  for (const file of requiredSrcFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      error(`${file} não encontrado`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function main() {
  console.log('🚀 Verificação Pré-Build - Lotus Recruit Hub\n');

  const checks = [
    { name: 'Variáveis de Ambiente', fn: checkEnvironmentVariables },
    { name: 'Package.json', fn: checkPackageJson },
    { name: 'Arquivos de Configuração', fn: checkConfigFiles },
    { name: 'Arquivos Fonte', fn: checkSourceFiles }
  ];

  let allPassed = true;

  for (const check of checks) {
    console.log(`\n📋 ${check.name}:`);
    const result = await check.fn();
    if (!result) {
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    success('Todas as verificações passaram! ✨');
    success('Projeto pronto para build de produção! 🚀');
    process.exit(0);
  } else {
    error('Algumas verificações falharam! 🚨');
    error('Corrija os problemas antes do build.');
    process.exit(1);
  }
}

main().catch(console.error); 