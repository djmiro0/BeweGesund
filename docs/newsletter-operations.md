# Newsletter operations

This document describes the repeatable process for configuring, testing, and
sending the BeweGesund newsletter through Resend.

## One-time Resend setup

1. In **Resend → API Keys**, create a key named `BeweGesund Newsletter` with
   **Full access**. Keep the existing send-only key for the contact form.
2. In **Resend → Contacts/Audience → Topics**, create a Topic with:
   - Name: `BeweGesund Newsletter`
   - Description: `Launch updates, new programs and BeweGesund news`
   - Default subscription: **Opt-out**
   - Visibility: **Public**
3. Add the following variables to `.env.local` and to the production deployment:

   ```env
   # Existing send-only key used by the contact form
   RESEND_API_KEY=re_...

   # Full-access key used to manage newsletter contacts
   RESEND_CONTACTS_API_KEY=re_...

   # UUID copied from the BeweGesund Newsletter Topic
   RESEND_NEWSLETTER_TOPIC_ID=...
   ```

4. Never commit real API keys to Git or paste them into documentation, tickets,
   or chat messages.

## Test a newsletter signup

1. Start the application with `npm run dev`.
2. Enter a real test address in the newsletter form in the footer.
3. Confirm that the form displays its success message.
4. In **Resend → Contacts**, open the test contact and verify:
   - global status is `Subscribed`;
   - `BeweGesund Newsletter` is `Opted in`.

The signup form stores the contact and Topic preference. It does not send an
automatic welcome email.

## Send a test newsletter

1. Make sure the Topic initially contains only internal test addresses.
2. Open **Resend → Broadcasts → Create Broadcast**.
3. Select a sender on the verified BeweGesund domain, for example
   `BeweGesund <newsletter@bewegesund.de>`.
4. Add the subject and email content.
5. Select `BeweGesund Newsletter` in the **Topic** recipient field.
6. Check the displayed recipient count before sending.
7. Send immediately or schedule the Broadcast.

After sending, verify the Inbox, Spam/Junk, and Promotions folders. In the
Resend Broadcast report, check delivered, bounced, opened, clicked, and
unsubscribed results.

## Add the unsubscribe link correctly

Do not paste or reuse the generated `unsubscribe.resend.com` URL. It contains a
recipient-specific token and Resend generates a new URL for each recipient and
Broadcast.

Preferred option: add Resend's **Unsubscribe Footer** element in the visual
editor.

To make custom linked text in the visual editor:

1. Write `Odjavi se sa newslettera`.
2. Select the text and open the link editor with the link icon or `Cmd/Ctrl + K`.
3. Use this value as the link URL:

   ```text
   {{{RESEND_UNSUBSCRIBE_URL}}}
   ```

For an HTML block, use:

```html
<p>
  Ne želiš više da primaš poruke?
  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Odjavi se sa newslettera</a>
</p>
```

For a Markdown block, use:

```md
Ne želiš više da primaš poruke? [Odjavi se]({{{RESEND_UNSUBSCRIBE_URL}}})
```

If the placeholder is inserted into a plain-text block, Resend will replace it
correctly, but the recipient will see the complete generated URL instead of
linked text.

## Production checklist

- The sending domain is verified in Resend.
- `RESEND_CONTACTS_API_KEY` has Full access.
- `RESEND_NEWSLETTER_TOPIC_ID` points to the correct public Topic.
- The recipient count is reviewed before every Broadcast.
- The email includes a visible unsubscribe link.
- Links use the production BeweGesund domain.
- A test Broadcast is delivered successfully before sending to all subscribers.
