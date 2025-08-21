import { DatabaseTableSchemaChange } from "../base-driver";
import MSSQLDriver from "./mssql-driver";

export function generateMSSQLSchemaChange(
  driver: MSSQLDriver,
  change: DatabaseTableSchemaChange
): string[] {
  const statements: string[] = [];

  // For now, implement basic schema change operations
  // This can be expanded to support more complex operations

  if (change.name.new && change.name.old) {
    // Rename table
    statements.push(
      `EXEC sp_rename '${driver.escapeId(change.schemaName || "dbo")}.${driver.escapeId(change.name.old)}', '${change.name.new}'`
    );
  }

  // Add columns
  for (const columnChange of change.columns) {
    if (!columnChange.old && columnChange.new) {
      const column = columnChange.new;
      let columnDef = `${driver.escapeId(column.name)} ${column.type}`;
      
      if (column.constraint?.notNull) {
        columnDef += " NOT NULL";
      }
      
      if (column.constraint?.defaultValue) {
        columnDef += ` DEFAULT ${column.constraint.defaultValue}`;
      }

      statements.push(
        `ALTER TABLE ${driver.escapeId(change.schemaName || "dbo")}.${driver.escapeId(change.name.new || change.name.old || "")} ADD ${columnDef}`
      );
    }
  }

  // Drop columns
  for (const columnChange of change.columns) {
    if (columnChange.old && !columnChange.new) {
      statements.push(
        `ALTER TABLE ${driver.escapeId(change.schemaName || "dbo")}.${driver.escapeId(change.name.new || change.name.old || "")} DROP COLUMN ${driver.escapeId(columnChange.old.name)}`
      );
    }
  }

  // Modify columns (basic implementation)
  for (const columnChange of change.columns) {
    if (columnChange.old && columnChange.new && columnChange.old.name === columnChange.new.name) {
      const column = columnChange.new;
      let columnDef = `${driver.escapeId(column.name)} ${column.type}`;
      
      if (column.constraint?.notNull) {
        columnDef += " NOT NULL";
      }

      statements.push(
        `ALTER TABLE ${driver.escapeId(change.schemaName || "dbo")}.${driver.escapeId(change.name.new || change.name.old || "")} ALTER COLUMN ${columnDef}`
      );
    }
  }

  return statements;
}