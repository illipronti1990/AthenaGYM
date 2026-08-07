"""Reinjeta só modPortal.bas no .xlsm (mais rápido que gerar_erp completo)."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BAS = ROOT / "erp" / "vba" / "modPortal.bas"
XLSM = ROOT / "Excel" / "ATHENA_GYM_ERP_COMERCIAL.xlsm"
if not XLSM.exists():
    XLSM = ROOT / "ATHENA_GYM_ERP_COMERCIAL.xlsm"


def strip_header(code: str) -> str:
    lines = code.splitlines()
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith("Attribute VB_") or s.startswith("VERSION ") or s.startswith("Begin {"):
            continue
        out.append(line)
    return "\n".join(out)


def main() -> int:
    if not BAS.exists() or not XLSM.exists():
        print("Arquivo não encontrado:", BAS, XLSM)
        return 1
    subprocess.run(["taskkill", "/F", "/IM", "EXCEL.EXE"], capture_output=True)
    time.sleep(1.5)

    import win32com.client  # type: ignore

    excel = win32com.client.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    try:
        wb = excel.Workbooks.Open(str(XLSM.resolve()))
        vbproj = wb.VBProject
        name = "modPortal"
        try:
            vbproj.VBComponents.Remove(vbproj.VBComponents(name))
        except Exception:
            pass
        mod = vbproj.VBComponents.Add(1)
        mod.Name = name
        mod.CodeModule.AddFromString(strip_header(BAS.read_text(encoding="utf-8")))
        wb.Save()
        wb.Close(False)
        print(f"modPortal reinjetado em: {XLSM}")
        return 0
    except Exception as exc:
        print(f"Falha: {exc}")
        print("Feche o Excel, habilite 'Confiar no acesso ao modelo de objeto do projeto do VBA'.")
        return 1
    finally:
        try:
            excel.Quit()
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())
