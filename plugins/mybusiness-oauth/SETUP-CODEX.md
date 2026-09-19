# MyBusiness — OAuth (1.3.2)

אפשרות זו מתקינה את הסקילים ואת שרת MyBusiness MCP יחד. החיבור מתבצע דרך הדפדפן, ללא הזנת App ID או טוקן וללא תוכנה נוספת.

1. ב-Marketplace של mybusiness בחרו **MyBusiness — OAuth** והתקינו. אם מוצג שם טכני, זהו **mybusiness-oauth**.
2. ב-Settings → Plugins → MCPs, תחת From plugins, לחצו **Authenticate** ליד MyBusiness. אם ההתקנה כבר פתחה בקשת כניסה, השלימו אותה.
3. התחברו בדפדפן למערכת MyBusiness הרצויה ובדקו את החשבון והמערכת במסך אישור הגישה. אשרו את הגישה וחזרו ל-Codex.
4. פתחו משימה חדשה ובקשו: קרא Usage-Guide, בדוק Get-Current-User ו-Get-Schema והצג את המשתמש ושמות הטבלאות בלי לשנות נתונים.

מנהל המערכת צריך לאפשר למשתמש גישת MCP דרך הגדרות → משתמשים → MCP Permissions → Read ואז apply. הרשאות Create ו-Update מוסיפים רק לפי הצורך. ההרשאות מצטרפות להרשאות התפקיד ואינן מרחיבות אותן.

התקינו רק אחת משתי אפשרויות MyBusiness כדי למנוע כפילות של סקילים וחיבורים. אם כבר הוספתם Custom MCP אישי בשם MyBusiness, השביתו אותו בעת בדיקת אפשרות OAuth.

אם מתקבלת שגיאה בכניסה, שמרו את נוסח השגיאה ללא טוקנים. כשל בדף authorize או בחזרה ל-Codex שונה מכשל הרשאה בכלי CRM לאחר כניסה. אל תוסיפו כותרות API כדי לעקוף את השגיאה במסלול הזה. ייתכן שתידרש כניסה מחדש כשההרשאה פגה.

נבדקו גילוי שרת ההרשאות ו-PKCE S256. כניסה מלאה מתוך Codex וגישה למערכת שלכם עדיין מחייבות את התחברות המשתמש; גילוי OAuth לבדו אינו הוכחת חיבור פעיל.

## הרשאות

OAuth פועל בהרשאות המשתמש. יש לאפשר את סוגי הפעולות במסך User Settings → MCP Permissions. כלים מתקדמים מחייבים בקשת פתיחה מ-MyBusiness, תפקיד Admin וסימון Edit pages and schema. בטוקן API הגישה מלאה ושלב הפתיחה הזה אינו נדרש. [הסבר וצילומי מסך](PERMISSIONS.md).

## Known connection failure — verified 2026-09-19

On Codex Desktop 26.915.31029, Authenticate can fail before opening a browser. Reproducing the request through the bundled Codex app-server returned `Registration failed: Dynamic registration failed: HTTP 403 Forbidden`. OAuth discovery endpoints return HTTP 200, so discovery alone does not establish that login works.

This failure occurs during OAuth client registration, before user sign-in or CRM permission checks. Reinstalling the plugin or enabling user MCP Permissions is not a demonstrated fix. The MyBusiness service/edge owner needs to investigate the rejected registration request, including the desktop loopback callback. Do not disable OAuth validation or broadly relax firewall rules. After correcting the rejection, verify browser sign-in and a read-only Get-Current-User call from Codex.

No successful end-to-end OAuth login has been verified for this installation.
