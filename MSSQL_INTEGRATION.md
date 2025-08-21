# MSSQL Driver Integration Guide

This guide explains how the MSSQL driver integrates with Outerbase Studio and how to complete the implementation.

## Integration Points

### 1. Driver Registration (`saved-connection-storage.ts`)
- Added `"mssql"` to `SupportedDriver` type
- Enables MSSQL as a selectable database type in the UI

### 2. Driver Factory (`helpers.ts`)
- Added MSSQL driver creation logic
- Parses connection URLs and creates MSSQL driver instances
- Handles connection configuration and options

### 3. Base Driver Support (`base-driver.ts`)
- Added `"mssql"` to `SupportedDialect` type
- Enables MSSQL-specific SQL generation and syntax handling

### 4. Extensions (`standard-extension.tsx`)
- Added `createMSSQLExtensions()` function
- Includes trigger editor and standard extensions for MSSQL

### 5. UI Components (`resource-card/utils.tsx`)
- Added MSSQL display name: "Microsoft SQL"
- Added database icon support (using generic Database icon)

## Driver Implementation

### Core Driver (`mssql-driver.ts`)
```typescript
export default class MSSQLDriver extends CommonSQLImplement {
  // Inherits common SQL functionality
  // Implements MSSQL-specific methods
  // Provides schema introspection
  // Handles MSSQL syntax and escaping
}
```

### Key Features:
- **Schema Introspection**: Uses `information_schema` views
- **Data Types**: Comprehensive MSSQL type support
- **Security**: Proper identifier escaping with `[brackets]`
- **Constraints**: Primary keys, foreign keys, unique constraints
- **Transactions**: Full transaction and batch support

### Connection Implementation (`database/mssql.ts`)
```typescript
export class MSSQLQueryable implements QueryableBaseDriver {
  // Current: Placeholder implementation
  // Future: Full mssql package integration
}
```

## Completing the Implementation

### Step 1: Install Dependencies
```bash
npm install mssql @types/mssql
```

### Step 2: Replace Placeholder
Replace the content of `src/drivers/database/mssql.ts` with the implementation from `mssql-full.ts`:

1. Uncomment the mssql import
2. Implement connection pooling
3. Add proper error handling
4. Implement result mapping

### Step 3: Test Connection
```javascript
// Example usage in Outerbase Studio
const config = {
  driver: "mssql",
  url: "mssql://user:pass@server:1433/database",
  username: "myuser", 
  password: "mypassword",
  database: "MyDatabase"
};

const driver = createLocalDriver(config);
```

## SQL Server Compatibility

### Supported Versions
- SQL Server 2016 and later
- Azure SQL Database
- Azure SQL Managed Instance

### Required Configuration
- TCP/IP protocol enabled
- Mixed mode authentication (SQL Server + Windows)
- Appropriate firewall rules

### Connection Security
- SSL/TLS encryption supported
- Certificate validation options
- Connection pooling with timeouts

## Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Schema Browsing | ✅ Complete | Full information_schema support |
| Table Operations | ✅ Complete | CRUD operations, constraints |
| Data Types | ✅ Complete | All SQL Server types supported |
| Query Execution | 🚧 Requires mssql package | Placeholder implementation |
| Transactions | 🚧 Requires mssql package | Framework ready |
| Batch Operations | 🚧 Requires mssql package | Framework ready |
| Connection Pooling | 🚧 Requires mssql package | Configuration ready |
| SSL/Encryption | 🚧 Requires mssql package | Options defined |
| Triggers | ✅ Complete | Schema and editor support |
| Views | ✅ Complete | Create, edit, drop support |
| Stored Procedures | ⏳ Future | Not yet implemented |
| Functions | ⏳ Future | Not yet implemented |

## Testing

### Unit Tests (`mssql-driver.test.ts`)
- Driver instantiation
- Flag configuration
- Identifier escaping
- Schema introspection logic
- Mock data handling

### Integration Testing
1. Set up SQL Server instance
2. Install mssql package
3. Replace placeholder implementation
4. Test actual connections
5. Verify schema operations

### Manual Testing Checklist
- [ ] Connection establishment
- [ ] Schema browsing
- [ ] Table creation/modification
- [ ] Data querying and editing
- [ ] Transaction handling
- [ ] Error handling

## Performance Considerations

### Connection Pooling
- Default: 10 max connections
- Configurable pool size
- Idle timeout: 30 seconds
- Connection timeout: 30 seconds

### Query Optimization
- Prepared statements support
- Batch operations
- Result streaming for large datasets
- Connection reuse

### Memory Management
- Automatic connection cleanup
- Result set memory management
- Connection pool monitoring

## Security Best Practices

### Authentication
- Use SQL Server authentication
- Strong passwords required
- Consider Azure AD integration

### Network Security
- Enable SSL/TLS encryption
- Validate server certificates
- Firewall configuration
- Network segmentation

### Access Control
- Principle of least privilege
- Database-level permissions
- Schema-level restrictions
- Audit logging

## Troubleshooting

### Common Issues

**Connection Timeout**
```
Solution: Increase connectionTimeout in config
Error: Failed to connect to MSSQL: Connection timeout
```

**Authentication Failed**
```
Solution: Check SQL Server authentication mode
Error: Login failed for user 'username'
```

**Network Issues**
```
Solution: Check firewall and TCP/IP settings
Error: Cannot connect to server
```

**SSL/TLS Errors**
```
Solution: Set trustServerCertificate: true for dev
Error: Self signed certificate in certificate chain
```

### Debug Configuration
```typescript
const config = {
  server: "localhost",
  database: "test",
  user: "testuser", 
  password: "testpass",
  options: {
    encrypt: false,           // Disable for local dev
    trustServerCertificate: true,  // Allow self-signed
    enableArithAbort: true
  },
  pool: {
    max: 5,                   // Reduce pool size
    min: 0,
    idleTimeoutMillis: 10000
  }
};
```

## Contributing

### Adding New Features
1. Follow existing patterns in MySQL/PostgreSQL drivers
2. Add tests for new functionality
3. Update documentation
4. Consider SQL Server version compatibility

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Include error handling

### Testing Requirements
- Unit tests for all public methods
- Integration tests with real SQL Server
- Mock tests for CI/CD pipelines
- Performance benchmarks