// ─────────────────────────────────────────────────────────────────────────────
// generate_cloudinary_sql.js
// Urban Nest — Reads cloudinary_url_map.json and generates a ready-to-run
//              industrial_seed_150_cloudinary.sql with ONLY Cloudinary URLs.
//
// RULES:
//   - Only successfully uploaded Cloudinary URLs are used
//   - If an image slot failed/missing → it is simply excluded from the array
//   - If ALL images for a property failed → photos = '[]'
//   - If an agent/logo image failed  → profile_picture / logo = NULL
//   - A summary of missing images is printed and saved to missing_images_report.txt
//
// USAGE: node generate_cloudinary_sql.js
// OUTPUT: industrial_seed_150_cloudinary.sql  +  missing_images_report.txt
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const URL_MAP_FILE = path.join(__dirname, 'cloudinary_url_map.json');
const OUTPUT_FILE = path.join(__dirname, 'industrial_seed_150_cloudinary.sql');
const REPORT_FILE = path.join(__dirname, 'missing_images_report.txt');

if (!fs.existsSync(URL_MAP_FILE)) {
  console.error('❌  cloudinary_url_map.json not found. Run upload_to_cloudinary.js first!');
  process.exit(1);
}

const urlMap = JSON.parse(fs.readFileSync(URL_MAP_FILE, 'utf8'));

// ── Tracking ──────────────────────────────────────────────────────────────────
const missing = [];
let totalOk = 0;

function resolve(key, type) {
  const u = urlMap[key];
  if (u) { totalOk++; return u; }
  missing.push({ type, key, reason: urlMap.hasOwnProperty(key) ? 'upload failed (null)' : 'not uploaded' });
  return null;
}

// ── Resolve logos (NULL in SQL if missing) ────────────────────────────────────
const logos = [1, 2, 3, 4].map(n => resolve(`agency_logo_${n}`, 'logo'));

// ── Resolve agent portraits (Hardcoded realistic faces) ──────────────────────────
const portraits = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/68.jpg",
  "https://randomuser.me/api/portraits/women/79.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/33.jpg",
  "https://randomuser.me/api/portraits/men/22.jpg",
  "https://randomuser.me/api/portraits/women/11.jpg",
  "https://randomuser.me/api/portraits/men/90.jpg",
  "https://randomuser.me/api/portraits/men/55.jpg"
];

// ── Resolve property images (only successful uploads included in array) ────────
function propImages(propNum) {
  const imgs = [];
  for (let n = 1; n <= 3; n++) {
    const u = resolve(`prop_${propNum}_${n}`, 'property');
    if (u) imgs.push(u);
  }
  return imgs; // [] if all failed, [url1] if only 1 succeeded, etc.
}

// ── Scan all 150 properties ───────────────────────────────────────────────────
console.log('\n🔍  Scanning cloudinary_url_map.json...\n');
const propImageArrays = Array.from({ length: 150 }, (_, i) => propImages(i + 1));

// ── Print report ──────────────────────────────────────────────────────────────
console.log('─────────────────────────────────────────────────');
console.log(`  ✅  Cloudinary images found   : ${totalOk}`);
console.log(`  ❌  Missing / failed          : ${missing.length}`);
console.log('─────────────────────────────────────────────────');

if (missing.length > 0) {
  const byType = { logo: [], agent: [], property: [] };
  missing.forEach(m => (byType[m.type] || []).push(m));

  if (byType.logo.length)
    byType.logo.forEach(m => console.log(`  [LOGO]     ${m.key} — ${m.reason} → logo = NULL`));
  if (byType.agent.length)
    byType.agent.forEach(m => console.log(`  [AGENT]    ${m.key} — ${m.reason} → profile_picture = NULL`));
  if (byType.property.length) {
    console.log(`  [PROPERTY] ${byType.property.length} image slots missing → excluded from photos array`);
    byType.property.slice(0, 10).forEach(m => console.log(`             ${m.key} — ${m.reason}`));
    if (byType.property.length > 10)
      console.log(`             ... and ${byType.property.length - 10} more (see missing_images_report.txt)`);
  }

  const reportLines = [
    'Urban Nest — Missing Cloudinary Images Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Total missing: ${missing.length}  |  Total resolved: ${totalOk}`,
    '',
    ...missing.map(m => `[${m.type.toUpperCase()}] ${m.key} — ${m.reason}`),
  ];
  fs.writeFileSync(REPORT_FILE, reportLines.join('\n'), 'utf8');
  console.log('\n  Full report → missing_images_report.txt');
} else {
  console.log('\n  🎉  All images resolved from Cloudinary!');
}

// ── SQL helpers ───────────────────────────────────────────────────────────────
const sqlStr = v => v ? `'${v}'` : 'NULL';
const PASS = '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.A.W4vC0mG3S7/R1Zp.4T5M3E1y4yG';

// ── Agent rows ────────────────────────────────────────────────────────────────
const agentData = [
  { id: 2, name: 'Arjun Mehta', email: 'arjun@skyline.com', phone: '9876500001', city: 'Mumbai', p: portraits[0] },
  { id: 3, name: 'Priya Sharma', email: 'priya@skyline.com', phone: '9876500002', city: 'Mumbai', p: portraits[1] },
  { id: 4, name: 'Kunal Rao', email: 'kunal@greenvalley.com', phone: '9876500003', city: 'Bangalore', p: portraits[2] },
  { id: 5, name: 'Anjali Nair', email: 'anjali@greenvalley.com', phone: '9876500004', city: 'Bangalore', p: portraits[3] },
  { id: 6, name: 'Vikram Patel', email: 'vikram@heritage.com', phone: '9876500005', city: 'Ahmedabad', p: portraits[4] },
  { id: 7, name: 'Saira Banu', email: 'saira@heritage.com', phone: '9876500006', city: 'Ahmedabad', p: portraits[5] },
  { id: 8, name: 'Rahul Khanna', email: 'rahul@urbannexus.com', phone: '9876500007', city: 'Mumbai', p: portraits[6] },
  { id: 9, name: 'Neha Gupta', email: 'neha@indie.com', phone: '9876500008', city: 'Ahmedabad', p: portraits[7] },
  { id: 10, name: 'Sam Wilson', email: 'sam@indie.com', phone: '9876500009', city: 'Bangalore', p: portraits[8] },
  { id: 11, name: 'Amit Shah', email: 'amit@corporate.com', phone: '9876500010', city: 'Mumbai', p: portraits[9] },
];

const agentRows = agentData
  .map(a => `('${a.name}', '${a.email}', '${PASS}', '${a.phone}', 'AGENT', '${a.city}', ${sqlStr(a.p)})`)
  .join(',\n');

// ── Property image ARRAY literal ──────────────────────────────────────────────
// Each entry is a JSON array string containing only the Cloudinary URLs that succeeded.
// e.g. '["https://res.cloudinary.com/...", "https://res.cloudinary.com/..."]'
// or   '[]'  if all 3 failed
const propImagesLiteral = propImageArrays
  .map(imgs => `'${JSON.stringify(imgs)}'`)
  .join(',\n                             ');

// ── Generate SQL ──────────────────────────────────────────────────────────────
const sql = `-- industrial_seed_150_cloudinary.sql
-- PURPOSE: Production seeding with CLOUDINARY images only.
-- Generated: ${new Date().toISOString()}
-- Cloudinary images : ${totalOk}
-- Missing slots     : ${missing.length} (excluded — no fallbacks)

-- 1. CLEANUP
TRUNCATE TABLE appointments, agent_slots, chat_messages, favorites, property, agent_profiles, agencies, users RESTART IDENTITY CASCADE;

-- 1.5 RECREATE ADMIN USER (ID 1)
INSERT INTO users (name, email, password, role, email_verified, verified, created_at) VALUES 
('Admin', 'realestateddu@gmail.com', '$2a$12$/Kq93FAhAGvb2ON.J3jajOs0KXgoYamvVXW8DjNj03Qf3fg5RftF.', 'ADMIN', true, true, NOW());

-- 2. AGENCIES  (logo_url = Cloudinary URL or NULL)
INSERT INTO agencies (name, agency_code, license_number, bio, status, logo_url, created_at) VALUES
('Skyline Elite Living',  'SKY-MUM', 'L-MUM-9988', 'Mumbai premium luxury residences specialist.',          'APPROVED', ${sqlStr(logos[0])}, NOW()),
('Green Valley Homes',    'GRN-BLR', 'L-BLR-1122', 'Eco-friendly and sustainable residences in Bangalore.', 'APPROVED', ${sqlStr(logos[1])}, NOW()),
('Heritage Craft Realty', 'HER-AHM', 'L-AHM-4455', 'Preserving tradition with modern Ahmedabad living.',    'APPROVED', ${sqlStr(logos[2])}, NOW()),
('Urban Nexus Group',     'UBX-IND', 'L-NAT-7700', 'Modern urban apartments across India major hubs.',      'APPROVED', ${sqlStr(logos[3])}, NOW());

-- 3. AGENTS (password: 'password123' — profile_picture_url = NULL if not uploaded)
INSERT INTO users (name, email, password, phone, role, city, profile_picture_url) VALUES
${agentRows};

-- 4. LINK AGENTS TO AGENCIES
-- Columns: user_id, agency_id, agency_status, experience
INSERT INTO agent_profiles (user_id, agency_id, agency_status, experience) VALUES
(2,  1,    'JOINED', 8),
(3,  1,    'JOINED', 5),
(4,  2,    'JOINED', 12),
(5,  2,    'JOINED', 4),
(6,  3,    'JOINED', 15),
(7,  3,    'JOINED', 6),
(8,  4,    'JOINED', 3),
(9,  NULL, 'INDEPENDENT', 7),
(10, NULL, 'INDEPENDENT', 2),
(11, 4,   'JOINED', 10);

-- 5. INSERT 150 PROPERTIES (photos = Cloudinary URLs only; '[]' if none uploaded)
DO $$
DECLARE
    pin_map JSON := '{"380001":{"area":"AHMEDABAD GPO","city":"ahmedabad","coord":[23.016317896890477,72.57854605267556]},"380002":{"area":"RAILWAYPURA PO","city":"ahmedabad","coord":[23.02806476263094,72.59809402297704]},"380004":{"area":"SHAHIBAG PO","city":"ahmedabad","coord":[23.05030815048208,72.59976663393375]},"380005":{"area":"SABARMATI PO","city":"ahmedabad","coord":[23.105754012015655,72.60679310966077]},"380006":{"area":"ELLISBRIDGE PO","city":"ahmedabad","coord":[23.03245513832205,72.5504054837808]},"380007":{"area":"PALDI PO","city":"ahmedabad","coord":[22.99537171993967,72.53808952374334]},"380008":{"area":"MANINAGAR PO","city":"ahmedabad","coord":[23.00296212228197,72.61775256421187]},"380009":{"area":"NAVRANGPURA PO","city":"ahmedabad","coord":[23.03310143543225,72.55500034489948]},"380013":{"area":"NARANPURA VISTAR PO","city":"ahmedabad","coord":[23.075982178793208,72.56825261985591]},"380014":{"area":"NAVJIVAN PO","city":"ahmedabad","coord":[23.049400107114337,72.56330519064943]},"380015":{"area":"MANEKBAUG PO","city":"ahmedabad","coord":[23.03359457469985,72.51921873404577]},"380016":{"area":"CIVIL HOSPITAL PO","city":"ahmedabad","coord":[23.059954158606512,72.62360520327225]},"380018":{"area":"SARASPUR PO","city":"ahmedabad","coord":[23.031445623205116,72.60218587604565]},"380019":{"area":"RAILWAY COLONY PO","city":"ahmedabad","coord":[23.108642477611937,72.57591042347975]},"380021":{"area":"RAJPUR-GOMTIPUR PO","city":"ahmedabad","coord":[23.003961829681156,72.62215529904749]},"380022":{"area":"BEHRAMPURA PO","city":"ahmedabad","coord":[23.013624901293877,72.57832908707655]},"380023":{"area":"RAKHIYAL UDHYOG VISTAR PO","city":"ahmedabad","coord":[23.024009549477732,72.62482531485406]},"380024":{"area":"I.E. BAPUNAGAR PO","city":"ahmedabad","coord":[23.02570217794292,72.62488827148414]},"380026":{"area":"AMRAIWADI PO","city":"ahmedabad","coord":[23.011424443068634,72.63100005923265]},"380027":{"area":"GANDHI ASHRAM PO","city":"ahmedabad","coord":[23.06271870167087,72.58566487521375]},"380028":{"area":"SHAH ALAM ROZA PO","city":"ahmedabad","coord":[22.996048887010037,72.59645768778809]},"380050":{"area":"GHODASAR PO","city":"ahmedabad","coord":[22.978200647908302,72.60865490851128]},"380051":{"area":"JIVRAJ PARK PO","city":"ahmedabad","coord":[23.009921706017924,72.53747574443555]},"380052":{"area":"MEMNAGAR PO","city":"ahmedabad","coord":[23.058791946664805,72.53596504402898]},"380054":{"area":"BODAKDEV PO","city":"ahmedabad","coord":[23.063860230958266,72.52461642582207]},"380055":{"area":"JUHAPURA PO","city":"ahmedabad","coord":[22.99537171993967,72.53808952374334]},"380058":{"area":"BOPAL PO","city":"ahmedabad","coord":[23.043076742318988,72.46282249961043]},"380059":{"area":"THALTEJ PO","city":"ahmedabad","coord":[23.043611845639894,72.5143073739946]},"380060":{"area":"GUJARAT HIGH COURT SO","city":"ahmedabad","coord":[23.066024456325227,72.52219534485883]},"380061":{"area":"GHATLODIA PO","city":"ahmedabad","coord":[23.070093553820445,72.55707750944948]},"380063":{"area":"SOLA HBC PO","city":"ahmedabad","coord":[23.057991434103677,72.53764751938587]},"382210":{"area":"SARKHEJ PO","city":"ahmedabad","coord":[22.990009545371013,72.50414381780207]},"382330":{"area":"NARODA I.E. PO","city":"ahmedabad","coord":[23.091542381781764,72.66233979924706]},"382340":{"area":"KUBERNAGAR PO","city":"ahmedabad","coord":[23.067489217859038,72.63827976913991]},"382345":{"area":"SAIJPUR BOGHA PO","city":"ahmedabad","coord":[23.067471852485767,72.63829358702563]},"382350":{"area":"T B NAGAR PO","city":"ahmedabad","coord":[23.030645718594347,72.648564188264]},"382405":{"area":"NAROL PO","city":"ahmedabad","coord":[22.995644183812367,72.56835305689455]},"382415":{"area":"ODHAV I.E. PO","city":"ahmedabad","coord":[23.004905446162816,72.6370714946586]},"382418":{"area":"VASTRAL PO","city":"ahmedabad","coord":[22.99067514947997,72.65249425385164]},"382424":{"area":"CHANDKHEDA SOCIETY AREA PO","city":"ahmedabad","coord":[23.103047192965665,72.5769874199621]},"382430":{"area":"KATHWADA PO","city":"ahmedabad","coord":[23.067272714612233,72.68709536792926]},"382440":{"area":"VATVA PO","city":"ahmedabad","coord":[22.960836827311923,72.61951107746597]},"382443":{"area":"ISANPUR PO","city":"ahmedabad","coord":[22.978652231720744,72.6083870865891]},"382445":{"area":"VATVA INDUSTRIAL ESTATE PO","city":"ahmedabad","coord":[22.984537737784564,72.62676127771616]},"382449":{"area":"JANTANAGAR PO","city":"ahmedabad","coord":[22.98956364688538,72.64031333395758]},"382470":{"area":"DIGVIJAYNAGAR PO","city":"ahmedabad","coord":[23.12648903981951,72.56806821010113]},"382475":{"area":"SARDANAGAR PO","city":"ahmedabad","coord":[23.09324968136028,72.64952924567882]},"382480":{"area":"RANIP PO","city":"ahmedabad","coord":[23.08875409490448,72.55973584805572]},"382481":{"area":"CHANDLODIA SO","city":"ahmedabad","coord":[23.08482948744933,72.5314313366216]},"400001":{"area":"MUMBAI GPO","city":"mumbai","coord":[18.948836375917715,72.83934396949242]},"400002":{"area":"kalbadevi","city":"mumbai","coord":[18.94753413416966,72.83328908283063]},"400003":{"area":"Mandvi","city":"mumbai","coord":[18.961832742256945,72.8327047916204]},"400004":{"area":"girgaon","city":"mumbai","coord":[18.954392175839832,72.83058746968226]},"400005":{"area":"COLABA POST OFFICE","city":"mumbai","coord":[18.91132386649651,72.81198767026488]},"400006":{"area":"MALABARHILL","city":"mumbai","coord":[18.95947577897284,72.80818407668947]},"400007":{"area":"GRANT ROAD","city":"mumbai","coord":[18.953476544948447,72.8159032244674]},"400008":{"area":"Mumbai Central HO","city":"mumbai","coord":[18.97486646611863,72.82128827964266]},"400009":{"area":"chinchbunder HO","city":"mumbai","coord":[18.96429981972982,72.83816461896663]},"400010":{"area":"MAZGAON DELY PO","city":"mumbai","coord":[18.980080523315415,72.84076865082064]},"400011":{"area":"JACOB CIRCLE","city":"mumbai","coord":[18.99170826525476,72.83238700180885]},"400012":{"area":"PAREL MDG","city":"mumbai","coord":[19.00714046013035,72.83892082436604]},"400013":{"area":"DELISLE ROAD","city":"mumbai","coord":[19.008869577100292,72.83689840943767]},"400014":{"area":"DADAR HO","city":"mumbai","coord":[19.023861135006875,72.84757806303227]},"400015":{"area":"SEWRI","city":"mumbai","coord":[19.009036106555268,72.86372712181068]},"400016":{"area":"MAHIM HEAD POST OFFOCE","city":"mumbai","coord":[19.048131254138685,72.84314164227183]},"400017":{"area":"DHARAVI PO","city":"mumbai","coord":[19.05284467611001,72.86164109987196]},"400018":{"area":"WORLI MDG","city":"mumbai","coord":[19.006297627435046,72.82002451263297]},"400019":{"area":"MATUNGA","city":"mumbai","coord":[19.03772268427288,72.85417899962265]},"400020":{"area":"MARINE LINES POST OFFICE","city":"mumbai","coord":[18.942765131713355,72.8292928123049]},"400021":{"area":"NARIMAN POINT POST OFFICE","city":"mumbai","coord":[18.929006387469553,72.82318518465449]},"400022":{"area":"SION","city":"mumbai","coord":[19.056635738940916,72.8754616481788]},"400024":{"area":"NEHRU NAGAR POST OFFICE","city":"mumbai","coord":[19.067917863934316,72.8882176443649]},"400025":{"area":"PRABHADEVI","city":"mumbai","coord":[19.01995222789826,72.82971750343187]},"400026":{"area":"CUMBALLA HILL","city":"mumbai","coord":[18.98331241037175,72.80903365926773]},"400027":{"area":"VJB UDYAN PO","city":"mumbai","coord":[18.98471875335287,72.83570807790582]},"400028":{"area":"BHAWANI SHANKAR PO","city":"mumbai","coord":[19.029579462496837,72.83904742483736]},"400029":{"area":"Santacrus P & T Colony","city":"mumbai","coord":[19.08509054910253,72.85926061287807]},"400030":{"area":"WORLI COLONY PO","city":"mumbai","coord":[19.01903378452009,72.819213204574]},"400031":{"area":"WADALA PO","city":"mumbai","coord":[19.023160893054783,72.86118503149042]},"400032":{"area":"MANTARALAYA","city":"mumbai","coord":[18.932548581190993,72.83019523378817]},"400033":{"area":"TANK ROAD","city":"mumbai","coord":[18.996331032689202,72.84705720096593]},"400034":{"area":"Tulsiwadi","city":"mumbai","coord":[18.990888978472626,72.82117414239761]},"400035":{"area":"Rajbhavan","city":"mumbai","coord":[18.94872196408182,72.80112233310442]},"400037":{"area":"AMTOP HILL PO","city":"mumbai","coord":[19.04288064364305,72.87930440919892]},"400042":{"area":"BHANDUP EAST","city":"mumbai","coord":[19.124672024782736,72.93878882610392]},"400043":{"area":"SHIVAJI NAGAR","city":"mumbai","coord":[19.048095970327232,72.9286522005053]},"400049":{"area":"Juhu PO","city":"mumbai","coord":[19.119268771481806,72.82469356381432]},"400050":{"area":"Bandra West S.O.","city":"mumbai","coord":[19.070079830463783,72.82692103088444]},"400051":{"area":"Bandra East P.O.","city":"mumbai","coord":[19.07432447291872,72.84783350347489]},"400052":{"area":"Khar Delivery S.O.","city":"mumbai","coord":[19.081631767699612,72.82336250670168]},"400053":{"area":"Azadnagar PO","city":"mumbai","coord":[19.157727126148114,72.81916620112507]},"400054":{"area":"Santacruz West S.O.","city":"mumbai","coord":[19.09381485948553,72.84044074238574]},"400055":{"area":"Santacruz East P.O.","city":"mumbai","coord":[19.087835165788956,72.84373327990446]},"400056":{"area":"Vile Parle West S.O.","city":"mumbai","coord":[19.11226338950384,72.83002387385952]},"400057":{"area":"Vile Parle East S.O","city":"mumbai","coord":[19.110286032235855,72.8505703925662]},"400058":{"area":"Andheri R.S.PO","city":"mumbai","coord":[19.137690185973845,72.83912059441388]},"400059":{"area":"J.B.Nagar S.O.","city":"mumbai","coord":[19.127729453727365,72.8864042952509]},"400060":{"area":"Jogeshwari East","city":"mumbai","coord":[19.128460933055294,72.8542323739236]},"400061":{"area":"Versova P.O.","city":"mumbai","coord":[19.174331441548333,72.79314645220816]},"400063":{"area":"GOREGAON EAST","city":"mumbai","coord":[19.177806168902624,72.85856454699197]},"400064":{"area":"MALAD WEST","city":"mumbai","coord":[19.200716922330624,72.83709094086095]},"400065":{"area":"A M Colony","city":"mumbai","coord":[19.17641115385536,72.88107224606736]},"400066":{"area":"BORIVALI EAST","city":"mumbai","coord":[19.242349580761143,72.86552113468817]},"400067":{"area":"KANDIVALI WEST","city":"mumbai","coord":[19.222877414258676,72.8296002903553]},"400068":{"area":"DAHISAR","city":"mumbai","coord":[19.263728477608584,72.85929501206523]},"400069":{"area":"Andhri East P.O.","city":"mumbai","coord":[19.128599183730543,72.85506764184778]},"400070":{"area":"KURLA POST OFFICE","city":"mumbai","coord":[19.093123280409433,72.88947393200154]},"400071":{"area":"CHEMBUR HO","city":"mumbai","coord":[19.050036219827852,72.89499247413303]},"400072":{"area":"SAKINAKA POST OFFICE","city":"mumbai","coord":[19.12287647710201,72.89478269775128]},"400074":{"area":"FCI","city":"mumbai","coord":[19.050555407156907,72.89374059183456]},"400075":{"area":"PANT NAGAR","city":"mumbai","coord":[19.075064890546184,72.92175798643254]},"400076":{"area":"IIT POWAI","city":"mumbai","coord":[19.139842792445698,72.9167353035581]},"400077":{"area":"RAJAWADI PO","city":"mumbai","coord":[19.0843850423431,72.9111643716792]},"400078":{"area":"BHANDUP WEST","city":"mumbai","coord":[19.163420023865395,72.93959557341617]},"400079":{"area":"VIKHROLI","city":"mumbai","coord":[19.11500640369187,72.91844010833798]},"400080":{"area":"MULUND WEST","city":"mumbai","coord":[19.186619069304687,72.94167633122733]},"400081":{"area":"MULUND EAST","city":"mumbai","coord":[19.174409423629104,72.96674263794607]},"400082":{"area":"BHANDUP COMPLEX PO","city":"mumbai","coord":[19.178905744113308,72.94098274648803]},"400083":{"area":"TAGORE NAGAR","city":"mumbai","coord":[19.12247757513683,72.9378789486038]},"400084":{"area":"BARVE NAGAR POST OFFICE","city":"mumbai","coord":[19.10309332923991,72.89595598464891]},"400085":{"area":"BARC","city":"mumbai","coord":[19.025705628595237,72.93669646385594]},"400086":{"area":"GHATKOPAR WEST","city":"mumbai","coord":[19.104634569521888,72.90890175892197]},"400087":{"area":"NITIE","city":"mumbai","coord":[19.148894855740444,72.89385676735698]},"400088":{"area":"T F DEONAR PO","city":"mumbai","coord":[19.048095970327232,72.9286522005053]},"400089":{"area":"TILAK NAGAR","city":"mumbai","coord":[19.076455070009377,72.895642410631]},"400091":{"area":"BORIVALI HO","city":"mumbai","coord":[19.259303969012727,72.80268127843163]},"400092":{"area":"BORIVALI WEST","city":"mumbai","coord":[19.237971375462525,72.85140187678641]},"400093":{"area":"Chakala MIDC S.O.","city":"mumbai","coord":[19.13757317491364,72.87265808792375]},"400094":{"area":"ANU SHAKTI NAGAR","city":"mumbai","coord":[19.043980639201493,72.92020480828944]},"400095":{"area":"KHARODI","city":"mumbai","coord":[19.198620541438814,72.80012014472568]},"400096":{"area":"Seepz","city":"mumbai","coord":[19.12989679716023,72.8777643841882]},"400097":{"area":"MALAD EAST","city":"mumbai","coord":[19.19894153144976,72.85406792653104]},"400098":{"area":"Vidyanagari P.O","city":"mumbai","coord":[19.07868439207814,72.8610260224986]},"400099":{"area":"Sahar PO.","city":"mumbai","coord":[19.11491324102029,72.85881802192073]},"400101":{"area":"KANDIVALI EAST","city":"mumbai","coord":[19.21816473854554,72.87502227319017]},"400102":{"area":"JOGESHWARI WEST","city":"mumbai","coord":[19.151959611834133,72.83576608302204]},"400103":{"area":"MANDPESHWAR","city":"mumbai","coord":[19.256375505488826,72.84589424379573]},"400104":{"area":"MOTILALNAGAR","city":"mumbai","coord":[19.174449714526098,72.84305680537639]},"560001":{"area":"Bangalore GPO","city":"bangalore","coord":[12.97802878386515,77.60651586740833]},"560002":{"area":"Bangalore City MDG (Good)","city":"bangalore","coord":[12.956901595071354,77.57505988719277]},"560003":{"area":"MALLESHWARAM GOOD","city":"bangalore","coord":[13.003458485699555,77.58404920517174]},"560004":{"area":"Basavanagudi HO","city":"bangalore","coord":[12.957254503515536,77.57130891063848]},"560005":{"area":"FRAZER TOWN","city":"bangalore","coord":[13.000635994052962,77.62651420897578]},"560006":{"area":"JC NAGAR","city":"bangalore","coord":[13.02095205110948,77.60093224862268]},"560007":{"area":"agram","city":"bangalore","coord":[12.96842226008892,77.62341575337253]},"560008":{"area":"HAL II STAGE HO","city":"bangalore","coord":[12.984599696911639,77.63223309158532]},"560009":{"area":"KG Road PO (Good)","city":"bangalore","coord":[12.980524289767658,77.57735606909387]},"560010":{"area":"Rajajinagar Ho new Good","city":"bangalore","coord":[12.992385972783282,77.55687131764783]},"560011":{"area":"Jay nagar 3rd block","city":"bangalore","coord":[12.942843436193053,77.59317025390061]},"560012":{"area":"SCIENCE INSTITUTE PO","city":"bangalore","coord":[13.014011626523713,77.57273022058942]},"560013":{"area":"JALAHALLI HO","city":"bangalore","coord":[13.063637449653456,77.55381041791163]},"560014":{"area":"JALAHALLI EAST PO","city":"bangalore","coord":[13.059118632961958,77.54562391531893]},"560015":{"area":"JALAHALLI WEST PO","city":"bangalore","coord":[13.06647655696147,77.5188911511031]},"560016":{"area":"Doorvani Nagar","city":"bangalore","coord":[12.988586322356584,77.67995142340796]},"560017":{"area":"VIMANAPURA","city":"bangalore","coord":[12.970881713872489,77.6760300966314]},"560018":{"area":"Chamarajpet Good","city":"bangalore","coord":[12.96421862193843,77.55612052190303]},"560019":{"area":"Gavipuram Extension","city":"bangalore","coord":[12.954972644636616,77.56627158791984]},"560020":{"area":"SESHADRIPURAM GOOD","city":"bangalore","coord":[12.995366649396242,77.58648903217835]},"560021":{"area":"Srirampura GOOD","city":"bangalore","coord":[12.982148018911694,77.56717075660347]},"560022":{"area":"YESHWANTHPUR PO","city":"bangalore","coord":[13.039022492899774,77.54316236974368]},"560023":{"area":"Magadi Road SO (Good)","city":"bangalore","coord":[12.981977100646107,77.57083385187185]},"560024":{"area":"H A FORM POST OFFICE","city":"bangalore","coord":[13.06426720886105,77.60932852400394]},"560025":{"area":"MUSEUM ROAD S.O.","city":"bangalore","coord":[12.972839265095784,77.60458526748849]},"560026":{"area":"Govt Electric Factory PO","city":"bangalore","coord":[12.966535703086874,77.5557901251348]},"560027":{"area":"Wilson garden","city":"bangalore","coord":[12.966812011903338,77.59461049674452]},"560029":{"area":"DR College","city":"bangalore","coord":[12.94136486301361,77.59931280445605]},"560030":{"area":"Aduogdi PO","city":"bangalore","coord":[12.949483432623895,77.6084210378191]},"560032":{"area":"RT NAGAR","city":"bangalore","coord":[13.042389783082202,77.6034555650518]},"560033":{"area":"maruthisevanagar","city":"bangalore","coord":[13.000635994052962,77.62651420897578]},"560034":{"area":"Koramangala po","city":"bangalore","coord":[12.934317220999016,77.62373117971656]},"560035":{"area":"Carmelram PO","city":"bangalore","coord":[12.92075491106316,77.67761757155372]},"560036":{"area":"krishnarajapuram po","city":"bangalore","coord":[13.024742623526501,77.69229150410911]},"560037":{"area":"marathahalli colony","city":"bangalore","coord":[12.974375613061957,77.70599986271841]},"560038":{"area":"indiranagar","city":"bangalore","coord":[12.991890828322566,77.63719556038629]},"560039":{"area":"Nayandahalli","city":"bangalore","coord":[12.936722811065271,77.51295175724415]},"560040":{"area":"Vijayanagar MDG (Good)","city":"bangalore","coord":[12.975819252660148,77.54521513245732]},"560041":{"area":"good jayanagar ho","city":"bangalore","coord":[12.926482191552358,77.5881124711531]},"560042":{"area":"Sivan Chetty Gargens","city":"bangalore","coord":[12.97615365159722,77.61182272872965]},"560043":{"area":"KALYAN NAGARA PO","city":"bangalore","coord":[13.02437842717105,77.63123564271801]},"560045":{"area":"ARBIC COLLEGE POST OFFICE","city":"bangalore","coord":[13.04123941616762,77.61598784569787]},"560046":{"area":"BENSON TOWN SO","city":"bangalore","coord":[12.994733268818262,77.59592394867425]},"560047":{"area":"viveknagar","city":"bangalore","coord":[12.966472244651523,77.61670418655997]},"560048":{"area":"MAHADEVAPURAM PO","city":"bangalore","coord":[13.000735107414608,77.70138973832472]},"560049":{"area":"VIRGO NAGAR","city":"bangalore","coord":[13.091542742849514,77.77898452912412]},"560050":{"area":"BSK 1st stage","city":"bangalore","coord":[12.945441736069087,77.5593045546135]},"560051":{"area":"H K P Road","city":"bangalore","coord":[12.993671967066994,77.60694327863399]},"560053":{"area":"Chickpet po","city":"bangalore","coord":[12.966970613098896,77.56728383203989]},"560054":{"area":"MSRIT POST OFFICE","city":"bangalore","coord":[13.027565644144325,77.57154355957384]},"560055":{"area":"MALLESHWARAM WEST PO GOOD","city":"bangalore","coord":[13.005746953327046,77.56245236186186]},"560056":{"area":"Bangalore Vishwavidyalaya","city":"bangalore","coord":[12.934020967613206,77.50060869233964]},"560057":{"area":"DASARAHALLI PO","city":"bangalore","coord":[13.066223836146634,77.51023922866675]},"560058":{"area":"PEENYA SMALL INDUSTRIES PO","city":"bangalore","coord":[13.039020655077012,77.53572140505639]},"560059":{"area":"RVV PO","city":"bangalore","coord":[12.913461438122457,77.49467890416602]},"560060":{"area":"Kengeri po","city":"bangalore","coord":[12.870154142398686,77.52358202775264]},"560061":{"area":"subramanyapura","city":"bangalore","coord":[12.892376523386842,77.55945907921542]},"560062":{"area":"D K Sandra PO","city":"bangalore","coord":[12.859805603136733,77.52238804187424]},"560063":{"area":"AIR FORCE STATION YELAHANKA","city":"bangalore","coord":[13.127938653481586,77.59727940403003]},"560064":{"area":"YELAHANKA POST OFFICE","city":"bangalore","coord":[13.114601953240555,77.60955010514687]},"560065":{"area":"G K V K POST OFFICE","city":"bangalore","coord":[13.065981465262034,77.5802394967642]},"560066":{"area":"WHITE FIELD SO","city":"bangalore","coord":[12.993406628665984,77.74495913453232]},"560067":{"area":"Kadugodi","city":"bangalore","coord":[13.042562951700717,77.7682038303314]},"560068":{"area":"Bommanahalli PO","city":"bangalore","coord":[12.925267979234784,77.61959679950408]},"560070":{"area":"BSK II stage (good)","city":"bangalore","coord":[12.918705680570707,77.55200978355221]},"560071":{"area":"domlur","city":"bangalore","coord":[12.969100673542844,77.63601058461016]},"560072":{"area":"Nagarbhavi SO (Good)","city":"bangalore","coord":[12.9878058376947,77.51774033376569]},"560073":{"area":"NAGASANDRA","city":"bangalore","coord":[13.056606743861721,77.50729499313653]},"560074":{"area":"kumbalagodu po","city":"bangalore","coord":[12.810690692796827,77.43945947622758]},"560075":{"area":"NEW THIPPASANDRA","city":"bangalore","coord":[12.978908185832955,77.67558057517164]},"560076":{"area":"Bannerghatta Road","city":"bangalore","coord":[12.86142499840186,77.6024658803235]},"560077":{"area":"SHIVARAM KARANTH NAGAR PO","city":"bangalore","coord":[13.089752830122544,77.71056662992494]},"560078":{"area":"J P Nagar PO","city":"bangalore","coord":[12.916703713951833,77.57303479528484]},"560079":{"area":"Basaveswarnagar MDG (Good)","city":"bangalore","coord":[12.998204467038823,77.5432586305146]},"560080":{"area":"SADASHIVANAGAR SO","city":"bangalore","coord":[13.009117080097626,77.57286251188808]},"560082":{"area":"Udayapura SO","city":"bangalore","coord":[12.818672647553905,77.46898612763947]},"560083":{"area":"Bannerghatta PO","city":"bangalore","coord":[12.853908006124307,77.60120951902503]},"560084":{"area":"St.Thomas Town S.O","city":"bangalore","coord":[13.021046378540019,77.62654367641206]},"560085":{"area":"Banashankari III stage PO","city":"bangalore","coord":[12.935643247238225,77.55175414817516]},"560086":{"area":"Mahalakshmipuram SO Good","city":"bangalore","coord":[12.997596850280345,77.54953081605034]},"560087":{"area":"VARTHUR","city":"bangalore","coord":[12.967523252219662,77.78506605532566]},"560088":{"area":"HESARAGHATTA","city":"bangalore","coord":[13.132692336060531,77.48444726825137]},"560089":{"area":"HESARAGHATTA LAKE","city":"bangalore","coord":[13.213873898727213,77.51283620155927]},"560090":{"area":"CHIKKABANAVARA","city":"bangalore","coord":[13.07056767809981,77.53782181890425]},"560091":{"area":"Viswaneedam SO (Good)","city":"bangalore","coord":[13.007637530267827,77.4772264977082]},"560092":{"area":"sahakara nagar post office","city":"bangalore","coord":[13.073442245988677,77.59306355919769]},"560093":{"area":"C V RAMAN NAGAR PO","city":"bangalore","coord":[12.988636614537738,77.67130351733921]},"560094":{"area":"R M V IIND STAGE EXTN. SO","city":"bangalore","coord":[13.014748000724378,77.57425723529988]},"560095":{"area":"good koramangla VI Bk 560095","city":"bangalore","coord":[12.945926969726143,77.61838202391502]},"560096":{"area":"NANDINI LAYOUT GOOD","city":"bangalore","coord":[13.012650344778933,77.54673777237231]},"560097":{"area":"VIDYARANYAPURA PO","city":"bangalore","coord":[13.060061148449783,77.55493393993919]},"560098":{"area":"Rajarajeshwari Nagar PO","city":"bangalore","coord":[12.934019562397738,77.51504686474365]},"560099":{"area":"Bommasandra Industrial area","city":"bangalore","coord":[12.866635283905614,77.7251153364314]},"560100":{"area":"ELECTRONIC CITY PO","city":"bangalore","coord":[12.888502142496629,77.67298122264194]},"560102":{"area":"HSR Layout","city":"bangalore","coord":[12.925164118329507,77.65465550101436]},"560103":{"area":"BELLANDUR POST OFFICE","city":"bangalore","coord":[12.949505842887266,77.72219058895293]},"560104":{"area":"Hampinagar SO (Good)","city":"bangalore","coord":[12.955096214381719,77.5367265300278]},"560105":{"area":"Jigani SO","city":"bangalore","coord":[12.836552708941282,77.65042682554483]},"560107":{"area":"Achitnagar","city":"bangalore","coord":[13.070443536739058,77.48719653612727]},"560108":{"area":"Anjanapura SO","city":"bangalore","coord":[12.880680180656274,77.56843354534782]},"560300":{"area":"BIAL SO","city":"bangalore","coord":[13.19829202492506,77.68010365371265]}}';
    pin_data JSON;
    real_area TEXT;
    cities       TEXT[] := ARRAY['Mumbai', 'Ahmedabad', 'Bangalore'];
    mumbai_pins  TEXT[] := ARRAY['400001','400002','400013','400025','400037','400050','400064','400076','400093','400101'];
    ahm_pins     TEXT[] := ARRAY['380001','380006','380009','380013','380015','380024','380052','380054','380058','380059'];
    blr_pins     TEXT[] := ARRAY['560001','560004','560011','560025','560034','560047','560066','560078','560095','560100'];

    -- Index 1..150: JSON array of Cloudinary URLs (only successful uploads)
    prop_images TEXT[] := ARRAY[${propImagesLiteral}];

    amenities      TEXT[] := ARRAY['Gym', 'Swimming Pool', 'Club House', '24x7 Security', 'Covered Parking', 'Intercom', 'Power Backup', 'Landscaped Garden', 'Jogging Track', 'Childrens Play Area'];
    building_names TEXT[] := ARRAY['Skyline Heights', 'Marigold Residency', 'Silver Oak Estates', 'Emerald Tower', 'Phoenix Bay', 'Imperial Square', 'Zenith Park', 'Trishul Residency', 'Ocean Breeze', 'Grand Crest'];

    city        TEXT;
    pins        TEXT[];
    pin         TEXT;
    agent_id    INT;
    bhk         INT;
    price       DOUBLE PRECISION;
    area        DOUBLE PRECISION;
    prop_type   TEXT;
    purpose     TEXT;
    amenity_str TEXT;
    lat         DOUBLE PRECISION;
    lng         DOUBLE PRECISION;
    base_lat    DOUBLE PRECISION;
    base_lng    DOUBLE PRECISION;
    prop_num    INT;
    i           INT;
    j           INT;
BEGIN
    FOR i IN 1..3 LOOP
        city := cities[i];

        IF    city = 'Mumbai'    THEN pins := mumbai_pins; base_lat := 19.0760; base_lng := 72.8777;
        ELSIF city = 'Ahmedabad' THEN pins := ahm_pins;    base_lat := 23.0225; base_lng := 72.5714;
        ELSE                          pins := blr_pins;    base_lat := 12.9716; base_lng := 77.5946;
        END IF;

        FOR j IN 1..50 LOOP
            prop_num := (i - 1) * 50 + j;
            pin      := pins[(j % 10) + 1];
            agent_id := (j % 10) + 2;

            IF (j % 5) = 1 THEN
                prop_type := 'Projects';
            ELSE
                prop_type := (ARRAY['Apartment', 'Villa', 'Penthouse', 'Bungalow'])[floor(random()*4)+1];
            END IF;

            purpose := CASE WHEN random() > 0.3 THEN 'Sale' ELSE 'Rent' END;

            bhk  := floor(random()*3) + 1;
            area := ROUND(cast(bhk * (random() * 300 + 400) as numeric), 0);

            IF    city = 'Mumbai'    THEN price := area * (random() * 8000 + 8000);
            ELSIF city = 'Bangalore' THEN price := area * (random() * 4000  + 4000);
            ELSE                          price := area * (random() * 2500  + 3500);
            END IF;

            price := ROUND(cast(price as numeric), 0);

            IF purpose = 'Rent' THEN
                price := ROUND(cast(price / (12 * 25) as numeric), 0); -- Simple rent ratio approx 25 years payback
            END IF;

            amenity_str := (
                SELECT string_agg(val, ', ')
                FROM (SELECT unnest(amenities) ORDER BY random() LIMIT 5) t(val)
            );
            
            -- We leave lat and lng as NULL so that the frontend MapModal automatically
            -- places the pins exactly on top of the GeoJSON polygon corresponding to the pin_code.
            
            -- Use realistic geojson coordinates and area names
            pin_data := pin_map->pin;
            IF pin_data IS NOT NULL THEN
                lat := (pin_data->>'coord')::json->>0;
                lat := lat::DOUBLE PRECISION + (random() - 0.5) * 0.005;
                lng := (pin_data->>'coord')::json->>1;
                lng := lng::DOUBLE PRECISION + (random() - 0.5) * 0.005;
                real_area := pin_data->>'area';
            ELSE
                lat := base_lat + (random() - 0.5) * 0.05;
                lng := base_lng + (random() - 0.5) * 0.05;
                real_area := 'Sector ' || (j % 10);
            END IF;

            INSERT INTO property (
                title, description, price, area, type, purpose,
                city, location, address, pin_code,
                property_images, bhk, bathrooms, balconies,
                floor, total_floors,
                facing, furnishing, age,
                amenities, agent_id, featured, sold,
                latitude, longitude, listed_date, active,
                views, favorites, inquiries
            ) VALUES (
                building_names[(j % 10) + 1] || (CASE WHEN prop_type = 'Projects' THEN ' Mega Project' WHEN prop_type = 'Villa' THEN ' Villa' WHEN prop_type = 'Apartment' THEN ' Residency' ELSE ' Estate' END),
                'Luxury ' || bhk || ' BHK ' || prop_type || ' at ' || building_names[(j%10)+1] || '. Features modern ' || amenity_str || '.',
                price, area, prop_type, purpose,
                city, real_area,
                'Flat ' || (100 + j) || ', ' || building_names[(j % 10) + 1] || ', ' || city || ' ' || pin,
                pin,
                prop_images[prop_num],
                bhk, bhk, (bhk % 2) + 1,
                (floor(random()*20)+1)::TEXT, (floor(random()*30)+1)::TEXT,
                'East', 'Semi-Furnished', '0-1 Years',
                amenity_str, agent_id,
                (random() > 0.8), false,
                lat, lng,
                NOW() - (random() * 30 || ' days')::interval,
                true,
                floor(random()*500)::INT, floor(random()*50)::INT, floor(random()*10)::INT
            );
        END LOOP;
    END LOOP;
END $$;

-- 6. PROMOTE ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'realestateddu@gmail.com';
`;

fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
console.log(`\n✅  SQL generated → industrial_seed_150_cloudinary.sql`);
console.log(`   Lines : ${sql.split('\n').length}`);
console.log(`   Size  : ${(Buffer.byteLength(sql, 'utf8') / 1024).toFixed(1)} KB`);
console.log('\n👉  Run the SQL in pgAdmin or psql to seed your database!\n');
