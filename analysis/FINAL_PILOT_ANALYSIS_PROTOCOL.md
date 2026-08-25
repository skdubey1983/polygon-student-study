# Pilot-v1 Frozen Analysis Protocol

## Study status
Freeze the current deployed interface. TEST001, TEST002 and TEST003 are developer/instrumentation records and are excluded from participant analysis.

## Measurement chain
Keep these three levels separate:
1. Evidence: `marked_s_L`, `marked_s_G`
2. Distinct-transition inference: `inferred_transition_s`, `inferred_transition_count`
3. Structural inference: `predicted_segments`

## Manuscript-to-study bridge
The manuscript theorem establishes mathematical transition-response separation/localization under its stated conditions. The educational experiment separately tests whether that information is usable by human observers. Student improvement at C3 is therefore an empirical hypothesis, not a consequence of the theorem.

## Pilot
Use 10–15 naïve B.Tech students, approximately balanced across A/B/C. The pilot tests instrument comprehension and usability, not the substantive hypothesis.

## Frozen primary transition outcomes
For each task freeze the true normalized transition set before inspecting participant outcomes. Use circular journey distance:
`d_c(a,b)=min(|a-b|,1-|a-b|)`.
Freeze the matching tolerance before outcome analysis.

Report TP, FP, FN, precision, recall, F1, mean matched localization error, and exact transition-count rate.

## Structural outcomes
Report segment-count accuracy and:
`D_TS = |inferred_transition_count - predicted_segments|`.
Do not force D_TS to zero in the interface.

## Central C analysis
Compare within participant/task:
C1 raw histories -> C2 first changes -> C3 change-in-change.
Primary interpretation uses transition localization/F1 and structural accuracy. Raw evidence-mark count, confidence, or salience alone cannot establish improvement.

## A/B role
A is the visible-boundary reference. B tests raw dual-distance inference. C1 is a same-representation-class sanity comparison; C1->C2->C3 is the central staged progression.

## Pilot go/no-go
Proceed if students understand evidence marks versus distinct transitions, the transition strip works without repeated instructor help, completion time is practical, invalid/missing responses are rare, and D_TS does not reveal systematic terminology misunderstanding.

If instructions must change, create a new pilot version and do not pool the two pilot versions as one instrument.

## Main study after successful pilot
Target approximately A=50, B=50, C=50 from 150 students.

## Must freeze before pilot
- exact six deployed tasks;
- exact true normalized transition positions;
- circular matching tolerance;
- Git commit/tag for `pilot-v1`.
