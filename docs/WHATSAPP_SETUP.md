# WhatsApp alerts — setup

PlayVth sends WhatsApp messages to venues (new booking, cancellation) and to customers (confirmation, venue cancellation) through the **Meta WhatsApp Cloud API**. Until it is configured, every message is still recorded in the partner dashboard → venue → **Alerts** tab with status `logged`, so nothing is lost and you can see exactly what would be sent.

## 1. Create the WhatsApp Business app (about 30 minutes)

1. Go to https://developers.facebook.com/apps → **Create app** → type *Business* → add the **WhatsApp** product.
2. In **WhatsApp → API Setup** you get a free **test phone number** and a temporary token. Add your own mobile as a recipient under "To" and send the hello-world template to confirm it works.
3. For production: **Add phone number** (a number not already on WhatsApp; a new SIM or a virtual number works), verify it by SMS, and complete **Business verification** in Meta Business Manager (GST certificate or incorporation document). This unlocks sending to any number.
4. Create a **System User** in Business Manager → assign the app → **Generate token** with `whatsapp_business_messaging` and `whatsapp_business_management`. This token does not expire. Copy it.
5. Note the **Phone Number ID** shown in API Setup (not the phone number itself).

## 2. Configure PlayVth

Set these on your host (Railway → Variables):

```
WHATSAPP_TOKEN=<system user token>
WHATSAPP_PHONE_NUMBER_ID=<phone number id>
WHATSAPP_MODE=text
```

Redeploy. The Alerts tab now shows "WhatsApp delivery is on" and new bookings are delivered.

## 3. Text vs template mode

- **`text` mode** sends free-form messages. Meta only delivers free-form messages inside a 24-hour window after the recipient last messaged your number (and always to the test recipients you added). It is enough to start: ask each venue to send one "Hi" to your WhatsApp number when they onboard, and remind them monthly, or have them reply to any alert.
- **`template` mode** is required for messages Meta considers business-initiated at scale. Create these templates under **WhatsApp Manager → Message templates** (category *Utility*), one variable per `{{n}}`, then set `WHATSAPP_MODE=template` and the template names:

| Env var | Suggested body (variables in order) |
|---|---|
| `WHATSAPP_TEMPLATE_VENUE_BOOKED` | New booking at {{1}}: {{2}} ({{3}}) booked {{4}} on {{5}}, {{6}}. Amount {{7}}. Code {{8}}. |
| `WHATSAPP_TEMPLATE_VENUE_CANCELLED` | Cancelled at {{1}}: {{2}} cancelled {{3}} on {{4}}, {{5}}. Code {{6}}. The slot is open again. |
| `WHATSAPP_TEMPLATE_PLAYER_CONFIRMED` | Hi {{1}}, your booking at {{2}} ({{3}}) on {{4}}, {{5}} is confirmed. Pay {{6}} at the venue. Show code {{7}}. |
| `WHATSAPP_TEMPLATE_PLAYER_CANCELLED` | Hi {{1}}, {{2}} had to cancel your booking on {{3}}, {{4}} (code {{5}}). Please book another slot on PlayVth. |

Approval usually takes minutes to a few hours.

## 4. Per-venue number

Each venue can set the WhatsApp number that receives its alerts under **Partner → venue → Alerts**. If empty, alerts go to the owner's login number.

## 5. Pricing

Meta charges per conversation, roughly ₹0.12 to ₹0.80 in India depending on category, with 1,000 free service conversations per month. Utility templates are the cheapest.

## Troubleshooting

Open the Alerts tab. Each message shows `sent`, `failed` with Meta's error text, or `logged` (no provider). Common errors: *Recipient phone number not in allowed list* (test mode: add the number as a test recipient or complete business verification), *Invalid OAuth access token* (regenerate the System User token), *Template name does not exist* (check the template name and language code).
