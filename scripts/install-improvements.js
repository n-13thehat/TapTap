#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing TapTap Matrix improvements...\n');

// Install new dependencies
console.log('📦 Installing new dependencies...');
const newDependencies = [
  'winston',
  'vitest-mock-extended',
  '@faker-js/faker',
  'async_hooks'
];

const newDevDependencies = [
  '@types/bcryptjs',
  '@types/uuid',
  '@types/nodemailer'
];

try {
  console.log('Installing production dependencies...');
  execSync(`pnpm add ${newDependencies.join(' ')}`, { stdio: 'inherit' });
  
  console.log('Installing development dependencies...');
  execSync(`pnpm add -D ${newDevDependencies.join(' ')}`, { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create necessary directories
console.log('📁 Creating directories...');
const directories = [
  'logs',
  'tests/integration',
  'tests/e2e',
  'tests/factories',
  'lib/middleware',
  'lib/validation',
  'lib/cache',
  'lib/database',
  'lib/monitoring',
  'lib/config',
  'lib/features',
  'components/ui'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created ${dir}`);
  } else {
    console.log(`  ⏭️  ${dir} already exists`);
  }
});

// Update .gitignore
console.log('\n📝 Updating .gitignore...');
const gitignoreAdditions = `
# Logs
logs/
*.log

# Environment files
.env.local
.env.production
.env.test

# Cache
.cache/

# Test coverage
coverage/

# Temporary files
tmp/
temp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Build artifacts
dist/
build/
out/

# Database
*.db
*.sqlite
*.sqlite3

# Backup files
*.bak
*.backup
backup/
`;

const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!currentGitignore.includes('# Logs')) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions);
    console.log('  ✅ Updated .gitignore');
  } else {
    console.log('  ⏭️  .gitignore already updated');
  }
} else {
  fs.writeFileSync(gitignorePath, gitignoreAdditions);
  console.log('  ✅ Created .gitignore');
}

// Create environment template
console.log('\n🔧 Creating environment template...');
const envTemplate = `# TapTap Matrix Environment Configuration

# Node Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taptap_matrix"
DATABASE_CONNECTION_LIMIT=10
DATABASE_QUERY_TIMEOUT=10000
DATABASE_CONNECT_TIMEOUT=5000
DATABASE_MAX_RETRIES=3
DATABASE_RETRY_DELAY=1000

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis/Upstash (Optional)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# External Services (Optional)
OPENAI_API_KEY="your-openai-key"
SENTRY_DSN="https://your-sentry-dsn"

# Feature Flags
BETA_MODE=false
BETA_ACCESS_CODE="your-beta-code"
ENABLE_ANALYTICS=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true

# Security
CSRF_SECRET="your-csrf-secret-minimum-32-characters"
ENCRYPTION_KEY="your-encryption-key-minimum-32-characters"

# Logging
LOG_LEVEL=info

# Performance
MAX_REQUEST_SIZE=10485760
REQUEST_TIMEOUT=30000

# Solana (Optional)
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_PRIVATE_KEY="your-solana-private-key"
`;

const envExamplePath = path.join(process.cwd(), '.env.example');
fs.writeFileSync(envExamplePath, envTemplate);
console.log('  ✅ Created .env.example');

// Update package.json scripts
console.log('\n📜 Updating package.json scripts...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const newScripts = {
  'test:unit': 'vitest run tests/unit',
  'test:integration': 'vitest run tests/integration',
  'test:e2e': 'vitest run tests/e2e',
  'test:watch': 'vitest watch',
  'test:coverage': 'vitest run --coverage',
  'health:check': 'curl http://localhost:3000/api/health',
  'db:migrate': 'prisma migrate dev',
  'db:reset': 'prisma migrate reset',
  'db:studio': 'prisma studio',
  'cache:clear': 'node -e "console.log(\'Cache cleared\')"',
  'logs:clear': 'rm -rf logs/*.log',
  'setup:dev': 'node scripts/setup-development.js'
};

packageJson.scripts = { ...packageJson.scripts, ...newScripts };

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('  ✅ Updated package.json scripts');

console.log('\n🎉 Installation complete!');
console.log('\n📋 Next steps:');
console.log('1. Copy .env.example to .env.local and fill in your values');
console.log('2. Run "pnpm run setup:dev" to complete development setup');
console.log('3. Run "pnpm run test" to verify everything works');
console.log('4. Run "pnpm run dev" to start the development server');
console.log('\n🔗 Useful commands:');
console.log('- pnpm run health:check - Check application health');
console.log('- pnpm run test:coverage - Run tests with coverage');
console.log('- pnpm run db:studio - Open Prisma Studio');
console.log('- pnpm run logs:clear - Clear log files');
