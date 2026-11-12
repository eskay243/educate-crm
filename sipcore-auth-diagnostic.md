# SIPCore Super Admin Authentication Diagnostic & Resolution Plan

## 1. Diagnostic Findings
When testing authentication via Educate CRM Super Admin or directly via terminal, the remote SIPCore identity endpoint at `https://softworks-us.org/api/v1/auth/login` returns:
```json
HTTP/2 401 Unauthorized
{"success":false,"message":"Invalid credentials"}
```

- **API Endpoint**: `https://softworks-us.org/api/v1/auth/login` is operational and responding.
- **Request Format**: Valid JSON payload `{ "email": "...", "password": "..." }`. Sending an invalid payload triggers ASP.NET's validation (`"The Email field is required"`), confirming our request structure matches the SIPCore API specification.
- **Root Cause**: The remote SIPCore server explicitly reports that no active user account matches `admin@codelab.institute` with password `@12345//`.

---

## 2. Step-by-Step Resolution Plan

- [x] **Task 1: Verify Account Provisioning on SIPCore**
  - Confirmed: The SIPCore tenant account was registered under `codelabeducare@gmail.com` for **CODELAB EDUCARE LIMITED**.
  - User ID: `103`, Company ID: `17`, Roles: `CorporateAdmin`.

- [x] **Task 2: Test Direct Portal Login & API Authentication**
  - Authenticated successfully against `https://softworks-us.org/api/v1/auth/login`.
  - Returned HTTP 200 with active JWT bearer access token.

- [x] **Task 3: Confirm Active Extension & Company Subscription**
  - Confirmed active extension assigned: **`7512`** (Extension ID: `134`, User: `HUMUHANI LAWAL`).
  - Company ID: **`17`** (**CODELAB EDUCARE LIMITED**).

- [x] **Task 4: Update Settings in Educate CRM**
  - Saved credentials directly in CRM system settings:
    - Account Email: `codelabeducare@gmail.com`
    - Company ID: `17`
    - Creator Extension: `7512`
  - Verified `POST /api/sipcore/test-connection` returns HTTP 200 `success: true`.
