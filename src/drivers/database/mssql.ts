// Full MSSQL implementation with the 'mssql' package
import * as sql from "mssql";
import {
  DatabaseResultSet,
  DatabaseResultStat,
  QueryableBaseDriver,
} from "../base-driver";

export interface MSSQLConnectionConfig {
  server: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  options?: {
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    enableArithAbort?: boolean;
  };
}

export class MSSQLQueryable implements QueryableBaseDriver {
  private pool: sql.ConnectionPool;
  private connected = false;

  constructor(private config: MSSQLConnectionConfig) {
    const poolConfig: sql.config = {
      server: config.server,
      port: config.port || 1433,
      database: config.database,
      user: config.user,
      password: config.password,
      options: {
        encrypt: config.options?.encrypt ?? true,
        trustServerCertificate: config.options?.trustServerCertificate ?? false,
        enableArithAbort: config.options?.enableArithAbort ?? true,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    this.pool = new sql.ConnectionPool(poolConfig);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      try {
        await this.pool.connect();
        this.connected = true;
      } catch (error) {
        console.error("Failed to connect to MSSQL:", error);
        throw new Error(`Failed to connect to MSSQL: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }

  private mapMSSQLResult(result: sql.IResult<any>): DatabaseResultSet {
    const headers = result.recordset?.columns ? 
      Object.keys(result.recordset.columns).map(name => ({
        name,
        displayName: name,
        originalType: result.recordset.columns[name].type.declaration,
        type: this.mapMSSQLTypeToGeneric(result.recordset.columns[name].type),
      })) : [];

    const rows = result.recordset || [];

    const stat: DatabaseResultStat = {
      rowsAffected: result.rowsAffected?.[0] ?? 0,
      rowsRead: rows.length,
      rowsWritten: result.rowsAffected?.[0] ?? null,
      queryDurationMs: null,
    };

    return {
      headers,
      rows,
      stat,
    };
  }

  private mapMSSQLTypeToGeneric(sqlType: sql.ISqlType): string {
    // Map MSSQL types to generic types
    switch (sqlType.type) {
      case sql.TYPES.Int:
      case sql.TYPES.BigInt:
      case sql.TYPES.SmallInt:
      case sql.TYPES.TinyInt:
        return "INTEGER";
      case sql.TYPES.Float:
      case sql.TYPES.Real:
      case sql.TYPES.Decimal:
      case sql.TYPES.Numeric:
      case sql.TYPES.Money:
      case sql.TYPES.SmallMoney:
        return "REAL";
      case sql.TYPES.Bit:
        return "BOOLEAN";
      case sql.TYPES.VarChar:
      case sql.TYPES.NVarChar:
      case sql.TYPES.Char:
      case sql.TYPES.NChar:
      case sql.TYPES.Text:
      case sql.TYPES.NText:
        return "TEXT";
      case sql.TYPES.Binary:
      case sql.TYPES.VarBinary:
      case sql.TYPES.Image:
        return "BLOB";
      case sql.TYPES.Date:
      case sql.TYPES.DateTime:
      case sql.TYPES.DateTime2:
      case sql.TYPES.SmallDateTime:
      case sql.TYPES.DateTimeOffset:
      case sql.TYPES.Time:
        return "DATETIME";
      case sql.TYPES.UniqueIdentifier:
        return "UUID";
      default:
        return "TEXT";
    }
  }

  async query(stmt: string): Promise<DatabaseResultSet> {
    await this.ensureConnected();
    
    try {
      const startTime = Date.now();
      const request = this.pool.request();
      const result = await request.query(stmt);
      const duration = Date.now() - startTime;

      const mappedResult = this.mapMSSQLResult(result);
      mappedResult.stat.queryDurationMs = duration;
      
      return mappedResult;
    } catch (error) {
      console.error("MSSQL Query Error:", error);
      throw new Error(`MSSQL Query Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    await this.ensureConnected();
    
    const transaction = this.pool.transaction();
    
    try {
      await transaction.begin();
      
      const results: DatabaseResultSet[] = [];
      
      for (const stmt of stmts) {
        const request = transaction.request();
        const result = await request.query(stmt);
        results.push(this.mapMSSQLResult(result));
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback transaction:", rollbackError);
      }
      
      console.error("MSSQL Transaction Error:", error);
      throw new Error(`MSSQL Transaction Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async batch(stmts: string[]): Promise<DatabaseResultSet[]> {
    await this.ensureConnected();
    
    try {
      const results: DatabaseResultSet[] = [];
      
      for (const stmt of stmts) {
        const result = await this.query(stmt);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error("MSSQL Batch Error:", error);
      throw new Error(`MSSQL Batch Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      try {
        await this.pool.close();
        this.connected = false;
      } catch (error) {
        console.error("Error closing MSSQL connection:", error);
      }
    }
  }
}