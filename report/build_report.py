# -*- coding: utf-8 -*-
"""Build the ChainGuard v2 technical seminar report as an editable DOCX."""

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / "report"
FIG = REPORT / "diagrams"
OUT_DOCX = ROOT / "ChainGuard_v2_Technical_Seminar_Report.docx"

sys.path.insert(0, str(REPORT))
from content_a import BLOCKS_A  # noqa: E402
from content_b import BLOCKS_B  # noqa: E402

BLOCKS = BLOCKS_A + BLOCKS_B

BODY_FONT = "Times New Roman"
MONO_FONT = "Consolas"

TITLE = (
    "CHAINGUARD V2: A TAMPER-EVIDENT LAST-MILE LOGISTICS CONTROL PLANE FOR "
    "SEALED DISPATCH, CUSTOMER-AUTHORISED CUSTODY BREAKS AND UNIT-EXACT "
    "SHRINKAGE RECONCILIATION"
)
SHORT_TITLE = (
    "CHAINGUARD V2: A TAMPER-EVIDENT LAST-MILE LOGISTICS CONTROL PLANE"
)


# ---------------------------------------------------------------------------
# low-level helpers
# ---------------------------------------------------------------------------
def set_rfonts(rpr, name):
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rf.set(qn(attr), name)


def style_run(run, size=12, bold=None, italic=None, name=BODY_FONT, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    set_rfonts(run._element.get_or_add_rPr(), name)


TOKEN = re.compile(r"(\*\*.+?\*\*|`[^`]+`)")


def add_rich(paragraph, text, size=12, italic=False, bold_all=False):
    for part in TOKEN.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**") and len(part) > 4:
            run = paragraph.add_run(part[2:-2])
            style_run(run, size=size, bold=True, italic=italic or None)
        elif part.startswith("`") and part.endswith("`") and len(part) > 2:
            run = paragraph.add_run(part[1:-1])
            style_run(run, size=max(size - 1.5, 7.5), name=MONO_FONT, bold=bold_all or None, italic=italic or None)
        else:
            run = paragraph.add_run(part)
            style_run(run, size=size, bold=bold_all or None, italic=italic or None)


_PENDING_BREAK = {"pending": False}


def start_page():
    """Begin the next paragraph on a fresh page without an empty break paragraph."""
    _PENDING_BREAK["pending"] = True


def _consume_break(paragraph):
    if _PENDING_BREAK["pending"]:
        paragraph.paragraph_format.page_break_before = True
        _PENDING_BREAK["pending"] = False


def para(
    text="",
    size=12,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    before=0,
    after=3,
    line=1.02,
    left=0.0,
    first=0.0,
    keep=False,
    italic=False,
    bold_all=False,
):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    if text.count("`") >= 6:
        align = WD_ALIGN_PARAGRAPH.LEFT
    pf.alignment = align
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if left:
        pf.left_indent = Inches(left)
    if first:
        pf.first_line_indent = Inches(first)
    pf.keep_with_next = keep
    if text:
        add_rich(p, text, size=size, italic=italic, bold_all=bold_all)
    _consume_break(p)
    return p


def center(text, size=12, bold=False, before=0, after=0, italic=False, line=1.0, caps=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    run = p.add_run(text.upper() if caps else text)
    style_run(run, size=size, bold=bold, italic=italic)
    _consume_break(p)
    return p


def spacer(points=6):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(points)
    pf.line_spacing = 1.0
    run = p.add_run("")
    run.font.size = Pt(2)
    return p


def add_item(marker, text, size=12, left=0.38, hang=0.28, after=1):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Inches(left)
    pf.first_line_indent = Inches(-hang)
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.space_before = Pt(0)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.02
    pf.tab_stops.add_tab_stop(Inches(left))
    run = p.add_run(marker + "\t")
    style_run(run, size=size)
    add_rich(p, text, size=size)
    return p


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def cell_margins(table, left=0.07, right=0.07, top=0.02, bottom=0.02):
    tbl_pr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side, value in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(int(value * 1440)))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tbl_pr.insert_element_before(mar, "w:tblLook")


def table_borders(table, color="A6A6A6", size="4"):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), size)
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tbl_pr.insert_element_before(borders, "w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook")


def no_borders(table):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tbl_pr.insert_element_before(borders, "w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook")


def add_page_border(section, color="404040", size=8, space=18):
    """Draw a double rule around every page in the section."""
    sect_pr = section._sectPr
    pg_borders = sect_pr.find(qn("w:pgBorders"))
    if pg_borders is None:
        pg_borders = OxmlElement("w:pgBorders")
        pg_borders.set(qn("w:offsetFrom"), "page")
        pg_mar = sect_pr.find(qn("w:pgMar"))
        if pg_mar is not None:
            pg_mar.addnext(pg_borders)
        else:
            sect_pr.append(pg_borders)
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "double")
        element.set(qn("w:sz"), str(size))
        element.set(qn("w:space"), str(space))
        element.set(qn("w:color"), color)
        pg_borders.append(element)


def title_logo_header():
    """College and university logos flanking the institution name."""
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    no_borders(table)
    cell_margins(table, left=0.02, right=0.02, top=0.0, bottom=0.0)
    widths = (0.9, 4.5, 0.9)
    for index, width in enumerate(widths):
        table.columns[index].width = Inches(width)
    row = table.rows[0]
    row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))

    for index, filename, width in ((0, "logo_college.png", 0.74), (2, "logo_university.png", 0.68)):
        cell = row.cells[index]
        cell.width = Inches(widths[index])
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.add_run().add_picture(str(FIG / filename), width=Inches(width))

    cell = row.cells[1]
    cell.width = Inches(widths[1])
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    lines = [
        ("Nutan Maharashtra Vidya Prasarak Mandal’s (NMVPM’s)", 10, True),
        ("NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING AND TECHNOLOGY (NMIET)", 10.5, True),
        ("Under Administrative Support - Pimpri Chinchwad Education Trust (PCET)", 8.5, False),
        ("Computer Science and Engineering Department", 10, True),
    ]
    for index, (text, size, bold) in enumerate(lines):
        p = cell.paragraphs[0] if index == 0 else cell.add_paragraph()
        pf = p.paragraph_format
        pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
        pf.space_before = Pt(0)
        pf.space_after = Pt(1 if index < len(lines) - 1 else 0)
        pf.line_spacing = 1.0
        run = p.add_run(text)
        style_run(run, size=size, bold=bold)
    return table


def set_cell(cell, text, size=9, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, fill=None, color=None):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = cell.paragraphs[0]
    pf = p.paragraph_format
    pf.alignment = align
    pf.space_before = Pt(1)
    pf.space_after = Pt(1)
    pf.line_spacing = 1.0
    for run in list(p.runs):
        run._element.getparent().remove(run._element)
    add_rich(p, str(text), size=size, bold_all=bold)
    if color:
        for run in p.runs:
            run.font.color.rgb = RGBColor.from_string(color)
    if fill:
        shade(cell, fill)


def add_caption(text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf.space_before = Pt(9)
    pf.space_after = Pt(4)
    pf.line_spacing = 1.0
    pf.keep_with_next = True
    run = p.add_run(text)
    style_run(run, size=10.5, bold=True)
    return p


def add_table(spec):
    caption = add_caption(spec["caption"])
    if spec.get("new_page"):
        caption.paragraph_format.page_break_before = True
    headers = spec["headers"]
    rows = spec["rows"]
    widths = spec["widths"]
    size = spec.get("size", 8.8)

    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table_borders(table)
    cell_margins(table)

    for i, width in enumerate(widths):
        table.columns[i].width = Inches(width)

    header = table.rows[0]
    tr_pr = header._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:tblHeader"))
    tr_pr.append(OxmlElement("w:cantSplit"))
    for i, label in enumerate(headers):
        cell = header.cells[i]
        cell.width = Inches(widths[i])
        set_cell(cell, label, size=size, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, fill="E7E6E6")

    for index, values in enumerate(rows):
        row = table.add_row()
        tr_pr = row._tr.get_or_add_trPr()
        tr_pr.append(OxmlElement("w:cantSplit"))
        for i, value in enumerate(values):
            cell = row.cells[i]
            cell.width = Inches(widths[i])
            set_cell(cell, value, size=size)
            if index < len(rows) - 1:
                cell.paragraphs[0].paragraph_format.keep_with_next = True
    spacer(3)


def add_figure(filename, caption):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf.space_before = Pt(6)
    pf.space_after = Pt(2)
    pf.line_spacing = 1.0
    pf.keep_with_next = True
    run = p.add_run()
    run.add_picture(str(FIG / filename), width=Inches(5.0))

    cap = doc.add_paragraph()
    pf = cap.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf.space_before = Pt(0)
    pf.space_after = Pt(9)
    pf.line_spacing = 1.0
    run = cap.add_run(caption)
    style_run(run, size=10, italic=True)


def add_formula(lines):
    for line in lines:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
        pf.space_before = Pt(2)
        pf.space_after = Pt(2)
        pf.line_spacing = 1.15
        run = p.add_run(line)
        style_run(run, size=11.5, italic=True)


def add_code(lines):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(5.9)
    table_borders(table, color="CBD5E1", size="4")
    cell_margins(table, left=0.12, right=0.12, top=0.08, bottom=0.08)
    tr_pr = table.rows[0]._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))
    cell = table.rows[0].cells[0]
    cell.width = Inches(5.9)
    shade(cell, "F8FAFC")
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    cell.paragraphs[0]._p.getparent().remove(cell.paragraphs[0]._p)
    for line in lines:
        p = cell.add_paragraph()
        pf = p.paragraph_format
        pf.space_before = Pt(0)
        pf.space_after = Pt(0)
        pf.line_spacing = 1.0
        pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(line if line else " ")
        style_run(run, size=8.8, name=MONO_FONT)
    spacer(4)


def add_callout(text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(5.9)
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        if edge == "left":
            el.set(qn("w:val"), "single")
            el.set(qn("w:sz"), "18")
            el.set(qn("w:color"), "BE123C")
        else:
            el.set(qn("w:val"), "nil")
        el.set(qn("w:space"), "0")
        borders.append(el)
    tbl_pr.insert_element_before(borders, "w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook")
    cell_margins(table, left=0.14, right=0.12, top=0.08, bottom=0.08)
    tr_pr = table.rows[0]._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))
    cell = table.rows[0].cells[0]
    cell.width = Inches(5.9)
    shade(cell, "FFF1F2")
    p = cell.paragraphs[0]
    pf = p.paragraph_format
    pf.space_before = Pt(1)
    pf.space_after = Pt(1)
    pf.line_spacing = 1.15
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
    add_rich(p, text, size=10.5)
    spacer(7)


def add_field(paragraph, instruction, placeholder=""):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f" {instruction} "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text_el = OxmlElement("w:t")
    text_el.text = placeholder
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for element in (begin, instr, separate, text_el, end):
        run._r.append(element)
    return run


def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    pf = p.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    run = p.add_run()
    style_run(run, size=12)
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text_el = OxmlElement("w:t")
    text_el.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for element in (begin, instr, separate, text_el, end):
        run._r.append(element)


def front_heading(text, center_it=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER if center_it else WD_ALIGN_PARAGRAPH.LEFT
    pf.space_before = Pt(0)
    pf.space_after = Pt(12)
    pf.line_spacing = 1.0
    pf.keep_with_next = True
    run = p.add_run(text)
    style_run(run, size=15, bold=True)
    _consume_break(p)
    return p


# ---------------------------------------------------------------------------
# document setup
# ---------------------------------------------------------------------------
doc = Document()

section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.left_margin = Inches(1.1)
section.right_margin = Inches(1.1)
section.top_margin = Inches(0.9)
section.bottom_margin = Inches(0.9)
section.footer_distance = Inches(0.45)
section.header_distance = Inches(0.5)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = BODY_FONT
normal.font.size = Pt(12)
set_rfonts(normal.element.get_or_add_rPr(), BODY_FONT)
npf = normal.paragraph_format
npf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
npf.line_spacing = 1.02
npf.space_before = Pt(0)
npf.space_after = Pt(3)


def config_heading(name, size, before, after, italic=False):
    st = styles[name]
    st.font.name = BODY_FONT
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.italic = italic
    st.font.color.rgb = RGBColor(0, 0, 0)
    rpr = st.element.get_or_add_rPr()
    set_rfonts(rpr, BODY_FONT)
    color = rpr.find(qn("w:color"))
    if color is not None:
        for attr in ("w:themeColor", "w:themeShade", "w:themeTint"):
            if color.get(qn(attr)) is not None:
                del color.attrib[qn(attr)]
    pf = st.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    pf.keep_together = True
    pf.alignment = WD_ALIGN_PARAGRAPH.LEFT


config_heading("Heading 1", 15, 12, 6)
config_heading("Heading 2", 12.5, 8, 3)
config_heading("Heading 3", 11.5, 6, 2, italic=True)

add_page_number_footer(section)
add_page_border(section)

props = doc.core_properties
props.title = SHORT_TITLE
props.subject = "Technical Seminar Report"
props.author = "Pallavi Kokate, Anil Kewat, Nikita Sagar"
props.keywords = "ChainGuard, last-mile logistics, custody, shrinkage, reconciliation, React, TypeScript"
props.comments = "Technical seminar report, Computer Science and Engineering Department, NMIET."


# ---------------------------------------------------------------------------
# title page
# ---------------------------------------------------------------------------
title_logo_header()
spacer(14)
center("TECHNICAL SEMINAR REPORT", 16, True, after=5)
center("ON", 12, after=7)
center(TITLE, 18.5, True, after=12, line=1.18)
center("Project Reference: ChainGuard v2.4", 11.5, True, after=3)
center(
    "A client-side control plane for sealed dispatch, GPS-anchored telemetry, "
    "single-use unlock tokens and unit-exact warehouse reconciliation",
    11,
    italic=True,
    after=34,
    line=1.25,
)

center("Presented by", 12, True, after=6)
center("Pallavi Kokate (B34)", 12, after=3)
center("Anil Kewat (B45)", 12, after=3)
center("Nikita Sagar (B50)", 12, after=30)

center("Project Guide", 12, True, after=3)
center("Miss. Sakshi Ambadkar", 12, after=22)
center("Academic Year 2026–27", 11.5, after=2)
center("Department of Computer Science and Engineering", 11.5, after=0)

start_page()


# ---------------------------------------------------------------------------
# certificate
# ---------------------------------------------------------------------------
center("Nutan Maharashtra Vidya Prasarak Mandal’s (NMVPM’s)", 11.5, True, before=0, after=2)
center("NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING AND TECHNOLOGY (NMIET)", 12.5, True, after=2)
center("Under Administrative Support - Pimpri Chinchwad Education Trust (PCET)", 10.5, after=2)
center("Computer Science and Engineering Department", 11.5, True, after=22)

center("CERTIFICATE", 16, True, after=20)

para("This is to certify that the technical seminar report entitled", 12, WD_ALIGN_PARAGRAPH.CENTER, after=8, line=1.3)
para(TITLE, 13, WD_ALIGN_PARAGRAPH.CENTER, after=6, line=1.2, keep=True, bold_all=True)
para("(Project Reference: ChainGuard v2.4)", 11.5, WD_ALIGN_PARAGRAPH.CENTER, after=8, line=1.2)
para("has been prepared and submitted by", 12, WD_ALIGN_PARAGRAPH.CENTER, after=6, line=1.3)
para("Pallavi Kokate (B34), Anil Kewat (B45) and Nikita Sagar (B50)", 12, WD_ALIGN_PARAGRAPH.CENTER, after=12, line=1.3, bold_all=True)

para(
    "students of the Computer Science and Engineering Department of Nutan Maharashtra "
    "Institute of Engineering and Technology (NMIET), under the guidance of "
    "Miss. Sakshi Ambadkar.",
    12,
    WD_ALIGN_PARAGRAPH.JUSTIFY,
    after=8,
    line=1.35,
)
para(
    "The report presents the proposed custody-verification control plane, its architecture, "
    "methodology, applications, advantages, limitations and future scope as part of the "
    "academic requirements for the technical seminar.",
    12,
    WD_ALIGN_PARAGRAPH.JUSTIFY,
    after=6,
    line=1.35,
)

spacer(30)
sig = doc.add_table(rows=1, cols=3)
sig.alignment = WD_TABLE_ALIGNMENT.CENTER
sig.autofit = False
no_borders(sig)
for i, label in enumerate(("Guide’s Signature", "HOD’s Signature", "Principal’s Signature")):
    sig.columns[i].width = Inches(1.97)
    cell = sig.rows[0].cells[i]
    cell.width = Inches(1.97)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    run = p.add_run(label)
    style_run(run, 11.5)

spacer(26)
para("Date: ____________________          Place: ____________________", 11.5, WD_ALIGN_PARAGRAPH.LEFT, after=0, line=1.2)

start_page()


# ---------------------------------------------------------------------------
# acknowledgement
# ---------------------------------------------------------------------------
front_heading("ACKNOWLEDGEMENT")
para(
    "I would like to express my sincere gratitude to our seminar guide, Miss. Sakshi Ambadkar, "
    "for her continuous guidance, patient review and constructive criticism throughout the "
    "preparation of this report. Her questions repeatedly pushed us to separate what the "
    "prototype actually demonstrates from what we hoped it would demonstrate.",
    after=10,
)
para(
    "I am thankful to the faculty members and the Department of Computer Science and Engineering "
    "at NMIET for providing the infrastructure, laboratory access and academic freedom needed to "
    "design, build and deploy this project. I also acknowledge the open-source communities behind "
    "React, TypeScript, Vite, Tailwind CSS, Zustand and the Python libraries used to prepare this "
    "document; their documentation made a small, independent implementation possible.",
    after=10,
)
para(
    "Finally, I extend my heartfelt thanks to my family, teammates and peers for their constant "
    "motivation, honest feedback and support during the completion of this seminar. The working "
    "prototype, the deployment and the demonstration dataset were built collaboratively, and the "
    "credit for anything that works belongs to the team.",
    after=18,
)
para("Pallavi Kokate, Anil Kewat and Nikita Sagar", 11.5, WD_ALIGN_PARAGRAPH.RIGHT, after=0, line=1.2, italic=True)

start_page()


# ---------------------------------------------------------------------------
# abstract
# ---------------------------------------------------------------------------
front_heading("ABSTRACT")
para(
    "Last-mile shrinkage is usually investigated at the warehouse, after the vehicle has returned "
    "and the count has failed. This report argues that the failure begins earlier, at dispatch, "
    "when a buffer quantity leaves the warehouse without an enforceable relationship to the seal, "
    "the driver, the route and the evidence of what happened in transit. The result is a custody "
    "gap: the final count exists but has no authority, because the conditions for judging it were "
    "never recorded.",
    after=8,
)
para(
    "The report presents ChainGuard v2, a browser-delivered control plane that makes the custody "
    "of a last-mile consignment explicit from dispatch to warehouse return. Each consignment is "
    "bound to a unique digital seal and a declared buffer quantity. The seal can be broken only "
    "through a customer-issued single-use unlock token, and the exact buffer count must return. "
    "Driver telemetry, GPS-anchored incidents, the customer attestation and the warehouse count "
    "share one dispatch record, so reconciliation compares fields within a record rather than "
    "reconstructing four separate systems.",
    after=8,
)
para(
    "The prototype implements four role portals — vendor dispatch, driver telemetry, customer "
    "verification and audit reconciliation — over a single reactive Zustand store. It formalises "
    "custody as a guarded state machine, computes a unit-exact variance, raises a priority-1 "
    "shrinkage alert and locks the driver’s settlement on any non-zero variance, and derives fleet "
    "KPIs and a driver trust score from the same records. A seeded fleet of six dispatches covers "
    "every lifecycle state, and a reproducible fraud scenario demonstrates the complete path from "
    "seal issuance to payout lock.",
    after=8,
)
para(
    "The report also states the prototype’s limits. The trust boundary is the browser, identifiers "
    "are not cryptographic secrets, settlement is a flag rather than a payment instruction, and the "
    "audit log is not yet immutable. These limitations define a concrete future scope: a server-side "
    "custody service, signed tokens and hardware seals, a hash-chained evidence log and integration "
    "with settlement systems. The broader contribution is a reusable custody pattern, not a product: "
    "one active seal, consent before break, buffer as expected return and variance as a settlement "
    "gate.",
    after=0,
)

start_page()


# ---------------------------------------------------------------------------
# table of contents
# ---------------------------------------------------------------------------
front_heading("TABLE OF CONTENTS")
toc_intro = doc.add_paragraph()
toc_intro.paragraph_format.space_before = Pt(0)
toc_intro.paragraph_format.space_after = Pt(6)
toc_intro.paragraph_format.line_spacing = 1.0
toc_intro.paragraph_format.tab_stops.add_tab_stop(Inches(1.0))
run = toc_intro.add_run("Sr. No.\tContents")
style_run(run, 11.5, bold=True)

toc_p = doc.add_paragraph()
toc_p.paragraph_format.space_before = Pt(0)
toc_p.paragraph_format.space_after = Pt(0)
toc_p.paragraph_format.line_spacing = 1.0
add_field(toc_p, 'TOC \\o "1-2" \\z \\u', "Right-click and choose Update Field to build the table of contents.")

start_page()


# ---------------------------------------------------------------------------
# list of figures and tables
# ---------------------------------------------------------------------------
front_heading("LIST OF FIGURES")
figures = [
    ("Figure 3.1", "Four-plane architecture of the ChainGuard v2 control plane"),
    ("Figure 3.2", "Custody lifecycle state machine"),
    ("Figure 4.1", "End-to-end operational workflow across the four role portals"),
    ("Figure 4.2", "Warehouse reconciliation decision flow"),
]
for label, text in figures:
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Inches(0.1)
    pf.space_before = Pt(2)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.15
    pf.tab_stops.add_tab_stop(Inches(1.1))
    run = p.add_run(label + "\t")
    style_run(run, 11.5, bold=True)
    run = p.add_run(text)
    style_run(run, 11.5)

spacer(18)
front_heading("LIST OF TABLES")
tables = [
    ("Table 2.1", "Summary matrix of the literature survey"),
    ("Table 3.1", "Custody states, guards and permitted transitions"),
    ("Table 4.1", "Technology stack of the implemented prototype"),
    ("Table 4.2", "Seeded demonstration fleet"),
    ("Table 7.1", "Feature matrix comparison with existing approaches"),
]
for label, text in tables:
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Inches(0.1)
    pf.space_before = Pt(2)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.15
    pf.tab_stops.add_tab_stop(Inches(1.1))
    run = p.add_run(label + "\t")
    style_run(run, 11.5, bold=True)
    run = p.add_run(text)
    style_run(run, 11.5)

start_page()


# ---------------------------------------------------------------------------
# abbreviations
# ---------------------------------------------------------------------------
front_heading("LIST OF ABBREVIATIONS")
abbreviations = [
    ("API", "Application Programming Interface"),
    ("CDN", "Content Delivery Network"),
    ("CI/CD", "Continuous Integration / Continuous Delivery"),
    ("CSPRNG", "Cryptographically Secure Pseudo-Random Number Generator"),
    ("CSV", "Comma-Separated Values"),
    ("DOM", "Document Object Model"),
    ("DPDP", "Digital Personal Data Protection (Act, 2023)"),
    ("GPS", "Global Positioning System"),
    ("HMAC", "Keyed-Hash Message Authentication Code"),
    ("HTTP", "Hypertext Transfer Protocol"),
    ("INR", "Indian Rupee"),
    ("IoT", "Internet of Things"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("KPI", "Key Performance Indicator"),
    ("NIST", "National Institute of Standards and Technology"),
    ("P1", "Priority One"),
    ("POD", "Proof of Delivery"),
    ("QR", "Quick Response"),
    ("RBAC", "Role-Based Access Control"),
    ("REST", "Representational State Transfer"),
    ("SDK", "Software Development Kit"),
    ("SPA", "Single-Page Application"),
    ("SRS", "Software Requirements Specification"),
    ("TLS", "Transport Layer Security"),
    ("TMS", "Transport Management System"),
    ("UI", "User Interface"),
    ("URL", "Uniform Resource Locator"),
    ("UTC", "Coordinated Universal Time"),
    ("UUID", "Universally Unique Identifier"),
    ("W3C", "World Wide Web Consortium"),
    ("XSS", "Cross-Site Scripting"),
    ("ZTA", "Zero Trust Architecture"),
]
abbr = doc.add_table(rows=1, cols=3)
abbr.style = "Table Grid"
abbr.alignment = WD_TABLE_ALIGNMENT.CENTER
abbr.autofit = False
table_borders(abbr)
cell_margins(abbr)
for i, width in enumerate((0.5, 1.2, 4.2)):
    abbr.columns[i].width = Inches(width)
for i, header in enumerate(("Sr. No.", "Abbreviation", "Full Form")):
    cell = abbr.rows[0].cells[i]
    cell.width = Inches((0.5, 1.2, 4.2)[i])
    set_cell(cell, header, size=9.0, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, fill="E7E6E6")
abbr.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
for index, (short, full) in enumerate(abbreviations, start=1):
    row = abbr.add_row()
    row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
    for i, value in enumerate((str(index), short, full)):
        cell = row.cells[i]
        cell.width = Inches((0.5, 1.2, 4.2)[i])
        set_cell(cell, value, size=9.0, align=WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT)

start_page()


# ---------------------------------------------------------------------------
# main chapters
# ---------------------------------------------------------------------------
ref_number = 0
for block in BLOCKS:
    kind = block[0]

    if kind == "h1":
        _consume_break(doc.add_heading(block[1], level=1))
    elif kind == "h2":
        _consume_break(doc.add_heading(block[1], level=2))
    elif kind == "h3":
        _consume_break(doc.add_heading(block[1], level=3))
    elif kind == "p":
        para(block[1])
    elif kind == "bul":
        for item in block[1]:
            add_item("•", item)
        spacer(3)
    elif kind == "num":
        for index, item in enumerate(block[1], start=1):
            add_item(f"{index}.", item, left=0.42, hang=0.3)
        spacer(3)
    elif kind == "fig":
        add_figure(block[1], block[2])
    elif kind == "tbl":
        add_table(block[1])
    elif kind == "code":
        add_code(block[1])
    elif kind == "callout":
        add_callout(block[1])
    elif kind == "formula":
        add_formula(block[1])
    elif kind == "ref":
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.left_indent = Inches(0.42)
        pf.first_line_indent = Inches(-0.42)
        pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pf.space_before = Pt(0)
        pf.space_after = Pt(0)
        pf.line_spacing = 0.98
        pf.tab_stops.add_tab_stop(Inches(0.42))
        ref_number += 1
        run = p.add_run(f"[{ref_number}]\t")
        style_run(run, 9.8, bold=True)
        add_rich(p, block[1], size=9.8)

doc.save(OUT_DOCX)
print("wrote", OUT_DOCX)
print("blocks:", len(BLOCKS))
