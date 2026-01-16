
import { neon } from '@neondatabase/serverless';

export const handler = async (event: any) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL is missing from environment variables.');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Server Configuration Error: DATABASE_URL not set in hosting provider.' }) 
    };
  }

  const sql = neon(dbUrl);
  const { httpMethod } = event;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // 1. AUTHENTICATION ROUTE
    if (httpMethod === 'POST' && body.action === 'auth') {
      const { mode, username, email, password } = body;

      if (mode === 'signup') {
        // Create new user
        await sql`
          INSERT INTO users (username, email, password)
          VALUES (${username}, ${email}, ${password})
          ON CONFLICT (username) DO NOTHING
        `;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      } else {
        // Login check
        const users = await sql`
          SELECT * FROM users WHERE username = ${username} AND password = ${password}
        `;
        if (users.length > 0) {
          // Fetch history for this user
          const history = await sql`
            SELECT * FROM prompt_history WHERE username = ${username} ORDER BY timestamp DESC LIMIT 50
          `;
          return { 
            statusCode: 200, 
            body: JSON.stringify({ success: true, user: users[0], history }) 
          };
        }
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid Handle or Security Key' }) };
      }
    }

    // 2. SAVE PROMPT ROUTE
    if (httpMethod === 'POST' && body.action === 'save_prompt') {
      const { username, prompt, config } = body;
      await sql`
        INSERT INTO prompt_history (username, prompt, config)
        VALUES (${username}, ${prompt}, ${JSON.stringify(config)})
      `;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Endpoint Not Found' }) };
  } catch (error: any) {
    console.error('Database Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: `Database Error: ${error.message || 'Unknown server error'}` }) 
    };
  }
};
