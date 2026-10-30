import pymupdf, sys
sys.stdout.reconfigure(encoding="utf-8")
d=pymupdf.open(r"E:\Project\My seminar\ChainGuard_v2_Technical_Seminar_Report.pdf")
print("pages",d.page_count)
issues=[]
for i in range(d.page_count):
    blocks=[b for b in d[i].get_text("blocks") if b[4].strip()]
    if not blocks: issues.append((i+1,"blank"))
    for b in blocks:
        x0,y0,x1,y1,buf=b[:5]
        if 60<y0<760 and x1>525: issues.append((i+1,"right",round(x1),buf[:40]))
        if 60<y0 and 720<y1<760: issues.append((i+1,"bottom",round(y1),buf[:40]))
print("issues",issues)
t7=d[6].get_text()
hs=[b[4].strip().replace("\n"," / ") for b in d[6].get_text("blocks") if b[1]<60 and b[4].strip()]
fs=[b[4].strip().replace("\n"," / ") for b in d[6].get_text("blocks") if b[1]>755 and b[4].strip()]
print("p7 head",hs)
print("p7 foot",fs[-1] if fs else "")
t5=d[4].get_text()
print("p5 foot",[b[4].strip().replace("\n"," / ") for b in d[4].get_text("blocks") if b[1]>755])
t6=d[5].get_text()
print("p6 foot",[b[4].strip().replace("\n"," / ") for b in d[5].get_text("blocks") if b[1]>755])
alltext="\n".join(d[i].get_text() for i in range(d.page_count))
for s in ["Pallavi","Anil","Nikita","B34","B45","B50","PRN No"]:
    print(("FOUND " if s in alltext else "gone  "),s)
print("Vivek count",alltext.count("Vivek Rathod"),"B49 count",alltext.count("B49"))