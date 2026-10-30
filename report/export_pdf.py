# -*- coding: utf-8 -*-
"""Populate the TOC and export the report to PDF using Microsoft Word."""

import sys
from pathlib import Path

import win32com.client as win32

ROOT = Path(__file__).resolve().parent.parent
DOCX = ROOT / "ChainGuard_v2_Technical_Seminar_Report.docx"
PDF = ROOT / "ChainGuard_v2_Technical_Seminar_Report.pdf"


def main():
    if not DOCX.exists():
        raise SystemExit(f"missing {DOCX}")

    word = win32.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    word.AutomationSecurity = 3
    doc = None
    try:
        doc = word.Documents.Open(str(DOCX), ReadOnly=False, AddToRecentFiles=False)
        doc.Fields.Update()

        try:
            print("TOCs found:", doc.TablesOfContents.Count)
            for i in range(1, doc.TablesOfContents.Count + 1):
                doc.TablesOfContents(i).Update()
        except Exception as exc:  # pragma: no cover - diagnostic path
            print("TOC update warning:", exc)

        for name in ("TOC 1", "TOC 2"):
            try:
                style = doc.Styles(name)
                style.Font.Name = "Times New Roman"
                style.Font.Size = 11.3
                style.Font.Color = 0
                style.ParagraphFormat.SpaceAfter = 2
                style.ParagraphFormat.LineSpacingRule = 0
            except Exception as exc:  # pragma: no cover - style may not exist
                print(f"style {name}: {exc}")

        doc.Repaginate()
        try:
            for i in range(1, doc.TablesOfContents.Count + 1):
                doc.TablesOfContents(i).Update()
        except Exception as exc:  # pragma: no cover
            print("second TOC update warning:", exc)

        doc.Save()
        doc.ExportAsFixedFormat(
            OutputFileName=str(PDF),
            ExportFormat=17,
            OpenAfterExport=False,
            OptimizeFor=0,
            Range=0,
            Item=0,
            IncludeDocProps=True,
            KeepIRM=True,
            CreateBookmarks=0,
            DocStructureTags=True,
            BitmapMissingFonts=True,
            UseISO19005_1=False,
        )
        print("pages:", doc.ComputeStatistics(2))  # wdStatisticPages
        print("wrote", PDF)
        doc.Close(SaveChanges=0)
        doc = None
    finally:
        if doc is not None:
            try:
                doc.Close(SaveChanges=0)
            except Exception:
                pass
        word.Quit()


if __name__ == "__main__":
    sys.exit(main())
