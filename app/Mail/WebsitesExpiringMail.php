<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WebsitesExpiringMail extends Mailable
{
    use Queueable, SerializesModels;

    public $expiringDomains;
    public $expiringHostings;

    /**
     * Create a new message instance.
     */
    public function __construct($expiringDomains, $expiringHostings)
    {
        $this->expiringDomains = $expiringDomains;
        $this->expiringHostings = $expiringHostings;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Websites Expiry Alert: Expiring Domains & Hosting Accounts',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.websites_expiring',
        );
    }
}
