# C# — web2lead / web2table templates

Uses `System.Net.Http` (built-in) + `System.Text.Json` (built-in on .NET 5+).

## web2lead

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

public class Web2LeadClient
{
    private const string APP_ID = "{APP_ID}";
    private static readonly HttpClient http = new();

    // Pointer mappings (fill from Get-Data on the targetClass):
    // private static readonly Dictionary<string, string> SourceMap = new() {
    //     { "Google", "abc1234567" }, { "Facebook", "def1234567" }
    // };

    public class LeadForm
    {
        public string Phone { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string City { get; set; }
        // public string Source { get; set; }
    }

    public async Task<JsonElement> SubmitLeadAsync(LeadForm form)
    {
        var data = new Dictionary<string, object>();
        void Add(string k, string v) { if (!string.IsNullOrWhiteSpace(v)) data[k] = v; }

        // digits only - getlead expands phone formats for duplicate detection only for a digits-only value
        Add("PhoneNumber", form.Phone is null ? null : System.Text.RegularExpressions.Regex.Replace(form.Phone, @"\D", ""));
        Add("Email",       form.Email);
        Add("Name",        form.FullName);
        Add("F_name",      form.FirstName);
        Add("L_name",      form.LastName);
        Add("City",        form.City);
        // if (SourceMap.TryGetValue(form.Source ?? "", out var srcId)) data["LeadSourceId"] = srcId;
        // data["LeadStatusId"] = "e9TwcETDGq";  // verify via Get-Data on LeadStatuses

        if (!data.ContainsKey("PhoneNumber") && !data.ContainsKey("Email"))
            throw new ArgumentException("PhoneNumber or Email required");

        var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://api.mbapps.co.il/functions/{APP_ID}/getlead")
        {
            Content = JsonContent.Create(data),
        };
        req.Headers.Add("X-Parse-Application-Id", APP_ID);

        var res = await http.SendAsync(req);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        // getlead wraps its answer: { "result": { "success": true, "leadId": "..." } }
        // errors arrive as HTTP 400 { "error": "<message>" } - surface the message, do not branch on 422/403
        return body.TryGetProperty("result", out var r) ? r : body;
    }
}
```

## web2table

```csharp
public async Task<JsonElement> SubmitSaleAsync(SaleForm form)
{
    var data = new Dictionary<string, object> { ["table"] = "Sales" };
    void Add(string k, object v) { if (v is not null && v.ToString() != "") data[k] = v; }

    Add("phone", form.Phone);
    Add("email", form.Email);

    Add("account_Name",      form.FullName);
    Add("account_CompanyId", form.CompanyId);
    Add("account_City",      form.City);
    // data["account_IsAccount"] = "true";   // create as Customer

    Add("table_Title",       form.SaleTitle);
    Add("table_Amount",      form.Amount);              // Number — string ok
    Add("table_ClosingDate", form.ClosingDate);         // ISO string
    // if (StatusMap.TryGetValue(form.Status ?? "", out var s)) data["table_SaleStatusId"] = s;

    if (!data.ContainsKey("phone"))
        throw new ArgumentException("phone is required — web2table answers 'missing \"phone\"' without it");

    var req = new HttpRequestMessage(HttpMethod.Post,
        $"https://api.mbapps.co.il/functions/{APP_ID}/web2table")
    {
        Content = JsonContent.Create(data),
    };
    req.Headers.Add("X-Parse-Application-Id", APP_ID);

    var res = await http.SendAsync(req);
    return await res.Content.ReadFromJsonAsync<JsonElement>();   // { success, accountId, Id } or 400 { error }
}
```

## ASP.NET Core minimal API sketch

```csharp
var app = WebApplication.CreateBuilder(args).Build();
var client = new Web2LeadClient();
app.MapPost("/lead", async (Web2LeadClient.LeadForm form) => await client.SubmitLeadAsync(form));
app.Run();
```

Single Pointer values are bare strings, e.g. `data["LeadSourceId"] = "abc1234567"`. Never wrap a single Pointer. Arrays of pointers are the exception: send pointer objects (see `../GUIDE.md` Array fields).
