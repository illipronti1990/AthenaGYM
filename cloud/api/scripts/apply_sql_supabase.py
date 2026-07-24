"""Aplica arquivo .sql no Postgres do Supabase (conexão direta, não pooler)."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def direct_dsn() -> str:
    """
    Preferir DIRECT_URL / DATABASE_URL_DIRECT.
    Fallback: monta a partir de SUPABASE_URL + SUPABASE_PASSWORD (porta 5432).
    """
    for key in ("DATABASE_URL_DIRECT", "DIRECT_URL", "SUPABASE_DB_URL"):
        raw = (os.getenv(key) or "").strip()
        if raw:
            return _to_psycopg(raw)

    password = os.getenv("SUPABASE_PASSWORD") or ""
    project_ref = ""
    url = os.getenv("SUPABASE_URL") or ""
    m = re.search(r"https://([a-z0-9]+)\.supabase\.co", url)
    if m:
        project_ref = m.group(1)
    if not password or not project_ref:
        raise SystemExit(
            "Defina DATABASE_URL_DIRECT ou SUPABASE_URL + SUPABASE_PASSWORD no .env"
        )
    user = quote_plus("postgres")
    pwd = quote_plus(password)
    host = f"db.{project_ref}.supabase.co"
    return f"postgresql://{user}:{pwd}@{host}:5432/postgres?sslmode=require"


def _to_psycopg(url: str) -> str:
    u = url.replace("postgresql+psycopg://", "postgresql://")
    if "sslmode=" not in u:
        u += ("&" if "?" in u else "?") + "sslmode=require"
    return u


def main() -> None:
    sql_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "sql" / "002_portal_tables_supabase.sql"
    if not sql_path.is_absolute():
        sql_path = ROOT / sql_path
    sql = sql_path.read_text(encoding="utf-8")
    dsn = direct_dsn()
    try:
        import psycopg
    except ImportError as exc:
        raise SystemExit("Instale psycopg: pip install 'psycopg[binary]'") from exc

    # Remove comentários de linha e executa statement a statement
    cleaned_lines = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    statements = _split_sql_statements(cleaned)

    print(f"Aplicando {sql_path.name} ({len(statements)} statements)…")
    with psycopg.connect(dsn, connect_timeout=20) as conn:
        for stmt in statements:
            conn.execute(stmt)
        conn.commit()
    print("SQL aplicado com sucesso.")


def _split_sql_statements(sql: str) -> list[str]:
    """Split on ';' but keep dollar-quoted bodies ($$ ... $$) intact."""
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(sql)
    in_dollar = False
    dollar_tag = ""

    while i < n:
        ch = sql[i]
        if not in_dollar and ch == "$":
            m = re.match(r"\$([A-Za-z_]*)\$", sql[i:])
            if m:
                dollar_tag = m.group(0)
                in_dollar = True
                buf.append(dollar_tag)
                i += len(dollar_tag)
                continue
        if in_dollar:
            if sql.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                in_dollar = False
                dollar_tag = ""
                continue
            buf.append(ch)
            i += 1
            continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


if __name__ == "__main__":
    main()
