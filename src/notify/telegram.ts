import type { SiteMatch } from '../domain/types.js';
import type { NotificationSender } from './interface.js';

export class TelegramNotifier implements NotificationSender {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async send(match: SiteMatch): Promise<void> {
    const text = this.formatMessage(match);
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram API ${res.status}: ${body}`);
    }
  }

  private formatMessage(match: SiteMatch): string {
    const dates = match.availableDates.join(', ');
    return [
      `<b>Site Available!</b>`,
      ``,
      `<b>Campground:</b> ${escapeHtml(match.facilityName)}`,
      `<b>Site:</b> ${escapeHtml(match.siteName)}`,
      `<b>Dates:</b> ${escapeHtml(dates)}`,
      `<b>Price:</b> $${match.pricePerNight}/night`,
      ``,
      `<a href="${match.bookingUrl}">Book Now</a>`,
    ].join('\n');
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
