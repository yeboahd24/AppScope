# AppScope — Product Roadmap & Monetization Strategy

> **Mission:** Help people see and control what apps have access to their email accounts — across all providers, in one place.

---

## 1. The Problem We Solve

Every time someone clicks "Continue with Google" (or Microsoft/Apple), they grant an app access to their account. Over time, dozens of forgotten apps pile up — many with excessive permissions.

Checking manually requires:
- Logging into each account separately
- Navigating deep into security settings
- Reviewing each app one by one
- Repeating for every account

**AppScope eliminates this entirely with one dashboard.**

---

## 2. Pricing Tiers

### Free Tier — "Hook Them In"
> Goal: Let users feel the value immediately so they want more.

| Feature | Included |
|---|---|
| Gmail accounts | 1 account only |
| Scan type | Manual (click to refresh) |
| Risk scoring | Basic (Safe / Risky) |
| Revoke access | One app at a time |
| Scan history | None |
| Alerts | None |

---

### Pro Tier — $3–5/month — "Where Most Users Land"
> Goal: Cover power users with multiple accounts who want peace of mind.

| Feature | Included |
|---|---|
| Email accounts | Unlimited (Gmail, Outlook, Apple) |
| Scan type | Auto-scan every 24 hours |
| Risk scoring | Advanced (Safe / Review / Risky + detailed reasons) |
| Revoke access | Bulk revoke (all risky apps in one tap) |
| Real-time alerts | Notified when a new app connects |
| Scan history | Full timeline of changes |
| Security score | Account score out of 100 |
| Breach detection | Check if email appeared in data breaches |
| Weekly digest | Email report every Monday |
| Export | Download reports as PDF |

---

### Family / Team Tier — $8–12/month — "Higher Value"
> Goal: Families and small teams who want shared security oversight.

| Feature | Included |
|---|---|
| Everything in Pro | ✅ |
| Members | Up to 5 people |
| Admin dashboard | Monitor all linked accounts |
| Shared security score | Family/team-wide score |
| Priority support | ✅ |
| Onboarding | Guided setup for all members |

---

### Business / Enterprise — Custom Pricing (Future)
> Goal: Companies managing employee Google Workspace / Microsoft 365 accounts.

| Feature | Included |
|---|---|
| Everything in Team | ✅ |
| Employee accounts | Unlimited |
| Compliance reporting | SOC2, GDPR-ready reports |
| Bulk onboarding | CSV upload for teams |
| SSO integration | SAML / OAuth |
| API access | REST API for custom integrations |
| Dedicated support | Slack channel + account manager |

---

## 3. Supported Providers (Rollout Plan)

| Provider | Priority | Status | Notes |
|---|---|---|---|
| Gmail / Google | P0 | 🟡 Building | Launch MVP with this |
| Outlook / Microsoft | P1 | 🔴 Planned | Microsoft Graph API, same problem exists |
| Apple / iCloud | P2 | 🔴 Planned | Smaller market but completes the offering |
| Yahoo Mail | P3 | 🔴 Future | Still widely used in some regions |

---

## 4. Feature Roadmap

### Phase 1 — MVP Launch (Month 1–2)
- [ ] Google OAuth integration (read-only scope)
- [ ] Dashboard showing all connected apps per account
- [ ] Basic risk scoring (based on permissions granted)
- [ ] One-tap revoke functionality
- [ ] Waitlist → invite flow
- [ ] Free tier (1 Gmail account)
- [ ] Landing page with demo

### Phase 2 — Pro Launch (Month 3–4)
- [ ] Payment integration (Stripe / Paystack for Ghana & Africa)
- [ ] Multi-account support (unlimited Gmail)
- [ ] Auto-scan every 24 hours (background job)
- [ ] Real-time alerts (email + push notification)
- [ ] Security score (0–100 per account)
- [ ] Scan history & timeline view
- [ ] Weekly security digest email
- [ ] PDF export of reports

### Phase 3 — Multi-Provider (Month 5–6)
- [ ] Outlook / Microsoft account support
- [ ] Apple Mail / iCloud support
- [ ] Unified dashboard across all providers
- [ ] Cross-provider risk comparison
- [ ] "Ghost App" cleanup wizard (guided removal flow)

### Phase 4 — Team & Breach Detection (Month 7–8)
- [ ] Family/Team tier launch
- [ ] Admin dashboard for team managers
- [ ] Breach detection integration (HaveIBeenPwned API)
- [ ] Shared security scores
- [ ] Invite & onboarding flow for team members
- [ ] Permission timeline visualization

### Phase 5 — Enterprise & API (Month 9–12)
- [ ] Business tier with custom pricing
- [ ] REST API for developers
- [ ] SSO / SAML integration
- [ ] Compliance reporting (SOC2, GDPR)
- [ ] Bulk employee onboarding
- [ ] Dedicated support channels

---

## 5. Key Features Deep Dive

### Security Score (Pro+)
- Each account gets a score out of 100
- Factors: number of risky apps, unused apps, permission breadth, time since last review
- Shareable badge: "My AppScope score is 94/100" → free marketing
- Score improves as user revokes risky apps → gamification

### Real-Time Alerts (Pro+)
- Triggered when a new third-party app connects to any linked account
- Notification channels: email, push notification, in-app
- Example: "⚠️ 'SketchyQuiz.io' just got access to your work Gmail — tap to review"

### Breach Detection (Pro+)
- Uses HaveIBeenPwned API to check if email appears in known data breaches
- Shows which breaches, what data was exposed, and when
- Recommends actions: change password, enable 2FA, revoke suspicious apps
- Huge value-add that justifies the Pro price alone

### Weekly Security Digest (Pro+)
- Email sent every Monday morning
- Contents: new apps connected, risk score changes, apps recommended for removal
- Keeps users engaged even when not opening the app
- Drives retention and reduces churn

### Ghost App Cleanup Wizard (Pro+)
- Guided flow that walks through every unused app (not used in 3+ months)
- For each app: shows permissions, last used date, risk level
- User picks: Keep / Revoke / Remind Me Later
- Satisfying progress bar and completion celebration
- Makes security feel like spring cleaning, not a chore

### Permission Timeline (Pro+)
- Visual timeline showing when each app was connected
- Highlights permission changes over time
- Eye-opening for users who see apps from years ago still active
- Shareable — users post screenshots → organic growth

---

## 6. Revenue Projections

### Conservative Estimate (Year 1)

| Metric | Count |
|---|---|
| Waitlist signups | 2,000 |
| Free users (conversion from waitlist) | 1,000 |
| Pro users (10% conversion) | 100 |
| Pro price | $4/month |
| Monthly revenue | $400 |
| Annual revenue | $4,800 |

### Optimistic Estimate (Year 1)

| Metric | Count |
|---|---|
| Waitlist signups | 10,000 |
| Free users | 5,000 |
| Pro users (10% conversion) | 500 |
| Team users (2% conversion) | 100 |
| Pro revenue | $2,000/month |
| Team revenue | $1,000/month |
| Monthly revenue | $3,000 |
| Annual revenue | $36,000 |

### Path to $10K MRR
- 2,500 Pro users at $4/month = $10,000/month
- Or 1,500 Pro + 200 Team = $10,000/month
- Achievable within 18–24 months with consistent growth

---

## 7. Tech Stack (Recommended)

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Already built, fast, modern |
| Hosting | Render / Vercel | Free tier available, easy deploy |
| Database | Supabase (PostgreSQL) | Free tier, real-time, auth built-in |
| Auth | Supabase Auth + Google OAuth | Handles multi-provider login |
| Payments | Stripe + Paystack | Stripe for global, Paystack for Africa |
| Email | Resend / SendGrid | Transactional emails + weekly digest |
| Background Jobs | Supabase Edge Functions / Cron | Auto-scan scheduling |
| Breach API | HaveIBeenPwned API | $3.50/month for API access |
| Analytics | PostHog (free tier) | Track user behavior and conversions |

---

## 8. Marketing Strategy

### Channels

| Channel | Strategy |
|---|---|
| LinkedIn | Weekly "build in public" posts showing progress |
| Reddit | Post in r/SideProject, r/privacy, r/google, r/cybersecurity |
| Twitter/X | Thread-based storytelling + demo GIFs |
| Product Hunt | Launch when Pro tier is ready |
| TikTok/Reels | Short videos: "I found 47 apps connected to my Gmail" |
| Tech blogs | Guest posts on cybersecurity and privacy |
| Ghana tech community | DevFest, GDG meetups, local tech Twitter |

### Growth Loops
1. **Security Score Sharing** — Users share their score on social media → friends check theirs → new signups
2. **Weekly Digest** — "Your security improved this week" → users forward to friends
3. **Family/Team Invites** — One user invites family → 5 new users per conversion
4. **Referral Program** — "Invite 3 friends, get 1 month Pro free"

---

## 9. Competitive Advantage

| Us (AppScope) | Google's Built-in Settings |
|---|---|
| All accounts in one place | Login to each separately |
| Risk scoring with explanations | Raw list, no guidance |
| Alerts when new apps connect | No notifications |
| Bulk revoke | One at a time |
| Multi-provider (Gmail + Outlook + Apple) | Google only |
| Security score & history | No tracking |
| Breach detection | Not included |

---

## 10. Key Metrics to Track

| Metric | Target (Month 6) |
|---|---|
| Waitlist signups | 2,000+ |
| Monthly active users | 500+ |
| Free → Pro conversion | 10%+ |
| Monthly churn (Pro) | < 5% |
| Monthly recurring revenue | $500+ |
| Apps scanned per user | 15+ average |
| Risky apps found per user | 3+ average |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Google restricts OAuth scopes | Apply for verified app status early; maintain minimal scopes |
| Users don't trust third-party access | Read-only access only; transparent privacy policy; open-source option |
| Low conversion to paid | Test pricing; add high-value features (breach detection) to Pro |
| Competition from Google improving their UI | Multi-provider support is our moat; Google won't support Outlook/Apple |
| Payment adoption in Africa | Support Paystack + mobile money alongside Stripe |

---

*Last updated: February 2026*
*Built with ❤️ in Ghana 🇬🇭*