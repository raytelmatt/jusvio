import { EmailService } from "../shared/email-service";
import type { Env } from "./types";

export class EmailScheduler {
  private env: Env;
  private emailService: EmailService;

  constructor(env: Env) {
    this.env = env;
    this.emailService = new EmailService(env.SENDGRID_API_KEY || '');
  }

  /**
   * Check and send reminder emails for upcoming deadlines
   * This should be called by a cron job or scheduled worker
   */
  async sendDeadlineReminders(): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    try {
      // Get all matter settings that have reminders enabled
      const mattersWithSettings = await this.env.DB.prepare(`
        SELECT ms.*, m.id as matter_id, m.title as matter_title, m.matter_number,
               c.first_name as client_first_name, c.last_name as client_last_name
        FROM matter_settings ms
        JOIN matters m ON ms.matter_id = m.id
        JOIN clients c ON m.client_id = c.id
        WHERE ms.calendar_reminders_enabled = 1 
        AND ms.notify_relevant_parties = 1
        AND ms.relevant_parties IS NOT NULL
      `).all();

      for (const matterSetting of mattersWithSettings.results) {
        const reminderDays = matterSetting.reminder_days_before 
          ? JSON.parse(matterSetting.reminder_days_before as string)
          : [7, 3, 1];

        const relevantParties = matterSetting.relevant_parties 
          ? JSON.parse(matterSetting.relevant_parties as string)
          : [];

        if (relevantParties.length === 0) continue;

        // Get deadlines for this matter that need reminders
        for (const days of reminderDays) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + days);
          targetDate.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const deadlines = await this.env.DB.prepare(`
            SELECT d.* FROM deadlines d
            WHERE d.matter_id = ?
            AND d.status = 'Open'
            AND datetime(d.due_at) >= datetime(?)
            AND datetime(d.due_at) <= datetime(?)
          `).bind(
            matterSetting.matter_id,
            targetDate.toISOString(),
            endOfDay.toISOString()
          ).all();

          for (const deadline of deadlines.results) {
            // Check if we've already sent a reminder for this deadline on this day
            const existingReminder = await this.env.DB.prepare(`
              SELECT id FROM email_reminders 
              WHERE deadline_id = ? AND reminder_days = ? AND sent_at >= date('now')
            `).bind(deadline.id, days).first();

            if (existingReminder) continue;

            try {
              const result = await this.emailService.sendDeadlineReminder(
                matterSetting,
                deadline,
                relevantParties
              );

              if (result.success) {
                sent++;
                
                // Record that we sent this reminder
                await this.env.DB.prepare(`
                  INSERT INTO email_reminders (deadline_id, reminder_days, sent_at, message_ids)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  deadline.id,
                  days,
                  new Date().toISOString(),
                  JSON.stringify(result.messageIds)
                ).run().catch(() => {
                  // Table might not exist yet, ignore for now
                });
              } else {
                errors++;
                console.error(`Failed to send reminder for deadline ${deadline.id}:`, result.error);
              }
            } catch (error) {
              errors++;
              console.error(`Error sending reminder for deadline ${deadline.id}:`, error);
            }
          }
        }
      }

      console.log(`Email reminder run completed: ${sent} sent, ${errors} errors`);
      return { sent, errors };

    } catch (error) {
      console.error('Error in sendDeadlineReminders:', error);
      return { sent, errors: errors + 1 };
    }
  }

  /**
   * Check and send reminder emails for upcoming hearings
   */
  async sendHearingReminders(): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    try {
      // Get all matter settings that have reminders enabled
      const mattersWithSettings = await this.env.DB.prepare(`
        SELECT ms.*, m.id as matter_id, m.title as matter_title, m.matter_number,
               c.first_name as client_first_name, c.last_name as client_last_name
        FROM matter_settings ms
        JOIN matters m ON ms.matter_id = m.id
        JOIN clients c ON m.client_id = c.id
        WHERE ms.calendar_reminders_enabled = 1 
        AND ms.notify_relevant_parties = 1
        AND ms.relevant_parties IS NOT NULL
      `).all();

      for (const matterSetting of mattersWithSettings.results) {
        const reminderDays = matterSetting.reminder_days_before 
          ? JSON.parse(matterSetting.reminder_days_before as string)
          : [7, 3, 1];

        const relevantParties = matterSetting.relevant_parties 
          ? JSON.parse(matterSetting.relevant_parties as string)
          : [];

        if (relevantParties.length === 0) continue;

        // Get hearings for this matter that need reminders
        for (const days of reminderDays) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + days);
          targetDate.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const hearings = await this.env.DB.prepare(`
            SELECT h.*, c.name as court_name FROM hearings h
            LEFT JOIN courts c ON h.court_id = c.id
            WHERE h.matter_id = ?
            AND datetime(h.start_at) >= datetime(?)
            AND datetime(h.start_at) <= datetime(?)
          `).bind(
            matterSetting.matter_id,
            targetDate.toISOString(),
            endOfDay.toISOString()
          ).all();

          for (const hearing of hearings.results) {
            // Check if we've already sent a reminder for this hearing on this day
            const existingReminder = await this.env.DB.prepare(`
              SELECT id FROM hearing_reminders 
              WHERE hearing_id = ? AND reminder_days = ? AND sent_at >= date('now')
            `).bind(hearing.id, days).first();

            if (existingReminder) continue;

            try {
              const result = await this.emailService.sendHearingNotification(
                matterSetting,
                hearing,
                relevantParties
              );

              if (result.success) {
                sent++;
                
                // Record that we sent this reminder
                await this.env.DB.prepare(`
                  INSERT INTO hearing_reminders (hearing_id, reminder_days, sent_at, message_ids)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  hearing.id,
                  days,
                  new Date().toISOString(),
                  JSON.stringify(result.messageIds)
                ).run().catch(() => {
                  // Table might not exist yet, ignore for now
                });
              } else {
                errors++;
                console.error(`Failed to send hearing reminder for ${hearing.id}:`, result.error);
              }
            } catch (error) {
              errors++;
              console.error(`Error sending hearing reminder for ${hearing.id}:`, error);
            }
          }
        }
      }

      console.log(`Hearing reminder run completed: ${sent} sent, ${errors} errors`);
      return { sent, errors };

    } catch (error) {
      console.error('Error in sendHearingReminders:', error);
      return { sent, errors: errors + 1 };
    }
  }
}

/**
 * Scheduled function to send email reminders
 * This would be called by Cloudflare Cron Triggers
 */
export async function sendScheduledReminders(env: Env): Promise<Response> {
  try {
    const scheduler = new EmailScheduler(env);
    
    const [deadlineResults, hearingResults] = await Promise.all([
      scheduler.sendDeadlineReminders(),
      scheduler.sendHearingReminders()
    ]);

    const totalSent = deadlineResults.sent + hearingResults.sent;
    const totalErrors = deadlineResults.errors + hearingResults.errors;

    return new Response(JSON.stringify({
      success: true,
      deadline_reminders: deadlineResults,
      hearing_reminders: hearingResults,
      total_sent: totalSent,
      total_errors: totalErrors,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in sendScheduledReminders:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
