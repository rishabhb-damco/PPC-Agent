"""
Email alert service via Resend API.
Uses httpx (already in requirements) — no extra packages needed.
"""

import httpx
from datetime import datetime
from config import settings

RESEND_URL = "https://api.resend.com/emails"
FROM_ADDRESS = "PPC Agent <onboarding@resend.dev>"


def _severity_color(severity: str) -> str:
    return {"critical": "#EF4444", "error": "#F97316", "warning": "#F59E0B", "info": "#6366F1"}.get(severity, "#6B7280")


def _severity_icon(severity: str) -> str:
    return {"critical": "🔴", "error": "🟠", "warning": "🟡", "info": "🔵"}.get(severity, "⚪")


def build_alert_email(alerts: list, brands: list = None, source: str = "dashboard") -> tuple[str, str]:
    """Build subject + HTML body for an alert summary email."""
    now = datetime.now().strftime("%d %b %Y, %H:%M")
    critical_count = len([a for a in alerts if a.get("severity") in ("critical", "error")])
    warning_count  = len([a for a in alerts if a.get("severity") == "warning"])

    subject = f"⚠️ PPC Agent — {critical_count} Critical Alert{'s' if critical_count != 1 else ''} · {now}"
    if critical_count == 0 and warning_count > 0:
        subject = f"🟡 PPC Agent — {warning_count} Warning{'s' if warning_count != 1 else ''} · {now}"

    # Alert rows
    alert_rows = ""
    for a in alerts[:10]:  # cap at 10 in email
        color = _severity_color(a.get("severity", "info"))
        icon  = _severity_icon(a.get("severity", "info"))
        alert_rows += f"""
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a30;vertical-align:top;width:4px;background:{color}"></td>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a30">
            <div style="font-size:13px;font-weight:600;color:#f4f4f5">{icon} {a.get('title','')}</div>
            <div style="font-size:12px;color:#a1a1aa;margin-top:3px">{a.get('description','')}</div>
            <div style="font-size:11px;color:#52525b;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">
              {a.get('platform','').upper()}
              {f"· {a.get('campaign','')}" if a.get('campaign') else ""}
            </div>
          </td>
        </tr>"""

    # Brand summary rows
    brand_rows = ""
    if brands:
        for b in brands:
            pending = b.get("approval_stats", {}).get("pending", 0) if isinstance(b.get("approval_stats"), dict) else 0
            hi      = b.get("approval_stats", {}).get("high_impact_pending", 0) if isinstance(b.get("approval_stats"), dict) else 0
            status  = b.get("analysis_status", "unknown")
            dot     = "#10B981" if status == "completed" else "#F59E0B" if status == "running" else "#6B7280"
            brand_rows += f"""
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #1e1e22">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:{dot};margin-right:8px;vertical-align:middle"></span>
                <span style="font-size:13px;color:#e4e4e7;font-weight:500">{b.get('name','')}</span>
              </td>
              <td style="padding:8px 16px;border-bottom:1px solid #1e1e22;text-align:center">
                <span style="font-size:12px;color:#a1a1aa">{b.get('industry','')}</span>
              </td>
              <td style="padding:8px 16px;border-bottom:1px solid #1e1e22;text-align:right">
                {"<span style='font-size:12px;font-weight:700;color:#F59E0B'>" + str(pending) + " pending</span>" if pending > 0 else "<span style='color:#52525b;font-size:12px'>—</span>"}
              </td>
            </tr>"""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#111113;border:1px solid #2a2a30;border-radius:12px 12px 0 0;padding:20px 24px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;background:#6366F1;border-radius:8px;display:inline-block;text-align:center;line-height:32px;font-size:16px">⚡</div>
                    <span style="font-size:15px;font-weight:700;color:#ffffff;margin-left:10px">PPC Agent</span>
                    <span style="font-size:12px;color:#71717a;margin-left:8px">Alert Summary</span>
                  </div>
                </td>
                <td style="text-align:right">
                  <span style="font-size:11px;color:#52525b">{now}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Summary pills -->
        <tr>
          <td style="background:#1c1c1f;border-left:1px solid #2a2a30;border-right:1px solid #2a2a30;padding:16px 24px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:8px">
                  <span style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px">
                    🔴 {critical_count} Critical
                  </span>
                </td>
                <td>
                  <span style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:#f59e0b;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px">
                    🟡 {warning_count} Warning{'s' if warning_count != 1 else ''}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alerts table -->
        {"<tr><td style='background:#1c1c1f;border-left:1px solid #2a2a30;border-right:1px solid #2a2a30;padding:0 0 0 0'><div style='padding:12px 24px 8px;font-size:10px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.1em'>Active Alerts</div><table width='100%' cellpadding='0' cellspacing='0'>" + alert_rows + "</table></td></tr>" if alerts else ""}

        <!-- Client summary -->
        {"<tr><td style='background:#1c1c1f;border-left:1px solid #2a2a30;border-right:1px solid #2a2a30;padding:0'><div style='padding:16px 24px 8px;font-size:10px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.1em'>Clients</div><table width='100%' cellpadding='0' cellspacing='0'>" + brand_rows + "</table></td></tr>" if brand_rows else ""}

        <!-- CTA -->
        <tr>
          <td style="background:#1c1c1f;border:1px solid #2a2a30;border-top:1px solid #2a2a30;border-radius:0 0 12px 12px;padding:20px 24px;text-align:center">
            <a href="https://ppc-agent-frontend.onrender.com"
               style="display:inline-block;background:#6366F1;color:#ffffff;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none">
              Open Command Centre →
            </a>
            <div style="margin-top:12px;font-size:11px;color:#52525b">
              Damco Digital — Internal Tool · Sent by PPC Agent
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return subject, html


async def send_alert_email(alerts: list, brands: list = None, source: str = "dashboard") -> dict:
    """Send an alert summary email via Resend."""
    if not settings.RESEND_API_KEY:
        return {"sent": False, "error": "RESEND_API_KEY not configured"}
    if not alerts:
        return {"sent": False, "error": "No alerts to send"}

    subject, html = build_alert_email(alerts, brands, source)

    try:
        resp = httpx.post(
            RESEND_URL,
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from":    FROM_ADDRESS,
                "to":      [settings.ALERT_EMAIL_TO],
                "subject": subject,
                "html":    html,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return {"sent": True, "id": resp.json().get("id"), "to": settings.ALERT_EMAIL_TO}
    except httpx.HTTPStatusError as e:
        return {"sent": False, "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}"}
    except Exception as e:
        return {"sent": False, "error": str(e)}
