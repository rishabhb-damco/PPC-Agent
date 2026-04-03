from datetime import datetime, timedelta
import random

# ─── Google Ads Mock Data ──────────────────────────────────────────────────────

GOOGLE_CAMPAIGNS = [
    {
        "id": "goog_001", "name": "Brand - Search", "status": "ENABLED",
        "budget": 5000, "impressions": 45230, "clicks": 3820, "ctr": 8.45,
        "avg_cpc": 1.23, "spend": 4698.60, "conversions": 312, "conv_rate": 8.17,
        "cost_per_conv": 15.06, "roas": 8.2, "quality_score_avg": 8.5, "network": "Search",
        "platform": "google",
    },
    {
        "id": "goog_002", "name": "Non-Brand - Search", "status": "ENABLED",
        "budget": 8000, "impressions": 125600, "clicks": 4820, "ctr": 3.84,
        "avg_cpc": 1.58, "spend": 7615.60, "conversions": 284, "conv_rate": 5.89,
        "cost_per_conv": 26.82, "roas": 4.8, "quality_score_avg": 6.8, "network": "Search",
        "platform": "google",
    },
    {
        "id": "goog_003", "name": "Competitor - Search", "status": "ENABLED",
        "budget": 3000, "impressions": 28400, "clicks": 980, "ctr": 3.45,
        "avg_cpc": 2.85, "spend": 2793.00, "conversions": 68, "conv_rate": 6.94,
        "cost_per_conv": 41.07, "roas": 3.2, "quality_score_avg": 5.5, "network": "Search",
        "platform": "google",
    },
    {
        "id": "goog_004", "name": "Display - Remarketing", "status": "ENABLED",
        "budget": 2000, "impressions": 892000, "clicks": 1456, "ctr": 0.16,
        "avg_cpc": 0.85, "spend": 1237.60, "conversions": 42, "conv_rate": 2.89,
        "cost_per_conv": 29.47, "roas": 5.1, "quality_score_avg": None, "network": "Display",
        "platform": "google",
    },
    {
        "id": "goog_005", "name": "YouTube - Awareness", "status": "PAUSED",
        "budget": 4000, "impressions": 285000, "clicks": 2340, "ctr": 0.82,
        "avg_cpc": 0.62, "spend": 1450.80, "conversions": 28, "conv_rate": 1.20,
        "cost_per_conv": 51.81, "roas": 2.1, "quality_score_avg": None, "network": "YouTube",
        "platform": "google",
    },
]

GOOGLE_KEYWORDS = [
    {"keyword": "buy running shoes online", "match_type": "Exact", "quality_score": 9,
     "impressions": 12400, "clicks": 1240, "ctr": 10.0, "avg_cpc": 1.10, "spend": 1364.0, "conversions": 98, "status": "ENABLED"},
    {"keyword": "best running shoes 2024", "match_type": "Phrase", "quality_score": 8,
     "impressions": 8900, "clicks": 623, "ctr": 7.0, "avg_cpc": 1.32, "spend": 822.36, "conversions": 45, "status": "ENABLED"},
    {"keyword": "athletic shoes", "match_type": "Broad", "quality_score": 5,
     "impressions": 45000, "clicks": 810, "ctr": 1.8, "avg_cpc": 1.82, "spend": 1474.20, "conversions": 32, "status": "ENABLED"},
    {"keyword": "running shoes for men", "match_type": "Phrase", "quality_score": 7,
     "impressions": 6200, "clicks": 434, "ctr": 7.0, "avg_cpc": 1.45, "spend": 629.30, "conversions": 38, "status": "ENABLED"},
    {"keyword": "nike running shoes", "match_type": "Exact", "quality_score": 4,
     "impressions": 9800, "clicks": 294, "ctr": 3.0, "avg_cpc": 2.95, "spend": 867.30, "conversions": 14, "status": "ENABLED"},
    {"keyword": "shoes", "match_type": "Broad", "quality_score": 3,
     "impressions": 98000, "clicks": 490, "ctr": 0.5, "avg_cpc": 3.20, "spend": 1568.0, "conversions": 8, "status": "PAUSED"},
]

# ─── Meta Ads Mock Data ────────────────────────────────────────────────────────

META_CAMPAIGNS = [
    {
        "id": "meta_001", "name": "Conversions - Prospecting", "status": "ACTIVE",
        "budget": 6000, "impressions": 520000, "reach": 310000, "frequency": 1.68,
        "clicks": 8320, "ctr": 1.6, "cpc": 0.72, "cpm": 11.22, "spend": 5832.40,
        "results": 248, "result_type": "Purchases", "cost_per_result": 23.52,
        "roas": 5.8, "platform": "meta",
    },
    {
        "id": "meta_002", "name": "Conversions - Retargeting", "status": "ACTIVE",
        "budget": 3000, "impressions": 185000, "reach": 42000, "frequency": 4.40,
        "clicks": 4810, "ctr": 2.6, "cpc": 0.62, "cpm": 16.08, "spend": 2974.80,
        "results": 198, "result_type": "Purchases", "cost_per_result": 15.02,
        "roas": 9.2, "platform": "meta",
    },
    {
        "id": "meta_003", "name": "Traffic - Blog & Content", "status": "ACTIVE",
        "budget": 1500, "impressions": 420000, "reach": 390000, "frequency": 1.08,
        "clicks": 12600, "ctr": 3.0, "cpc": 0.11, "cpm": 3.29, "spend": 1382.40,
        "results": 12600, "result_type": "Link Clicks", "cost_per_result": 0.11,
        "roas": None, "platform": "meta",
    },
    {
        "id": "meta_004", "name": "Awareness - Brand Video", "status": "ACTIVE",
        "budget": 2500, "impressions": 980000, "reach": 820000, "frequency": 1.20,
        "clicks": 3920, "ctr": 0.4, "cpc": 0.61, "cpm": 2.44, "spend": 2391.20,
        "results": 980000, "result_type": "Impressions", "cost_per_result": 0.0024,
        "roas": None, "platform": "meta",
    },
    {
        "id": "meta_005", "name": "Lead Gen - Webinar", "status": "PAUSED",
        "budget": 2000, "impressions": 95000, "reach": 88000, "frequency": 1.08,
        "clicks": 1900, "ctr": 2.0, "cpc": 1.03, "cpm": 20.53, "spend": 1950.35,
        "results": 142, "result_type": "Leads", "cost_per_result": 13.73,
        "roas": None, "platform": "meta",
    },
]

# ─── Alerts ───────────────────────────────────────────────────────────────────

ALERTS = [
    {
        "id": "alert_001", "severity": "critical",
        "title": "Meta Pixel Not Firing on Checkout",
        "description": "Purchase events are not being tracked. Conversion data may be incomplete.",
        "platform": "meta", "campaign": None,
        "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(), "resolved": False,
    },
    {
        "id": "alert_002", "severity": "error",
        "title": "Low Quality Score Keywords",
        "description": "3 keywords with Quality Score ≤ 4 detected in Non-Brand campaign. High CPCs expected.",
        "platform": "google", "campaign": "Non-Brand - Search",
        "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(), "resolved": False,
    },
    {
        "id": "alert_003", "severity": "warning",
        "title": "YouTube Campaign ROAS Below Threshold",
        "description": "YouTube - Awareness ROAS is 2.1, below your target of 3.0. Consider pausing or optimising.",
        "platform": "google", "campaign": "YouTube - Awareness",
        "timestamp": (datetime.now() - timedelta(hours=8)).isoformat(), "resolved": False,
    },
    {
        "id": "alert_004", "severity": "warning",
        "title": "Meta Retargeting Audience Frequency High",
        "description": "Retargeting campaign frequency is 4.4 — ad fatigue risk. Consider refreshing creatives.",
        "platform": "meta", "campaign": "Conversions - Retargeting",
        "timestamp": (datetime.now() - timedelta(hours=12)).isoformat(), "resolved": False,
    },
    {
        "id": "alert_005", "severity": "info",
        "title": "Brand CTR Improved +12%",
        "description": "Brand - Search CTR increased from 7.5% to 8.45% week-over-week.",
        "platform": "google", "campaign": "Brand - Search",
        "timestamp": (datetime.now() - timedelta(hours=24)).isoformat(), "resolved": False,
    },
]

# ─── Technical Health ─────────────────────────────────────────────────────────

HEALTH_CHECKS = [
    {"service": "Google Tag (GTM)", "status": "healthy", "details": "Firing correctly on all pages", "last_checked": datetime.now().isoformat()},
    {"service": "Google Ads Conversion Tag", "status": "healthy", "details": "Purchase & Lead events tracking correctly", "last_checked": datetime.now().isoformat()},
    {"service": "Meta Pixel", "status": "critical", "details": "Pixel not firing on /checkout — missing from page", "last_checked": datetime.now().isoformat()},
    {"service": "Meta CAPI (Conversions API)", "status": "warning", "details": "Event match quality score: 5.8/10 — consider adding more match parameters", "last_checked": datetime.now().isoformat()},
    {"service": "Landing Page Uptime", "status": "healthy", "details": "All 8 tracked URLs responding — avg load 1.4s", "last_checked": datetime.now().isoformat()},
    {"service": "Google Analytics 4", "status": "healthy", "details": "Linked to Google Ads. Conversions importing.", "last_checked": datetime.now().isoformat()},
    {"service": "UTM Parameter Consistency", "status": "warning", "details": "2 Meta campaigns missing utm_content parameter", "last_checked": datetime.now().isoformat()},
    {"service": "Remarketing Lists", "status": "healthy", "details": "All 6 audiences collecting — largest: 45,230 users", "last_checked": datetime.now().isoformat()},
]

# ─── Chart Data (Last 14 days) ─────────────────────────────────────────────────

def get_chart_data():
    base = datetime.now() - timedelta(days=13)
    data = []
    google_spend_base = 550
    meta_spend_base = 420
    for i in range(14):
        day = base + timedelta(days=i)
        data.append({
            "date": day.strftime("%b %d"),
            "google_spend": round(google_spend_base + random.uniform(-60, 80), 2),
            "meta_spend": round(meta_spend_base + random.uniform(-40, 60), 2),
            "google_conversions": random.randint(28, 52),
            "meta_conversions": random.randint(18, 38),
            "google_roas": round(random.uniform(4.2, 6.8), 2),
            "meta_roas": round(random.uniform(5.0, 8.5), 2),
        })
    return data


# ─── KPI Summary ──────────────────────────────────────────────────────────────

def get_kpi_summary():
    google_spend = sum(c["spend"] for c in GOOGLE_CAMPAIGNS)
    meta_spend = sum(c["spend"] for c in META_CAMPAIGNS)
    google_conv = sum(c["conversions"] for c in GOOGLE_CAMPAIGNS)
    meta_conv = sum(c["results"] for c in META_CAMPAIGNS if c["result_type"] in ("Purchases", "Leads"))
    google_roas = round(sum(c["roas"] * c["spend"] for c in GOOGLE_CAMPAIGNS if c["roas"]) / google_spend, 2)
    meta_roas_camps = [c for c in META_CAMPAIGNS if c["roas"]]
    meta_spend_roas = sum(c["spend"] for c in meta_roas_camps)
    meta_roas = round(sum(c["roas"] * c["spend"] for c in meta_roas_camps) / meta_spend_roas, 2) if meta_spend_roas else 0
    total_clicks = sum(c["clicks"] for c in GOOGLE_CAMPAIGNS) + sum(c["clicks"] for c in META_CAMPAIGNS)
    total_impressions = sum(c["impressions"] for c in GOOGLE_CAMPAIGNS) + sum(c["impressions"] for c in META_CAMPAIGNS)
    blended_ctr = round((total_clicks / total_impressions) * 100, 2) if total_impressions else 0
    return {
        "total_spend": round(google_spend + meta_spend, 2),
        "total_roas": round((google_roas + meta_roas) / 2, 2),
        "total_conversions": google_conv + meta_conv,
        "blended_ctr": blended_ctr,
        "google_spend": round(google_spend, 2),
        "meta_spend": round(meta_spend, 2),
        "google_roas": google_roas,
        "meta_roas": meta_roas,
        "google_conversions": google_conv,
        "meta_conversions": meta_conv,
        "spend_change_pct": 8.4,
        "roas_change_pct": -2.1,
        "conv_change_pct": 12.3,
    }
