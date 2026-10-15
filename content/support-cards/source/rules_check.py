"""Deck-wide rule checks the per-card audit does not do. Usage: python3 rules_check.py"""
import glob, re
from audit import parse
HERE = __file__.rsplit("/", 1)[0]
cards, order = parse(sorted(glob.glob(f"{HERE}/cards_*.txt")))
AGENT = ["alt_1", "alt_2", "more_formal", "ask_next", "whats_next_reply", "hindi_to_english_answer", "reorder_answer"]
TEXT_FIELDS = None
US = r"\b(apologiz\w*|organiz\w*|realiz\w*|recogniz\w*|prioritiz\w*|authoriz\w*|finaliz\w*|minimiz\w*|personaliz\w*|customiz\w*|summariz\w*|emphasiz\w*|canceled|canceling|color\w*|favor\w*|behavior\w*|center\b|centers\b|honor\w*|labor\b|catalog\b|dialog\b|enrollment|fulfill\b|analyze\w*|neighbor\w*)"
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
ACRONYM_OK = {"OTP", "PIN", "CVV", "ID", "IDs", "SMS", "PDF", "URL", "OK", "UPI", "IFSC", "KYC", "FAQ", "IT", "UK", "US", "USA", "GST", "ETA", "CSAT", "HEARD", "LAST", "LATTE", "LEAP", "LEAPS", "LEAST", "CEFR", "ASAP", "NOW", "IMEI", "VPN", "PNR", "EMI", "AM", "PM", "ORD", "SIM", "TV", "DM", "TBD", "QR", "API", "CRM", "GDPR", "DPDP", "VAT", "EU", "RBI", "NPCI", "CC", "BCC", "RE", "FW", "FYI", "N/A"}
issues = []
for i in order:
    c = cards[i]
    agent_lines = [(k, c[k]) for k in AGENT] + ([("sentence", c["sentence"])] if c["kind"] == "Say it" else [])
    for k in [k for k in c if not k.startswith("_")]:
        for m in re.finditer(US, c[k], re.I):
            issues.append((i, k, f"US spelling '{m.group(0)}'"))
    for k, v in agent_lines:
        if re.search(r"inconvenience", v, re.I): issues.append((i, k, "agent line apologises for 'the inconvenience' (rule 8: be specific)"))
        if re.search(r"\bpolicy\b", v, re.I): issues.append((i, k, "agent line mentions 'policy' (rule 13)"))
        ask = re.search(r"\b(share|tell|give|send|read|confirm|provide|type|enter|say|repeat)\b[^.?!]{0,50}\b(OTP|PIN|password|passcode|CVV|security code|full card number|card number)\b(?! ?code)", v, re.I)
        if ask and not re.search(r"\b(never|not|don't|do not|won't|will not|no one|nobody|last (four|4) digits)\b", v, re.I):
            issues.append((i, k, f"agent line may ASK for a secret: '{ask.group(0)}'"))
        if EMOJI.search(v): issues.append((i, k, "emoji in an agent line"))
        caps = [w for w in re.findall(r"\b[A-Z]{3,}\b(?![-#]?\d)", v) if w not in ACRONYM_OK]
        if caps: issues.append((i, k, f"ALL CAPS word(s) in agent line: {caps}"))
        if re.search(r"\bpin ?code\b", v, re.I): issues.append((i, k, "Indian-English 'pin code' in agent line: use 'postcode' (or 'ZIP code' for US customers)"))
        if re.search(r"\bno problem\b", v, re.I): issues.append((i, k, "'No problem' in agent line (rule 14: fine only when casual)"))
    for k in [k for k in c if not k.startswith("_") and k not in ("dont_say", "positive_swap", "watch_out", "cultural_note", "tone_note", "mcq_options", "mcq_why", "if_customer_pushes", "source_rule", "when_not_to_use", "why_it_works", "simple_meaning", "self_check", "memory_hook", "recall_cue")]:
        if re.search(r"calm down", c[k], re.I): issues.append((i, k, "'calm down' used outside a don't-say context"))
for x in issues: print(*x, sep=" | ")
print(f"{len(issues)} rule issues in {len(order)} cards")
