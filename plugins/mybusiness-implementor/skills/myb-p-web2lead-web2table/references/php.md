# PHP — web2lead / web2table templates

## web2lead via cURL (no dependencies)

```php
<?php
/**
 * Web2Lead — capture a lead into Accounts.
 * Endpoint: https://api.mbapps.co.il/functions/{APP_ID}/web2lead
 * Required: PhoneNumber OR Email.
 */

$APP_ID = '{APP_ID}';

// Pointer mappings (if any) — fill from Get-Data on the targetClass
// $sourceMap = ['Google' => 'abc1234567', 'Facebook' => 'def1234567'];

$data = array_filter([
    'PhoneNumber' => $_POST['phone'] ?? '',
    'Email'       => $_POST['email'] ?? '',
    'Name'        => $_POST['fullName'] ?? '',
    'F_name'      => $_POST['firstName'] ?? '',
    'L_name'      => $_POST['lastName'] ?? '',
    'City'        => $_POST['city'] ?? '',
    // 'LeadSourceId' => $sourceMap[$_POST['source'] ?? ''] ?? null,
    // 'LeadStatusId' => 'e9TwcETDGq',  // custom status for new leads, verify via Get-Data
], fn($v) => $v !== '' && $v !== null);

if (empty($data['PhoneNumber']) && empty($data['Email'])) {
    http_response_code(422);
    echo json_encode(['error' => 'Phone or Email required']);
    exit;
}

$ch = curl_init("https://api.mbapps.co.il/functions/{$APP_ID}/web2lead");
curl_setopt_array($ch, [
    CURLOPT_POST            => true,
    CURLOPT_RETURNTRANSFER  => true,
    CURLOPT_HTTPHEADER      => [
        'Content-Type: application/json',
        "X-Parse-Application-Id: {$APP_ID}",
    ],
    CURLOPT_POSTFIELDS      => json_encode($data),
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $resp = json_decode($response, true);
    if (!empty($resp['success'])) {
        echo json_encode(['ok' => true, 'leadId' => $resp['leadId']]);
        exit;
    }
}
// Surface specific errors
if ($httpCode === 422) echo json_encode(['error' => 'missing phone/email']);
elseif ($httpCode === 403) echo json_encode(['error' => 'web leads disabled']);
else                      echo json_encode(['error' => 'server error', 'raw' => $response]);
```

## web2table via cURL

```php
<?php
$APP_ID = '{APP_ID}';

$data = array_filter([
    'table'             => 'Sales',
    'phone'             => $_POST['phone']      ?? '',
    'email'             => $_POST['email']      ?? '',
    'account_Name'      => $_POST['fullName']   ?? '',
    'account_CompanyId' => $_POST['companyId']  ?? '',
    'table_Title'       => $_POST['saleTitle']  ?? '',
    'table_Amount'      => $_POST['amount']     ?? '',
    'table_ClosingDate' => $_POST['closingDate']?? '',     // ISO YYYY-MM-DD
    // 'table_SaleStatusId' => $statusMap[$_POST['status'] ?? ''] ?? null,
    // 'account_IsAccount' => 'true',  // create as Customer (string, not bool)
], fn($v) => $v !== '' && $v !== null);

if (empty($data['phone']) && empty($data['email']) && empty($data['idnum'])) {
    http_response_code(422);
    echo json_encode(['error' => 'phone, email, or idnum required']);
    exit;
}

$ch = curl_init("https://api.mbapps.co.il/functions/{$APP_ID}/web2table");
curl_setopt_array($ch, [
    CURLOPT_POST            => true,
    CURLOPT_RETURNTRANSFER  => true,
    CURLOPT_HTTPHEADER      => [
        'Content-Type: application/json',
        "X-Parse-Application-Id: {$APP_ID}",
    ],
    CURLOPT_POSTFIELDS      => json_encode($data),
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;  // contains {success, accountId, Id}
```

## Guzzle alternative

```php
use GuzzleHttp\Client;

$client = new Client();
$res = $client->post("https://api.mbapps.co.il/functions/{$APP_ID}/web2lead", [
    'headers' => [
        'Content-Type' => 'application/json',
        'X-Parse-Application-Id' => $APP_ID,
    ],
    'json' => $data,   // Guzzle serializes; do NOT also set 'body'
]);
$resp = json_decode($res->getBody()->getContents(), true);
```

Pointer values are bare 10-char objectId strings in PHP just like in any other language — never `['__type'=>'Pointer', ...]`.
