import pandas as pd,numpy as np

TRUE_TRANSITIONS={
 1:[0.00000,0.33579,0.68364],
 2:[0.00000,0.27756,0.46327,0.72659],
 3:[0.00000,0.19946,0.37484,0.55834,0.75597],
 4:[0.00000,0.15944,0.31070,0.45824,0.61619,0.79021],
 5:[0.00000,0.30615,0.50128,0.64839,0.85609],
 6:[0.00000,0.12176,0.26187,0.39517,0.54198,0.67862,0.85073]
}
TEST_IDS={"TEST001","TEST002","TEST003"}
SAMPLE_N=61
FROZEN_TOL=2/SAMPLE_N

def ps(x):
 if pd.isna(x) or str(x).strip()=="":return []
 return [float(v) for v in str(x).split(",") if v.strip()]

def dc(a,b):
 d=abs(a-b);return min(d,1-d)

def match(P,T):
 C=sorted((dc(p,t),i,j) for i,p in enumerate(P) for j,t in enumerate(T))
 up=set();ut=set();R=[]
 for d,i,j in C:
  if d>FROZEN_TOL:break
  if i not in up and j not in ut:
   up.add(i);ut.add(j);R.append(d)
 return R

def metrics(r):
 T=TRUE_TRANSITIONS[int(r.task)];P=ps(r.inferred_transition_s)
 M=match(P,T);tp=len(M);fp=len(P)-tp;fn=len(T)-tp
 p=tp/len(P) if P else 0
 rcl=tp/len(T)
 f=2*p*rcl/(p+rcl) if p+rcl else 0
 return pd.Series({
  "TP":tp,"FP":fp,"FN":fn,"precision":p,"recall":rcl,"f1":f,
  "loc_error":np.mean(M) if M else np.nan,
  "exact_T":int(len(P)==len(T)),
  "segment_correct":int(float(r.predicted_segments)==len(T)),
  "D_TS":abs(float(r.inferred_transition_count)-float(r.predicted_segments))
 })

def main():
 import argparse
 a=argparse.ArgumentParser()
 a.add_argument("csv")
 a.add_argument("--include-tests",action="store_true")
 x=a.parse_args()

 d=pd.read_csv(x.csv)
 if not x.include_tests:
  d=d[~d.study_id.astype(str).isin(TEST_IDS)].copy()

 m=d.apply(metrics,axis=1)
 o=pd.concat([d.reset_index(drop=True),m.reset_index(drop=True)],axis=1)
 o.to_csv("response_level_metrics.csv",index=False)

 s=o.groupby(["group","stage"]).agg(
  n=("study_id","nunique"),
  precision=("precision","mean"),
  recall=("recall","mean"),
  f1=("f1","mean"),
  localization_error=("loc_error","mean"),
  exact_transition_rate=("exact_T","mean"),
  segment_accuracy=("segment_correct","mean"),
  mean_D_TS=("D_TS","mean"),
  confidence=("confidence","mean"),
  duration_ms=("stage_duration_ms","mean")
 ).reset_index()
 s.to_csv("condition_summary.csv",index=False)

 c=o[o.group.astype(str).str.upper()=="C"]
 if len(c):
  c.pivot_table(
   index=["study_id","task"],columns="stage",
   values=["f1","loc_error","exact_T","segment_correct","D_TS","confidence"],
   aggfunc="first"
  ).to_csv("C_progression.csv")

 print(f"Frozen circular matching tolerance: {FROZEN_TOL:.8f}")
 print("Analysis outputs created.")

if __name__=="__main__":
 main()
