# Words taken out of the first 1,550 to make room for more important ones.
# id: reason. Applied in the final merged file; Batch 5 lists them on its "Removed" sheet.
REMOVED = {
    'PRP-039': "repeat of 'towards'",
    'PHR-123': "repeat of 'break up'",
    'CNJ-033': "repeat of 'instead of'",
    'CNJ-040': "repeat of 'in addition to'",
    'PRP-037': "repeat of 'until'",
    'PRP-042': "repeat of 'under'",
    'PRP-011': "repeat of 'under/below'",
    'CNJ-031': "repeat of 'nevertheless'",
    'CNJ-029': "repeat of 'moreover'",
    'PRN-045': "repeat of 'someone'",
    'PRN-046': "repeat of 'anyone'",
    'PRN-047': "repeat of 'everyone'",
    'PRN-048': "repeat of 'no one'",
    'CNJ-023': "repeat of 'as if'",
    'CNJ-044': "repeat of 'for example'",
    'CNJ-025': "repeat of 'so that'",
    'PHR-144': "repeat of 'log in'",
    'PHR-145': "repeat of 'log out'",
    'PHR-125': "repeat of 'ease off'",
    'NUM-015': "number pattern (teen) — taught by 'thirteen…' rule in 'twelve'/'twenty'",
    'NUM-016': 'number pattern (teen)',
    'NUM-017': 'number pattern (teen)',
    'NUM-018': 'number pattern (teen)',
    'NUM-019': 'number pattern (teen)',
    'NUM-020': 'number pattern (teen)',
    'NUM-021': 'number pattern (teen)',
    'NUM-023': 'number pattern (tens)',
    'NUM-026': 'number pattern (tens)',
    'NUM-027': 'number pattern (tens)',
    'NUM-028': 'number pattern (tens)',
    'NUM-029': 'number pattern (tens)',
    'NUM-044': 'rare ordinal',
    'NUM-045': 'rare ordinal',
    'NUM-046': 'rare ordinal',
    'NUM-047': 'rare ordinal',
    'NUM-048': 'rare ordinal',
    'NUM-052': "rare (use 'three times')",
    'NUM-053': "rare (use 'four times')",
    'ADV-077': 'rare intensifier',
    'ADV-078': 'rare, old-fashioned',
    'ADV-022': 'rare, confusing (now/soon)',
    'ADJ-156': 'rare',
    'ADJ-174': 'rare',
    'ADJ-175': 'rare',
    'ADJ-247': 'literary',
    'ADJ-246': 'literary',
    'ADJ-250': 'rare',
    'ADJ-238': 'rare',
    'PRP-099': 'literary',
    'PRP-065': 'very formal',
    'PRP-067': 'very formal',
    'PRP-070': 'very formal',
    'PRP-069': "repeat of 'regarding'",
    'PRP-100': "repeat of 'regarding'",
    'CNJ-057': 'very formal',
    'CNJ-060': 'very formal',
    'CNJ-083': 'rare',
    'CNJ-093': 'very formal',
    'PHR-118': 'rare',
    'PHR-113': 'rare',
    'PHR-129': 'rare',
    'PHR-294': 'rare',
    'PHR-301': 'rare',
    'PHR-306': 'rare',
    'PHR-312': 'rare',
    'PHR-032': 'rare',
    'VRB-250': 'rare',
    'VRB-173': 'not needed for a learner core list',
}

# Planned for Batch 6 but dropped. The first planning pass treated "go on" as the same word as
# "go" (its rule strips a trailing on/to/with/of), so go, take, try, keep, turn, move, hold, pass,
# close, count, put on, come on, have to and next looked covered when they were not. They are added
# (Batch 5, or Batch 6 for the last four), and these weaker words make room so the total stays 2,000.
# "don't have to" is covered by "have to".
NOT_ADDED = [
    "subsequently", "additionally", "lastly", "consist", "possess", "generate",
    "broad", "identical", "weaken", "worsen", "declare", "inside out",
    "bald", "overweight", "upcoming", "don't have to",
]

# Batch 6 curation. "give up on" goes because Batch 6 adds the core phrasal verb "give up".
REMOVED_B6 = {
    "PHR-029": "repeat of 'give up' (added in Batch 6)",
}
# Planned for Batch 6 but dropped as repeats of words already in the list, or as less useful than
# the core words added in their place (give up, get on, would like, look like, pay attention …).
NOT_ADDED_B6 = {
    "be able to": "repeat of 'able' (Batch 5 covers 'be able to')",
    "hurry": "repeat of 'hurry up' and 'rush'",
    "little": "repeat of 'a little'",
    "the same as": "covered by 'same'",
    "different from": "covered by 'different'",
    "firstly": "repeat of 'first of all'",
    "right away": "repeat of 'right now' and 'at once'",
    "up to date": "repeat of 'up-to-date'",
    "live on": "less useful",
    "not as...as": "covered by 'as...as'",
    "undoubtedly": "less useful", "straightforward": "less useful", "doubtful": "less useful",
    "alike": "less useful", "assist": "less useful", "permit": "less useful", "enable": "less useful",
    "envy": "less useful", "advance": "less useful", "former": "less useful",
    "specifically": "less useful", "partly": "less useful",
}

# Removed from the main 2,000 as repeats of someone/everyone/no one/anyone/until, but among the most
# common words in spoken English, so they come back in the Extra list (after word 2,000).
RESTORED_TO_EXTRA = ["PRN-045", "PRN-047", "PRN-048", "PRN-046", "PRP-037"]
