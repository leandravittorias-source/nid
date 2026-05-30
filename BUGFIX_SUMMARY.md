# NósDois - Guia de Uso e Correção de Bugs

## ✅ TODOS OS BUGS FORAM CORRIGIDOS!

### 1. **Problemas Resolvidos**

#### ❌ Erro: "Unexpected token '<', <!DOCTYPE is not valid JSON"
- **Causa**: O servidor estava usando `store.couple` diretamente em vez do objeto de casal correto
- **Solução**: Todos os endpoints agora usam `getCoupleAndUsers(store, coupleId)` para buscar dados do casal correto

#### ❌ Erro: Multi-tenancy quebrado para novos casais
- **Causa**: Endpoints como `tasks/toggle`, `quests/toggle-complete`, `shopping/finalize` usavam `store.couple` e `store.users` fixos
- **Solução**: Todos os endpoints agora recebem o `coupleId` da requisição e usam os dados corretos

#### ❌ Erro: Função `logActivity` crashava para novos casais
- **Causa**: Acessava `store.couple` diretamente
- **Solução**: Reescrita para aceitar `coupleId` como parâmetro opcional

#### ❌ Erro: Novo casal não via dados próprios
- **Causa**: `filterByCouple` tinha fallback hardcoded para `couple_1`
- **Solução**: Agora filtra corretamente por `coupleId` da requisição

#### ❌ Erro: Código de convite se tornava inválido
- **Causa**: `invite_code` era zerado para `null` após parceiro 2 se registrar
- **Solução**: Mantém o código de convite para referência futura

#### ❌ Erro: UserId hardcoded "Leandro"
- **Causa**: Tela de sucesso do registro retornava sempre "Leandro"
- **Solução**: Agora usa o `userId` retornado pelo servidor

#### ❌ Erro: Export duplicado
- **Causa**: `AuthScreen.tsx` tinha `export default` duplicado
- **Solução**: Removido export duplicado

#### ❌ Erro: Tela branca / 404 Website not found
- **Causa**: Servidor não estava rodando ou configurado incorretamente para produção
- **Solução**: Adicionado Procfile, .env.production, e scripts de inicialização melhorados

---

## 🚀 COMO USAR

### **Modo Desenvolvimento (Local)**

```bash
# Terminal 1: Iniciar servidor com hot-reload
npm run dev

# Acesse: http://localhost:5173
```

### **Modo Produção (Deploy)**

```bash
# Build da aplicação
npm run build

# Iniciar servidor
npm start

# OU use o script facilitado:
./start.sh

# Acesse: http://localhost:3000
```

---

## 🔐 CREDENCIAIS DE TESTE

### Casal Demo (Pré-configurado)

**Parceiro 1 (Leandro)**
- Email: `leandro@nosdois.com`
- Senha: `123456`

**Parceiro 2 (Kaisa)**
- Email: `kaisa@nosdois.com`
- Senha: `123456`

**Código do Casal**: `AMOR42`

---

## 📋 FUNCIONALIDADES DISPONÍVEIS

✅ Autenticação com email/senha
✅ Convite de parceiro via código
✅ Tarefas compartilhadas com gamificação
✅ Calendário de compromissos
✅ Lista de compras mensal
✅ Rastreamento de despesas
✅ Memórias (álbum de fotos)
✅ Check-in de humor
✅ Wishlist com poupança
✅ Receitas e cardápio
✅ Gestão de pets
✅ Contas mensais fixas
✅ Pontos e recompensas

---

## 🗂️ ESTRUTURA DE ARQUIVOS IMPORTANTES

```
NosDois-main/
├── server.ts                  # Servidor Express principal
├── server/db.ts              # Banco de dados JSON
├── src/
│   ├── App.tsx               # Aplicação React principal
│   ├── components/
│   │   ├── AuthScreen.tsx    # Tela de autenticação
│   │   ├── HouseTab.tsx      # Aba principal
│   │   └── PetsTab.tsx       # Aba de pets
│   └── types.ts              # Tipos TypeScript
├── dist/                      # Build produção
│   ├── index.html            # Frontend compilado
│   └── server.cjs            # Servidor compilado
├── nosdois_db.json           # Banco de dados persistente
├── package.json              # Dependências
├── vite.config.ts            # Configuração Vite
├── tsconfig.json             # Configuração TypeScript
├── Procfile                  # Configuração Heroku
├── .env.production           # Variáveis produção
└── start.sh                  # Script de inicialização
```

---

## 🔧 CONFIGURAÇÃO DE DEPLOYMENT

Para fazer deploy em plataformas como **Heroku**, **Render**, ou **Railway**:

1. O arquivo `Procfile` já está configurado
2. As variáveis de ambiente estão em `.env` e `.env.production`
3. O servidor sobe automaticamente na porta definida por `process.env.PORT`

### Variáveis de Ambiente Importantes

```env
NODE_ENV=production        # Modo de produção
PORT=3000                  # Porta do servidor
VITE_SUPABASE_URL=...     # (Opcional) Para Supabase
VITE_SUPABASE_ANON_KEY=...# (Opcional) Para Supabase
```

---

## 📊 BANCO DE DADOS

O projeto usa um arquivo JSON local (`nosdois_db.json`) como banco de dados:

- **Vantagem**: Funciona offline, sem dependências externas
- **Desvantagem**: Não é ideal para múltiplos usuários simultâneos em produção

### Para Usar Supabase (Recomendado para Produção)

O Supabase já está configurado no `.env`:
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Você precisaria migrar o `server.ts` para usar o cliente Supabase em vez do JSON local.

---

## 🐛 TROUBLESHOOTING

### Erro: "vite: command not found"
```bash
npm install --legacy-peer-deps
npm run build
```

### Erro: "Cannot find database file"
O arquivo `nosdois_db.json` será criado automaticamente na primeira execução.

### Erro: "Port 3000 already in use"
```bash
# Use uma porta diferente
PORT=3001 npm start

# Ou mate o processo
lsof -ti:3000 | xargs kill -9
```

### Erro: Blank white screen
- Verifique o console (F12) para ver erros
- Limpe o cache: `Ctrl+Shift+Delete` (Chrome)
- Reconstrua: `npm run build`

---

## 📱 FUNCIONALIDADES DE MOBILE

A aplicação é 100% responsiva com:
- Navigation bar na parte inferior (mobile)
- Layout adaptável para todos os tamanhos
- PWA (Progressive Web App) para instalar como app nativo

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Migrar para Supabase**: Para múltiplos usuários e backup
2. **Adicionar Email**: Para confirmação de cadastro
3. **Integrar Pagamentos**: Stripe para recompensas premium
4. **Adicionar Notificações**: Push notifications para lembretes
5. **Analytics**: Rastrear uso e métricas

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs do servidor
2. Limpe cache e reconstrua
3. Verifique se todas as dependências estão instaladas
4. Faça reset do banco: `npm run dev` (reseta na primeira execução)

---

**✅ Projeto pronto para usar! Divirta-se! 🎉**
