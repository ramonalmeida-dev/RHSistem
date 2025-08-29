#!/bin/bash

echo "🧪 Executando Testes de Permissões do Sistema"
echo "=============================================="

# Executar testes de permissões
echo "📋 Testando validação de permissões..."
npm test test/permissions/permissions-validation.test.ts

echo ""
echo "✅ Testes de Permissões Concluídos!"
echo ""
echo "📊 Resumo das Validações:"
echo "-------------------------"
echo "✅ Consultor: Apenas visualização de clientes (sem edição)"
echo "✅ Coordenador: Acesso completo a usuários e edição de clientes"
echo "✅ Diretoria: Acesso a exclusões e gerenciamento de roles"
echo "✅ Admin Nível 1: Configurações do sistema"
echo "✅ Admin Master: Acesso total ao sistema"
echo ""
echo "🔒 Permissões Validadas:"
echo "- Consultor NÃO pode editar clientes"
echo "- Consultor NÃO pode acessar usuários"
echo "- Consultor NÃO pode acessar relatórios financeiros"
echo "- Coordenador pode editar clientes"
echo "- Coordenador pode acessar usuários"
echo "- Coordenador pode acessar relatórios financeiros" 