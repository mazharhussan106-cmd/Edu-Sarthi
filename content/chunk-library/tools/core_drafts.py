# Owns the Core 220 gaps that Claude drafted on 30 Sep 2026, at the owner's
# request: a Hindi meaning and Hindi example where the sheet had none, and a
# real English example where the sheet's "English example" was a situation
# ("When you missed what someone said"). The situation is kept, moved to the
# "When to use" field.
#
# Every value here is a DRAFT for a teacher to check. export_json.py marks the
# fields it takes from this file, and the card labels them, so nobody mistakes
# a machine draft for checked content.
#
# One line per chunk, fields separated by " | ":
#   ID | when to use | English example | Hindi (Devanagari) | Hindi (Roman) |
#   Hindi example (Devanagari) | Hindi example (Roman)
# A "-" means "keep what the sheet has" (or leave empty if the sheet is empty).

RAW = r"""
CORE-001 | When you missed what someone said | Sorry, could you say that again? I didn't catch the last part. | माफ़ कीजिए, क्या आप दोबारा बोल सकते हैं? | Maaf kijiye, kya aap dobara bol sakte hain? | माफ़ कीजिए, क्या आप दोबारा बोल सकते हैं? आख़िरी हिस्सा मैं सुन नहीं पाया। | Maaf kijiye, kya aap dobara bol sakte hain? Aakhri hissa main sun nahi paaya.
CORE-002 | - | - | कैसा चल रहा है? | Kaisa chal raha hai? | हाय रवि, कैसा चल रहा है? | Hi Ravi, kaisa chal raha hai?
CORE-003 | - | - | आपसे मिलकर अच्छा लगा। | Aapse milkar achha laga. | मैं सना हूँ। आपसे मिलकर अच्छा लगा। | Main Sana hoon. Aapse milkar achha laga.
CORE-004 | Asking about someone's job | So, what do you do? I'm a nurse. | आप क्या काम करते हैं? | Aap kya kaam karte hain? | तो, आप क्या काम करते हैं? मैं नर्स हूँ। | Toh, aap kya kaam karte hain? Main nurse hoon.
CORE-005 | Replying to thanks or a request | "Thanks for waiting." "No problem." | कोई बात नहीं। | Koi baat nahi. | "रुकने के लिए धन्यवाद।" "कोई बात नहीं।" | "Rukne ke liye dhanyavaad." "Koi baat nahi."
CORE-006 | Replying to "thank you" | "Thank you for the help." "You're welcome." | आपका स्वागत है। / कोई बात नहीं। | Aapka swagat hai. / Koi baat nahi. | "मदद के लिए धन्यवाद।" "कोई बात नहीं।" | "Madad ke liye dhanyavaad." "Koi baat nahi."
CORE-007 | Before someone's exam or interview | Good luck for your interview tomorrow! | शुभकामनाएँ! | Shubhkaamnaayein! | कल के इंटरव्यू के लिए शुभकामनाएँ! | Kal ke interview ke liye shubhkaamnaayein!
CORE-008 | Ending a call or meeting | Okay, see you on Monday. Take care. | अपना ख़्याल रखना। | Apna khayal rakhna. | ठीक है, सोमवार को मिलते हैं। अपना ख़्याल रखना। | Theek hai, Somvaar ko milte hain. Apna khayal rakhna.
CORE-009 | Returning a wish ("Happy Diwali!") | "Happy Diwali!" "Same to you!" | आपको भी। | Aapko bhi. | "दिवाली मुबारक!" "आपको भी!" | "Diwali mubarak!" "Aapko bhi!"
CORE-010 | - | - | मुझे भी ऐसी उम्मीद है। | Mujhe bhi aisi ummeed hai. | "क्या कल धूप होगी?" "उम्मीद तो है।" | "Kya kal dhoop hogi?" "Ummeed toh hai."
CORE-011 | - | - | मुझे नहीं लगता। | Mujhe nahi lagta. | "क्या दुकान खुली है?" "मुझे नहीं लगता।" | "Kya dukaan khuli hai?" "Mujhe nahi lagta."
CORE-012 | - | - | अभी नहीं। | Abhi nahi. | "खाना खा लिया?" "अभी नहीं।" | "Khaana kha liya?" "Abhi nahi."
CORE-013 | - | - | हाँ, ज़रूर। | Haan, zaroor. | "क्या मैं आपका फ़ोन इस्तेमाल कर सकता हूँ?" "हाँ, ज़रूर।" | "Kya main aapka phone istemaal kar sakta hoon?" "Haan, zaroor."
CORE-014 | - | - | … से आपका क्या मतलब है? | ___ se aapka kya matlab hai? | 'डेडलाइन' से आपका क्या मतलब है? | 'Deadline' se aapka kya matlab hai?
CORE-015 | When something is not important any more | "What were you saying?" "Never mind, it's not important." | छोड़ो, कोई बात नहीं। | Chhodo, koi baat nahi. | "तुम क्या कह रहे थे?" "छोड़ो, ज़रूरी नहीं है।" | "Tum kya keh rahe the?" "Chhodo, zaroori nahi hai."
CORE-016 | When the answer isn't yes or no | "Do you like working from home?" "It depends on the day." | यह निर्भर करता है। | Yeh nirbhar karta hai. | "क्या तुम्हें घर से काम करना पसंद है?" "दिन पर निर्भर करता है।" | "Kya tumhe ghar se kaam karna pasand hai?" "Din par nirbhar karta hai."
CORE-017 | - | - | ठीक लग रहा है। | Theek lag raha hai. | "छह बजे मिलते हैं।" "ठीक है।" | "Chhah baje milte hain." "Theek hai."
CORE-018 | - | - | शायद हाँ। | Shaayad haan. | "क्या यह सही बस है?" "शायद हाँ।" | "Kya yeh sahi bus hai?" "Shaayad haan."
CORE-019 | - | - | ज़्यादा नहीं। | Zyaada nahi. | "थके हो?" "ज़्यादा नहीं।" | "Thake ho?" "Zyaada nahi."
CORE-020 | - | - | - | - | - | -
CORE-021 | - | - | क्यों नहीं? | Kyon nahi? | "नया कैफ़े ट्राई करें?" "क्यों नहीं?" | "Naya café try karein?" "Kyon nahi?"
CORE-022 | When your first sentence came out wrong | Let me put it another way: we need more people, not more time. | मैं इसे दूसरे तरीक़े से कहता हूँ। | Main ise doosre tareeke se kehta hoon. | मैं इसे दूसरे तरीक़े से कहता हूँ: हमें ज़्यादा समय नहीं, ज़्यादा लोग चाहिए। | Main ise doosre tareeke se kehta hoon: humein zyaada samay nahi, zyaada log chahiye.
CORE-023 | Before saying something difficult | I'm not sure how to say this, but I think we need more time. | समझ नहीं आ रहा कैसे कहूँ, लेकिन… | Samajh nahi aa raha kaise kahoon, lekin… | समझ नहीं आ रहा कैसे कहूँ, लेकिन मुझे लगता है हमें और समय चाहिए। | Samajh nahi aa raha kaise kahoon, lekin mujhe lagta hai humein aur samay chahiye.
CORE-024 | Letting the other person decide | "Tea or coffee?" "It's up to you." | जैसी आपकी मर्ज़ी। | Jaisi aapki marzi. | "चाय या कॉफ़ी?" "जैसी आपकी मर्ज़ी।" | "Chai ya coffee?" "Jaisi aapki marzi."
CORE-025 | A polite "no" | "Is the manager in?" "I'm afraid not. He's out today." | माफ़ कीजिए, नहीं। | Maaf kijiye, nahi. | "क्या मैनेजर हैं?" "माफ़ कीजिए, नहीं। वे आज बाहर हैं।" | "Kya manager hain?" "Maaf kijiye, nahi. Ve aaj bahar hain."
CORE-026 | When something finally happens | The bus came after an hour. Better late than never! | देर आए, दुरुस्त आए। | Der aaye, durust aaye. | बस एक घंटे बाद आई। देर आए, दुरुस्त आए! | Bus ek ghante baad aayi. Der aaye, durust aaye!
CORE-027 | - | - | ठीक है, बात सही है। | Theek hai, baat sahi hai. | "मैं नहीं आ सकता, मेरा एग्ज़ाम है।" "ठीक है, बात सही है।" | "Main nahi aa sakta, mera exam hai." "Theek hai, baat sahi hai."
CORE-028 | - | - | - | - | - | -
CORE-029 | - | - | - | - | - | -
CORE-030 | - | - | क्या आप … में मेरी मदद कर सकते हैं? | Kya aap ___ mein meri madad kar sakte hain? | क्या आप यह बैग उठाने में मेरी मदद कर सकते हैं? | Kya aap yeh bag uthaane mein meri madad kar sakte hain?
CORE-031 | - | - | - | - | - | -
CORE-032 | - | - | … कितने का है / कितने के हैं? | ___ kitne ka hai / kitne ke hain? | ये जूते कितने के हैं? | Ye joote kitne ke hain?
CORE-033 | - | - | मैं … कहाँ कर सकता हूँ? | Main ___ kahan kar sakta hoon? | मैं सिम कार्ड कहाँ ख़रीद सकता हूँ? | Main SIM card kahan khareed sakta hoon?
CORE-034 | - | - | मैं … करने वाला हूँ। | Main ___ karne wala hoon. | मैं अपने चाचा से मिलने जाने वाला हूँ। | Main apne chacha se milne jaane wala hoon.
CORE-035 | - | - | - | - | - | -
CORE-036 | - | - | - | - | - | -
CORE-037 | - | - | क्या मैं … सकता हूँ? | Kya main ___ sakta hoon? | क्या मैं एक पेन ले सकता हूँ? | Kya main ek pen le sakta hoon?
CORE-038 | - | - | क्या आप … लेंगे? | Kya aap ___ lenge? | क्या आप चाय लेंगे? | Kya aap chai lenge?
CORE-039 | - | - | तो, मुझे … के बारे में बताओ। | Toh, mujhe ___ ke baare mein batao. | तो, मुझे अपनी नई नौकरी के बारे में बताओ। | Toh, mujhe apni nayi naukri ke baare mein batao.
CORE-040 | - | - | मैं … पर काम कर रहा हूँ। | Main ___ par kaam kar raha hoon. | मैं एक नए प्रोजेक्ट पर काम कर रहा हूँ। | Main ek naye project par kaam kar raha hoon.
CORE-041 | - | - | - | - | - | -
CORE-042 | - | - | - | - | - | -
CORE-043 | - | - | - | - | - | -
CORE-044 | - | - | - | - | - | -
CORE-045 | - | - | - | - | - | -
CORE-046 | - | - | … और … में क्या फ़र्क़ है? | ___ aur ___ mein kya fark hai? | 'say' और 'tell' में क्या फ़र्क़ है? | 'Say' aur 'tell' mein kya fark hai?
CORE-047 | - | - | क्या आप चाहते हैं कि मैं …? | Kya aap chahte hain ki main ___? | क्या आप चाहते हैं कि मैं उसे फ़ोन करूँ? | Kya aap chahte hain ki main use phone karoon?
CORE-048 | Easy small talk | So, what are you doing this weekend? Any plans? | इस वीकेंड क्या कर रहे हो? | Is weekend kya kar rahe ho? | तो, इस वीकेंड क्या कर रहे हो? कोई प्लान है? | Toh, is weekend kya kar rahe ho? Koi plan hai?
CORE-049 | - | - | - | - | - | -
CORE-050 | - | - | … कैसा है? | ___ kaisa hai? | तुम्हारा नया बॉस कैसा है? | Tumhara naya boss kaisa hai?
CORE-051 | - | - | - | - | - | -
CORE-052 | - | - | … के बारे में आप क्या सोचते हैं? | ___ ke baare mein aap kya sochte hain? | ऑनलाइन क्लास के बारे में आप क्या सोचते हैं? | Online class ke baare mein aap kya sochte hain?
CORE-053 | - | - | - | - | - | -
CORE-054 | - | - | - | - | - | -
CORE-055 | - | - | - | - | - | -
CORE-056 | - | - | - | - | - | -
CORE-057 | - | - | … करने के लिए बहुत … है। | ___ karne ke liye bahut ___ hai. | बाहर जाने के लिए बहुत गर्मी है। | Bahar jaane ke liye bahut garmi hai.
CORE-058 | - | - | - | - | - | -
CORE-059 | - | - | मेरी राय में, … | Meri raay mein, ___ | मेरी राय में, ऑनलाइन क्लास फ़ायदेमंद हैं। | Meri raay mein, online class faaydemand hain.
CORE-060 | - | - | - | - | - | -
CORE-061 | - | - | मैं … करना चाहूँगा। | Main ___ karna chahoonga. | मैं एक सवाल पूछना चाहूँगा। | Main ek sawaal poochhna chahoonga.
CORE-062 | - | - | - | - | - | -
CORE-063 | - | - | परेशान करने के लिए माफ़ कीजिए, लेकिन … | Pareshaan karne ke liye maaf kijiye, lekin ___ | परेशान करने के लिए माफ़ कीजिए, लेकिन लिफ़्ट कहाँ है? | Pareshaan karne ke liye maaf kijiye, lekin lift kahan hai?
CORE-064 | - | - | बस एक छोटा सा सवाल: … | Bas ek chhota sa sawaal: ___ | बस एक छोटा सा सवाल: मीटिंग कब है? | Bas ek chhota sa sawaal: meeting kab hai?
CORE-065 | - | - | मैं बस … करने ही वाला था। | Main bas ___ karne hi wala tha. | मैं बस तुम्हें फ़ोन करने ही वाला था! | Main bas tumhe phone karne hi wala tha!
CORE-066 | - | - | … करने का सबसे अच्छा तरीक़ा है … | ___ karne ka sabse achha tareeka hai ___ | सीखने का सबसे अच्छा तरीक़ा है रोज़ अभ्यास करना। | Seekhne ka sabse achha tareeka hai roz abhyaas karna.
CORE-067 | - | - | - | - | - | -
CORE-068 | - | - | तुमने … क्यों किया? / किस वजह से …? | Kis wajah se tumne ___? | किस वजह से तुमने पढ़ाना चुना? | Kis wajah se tumne padhaana chuna?
CORE-069 | - | - | - | - | - | -
CORE-070 | Talking about something you are excited about | I'm really looking forward to the holidays. | - | - | - | -
CORE-071 | - | - | - | - | - | -
CORE-072 | - | - | मैं … से … कर रहा हूँ। | Main ___ se ___ kar raha hoon. | मैं बीस मिनट से इंतज़ार कर रहा हूँ। | Main bees minute se intezaar kar raha hoon.
CORE-073 | - | - | - | - | - | -
CORE-074 | - | - | मुझे … करने की आदत नहीं है। | Mujhe ___ karne ki aadat nahi hai. | मुझे जल्दी उठने की आदत नहीं है। | Mujhe jaldi uthne ki aadat nahi hai.
CORE-075 | - | - | - | - | - | -
CORE-076 | - | - | अगर मुझसे पूछो तो, … | Agar mujhse poochho toh, ___ | अगर मुझसे पूछो तो, हमें जल्दी निकलना चाहिए। | Agar mujhse poochho toh, humein jaldi nikalna chahiye.
CORE-077 | - | - | - | - | - | -
CORE-078 | - | - | मैं सोच रहा था कि क्या … | Main soch raha tha ki kya ___ | मैं सोच रहा था कि क्या आप मेरा CV देख सकते हैं। | Main soch raha tha ki kya aap mera CV dekh sakte hain.
CORE-079 | - | - | - | - | - | -
CORE-080 | - | - | - | - | - | -
CORE-081 | - | - | - | - | - | -
CORE-082 | - | - | तैयार होना | taiyaar hona | मैं दस मिनट में तैयार हो जाता हूँ। | Main das minute mein taiyaar ho jaata hoon.
CORE-083 | - | - | नहाना | nahaana | मैं टहलने के बाद नहाता हूँ। | Main tahalne ke baad nahaata hoon.
CORE-084 | - | - | नाश्ता करना | naashta karna | हम आठ बजे नाश्ता करते हैं। | Hum aath baje naashta karte hain.
CORE-085 | - | - | सोने जाना | sone jaana | मैं ग्यारह बजे सोने जाता हूँ। | Main gyaarah baje sone jaata hoon.
CORE-086 | - | - | होमवर्क करना | homework karna | मैं खाने के बाद अपना होमवर्क करता हूँ। | Main khaane ke baad apna homework karta hoon.
CORE-087 | - | - | फ़ोटो खींचना | photo kheenchna | क्या आप हमारी एक फ़ोटो खींच सकते हैं? | Kya aap hamaari ek photo kheench sakte hain?
CORE-088 | - | - | कड़क चाय | kadak chai | मुझे कड़क चाय पसंद है। | Mujhe kadak chai pasand hai.
CORE-089 | - | - | दोस्त बनाना | dost banaana | वह आसानी से दोस्त बना लेती है। | Vah aasaani se dost bana leti hai.
CORE-090 | - | - | बहुत सारा / बहुत सारे | bahut saara / bahut saare | उसके बहुत सारे दोस्त हैं। | Uske bahut saare dost hain.
CORE-091 | - | - | बिल्कुल / ज़रूर | bilkul / zaroor | बिल्कुल, तुम आ सकते हो। | Bilkul, tum aa sakte ho.
CORE-092 | - | - | - | - | - | -
CORE-093 | Before answering a question | Hmm, let me think. I'd say about fifty people. | ज़रा सोचने दो। | Zara sochne do. | हम्म, ज़रा सोचने दो। लगभग पचास लोग होंगे। | Hmm, zara sochne do. Lagbhag pachaas log honge.
CORE-094 | While you find a word or a paper | Give me a second, I'll find the file. | एक सेकंड रुको। | Ek second ruko. | एक सेकंड रुको, मैं फ़ाइल ढूँढता हूँ। | Ek second ruko, main file dhoondhta hoon.
CORE-095 | - | - | उठना (नींद से) | uthna (neend se) | मैं छह बजे उठता हूँ। | Main chhah baje uthta hoon.
CORE-096 | - | - | चालू करना / बंद करना | chaalu karna / band karna | प्लीज़ पंखा बंद कर दो। | Please pankha band kar do.
CORE-097 | - | - | - | - | - | -
CORE-098 | - | - | - | - | - | -
CORE-099 | - | - | - | - | - | -
CORE-100 | - | - | - | - | - | -
CORE-101 | Time | I go to the gym once a week. | हफ़्ते में एक बार | hafte mein ek baar | मैं हफ़्ते में एक बार जिम जाता हूँ। | Main hafte mein ek baar gym jaata hoon.
CORE-102 | Time | The exam is the day after tomorrow. | परसों (आने वाला) | parson (aane wala) | एग्ज़ाम परसों है। | Exam parson hai.
CORE-103 | Reacting to good news or a plan | "Let's go to the beach on Sunday." "That sounds great!" | यह तो बहुत बढ़िया है! | Yeh toh bahut badhiya hai! | "रविवार को बीच चलें?" "बहुत बढ़िया!" | "Ravivaar ko beach chalein?" "Bahut badhiya!"
CORE-104 | - | - | मैं भी। / मैं भी नहीं। | Main bhi. / Main bhi nahi. | "मुझे चाय बहुत पसंद है।" "मुझे भी।" | "Mujhe chai bahut pasand hai." "Mujhe bhi."
CORE-105 | - | - | मैं आपसे सहमत हूँ। | Main aapse sahmat hoon. | समय के बारे में मैं आपसे सहमत हूँ। | Samay ke baare mein main aapse sahmat hoon.
CORE-106 | - | - | ब्लैक एंड व्हाइट (रंगहीन) | black and white (ranghheen) | यह एक पुरानी ब्लैक-एंड-व्हाइट फ़ोटो है। | Yeh ek puraani black-and-white photo hai.
CORE-107 | - | - | नमक और काली मिर्च | namak aur kaali mirch | क्या आप नमक और काली मिर्च देंगे? | Kya aap namak aur kaali mirch denge?
CORE-108 | - | - | जान-पहचान करना | jaan-pehchaan karna | मैं अपने पड़ोसियों से जान-पहचान करना चाहता हूँ। | Main apne padosiyon se jaan-pehchaan karna chahta hoon.
CORE-109 | - | - | समझ में आना / तर्कसंगत होना | samajh mein aana | तुम्हारा आइडिया समझ में आता है। | Tumhara idea samajh mein aata hai.
CORE-110 | - | - | ग़लती करना | galti karna | हर कोई ग़लती करता है। | Har koi galti karta hai.
CORE-111 | - | - | ध्यान देना | dhyaan dena | कृपया इस स्लाइड पर ध्यान दीजिए। | Kripya is slide par dhyaan dijiye.
CORE-112 | - | - | प्लान बनाना | plan banaana | चलो रविवार का प्लान बनाते हैं। | Chalo Ravivaar ka plan banaate hain.
CORE-113 | - | - | तेज़ बारिश | tez baarish | कल रात तेज़ बारिश हुई। | Kal raat tez baarish hui.
CORE-114 | - | - | सर्दी लगना | sardi lagna | पिछले हफ़्ते मुझे सर्दी लग गई। | Pichhle hafte mujhe sardi lag gayi.
CORE-115 | - | - | बर्तन धोना | bartan dhona | खाने के बाद मैं बर्तन धो दूँगा। | Khaane ke baad main bartan dho doonga.
CORE-116 | - | - | समय बचाना | samay bachaana | ऑनलाइन फ़ॉर्म समय बचाते हैं। | Online form samay bachaate hain.
CORE-117 | - | - | कम से कम | kam se kam | इसमें कम से कम एक घंटा लगता है। | Isme kam se kam ek ghanta lagta hai.
CORE-118 | - | - | भी | bhi | मैं भी चाय लूँगा। | Main bhi chai loonga.
CORE-119 | - | - | इस समय / अभी | is samay / abhi | वह इस समय व्यस्त है। | Vah is samay vyast hai.
CORE-120 | - | - | - | - | - | -
CORE-121 | - | - | जैसे ही | jaise hi | जैसे ही पहुँचो, मुझे फ़ोन करना। | Jaise hi pahuncho, mujhe phone karna.
CORE-122 | Gives you 2–3 seconds to plan your answer | "Why do you want this job?" "That's a good question. Mainly because…" | अच्छा सवाल है। | Achha sawaal hai. | "आप यह नौकरी क्यों चाहते हैं?" "अच्छा सवाल है। मुख्य रूप से क्योंकि…" | "Aap yeh naukri kyon chahte hain?" "Achha sawaal hai. Mukhya roop se kyonki…"
CORE-123 | - | - | समझ पाना / हल निकालना | samajh paana / hal nikaalna | मुझे यह फ़ॉर्म समझ नहीं आ रहा। | Mujhe yeh form samajh nahi aa raha.
CORE-124 | - | - | रुको / ज़रा ठहरो | ruko / zara thehro | ज़रा रुको, मैं अपने नोट्स देख लूँ। | Zara ruko, main apne notes dekh loon.
CORE-125 | - | - | शांत हो जाओ | shaant ho jaao | शांत हो जाओ, हमारे पास समय है। | Shaant ho jaao, hamaare paas samay hai.
CORE-126 | - | - | (किसी को) लेने आना | (kisi ko) lene aana | मैं तुम्हें पाँच बजे लेने आऊँगा। | Main tumhe paanch baje lene aaoonga.
CORE-127 | - | - | पता लगाना | pata lagaana | मैं ट्रेन का टाइम पता करता हूँ। | Main train ka time pata karta hoon.
CORE-128 | - | - | हार मान लेना / छोड़ देना | haar maan lena / chhod dena | अब हार मत मानो। | Ab haar mat maano.
CORE-129 | - | - | देखभाल करना | dekhbhaal karna | वह अपनी माँ की देखभाल करती है। | Vah apni maa ki dekhbhaal karti hai.
CORE-130 | - | - | … में दिलचस्पी होना | ___ mein dilchaspi hona | मुझे फ़ोटोग्राफ़ी में दिलचस्पी है। | Mujhe photography mein dilchaspi hai.
CORE-131 | - | - | - | - | - | -
CORE-132 | - | - | - | - | - | -
CORE-133 | - | - | (जगह) पहुँचना — बिना "to" | (jagah) pahunchna — bina "to" | हम छह बजे स्टेशन पहुँचे। | Hum chhah baje station pahunche.
CORE-134 | - | - | (जगह में) घुसना — बिना "into" | (jagah mein) ghusna — bina "into" | वह चुपचाप कमरे में आई। | Vah chupchaap kamre mein aayi.
CORE-135 | Time | I'll call you in a while. | थोड़ी देर में | thodi der mein | मैं तुम्हें थोड़ी देर में फ़ोन करूँगा। | Main tumhe thodi der mein phone karoonga.
CORE-136 | Time | The train left on time. | समय पर | samay par | ट्रेन समय पर निकली। | Train samay par nikli.
CORE-137 | Money | Can I pay in cash? | नक़द भुगतान करना | nakad bhugtaan karna | क्या मैं नक़द दे सकता हूँ? | Kya main nakad de sakta hoon?
CORE-138 | Money | I spend too much money on clothes. | … पर पैसे ख़र्च करना | ___ par paise kharch karna | मैं कपड़ों पर बहुत ज़्यादा पैसे ख़र्च करता हूँ। | Main kapdon par bahut zyaada paise kharch karta hoon.
CORE-139 | Weather | Take an umbrella; it's pouring. | मूसलाधार बारिश हो रही है। | Moosladhaar baarish ho rahi hai. | छाता ले लो, बहुत तेज़ बारिश हो रही है। | Chhaata le lo, bahut tez baarish ho rahi hai.
CORE-140 | Weather | Close the door; it's freezing. | बहुत ठंड है। | Bahut thand hai. | दरवाज़ा बंद करो, बहुत ठंड है। | Darwaaza band karo, bahut thand hai.
CORE-141 | Weather | Let's go home; it's getting dark. | अँधेरा हो रहा है। | Andhera ho raha hai. | घर चलते हैं, अँधेरा हो रहा है। | Ghar chalte hain, andhera ho raha hai.
CORE-142 | Reacting to bad news | "I missed my train." "Oh no, that's too bad." | अरे नहीं, यह तो बुरा हुआ। | Arre nahi, yeh toh bura hua. | "मेरी ट्रेन छूट गई।" "अरे नहीं, यह तो बुरा हुआ।" | "Meri train chhoot gayi." "Arre nahi, yeh toh bura hua."
CORE-143 | - | - | यह सच है, लेकिन … | Yeh sach hai, lekin ___ | यह सच है, लेकिन यह महँगा है। | Yeh sach hai, lekin yeh mehenga hai.
CORE-144 | - | - | कभी-कभी | kabhi-kabhi | मैं उससे कभी-कभी मिलता हूँ। | Main usse kabhi-kabhi milta hoon.
CORE-145 | - | - | आज नहीं तो कल | aaj nahi toh kal | आज नहीं तो कल, तुम्हें कार की ज़रूरत पड़ेगी। | Aaj nahi toh kal, tumhe car ki zaroorat padegi.
CORE-146 | - | - | उतार-चढ़ाव | utaar-chadhaav | हर नौकरी में उतार-चढ़ाव होते हैं। | Har naukri mein utaar-chadhaav hote hain.
CORE-147 | - | - | कमोबेश / लगभग | kamobesh / lagbhag | काम लगभग पूरा हो गया है। | Kaam lagbhag poora ho gaya hai.
CORE-148 | - | - | बात में दम होना | baat mein dum hona | तुम्हारी बात में दम है। | Tumhaari baat mein dum hai.
CORE-149 | - | - | किसी का हाथ बँटाना | kisi ka haath bantaana | क्या तुम इसमें मेरा हाथ बँटा सकते हो? | Kya tum isme mera haath banta sakte ho?
CORE-150 | - | - | देर होना | der hona | माफ़ करना, मुझे देर हो रही है। | Maaf karna, mujhe der ho rahi hai.
CORE-151 | - | - | वादा निभाना | vaada nibhaana | वह हमेशा अपने वादे निभाता है। | Vah hamesha apne vaade nibhaata hai.
CORE-152 | - | - | ज़ोरदार सिफ़ारिश करना | zordaar sifaarish karna | मैं यह किताब ज़रूर पढ़ने की सलाह दूँगा। | Main yeh kitaab zaroor padhne ki salaah doonga.
CORE-153 | - | - | गहरी नींद में | gehri neend mein | बच्चा गहरी नींद में है। | Bachcha gehri neend mein hai.
CORE-154 | - | - | अचानक | achaanak | अचानक बत्ती चली गई। | Achaanak batti chali gayi.
CORE-155 | - | - | - | - | - | -
CORE-156 | - | - | बात यह है कि … | Baat yeh hai ki ___ | बात यह है कि आज मेरे पास ज़्यादा समय नहीं है। | Baat yeh hai ki aaj mere paas zyaada samay nahi hai.
CORE-157 | - | - | (पिछला काम) पूरा करना | (pichhla kaam) poora karna | मुझे अपने ईमेल निपटाने हैं। | Mujhe apne email niptaane hain.
CORE-158 | - | - | टालना | taalna | अपना काम मत टालो। | Apna kaam mat taalo.
CORE-159 | - | - | … ख़त्म हो जाना | ___ khatm ho jaana | हमारा दूध ख़त्म हो गया है। | Hamaara doodh khatm ho gaya hai.
CORE-160 | - | - | (आइडिया) सोचना / निकालना | (idea) sochna / nikaalna | उसने एक शानदार आइडिया निकाला। | Usne ek shaandaar idea nikaala.
CORE-161 | - | - | … से अच्छी बनना | ___ se achhi banna | मेरी अपने साथियों से अच्छी बनती है। | Meri apne saathiyon se achhi banti hai.
CORE-162 | - | - | (विषय) पर चर्चा करना — बिना "about" | (vishay) par charcha karna — bina "about" | चलो प्लान पर चर्चा करते हैं। | Chalo plan par charcha karte hain.
CORE-163 | - | - | - | - | - | -
CORE-164 | Money | I can't afford a new car right now. | … ख़रीदने की हैसियत न होना | ___ khareedne ki haisiyat na hona | अभी मैं नई कार नहीं ख़रीद सकता। | Abhi main nayi car nahi khareed sakta.
CORE-165 | A polite way to disagree | I see what you mean, but the train is cheaper. | मैं आपकी बात समझ रहा हूँ, लेकिन … | Main aapki baat samajh raha hoon, lekin ___ | मैं आपकी बात समझ रहा हूँ, लेकिन ट्रेन सस्ती है। | Main aapki baat samajh raha hoon, lekin train sasti hai.
CORE-166 | A soft "no" | "This plan will work." "I'm not so sure about that." | मुझे इस पर पूरा यक़ीन नहीं है। | Mujhe is par poora yakeen nahi hai. | "यह प्लान काम करेगा।" "मुझे इस पर पूरा यक़ीन नहीं है।" | "Yeh plan kaam karega." "Mujhe is par poora yakeen nahi hai."
CORE-167 | - | - | इधर-उधर | idhar-udhar | वह इंतज़ार करते हुए इधर-उधर टहलता रहा। | Vah intezaar karte hue idhar-udhar tahalta raha.
CORE-168 | - | - | सही-सलामत | sahi-salaamat | वे सही-सलामत घर पहुँच गए। | Ve sahi-salaamat ghar pahunch gaye.
CORE-169 | - | - | फ़ायदे और नुक़सान | faayde aur nuksaan | चलो फ़ायदे और नुक़सान लिखते हैं। | Chalo faayde aur nuksaan likhte hain.
CORE-170 | - | - | … से तंग आ जाना | ___ se tang aa jaana | मैं इंतज़ार करते-करते तंग आ गया हूँ। | Main intezaar karte-karte tang aa gaya hoon.
CORE-171 | - | - | उदाहरण के लिए, … | Udaaharan ke liye, ___ | मुझे खेल पसंद हैं। उदाहरण के लिए, क्रिकेट। | Mujhe khel pasand hain. Udaaharan ke liye, cricket.
CORE-172 | - | - | उसके बाद, … | Uske baad, ___ | मैंने लंच किया। उसके बाद, मैं सो गया। | Maine lunch kiya. Uske baad, main so gaya.
CORE-173 | - | - | सबसे पहले, … | Sabse pehle, ___ | सबसे पहले, आने के लिए धन्यवाद। | Sabse pehle, aane ke liye dhanyavaad.
CORE-174 | Adding a side topic | By the way, did you get my message? | वैसे, … | Waise, ___ | वैसे, क्या तुम्हें मेरा मैसेज मिला? | Waise, kya tumhe mera message mila?
CORE-175 | - | - | असल में, … | Asal mein, ___ | असल में, वह सोमवार को है। | Asal mein, vah Somvaar ko hai.
CORE-176 | Before a sincere opinion | To be honest, I didn't like the idea. | - | - | - | -
CORE-177 | - | - | आख़िर में, … | Aakhir mein, ___ | आख़िर में, हमने टैक्सी ली। | Aakhir mein, humne taxi li.
CORE-178 | Showing the other side | The flat is small. On the other hand, it's close to my office. | दूसरी तरफ़, … | Doosri taraf, ___ | फ़्लैट छोटा है। दूसरी तरफ़, यह मेरे ऑफ़िस के पास है। | Flat chhota hai. Doosri taraf, yeh mere office ke paas hai.
CORE-179 | Returning to the main topic | Anyway, let's get back to the project. | ख़ैर, … | Khair, ___ | ख़ैर, प्रोजेक्ट पर वापस आते हैं। | Khair, project par waapas aate hain.
CORE-180 | Showing a result | It rained all night. As a result, the roads were flooded. | इसके नतीजे में, … | Iske nateeje mein, ___ | रात भर बारिश हुई। इसके नतीजे में, सड़कें पानी से भर गईं। | Raat bhar baarish hui. Iske nateeje mein, sadkein paani se bhar gayin.
CORE-181 | - | - | बहुत आसान काम | bahut aasaan kaam | टेस्ट तो बहुत आसान था। | Test toh bahut aasaan tha.
CORE-182 | - | - | … पर नज़र रखना | ___ par nazar rakhna | प्लीज़, मेरे बैग पर नज़र रखना। | Please, mere bag par nazar rakhna.
CORE-183 | Use when encouraging regular practice | You got it wrong again? Keep going. Practice makes perfect. | अभ्यास से ही निपुणता आती है। | Abhyaas se hi nipunta aati hai. | फिर ग़लत हुआ? लगे रहो। अभ्यास से ही निपुणता आती है। | Phir galat hua? Lage raho. Abhyaas se hi nipunta aati hai.
CORE-184 | Use when time is being wasted | Let's start the meeting now. Time is money. | समय ही पैसा है। | Samay hi paisa hai. | मीटिंग अभी शुरू करते हैं। समय ही पैसा है। | Meeting abhi shuru karte hain. Samay hi paisa hai.
CORE-185 | Use when something hard is worth it | The training is tough, but no pain, no gain. | मेहनत के बिना फल नहीं मिलता। | Mehnat ke bina phal nahi milta. | ट्रेनिंग मुश्किल है, पर मेहनत के बिना फल नहीं मिलता। | Training mushkil hai, par mehnat ke bina phal nahi milta.
CORE-186 | Use when asking for help with a problem | Can you look at this with me? Two heads are better than one. | एक से भले दो। | Ek se bhale do. | क्या तुम मेरे साथ यह देखोगे? एक से भले दो। | Kya tum mere saath yeh dekhoge? Ek se bhale do.
CORE-187 | Use when advice is hard to follow | "Just stop worrying." "Easier said than done." | कहना आसान है, करना मुश्किल। | Kehna aasaan hai, karna mushkil. | "बस चिंता करना छोड़ दो।" "कहना आसान है, करना मुश्किल।" | "Bas chinta karna chhod do." "Kehna aasaan hai, karna mushkil."
CORE-188 | Use to encourage patience | Study a little every day. Slow and steady wins the race. | धीरे-धीरे चलने वाला ही जीतता है। | Dheere-dheere chalne wala hi jeetta hai. | रोज़ थोड़ा पढ़ो। धीरे-धीरे चलने वाला ही जीतता है। | Roz thoda padho. Dheere-dheere chalne wala hi jeetta hai.
CORE-189 | - | - | झिझक दूर करना / बातचीत शुरू करना | jhijhak door karna / baatcheet shuru karna | एक छोटा सा मज़ाक झिझक दूर करने में मदद करता है। | Ek chhota sa mazaak jhijhak door karne mein madad karta hai.
CORE-190 | - | - | … का तरीक़ा समझ जाना | ___ ka tareeka samajh jaana | तुम जल्दी ही इसका तरीक़ा समझ जाओगे। | Tum jaldi hi iska tareeka samajh jaaoge.
CORE-191 | - | - | एक ही सोच पर होना | ek hi soch par hona | पक्का कर लेते हैं कि हम सब एक ही बात समझ रहे हैं। | Pakka kar lete hain ki hum sab ek hi baat samajh rahe hain.
CORE-192 | - | - | तबीयत थोड़ी ख़राब होना | tabiyat thodi kharaab hona | आज मेरी तबीयत थोड़ी ठीक नहीं है। | Aaj meri tabiyat thodi theek nahi hai.
CORE-193 | - | - | आज का काम ख़त्म करना | aaj ka kaam khatm karna | देर हो गई है। आज के लिए बस करते हैं। | Der ho gayi hai. Aaj ke liye bas karte hain.
CORE-194 | - | - | कभी-कभार / ईद का चाँद होना | kabhi-kabhaar / Eid ka chaand hona | वह मुझे कभी-कभार ही फ़ोन करता है। | Vah mujhe kabhi-kabhaar hi phone karta hai.
CORE-195 | - | - | बहुत महँगा होना | bahut mehenga hona | वह फ़ोन बहुत महँगा था। | Vah phone bahut mehenga tha.
CORE-196 | - | - | जमकर पढ़ाई करना | jamkar padhaai karna | एग्ज़ाम पास हैं। जमकर पढ़ाई का समय है। | Exam paas hain. Jamkar padhaai ka samay hai.
CORE-197 | Use when promises aren't followed by action | He says he'll help, but actions speak louder than words. | कथनी से करनी बड़ी। | Kathni se karni badi. | वह कहता है मदद करेगा, पर कथनी से करनी बड़ी होती है। | Vah kehta hai madad karega, par kathni se karni badi hoti hai.
CORE-198 | Use when someone judges by looks | The shop looks old, but don't judge a book by its cover. | सूरत पर मत जाओ। | Soorat par mat jaao. | दुकान पुरानी दिखती है, पर सूरत पर मत जाओ। | Dukaan puraani dikhti hai, par soorat par mat jaao.
CORE-199 | Use to find hope after bad news | I lost the job, but I found a better one. Every cloud has a silver lining. | हर बुराई में कोई न कोई अच्छाई छिपी होती है। | Har buraai mein koi na koi achhaai chhipi hoti hai. | नौकरी गई, पर बेहतर मिल गई। हर बुराई में कोई अच्छाई होती है। | Naukri gayi, par behtar mil gayi. Har buraai mein koi achhaai hoti hai.
CORE-200 | Use to encourage determination | She studied at night after work. Where there's a will, there's a way. | जहाँ चाह, वहाँ राह। | Jahaan chaah, wahaan raah. | वह काम के बाद रात में पढ़ती थी। जहाँ चाह, वहाँ राह। | Vah kaam ke baad raat mein padhti thi. Jahaan chaah, wahaan raah.
CORE-201 | Phone | Can I speak to Mr Verma, please? | क्या मैं … से बात कर सकता हूँ? | Kya main ___ se baat kar sakta hoon? | क्या मैं वर्मा जी से बात कर सकता हूँ? | Kya main Verma ji se baat kar sakta hoon?
CORE-202 | Shop, at the counter. You can also say "Can I pay by UPI?" | Can I pay by card? | क्या मैं कार्ड से पेमेंट कर सकता हूँ? | Kya main card se payment kar sakta hoon? | क्या मैं कार्ड से पेमेंट कर सकता हूँ? | Kya main card se payment kar sakta hoon?
CORE-203 | The standard opening line of a reply | Dear Ms Rao, thank you for your email. | आपके ईमेल के लिए धन्यवाद। | Aapke email ke liye dhanyavaad. | प्रिय राव जी, आपके ईमेल के लिए धन्यवाद। | Priya Rao ji, aapke email ke liye dhanyavaad.
CORE-204 | The standard closing before your name | Kind regards, Priya Sharma | सादर, / शुभकामनाओं सहित, | Saadar, / Shubhkaamnaaon sahit, | सादर, प्रिया शर्मा | Saadar, Priya Sharma
CORE-205 | Phone: answering a call for someone else | "Hello, is Anil there?" "Who's calling, please?" | कौन बोल रहा है? | Kaun bol raha hai? | "हेलो, क्या अनिल हैं?" "कौन बोल रहा है?" | "Hello, kya Anil hain?" "Kaun bol raha hai?"
CORE-206 | Phone: when the person isn't available | She's in a meeting? Can I leave a message? | क्या मैं संदेश छोड़ सकता हूँ? | Kya main sandesh chhod sakta hoon? | वह मीटिंग में हैं? क्या मैं संदेश छोड़ सकता हूँ? | Vah meeting mein hain? Kya main sandesh chhod sakta hoon?
CORE-207 | Shop: asking for another size | This is too big. Do you have this in a smaller size? | क्या यह छोटे साइज़ में है? | Kya yeh chhote size mein hai? | यह बहुत बड़ा है। क्या यह छोटे साइज़ में है? | Yeh bahut bada hai. Kya yeh chhote size mein hai?
CORE-208 | Restaurant: at the end of a meal | Excuse me, could we have the bill, please? | क्या बिल मिल सकता है? | Kya bill mil sakta hai? | सुनिए, क्या बिल मिल सकता है? | Suniye, kya bill mil sakta hai?
CORE-209 | Classroom: when an explanation isn't clear | I don't understand this rule. Can you give me an example? | क्या आप एक उदाहरण दे सकते हैं? | Kya aap ek udaaharan de sakte hain? | मुझे यह नियम समझ नहीं आया। क्या आप एक उदाहरण दे सकते हैं? | Mujhe yeh niyam samajh nahi aaya. Kya aap ek udaaharan de sakte hain?
CORE-210 | Interview: the most common first question | "So, tell me about yourself." "I'm a B.Com graduate from Pune…" | अपने बारे में बताइए। | Apne baare mein bataiye. | "तो, अपने बारे में बताइए।" "मैं पुणे से B.Com ग्रेजुएट हूँ…" | "Toh, apne baare mein bataiye." "Main Pune se B.Com graduate hoon…"
CORE-211 | A friendly opening line in an email or message | Dear Arjun, I hope you are doing well. | उम्मीद है आप अच्छे होंगे। | Ummeed hai aap achhe honge. | प्रिय अर्जुन, उम्मीद है आप अच्छे होंगे। | Priya Arjun, ummeed hai aap achhe honge.
CORE-212 | - | - | मैं … के लिए लिख रहा हूँ। | Main ___ ke liye likh raha hoon. | मैं शिक्षक पद के लिए आवेदन करने हेतु लिख रहा हूँ। | Main shikshak pad ke liye aavedan karne hetu likh raha hoon.
CORE-213 | - | - | अगर … तो कृपया बताइए। | Agar ___ toh kripya bataiye. | अगर आपको कुछ और चाहिए तो कृपया बताइए। | Agar aapko kuch aur chahiye toh kripya bataiye.
CORE-214 | Interview | My greatest strength is solving problems calmly. | मेरी सबसे बड़ी ताक़त … है। | Meri sabse badi taakat ___ hai. | मेरी सबसे बड़ी ताक़त शांति से समस्याएँ सुलझाना है। | Meri sabse badi taakat shaanti se samasyaayein suljhaana hai.
CORE-215 | Interview: answer to "Do you have any questions for us?" | Yes, one question: what does a typical day look like in this role? | इस पद पर एक आम दिन कैसा होता है? | Is pad par ek aam din kaisa hota hai? | हाँ, एक सवाल: इस पद पर एक आम दिन कैसा होता है? | Haan, ek sawaal: is pad par ek aam din kaisa hota hai?
CORE-216 | - | - | कृपया संलग्न … देखें। | Kripya sanlagn ___ dekhein. | कृपया संलग्न मेरा CV देखें। | Kripya sanlagn mera CV dekhein.
CORE-217 | - | - | मैं … का अनुरोध करना चाहूँगा। | Main ___ ka anurodh karna chahoonga. | मैं एक दिन की छुट्टी का अनुरोध करना चाहूँगा। | Main ek din ki chhutti ka anurodh karna chahoonga.
CORE-218 | - | - | जैसा कि बात हुई थी, … | Jaisa ki baat hui thi, ___ | जैसा कि बात हुई थी, मैंने रिपोर्ट भेज दी है। | Jaisa ki baat hui thi, maine report bhej di hai.
CORE-219 | When you answer an email late | Dear Mr Khan, I apologise for the delay in replying. | देर से जवाब देने के लिए क्षमा चाहता हूँ। | Der se jawaab dene ke liye kshama chahta hoon. | प्रिय ख़ान साहब, देर से जवाब देने के लिए क्षमा चाहता हूँ। | Priya Khan saahab, der se jawaab dene ke liye kshama chahta hoon.
CORE-220 | The standard polite closing line | Thank you for your time. I look forward to hearing from you. | आपके जवाब का इंतज़ार रहेगा। | Aapke jawaab ka intezaar rahega. | आपके समय के लिए धन्यवाद। आपके जवाब का इंतज़ार रहेगा। | Aapke samay ke liye dhanyavaad. Aapke jawaab ka intezaar rahega.
"""


def load() -> dict[str, dict[str, str | None]]:
    out: dict[str, dict[str, str | None]] = {}
    for line in RAW.strip().splitlines():
        parts = [p.strip() for p in line.split(" | ")]
        if len(parts) != 7:
            raise ValueError(f"core_drafts: expected 7 fields, got {len(parts)}: {line[:60]}")
        cid, *vals = parts
        keys = ["when", "example", "hi_dev", "hi_rom", "hiex_dev", "hiex_rom"]
        out[cid] = {k: (None if v == "-" else v) for k, v in zip(keys, vals)}
    return out
