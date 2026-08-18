<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectLog;
use App\Models\Task;
use App\Models\User;
use App\Models\UserEmailAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Email;

class MailController extends Controller
{
    private function ensureAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'ADMIN') {
            abort(response()->json(['error' => 'Bu modüle erişim yetkiniz bulunmamaktadır.'], 403));
        }
        return $user;
    }

    /**
     * Get user's saved email account settings
     */
    public function getAccount(Request $request)
    {
        $user = $this->ensureAdmin($request);
        $account = UserEmailAccount::where('user_id', $user->id)->where('is_active', true)->first();

        if (!$account) {
            return response()->json(['account' => null]);
        }

        return response()->json([
            'account' => [
                'id' => (string) $account->id,
                'emailAddress' => $account->email_address,
                'displayName' => $account->display_name,
                'imapHost' => $account->imap_host,
                'imapPort' => $account->imap_port,
                'imapEncryption' => $account->imap_encryption,
                'smtpHost' => $account->smtp_host,
                'smtpPort' => $account->smtp_port,
                'smtpEncryption' => $account->smtp_encryption,
                'username' => $account->username,
                'isActive' => $account->is_active,
                'lastSyncedAt' => $account->last_synced_at ? $account->last_synced_at->toISOString() : null,
            ]
        ]);
    }

    /**
     * Save or update email account settings (Password encrypted)
     */
    public function saveAccount(Request $request)
    {
        $user = $this->ensureAdmin($request);

        $request->validate([
            'emailAddress' => 'required|email',
            'imapHost' => 'required|string',
            'imapPort' => 'required|integer',
            'smtpHost' => 'required|string',
            'smtpPort' => 'required|integer',
            'username' => 'required|string',
        ]);

        $account = UserEmailAccount::where('user_id', $user->id)->first();

        $data = [
            'email_address' => strtolower(trim($request->emailAddress)),
            'display_name' => $request->displayName ?: $user->full_name,
            'imap_host' => trim($request->imapHost),
            'imap_port' => (int) $request->imapPort,
            'imap_encryption' => $request->imapEncryption ?: 'ssl',
            'smtp_host' => trim($request->smtpHost),
            'smtp_port' => (int) $request->smtpPort,
            'smtp_encryption' => $request->smtpEncryption ?: 'tls',
            'username' => trim($request->username),
            'is_active' => true,
        ];

        if (!empty($request->password)) {
            $data['password'] = $request->password; // Will be automatically encrypted by Eloquent Cast
        } elseif (!$account) {
            return response()->json(['error' => 'Hesap şifresi gereklidir.'], 422);
        }

        if ($account) {
            $account->update($data);
        } else {
            $data['user_id'] = $user->id;
            $account = UserEmailAccount::create($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'E-posta hesabı ayarları güvenli şekilde kaydedildi.',
            'account' => [
                'id' => (string) $account->id,
                'emailAddress' => $account->email_address,
                'displayName' => $account->display_name,
                'imapHost' => $account->imap_host,
                'imapPort' => $account->imap_port,
                'imapEncryption' => $account->imap_encryption,
                'smtpHost' => $account->smtp_host,
                'smtpPort' => $account->smtp_port,
                'smtpEncryption' => $account->smtp_encryption,
                'username' => $account->username,
                'isActive' => $account->is_active,
            ]
        ]);
    }

    /**
     * Test IMAP connection with given or stored credentials
     */
    public function testConnection(Request $request)
    {
        $user = $this->ensureAdmin($request);
        $account = UserEmailAccount::where('user_id', $user->id)->first();

        $host = $request->imapHost ?? ($account ? $account->imap_host : null);
        $port = $request->imapPort ?? ($account ? $account->imap_port : 993);
        $encryption = $request->imapEncryption ?? ($account ? $account->imap_encryption : 'ssl');
        $username = $request->username ?? ($account ? $account->username : null);
        $password = $request->password ?? ($account ? $account->password : null);

        if (!$host || !$username || !$password) {
            return response()->json(['error' => 'Test için sunucu, kullanıcı adı ve şifre gereklidir.'], 422);
        }

        try {
            $imap = $this->openImapConnection($host, $port, $encryption, $username, $password);
            imap_close($imap);

            return response()->json([
                'success' => true,
                'message' => 'IMAP bağlantısı başarıyla sağlandı! Gelen kutunuza erişebilirsiniz.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Bağlantı başarısız: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Fetch inbox messages with pagination
     */
    public function getInbox(Request $request)
    {
        $user = $this->ensureAdmin($request);
        $account = UserEmailAccount::where('user_id', $user->id)->where('is_active', true)->first();

        if (!$account) {
            return response()->json(['error' => 'Lütfen önce e-posta hesap ayarlarınızı yapın.'], 400);
        }

        $folder = $request->folder ?: 'INBOX';
        $limit = (int) ($request->limit ?: 30);
        $search = trim($request->search ?: '');

        try {
            $imap = $this->openImapConnection(
                $account->imap_host,
                $account->imap_port,
                $account->imap_encryption,
                $account->username,
                $account->password,
                $folder
            );

            // Fetch list of messages
            $numMessages = imap_num_msg($imap);
            $messages = [];

            if ($numMessages > 0) {
                if (!empty($search)) {
                    $uids = imap_search($imap, 'SUBJECT "' . addslashes($search) . '"', SE_UID);
                    if (!$uids) {
                        $uids = imap_search($imap, 'FROM "' . addslashes($search) . '"', SE_UID);
                    }
                    $uids = $uids ?: [];
                    rsort($uids);
                    $uids = array_slice($uids, 0, $limit);
                } else {
                    // Get latest messages
                    $start = max(1, $numMessages - $limit + 1);
                    $sequence = "{$start}:{$numMessages}";
                    $overviewList = imap_fetch_overview($imap, $sequence, 0);
                    $overviewList = array_reverse($overviewList);

                    $uids = array_map(function ($ov) {
                        return $ov->uid;
                    }, $overviewList);
                }

                foreach ($uids as $uid) {
                    $msgNum = imap_msgno($imap, $uid);
                    if (!$msgNum) continue;

                    $header = imap_headerinfo($imap, $msgNum);
                    if (!$header) continue;

                    $subject = isset($header->subject) ? $this->decodeMimeString($header->subject) : '(Konusuz)';
                    $fromName = isset($header->from[0]->personal) ? $this->decodeMimeString($header->from[0]->personal) : '';
                    $fromEmail = isset($header->from[0]->mailbox, $header->from[0]->host) ? $header->from[0]->mailbox . '@' . $header->from[0]->host : '';
                    
                    $isUnread = ($header->Unseen == 'U' || $header->Recent == 'N');
                    $dateStr = isset($header->udate) ? date('c', $header->udate) : (isset($header->date) ? date('c', strtotime($header->date)) : null);

                    $messages[] = [
                        'uid' => (string) $uid,
                        'msgNo' => $msgNum,
                        'subject' => $subject,
                        'fromName' => $fromName ?: $fromEmail,
                        'fromEmail' => $fromEmail,
                        'date' => $dateStr,
                        'isUnread' => $isUnread,
                        'size' => isset($header->Size) ? (int) $header->Size : 0,
                    ];
                }
            }

            imap_close($imap);

            $account->update(['last_synced_at' => now()]);

            return response()->json([
                'messages' => $messages,
                'total' => $numMessages,
                'folder' => $folder,
            ]);
        } catch (\Exception $e) {
            Log::error('IMAP getInbox error: ' . $e->getMessage());
            return response()->json(['error' => 'Gelen kutusu alınamadı: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single email message detail with HTML/Text body & attachments
     */
    public function getMessage(Request $request, $uid)
    {
        $user = $this->ensureAdmin($request);
        $account = UserEmailAccount::where('user_id', $user->id)->where('is_active', true)->first();

        if (!$account) {
            return response()->json(['error' => 'E-posta hesabı bulunamadı.'], 400);
        }

        try {
            $imap = $this->openImapConnection(
                $account->imap_host,
                $account->imap_port,
                $account->imap_encryption,
                $account->username,
                $account->password
            );

            $msgNum = imap_msgno($imap, (int) $uid);
            if (!$msgNum) {
                imap_close($imap);
                return response()->json(['error' => 'E-posta mesajı bulunamadı.'], 404);
            }

            $header = imap_headerinfo($imap, $msgNum);
            $structure = imap_fetchstructure($imap, $msgNum);

            $subject = isset($header->subject) ? $this->decodeMimeString($header->subject) : '(Konusuz)';
            $fromName = isset($header->from[0]->personal) ? $this->decodeMimeString($header->from[0]->personal) : '';
            $fromEmail = isset($header->from[0]->mailbox, $header->from[0]->host) ? $header->from[0]->mailbox . '@' . $header->from[0]->host : '';
            $toEmail = isset($header->to[0]->mailbox, $header->to[0]->host) ? $header->to[0]->mailbox . '@' . $header->to[0]->host : '';
            $dateStr = isset($header->udate) ? date('c', $header->udate) : (isset($header->date) ? date('c', strtotime($header->date)) : null);

            // Fetch Body parts
            $bodyHtml = '';
            $bodyPlain = '';
            $attachments = [];

            $this->parseStructure($imap, $msgNum, $structure, '', $bodyHtml, $bodyPlain, $attachments);

            // Mark as read
            imap_setflag_full($imap, (string) $uid, "\\Seen", ST_UID);

            imap_close($imap);

            return response()->json([
                'message' => [
                    'uid' => (string) $uid,
                    'subject' => $subject,
                    'fromName' => $fromName ?: $fromEmail,
                    'fromEmail' => $fromEmail,
                    'toEmail' => $toEmail,
                    'date' => $dateStr,
                    'htmlBody' => $bodyHtml ?: nl2br(htmlspecialchars($bodyPlain)),
                    'plainBody' => $bodyPlain,
                    'attachments' => $attachments,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('IMAP getMessage error: ' . $e->getMessage());
            return response()->json(['error' => 'E-posta detayı yüklenemedi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Send new email via user's SMTP settings
     */
    public function sendMail(Request $request)
    {
        $user = $this->ensureAdmin($request);

        $request->validate([
            'to' => 'required|string',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $account = UserEmailAccount::where('user_id', $user->id)->where('is_active', true)->first();

        if (!$account) {
            return response()->json(['error' => 'E-posta göndermek için önce hesap ayarlarınızı yapmalısınız.'], 400);
        }

        try {
            $scheme = ($account->smtp_encryption === 'ssl' || $account->smtp_port == 465) ? 'smtps' : 'smtp';
            $dsn = sprintf(
                '%s://%s:%s@%s:%d',
                $scheme,
                urlencode($account->username),
                urlencode($account->password),
                $account->smtp_host,
                $account->smtp_port
            );

            $transport = Transport::fromDsn($dsn);
            $mailer = new Mailer($transport);

            $fromAddress = $account->email_address;
            $fromName = $account->display_name ?: $user->full_name;

            $email = (new Email())
                ->from(new \Symfony\Component\Mime\Address($fromAddress, $fromName))
                ->to(...array_map('trim', explode(',', $request->to)))
                ->subject($request->subject)
                ->html($request->body);

            if (!empty($request->cc)) {
                $email->cc(...array_map('trim', explode(',', $request->cc)));
            }
            if (!empty($request->bcc)) {
                $email->bcc(...array_map('trim', explode(',', $request->bcc)));
            }

            $mailer->send($email);

            return response()->json([
                'success' => true,
                'message' => 'E-posta başarıyla gönderildi!'
            ]);
        } catch (\Exception $e) {
            Log::error('SMTP sendMail error: ' . $e->getMessage());
            return response()->json(['error' => 'E-posta gönderilemedi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete email message
     */
    public function deleteMessage(Request $request, $uid)
    {
        $user = $this->ensureAdmin($request);
        $account = UserEmailAccount::where('user_id', $user->id)->where('is_active', true)->first();

        if (!$account) {
            return response()->json(['error' => 'Hesap bulunamadı.'], 400);
        }

        try {
            $imap = $this->openImapConnection(
                $account->imap_host,
                $account->imap_port,
                $account->imap_encryption,
                $account->username,
                $account->password
            );

            imap_delete($imap, (int) $uid, FT_UID);
            imap_expunge($imap);
            imap_close($imap);

            return response()->json([
                'success' => true,
                'message' => 'E-posta başarıyla silindi.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'E-posta silinemedi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Convert Email content / quote to a new Task
     */
    public function convertEmailToTask(Request $request)
    {
        $actor = $this->ensureAdmin($request);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $targetProjectId = !empty($request->projectId) ? $request->projectId : (!empty($request->project_id) ? $request->project_id : null);
        $assignedUserId = !empty($request->assignedUserId) ? $request->assignedUserId : ($actor ? $actor->id : 1);

        $task = Task::create([
            'title' => trim($request->title),
            'description' => $request->description ?: '',
            'status' => $request->status ?: 'TODO',
            'priority' => $request->priority ?: 'MEDIUM',
            'category' => $request->category ?: 'Yazışma / Mail',
            'project_id' => $targetProjectId,
            'assigned_user_id' => $assignedUserId,
            'created_by_id' => $actor ? $actor->id : null,
            'estimated_hours' => $request->estimatedHours ?: 4,
            'actual_hours' => 0,
            'task_date' => $request->taskDate ?: now()->toDateString(),
            'start_date' => $request->startDate ?: now()->toDateTimeString(),
            'due_date' => $request->dueDate ?: null,
        ]);

        // Audit Log
        if ($targetProjectId) {
            ProjectLog::create([
                'project_id' => $targetProjectId,
                'task_id' => $task->id,
                'user_id' => $actor ? $actor->id : $assignedUserId,
                'action' => 'TASK_CREATED',
                'title' => "'{$task->title}' başlıklı görev e-postadan üretildi.",
                'details' => [
                    'task_title' => $task->title,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'email_subject' => $request->emailSubject ?? '',
                ],
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'E-posta başarıyla göreve dönüştürüldü!',
            'task' => [
                'id' => (string) $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'projectId' => $task->project_id ? (string) $task->project_id : null,
                'assignedUserId' => (string) $task->assigned_user_id,
            ]
        ], 201);
    }

    // ==========================================
    // IMAP & MIME HELPER METHODS
    // ==========================================

    private function openImapConnection($host, $port, $encryption, $username, $password, $folder = 'INBOX')
    {
        $flags = '/imap';
        if ($encryption === 'ssl' || $port == 993) {
            $flags .= '/ssl/novalidate-cert';
        } elseif ($encryption === 'tls' || $port == 143) {
            $flags .= '/tls/novalidate-cert';
        } else {
            $flags .= '/notls';
        }

        $mailbox = "{" . "{$host}:{$port}{$flags}" . "}" . $folder;

        // Suppress php warning for custom exception handling
        $imap = @imap_open($mailbox, $username, $password, 0, 1, ['DISABLE_AUTHENTICATOR' => 'GSSAPI']);

        if (!$imap) {
            $lastError = imap_last_error();
            throw new \Exception($lastError ?: 'Sunucuya bağlanılamadı. Lütfen sunucu ve şifre bilgilerinizi kontrol edin.');
        }

        return $imap;
    }

    private function decodeMimeString($string)
    {
        if (empty($string)) return '';

        $elements = imap_mime_header_decode($string);
        $decoded = '';
        foreach ($elements as $el) {
            $charset = strtolower($el->charset);
            $text = $el->text;
            if ($charset !== 'default' && $charset !== 'utf-8' && function_exists('mb_convert_encoding')) {
                try {
                    $text = mb_convert_encoding($text, 'UTF-8', $charset);
                } catch (\Exception $e) {}
            }
            $decoded .= $text;
        }

        return $decoded ?: $string;
    }

    private function parseStructure($imap, $msgNum, $structure, $partPrefix, &$bodyHtml, &$bodyPlain, &$attachments)
    {
        if (isset($structure->parts) && count($structure->parts)) {
            foreach ($structure->parts as $idx => $part) {
                $subPrefix = $partPrefix ? $partPrefix . '.' . ($idx + 1) : (string) ($idx + 1);
                $this->parseStructure($imap, $msgNum, $part, $subPrefix, $bodyHtml, $bodyPlain, $attachments);
            }
        } else {
            $partNumber = $partPrefix ?: '1';
            $data = imap_fetchbody($imap, $msgNum, $partNumber);

            // Decode transfer encoding
            if (isset($structure->encoding)) {
                if ($structure->encoding === 3) {
                    $data = base64_decode($data);
                } elseif ($structure->encoding === 4) {
                    $data = quoted_printable_decode($data);
                }
            }

            // Check if attachment
            $filename = '';
            if (isset($structure->dparameters)) {
                foreach ($structure->dparameters as $param) {
                    if (strtolower($param->attribute) === 'filename') {
                        $filename = $this->decodeMimeString($param->value);
                    }
                }
            }
            if (empty($filename) && isset($structure->parameters)) {
                foreach ($structure->parameters as $param) {
                    if (strtolower($param->attribute) === 'name') {
                        $filename = $this->decodeMimeString($param->value);
                    }
                }
            }

            if (!empty($filename)) {
                $attachments[] = [
                    'fileName' => $filename,
                    'size' => isset($structure->bytes) ? (int) $structure->bytes : strlen($data),
                    'mimeType' => (isset($structure->subtype) ? strtolower($structure->subtype) : 'application/octet-stream'),
                ];
            } else {
                // Text / HTML body
                $subtype = isset($structure->subtype) ? strtoupper($structure->subtype) : 'PLAIN';
                if ($subtype === 'HTML' && empty($bodyHtml)) {
                    $bodyHtml = $data;
                } elseif ($subtype === 'PLAIN' && empty($bodyPlain)) {
                    $bodyPlain = $data;
                }
            }
        }
    }
}
