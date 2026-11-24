// Contenu pédagogique de Lawhi (hors-ligne).
// c = caractère, n = nom, t = translittération, p = prononciation, j = se lie à la lettre suivante ?
window.LETTERS = [
  { c: "ا", n: "alif", t: "a / ā", p: "Support des voyelles. Seul, il allonge le son « a » (ā).", j: false, w: "Un trait vertical tracé de haut en bas." },
  { c: "ب", n: "bā'", t: "b", p: "Comme le « b » français.", j: true, w: "Une barque, un point en dessous." },
  { c: "ت", n: "tā'", t: "t", p: "Comme le « t » français.", j: true, w: "La même barque, deux points au-dessus." },
  { c: "ث", n: "thā'", t: "th", p: "Comme le « th » anglais de think : langue entre les dents.", j: true, w: "La barque, trois points au-dessus." },
  { c: "ج", n: "jīm", t: "j", p: "Comme « dj » dans djinn.", j: true, w: "Un crochet ouvert à gauche, un point au centre." },
  { c: "ح", n: "ḥā'", t: "ḥ", p: "Un « h » soufflé du milieu de la gorge, comme pour embuer une vitre, en serrant.", j: true, w: "Le même crochet, sans point." },
  { c: "خ", n: "khā'", t: "kh", p: "Comme la jota espagnole, un « r » raclé au fond du palais.", j: true, w: "Le crochet, un point au-dessus." },
  { c: "د", n: "dāl", t: "d", p: "Comme le « d » français.", j: false, w: "Un petit angle ouvert à gauche." },
  { c: "ذ", n: "dhāl", t: "dh", p: "Comme le « th » anglais de this.", j: false, w: "Le dāl avec un point au-dessus." },
  { c: "ر", n: "rā'", t: "r", p: "Un « r » roulé, du bout de la langue.", j: false, w: "Une courbe qui descend sous la ligne." },
  { c: "ز", n: "zāy", t: "z", p: "Comme le « z » français.", j: false, w: "Le rā' avec un point au-dessus." },
  { c: "س", n: "sīn", t: "s", p: "Comme le « s » de sel.", j: true, w: "Trois petites dents, puis une coupe." },
  { c: "ش", n: "shīn", t: "sh", p: "Comme le « ch » de chat.", j: true, w: "Le sīn avec trois points au-dessus." },
  { c: "ص", n: "ṣād", t: "ṣ", p: "Un « s » emphatique : langue basse, bouche arrondie, son plus grave.", j: true, w: "Une boucle couchée, puis une coupe." },
  { c: "ض", n: "ḍād", t: "ḍ", p: "Un « d » emphatique, son grave. L'arabe est appelé « la langue du ḍād ».", j: true, w: "Le ṣād avec un point au-dessus." },
  { c: "ط", n: "ṭā'", t: "ṭ", p: "Un « t » emphatique, son grave.", j: true, w: "Une boucle couchée et un trait vertical." },
  { c: "ظ", n: "ẓā'", t: "ẓ", p: "Un « dh » emphatique, son grave.", j: true, w: "Le ṭā' avec un point au-dessus." },
  { c: "ع", n: "'ayn", t: "ʿ", p: "Une contraction du fond de la gorge, sans équivalent en français. Écoute-le souvent.", j: true, w: "Un petit crochet en haut, une grande courbe en bas." },
  { c: "غ", n: "ghayn", t: "gh", p: "Comme le « r » grasseyé de Paris.", j: true, w: "Le 'ayn avec un point au-dessus." },
  { c: "ف", n: "fā'", t: "f", p: "Comme le « f » français.", j: true, w: "Une petite boucle, un point au-dessus, une queue plate." },
  { c: "ق", n: "qāf", t: "q", p: "Un « k » très profond, du fond de la gorge.", j: true, w: "Une boucle, deux points, une queue arrondie qui descend." },
  { c: "ك", n: "kāf", t: "k", p: "Comme le « k » français.", j: true, w: "Un grand angle avec un petit trait à l'intérieur." },
  { c: "ل", n: "lām", t: "l", p: "Comme le « l » français.", j: true, w: "Un trait vertical qui finit en coupe." },
  { c: "م", n: "mīm", t: "m", p: "Comme le « m » français.", j: true, w: "Une petite boucle ronde avec une queue." },
  { c: "ن", n: "nūn", t: "n", p: "Comme le « n » français.", j: true, w: "Une coupe ronde, un point au-dessus." },
  { c: "ه", n: "hā'", t: "h", p: "Un « h » expiré léger, comme en anglais (hello).", j: true, w: "Une petite boucle, comme un 'o'." },
  { c: "و", n: "wāw", t: "w / ū", p: "« w » comme dans oui. Après une damma, il allonge le son « ou » (ū).", j: false, w: "Une petite boucle avec une queue." },
  { c: "ي", n: "yā'", t: "y / ī", p: "« y » comme dans yeux. Après une kasra, il allonge le son « i » (ī).", j: true, w: "Une courbe en S, deux points en dessous." }
];

// Leçons de lecture, dans l'ordre où on les apprend.
window.LESSONS = [
  {
    id: "sens",
    titre: "Le sens de l'écriture",
    corps: [
      "L'arabe s'écrit et se lit de droite à gauche. Le Coran aussi.",
      "Il y a 28 lettres, toutes des consonnes. Les voyelles courtes sont de petits signes au-dessus ou au-dessous des lettres.",
      "Dans un mot, la plupart des lettres sont attachées. Une même lettre change donc un peu de forme selon sa place : seule, au début, au milieu ou à la fin.",
      "Six lettres ne s'attachent jamais à la lettre qui suit : ا د ذ ر ز و. Après elles, le mot repart avec une forme de début."
    ],
    exemples: [["بسم", "bism", "au nom de"], ["الله", "Allāh", "Dieu"]]
  },
  {
    id: "courtes",
    titre: "Les voyelles courtes",
    corps: [
      "Fatḥa : un petit trait au-dessus de la lettre. Son « a ».",
      "Kasra : un petit trait au-dessous. Son « i ».",
      "Ḍamma : un petit wāw au-dessus. Son « ou » (noté u).",
      "Dans le Coran, toutes les voyelles sont écrites. C'est ce qui permet de le lire sans connaître le sens des mots."
    ],
    exemples: [["بَ", "ba", "fatḥa"], ["بِ", "bi", "kasra"], ["بُ", "bu", "ḍamma"], ["كَتَبَ", "kataba", "il a écrit"]]
  },
  {
    id: "longues",
    titre: "Les voyelles longues",
    corps: [
      "Fatḥa + alif = ā (on tient le son « a » deux temps).",
      "Kasra + yā' = ī (« i » long).",
      "Ḍamma + wāw = ū (« ou » long).",
      "Tenir les voyelles longues est une des premières règles de la récitation (madd)."
    ],
    exemples: [["بَا", "bā", "a long"], ["بِي", "bī", "i long"], ["بُو", "bū", "ou long"], ["نُور", "nūr", "lumière"]]
  },
  {
    id: "sukun",
    titre: "Sukūn et shadda",
    corps: [
      "Sukūn : un petit rond au-dessus de la lettre. La lettre n'a pas de voyelle : on la prononce seule.",
      "Shadda : un petit « w » au-dessus. La lettre est doublée, on appuie dessus.",
      "Tanwīn : une voyelle doublée en fin de mot. On ajoute un son « n » : an, in, un."
    ],
    exemples: [["مِنْ", "min", "de"], ["رَبّ", "rabb", "Seigneur"], ["كِتَابًا", "kitāban", "un livre"]]
  },
  {
    id: "bismillah",
    titre: "Lire la basmala",
    corps: [
      "On commence presque toutes les sourates par cette phrase. Lis-la mot par mot, de droite à gauche.",
      "Dans ٱللَّه, l'alif du début porte un petit signe (waṣla) : il ne se prononce pas quand on enchaîne avec le mot d'avant.",
      "Écoute la Fātiḥa dans l'onglet Écouter en suivant le texte dans Lire. C'est l'exercice le plus utile au début."
    ],
    exemples: [["بِسْمِ", "bismi", "au nom de"], ["ٱللَّهِ", "llāhi", "Allah"], ["ٱلرَّحْمَٰنِ", "r-raḥmāni", "le Tout Miséricordieux"], ["ٱلرَّحِيمِ", "r-raḥīmi", "le Très Miséricordieux"]]
  },
  {
    id: "tajwid",
    titre: "Premières règles de récitation",
    corps: [
      "Le tajwīd est l'art de bien prononcer le Coran. Tu l'apprendras mieux avec un professeur, mais trois règles reviennent partout.",
      "Lettres solaires : après « al- », si le mot commence par ت ث د ذ ر ز س ش ص ض ط ظ ل ن, le « l » disparaît et la lettre est doublée : ash-shams (le soleil), pas al-shams.",
      "Lettres lunaires : devant les autres lettres, on prononce le « l » : al-qamar (la lune).",
      "Ghunna : un nūn ou un mīm avec shadda se nasalise pendant deux temps, comme un son qui passe par le nez."
    ],
    exemples: [["ٱلشَّمْس", "ash-shams", "solaire"], ["ٱلْقَمَر", "al-qamar", "lunaire"], ["إِنَّ", "inna", "ghunna"]]
  }
];

// L'essentiel à connaître.
window.BASICS = [
  {
    titre: "Les cinq piliers de l'islam",
    items: [
      ["Shahāda", "L'attestation de foi : il n'y a de divinité que Dieu, et Muhammad est Son messager."],
      ["Ṣalāt", "La prière, cinq fois par jour."],
      ["Zakāt", "L'aumône obligatoire, une part des biens donnée chaque année quand on dépasse un seuil."],
      ["Ṣawm", "Le jeûne du mois de Ramadan, de l'aube au coucher du soleil."],
      ["Ḥajj", "Le pèlerinage à La Mecque, une fois dans la vie pour qui en a les moyens."]
    ]
  },
  {
    titre: "Les six piliers de la foi (īmān)",
    items: [
      ["Dieu", "Croire en Dieu, unique."],
      ["Les anges", "Comme Jibrīl (Gabriel), qui a transmis la révélation."],
      ["Les livres révélés", "La Torah, les Psaumes, l'Évangile et le Coran."],
      ["Les prophètes", "D'Adam à Muhammad, en passant par Nūḥ, Ibrāhīm, Mūsā et 'Īsā."],
      ["Le Jour dernier", "La résurrection et le jugement."],
      ["Le destin", "Le décret divin, le bien comme l'épreuve."]
    ]
  },
  {
    titre: "Les cinq prières",
    items: [
      ["Fajr", "À l'aube, avant le lever du soleil. 2 unités (rak'a)."],
      ["Ẓuhr", "Après le passage du soleil au zénith. 4 rak'a."],
      ["'Aṣr", "L'après-midi. 4 rak'a."],
      ["Maghrib", "Juste après le coucher du soleil. 3 rak'a."],
      ["'Ishā'", "La nuit, quand la lueur du couchant a disparu. 4 rak'a."]
    ]
  },
  {
    titre: "Le Coran en chiffres",
    items: [
      ["114 sourates", "Rangées à peu près de la plus longue à la plus courte, sauf la Fātiḥa en tête."],
      ["6 236 versets", "Selon la numérotation la plus répandue (lecture de Ḥafṣ)."],
      ["23 ans", "Durée de la révélation, de 610 à 632."],
      ["30 juz'", "Le Coran est divisé en 30 parties égales, pratique pour le lire en un mois, par exemple pendant le Ramadan."],
      ["86 / 28", "86 sourates mecquoises (avant l'Hégire), 28 médinoises (après), selon la classification courante."]
    ]
  }
];

// Histoire, dans l'ordre chronologique. y = date (ère commune), h = date hégirienne si utile.
window.HISTORY = [
  { y: "vers 570", t: "Naissance du Prophète Muhammad ﷺ", d: "À La Mecque, dans la tribu de Quraysh, l'« année de l'Éléphant ». Son père 'Abd Allāh meurt avant sa naissance, sa mère Āmina quand il a six ans. Il est élevé par son grand-père 'Abd al-Muṭṭalib puis par son oncle Abū Ṭālib." },
  { y: "vers 595", t: "Mariage avec Khadīja", d: "Il travaille dans le commerce et on le surnomme al-Amīn, « le digne de confiance ». Il épouse Khadīja, une commerçante respectée, qui sera la première à croire en lui." },
  { y: "610", t: "La première révélation", d: "Dans la grotte de Ḥirā', près de La Mecque, l'ange Jibrīl lui apporte les premiers versets : « Lis, au nom de ton Seigneur qui a créé » (sourate 96, al-'Alaq). Il a environ 40 ans." },
  { y: "610 – 622", t: "La prédication à La Mecque", d: "D'abord en secret, puis publiquement. Les premiers croyants sont Khadīja, 'Alī, Abū Bakr et Zayd. Les Quraysh persécutent les musulmans, surtout les plus faibles, comme Bilāl. Les sourates de cette période parlent surtout de l'unicité de Dieu, de la résurrection et des prophètes passés." },
  { y: "615", t: "L'émigration en Abyssinie", d: "Un groupe de musulmans se réfugie auprès du Négus, roi chrétien d'Abyssinie (Éthiopie actuelle), qui les protège." },
  { y: "619", t: "L'année de la tristesse", d: "Mort de Khadīja et d'Abū Ṭālib, son protecteur. Le Prophète part prêcher à Ṭā'if, où il est rejeté." },
  { y: "vers 620", t: "Le voyage nocturne (Isrā' et Mi'rāj)", d: "Le voyage de La Mecque à Jérusalem, puis l'ascension à travers les cieux. La tradition situe à ce moment la prescription des cinq prières. Sourate 17, al-Isrā'." },
  { y: "622", h: "an 1", t: "L'Hégire", d: "Le Prophète et Abū Bakr émigrent à Yathrib, qui devient Madīnat an-Nabī, Médine. Cette émigration marque l'an 1 du calendrier hégirien. Il y construit la mosquée et établit une charte entre les communautés de la ville." },
  { y: "624", h: "an 2", t: "La bataille de Badr", d: "Première grande victoire des musulmans, en infériorité numérique, face à l'armée mecquoise. La même année, la direction de la prière (qibla) passe de Jérusalem à La Mecque." },
  { y: "625", h: "an 3", t: "La bataille d'Uḥud", d: "Revers pour les musulmans, près de Médine. Ḥamza, oncle du Prophète, y meurt." },
  { y: "627", h: "an 5", t: "La bataille du Fossé (al-Khandaq)", d: "Une coalition assiège Médine. Sur le conseil de Salmān le Perse, les musulmans creusent une tranchée. Le siège échoue." },
  { y: "628", h: "an 6", t: "Le traité d'al-Ḥudaybiyya", d: "Trêve de dix ans avec La Mecque. Elle paraît défavorable, mais le Coran l'appelle « une victoire éclatante » (sourate 48) : l'islam se diffuse rapidement pendant la paix." },
  { y: "630", h: "an 8", t: "L'entrée à La Mecque", d: "Après la rupture de la trêve par des alliés de Quraysh, le Prophète entre à La Mecque presque sans combat. Il accorde une amnistie générale et purifie la Ka'ba de ses idoles." },
  { y: "632", h: "an 10 – 11", t: "Le pèlerinage d'adieu et la mort du Prophète", d: "Il accomplit son unique pèlerinage et prononce le sermon d'adieu à 'Arafāt. Il meurt à Médine quelques mois plus tard, vers 63 ans." },
  { y: "632 – 634", t: "Abū Bakr, premier calife", d: "Il maintient l'unité de la communauté. Après la mort de nombreux mémorisateurs du Coran au combat, il fait rassembler le texte en un recueil, sous la direction de Zayd ibn Thābit." },
  { y: "634 – 644", t: "'Umar ibn al-Khaṭṭāb", d: "Expansion vers la Syrie, l'Irak, l'Égypte et la Perse. Il instaure le calendrier hégirien et organise l'administration." },
  { y: "644 – 656", t: "'Uthmān ibn 'Affān", d: "Il fait établir un exemplaire de référence du Coran (le muṣḥaf 'uthmānien) et en envoie des copies dans les grandes villes. C'est ce texte que l'on lit encore aujourd'hui." },
  { y: "656 – 661", t: "'Alī ibn Abī Ṭālib", d: "Cousin et gendre du Prophète. Son califat est marqué par des guerres civiles (fitna). Avec lui s'achève la période des quatre califes « bien guidés » (rāshidūn)." },
  { y: "661 – 750", t: "Les Omeyyades", d: "Capitale à Damas. L'empire s'étend de l'Espagne (al-Andalus, 711) à l'Asie centrale. L'arabe devient la langue de l'administration. Construction du Dôme du Rocher à Jérusalem." },
  { y: "750 – 1258", t: "Les Abbassides", d: "Capitale à Bagdad, fondée en 762. Âge d'or des sciences : la Maison de la sagesse traduit les savants grecs, perses et indiens. Mathématiques (al-Khwārizmī, d'où vient le mot algorithme), médecine (Ibn Sīnā), et grands savants du ḥadīth comme al-Bukhārī. Fin avec la prise de Bagdad par les Mongols." },
  { y: "756 – 1492", t: "Al-Andalus", d: "L'Espagne musulmane, avec Cordoue et sa grande mosquée, puis Grenade et l'Alhambra. Un foyer majeur de savoir, jusqu'à la chute de Grenade en 1492." },
  { y: "1299 – 1922", t: "L'Empire ottoman", d: "Prise de Constantinople en 1453, qui devient Istanbul. Pendant des siècles, il garde les lieux saints de La Mecque et de Médine. Le califat est aboli en 1924." }
];
