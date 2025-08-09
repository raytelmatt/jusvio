import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  deleteSession,
  getCurrentUser,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { handleClientPortalLookup, handleClientPortalData } from "./client-portal-routes";
import r2Routes from "./r2-routes";
import emailWebhook from "./email-webhook";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Create a separate app for API routes with basePath
const apiApp = new Hono<{ Bindings: Env }>().basePath("/api");

// CORS middleware for both apps
app.use("*", cors({
  origin: ["https://jusivo.mocha.app", "http://localhost:5173"],
  credentials: true,
}));

apiApp.use("*", cors({
  origin: ["https://jusivo.mocha.app", "http://localhost:5173"],
  credentials: true,
}));

// Custom auth middleware that properly handles environment configuration
const createAuthMiddleware = () => {
  return async (c: any, next: any) => {
    // DEV MODE: bypass external auth for local testing
    if (c.env && (c.env as Env) && (c.env as any).MOCK_AUTH === "true") {
      const mockUser = {
        id: "dev-user",
        email: "dev@example.com",
        google_user_data: {
          given_name: "Dev",
          family_name: "User",
          email: "dev@example.com",
        },
      };
      c.set("user", mockUser);
      return next();
    }
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    
    if (!sessionToken) {
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!c.env.MOCHA_USERS_SERVICE_API_URL || !c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({ error: "Authentication service not configured" }, 500);
    }

    try {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });

      if (!user) {
        return c.json({ error: "Invalid session" }, 401);
      }

      c.set("user", user);
      return next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return c.json({ error: "Authentication failed" }, 401);
    }
  };
};

const customAuthMiddleware = createAuthMiddleware();

// Helper function to get the proper public domain
function getPublicDomain(_request: Request): string {
  return 'jusivo.mocha.app';
}

// Auth endpoints must be at root level to match SDK expectations
app.get("/api/oauth/google/redirect_url", async (c) => {
  try {
    // DEV MODE: return a placeholder URL
    if ((c.env as any).MOCK_AUTH === "true") {
      return c.json({ redirectUrl: "/login" }, 200);
    }
    if (!c.env.MOCHA_USERS_SERVICE_API_URL || !c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({ 
        error: "Authentication service not configured",
        details: "Missing API URL or API Key"
      }, 500);
    }

    const redirectUrl = await getOAuthRedirectUrl('google', {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    return c.json({ redirectUrl }, 200);
  } catch (error) {
    return c.json({ 
      error: "Failed to get OAuth redirect URL", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post("/api/sessions", async (c) => {
  try {
    // DEV MODE: set a non-secure cookie for localhost
    if ((c.env as any).MOCK_AUTH === "true") {
      setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "dev-session", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: 60 * 24 * 60 * 60,
      });
      return c.json({ success: true }, 200);
    }
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    if (!c.env.MOCHA_USERS_SERVICE_API_URL || !c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({ 
        error: "Authentication service not configured properly",
        details: "Missing API URL or API Key"
      }, 500);
    }

    console.log("Session creation attempt with code:", body.code.substring(0, 10) + "...");
    
    try {
      const sessionToken = await exchangeCodeForSessionToken(body.code, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });

      console.log("Session token created successfully");

      setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true,
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });

      return c.json({ success: true }, 200);
    } catch (exchangeError) {
      console.log("Session creation error:", exchangeError);
      console.log("Error details:", {
        message: exchangeError instanceof Error ? exchangeError.message : 'Unknown error',
        stack: exchangeError instanceof Error ? exchangeError.stack : 'No stack trace',
        name: exchangeError instanceof Error ? exchangeError.name : 'Unknown'
      });
      throw exchangeError;
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Bad Request') || error.message.includes('400'))) {
      const calculatedRedirectUri = `https://${getPublicDomain(c.req.raw)}/auth/callback`;
      return c.json({ 
        error: "OAuth authorization failed", 
        details: "The authorization code may be invalid, expired, or the redirect URI doesn't match. Please try signing in again.",
        technical_details: error.message,
        help: "This usually happens when the OAuth flow is interrupted or the page is refreshed. Please close this tab and try signing in again from the main login page.",
        debug_info: {
          calculatedRedirectUri: calculatedRedirectUri,
          originalHost: new URL(c.req.url).host
        }
      }, 400);
    }
    
    return c.json({ 
      error: "Authentication failed", 
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, 500);
  }
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", async (c) => {
  // Custom auth middleware with proper environment config
  // DEV MODE: Return mock user and ensure profile exists
  if ((c.env as any).MOCK_AUTH === "true") {
    try {
      // Ensure DB is reachable
      await c.env.DB.prepare("SELECT 1").first();

      const mockUser = {
        id: "dev-user",
        email: "dev@example.com",
        google_user_data: { given_name: "Dev", family_name: "User" },
      };

      let profile = await c.env.DB.prepare(
        "SELECT * FROM user_profiles WHERE user_id = ?"
      ).bind(mockUser.id).first();

      if (!profile) {
        const result = await c.env.DB.prepare(
          `INSERT INTO user_profiles (user_id, first_name, last_name, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).bind(mockUser.id, "Dev", "User", "Attorney").run();

        profile = await c.env.DB.prepare(
          "SELECT * FROM user_profiles WHERE id = ?"
        ).bind(result.meta?.last_row_id).first();
      }

      return c.json({ user: mockUser, profile }, 200);
    } catch (err) {
      return c.json({ error: "Database connection failed", details: err instanceof Error ? err.message : "Unknown error" }, 500);
    }
  }

  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (!sessionToken) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const user = await getCurrentUser(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    if (!user) {
      return c.json({ error: "Invalid session" }, 401);
    }

    // Check if database exists and is accessible
    try {
      await c.env.DB.prepare("SELECT 1").first();
    } catch (dbError) {
      return c.json({ 
        error: "Database connection failed", 
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, 500);
    }
    
    // Get or create user profile based on the authenticated Mocha user
    let profile = null;
    
    try {
      profile = await c.env.DB.prepare(
        "SELECT * FROM user_profiles WHERE user_id = ?"
      ).bind(user.id).first();
    } catch (profileError) {
      return c.json({ 
        error: "Profile query failed", 
        details: profileError instanceof Error ? profileError.message : 'Unknown profile error'
      }, 500);
    }

    if (!profile) {
      try {
        // Create default profile for new users
        const result = await c.env.DB.prepare(`
          INSERT INTO user_profiles (user_id, first_name, last_name, role, is_active) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          user.id,
          user.google_user_data?.given_name || '',
          user.google_user_data?.family_name || '',
          'Attorney', // Default role - can be changed in user management
          1
        ).run();
        
        profile = await c.env.DB.prepare(
          "SELECT * FROM user_profiles WHERE id = ?"
        ).bind(result.meta?.last_row_id).first();
      } catch (createError) {
        return c.json({ 
          error: "Failed to create user profile", 
          details: createError instanceof Error ? createError.message : 'Unknown creation error'
        }, 500);
      }
    }

    return c.json({ user, profile });
    
  } catch (error) {
    return c.json({ 
      error: "Authentication failed", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Health check
app.get("/health", async (c) => {
  try {
    // Test database connection
    const result = await c.env.DB.prepare("SELECT 1").first();
    return c.json({ 
      status: "healthy", 
      database: result ? "connected" : "disconnected",
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

app.get("/api/health", async (c) => {
  try {
    // Test database connection
    const result = await c.env.DB.prepare("SELECT 1").first();
    return c.json({ 
      status: "healthy", 
      database: result ? "connected" : "disconnected",
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});

// Clients CRUD
apiApp.get("/clients", customAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM clients 
      ORDER BY created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

apiApp.get("/clients/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const result = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(id).first();
    
    if (!result) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

apiApp.post("/clients", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { first_name, last_name, email, phones, address, emergency_contact, preferred_contact_method, date_of_birth, ssn_last4 } = body;
    
    // Generate client number
    const clientCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM clients").first();
    const count = (clientCount as any)?.count || 0;
    const clientNumber = `CL${String(count + 1).padStart(4, '0')}`;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (
        client_number, first_name, last_name, email, phones, address, 
        emergency_contact, preferred_contact_method, date_of_birth, ssn_last4,
        notifications_opt_in, portal_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      clientNumber, first_name, last_name, email, 
      phones ? JSON.stringify(phones) : null,
      address ? JSON.stringify(address) : null,
      emergency_contact ? JSON.stringify(emergency_contact) : null,
      preferred_contact_method, date_of_birth, ssn_last4, true, false
    ).run();
    
    if (result.success) {
      const newClient = await c.env.DB.prepare(`
        SELECT * FROM clients WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newClient);
    } else {
      return c.json({ error: "Failed to create client" }, 500);
    }
  } catch (error) {
    console.error("Error creating client:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

apiApp.put("/clients/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { first_name, last_name, email, phones, address, emergency_contact, preferred_contact_method, date_of_birth, ssn_last4, portal_enabled, notifications_opt_in } = body;
    
    const result = await c.env.DB.prepare(`
      UPDATE clients SET 
        first_name = ?, last_name = ?, email = ?, phones = ?, address = ?,
        emergency_contact = ?, preferred_contact_method = ?, date_of_birth = ?, ssn_last4 = ?,
        portal_enabled = ?, notifications_opt_in = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      first_name, last_name, email,
      phones ? JSON.stringify(phones) : null,
      address ? JSON.stringify(address) : null,
      emergency_contact ? JSON.stringify(emergency_contact) : null,
      preferred_contact_method, date_of_birth, ssn_last4,
      portal_enabled, notifications_opt_in, id
    ).run();
    
    if (result.success) {
      const updatedClient = await c.env.DB.prepare(`
        SELECT * FROM clients WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedClient);
    } else {
      return c.json({ error: "Failed to update client" }, 500);
    }
  } catch (error) {
    console.error("Error updating client:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

apiApp.delete("/clients/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if client has matters
    const matters = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM matters WHERE client_id = ?
    `).bind(id).first();
    
    if (matters && (matters as any).count > 0) {
      return c.json({ error: "Cannot delete client with active matters" }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      DELETE FROM clients WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      return c.json({ message: "Client deleted successfully" });
    } else {
      return c.json({ error: "Failed to delete client" }, 500);
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// Matters CRUD
apiApp.get("/matters", customAuthMiddleware, async (c) => {
  try {
    const client_id = c.req.query("client_id");
    const practice_area = c.req.query("practice_area");
    const status = c.req.query("status");
    
    let query = `
      SELECT m.*, c.first_name as client_first_name, c.last_name as client_last_name, c.email as client_email
      FROM matters m
      LEFT JOIN clients c ON m.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (client_id) {
      query += " AND m.client_id = ?";
      params.push(client_id);
    }
    
    if (practice_area) {
      query += " AND m.practice_area = ?";
      params.push(practice_area);
    }
    
    if (status) {
      query += " AND m.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY m.created_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching matters:", error);
    return c.json({ error: "Failed to fetch matters" }, 500);
  }
});

apiApp.get("/matters/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const result = await c.env.DB.prepare(`
      SELECT m.*, c.first_name as client_first_name, c.last_name as client_last_name, c.email as client_email
      FROM matters m
      LEFT JOIN clients c ON m.client_id = c.id
      WHERE m.id = ?
    `).bind(id).first();
    
    if (!result) {
      return c.json({ error: "Matter not found" }, 404);
    }
    
    // Get criminal case data if it exists
    const criminalCase = await c.env.DB.prepare(`
      SELECT * FROM criminal_cases WHERE matter_id = ?
    `).bind(id).first();
    
    if (criminalCase) {
      (result as any).case_data = criminalCase;
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Error fetching matter:", error);
    return c.json({ error: "Failed to fetch matter" }, 500);
  }
});

apiApp.post("/matters", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, title, practice_area, description, fee_model, flat_rate_amount } = body;
    
    // Generate matter number
    const matterCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM matters").first();
    const count = (matterCount as any)?.count || 0;
    const matterNumber = `${practice_area}${String(count + 1).padStart(4, '0')}`;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO matters (
        matter_number, title, practice_area, status, client_id,
        description, fee_model, flat_rate_amount, opened_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      matterNumber, title, practice_area, 'Open', client_id,
      description, fee_model, flat_rate_amount
    ).run();
    
    if (result.success) {
      const newMatter = await c.env.DB.prepare(`
        SELECT m.*, c.first_name as client_first_name, c.last_name as client_last_name, c.email as client_email
        FROM matters m
        LEFT JOIN clients c ON m.client_id = c.id
        WHERE m.id = ?
      `).bind(result.meta?.last_row_id).first();
      
      // Create criminal case record if practice area is Criminal
      if (practice_area === 'Criminal') {
        await c.env.DB.prepare(`
          INSERT INTO criminal_cases (matter_id, created_at, updated_at)
          VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(result.meta?.last_row_id).run();
      }
      
      return c.json(newMatter);
    } else {
      return c.json({ error: "Failed to create matter" }, 500);
    }
  } catch (error) {
    console.error("Error creating matter:", error);
    return c.json({ error: "Failed to create matter" }, 500);
  }
});

// Dashboard stats
apiApp.get("/dashboard/stats", customAuthMiddleware, async (c) => {
  try {
    const [
      criminalMatters,
      personalInjuryMatters, 
      ssdMatters,
      upcomingHearings,
      deadlines7Days,
      deadlines30Days,
      unpaidInvoices,
      portalMessages
    ] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM matters WHERE practice_area = 'Criminal' AND status = 'Open'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM matters WHERE practice_area = 'PersonalInjury' AND status = 'Open'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM matters WHERE practice_area = 'SSD' AND status = 'Open'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM hearings WHERE start_at > datetime('now') AND start_at <= datetime('now', '+7 days')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM deadlines WHERE due_at > datetime('now') AND due_at <= datetime('now', '+7 days') AND status != 'Completed'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM deadlines WHERE due_at > datetime('now') AND due_at <= datetime('now', '+30 days') AND status != 'Completed'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM invoices WHERE status IN ('Sent', 'Overdue')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM communications WHERE channel = 'Portal' AND created_at > datetime('now', '-7 days')").first()
    ]);

    return c.json({
      open_matters_by_practice: {
        Criminal: criminalMatters?.count || 0,
        PersonalInjury: personalInjuryMatters?.count || 0,
        SSD: ssdMatters?.count || 0,
      },
      upcoming_hearings: upcomingHearings?.count || 0,
      deadlines_7_days: deadlines7Days?.count || 0,
      deadlines_30_days: deadlines30Days?.count || 0,
      unpaid_invoices: unpaidInvoices?.count || 0,
      new_portal_messages: portalMessages?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return c.json({ error: "Failed to fetch dashboard stats" }, 500);
  }
});

// Time entries
apiApp.get("/time-entries", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM time_entries";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY entry_date DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return c.json({ error: "Failed to fetch time entries" }, 500);
  }
});

// Documents
apiApp.get("/documents", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM documents";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

apiApp.delete("/documents/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(`
      DELETE FROM documents WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      return c.json({ message: "Document deleted successfully" });
    } else {
      return c.json({ error: "Failed to delete document" }, 500);
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

// Hearings
apiApp.get("/hearings", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM hearings";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY start_at ASC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching hearings:", error);
    return c.json({ error: "Failed to fetch hearings" }, 500);
  }
});

apiApp.post("/hearings", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { matter_id, hearing_type, start_at, end_at, courtroom, judge_or_alj, notes, is_ssa_hearing } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO hearings (
        matter_id, hearing_type, start_at, end_at, courtroom, 
        judge_or_alj, notes, is_ssa_hearing, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      matter_id, hearing_type, start_at, end_at, courtroom,
      judge_or_alj, notes, is_ssa_hearing || false
    ).run();
    
    if (result.success) {
      const newHearing = await c.env.DB.prepare(`
        SELECT * FROM hearings WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newHearing);
    } else {
      return c.json({ error: "Failed to create hearing" }, 500);
    }
  } catch (error) {
    console.error("Error creating hearing:", error);
    return c.json({ error: "Failed to create hearing" }, 500);
  }
});

apiApp.put("/hearings/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { hearing_type, start_at, end_at, courtroom, judge_or_alj, notes, is_ssa_hearing } = body;
    
    const result = await c.env.DB.prepare(`
      UPDATE hearings SET 
        hearing_type = ?, start_at = ?, end_at = ?, courtroom = ?,
        judge_or_alj = ?, notes = ?, is_ssa_hearing = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      hearing_type, start_at, end_at, courtroom,
      judge_or_alj, notes, is_ssa_hearing || false, id
    ).run();
    
    if (result.success) {
      const updatedHearing = await c.env.DB.prepare(`
        SELECT * FROM hearings WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedHearing);
    } else {
      return c.json({ error: "Failed to update hearing" }, 500);
    }
  } catch (error) {
    console.error("Error updating hearing:", error);
    return c.json({ error: "Failed to update hearing" }, 500);
  }
});

apiApp.delete("/hearings/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(`
      DELETE FROM hearings WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      return c.json({ message: "Hearing deleted successfully" });
    } else {
      return c.json({ error: "Failed to delete hearing" }, 500);
    }
  } catch (error) {
    console.error("Error deleting hearing:", error);
    return c.json({ error: "Failed to delete hearing" }, 500);
  }
});

// Deadlines
apiApp.get("/deadlines", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM deadlines";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY due_at ASC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return c.json({ error: "Failed to fetch deadlines" }, 500);
  }
});

apiApp.post("/deadlines", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { matter_id, title, source, due_at, trigger_event_id } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO deadlines (
        matter_id, title, source, due_at, trigger_event_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(matter_id, title, source, due_at, trigger_event_id).run();
    
    if (result.success) {
      const newDeadline = await c.env.DB.prepare(`
        SELECT * FROM deadlines WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newDeadline);
    } else {
      return c.json({ error: "Failed to create deadline" }, 500);
    }
  } catch (error) {
    console.error("Error creating deadline:", error);
    return c.json({ error: "Failed to create deadline" }, 500);
  }
});

// Communications
apiApp.get("/communications", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM communications";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching communications:", error);
    return c.json({ error: "Failed to fetch communications" }, 500);
  }
});

// Tasks
apiApp.get("/tasks", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = `
      SELECT t.*, 
             CASE 
               WHEN t.due_at IS NULL THEN NULL
               ELSE CAST((julianday(t.due_at) - julianday('now')) AS INTEGER)
             END as days_until_due
      FROM tasks t
    `;
    const params = [];
    
    if (matter_id) {
      query += " WHERE t.matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY t.created_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

apiApp.post("/tasks", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { matter_id, title, description, due_at, priority, status } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (
        matter_id, title, description, due_at, priority, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(matter_id, title, description, due_at, priority || 'Medium', status || 'Open').run();
    
    if (result.success) {
      const newTask = await c.env.DB.prepare(`
        SELECT *, 
               CASE 
                 WHEN due_at IS NULL THEN NULL
                 ELSE CAST((julianday(due_at) - julianday('now')) AS INTEGER)
               END as days_until_due
        FROM tasks WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newTask);
    } else {
      return c.json({ error: "Failed to create task" }, 500);
    }
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ error: "Failed to create task" }, 500);
  }
});

apiApp.put("/tasks/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { title, description, due_at, priority, status } = body;
    
    const result = await c.env.DB.prepare(`
      UPDATE tasks SET 
        title = ?, description = ?, due_at = ?, priority = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, description, due_at, priority, status, id).run();
    
    if (result.success) {
      const updatedTask = await c.env.DB.prepare(`
        SELECT *, 
               CASE 
                 WHEN due_at IS NULL THEN NULL
                 ELSE CAST((julianday(due_at) - julianday('now')) AS INTEGER)
               END as days_until_due
        FROM tasks WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedTask);
    } else {
      return c.json({ error: "Failed to update task" }, 500);
    }
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json({ error: "Failed to update task" }, 500);
  }
});

apiApp.post("/tasks/:id/complete", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(`
      UPDATE tasks SET 
        status = 'Completed', completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      const updatedTask = await c.env.DB.prepare(`
        SELECT *, 
               CASE 
                 WHEN due_at IS NULL THEN NULL
                 ELSE CAST((julianday(due_at) - julianday('now')) AS INTEGER)
               END as days_until_due
        FROM tasks WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedTask);
    } else {
      return c.json({ error: "Failed to complete task" }, 500);
    }
  } catch (error) {
    console.error("Error completing task:", error);
    return c.json({ error: "Failed to complete task" }, 500);
  }
});

apiApp.delete("/tasks/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(`
      DELETE FROM tasks WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      return c.json({ message: "Task deleted successfully" });
    } else {
      return c.json({ error: "Failed to delete task" }, 500);
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ error: "Failed to delete task" }, 500);
  }
});

// Invoices
apiApp.get("/invoices", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = "SELECT * FROM invoices";
    const params = [];
    
    if (matter_id) {
      query += " WHERE matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return c.json({ error: "Failed to fetch invoices" }, 500);
  }
});

// Payments
apiApp.get("/payments", customAuthMiddleware, async (c) => {
  const matter_id = c.req.query("matter_id");
  
  try {
    let query = `
      SELECT p.*, i.invoice_number, i.matter_id, m.title as matter_title
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN matters m ON i.matter_id = m.id
    `;
    const params = [];
    
    if (matter_id) {
      query += " WHERE i.matter_id = ?";
      params.push(matter_id);
    }
    
    query += " ORDER BY p.received_at DESC";
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return c.json({ error: "Failed to fetch payments" }, 500);
  }
});

// Client balances
apiApp.get("/clients/:id/balance", customAuthMiddleware, async (c) => {
  try {
    const client_id = c.req.param("id");
    
    // Get total invoiced amount for client
    const totalInvoicedResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(i.total), 0) as total_invoiced
      FROM invoices i
      JOIN matters m ON i.matter_id = m.id
      WHERE m.client_id = ?
    `).bind(client_id).first();
    
    // Get total paid amount for client
    const totalPaidResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total_paid
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN matters m ON i.matter_id = m.id
      WHERE m.client_id = ?
    `).bind(client_id).first();
    
    const totalInvoiced = (totalInvoicedResult as any)?.total_invoiced || 0;
    const totalPaid = (totalPaidResult as any)?.total_paid || 0;
    const totalBalance = totalInvoiced - totalPaid;
    
    // Get balance by matter
    const matterBalances = await c.env.DB.prepare(`
      SELECT 
        m.id as matter_id,
        m.matter_number,
        m.title as matter_title,
        COALESCE(SUM(i.total), 0) as total_invoiced,
        COALESCE(SUM(p.amount), 0) as total_paid,
        COALESCE(SUM(i.total), 0) - COALESCE(SUM(p.amount), 0) as balance
      FROM matters m
      LEFT JOIN invoices i ON m.id = i.matter_id
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE m.client_id = ?
      GROUP BY m.id, m.matter_number, m.title
      HAVING total_invoiced > 0 OR total_paid > 0
    `).bind(client_id).all();
    
    // Get recent invoices
    const recentInvoices = await c.env.DB.prepare(`
      SELECT i.*, m.title as matter_title
      FROM invoices i
      JOIN matters m ON i.matter_id = m.id
      WHERE m.client_id = ?
      ORDER BY i.created_at DESC
      LIMIT 10
    `).bind(client_id).all();
    
    // Get recent payments
    const recentPayments = await c.env.DB.prepare(`
      SELECT p.*, i.invoice_number, m.title as matter_title
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN matters m ON i.matter_id = m.id
      WHERE m.client_id = ?
      ORDER BY p.received_at DESC
      LIMIT 10
    `).bind(client_id).all();
    
    return c.json({
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_balance: totalBalance,
      matter_balances: matterBalances.results || [],
      recent_invoices: recentInvoices.results || [],
      recent_payments: recentPayments.results || []
    });
  } catch (error) {
    console.error("Error fetching client balance:", error);
    return c.json({ error: "Failed to fetch client balance" }, 500);
  }
});

// Matter balance
apiApp.get("/matters/:id/balance", customAuthMiddleware, async (c) => {
  try {
    const matter_id = c.req.param("id");
    
    const [totalInvoiced, totalPaid, unbilledTime] = await Promise.all([
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(total), 0) as amount FROM invoices WHERE matter_id = ?
      `).bind(matter_id).first(),
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as amount
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.matter_id = ?
      `).bind(matter_id).first(),
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(hours * rate), 0) as amount
        FROM time_entries
        WHERE matter_id = ? AND invoice_id IS NULL
      `).bind(matter_id).first()
    ]);
    
    const totalInvoicedAmount = (totalInvoiced as any)?.amount || 0;
    const totalPaidAmount = (totalPaid as any)?.amount || 0;
    const unbilledAmount = (unbilledTime as any)?.amount || 0;
    const currentBalance = totalInvoicedAmount - totalPaidAmount;
    const totalAmountDue = currentBalance + unbilledAmount;
    
    return c.json({
      total_invoiced: totalInvoicedAmount,
      total_paid: totalPaidAmount,
      current_balance: currentBalance,
      unbilled_amount: unbilledAmount,
      total_amount_due: totalAmountDue
    });
  } catch (error) {
    console.error("Error fetching matter balance:", error);
    return c.json({ error: "Failed to fetch matter balance" }, 500);
  }
});

// Criminal case data
apiApp.put("/matters/:id/criminal", customAuthMiddleware, async (c) => {
  try {
    const matter_id = c.req.param("id");
    const body = await c.req.json();
    const { charges, statutes, case_number, jurisdiction, arrest_date, bond_terms, probation_terms, plea_offers, discovery_received_at, evidence_items } = body;
    
    // Check if criminal case exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM criminal_cases WHERE matter_id = ?
    `).bind(matter_id).first();
    
    if (existing) {
      // Update existing
      const result = await c.env.DB.prepare(`
        UPDATE criminal_cases SET 
          charges = ?, statutes = ?, case_number = ?, jurisdiction = ?, arrest_date = ?,
          bond_terms = ?, probation_terms = ?, plea_offers = ?, discovery_received_at = ?,
          evidence_items = ?, updated_at = CURRENT_TIMESTAMP
        WHERE matter_id = ?
      `).bind(
        charges ? JSON.stringify(charges) : null,
        statutes ? JSON.stringify(statutes) : null,
        case_number, jurisdiction, arrest_date, bond_terms, probation_terms,
        plea_offers ? JSON.stringify(plea_offers) : null,
        discovery_received_at,
        evidence_items ? JSON.stringify(evidence_items) : null,
        matter_id
      ).run();
      
      if (result.success) {
        const updatedCase = await c.env.DB.prepare(`
          SELECT * FROM criminal_cases WHERE matter_id = ?
        `).bind(matter_id).first();
        
        return c.json(updatedCase);
      }
    } else {
      // Create new
      const result = await c.env.DB.prepare(`
        INSERT INTO criminal_cases (
          matter_id, charges, statutes, case_number, jurisdiction, arrest_date,
          bond_terms, probation_terms, plea_offers, discovery_received_at,
          evidence_items, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        matter_id,
        charges ? JSON.stringify(charges) : null,
        statutes ? JSON.stringify(statutes) : null,
        case_number, jurisdiction, arrest_date, bond_terms, probation_terms,
        plea_offers ? JSON.stringify(plea_offers) : null,
        discovery_received_at,
        evidence_items ? JSON.stringify(evidence_items) : null
      ).run();
      
      if (result.success) {
        const newCase = await c.env.DB.prepare(`
          SELECT * FROM criminal_cases WHERE id = ?
        `).bind(result.meta?.last_row_id).first();
        
        return c.json(newCase);
      }
    }
    
    return c.json({ error: "Failed to update criminal case data" }, 500);
  } catch (error) {
    console.error("Error updating criminal case:", error);
    return c.json({ error: "Failed to update criminal case data" }, 500);
  }
});

// User Profile Management
apiApp.get("/user-profile", customAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    const profile = await c.env.DB.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `).bind(user.id).first();
    
    if (!profile) {
      return c.json({
        first_name: user.google_user_data?.given_name || '',
        last_name: user.google_user_data?.family_name || '',
        role: 'Attorney',
        practice_areas: [],
        phone: '',
        bar_number: ''
      });
    }
    
    return c.json({
      ...profile,
      practice_areas: profile.practice_areas && typeof profile.practice_areas === 'string' ? JSON.parse(profile.practice_areas) : []
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return c.json({ error: "Failed to fetch user profile" }, 500);
  }
});

apiApp.put("/user-profile", customAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    const body = await c.req.json();
    const { first_name, last_name, role, bar_number, practice_areas, phone } = body;
    
    // Check if profile exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_profiles WHERE user_id = ?
    `).bind(user.id).first();
    
    if (existing) {
      // Update existing profile
      const result = await c.env.DB.prepare(`
        UPDATE user_profiles SET 
          first_name = ?, last_name = ?, role = ?, bar_number = ?, 
          practice_areas = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        first_name, last_name, role, bar_number, 
        typeof practice_areas === 'string' ? practice_areas : JSON.stringify(practice_areas), phone, user.id
      ).run();
      
      if (result.success) {
        const updatedProfile = await c.env.DB.prepare(`
          SELECT * FROM user_profiles WHERE user_id = ?
        `).bind(user.id).first();
        
        return c.json(updatedProfile);
      }
    } else {
      // Create new profile
      const result = await c.env.DB.prepare(`
        INSERT INTO user_profiles (
          user_id, first_name, last_name, role, bar_number, 
          practice_areas, phone, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        user.id, first_name, last_name, role, bar_number,
        typeof practice_areas === 'string' ? practice_areas : JSON.stringify(practice_areas), phone, true
      ).run();
      
      if (result.success) {
        const newProfile = await c.env.DB.prepare(`
          SELECT * FROM user_profiles WHERE id = ?
        `).bind(result.meta?.last_row_id).first();
        
        return c.json(newProfile);
      }
    }
    
    return c.json({ error: "Failed to save user profile" }, 500);
  } catch (error) {
    console.error("Error saving user profile:", error);
    return c.json({ error: "Failed to save user profile" }, 500);
  }
});

// User Management (Admin only)
apiApp.get("/users", customAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM user_profiles 
      ORDER BY created_at DESC
    `).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

apiApp.post("/users", customAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { first_name, last_name, email, role, bar_number, practice_areas, phone, is_active } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO user_profiles (
        user_id, first_name, last_name, role, bar_number, 
        practice_areas, phone, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      email || '', first_name, last_name, role, bar_number,
      practice_areas ? (typeof practice_areas === 'string' ? practice_areas : JSON.stringify(practice_areas)) : JSON.stringify([]), phone, is_active
    ).run();
    
    if (result.success) {
      const newUser = await c.env.DB.prepare(`
        SELECT * FROM user_profiles WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newUser);
    } else {
      return c.json({ error: "Failed to create user" }, 500);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

apiApp.put("/users/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { first_name, last_name, role, bar_number, practice_areas, phone, is_active } = body;
    
    const result = await c.env.DB.prepare(`
      UPDATE user_profiles SET 
        first_name = ?, last_name = ?, role = ?, bar_number = ?, 
        practice_areas = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      first_name, last_name, role, bar_number, 
      typeof practice_areas === 'string' ? practice_areas : JSON.stringify(practice_areas), phone, is_active, id
    ).run();
    
    if (result.success) {
      const updatedUser = await c.env.DB.prepare(`
        SELECT * FROM user_profiles WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedUser);
    } else {
      return c.json({ error: "Failed to update user" }, 500);
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

apiApp.delete("/users/:id", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(`
      DELETE FROM user_profiles WHERE id = ?
    `).bind(id).run();
    
    if (result.success) {
      return c.json({ message: "User deleted successfully" });
    } else {
      return c.json({ error: "Failed to delete user" }, 500);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

apiApp.put("/users/:id/status", customAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { is_active } = body;
    
    const result = await c.env.DB.prepare(`
      UPDATE user_profiles SET 
        is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(is_active, id).run();
    
    if (result.success) {
      const updatedUser = await c.env.DB.prepare(`
        SELECT * FROM user_profiles WHERE id = ?
      `).bind(id).first();
      
      return c.json(updatedUser);
    } else {
      return c.json({ error: "Failed to update user status" }, 500);
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    return c.json({ error: "Failed to update user status" }, 500);
  }
});

// Time Entry Management
apiApp.post("/time-entries", customAuthMiddleware, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    const body = await c.req.json();
    const { matter_id, entry_date, hours, rate, description } = body;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO time_entries (
        matter_id, user_id, entry_date, hours, rate, description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(matter_id, user.id, entry_date, hours, rate, description).run();
    
    if (result.success) {
      const newTimeEntry = await c.env.DB.prepare(`
        SELECT * FROM time_entries WHERE id = ?
      `).bind(result.meta?.last_row_id).first();
      
      return c.json(newTimeEntry);
    } else {
      return c.json({ error: "Failed to create time entry" }, 500);
    }
  } catch (error) {
    console.error("Error creating time entry:", error);
    return c.json({ error: "Failed to create time entry" }, 500);
  }
});

// Notification count
apiApp.get("/notifications/count", customAuthMiddleware, async (c) => {
  try {
    // For now, return a mock count - in a real app this would check user-specific notifications
    return c.json({ unread_count: 0 });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return c.json({ error: "Failed to fetch notification count" }, 500);
  }
});

// Client Portal routes (public endpoints)
app.get("/api/client-portal/lookup", handleClientPortalLookup);
app.get("/api/client-portal/:clientId", handleClientPortalData);

// R2 file routes and email webhooks
app.route("/", r2Routes);
app.route("/", emailWebhook);

// Create criminal intake (public endpoint)
app.post('/api/criminal-intake', async (c) => {
  try {
    const intakeData = await c.req.json();
    
    // Store the intake data
    const stmt = c.env.DB.prepare(`
      INSERT INTO criminal_intakes (
        intake_data, 
        urgency_level, 
        created_at, 
        updated_at
      ) VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(
      JSON.stringify(intakeData),
      intakeData.urgency_level || 'High'
    ).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Criminal intake submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating criminal intake:', error);
    return c.json({ error: 'Failed to submit intake' }, 500);
  }
});

// Create general intake (public endpoint)
app.post('/api/intakes', async (c) => {
  try {
    const intakeData = await c.req.json();
    
    // Store the intake data
    const stmt = c.env.DB.prepare(`
      INSERT INTO intakes (
        intake_data, 
        urgency_level, 
        created_at, 
        updated_at
      ) VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(
      JSON.stringify(intakeData),
      intakeData.urgency_level || 'Medium'
    ).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Intake submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating intake:', error);
    return c.json({ error: 'Failed to submit intake' }, 500);
  }
});

// Mount the API app - this ensures all /api routes are properly handled
app.route("/", apiApp);

// Export as both named and default export to ensure compatibility
export { app };
export default {
  fetch: app.fetch,
  scheduled: undefined,
  queue: undefined,
};
