// Fleet Force — Database Initialization Script
// Run: node db/init.js
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const DB_CONFIG = {
    user: 'fleet_force',
    password: 'Daring_DG?211',
    connectString: 'localhost:1521/FREEPDB1'
};

async function runSqlFile(connection, filePath) {
    const name = path.basename(filePath);
    console.log(`\n📄 Running ${name}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolons, handling PL/SQL blocks
    const statements = [];
    let current = '';
    let inPlsql = false;

    for (const line of sql.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed === '') {
            continue;
        }
        if (trimmed.toUpperCase().startsWith('BEGIN') || trimmed.toUpperCase().startsWith('DECLARE')) {
            inPlsql = true;
        }
        current += line + '\n';
        if (inPlsql && trimmed === '/') {
            statements.push(current.replace(/\/\s*$/, '').trim());
            current = '';
            inPlsql = false;
        } else if (!inPlsql && trimmed.endsWith(';')) {
            statements.push(current.replace(/;\s*$/, '').trim());
            current = '';
        }
    }
    if (current.trim()) statements.push(current.trim().replace(/;\s*$/, '').replace(/\/\s*$/, ''));

    let success = 0, errors = 0;
    for (const stmt of statements) {
        if (!stmt || stmt === 'COMMIT') {
            if (stmt === 'COMMIT') await connection.commit();
            continue;
        }
        try {
            await connection.execute(stmt);
            success++;
        } catch (err) {
            // Ignore "table does not exist" during cleanup
            if (err.errorNum === 942 || err.errorNum === 2289) {
                continue;
            }
            errors++;
            console.error(`  ❌ Error: ${err.message.substring(0, 100)}`);
            console.error(`     SQL: ${stmt.substring(0, 80)}...`);
        }
    }
    await connection.commit();
    console.log(`  ✅ ${success} statements OK, ${errors} errors`);
}

async function main() {
    let connection;
    try {
        console.log('🔌 Connecting to Oracle...');
        connection = await oracledb.getConnection(DB_CONFIG);
        console.log('✅ Connected to fleet_force@FREEPDB1');

        const dbDir = __dirname;
        const files = [
            'schema.sql',
            'seed_part1.sql',
            'seed_part2.sql',
            'seed_part3.sql',
            'seed_part4.sql',
            'seed_part6.sql',
            'seed_fix.sql'
        ];

        for (const file of files) {
            await runSqlFile(connection, path.join(dbDir, file));
        }

        // Verify
        console.log('\n📊 Verification:');
        const tables = ['DEPARTMENT','ROLES','EMPLOYEE','APP_USER','HUB','ROUTE','TRACTOR','TRAILER','DRIVER','CUSTOMER','WAREHOUSE','TRIP','LOAD','INVOICE'];
        for (const t of tables) {
            try {
                const r = await connection.execute(`SELECT COUNT(*) AS cnt FROM ${t}`);
                console.log(`  ${t}: ${r.rows[0][0]} rows`);
            } catch (e) {
                console.log(`  ${t}: ERROR - ${e.message.substring(0,50)}`);
            }
        }

        console.log('\n🎉 Database initialization complete!');
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    } finally {
        if (connection) await connection.close();
    }
}

main();
