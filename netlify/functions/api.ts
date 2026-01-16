
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Helper function to validate admin key from database
const validateAdminKey = async (sql: any, adminKey: string): Promise<boolean> => {
  try {
    const result = await sql`
      SELECT * FROM admin_keys WHERE key = ${adminKey} AND status = 'active'
    `;
    
    if (result.length > 0) {
      // Update last_used timestamp
      await sql`
        UPDATE admin_keys SET last_used = NOW() WHERE key = ${adminKey}
      `;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Admin key validation error:', error);
    return false;
  }
};

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

    // 3. CHAT MESSAGE ROUTE - Save code delivery via chat
    if (httpMethod === 'POST' && body.action === 'chat_send') {
      const { username, message, code, timestamp } = body;
      
      if (!username || !code) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing username or code' }) };
      }

      await sql`
        INSERT INTO chat_history (username, message, code, timestamp, status)
        VALUES (${username}, ${message}, ${code}, ${timestamp}, 'delivered')
      `;
      
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Code sent via chat support.' }) };
    }

    // 4. REDEEM PREMIUM CODE ROUTE
    if (httpMethod === 'POST' && body.action === 'redeem_premium') {
      const { username, code } = body;

      // Check if code exists and is active
      const premiumKey = await sql`
        SELECT * FROM premium_keys WHERE key = ${code} AND status = 'active'
      `;

      if (premiumKey.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or already used code.' }) };
      }

      // Mark code as redeemed
      await sql`
        UPDATE premium_keys 
        SET status = 'redeemed', redeemed_by = ${username}, redeemed_at = NOW()
        WHERE key = ${code}
      `;

      // Update user to premium
      await sql`
        UPDATE users 
        SET is_premium = true, premium_code = ${code}
        WHERE username = ${username}
      `;

      // Auto-generate new active premium key for other users
      const newKey = `PRM-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      await sql`
        INSERT INTO premium_keys (key, status, created_at)
        VALUES (${newKey}, 'active', NOW())
      `;

      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          success: true, 
          message: 'Premium activated successfully. New key generated for other users.'
        }) 
      };
    }

    // 5. GENERATE PREMIUM KEY (Admin only)
    if (httpMethod === 'POST' && body.action === 'generate_premium_key') {
      const { admin_key } = body;
      
      // Validate admin key from database
      if (!await validateAdminKey(sql, admin_key)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized - Invalid admin key' }) };
      }

      const newKey = `PRM-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      await sql`
        INSERT INTO premium_keys (key, status, created_at)
        VALUES (${newKey}, 'active', NOW())
      `;

      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          success: true,
          key: newKey,
          message: 'Premium key generated successfully.'
        }) 
      };
    }

    // 6. PURCHASE VALIDATION (Staff/Admin)
    if (httpMethod === 'POST' && body.action === 'validate_purchase') {
      const { admin_key, purchase_id, status, reason } = body;

      if (!await validateAdminKey(sql, admin_key)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized - Invalid admin key' }) };
      }

      if (status === 'approved') {
        // Generate premium key and store purchase record
        const newKey = `PRM-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
        
        await sql`
          INSERT INTO purchases (purchase_id, status, key, validated_at)
          VALUES (${purchase_id}, 'approved', ${newKey}, NOW())
        `;

        await sql`
          INSERT INTO premium_keys (key, status, created_at)
          VALUES (${newKey}, 'active', NOW())
        `;

        return { 
          statusCode: 200, 
          body: JSON.stringify({ 
            success: true, 
            key: newKey,
            message: 'Purchase approved. Code generated and ready to send.',
            notify: `Purchase ${purchase_id} has been approved. Send code: ${newKey}`
          }) 
        };
      } else if (status === 'rejected') {
        await sql`
          INSERT INTO purchases (purchase_id, status, rejection_reason, validated_at)
          VALUES (${purchase_id}, 'rejected', ${reason}, NOW())
        `;

        return { 
          statusCode: 200, 
          body: JSON.stringify({ 
            success: true, 
            message: 'Purchase rejected.',
            notify: `Purchase ${purchase_id} has been rejected. Reason: ${reason}`
          }) 
        };
      }
    }

    // 7. GET PENDING PURCHASES (Staff/Admin Dashboard)
    if (httpMethod === 'GET' && body.action === 'get_pending_purchases') {
      const { admin_key } = body;

      if (!await validateAdminKey(sql, admin_key)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized - Invalid admin key' }) };
      }

      const purchases = await sql`
        SELECT * FROM purchases WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100
      `;

      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          success: true, 
          purchases 
        }) 
      };
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
