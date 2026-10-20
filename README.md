<!-- format code -->
```bash
npm run format
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