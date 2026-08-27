import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Create mock DB objects if no database URL is provided
let pool: Pool | null = null;
let db: any = null;

// Check if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.warn("Running with limited functionality - some features will be disabled");
  }
} else {
  console.warn("DATABASE_URL not provided. Running with limited functionality.");
  console.warn("Some features requiring database access will be disabled.");
  
  // Create mock db object that returns empty data or throws specific errors
  db = new Proxy({}, {
    get: (target, prop) => {
      // Return a function that handles common drizzle operations
      return (...args: any[]) => {
        console.warn(`Database operation '${String(prop)}' attempted without database connection`);
        
        // For select operations, return empty array
        if (String(prop) === 'select') {
          return Promise.resolve([]);
        }
        
        // For other operations, return null or empty result
        if (['insert', 'update', 'delete'].includes(String(prop))) {
          return Promise.resolve(null);
        }
        
        // For any other operation
        return Promise.resolve(null);
      };
    }
  });
}

export { pool, db };
