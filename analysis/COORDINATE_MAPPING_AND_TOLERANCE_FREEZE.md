# Coordinate-corrected pilot-v1.1 analysis freeze

## Coordinate mapping correction

The browser generator uses `N=61` ordered boundary samples at

`x_k = k/61`, for `k=0,...,60`.

The plotted raw histories must therefore use those exact normalized journey positions instead of stretching sample index `0,...,60` over the full visual interval `[0,1]`.

For derived displays:

- raw histories are plotted at `k/61`;
- first changes are plotted at interval midpoints `(k+1/2)/61`;
- change-in-change values are plotted at `(k+1)/61`.

The common inferred-transition strip remains the full normalized closed journey `[0,1]`.

## Frozen circular localization rule

Ground-truth and inferred transition positions are compared with

`d_c(a,b)=min(|a-b|,1-|a-b|)`.

The nominal sampling interval is

`Delta s = 1/61`.

Before participant outcome inspection, the matching tolerance is frozen at two sampling intervals:

`tau = 2/61 = 0.032786885...`.

Operationally the analysis script uses the exact value `2/61`, not a result-tuned tolerance.

## Versioning

Because the graph coordinate mapping changes the displayed stimulus locations, the corrected frontend should be treated as a new frozen pilot version (`pilot-v1.1` or equivalent). Do not pool participant data collected before and after this coordinate correction as if the displays were identical.
