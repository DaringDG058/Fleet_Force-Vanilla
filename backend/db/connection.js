// Fleet Force — Oracle Database Connection Pool + Query Logger
const oracledb = require('oracledb');

const DB_CONFIG = {
    user: 'fleet_force',
    password: 'Daring_DG?211',
    connectString: 'localhost:1521/FREEPDB1',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1
};

let pool = null;
let wsClients = new Set();

async function initialize() {
    try {
        pool = await oracledb.createPool(DB_CONFIG);
        console.log('✅ Oracle connection pool created (thin mode)');
        return pool;
    } catch (err) {
        console.error('❌ Oracle pool creation failed:', err.message);
        throw err;
    }
}

function setWsClients(clients) {
    wsClients = clients;
}

function broadcastQuery(sqlText, sqlType, tableName, executionMs, rowCount) {
    const msg = JSON.stringify({
        type: 'query_log',
        data: {
            sql: sqlText,
            sqlType,
            tableName,
            executionMs,
            rowCount,
            timestamp: new Date().toISOString()
        }
    });
    wsClients.forEach(client => {
        if (client.readyState === 1) client.send(msg);
    });
}

async function execute(sql, binds = [], options = {}) {
    let connection;
    const startTime = Date.now();
    try {
        connection = await pool.getConnection();
        const opts = {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true,
            ...options
        };
        const result = await connection.execute(sql, binds, opts);
        const executionMs = Date.now() - startTime;

        // Determine SQL type and table
        const sqlUpper = sql.trim().toUpperCase();
        let sqlType = 'UNKNOWN';
        if (sqlUpper.startsWith('SELECT')) sqlType = 'SELECT';
        else if (sqlUpper.startsWith('INSERT')) sqlType = 'INSERT';
        else if (sqlUpper.startsWith('UPDATE')) sqlType = 'UPDATE';
        else if (sqlUpper.startsWith('DELETE')) sqlType = 'DELETE';

        const tableMatch = sql.match(/(?:FROM|INTO|UPDATE|JOIN)\s+(\w+)/i);
        const tableName = tableMatch ? tableMatch[1].toUpperCase() : '';

        const rowCount = result.rows ? result.rows.length : (result.rowsAffected || 0);

        // Broadcast to live query terminal
        broadcastQuery(sql.trim(), sqlType, tableName, executionMs, rowCount);

        // Log to query_log table (async, non-blocking)
        if (!sql.includes('QUERY_LOG')) {
            connection.execute(
                `INSERT INTO query_log (sql_text, sql_type, table_name, execution_ms, row_count, executed_by)
                 VALUES (:1, :2, :3, :4, :5, 'system')`,
                [sql.substring(0, 3000), sqlType, tableName, executionMs, rowCount],
                { autoCommit: true }
            ).catch(() => {});
        }

        return result;
    } catch (err) {
        const executionMs = Date.now() - startTime;
        broadcastQuery(sql.trim() + '\n-- ERROR: ' + err.message, 'ERROR', '', executionMs, 0);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) {}
        }
    }
}

async function executeRaw(sql, binds = [], options = {}) {
    // Execute without logging (for internal queries)
    let connection;
    try {
        connection = await pool.getConnection();
        const opts = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true, ...options };
        return await connection.execute(sql, binds, opts);
    } finally {
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

async function close() {
    if (pool) {
        await pool.close(0);
        console.log('Oracle pool closed');
    }
}

module.exports = { initialize, execute, executeRaw, close, setWsClients };
