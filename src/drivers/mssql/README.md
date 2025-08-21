# MSSQL Driver for Outerbase Studio

This directory contains the MSSQL (Microsoft SQL Server) driver implementation for Outerbase Studio.

## Features

- Full schema introspection for MSSQL databases
- Support for MSSQL-specific data types
- Transaction and batch query support
- Connection pooling with configurable options
- Secure connection options (encryption, certificate validation)

## Installation

To use the MSSQL driver, you need to install the required dependencies:

```bash
npm install mssql @types/mssql
```

## Configuration

The MSSQL driver accepts the following connection configuration:

```typescript
interface MSSQLConnectionConfig {
  server: string;           // SQL Server hostname
  port?: number;           // Port (default: 1433)
  database: string;        // Database name
  user: string;            // Username
  password: string;        // Password
  options?: {
    encrypt?: boolean;                    // Use encryption (default: true)
    trustServerCertificate?: boolean;     // Trust server certificate (default: false)
    enableArithAbort?: boolean;           // Enable arithmetic abort (default: true)
  };
}
```

## Usage

1. **Add MSSQL Connection**: In the Outerbase Studio UI, select "Microsoft SQL Server" as the database type.

2. **Configure Connection**: Provide the following details:
   - Server hostname/IP
   - Port (optional, defaults to 1433)
   - Database name
   - Username and password
   - Optional SSL/encryption settings

3. **Connection URL Format**: You can also use a connection URL in the format:
   ```
   mssql://username:password@hostname:port/database
   ```

## Data Types

The MSSQL driver supports all standard SQL Server data types:

### Numeric Types
- `int`, `bigint`, `smallint`, `tinyint`
- `decimal(p,s)`, `numeric(p,s)`
- `float`, `real`
- `money`, `smallmoney`
- `bit`

### String Types
- `char(n)`, `varchar(n)`
- `nchar(n)`, `nvarchar(n)`
- `text`, `ntext`

### Binary Types
- `binary(n)`, `varbinary(n)`
- `image`

### Date/Time Types
- `date`, `time`
- `datetime`, `datetime2`, `smalldatetime`
- `datetimeoffset`

### Other Types
- `uniqueidentifier`
- `xml`
- `geography`, `geometry`
- `sql_variant`

## Implementation Details

### Files Structure

- `mssql-driver.ts`: Main driver implementation extending CommonSQLImplement
- `mssql-data-type.ts`: MSSQL-specific data type definitions and suggestions
- `generate-schema.ts`: Schema change generation utilities
- `../database/mssql.ts`: Database connection implementation
- `../database/mssql-full.ts`: Complete implementation template

### Schema Introspection

The driver uses SQL Server's `information_schema` views to introspect:
- Schemas and databases
- Tables and views
- Columns with types and constraints
- Primary keys, foreign keys, and unique constraints
- Indexes and triggers

### Query Execution

- **Single Queries**: Execute individual SQL statements
- **Transactions**: Atomic execution of multiple statements
- **Batch Operations**: Execute multiple statements in sequence

## Development

### Current Implementation Status

✅ **Completed:**
- Driver interface and schema introspection
- Data type definitions
- Connection configuration
- Integration with Outerbase Studio

🚧 **Requires mssql package:**
- Actual database connectivity
- Query execution
- Transaction management

### Testing

To test the MSSQL driver:

1. Set up a SQL Server instance (local or cloud)
2. Install the mssql package: `npm install mssql @types/mssql`
3. Replace the placeholder implementation in `../database/mssql.ts` with the full version from `mssql-full.ts`
4. Configure a connection in Outerbase Studio
5. Test schema browsing and query execution

### Security Considerations

- Always use encrypted connections in production
- Validate server certificates when possible
- Use least-privilege database accounts
- Consider connection pooling limits for performance

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Increase `connectionTimeout` in the pool configuration
2. **SSL/TLS Errors**: Set `trustServerCertificate: true` for self-signed certificates
3. **Authentication Failed**: Verify username/password and SQL Server authentication mode
4. **Network Issues**: Check firewall settings and SQL Server TCP/IP configuration

### Error Messages

- `"MSSQL connection not implemented yet"`: The mssql package needs to be installed
- `"Failed to connect to MSSQL"`: Check connection parameters and network connectivity
- `"Authentication failed"`: Verify credentials and SQL Server authentication settings

## Contributing

When contributing to the MSSQL driver:

1. Follow the existing code patterns
2. Add tests for new functionality
3. Update this documentation
4. Ensure compatibility with different SQL Server versions

## License

This implementation follows the same license as the main Outerbase Studio project.