require('dotenv').config()

const { Client } = require('pg')

async function createDatabase() {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is missing from .env')
    }

    // Connect to PostgreSQL's maintenance database,
    // not ems_dev, because ems_dev may not exist yet.
    const connectionUrl = new URL(databaseUrl)
    connectionUrl.pathname = '/postgres';

    const client = new Client({
        connectionString: connectionUrl.toString(),
    })

    try {
        await client.connect();
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            ['ems_dev']
        );

        if(result.rowCount > 0) {
            console.log('Database ems_dev already exists');
            return;
        }

        // Database names cannot be passed as SQL parameters.
        // This identifier is a fixed, trusted value.
        await client.query('CREATE DATABASE ems_dev');
        console.log('Database ems_dev created successfully.');
    } finally {
        await client.end();
    }
}


createDatabase().catch((error) => {
    console.error('Database setup failed: ', error.message);
    process.exit(1);
})