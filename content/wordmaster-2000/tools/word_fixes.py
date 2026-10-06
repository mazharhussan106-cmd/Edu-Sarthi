"""Cell fixes applied on top of WordMaster2000_FINAL.xlsx when words.json is
exported. Found by the review audit (1 Oct 2026): 36 words showed the same
example sentence twice, and two words listed a synonym that is really an
opposite ("take" for bring, "first" for last).

Kept as a separate layer, rather than edited into the workbook, so every
change is reviewable in one place. Applied by export_json.py; a fix for a
word ID that no longer exists stops the export.
"""

FIXES = {
    # One example of each pair repeated another; the repeat is replaced.
    "PRN-051": {"example_2": "Is everything okay at home?"},
    "PRN-052": {"example_3": "I have nothing to wear to the party."},
    "DET-002": {"example_2": "Can I have a glass of water?"},
    "NUM-081": {"example_3": "We didn't eat much at the wedding."},
    "PRN-053": {"example_2": "How did you get here so fast?"},
    "PRN-054": {"example_2": "Where are my keys?"},
    "ADV-201": {"example_2": "Please do not touch the paintings."},
    "DET-004": {"example_3": "No problem, I'll wait."},
    "PHR-336": {"example_2": "Sit down and have some tea."},
    "ADJ-476": {"example_2": "Is this the right bus for the station?"},
    "ADJ-484": {"example_3": "She's a great cook."},
    "ADJ-488": {"example_2": "There's a strong wind today."},
    "ADJ-490": {"example_2": "He's my real brother, not a cousin."},
    "ADV-205": {"example_2": "I'll finish it tomorrow morning."},
    "INT-012": {"example_2": "Sorry, I didn't mean to hurt you."},
    "AUX-020": {"example_2": "You had better take an umbrella."},
    "AUX-024": {"example_2": "Students have to wear a uniform."},
    "NUM-083": {"example_2": "A few friends came over last night."},
    "VRB-701": {"example_2": "I didn't expect to see you here!"},
    "VRB-702": {"example_2": "I suppose we can take the bus."},
    "VRB-708": {"example_2": "Good teachers communicate clearly."},
    "VRB-729": {"example_2": "Too much salt will ruin the dal."},
    "VRB-730": {"example_2": "The students formed a team for the project."},
    "ADJ-556": {"example_2": "The view from the hill is fantastic."},
    "ADJ-562": {"example_2": "The old dog is almost blind now."},
    "ADJ-574": {"example_2": "The previous owner painted the house blue."},
    "ADJ-575": {"example_2": "The bus came to a sudden stop."},
    "ADV-221": {"example_2": "He politely asked for the bill."},
    "ADV-224": {"example_3": "The doctor will see you shortly."},
    "ADV-226": {"example_2": "The shop normally opens at nine."},
    "ADV-227": {"example_2": "Children generally love sweets."},
    "ADV-231": {"example_2": "Bring your sister as well."},
    "CNJ-102": {"example_2": "I wrote it down so as to remember it."},
    "CNJ-105": {"example_2": "My phone is as old as yours."},
    "INT-021": {"example_2": "I mean, we can go tomorrow if you're busy."},
    "INT-022": {"example_2": "He's, you know, the boy from the bakery."},
    # A synonym that is really an opposite.
    "VRB-617": {"synonyms": "carry, fetch"},
    "ADJ-579": {"synonyms": "final, previous"},
}
