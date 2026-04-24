import { BaseAgent } from './base-agent.js';
import { sendEmail } from '../integrations/sendgrid.js';
import { supabase } from '../integrations/supabase.js';
import logger from '../utils/logger.js';

export class OutreachAgent extends BaseAgent {
  constructor() {
    super('outreachAgent');
  }

  async execute() {
    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from('email_enrollments')
      .select('*, email_sequences!inner(steps), leads!inner(email, first_name, last_name, title, company)')
      .eq('status', 'active')
      .lte('next_send_at', now)
      .limit(50);

    if (error) throw error;
    if (!due?.length) return { sent: 0 };

    let sent = 0;
    for (const enroll of due) {
      const steps = enroll.email_sequences.steps;
      const step = steps[enroll.current_step];
      const lead = enroll.leads;
      if (!step || !lead?.email) continue;

      try {
        const subject = this.render(step.subject, lead);
        const html = this.render(step.html, lead);
        await sendEmail({
          to: lead.email,
          subject,
          html,
          customArgs: { enrollment_id: enroll.id, step: String(enroll.current_step) },
        });

        await supabase.from('email_events').insert({
          enrollment_id: enroll.id,
          event_type: 'sent',
          step: enroll.current_step,
        });

        const nextStep = enroll.current_step + 1;
        const hasNext = nextStep < steps.length;
        const waitHours = steps[nextStep]?.wait_hours ?? 24;
        await supabase.from('email_enrollments').update({
          current_step: nextStep,
          last_sent_at: now,
          next_send_at: hasNext ? new Date(Date.now() + waitHours * 3600000).toISOString() : null,
          status: hasNext ? 'active' : 'completed',
        }).eq('id', enroll.id);

        sent++;
      } catch (err) {
        logger.error({ enrollment: enroll.id, err: err.message }, 'outreach.send.fail');
      }
    }

    return { sent, considered: due.length };
  }

  render(template, lead) {
    return (template || '')
      .replace(/\{\{first_name\}\}/g, lead.first_name || 'there')
      .replace(/\{\{last_name\}\}/g, lead.last_name || '')
      .replace(/\{\{title\}\}/g, lead.title || '')
      .replace(/\{\{company\}\}/g, lead.company || 'your company');
  }
}
