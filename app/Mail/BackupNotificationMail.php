<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BackupNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $backupDetails;

    /**
     * Create a new message instance.
     *
     * @param array $backupDetails Details of the backup operation
     */
    public function __construct(array $backupDetails)
    {
        $this->backupDetails = $backupDetails;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $isSuccess = ($this->backupDetails['status'] ?? '') === 'completed';
        $statusTag = $isSuccess ? '[SUCCESS]' : '[FAILED]';
        $typeTag = ucfirst($this->backupDetails['trigger_type'] ?? 'Database');

        return new Envelope(
            subject: "{$statusTag} Database Backup Status Report - {$typeTag} Backup",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.backup_notification',
        );
    }
}
