import { Hono } from "hono";
import { EmailService } from "../shared/email-service";
import type { Env } from "./types";

const emailWebhook = new Hono<{ Bindings: Env }>();

/**
 * SendGrid Inbound Parse Webhook Handler
 * This endpoint receives incoming emails sent to reply addresses
 */
emailWebhook.post('/webhook/email/inbound', async (c) => {
  try {
    const formData = await c.req.formData();
    
    // Extract email data from SendGrid webhook format
    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;
    const headers = formData.get('headers') as string;

    console.log('Received inbound email:', { to, from, subject });

    // Parse headers
    let parsedHeaders: any = {};
    if (headers) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        console.error('Failed to parse email headers:', e);
      }
    }

    // Initialize email service
    const emailService = new EmailService(c.env.SENDGRID_API_KEY || '');

    // Parse the incoming email
    const emailData = emailService.parseIncomingEmail({
      from,
      to,
      subject,
      text,
      html,
      headers: parsedHeaders
    });

    console.log('Parsed email data:', emailData);

    // Extract matter context from reply-to address
    const replyContext = parseReplyAddress(to);
    const matterId = replyContext?.matter_id || emailData.matter_id;
    const deadlineId = replyContext?.deadline_id || emailData.deadline_id;
    const hearingId = replyContext?.hearing_id || emailData.hearing_id;

    if (!matterId) {
      console.error('No matter ID found in email context');
      return c.json({ error: 'Invalid reply context' }, 400);
    }

    // Get matter details
    const matter = await c.env.DB.prepare(`
      SELECT m.*, c.first_name as client_first_name, c.last_name as client_last_name
      FROM matters m 
      JOIN clients c ON m.client_id = c.id 
      WHERE m.id = ?
    `).bind(matterId).first();

    if (!matter) {
      console.error('Matter not found:', matterId);
      return c.json({ error: 'Matter not found' }, 404);
    }

    // Store the email as a communication
    const communicationResult = await c.env.DB.prepare(`
      INSERT INTO communications (
        matter_id, channel, direction, to_address, from_address, 
        body, sent_at, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      matterId,
      'Email',
      'Inbound',
      to,
      from,
      emailData.body || text,
      new Date().toISOString(),
      JSON.stringify({
        subject: subject,
        message_id: emailData.messageId,
        references: emailData.references,
        deadline_id: deadlineId,
        hearing_id: hearingId,
        reply_type: deadlineId ? 'deadline' : hearingId ? 'hearing' : 'matter'
      })
    ).run();

    // If this is a reply to a deadline, also add it as a note/update to the deadline
    if (deadlineId && emailData.body) {
      // Create a deadline note/update
      await c.env.DB.prepare(`
        INSERT INTO deadline_notes (deadline_id, note, created_by_email, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        deadlineId,
        `Email Reply: ${emailData.body}`,
        from,
        new Date().toISOString()
      ).run().catch(() => {
        // Table might not exist yet, we'll create it in migration
        console.log('Deadline notes table not found, will be created');
      });

      // Update deadline with latest activity
      await c.env.DB.prepare(`
        UPDATE deadlines SET updated_at = ? WHERE id = ?
      `).bind(new Date().toISOString(), deadlineId).run();
    }

    // If this is a reply to a hearing, add it as a hearing note
    if (hearingId && emailData.body) {
      await c.env.DB.prepare(`
        UPDATE hearings SET 
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN ?
            ELSE notes || char(10) || char(10) || ?
          END,
          updated_at = ?
        WHERE id = ?
      `).bind(
        `Email from ${from}: ${emailData.body}`,
        `Email from ${from}: ${emailData.body}`,
        new Date().toISOString(),
        hearingId
      ).run();
    }

    // Create a notification for the email reply
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, title, message, type, priority, related_matter_id, action_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'system', // Will need to map to actual user
      `Email Reply Received`,
      `Reply received from ${from} regarding ${deadlineId ? 'deadline' : hearingId ? 'hearing' : 'matter'}`,
      'message',
      'medium',
      matterId,
      deadlineId ? `/deadlines?id=${deadlineId}` : hearingId ? `/calendar?id=${hearingId}` : `/matters/${matterId}`
    ).run();

    console.log('Successfully processed inbound email');
    
    return c.json({ 
      success: true, 
      communication_id: communicationResult.meta.last_row_id,
      matter_id: matterId,
      context: {
        deadline_id: deadlineId,
        hearing_id: hearingId
      }
    });

  } catch (err) {
    console.error('Error processing inbound email:', err);
    return c.json({ 
      error: 'Failed to process email',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, 500);
  }
});

/**
 * SendGrid Event Webhook Handler
 * This handles delivery, open, click events
 */
emailWebhook.post('/webhook/email/events', async (c) => {
  try {
    const events = await c.req.json();
    
    if (!Array.isArray(events)) {
      return c.json({ error: 'Invalid event data' }, 400);
    }

    for (const event of events) {
      console.log('Email event received:', {
        event: event.event,
        email: event.email,
        timestamp: event.timestamp,
        sg_message_id: event.sg_message_id
      });

      // Store email events for tracking
      await c.env.DB.prepare(`
        INSERT INTO email_events (
          sg_message_id, event_type, email, timestamp, 
          matter_id, deadline_id, hearing_id, event_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        event.sg_message_id,
        event.event,
        event.email,
        new Date(event.timestamp * 1000).toISOString(),
        event.matter_id || null,
        event.deadline_id || null,
        event.hearing_id || null,
        JSON.stringify(event)
      ).run().catch(() => {
        console.log('Email events table not found, will be created in migration');
      });

      // Handle specific events
      if (event.event === 'bounce' || event.event === 'dropped') {
        // Create notification for delivery failure
        const matterId = event.matter_id;
        if (matterId) {
          await c.env.DB.prepare(`
            INSERT INTO notifications (user_id, title, message, type, priority, related_matter_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            'system',
            'Email Delivery Failed',
            `Email to ${event.email} failed: ${event.reason || 'Unknown error'}`,
            'system',
            'medium',
            matterId
          ).run();
        }
      }
    }

    return c.json({ success: true });

  } catch (error) {
    console.error('Error processing email events:', error);
    return c.json({ 
      error: 'Failed to process events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Parse reply-to address to extract context
 * Format: replies+matter-123-deadline-456@jusivo.app
 */
function parseReplyAddress(address: string): {
  matter_id?: number;
  deadline_id?: number;
  hearing_id?: number;
} | null {
  const match = address.match(/replies\+matter-(\d+)(?:-deadline-(\d+))?(?:-hearing-(\d+))?@/);
  
  if (!match) {
    return null;
  }

  return {
    matter_id: parseInt(match[1]),
    deadline_id: match[2] ? parseInt(match[2]) : undefined,
    hearing_id: match[3] ? parseInt(match[3]) : undefined,
  };
}

export default emailWebhook;
