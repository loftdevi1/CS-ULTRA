# Email Notification Setup

The Kashmkari Support Platform has email notification functionality built-in for sending reminder emails. To enable this feature, follow these steps:

## Step 1: Get Resend API Key

1. Sign up for a free account at [https://resend.com](https://resend.com)
2. Go to **Dashboard → API Keys**
3. Click **Create API Key**
4. Copy the API key (starts with `re_...`)

## Step 2: Configure Backend

1. Open `/app/backend/.env`
2. Add your Resend API key:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   SENDER_EMAIL=your-verified-email@yourdomain.com
   ```

## Step 3: Restart Backend

```bash
sudo supervisorctl restart backend
```

## Step 4: Test Email Notifications

The reminder system will automatically send emails for orders that haven't been updated in 5+ days. You can also use the `/api/send-email` endpoint to send custom emails.

### Example Email API Call:

```bash
curl -X POST https://your-app-url.preview.emergentagent.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "customer@example.com",
    "subject": "Order Update - Kashmkari",
    "html_content": "<h1>Your order is being processed</h1><p>We are working on your Hand Embroidered Shawl.</p>"
  }'
```

## Notes

- **Free Tier:** Resend free tier allows emails only to verified addresses
- **Production:** Verify your domain in Resend to send to any email address
- **Sender Email:** Use `onboarding@resend.dev` for testing or your verified domain email for production

## Future Enhancement Ideas

You can extend the email functionality to:
- Send automated reminder emails every 5 days for pending orders
- Send order confirmation emails when orders are created
- Send status update emails when order stages change
- Send delivery confirmation emails when orders are marked as delivered
