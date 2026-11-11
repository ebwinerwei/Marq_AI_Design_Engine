"""Project-local configuration. Python 3.9+, no dependencies or shell edits."""
import getpass
import json
import os
import secrets
import sys
import tempfile
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent / '.marq-local.json'
FIELDS = ('OPENAI_API_KEY', 'OPENAI_MODEL', 'MARQ_DEMO_TOKEN')

def read_config(path=CONFIG_PATH):
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, dict) or any(k in data and not isinstance(data[k], str) for k in FIELDS):
        raise ValueError('配置格式不正确；请备份 .marq-local.json 后修正。')
    return {k: data[k].strip() for k in FIELDS if k in data}

def save_config(data, path=CONFIG_PATH):
    fd, name = tempfile.mkstemp(prefix='.marq-config-', dir=str(path.parent))
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)

def configure(force=False, path=CONFIG_PATH, environ=None):
    env = os.environ if environ is None else environ
    saved = read_config(path)
    # Saved project settings are authoritative; inherited variables bootstrap only.
    data = {k: saved.get(k) or env.get(k, '').strip() for k in FIELDS}
    needs_input = force or not data['OPENAI_API_KEY'] or not data['OPENAI_MODEL']
    if needs_input:
        if not sys.stdin.isatty():
            raise ValueError('请在终端执行 python3 server.py，完成首次配置。')
        print('配置仅保存在本项目 .marq-local.json（明文，权限600），不修改Mac全局环境。')
        key = getpass.getpass('OPENAI_API_KEY（隐藏输入；已有配置可直接回车保留）：').strip()
        if key: data['OPENAI_API_KEY'] = key
        model = input('OPENAI_MODEL [' + (data['OPENAI_MODEL'] or 'gpt-6.1-sol') + ']：').strip()
        data['OPENAI_MODEL'] = model or data['OPENAI_MODEL'] or 'gpt-6.1-sol'
        if not data['OPENAI_API_KEY']: raise ValueError('OPENAI_API_KEY 不能为空。')
    if len(data['MARQ_DEMO_TOKEN']) < 24:
        data['MARQ_DEMO_TOKEN'] = secrets.token_hex(24)
    if data != saved: save_config(data, path)
    # These assignments affect only the current Python process and its children.
    env.update(data)
    return data
