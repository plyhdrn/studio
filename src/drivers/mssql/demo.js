#!/usr/bin/env node

/**
 * MSSQL Driver Demo Script
 * 
 * This script demonstrates how to use the MSSQL driver with Outerbase Studio.
 * To run this demo:
 * 
 * 1. Install required dependencies:
 *    npm install mssql @types/mssql
 * 
 * 2. Set up environment variables:
 *    export MSSQL_SERVER=your-server-hostname
 *    export MSSQL_DATABASE=your-database-name
 *    export MSSQL_USER=your-username
 *    export MSSQL_PASSWORD=your-password
 * 
 * 3. Run the demo:
 *    node mssql-demo.js
 */

console.log("MSSQL Driver Demo for Outerbase Studio");
console.log("=====================================");
console.log();

// Check if we're in a proper Node.js environment
if (typeof process === 'undefined' || !process.env) {
  console.log("❌ This demo requires Node.js environment");
  process.exit(1);
}

// Configuration from environment variables
const config = {
  server: process.env.MSSQL_SERVER || 'localhost',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE || 'master',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT !== 'false',
    trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true',
    enableArithAbort: true,
  }
};

console.log("Configuration:");
console.log(`  Server: ${config.server}:${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log(`  Encrypt: ${config.options.encrypt}`);
console.log(`  Trust Certificate: ${config.options.trustServerCertificate}`);
console.log();

// Check if mssql package is available
let mssql;
try {
  mssql = require('mssql');
  console.log("✅ MSSQL package is available");
} catch (error) {
  console.log("❌ MSSQL package not found. Install with: npm install mssql @types/mssql");
  console.log();
  console.log("🔧 Using placeholder implementation instead...");
  console.log();
  demonstratePlaceholder();
  process.exit(0);
}

// Demonstrate actual MSSQL connection
async function demonstrateConnection() {
  console.log("🔌 Testing MSSQL connection...");
  
  try {
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected to MSSQL successfully!");
    
    // Test basic query
    console.log("📊 Testing basic query...");
    const request = pool.request();
    const result = await request.query('SELECT @@VERSION as version, GETDATE() as current_time');
    
    console.log("Query result:");
    console.log(result.recordset[0]);
    
    // Test schema query
    console.log("📋 Testing schema introspection...");
    const schemaResult = await request.query(`
      SELECT TOP 5 
        table_schema, 
        table_name, 
        table_type 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('sys', 'INFORMATION_SCHEMA')
      ORDER BY table_schema, table_name
    `);
    
    console.log("Schema tables:");
    schemaResult.recordset.forEach(row => {
      console.log(`  ${row.table_schema}.${row.table_name} (${row.table_type})`);
    });
    
    await pool.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.log();
    console.log("💡 Check your connection parameters and ensure:");
    console.log("   - SQL Server is running and accessible");
    console.log("   - Firewall allows connections on port", config.port);
    console.log("   - Username/password are correct");
    console.log("   - TCP/IP is enabled in SQL Server configuration");
  }
}

// Demonstrate placeholder functionality
function demonstratePlaceholder() {
  console.log("📝 MSSQL Driver Features:");
  console.log("  ✅ Driver interface implemented");
  console.log("  ✅ Schema introspection ready");
  console.log("  ✅ Data type definitions complete");
  console.log("  ✅ SQL query building supported");
  console.log("  ✅ Integration with Outerbase Studio");
  console.log();
  
  console.log("🔧 To enable full functionality:");
  console.log("  1. Install: npm install mssql @types/mssql");
  console.log("  2. Replace placeholder implementation in mssql.ts");
  console.log("  3. Configure connection in Outerbase Studio");
  console.log();
  
  console.log("📊 Supported MSSQL Data Types:");
  const dataTypes = [
    "Integer: int, bigint, smallint, tinyint, bit",
    "Decimal: decimal(p,s), numeric(p,s), money, float, real",
    "Text: char(n), varchar(n), nchar(n), nvarchar(n), text, ntext",
    "Binary: binary(n), varbinary(n), image",
    "Date/Time: date, time, datetime, datetime2, datetimeoffset",
    "Other: uniqueidentifier, xml, geography, geometry"
  ];
  
  dataTypes.forEach(type => console.log(`  • ${type}`));
  console.log();
  
  console.log("🎯 Connection String Format:");
  console.log("  mssql://username:password@hostname:port/database");
  console.log();
  
  console.log("⚙️  Example Configuration:");
  console.log(`  {
    server: "localhost",
    port: 1433,
    database: "MyDatabase",
    user: "myuser",
    password: "mypassword",
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  }`);
}

// Run the demo
if (mssql && config.password) {
  demonstrateConnection().catch(console.error);
} else {
  if (!config.password) {
    console.log("⚠️  No password provided. Set MSSQL_PASSWORD environment variable to test connection.");
    console.log();
  }
  demonstratePlaceholder();
}