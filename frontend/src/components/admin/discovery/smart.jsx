/**
 * "Describe who you need" — English / Hinglish line → search filters.
 * Purane app ka CS_SMART parser jaisa ka taisa (app.js), bas yahan module bana diya.
 * Output: { location, gender, categories, words, min, max, min_engagement, min_age, max_age, language, chips }
 */
const kfmtN = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
const cap1 = (v) => String(v || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const smartParse = (()=>{
  const cities = { "delhi":"Delhi","new delhi":"Delhi","ncr":"Delhi","gurgaon":"Gurugram","gurugram":"Gurugram","noida":"Noida","ghaziabad":"Ghaziabad","faridabad":"Faridabad",
    "mumbai":"Mumbai","bombay":"Mumbai","navi mumbai":"Navi Mumbai","thane":"Thane","bangalore":"Bengaluru","bengaluru":"Bengaluru","bengalore":"Bengaluru","hyderabad":"Hyderabad",
    "chennai":"Chennai","madras":"Chennai","kolkata":"Kolkata","calcutta":"Kolkata","pune":"Pune","ahmedabad":"Ahmedabad","jaipur":"Jaipur","lucknow":"Lucknow","chandigarh":"Chandigarh",
    "indore":"Indore","surat":"Surat","kochi":"Kochi","cochin":"Kochi","goa":"Goa","bhopal":"Bhopal","nagpur":"Nagpur","patna":"Patna","dehradun":"Dehradun","guwahati":"Guwahati",
    "udaipur":"Udaipur","jodhpur":"Jodhpur","kota":"Kota","ajmer":"Ajmer","bikaner":"Bikaner","vadodara":"Vadodara","baroda":"Vadodara","rajkot":"Rajkot","nashik":"Nashik",
    "aurangabad":"Aurangabad","kanpur":"Kanpur","varanasi":"Varanasi","banaras":"Varanasi","agra":"Agra","meerut":"Meerut","prayagraj":"Prayagraj","allahabad":"Prayagraj",
    "amritsar":"Amritsar","ludhiana":"Ludhiana","jalandhar":"Jalandhar","mohali":"Mohali","shimla":"Shimla","jammu":"Jammu","srinagar":"Srinagar","ranchi":"Ranchi",
    "bhubaneswar":"Bhubaneswar","raipur":"Raipur","visakhapatnam":"Visakhapatnam","vizag":"Visakhapatnam","vijayawada":"Vijayawada","coimbatore":"Coimbatore","madurai":"Madurai",
    "mysore":"Mysuru","mysuru":"Mysuru","mangalore":"Mangaluru","mangaluru":"Mangaluru","trivandrum":"Thiruvananthapuram","thiruvananthapuram":"Thiruvananthapuram",
    "siliguri":"Siliguri","gwalior":"Gwalior","jabalpur":"Jabalpur","rishikesh":"Rishikesh","haridwar":"Haridwar","pondicherry":"Puducherry","puducherry":"Puducherry",
    "rajasthan":"Rajasthan","maharashtra":"Maharashtra","gujarat":"Gujarat","punjab":"Punjab","haryana":"Haryana","karnataka":"Karnataka","kerala":"Kerala","tamil nadu":"Tamil Nadu",
    "telangana":"Telangana","west bengal":"West Bengal","bengal":"West Bengal","bihar":"Bihar","uttar pradesh":"Uttar Pradesh","up":"Uttar Pradesh","madhya pradesh":"Madhya Pradesh",
    "mp":"Madhya Pradesh","uttarakhand":"Uttarakhand","himachal":"Himachal Pradesh","assam":"Assam","odisha":"Odisha","jharkhand":"Jharkhand","chhattisgarh":"Chhattisgarh" };
  const cats = [["Food",/^(food|foodie|foodies|khana|khaana|recipe|recipes|cooking|cook|chef|baking|baker|restaurant|cafe|cafes|street ?food)$/],
    ["Fashion",/^(fashion|ootd|style|styling|outfit|outfits|kapde|clothing|saree|sarees|ethnic|streetwear|modest)$/],["Beauty",/^(beauty|makeup|skincare|skin|haircare|hair|cosmetics|grwm|nails)$/],
    ["Fitness",/^(fitness|gym|workout|yoga|fit|bodybuilding|crossfit|running|runner)$/],["Health",/^(health|healthy|wellness|nutrition|diet|dietitian|doctor|ayurveda)$/],
    ["Travel",/^(travel|traveller|traveler|travelling|ghumna|trip|trips|tourism|backpacking|wanderlust)$/],["Tech",/^(tech|technology|gadget|gadgets|smartphone|smartphones|mobile|laptop|unboxing)$/],
    ["Comedy",/^(comedy|comedian|funny|meme|memes|skit|skits|standup)$/],["Entertainment",/^(entertainment|actor|actress|acting|movies|bollywood)$/],
    ["Parenting",/^(parenting|parent|parents|mom|moms|mommy|mother|mothers|mummy|dad|dads|father|baby|babies|kids|kid|toddler|newborn)$/],
    ["Gaming",/^(gaming|gamer|gamers|games|bgmi|esports|streamer)$/],["Finance",/^(finance|money|stocks|stock|investing|investment|trading|crypto|personal ?finance)$/],
    ["Business",/^(business|entrepreneur|startup|startups|founder|marketing)$/],["Education",/^(education|teacher|teaching|study|students|edtech|learning|upsc)$/],
    ["Music",/^(music|singer|singing|musician|rapper|guitar)$/],["Dance",/^(dance|dancer|dancing|choreographer)$/],["Art",/^(art|artist|artists|painting|drawing|illustration|craft|crafts|diy)$/],
    ["Photography",/^(photography|photographer|photos)$/],["Sports",/^(sports|sport|cricket|football|athlete|badminton|tennis)$/],["Home decor",/^(decor|interior|interiors|homedecor|home)$/],
    ["Auto",/^(auto|cars|car|bikes|bike|automobile|motorcycle|biker)$/],["Spirituality",/^(spiritual|spirituality|devotional|meditation|astrology)$/],
    ["Lifestyle",/^(lifestyle|vlog|vlogs|vlogger|daily ?vlog)$/],["Lifestyle",/^(wedding|weddings|bride|bridal|shaadi)$/]];
  const pets = { dog:["dog","dogs","puppy","pup","doggo","doglover","dogmom","dogdad","labrador","retriever","pug","beagle","husky","shihtzu","shih tzu","german shepherd","indie dog","kutta","dogsofinstagram","doggy","doggie","furbaby","fur baby"],
    cat:["cat","cats","kitten","kitty","catmom","catdad","catlover","persian cat","billi","catsofinstagram","meow","furbaby"], bird:["bird","birds","parrot","budgie"], fish:["aquarium","fish tank","fishkeeping"] };
  const petWord = { dog:"dog",dogs:"dog",puppy:"dog",puppies:"dog",pup:"dog",doggo:"dog",kutta:"dog",kutte:"dog",labrador:"dog",pug:"dog",husky:"dog",beagle:"dog",
    cat:"cat",cats:"cat",kitten:"cat",kitty:"cat",billi:"cat",bird:"bird",birds:"bird",parrot:"bird",aquarium:"fish" };
  const langs = ["hindi","english","marathi","tamil","telugu","bengali","bangla","gujarati","punjabi","kannada","malayalam","odia","urdu","bhojpuri","rajasthani","haryanvi","assamese"];
  const stop = new Set(("a an the and or with who whose have has having had want wants need needs needed looking look find show give get me my us our we i for of in on at from to near around by "
    + "is are be been being that this these those any some all every only also etc like type kind based city cities area region place followers follower following "
    + "creator creators creator creators cretor creators influencer influencers influncer blogger bloggers vlogger vloggers youtuber youtubers profile profiles account accounts people person "
    + "mai me mein mei main se ke ki ka ko ho hai hain hon jo jin jinke jinka jinki jiske jiska jiski jis wale wala wali walo log logon koi sab sabhi aur ya bhi pe par tak liye lie chahiye chaiye "
    + "chahie chahiyee chiye chaye chahye chahte chahta chahti speak speaks speaking bolte bolne bolti who mujhe humko hume hamein muje pass paas rakhte rakhta rakhti rakhe hota hoti hote hum aap apna apne apni ek do bhai yaar please pls plz acha ache achha good best "
    + "top great nice campaign campaigns brand brands product products promote promotion collab collaboration content post posts reel reels video videos instagram insta ig lover lovers owner owners "
    + "having pet-friendly friendly ka-pet").split(/\s+/));
  const num = (t)=>{ const m = String(t).toLowerCase().replace(/,/g,"").match(/^(\d+(?:\.\d+)?)\s*(k|thousand|l|lac|lakh|lakhs|m|mn|million|cr|crore)?$/); if(!m) return null;
    const v = parseFloat(m[1]), u = m[2]||""; return Math.round(v * (/^k|thousand/.test(u)?1e3:/^(l|lac|lakh)/.test(u)?1e5:/^(m|mn|million)$/.test(u)?1e6:/^(cr|crore)/.test(u)?1e7:1)); };
  const N = "(\\d+(?:\\.\\d+)?\\s*(?:k|thousand|lakhs?|lac|l|mn|m|million|cr|crore)?)";
  return function parse(text){
    let t = " " + String(text||"").toLowerCase().replace(/[“”"']/g," ").replace(/[,;|/]+/g," , ").replace(/\s+/g," ") + " ";
    const out = { location:"", gender:"", categories:[], words:[], min:"", max:"", min_engagement:"", min_age:"", max_age:"", language:"", chips:[] };
    const cut = (re)=>{ t = t.replace(re, " "); };
    // followers
    let m = t.match(new RegExp(N+"\\s*(?:-|–|to|se|and)\\s*"+N+"(?=\\s|$)"));
    if(m && (/[a-z]/.test(m[1]+m[2]) || /follower/.test(t))){ const a = num(m[1].replace(/\s/g,"")), b = num(m[2].replace(/\s/g,"")) ;
      if(a!=null && b!=null){ const mul = !/[a-z]/.test(m[1]) && /[a-z]/.test(m[2]) ? num("1"+m[2].replace(/[\d.\s]/g,"")) : 1; out.min = String(a*mul); out.max = String(b); cut(m[0]); } }
    if(!out.min && !out.max){
      m = t.match(new RegExp("(?:above|over|more than|min(?:imum)?|at ?least|atleast|from)\\s*"+N)) || t.match(new RegExp(N+"\\s*(?:\\+|plus|se (?:zyada|jyada|upar|uppar|above)|or more|and above)"));
      if(m && num(m[1].replace(/\s/g,""))!=null){ out.min = String(num(m[1].replace(/\s/g,""))); cut(m[0]); }
      m = t.match(new RegExp("(?:under|below|less than|max(?:imum)?|upto|up to|within)\\s*"+N)) || t.match(new RegExp(N+"\\s*(?:se kam|tak|or less|and below)"));
      if(m && num(m[1].replace(/\s/g,""))!=null){ out.max = String(num(m[1].replace(/\s/g,""))); cut(m[0]); }
      m = !out.min && !out.max && t.match(new RegExp(N+"\\s*followers?"));
      if(m && num(m[1].replace(/\s/g,""))!=null){ out.min = String(num(m[1].replace(/\s/g,""))); cut(m[0]); }
    }
    const tiers = { nano:[1000,10000], micro:[10000,50000], mid:[50000,200000], "mid-tier":[50000,200000], macro:[200000,1000000], mega:[1000000,""], celebrity:[1000000,""] };
    Object.keys(tiers).forEach(k=>{ if(!out.min && !out.max && new RegExp("\\s"+k+"\\s").test(t)){ out.min = String(tiers[k][0]); out.max = String(tiers[k][1]); cut(new RegExp("\\s"+k+"\\s")); } });
    if(out.min || out.max) out.chips.push(["followers", "👥 " + (out.min&&out.max ? kfmtN(+out.min)+"–"+kfmtN(+out.max) : out.min ? kfmtN(+out.min)+"+" : "up to "+kfmtN(+out.max)) + " followers"]);
    // engagement %
    m = t.match(/(\d+(?:\.\d+)?)\s*%\s*(?:\+|plus)?\s*(?:engagement|er|eng)?/) || t.match(/(?:engagement|er)\s*(?:above|over|of|>)?\s*(\d+(?:\.\d+)?)\s*%?/);
    if(m){ const e = parseFloat(m[1]); if(e>0 && e<50){ out.min_engagement = String([1,2,3,5,8].filter(x=>x<=e).pop()||1); out.chips.push(["min_engagement","⚡ "+out.min_engagement+"%+ engagement"]); cut(m[0]); } }
    // age
    m = t.match(/(\d{2})\s*(?:-|–|to|se)\s*(\d{2})\s*(?:years?|yrs?|saal|sal|age|ki age|umar)/) || t.match(/(?:age|aged|umar)\s*(\d{2})\s*(?:-|–|to|se)\s*(\d{2})/);
    if(m){ out.min_age = m[1]; out.max_age = m[2]; out.chips.push(["age","🎂 "+m[1]+"–"+m[2]+" yrs"]); cut(m[0]); }
    else { m = t.match(/(?:under|below)\s*(\d{2})\s*(?:years?|yrs?|age|saal)?/) || t.match(/(\d{2})\s*(?:saal|years?|yrs?)\s*(?:se kam|tak)/);
      if(m && +m[1]>12){ out.max_age = m[1]; out.chips.push(["age","🎂 up to "+m[1]+" yrs"]); cut(m[0]); }
      m = t.match(/(?:above|over)\s*(\d{2})\s*(?:years?|yrs?|age|saal)/) || t.match(/(\d{2})\s*\+\s*(?:years?|yrs?|age)/);
      if(m && +m[1]>12){ out.min_age = m[1]; out.chips.push(["age","🎂 "+m[1]+"+ yrs"]); cut(m[0]); } }
    // gender
    if(/\s(male|males|man|men|boy|boys|guy|guys|ladka|ladke|ladko|mard|purush|gents)\s/.test(t)){ out.gender = "male"; cut(/\s(male|males|man|men|boy|boys|guy|guys|ladka|ladke|ladko|mard|purush|gents)\s/g); }
    if(/\s(female|females|woman|women|girl|girls|lady|ladies|ladki|ladkiyan|ladkiyon|aurat|mahila|she)\s/.test(t)){ out.gender = out.gender ? "" : "female"; cut(/\s(female|females|woman|women|girl|girls|lady|ladies|ladki|ladkiyan|ladkiyon|aurat|mahila|she)\s/g); }
    if(/\s(moms?|mommy|mummy|mothers?)\s/.test(t) && !out.gender) out.gender = "female";
    if(/\s(dads?|fathers?)\s/.test(t) && !out.gender) out.gender = "male";
    if(out.gender) out.chips.push(["gender", out.gender==="male" ? "👨 Male" : "👩 Female"]);
    // city / state (two-word names first)
    Object.keys(cities).sort((a,b)=> b.length-a.length).some(k=>{ const re = new RegExp("\\s"+k.replace(/ /g,"\\s")+"\\s"); if(re.test(t)){ out.location = cities[k]; cut(re); return true; } });
    // language
    langs.some(l=>{ const re = new RegExp("\\s"+l+"(?:\\s(?:speaking|bolne|language|bhasha))?\\s"); if(re.test(t)){ out.language = l==="bangla"?"bengali":l; cut(re); return true; } });
    if(out.language) out.chips.push(["language","🗣 "+cap1(out.language)]);
    // pets
    const petKinds = new Set();
    t.split(/\s+/).forEach(w=>{ const k = petWord[w.replace(/[^a-z]/g,"")]; if(k) petKinds.add(k); });
    if(petKinds.size){ const g = []; petKinds.forEach(k=> g.push(...pets[k])); out.words.push(g); out.chips.push(["pet", "🐾 " + [...petKinds].map(k=>k+" "+(k==="fish"?"keepers":"parents")).join(" / ")]);
      t = t.split(/\s+/).filter(w=> !petWord[w.replace(/[^a-z]/g,"")] && !/^(parents?|lovers?|owners?)$/.test(w)).join(" "); t = " "+t+" "; }
    if(/\s(pet|pets|petparent|petparents|petlover|petlovers)\s/.test(t)){ if(!petKinds.size){ out.words.push(["pet","petparent","pet parent","petlover","petsofinstagram","furbaby","fur baby","dog","doggo","doglover","dogsofinstagram","cat","catlover","catsofinstagram","puppy","kitten"]); out.chips.push(["pet","🐾 Pet parents"]); }
      cut(/\s(pet|pets|petparent|petparents|petlover|petlovers)\s/g); }
    // categories
    const words = t.split(/\s+/).map(w=>w.replace(/[^a-z0-9._#-]/g,"")).filter(Boolean);
    const left = [];
    for(let i=0;i<words.length;i++){
      const w = words[i], two = w + " " + (words[i+1]||"");
      let hit = cats.find(([,re])=> re.test(two)); if(hit){ i++; } else hit = cats.find(([,re])=> re.test(w));
      if(hit){ if(!out.categories.includes(hit[0])) out.categories.push(hit[0]); continue; }
      if(/^\d+$/.test(w) || w.length<3 || stop.has(w)) continue;
      left.push(w.replace(/^#/,""));
    }
    // "in <place>" that we don't know → location
    if(!out.location){ const mm = String(text||"").toLowerCase().match(/\b(?:in|from)\s+([a-z]{4,20})\b/) || String(text||"").toLowerCase().match(/\b([a-z]{4,20})\s+(?:mai|me|mein|se|ke|wale|ki|ka)\b/);
      if(mm && left.includes(mm[1]) && !stop.has(mm[1])){ out.location = cap1(mm[1]); left.splice(left.indexOf(mm[1]),1); } }
    if(out.location) out.chips.unshift(["location","📍 "+out.location]);
    if(out.categories.length) out.chips.push(["categories","🏷 "+out.categories.join(", ")]);
    if(left.length){ out.words.push([...new Set(left)]); out.chips.push(["extra","🔤 mentions "+[...new Set(left)].map(w=>"“"+w+"”").join(" or ")]); }
    return out;
  };
})();
