"""
Google Ads API service.
Returns None from all methods when credentials are not configured —
callers fall back to mock data automatically.
"""
import asyncio
from typing import List, Optional
from config import settings

GOOGLE_ADS_AVAILABLE = False
try:
    from google.ads.googleads.client import GoogleAdsClient
    GOOGLE_ADS_AVAILABLE = True
except ImportError:
    pass


class GoogleAdsService:
    def __init__(self):
        self.client = None
        self.customer_id = ""
        self._init_client()

    def _init_client(self):
        if not GOOGLE_ADS_AVAILABLE:
            return
        required = [
            settings.GOOGLE_ADS_DEVELOPER_TOKEN,
            settings.GOOGLE_ADS_CLIENT_ID,
            settings.GOOGLE_ADS_CLIENT_SECRET,
            settings.GOOGLE_ADS_REFRESH_TOKEN,
            settings.GOOGLE_ADS_CUSTOMER_ID,
        ]
        if not all(required):
            return
        try:
            cfg = {
                "developer_token": settings.GOOGLE_ADS_DEVELOPER_TOKEN,
                "client_id": settings.GOOGLE_ADS_CLIENT_ID,
                "client_secret": settings.GOOGLE_ADS_CLIENT_SECRET,
                "refresh_token": settings.GOOGLE_ADS_REFRESH_TOKEN,
                "use_proto_plus": True,
            }
            # Only set login_customer_id if it's different from customer_id
            # (i.e. accessing a sub-account through an MCC)
            # If the account is directly accessible, omit it to avoid PERMISSION_DENIED
            cid = settings.GOOGLE_ADS_CUSTOMER_ID.replace("-", "")
            lcid = settings.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace("-", "") if settings.GOOGLE_ADS_LOGIN_CUSTOMER_ID else ""
            if lcid and lcid != cid:
                cfg["login_customer_id"] = lcid
            self.client = GoogleAdsClient.load_from_dict(cfg)
            self.customer_id = settings.GOOGLE_ADS_CUSTOMER_ID.replace("-", "")
        except Exception as e:
            print(f"[GoogleAdsService] Init failed: {e}")

    @property
    def is_configured(self) -> bool:
        return self.client is not None and bool(self.customer_id)

    def _query(self, gaql: str) -> list:
        svc = self.client.get_service("GoogleAdsService")
        return list(svc.search(customer_id=self.customer_id, query=gaql))

    # ── Sync fetchers (run in thread pool) ───────────────────────────────────

    def _fetch_campaigns_sync(self, date_range: str) -> List[dict]:
        rows = self._query(f"""
            SELECT
              campaign.id, campaign.name, campaign.status,
              campaign_budget.amount_micros,
              metrics.impressions, metrics.clicks, metrics.ctr,
              metrics.average_cpc, metrics.cost_micros,
              metrics.conversions, metrics.conversions_from_interactions_rate,
              metrics.cost_per_conversion, metrics.all_conversions_value,
              campaign.advertising_channel_type
            FROM campaign
            WHERE segments.date DURING {date_range}
              AND campaign.status != 'REMOVED'
            ORDER BY metrics.cost_micros DESC
        """)
        result = []
        for row in rows:
            c, b, m = row.campaign, row.campaign_budget, row.metrics
            spend = round(m.cost_micros / 1_000_000, 2)
            budget = round(b.amount_micros / 1_000_000, 2) if b.amount_micros else 0
            roas = round(m.all_conversions_value / spend, 2) if spend > 0 else None
            channel = c.advertising_channel_type.name
            network = (
                "Search" if "SEARCH" in channel else
                "Display" if "DISPLAY" in channel else
                "YouTube" if "VIDEO" in channel else
                "Shopping" if "SHOPPING" in channel else "Other"
            )
            result.append({
                "id": str(c.id),
                "name": c.name,
                "status": c.status.name,
                "budget": budget,
                "impressions": m.impressions,
                "clicks": m.clicks,
                "ctr": round(m.ctr * 100, 2),
                "avg_cpc": round(m.average_cpc / 1_000_000, 2),
                "spend": spend,
                "conversions": int(m.conversions),
                "conv_rate": round(m.conversions_from_interactions_rate * 100, 2),
                "cost_per_conv": round(m.cost_per_conversion / 1_000_000, 2) if m.conversions > 0 else 0,
                "roas": roas,
                "quality_score_avg": None,
                "network": network,
                "platform": "google",
            })
        return result

    def _fetch_keywords_sync(self, limit: int) -> List[dict]:
        rows = self._query(f"""
            SELECT
              ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type,
              ad_group_criterion.quality_info.quality_score,
              ad_group_criterion.status,
              metrics.impressions, metrics.clicks, metrics.ctr,
              metrics.average_cpc, metrics.cost_micros, metrics.conversions
            FROM keyword_view
            WHERE segments.date DURING LAST_30_DAYS
              AND ad_group_criterion.status != 'REMOVED'
            ORDER BY metrics.cost_micros DESC
            LIMIT {limit}
        """)
        result = []
        for row in rows:
            kw, m = row.ad_group_criterion, row.metrics
            qs = kw.quality_info.quality_score
            result.append({
                "keyword": kw.keyword.text,
                "match_type": kw.keyword.match_type.name.replace("_", " ").title(),
                "quality_score": qs if qs > 0 else None,
                "impressions": m.impressions,
                "clicks": m.clicks,
                "ctr": round(m.ctr * 100, 2),
                "avg_cpc": round(m.average_cpc / 1_000_000, 2),
                "spend": round(m.cost_micros / 1_000_000, 2),
                "conversions": int(m.conversions),
                "status": kw.status.name,
            })
        return result

    def _fetch_search_terms_sync(self, campaign_id: Optional[str]) -> List[dict]:
        extra = f"AND campaign.id = {campaign_id}" if campaign_id else ""
        rows = self._query(f"""
            SELECT
              search_term_view.search_term,
              search_term_view.status,
              campaign.name,
              metrics.impressions, metrics.clicks, metrics.ctr,
              metrics.average_cpc, metrics.cost_micros, metrics.conversions
            FROM search_term_view
            WHERE segments.date DURING LAST_30_DAYS
              {extra}
            ORDER BY metrics.cost_micros DESC
            LIMIT 200
        """)
        return [{
            "search_term": row.search_term_view.search_term,
            "status": row.search_term_view.status.name,
            "campaign": row.campaign.name,
            "impressions": row.metrics.impressions,
            "clicks": row.metrics.clicks,
            "ctr": round(row.metrics.ctr * 100, 2),
            "avg_cpc": round(row.metrics.average_cpc / 1_000_000, 2),
            "spend": round(row.metrics.cost_micros / 1_000_000, 2),
            "conversions": int(row.metrics.conversions),
        } for row in rows]

    def _fetch_account_summary_sync(self) -> dict:
        rows = self._query("""
            SELECT
              customer.id, customer.descriptive_name,
              customer.currency_code, customer.time_zone,
              metrics.cost_micros, metrics.impressions,
              metrics.clicks, metrics.conversions
            FROM customer
            WHERE segments.date DURING LAST_30_DAYS
        """)
        if not rows:
            return {}
        row = rows[0]
        m = row.metrics
        return {
            "account_id": str(row.customer.id),
            "account_name": row.customer.descriptive_name,
            "currency": row.customer.currency_code,
            "timezone": row.customer.time_zone,
            "last_30d_spend": round(m.cost_micros / 1_000_000, 2),
            "last_30d_impressions": m.impressions,
            "last_30d_clicks": m.clicks,
            "last_30d_conversions": int(m.conversions),
        }

    # ── Public async API ──────────────────────────────────────────────────────

    async def get_campaigns(self, date_range: str = "LAST_30_DAYS") -> Optional[List[dict]]:
        if not self.is_configured:
            return None
        try:
            return await asyncio.to_thread(self._fetch_campaigns_sync, date_range)
        except Exception as e:
            print(f"[GoogleAdsService] get_campaigns error: {e}")
            return None

    async def get_keywords(self, limit: int = 100) -> Optional[List[dict]]:
        if not self.is_configured:
            return None
        try:
            return await asyncio.to_thread(self._fetch_keywords_sync, limit)
        except Exception as e:
            print(f"[GoogleAdsService] get_keywords error: {e}")
            return None

    async def get_search_terms(self, campaign_id: Optional[str] = None) -> Optional[List[dict]]:
        if not self.is_configured:
            return None
        try:
            return await asyncio.to_thread(self._fetch_search_terms_sync, campaign_id)
        except Exception as e:
            print(f"[GoogleAdsService] get_search_terms error: {e}")
            return None

    async def get_account_summary(self) -> Optional[dict]:
        if not self.is_configured:
            return None
        try:
            return await asyncio.to_thread(self._fetch_account_summary_sync)
        except Exception as e:
            print(f"[GoogleAdsService] get_account_summary error: {e}")
            return None


google_ads_service = GoogleAdsService()
