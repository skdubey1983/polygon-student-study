import csv,secrets,argparse

BASE_URL="https://skdubey1983.github.io/polygon-student-study/"

def make_links(nA=5,nB=5,nC=5,prefix="PILOT",out="pilot_links.csv"):
    groups=["A"]*nA+["B"]*nB+["C"]*nC
    rows=[]
    for i,g in enumerate(groups,1):
        sid=f"{prefix}{i:03d}"
        token=secrets.token_urlsafe(12)
        url=f"{BASE_URL}?id={sid}&group={g}&token={token}"
        rows.append([sid,g,token,url])
    with open(out,"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f);w.writerow(["study_id","group","token","url"]);w.writerows(rows)
    print(f"Created {out} with {len(rows)} assigned URLs.")
    print("Keep the generated CSV private; do not commit it to a public repository.")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--a",type=int,default=5)
    p.add_argument("--b",type=int,default=5)
    p.add_argument("--c",type=int,default=5)
    p.add_argument("--prefix",default="PILOT")
    p.add_argument("--out",default="pilot_links.csv")
    x=p.parse_args()
    make_links(x.a,x.b,x.c,x.prefix,x.out)
