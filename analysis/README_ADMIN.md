# Pilot URL Admin Generator

Keep `generate_pilot_links.py` in the private/admin side of the project (for example the `analysis` branch).
Do NOT commit generated `pilot_links.csv` to a public repository because it contains participant tokens.

Run:

python generate_pilot_links.py

Default output:
- 5 Group A links
- 5 Group B links
- 5 Group C links
- unique random tokens
- `pilot_links.csv`

For the main 150-student study:

python generate_pilot_links.py --a 50 --b 50 --c 50 --prefix STUDY --out main_study_links.csv
