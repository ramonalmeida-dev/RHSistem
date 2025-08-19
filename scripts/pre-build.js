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

// Verificar se estamos na Vercel
const isVercel = process.env.VERCEL === '1';

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
      if (isVercel) {
        error(`${varName} não encontrada na Vercel`);
        allPresent = false;
      } else {
        warning(`${varName} não encontrada (OK em desenvolvimento)`);
      }
    }
  }

  if (!allPresent && isVercel) {
    error('Variáveis de ambiente obrigatórias não encontradas na Vercel!');
    info('Configure as variáveis no dashboard da Vercel');
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
    const requiredScripts = ['build', 'dev'];
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
    'index.html'
  ];

  // Arquivos opcionais (apenas warning se não existirem)
  const optionalFiles = [
    'tsconfig.json',
    'vercel.json'
  ];

  let allCriticalPresent = true;

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      error(`${file} não encontrado`);
      allCriticalPresent = false;
    }
  }

  for (const file of optionalFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      warning(`${file} não encontrado (opcional)`);
    }
  }

  return allCriticalPresent;
}

function checkSourceFiles() {
  info('Verificando arquivos fonte...');
  
  const requiredSrcFiles = [
    'src/main.tsx',
    'src/App.tsx'
  ];

  // Arquivos opcionais mas importantes
  const optionalSrcFiles = [
    'src/index.css',
    'src/lib/supabase.ts'
  ];

  let allCriticalPresent = true;

  for (const file of requiredSrcFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      error(`${file} não encontrado`);
      allCriticalPresent = false;
    }
  }

  for (const file of optionalSrcFiles) {
    if (existsSync(file)) {
      success(`${file} encontrado`);
    } else {
      warning(`${file} não encontrado (importante mas não crítico)`);
    }
  }

  return allCriticalPresent;
}

async function main() {
  console.log('🚀 Verificação Pré-Build - Lotus Recruit Hub\n');
  
  if (isVercel) {
    info('Executando na Vercel - verificações otimizadas');
  }

  const checks = [
    { name: 'Variáveis de Ambiente', fn: checkEnvironmentVariables, critical: isVercel },
    { name: 'Package.json', fn: checkPackageJson, critical: true },
    { name: 'Arquivos de Configuração', fn: checkConfigFiles, critical: true },
    { name: 'Arquivos Fonte', fn: checkSourceFiles, critical: true }
  ];

  let allCriticalPassed = true;
  let warningsCount = 0;

  for (const check of checks) {
    console.log(`\n📋 ${check.name}:`);
    const result = await check.fn();
    if (!result) {
      if (check.critical) {
        allCriticalPassed = false;
      } else {
        warningsCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allCriticalPassed) {
    success('Verificações críticas passaram! ✨');
    if (warningsCount > 0) {
      warning(`${warningsCount} warning(s) encontrado(s) - não crítico`);
    }
    success('Projeto pronto para build! 🚀');
    process.exit(0);
  } else {
    error('Verificações críticas falharam! 🚨');
    error('Corrija os problemas críticos antes do build.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro no script de pré-build:', err);
  process.exit(1);
}); 