"""MyBusiness local MCP bridge and credential setup. Python 3.11+, Windows.

CRM credentials live in Bitwarden Secrets Manager. The local profile contains
only secret IDs. stdout is reserved for MCP; credentials never enter tool args.
"""
import ctypes
from ctypes import wintypes as W
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import urllib.request
import uuid

ENDPOINT = 'https://mcp.mbapps.co.il/'
DATA = Path(os.environ.get('LOCALAPPDATA', Path.home() / '.local/share')) / 'MyBusiness' / 'Codex'
PROFILE = DATA / 'connection.json'
HELP = 'Choose MyBusiness → הגדרת חיבור, or ask: פתח את הגדרת החיבור של MyBusiness. Enter App ID and API token in the local window, never in chat. Requires Python 3.11+ with Tk and Bitwarden Secrets Manager CLI.'


class SetupError(Exception):
    pass


class Credential(ctypes.Structure):
    _fields_ = [('Flags', W.DWORD), ('Type', W.DWORD), ('TargetName', W.LPWSTR),
                ('Comment', W.LPWSTR), ('LastWritten', W.FILETIME),
                ('CredentialBlobSize', W.DWORD), ('CredentialBlob', ctypes.POINTER(ctypes.c_byte)),
                ('Persist', W.DWORD), ('AttributeCount', W.DWORD), ('Attributes', ctypes.c_void_p),
                ('TargetAlias', W.LPWSTR), ('UserName', W.LPWSTR)]


def credential_targets():
    if os.name != 'nt':
        return []
    count = W.DWORD()
    values = ctypes.POINTER(ctypes.POINTER(Credential))()
    api = ctypes.WinDLL('advapi32', use_last_error=True)
    api.CredEnumerateW.argtypes = [W.LPCWSTR, W.DWORD, ctypes.POINTER(W.DWORD), ctypes.POINTER(ctypes.POINTER(ctypes.POINTER(Credential)))]
    if not api.CredEnumerateW(None, 0, ctypes.byref(count), ctypes.byref(values)):
        return []
    try:
        return [values[i].contents.TargetName for i in range(count.value)
                if any(s in values[i].contents.TargetName.lower() for s in ('bws', 'bitwarden'))]
    finally:
        api.CredFree(ctypes.cast(values, ctypes.c_void_p))


def machine_token(target):
    if os.environ.get('BWS_ACCESS_TOKEN'):
        return os.environ['BWS_ACCESS_TOKEN']
    if os.name != 'nt' or not target:
        raise SetupError('יש להגדיר תחילה גישה לכספת Bitwarden Secrets Manager.')
    api = ctypes.WinDLL('advapi32', use_last_error=True)
    ptr = ctypes.POINTER(Credential)()
    api.CredReadW.argtypes = [W.LPCWSTR, W.DWORD, W.DWORD, ctypes.POINTER(ctypes.POINTER(Credential))]
    if not api.CredReadW(target, 1, 0, ctypes.byref(ptr)):
        raise SetupError('פרטי הגישה לכספת לא נמצאו ב-Windows Credential Manager.')
    try:
        c = ptr.contents
        return ctypes.string_at(c.CredentialBlob, c.CredentialBlobSize).decode('utf-16-le')
    finally:
        api.CredFree(ctypes.cast(ptr, ctypes.c_void_p))


def bws_path():
    found = shutil.which('bws')
    fallback = Path(os.environ.get('LOCALAPPDATA', '')) / 'BitwardenSM/bws.exe'
    if found:
        return found
    if fallback.is_file():
        return str(fallback)
    raise SetupError('חסר Bitwarden Secrets Manager CLI (bws). התקינו אותו והגדירו גישה לכספת לפי מדריך הפלאגין.')


def vault(args, target):
    env = dict(os.environ, BWS_ACCESS_TOKEN=machine_token(target))
    try:
        result = subprocess.run([bws_path(), *args, '-o', 'json'], env=env,
                                capture_output=True, text=True, encoding='utf-8', timeout=45,
                                creationflags=0x08000000 if os.name == 'nt' else 0)
        if result.returncode:
            raise SetupError('הגישה לכספת נכשלה. בדקו הרשאות לפרויקט והתחברות ל-Bitwarden.')
        return json.loads(result.stdout)
    except (OSError, subprocess.TimeoutExpired, ValueError):
        raise SetupError('לא ניתן לקרוא את הכספת. בדקו את התקנת bws והחיבור לרשת.') from None


def load_headers():
    if not PROFILE.is_file():
        raise SetupError(HELP)
    profile = json.loads(PROFILE.read_text('utf-8'))
    return {name: vault(['secret', 'get', sid], profile['credential_target'])['value']
            for name, sid in profile['secret_ids'].items()}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise SetupError('כתובת שרת החיבור השתנתה. יש לפנות לתמיכה.')


class Remote:
    def __init__(self, headers):
        self.headers = headers
        self.session = None
        self.protocol = '2025-03-26'
        self.counter = 0

    def request(self, method, params=None, notification=False):
        self.counter += 1
        body = {'jsonrpc': '2.0', 'method': method}
        if not notification:
            body['id'] = self.counter
        if params is not None:
            body['params'] = params
        headers = dict(self.headers, **{'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'})
        if self.session:
            headers['Mcp-Session-Id'] = self.session
        if method != 'initialize':
            headers['MCP-Protocol-Version'] = self.protocol
        try:
            req = urllib.request.Request(ENDPOINT, json.dumps(body).encode(), headers)
            with urllib.request.build_opener(NoRedirect).open(req, timeout=45) as response:
                self.session = response.headers.get('Mcp-Session-Id', self.session)
                if notification:
                    return {}
                if 'text/event-stream' in response.headers.get('Content-Type', ''):
                    chunks = []
                    for raw in response:
                        line = raw.decode('utf-8').rstrip('\r\n')
                        if line.startswith('data:'):
                            chunks.append(line[5:].lstrip())
                        elif not line and chunks:
                            value = json.loads('\n'.join(chunks))
                            chunks = []
                            if value.get('id') == body['id']:
                                break
                    else:
                        raise SetupError('השרת לא החזיר תשובה תקינה.')
                else:
                    value = json.load(response)
            if value.get('error'):
                raise SetupError('השרת דחה את הבקשה. בדקו App ID, טוקן והרשאות.')
            return value['result']
        except SetupError:
            raise
        except Exception:
            raise SetupError('החיבור ל-MyBusiness נכשל. בדקו App ID, טוקן וחיבור לרשת; אין צורך ב-Authenticate.') from None

    def initialize(self):
        result = self.request('initialize', {'protocolVersion': self.protocol, 'capabilities': {},
                              'clientInfo': {'name': 'mybusiness-codex', 'version': '1.2.0'}})
        self.protocol = result.get('protocolVersion', self.protocol)
        self.request('notifications/initialized', notification=True)


def verify(headers):
    remote = Remote(headers)
    remote.initialize()
    for name in ('Usage-Guide', 'Get-Current-User', 'Get-Schema'):
        result = remote.request('tools/call', {'name': name, 'arguments': {}})
        text = json.dumps(result, ensure_ascii=False).lower()
        if result.get('isError') or any(word in text for word in ('invalid_token', 'permission denied', 'unauthorized', 'authorization header is required')):
            raise SetupError('בדיקת הגישה נכשלה בשלב ' + name + '. בדקו את פרטי החיבור.')
        if not result.get('content') and not result.get('structuredContent'):
            raise SetupError('השרת החזיר תשובה ריקה בשלב ' + name)


def save_connection(app, token, project, target):
    if not app.strip() or not token.strip() or not project:
        raise SetupError('יש למלא App ID, טוקן ולבחור פרויקט בכספת.')
    headers = {'X-Parse-Application-Id': app.strip(), 'X-Parse-API-Key': token.strip()}
    verify(headers)  # No vault/profile changes until all read-only calls succeed.
    suffix = str(uuid.uuid4())[:8]
    ids = {}
    for name, value in headers.items():
        secret = vault(['secret', 'create', 'MyBusiness-Codex-' + name + '-' + suffix, value, project], target)
        ids[name] = secret['id']
    # Old credentials are retained in the vault if reconnecting; never overwrite another connection.
    DATA.mkdir(parents=True, exist_ok=True)
    temp = PROFILE.with_suffix('.new')
    temp.write_text(json.dumps({'credential_target': target, 'secret_ids': ids}, indent=2), 'utf-8')
    temp.replace(PROFILE)


def setup_window():
    import tkinter as tk
    from tkinter import ttk
    root = tk.Tk()
    root.title('MyBusiness | הגדרת חיבור ל-Codex')
    root.geometry('650x600')
    frame = ttk.Frame(root, padding=24)
    frame.pack(fill='both', expand=True)
    ttk.Label(frame, text='חיבור MyBusiness באמצעות App ID וטוקן', font=('Arial', 17, 'bold')).pack(anchor='e')
    ttk.Label(frame, text='מזינים כאן — הפרטים נשמרים בכספת Bitwarden. אין צורך באימות בדפדפן.', wraplength=590).pack(anchor='e', pady=12)
    fields = {}
    for key, label in [('app', 'Application ID'), ('token', 'API token / מפתח API')]:
        ttk.Label(frame, text=label).pack(anchor='e')
        fields[key] = ttk.Entry(frame, show='•' if key == 'token' else '', width=65)
        fields[key].pack(fill='x', pady=(3, 12))
    ttk.Label(frame, text='מאיפה הפרטים? במערכת: החץ ליד שם המשתמש ← סביבת פיתוח\nDatabases ← בסיס הנתונים שלכם ← Settings\nהעתיקו Application Id; תחת API Keys לחצו Add Key ואז Save.', justify='right').pack(anchor='e', pady=6)
    ttk.Label(frame, text='כספת: הרשאת Bitwarden מתוך Windows Credential Manager', wraplength=590).pack(anchor='e', pady=(15, 3))
    targets = credential_targets()
    target = ttk.Combobox(frame, values=targets, width=60)
    target.pack(fill='x')
    if len(targets) == 1:
        target.set(targets[0])
    ttk.Label(frame, text='אם BWS_ACCESS_TOKEN כבר מוגדר, אין צורך לבחור הרשאה כאן.').pack(anchor='e')
    projects = ttk.Combobox(frame, state='readonly')
    projects.pack(fill='x', pady=8)
    mapping = {}
    status = tk.StringVar(value='הטוקן מעניק גישה מלאה לבסיס הנתונים. בחרו את המערכת הרצויה בזהירות.')
    ttk.Label(frame, textvariable=status, wraplength=585, justify='right').pack(anchor='e', pady=10)

    def background(action):
        for button in buttons:
            button.configure(state='disabled')
        def worker():
            try:
                message = action()
            except SetupError as exc:
                message = str(exc)
            except Exception:
                message = 'ההגדרה נכשלה. לא נחשפו פרטי חיבור. בדקו את מדריך הפלאגין.'
            def finish():
                status.set(message)
                for button in buttons:
                    button.configure(state='normal')
            root.after(0, finish)
        threading.Thread(target=worker, daemon=True).start()

    def refresh():
        chosen = target.get()
        def action():
            rows = vault(['project', 'list'], chosen)
            mapping.clear()
            mapping.update({r['name'] + ' · ' + r['id'][:8]: r['id'] for r in rows})
            def update():
                projects.configure(values=list(mapping))
                if len(mapping) == 1:
                    projects.set(next(iter(mapping)))
            root.after(0, update)
            return 'בחרו פרויקט בכספת ולחצו בדוק ושמור.' if mapping else 'אין פרויקטים זמינים. נדרשת הרשאת כתיבה לפרויקט בכספת.'
        background(action)

    def save():
        app, token = fields['app'].get(), fields['token'].get()
        project, chosen = mapping.get(projects.get()), target.get()
        def action():
            save_connection(app, token, project, chosen)
            root.after(0, lambda: fields['token'].delete(0, 'end'))
            return 'הגישה נבדקה ונשמרה! סגרו חלון זה ופתחו משימה חדשה ב-Codex. בקשו לבדוק את חיבור MyBusiness ואת הטבלאות.'
        status.set('בודק גישה ושומר בכספת…')
        background(action)
    buttons = [ttk.Button(frame, text='1. טען פרויקטים מהכספת', command=refresh),
               ttk.Button(frame, text='2. בדוק ושמור חיבור', command=save)]
    for button in buttons:
        button.pack(fill='x', pady=5)
    if len(targets) == 1 or os.environ.get('BWS_ACCESS_TOKEN'):
        root.after(200, refresh)
    root.mainloop()


def content(text, error=False):
    return {'content': [{'type': 'text', 'text': text}], 'isError': error}


LOCAL_TOOLS = [
    {'name': 'MyBusiness-Setup', 'description': 'Open the local App ID and API token setup window. Never pass credentials in chat. ' + HELP,
     'inputSchema': {'type': 'object', 'properties': {}, 'additionalProperties': False},
     'annotations': {'readOnlyHint': False, 'destructiveHint': False, 'openWorldHint': False}},
    {'name': 'MyBusiness-Connection-Status', 'description': 'Read connection setup status without revealing credentials. Does not prove live CRM access.',
     'inputSchema': {'type': 'object', 'properties': {}, 'additionalProperties': False},
     'annotations': {'readOnlyHint': True, 'openWorldHint': False}}
]


def serve():
    remote = None
    setup_process = None
    def get_remote():
        nonlocal remote
        if remote is None:
            remote = Remote(load_headers())
            remote.initialize()
        return remote
    for line in sys.stdin:
        request = {}
        try:
            request = json.loads(line)
            if 'id' not in request:
                continue
            method, params = request['method'], request.get('params', {})
            if method == 'initialize':
                result = {'protocolVersion': params.get('protocolVersion', '2025-03-26'),
                          'capabilities': {'tools': {}}, 'serverInfo': {'name': 'MyBusiness', 'version': '1.2.0'},
                          'instructions': HELP}
            elif method == 'ping':
                result = {}
            elif method == 'tools/list':
                result = {'tools': list(LOCAL_TOOLS)}
                if PROFILE.is_file():
                    try:
                        page = get_remote().request('tools/list', params)
                        result['tools'].extend(page.get('tools', []))
                        if page.get('nextCursor'):
                            result['nextCursor'] = page['nextCursor']
                    except SetupError:
                        remote = None  # Setup tools remain available for expired/revoked keys.
            elif method == 'tools/call':
                name = params.get('name')
                if name == 'MyBusiness-Setup':
                    if params.get('arguments'):
                        raise SetupError('אין להעביר פרטי חיבור בכלי. מזינים אותם רק בחלון ההגדרה.')
                    if setup_process is None or setup_process.poll() is not None:
                        executable = Path(sys.executable)
                        if os.name == 'nt' and executable.with_name('pythonw.exe').is_file():
                            executable = executable.with_name('pythonw.exe')
                        setup_process = subprocess.Popen([str(executable), str(Path(__file__).resolve()), 'setup'],
                            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                            creationflags=0x08000000 if os.name == 'nt' else 0)
                    result = content('חלון הגדרת חיבור נפתח במחשב. הזינו בו App ID וטוקן, טענו פרויקטים בכספת ובחרו בדוק ושמור. לאחר הצלחה פתחו משימה חדשה. אם החלון לא מופיע, ראו SETUP-CODEX.md בפלאגין.')
                elif name == 'MyBusiness-Connection-Status':
                    result = content(('הוגדר חיבור בכספת. נדרשת בדיקת Usage-Guide, Get-Current-User, Get-Schema כדי לאמת גישה חיה.' if PROFILE.is_file() else 'החיבור טרם הוגדר. ' + HELP))
                else:
                    result = get_remote().request('tools/call', params)
            else:
                raise SetupError('Unsupported MCP method')
            reply = {'jsonrpc': '2.0', 'id': request['id'], 'result': result}
        except Exception as exc:
            message = str(exc) if isinstance(exc, SetupError) else 'MyBusiness connection failed. Open MyBusiness-Setup; see SETUP-CODEX.md.'
            if request.get('method') == 'tools/call':
                reply = {'jsonrpc': '2.0', 'id': request.get('id'), 'result': content(message, True)}
            else:
                reply = {'jsonrpc': '2.0', 'id': request.get('id'), 'error': {'code': -32603, 'message': message}}
        print(json.dumps(reply, ensure_ascii=True), flush=True)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'setup':
        setup_window()
    else:
        serve()
