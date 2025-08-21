import { describe, expect, test } from "@jest/globals";
import MSSQLDriver from "../mssql-driver";
import { MSSQLQueryable } from "../../database/mssql";

// Mock implementation for testing
class MockMSSQLQueryable extends MSSQLQueryable {
  constructor() {
    super({
      server: "localhost",
      database: "test",
      user: "test",
      password: "test"
    });
  }

  async query(stmt: string) {
    // Return mock data based on the query
    if (stmt.includes("information_schema.schemata")) {
      return {
        rows: [{ schema_name: "dbo" }, { schema_name: "test_schema" }],
        headers: [{ name: "schema_name", displayName: "schema_name", type: "TEXT", originalType: "nvarchar" }],
        stat: { rowsAffected: 0, rowsRead: 2, rowsWritten: null, queryDurationMs: 10 }
      };
    }
    
    if (stmt.includes("information_schema.tables")) {
      return {
        rows: [
          { 
            table_catalog: "test_db", 
            table_schema: "dbo", 
            table_name: "users", 
            table_type: "BASE TABLE" 
          }
        ],
        headers: [
          { name: "table_catalog", displayName: "table_catalog", type: "TEXT", originalType: "nvarchar" },
          { name: "table_schema", displayName: "table_schema", type: "TEXT", originalType: "nvarchar" },
          { name: "table_name", displayName: "table_name", type: "TEXT", originalType: "nvarchar" },
          { name: "table_type", displayName: "table_type", type: "TEXT", originalType: "nvarchar" }
        ],
        stat: { rowsAffected: 0, rowsRead: 1, rowsWritten: null, queryDurationMs: 5 }
      };
    }

    if (stmt.includes("information_schema.columns")) {
      return {
        rows: [
          {
            table_catalog: "test_db",
            table_schema: "dbo",
            table_name: "users",
            column_name: "id",
            ordinal_position: 1,
            column_default: null,
            is_nullable: "NO",
            data_type: "int",
            character_maximum_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            datetime_precision: null,
            character_set_name: null,
            collation_name: null,
            is_identity: "YES"
          },
          {
            table_catalog: "test_db",
            table_schema: "dbo",
            table_name: "users",
            column_name: "name",
            ordinal_position: 2,
            column_default: null,
            is_nullable: "YES",
            data_type: "nvarchar",
            character_maximum_length: 255,
            numeric_precision: null,
            numeric_scale: null,
            datetime_precision: null,
            character_set_name: "UNICODE",
            collation_name: "SQL_Latin1_General_CP1_CI_AS",
            is_identity: "NO"
          }
        ],
        headers: [],
        stat: { rowsAffected: 0, rowsRead: 2, rowsWritten: null, queryDurationMs: 8 }
      };
    }

    // Return empty result for constraint queries
    return {
      rows: [],
      headers: [],
      stat: { rowsAffected: 0, rowsRead: 0, rowsWritten: null, queryDurationMs: 2 }
    };
  }

  async transaction(stmts: string[]) {
    const results = [];
    for (const stmt of stmts) {
      results.push(await this.query(stmt));
    }
    return results;
  }

  async batch(stmts: string[]) {
    return this.transaction(stmts);
  }
}

describe("MSSQL Driver", () => {
  test("should create driver instance", () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    
    expect(driver).toBeInstanceOf(MSSQLDriver);
  });

  test("should have correct flags", () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    const flags = driver.getFlags();

    expect(flags.dialect).toBe("mssql");
    expect(flags.defaultSchema).toBe("dbo");
    expect(flags.supportBigInt).toBe(true);
    expect(flags.supportModifyColumn).toBe(true);
    expect(flags.supportCreateUpdateTable).toBe(true);
    expect(flags.supportInsertReturning).toBe(true);
    expect(flags.supportUpdateReturning).toBe(true);
  });

  test("should escape identifiers correctly", () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);

    expect(driver.escapeId("table")).toBe("[table]");
    expect(driver.escapeId("table]with]brackets")).toBe("[table]]with]]brackets]");
    expect(driver.escapeId("schema.table")).toBe("[schema.table]");
  });

  test("should get collation list", () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    const collations = driver.getCollationList();

    expect(Array.isArray(collations)).toBe(true);
    expect(collations.length).toBeGreaterThan(0);
    expect(collations).toContain("SQL_Latin1_General_CP1_CI_AS");
  });

  test("should get current schema", async () => {
    const mockQueryable = new MockMSSQLQueryable();
    // Override query method for this specific test
    mockQueryable.query = async (stmt: string) => {
      if (stmt.includes("SCHEMA_NAME()")) {
        return {
          rows: [{ current_schema: "dbo" }],
          headers: [{ name: "current_schema", displayName: "current_schema", type: "TEXT", originalType: "nvarchar" }],
          stat: { rowsAffected: 0, rowsRead: 1, rowsWritten: null, queryDurationMs: 1 }
        };
      }
      return { rows: [], headers: [], stat: { rowsAffected: 0, rowsRead: 0, rowsWritten: null, queryDurationMs: 0 } };
    };

    const driver = new MSSQLDriver(mockQueryable);
    const schema = await driver.getCurrentSchema();

    expect(schema).toBe("dbo");
  });

  test("should get schemas", async () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    const schemas = await driver.schemas();

    expect(typeof schemas).toBe("object");
    expect(schemas["dbo"]).toBeDefined();
    expect(schemas["test_schema"]).toBeDefined();
    expect(Array.isArray(schemas["dbo"])).toBe(true);
  });

  test("should get table schema", async () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    const tableSchema = await driver.tableSchema("dbo", "users");

    expect(tableSchema.schemaName).toBe("dbo");
    expect(tableSchema.tableName).toBe("users");
    expect(Array.isArray(tableSchema.columns)).toBe(true);
    expect(tableSchema.columns.length).toBe(2);
    
    const idColumn = tableSchema.columns.find(c => c.name === "id");
    const nameColumn = tableSchema.columns.find(c => c.name === "name");
    
    expect(idColumn).toBeDefined();
    expect(idColumn?.type).toBe("int");
    expect(idColumn?.constraint?.autoIncrement).toBe(true);
    expect(idColumn?.constraint?.notNull).toBe(true);
    
    expect(nameColumn).toBeDefined();
    expect(nameColumn?.type).toBe("nvarchar");
    expect(nameColumn?.constraint?.autoIncrement).toBe(false);
    expect(nameColumn?.constraint?.notNull).toBe(false);
  });

  test("should have column type selector", () => {
    const mockQueryable = new MockMSSQLQueryable();
    const driver = new MSSQLDriver(mockQueryable);
    const selector = driver.columnTypeSelector;

    expect(selector.type).toBe("text");
    expect(selector.idTypeName).toBe("INT");
    expect(selector.textTypeName).toBe("NVARCHAR(255)");
    expect(Array.isArray(selector.typeSuggestions)).toBe(true);
    expect(selector.typeSuggestions.length).toBeGreaterThan(0);
  });
});