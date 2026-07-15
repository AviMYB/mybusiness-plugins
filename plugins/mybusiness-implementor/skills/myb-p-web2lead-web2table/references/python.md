# Python — web2lead / web2table templates

Uses the `requests` library (`pip install requests`).

## web2lead

```python
"""
Web2Lead — capture a lead into Accounts.
Endpoint: https://api.mbapps.co.il/functions/{APP_ID}/web2lead
Required: PhoneNumber OR Email.
"""
import requests

APP_ID = "{APP_ID}"
URL = f"https://api.mbapps.co.il/functions/{APP_ID}/web2lead"
HEADERS = {
    "Content-Type": "application/json",
    "X-Parse-Application-Id": APP_ID,
}

# Pointer mappings (fill from Get-Data on the targetClass):
# SOURCE_MAP = {"Google": "abc1234567", "Facebook": "def1234567"}


def submit_lead(form: dict) -> dict:
    data = {
        # Required (at least one):
        "PhoneNumber": form.get("phone"),
        "Email":       form.get("email"),
        # Optional, must match Accounts schema:
        "Name":   form.get("full_name"),
        "F_name": form.get("first_name"),
        "L_name": form.get("last_name"),
        "City":   form.get("city"),
        # "LeadSourceId": SOURCE_MAP.get(form.get("source")),
        # "LeadStatusId": "e9TwcETDGq",   # verify via Get-Data on LeadStatuses
    }
    data = {k: v for k, v in data.items() if v}

    if not data.get("PhoneNumber") and not data.get("Email"):
        return {"ok": False, "error": "phone or email required"}

    r = requests.post(URL, json=data, headers=HEADERS, timeout=10)
    if r.status_code == 200 and r.json().get("success"):
        return {"ok": True, "leadId": r.json()["leadId"]}
    if r.status_code == 422: return {"ok": False, "error": "missing phone/email"}
    if r.status_code == 403: return {"ok": False, "error": "web leads disabled"}
    return {"ok": False, "error": "server error", "raw": r.text}
```

## web2table

```python
import requests

APP_ID = "{APP_ID}"
URL = f"https://api.mbapps.co.il/functions/{APP_ID}/web2table"
HEADERS = {"Content-Type": "application/json", "X-Parse-Application-Id": APP_ID}

# STATUS_MAP = {"חדשה": "...", "בטיפול": "..."}


def submit_sale(form: dict) -> dict:
    data = {
        # Required:
        "table": "Sales",                      # ← target class name
        "phone": form.get("phone"),            # ← unprefixed lookup keys
        "email": form.get("email"),

        # Accounts fields:
        "account_Name":      form.get("full_name"),
        "account_CompanyId": form.get("company_id"),
        "account_City":      form.get("city"),
        # "account_IsAccount": "true",   # create as Customer rather than Lead

        # Target-table fields:
        "table_Title":       form.get("sale_title"),
        "table_Amount":      form.get("amount"),               # Number — string ok
        "table_ClosingDate": form.get("closing_date"),         # ISO date string
        # "table_SaleStatusId": STATUS_MAP.get(form.get("status")),
    }
    data = {k: v for k, v in data.items() if v not in (None, "")}

    if not any(data.get(k) for k in ("phone", "email", "idnum")):
        return {"ok": False, "error": "phone, email, or idnum required"}

    r = requests.post(URL, json=data, headers=HEADERS, timeout=10)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code == 200 and body.get("success"):
        return {"ok": True, "accountId": body["accountId"], "id": body["Id"]}
    return {"ok": False, "status": r.status_code, "raw": body or r.text}
```

## Flask endpoint sketch (server-side forwarder)

```python
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/lead", methods=["POST"])
def lead():
    return jsonify(submit_lead(request.form.to_dict()))
```

Pointer values are bare strings: `"e9TwcETDGq"`. Never wrap in `{"__type": "Pointer", ...}` — that's Parse REST and gets silently dropped here.
