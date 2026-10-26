// Hand-curated destination spec. This is Roamly's editorial layer: which
// places to include, how we tag them, and planning estimates. Hard facts
// (coordinates, photos, licences, descriptions) are NOT written here. They
// are fetched from Wikipedia/Wikimedia Commons by build-destinations.js, so
// every place and attraction links back to a source.
//
// Field notes:
//   roadKm      approximate road distance from central Bengaluru (estimate, shown with ≈)
//   crowd       1 = rarely crowded ... 5 = very busy on weekends (our curation)
//   costTier    low | mid | high: drives stay/food estimates in the finder
//   busFromBlr  regular direct public/state bus from Bengaluru to the town or nearest base
//   remote      limited phone signal / few services nearby
//   minutes     suggested time at an attraction (estimate)
//   imageFrom   take the lead photo from another article (when the town's own is a collage)
//   imageFile   a specific Commons file, when the article has no free lead photo
//   parent      the attraction is described inside the town's article, not its own:
//               we link to it but don't borrow its description, and mark the position approximate
//   hours       only filled where commonly published; null means unverified

export const destinations = [
  {
    wiki: 'Nandi Hills, India', name: 'Nandi Hills', region: 'Chikkaballapur, Karnataka',
    roadKm: 60, crowd: 5, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['hills', 'sunrise', 'cycling'],
    attractions: [
      { wiki: 'Nandi Hills, India', parent: true, name: 'Nandi Hills viewpoint', minutes: 120, best: 'sunrise', hours: { open: '06:00', close: '18:00' } },
      { wiki: 'Bhoga Nandeeshwara Temple', minutes: 60 },
    ],
  },
  {
    wiki: 'Skandagiri', name: 'Skandagiri', region: 'Chikkaballapur, Karnataka',
    roadKm: 70, crowd: 4, costTier: 'low', busFromBlr: false, remote: false, idealDays: 1,
    interests: ['trekking', 'sunrise', 'hills'],
    attractions: [
      { wiki: 'Skandagiri', parent: true, name: 'Skandagiri night trek and summit', minutes: 240, best: 'sunrise' },
      { wiki: 'Bhoga Nandeeshwara Temple', minutes: 60 },
    ],
  },
  {
    wiki: 'Savandurga', name: 'Savandurga', region: 'Ramanagara, Karnataka',
    roadKm: 60, crowd: 3, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['trekking', 'hills'],
    attractions: [
      { wiki: 'Savandurga', parent: true, name: 'Savandurga monolith climb', minutes: 210, best: 'morning' },
      { wiki: 'Manchanabele', name: 'Manchanabele Dam', minutes: 60, best: 'sunset' },
    ],
  },
  {
    wiki: 'Lepakshi', name: 'Lepakshi', region: 'Sri Sathya Sai, Andhra Pradesh',
    roadKm: 120, crowd: 2, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['heritage', 'spiritual'],
    attractions: [
      { wiki: 'Veerabhadra Temple, Lepakshi', minutes: 90 },
      { wiki: 'Lepakshi', parent: true, name: 'Lepakshi Nandi (monolithic bull)', minutes: 20 },
    ],
  },
  {
    wiki: 'Shivanasamudra Falls', name: 'Shivanasamudra', region: 'Mandya, Karnataka',
    roadKm: 135, crowd: 3, costTier: 'low', busFromBlr: false, remote: false, idealDays: 1,
    interests: ['waterfalls', 'nature'],
    attractions: [
      { wiki: 'Shivanasamudra Falls', name: 'Gaganachukki and Bharachukki falls', minutes: 150, best: 'morning' },
      { wiki: 'Talakadu', minutes: 120 },
      { wiki: 'Somanathapura', name: 'Chennakesava Temple, Somanathapura', minutes: 75 },
    ],
  },
  {
    wiki: 'Melukote', name: 'Melukote', region: 'Mandya, Karnataka',
    roadKm: 150, crowd: 2, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['heritage', 'spiritual', 'hills'],
    attractions: [
      { wiki: 'Cheluvanarayana Swamy Temple', minutes: 75 },
      { wiki: 'Melukote', parent: true, name: 'Yoga Narasimha hill temple', minutes: 75, best: 'sunset' },
      { wiki: 'Melukote', parent: true, name: 'Raya Gopura and Kalyani', minutes: 45 },
    ],
  },
  {
    wiki: 'Mysore', name: 'Mysuru', imageFrom: 'Mysore Palace', region: 'Mysuru, Karnataka',
    roadKm: 145, crowd: 5, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['heritage', 'food', 'spiritual'],
    attractions: [
      { wiki: 'Mysore Palace', minutes: 120, hours: { open: '10:00', close: '17:30' } },
      { wiki: 'Chamundi Hills', minutes: 120, best: 'morning' },
      { wiki: 'Devaraja Market', minutes: 60 },
      { wiki: 'Srirangapatna', minutes: 150 },
      { wiki: 'Brindavan Gardens', minutes: 90, best: 'sunset' },
      { wiki: 'St. Philomena\'s Cathedral, Mysore', minutes: 40 },
    ],
  },
  {
    wiki: 'Shravanabelagola', name: 'Shravanabelagola', region: 'Hassan, Karnataka',
    roadKm: 150, crowd: 2, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['heritage', 'spiritual', 'trekking'],
    attractions: [
      { wiki: 'Gommateshwara statue', name: 'Gommateshwara on Vindhyagiri', minutes: 120, best: 'morning' },
      { wiki: 'Chandragiri Hill', name: 'Chandragiri hill', minutes: 75 },
    ],
  },
  {
    wiki: 'Horsley Hills', name: 'Horsley Hills', imageFile: 'Distant hills,horsley hills,AP - panoramio.jpg', region: 'Annamayya, Andhra Pradesh',
    roadKm: 150, crowd: 2, costTier: 'mid', busFromBlr: false, remote: false, idealDays: 2,
    interests: ['hills', 'nature'],
    attractions: [
      { wiki: 'Horsley Hills', parent: true, name: 'Horsley Hills viewpoints', minutes: 150, best: 'sunset' },
      { wiki: 'Horsley Hills', parent: true, name: 'Gali Bandalu', minutes: 45 },
    ],
  },
  {
    wiki: 'Biligiriranga Hills', name: 'BR Hills', region: 'Chamarajanagar, Karnataka',
    roadKm: 180, crowd: 1, costTier: 'mid', busFromBlr: false, remote: true, idealDays: 2,
    interests: ['wildlife', 'nature', 'hills'],
    attractions: [
      { wiki: 'Biligiriranga Hills', parent: true, name: 'BRT Tiger Reserve safari', minutes: 180, best: 'morning' },
      { wiki: 'Biligiriranga Hills', parent: true, name: 'Biligiri Ranganatha temple hilltop', minutes: 60, best: 'sunset' },
    ],
  },
  {
    wiki: 'Yercaud', name: 'Yercaud', region: 'Salem, Tamil Nadu',
    roadKm: 230, crowd: 3, costTier: 'mid', busFromBlr: false, remote: false, idealDays: 2,
    interests: ['hills', 'plantations', 'lakes'],
    attractions: [
      { wiki: 'Yercaud', parent: true, name: 'Yercaud Lake', minutes: 60 },
      { wiki: 'Shevaroy Hills', name: 'Shevaroyan temple viewpoint', minutes: 90, best: 'sunset' },
      { wiki: 'Kiliyur Falls', minutes: 120 },
    ],
  },
  {
    wiki: 'Kabini River', name: 'Kabini', region: 'Mysuru, Karnataka',
    roadKm: 210, crowd: 2, costTier: 'high', busFromBlr: false, remote: true, idealDays: 2,
    interests: ['wildlife', 'nature', 'lakes'],
    attractions: [
      { wiki: 'Nagarhole National Park', name: 'Nagarhole jeep safari', minutes: 180, best: 'morning' },
      { wiki: 'Kabini Dam', name: 'Kabini backwaters', minutes: 90, best: 'sunset' },
    ],
  },
  {
    wiki: 'Belur, Karnataka', name: 'Belur and Halebidu', region: 'Hassan, Karnataka',
    roadKm: 220, crowd: 2, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['heritage', 'spiritual'],
    attractions: [
      { wiki: 'Chennakeshava Temple, Belur', minutes: 90 },
      { wiki: 'Hoysaleswara Temple', name: 'Hoysaleswara Temple, Halebidu', minutes: 90 },
    ],
  },
  {
    wiki: 'Sakleshpur', name: 'Sakleshpur', region: 'Hassan, Karnataka',
    roadKm: 220, crowd: 2, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['plantations', 'trekking', 'hills'],
    attractions: [
      { wiki: 'Manjarabad Fort', minutes: 75 },
      { wiki: 'Bisle Reserve Forest', name: 'Bisle viewpoint', minutes: 90, best: 'morning' },
    ],
  },
  {
    wiki: 'Chitradurga', name: 'Chitradurga', region: 'Chitradurga, Karnataka',
    roadKm: 200, crowd: 2, costTier: 'low', busFromBlr: true, remote: false, idealDays: 1,
    interests: ['heritage', 'trekking'],
    attractions: [
      { wiki: 'Chitradurga Fort', minutes: 180, best: 'morning' },
      { wiki: 'Chandravalli', name: 'Chandravalli caves', minutes: 60 },
    ],
  },
  {
    wiki: 'Chikmagalur', name: 'Chikkamagaluru', region: 'Chikkamagaluru, Karnataka',
    roadKm: 245, crowd: 4, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['plantations', 'trekking', 'hills', 'waterfalls'],
    attractions: [
      { wiki: 'Mullayanagiri', minutes: 150, best: 'sunrise' },
      { wiki: 'Baba Budangiri', minutes: 90 },
      { wiki: 'Hebbe Falls', minutes: 180 },
      { wiki: 'Jhari Falls', minutes: 120 },
    ],
  },
  {
    wiki: 'Madikeri', name: 'Coorg (Madikeri)', region: 'Kodagu, Karnataka',
    roadKm: 250, crowd: 4, costTier: 'high', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['plantations', 'waterfalls', 'hills', 'trekking'],
    attractions: [
      { wiki: 'Abbey Falls', minutes: 60 },
      { wiki: "Raja's Seat", minutes: 60, best: 'sunset' },
      { wiki: 'Namdroling Monastery', minutes: 75 },
      { wiki: 'Dubare', name: 'Dubare elephant camp', minutes: 120, best: 'morning' },
      { wiki: 'Talakaveri', minutes: 120 },
      { wiki: 'Madikeri Fort', minutes: 45 },
    ],
  },
  {
    wiki: 'Ooty', name: 'Ooty', region: 'Nilgiris, Tamil Nadu',
    roadKm: 270, crowd: 5, costTier: 'high', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['hills', 'plantations', 'lakes'],
    attractions: [
      { wiki: 'Government Botanical Garden', name: 'Government Botanical Garden', minutes: 90 },
      { wiki: 'Doddabetta', minutes: 60, best: 'morning' },
      { wiki: 'Ooty Lake', minutes: 60 },
      { wiki: 'Pykara', name: 'Pykara falls and lake', minutes: 120 },
      { wiki: 'Nilgiri Mountain Railway', name: 'Nilgiri toy train to Coonoor', minutes: 150 },
    ],
  },
  {
    wiki: 'Wayanad district', name: 'Wayanad', region: 'Wayanad, Kerala',
    roadKm: 280, crowd: 3, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 3,
    interests: ['trekking', 'waterfalls', 'plantations', 'heritage'],
    attractions: [
      { wiki: 'Edakkal Caves', minutes: 120, best: 'morning' },
      { wiki: 'Chembra Peak', minutes: 300, best: 'morning' },
      { wiki: 'Banasura Sagar Dam', minutes: 90 },
      { wiki: 'Soochipara Falls', minutes: 120 },
      { wiki: 'Pookode Lake', minutes: 60 },
    ],
  },
  {
    wiki: 'Gandikota', name: 'Gandikota', region: 'YSR Kadapa, Andhra Pradesh',
    roadKm: 300, crowd: 2, costTier: 'low', busFromBlr: false, remote: true, idealDays: 2,
    interests: ['heritage', 'camping', 'nature'],
    attractions: [
      { wiki: 'Gandikota', parent: true, name: 'Gandikota gorge on the Penna', minutes: 120, best: 'sunrise' },
      { wiki: 'Madhavaraya Temple, Gandikota', name: 'Gandikota fort and Madhavaraya Temple', minutes: 120 },
      { wiki: 'Belum Caves', minutes: 120 },
    ],
  },
  {
    wiki: 'Pondicherry', name: 'Puducherry', region: 'Puducherry',
    roadKm: 310, crowd: 4, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 2,
    interests: ['beach', 'heritage', 'food'],
    attractions: [
      { wiki: 'Promenade Beach', minutes: 90, best: 'sunrise' },
      { wiki: 'Auroville', minutes: 180 },
      { wiki: 'Pondicherry', parent: true, name: 'White Town walk', minutes: 120 },
      { wiki: 'Sri Aurobindo Ashram', minutes: 45 },
    ],
  },
  {
    wiki: 'Kudremukh', name: 'Kudremukh', region: 'Chikkamagaluru, Karnataka',
    roadKm: 330, crowd: 2, costTier: 'mid', busFromBlr: false, remote: true, idealDays: 2,
    interests: ['trekking', 'hills', 'nature'],
    attractions: [
      { wiki: 'Kudremukha', name: 'Kudremukh peak trek (permit needed)', minutes: 420, best: 'morning' },
      { wiki: 'Hanuman Gundi Falls', minutes: 90 },
      { wiki: 'Kalasa', name: 'Kalasa', minutes: 60 },
    ],
  },
  {
    wiki: 'Hampi', name: 'Hampi', region: 'Vijayanagara, Karnataka',
    roadKm: 340, crowd: 4, costTier: 'low', busFromBlr: true, remote: false, idealDays: 3,
    interests: ['heritage', 'trekking', 'spiritual'],
    attractions: [
      { wiki: 'Virupaksha Temple, Hampi', minutes: 75 },
      { wiki: 'Hampi', parent: true, name: 'Vittala Temple and stone chariot', minutes: 120 },
      { wiki: 'Hampi', parent: true, name: 'Hemakuta Hill', minutes: 60, best: 'sunset' },
      { wiki: 'Lotus Mahal', name: 'Zenana enclosure and Lotus Mahal', minutes: 75 },
      { wiki: 'Matanga Hill', minutes: 120, best: 'sunrise' },
      { wiki: 'Hampi', parent: true, name: 'Hazara Rama Temple', minutes: 45 },
      { wiki: 'Anegundi', minutes: 120 },
    ],
  },
  {
    wiki: 'Agumbe', name: 'Agumbe', region: 'Shivamogga, Karnataka',
    roadKm: 350, crowd: 1, costTier: 'low', busFromBlr: true, remote: true, idealDays: 2,
    interests: ['nature', 'waterfalls', 'trekking'],
    attractions: [
      { wiki: 'Agumbe', parent: true, name: 'Agumbe sunset point', minutes: 60, best: 'sunset' },
      { wiki: 'Barkana Falls', minutes: 180 },
      { wiki: 'Kunchikal Falls', minutes: 90 },
      { wiki: 'Kundadri', minutes: 90, best: 'morning' },
    ],
  },
  {
    wiki: 'Dandeli', name: 'Dandeli', region: 'Uttara Kannada, Karnataka',
    roadKm: 460, crowd: 2, costTier: 'mid', busFromBlr: true, remote: true, idealDays: 3,
    interests: ['wildlife', 'adventure', 'nature'],
    attractions: [
      { wiki: 'Kali River (Karnataka)', name: 'Kali river rafting', minutes: 180, best: 'morning' },
      { wiki: 'Dandeli Wildlife Sanctuary', minutes: 180, best: 'morning' },
      { wiki: 'Dandeli', parent: true, name: 'Syntheri Rocks', minutes: 60 },
      { wiki: 'Dandeli', parent: true, name: 'Kavala Caves', minutes: 90 },
    ],
  },
  {
    wiki: 'Gokarna, Karnataka', name: 'Gokarna', region: 'Uttara Kannada, Karnataka',
    roadKm: 480, crowd: 4, costTier: 'mid', busFromBlr: true, remote: false, idealDays: 3,
    interests: ['beach', 'trekking', 'spiritual'],
    attractions: [
      { wiki: 'Gokarna, Karnataka', parent: true, name: 'Om Beach', minutes: 150 },
      { wiki: 'Mahabaleshwar Temple, Gokarna', minutes: 45 },
      { wiki: 'Gokarna, Karnataka', parent: true, name: 'Kudle Beach', minutes: 120, best: 'sunset' },
      { wiki: 'Gokarna, Karnataka', parent: true, name: 'Beach trek: Kudle to Paradise', minutes: 240, best: 'morning' },
      { wiki: 'Mirjan Fort', minutes: 60 },
    ],
  },
];
