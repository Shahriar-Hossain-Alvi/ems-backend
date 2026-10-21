## Format Code
```bash
npm run format
```

## Generate a complete feature
```bash
pnpm exec nest g resource users --no-spec
```

## Generate individual piece
```bash
# Generate individual pieces
pnpm exec nest g module employees
pnpm exec nest g controller employees --no-spec
pnpm exec nest g service employees --no-spec
```

## Generate Prisma Client from schema.prisma models
```bash
pnpm exec prisma generate
```

## Commands
```bash
npm run db:setup
npm run db:migrate
npm run db:seed
```

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## create an empty database first
Inside the project folder, run this command to create a database for the project
```bash
node scripts/create-database.cjs
```