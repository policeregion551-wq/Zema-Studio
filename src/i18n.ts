import type { ToolMode, UiLanguage } from "./types";

export interface LanguageMeta {
  code: UiLanguage;
  label: string;
  englishName: string;
  dir: "ltr" | "rtl";
}

export const UI_LANGUAGES: LanguageMeta[] = [
  { code: "am", label: "አማርኛ", englishName: "Amharic", dir: "ltr" },
  { code: "en", label: "English", englishName: "English", dir: "ltr" },
  { code: "om", label: "Afaan Oromoo", englishName: "Oromo", dir: "ltr" },
  { code: "ti", label: "ትግርኛ", englishName: "Tigrigna", dir: "ltr" },
  { code: "ar", label: "العربية", englishName: "Arabic", dir: "rtl" },
  { code: "fr", label: "Français", englishName: "French", dir: "ltr" },
];

export const OUTPUT_LANGUAGES = [
  { value: "Amharic", label: "አማርኛ (Amharic)" },
  { value: "English", label: "English" },
  { value: "Afaan Oromoo", label: "Afaan Oromoo" },
  { value: "Tigrigna", label: "ትግርኛ (Tigrigna)" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "French", label: "Français (French)" },
  { value: "Swahili", label: "Kiswahili" },
  { value: "Spanish", label: "Español" },
];

export interface TranslationBundle {
  brandName: string;
  nav: Record<ToolMode, string>;
  titles: Record<ToolMode, string>;
  subtitles: Record<ToolMode, string>;
  placeholders: Record<ToolMode, string>;
  examplesLabel: string;
  examples: Record<ToolMode, string[]>;
  generateBtn: Record<ToolMode, string>;
  generatingBtn: string;
  uploadTitle: string;
  uploadHint: string;
  changePhoto: string;
  moodLabel: string;
  moods: string[];
  musicLengthLabel: string;
  musicShort: string;
  musicFull: string;
  vocalLangLabel: string;
  instrumental: string;
  adPlatformLabel: string;
  adPlatforms: string[];
  adToneLabel: string;
  adTones: string[];
  adVoiceLabel: string;
  adOutputLangLabel: string;
  includeVisualLabel: string;
  aspectRatioLabel: string;
  landscapeLabel: string;
  portraitLabel: string;
  videoDurationLabel: string;
  emptyStageTitle: string;
  emptyStageDesc: string;
  recentTitle: string;
  download: string;
  copyText: string;
  copied: string;
  lyricsTitle: string;
  voiceoverTitle: string;
  storyboardTitle: string;
  socialCaptionTitle: string;
  adVisualTitle: string;
  autoDeleteNotice: string;
  expiresPrefix: string;
  removeLabel: string;
}

export const TRANSLATIONS: Record<UiLanguage, TranslationBundle> = {
  am: {
    brandName: "ዜማ ስቱዲዮ",
    nav: {
      music: "ጽሁፍ → ሙዚቃ",
      ad: "ጽሁፍ → ማስታወቂያ",
      "text-video": "ጽሁፍ → ቪዲዮ",
      "photo-video": "ፎቶ → ቪዲዮ",
    },
    titles: {
      music: "ጽሁፍን ወደ ሙዚቃ ይቀይሩ",
      ad: "ጽሁፍን ወደ ማስታወቂያ ይቀይሩ",
      "text-video": "ጽሁፍን ወደ ቪዲዮ ይቀይሩ",
      "photo-video": "ፎቶን ወደ ቪዲዮ ይቀይሩ",
    },
    subtitles: {
      music: "የሚፈልጉትን ስሜት ወይም ሀሳብ ይጻፉ፣ ወዲያውኑ ያለክፍያ ወደ ሙዚቃ ይቀየራል።",
      ad: "ምርትዎን ወይም አገልግሎትዎን ይግለጹ፤ የማስታወቂያ ጽሁፍ፣ ድምጽ እና ምስል ያግኙ።",
      "text-video": "የሚፈልጉትን ትዕይንት በቃላት ይጻፉ፤ ወደ ተንቀሳቃሽ ቪዲዮ ይቀየራል።",
      "photo-video": "ማንኛውንም ፎቶ ያስገቡ እና እንዴት እንዲንቀሳቀስ እንደሚፈልጉ ይንገሩት።",
    },
    placeholders: {
      music: "ለምሳሌ፡ ረጋ ያለ የኢትዮጵያ ባህላዊ ክራር እና ጃዝ የተቀላቀለበት የምሽት ሙዚቃ...",
      ad: "ለምሳሌ፡ በአዲስ አበባ የሚገኝ ትኩስ የተቆላ ቡና ቤት ለጠዋት ደንበኞች 20% ቅናሽ...",
      "text-video": "ለምሳሌ፡ ፀሐይ ስትጠልቅ በላሊበላ ተራሮች ላይ በረጋ ሁኔታ የሚበር ካሜራ...",
      "photo-video": "ለምሳሌ፡ ነፋስ ፀጉሩን እያወዛወዘ ካሜራው ቀስ ብሎ ወደ ፊት ይቅረብ...",
    },
    examplesLabel: "ፈጣን ምሳሌዎች",
    examples: {
      music: [
        "ደስ የሚል የኢትዮ-ጃዝ ትዝታ ክራር እና ፒያኖ ዜማ",
        "ለስራ እና ለትኩረት የሚሆን ረጋ ያለ ፒያኖ",
        "ፈጣን እና አዝናኝ የአፍሮቢት ዳንስ ሙዚቃ",
      ],
      ad: [
        "ትኩስ የኢትዮጵያ ቡና መሸጫ — በአንድ ስልክ ቤትዎ ድረስ ይመጣል",
        "ዘመናዊ የልብስ ስፌት እና ባህላዊ ዲዛይን ሱቅ",
        "ቀላል የሞባይል ገንዘብ መላኪያ አገልግሎት",
      ],
      "text-video": [
        "በዝናብ ውስጥ የምታበራ ዘመናዊ ከተማ በምሽት",
        "ትኩስ ቡና በጀበና ሲቀዳ በዝግታ የሚታይ ቪዲዮ",
        "በአረንጓዴ ተራሮች መካከል የፀሐይ መውጫ ትዕይንት",
      ],
      "photo-video": [
        "ካሜራው ቀስ ብሎ ወደ ፊት ይቅረብ እና ብርሃኑ ይንቀሳቀስ",
        "ቀላል ነፋስ እና ተፈጥሯዊ እንቅስቃሴ ይጨመር",
        "ወደ ጎን በዝግታ የሚጓዝ የሲኒማ ካሜራ",
      ],
    },
    generateBtn: {
      music: "ሙዚቃ ፍጠር",
      ad: "ማስታወቂያ ፍጠር",
      "text-video": "ቪዲዮ ፍጠር",
      "photo-video": "ፎቶውን አንቀሳቅስ",
    },
    generatingBtn: "በመስራት ላይ...",
    uploadTitle: "ፎቶ እዚህ ይጫኑ ወይም ይጎትቱ",
    uploadHint: "PNG, JPG ወይም WEBP (እስከ 15MB)",
    changePhoto: "ሌላ ፎቶ ምረጥ",
    moodLabel: "የሙዚቃ ስሜት",
    moods: ["ረጋ ያለ", "አዝናኝ", "ሲኒማዊ", "ባህላዊ", "ሮማንቲክ"],
    musicLengthLabel: "ርዝመት",
    musicShort: "አጭር (16 ሰከንድ)",
    musicFull: "ረዘም ያለ (28 ሰከንድ)",
    vocalLangLabel: "የግጥም ቋንቋ",
    instrumental: "ያለ ግጥም (Instrumental)",
    adPlatformLabel: "የማስታወቂያ ቦታ",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "የአቀራረብ ቃና",
    adTones: ["ሞቅ ያለ እና አሳማኝ", "ፕሮፌሽናል", "አዝናኝ እና ፈጣን", "የቅንጦት"],
    adVoiceLabel: "ተናጋሪ ድምጽ",
    adOutputLangLabel: "የማስታወቂያው ቋንቋ",
    includeVisualLabel: "የማስታወቂያ ፖስተር ምስል አብሮ ይፍጠር",
    aspectRatioLabel: "የቪዲዮ መጠን",
    landscapeLabel: "ሰፊ (16:9)",
    portraitLabel: "ቁም (9:16)",
    videoDurationLabel: "ርዝመት",
    emptyStageTitle: "ውጤትዎ እዚህ ይታያል",
    emptyStageDesc: "በግራ በኩል ሀሳብዎን ያስገቡ እና የሚለውን ቁልፍ ይጫኑ።",
    recentTitle: "የቅርብ ጊዜ ስራዎች",
    download: "አውርድ",
    copyText: "ጽሁፍ ቅዳ",
    copied: "ተቀድቷል",
    lyricsTitle: "ግጥም / የዜማ ማስታወሻ",
    voiceoverTitle: "የማስታወቂያ ድምጽ (Voiceover)",
    storyboardTitle: "የትዕይንት እቅድ (Storyboard)",
    socialCaptionTitle: "ለማህበራዊ ሚዲያ መግለጫ",
    adVisualTitle: "የማስታወቂያ ፖስተር",
    autoDeleteNotice: "ያለ ምዝገባ እና ያለ ሎጊን ይስሩ — የተሰራው ስራ ከ10 ደቂቃ በኋላ በራሱ ይጠፋል፤ ወዲያውኑ ያውርዱ።",
    expiresPrefix: "የሚጠፋበት",
    removeLabel: "አሁን አጥፋ",
  },
  en: {
    brandName: "Zema Studio",
    nav: {
      music: "Text → Music",
      ad: "Text → Ad",
      "text-video": "Text → Video",
      "photo-video": "Photo → Video",
    },
    titles: {
      music: "Turn text into music",
      ad: "Turn text into an ad",
      "text-video": "Turn text into video",
      "photo-video": "Animate photo to video",
    },
    subtitles: {
      music: "Describe a mood, scale, or lyrics and compose real playable music for free.",
      ad: "Describe your product or service to get ad copy, spoken voiceover, and poster.",
      "text-video": "Write a visual scene and render an animated video clip.",
      "photo-video": "Upload a still photo and describe how it should come alive.",
    },
    placeholders: {
      music: "e.g., Warm Ethio-jazz Tizita melody with krar strings and soft piano groove...",
      ad: "e.g., Freshly roasted Ethiopian specialty coffee delivered to your door in 20 minutes...",
      "text-video": "e.g., Golden hour mountains with gentle sunlight beams and drifting mist...",
      "photo-video": "e.g., Gentle breeze and slow cinematic push-in zoom...",
    },
    examplesLabel: "Quick examples",
    examples: {
      music: [
        "Warm acoustic Ethio-jazz Tizita with krar and piano",
        "Calm lo-fi piano beat for focus and studying",
        "Upbeat Afrobeat celebration groove with brass",
      ],
      ad: [
        "Freshly roasted specialty coffee delivered fast to your home",
        "Modern tailoring studio blending classic and contemporary fashion",
        "Instant mobile money transfer with zero hidden fees",
      ],
      "text-video": [
        "Rainy neon street reflection in a modern city at night",
        "Traditional coffee ceremony steam rising in warm evening light",
        "Golden sunset over serene green highland mountains",
      ],
      "photo-video": [
        "Slow cinematic zoom in with subtle warm sunlight shimmer",
        "Gentle floating dust motes and smooth upward pan",
        "Smooth horizontal camera pan across the scene",
      ],
    },
    generateBtn: {
      music: "Create Music",
      ad: "Create Ad Kit",
      "text-video": "Create Video",
      "photo-video": "Animate Photo",
    },
    generatingBtn: "Creating...",
    uploadTitle: "Drop a photo here or click to browse",
    uploadHint: "PNG, JPG, or WEBP up to 15MB",
    changePhoto: "Choose another photo",
    moodLabel: "Mood",
    moods: ["Calm", "Upbeat", "Cinematic", "Traditional", "Romantic"],
    musicLengthLabel: "Length",
    musicShort: "16s Clip",
    musicFull: "28s Track",
    vocalLangLabel: "Lyrics Language",
    instrumental: "Instrumental",
    adPlatformLabel: "Platform",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "Tone",
    adTones: ["Warm & Persuasive", "Professional", "Playful & Fast", "Luxury"],
    adVoiceLabel: "Voice",
    adOutputLangLabel: "Ad Language",
    includeVisualLabel: "Also create ad poster image",
    aspectRatioLabel: "Aspect Ratio",
    landscapeLabel: "Wide (16:9)",
    portraitLabel: "Vertical (9:16)",
    videoDurationLabel: "Duration",
    emptyStageTitle: "Your creation appears here",
    emptyStageDesc: "Enter your idea on the left and press create.",
    recentTitle: "Recent creations",
    download: "Download",
    copyText: "Copy text",
    copied: "Copied",
    lyricsTitle: "Lyrics & Liner Notes",
    voiceoverTitle: "Spoken Voiceover",
    storyboardTitle: "Scene Storyboard",
    socialCaptionTitle: "Social Media Caption",
    adVisualTitle: "Ad Poster",
    autoDeleteNotice: "No sign-up or login — creations auto-delete after 10 minutes. Download immediately.",
    expiresPrefix: "Expires in",
    removeLabel: "Remove now",
  },
  om: {
    brandName: "Zema Studio",
    nav: {
      music: "Barreeffama → Muuziqaa",
      ad: "Barreeffama → Beeksisa",
      "text-video": "Barreeffama → Viidiyoo",
      "photo-video": "Suuraa → Viidiyoo",
    },
    titles: {
      music: "Barreeffama gara muuziqaatti jijjiiri",
      ad: "Barreeffama gara beeksisatti jijjiiri",
      "text-video": "Barreeffama gara viidiyootti jijjiiri",
      "photo-video": "Suuraa gara viidiyootti sochoosi",
    },
    subtitles: {
      music: "Miira ykn yaada barbaaddu barreessi, bilisaan muuziqaa uumi.",
      ad: "Oomisha kee ibsi; barreeffama beeksisaa, sagalee fi fakkii argadhu.",
      "text-video": "Haala viidiyoo barbaaddu barreessi.",
      "photo-video": "Suuraa fe'iiti akkamitti akka socho'u ibsi.",
    },
    placeholders: {
      music: "Fakkeenyaaf: Muuziqaa tasgabbaa'aa fi mi'aawaa galgalaa...",
      ad: "Fakkeenyaaf: Buna qulqulluu Itoophiyaa daqiiqaa 20 keessatti manatti geeffamu...",
      "text-video": "Fakkeenyaaf: Tulluu magariisa irra aduun yeroo lixxu...",
      "photo-video": "Fakkeenyaaf: Qilleensi suuta jedhee akka bubbisu...",
    },
    examplesLabel: "Fakkeenyota ariifataa",
    examples: {
      music: [
        "Muuziqaa tasgabbaa'aa piyaanoo fi krar",
        "Muuziqaa shubbisa Afrobeat gammachiisaa",
        "Yeedaloo aadaa fi ammayyaa walitti makame",
      ],
      ad: [
        "Daldala buna haaraa mana keessanitti dhiyaatu",
        "Mana uffata aadaa fi ammayyaa",
        "Tajaajila ergaa maallaqaa bilbilaa salphaa",
      ],
      "text-video": [
        "Magaalaa ammayyaa halkan bokkaa keessatti ibsaa qabdu",
        "Buna ho'aa fi hurka uumamaa",
        "Aduu tulluu magariisa duubaan lixxu",
      ],
      "photo-video": [
        "Kaameeraan suuta gara fuulduraatti haa dhihaatu",
        "Sochii qilleensaa fi ifa uumamaa dabali",
        "Kaameeraan suuta gara cinaatti haa deemu",
      ],
    },
    generateBtn: {
      music: "Muuziqaa Uumi",
      ad: "Beeksisa Uumi",
      "text-video": "Viidiyoo Uumi",
      "photo-video": "Suuraa Sochoosi",
    },
    generatingBtn: "Hojjechaa jira...",
    uploadTitle: "Suuraa asitti fe'i",
    uploadHint: "PNG, JPG, WEBP (hanga 15MB)",
    changePhoto: "Suuraa biraa fili",
    moodLabel: "Miira",
    moods: ["Tasgabbaa'aa", "Gammachiisaa", "Siinimaa", "Aadaa", "Jaalalaa"],
    musicLengthLabel: "Dheerina",
    musicShort: "Sekondii 16",
    musicFull: "Sekondii 28",
    vocalLangLabel: "Afaan Walaloo",
    instrumental: "Sagalee malee",
    adPlatformLabel: "Waltajjii",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "Haala Dubbii",
    adTones: ["Amansiisaa", "Ogeessaa", "Bashannansiisaa", "Qaalii"],
    adVoiceLabel: "Sagalee",
    adOutputLangLabel: "Afaan Beeksisaa",
    includeVisualLabel: "Fakkii beeksisaa dabalataan uumi",
    aspectRatioLabel: "Hanga Viidiyoo",
    landscapeLabel: "Bal'aa (16:9)",
    portraitLabel: "Dhaabbataa (9:16)",
    videoDurationLabel: "Yeroo",
    emptyStageTitle: "Bu'aan kee asitti mul'ata",
    emptyStageDesc: "Bitaa irratti yaada kee barreessii cuqaasi.",
    recentTitle: "Hojiiwwan dhihoo",
    download: "Buusi",
    copyText: "Garagalchi",
    copied: "Garagalfameera",
    lyricsTitle: "Walaloo",
    voiceoverTitle: "Sagalee Beeksisaa",
    storyboardTitle: "Karoora Mul'ataa",
    socialCaptionTitle: "Ibsa Miidiyaa Hawaasaa",
    adVisualTitle: "Fakkii Beeksisaa",
    autoDeleteNotice: "Galmee fi seensa malee hojjedhu — hojiin uumame daqiiqaa 10 booda ofumaan bada; battalumatti buusi.",
    expiresPrefix: "Kan badu",
    removeLabel: "Amma haqi",
  },
  ti: {
    brandName: "ዜማ ስቱዲዮ",
    nav: {
      music: "ጽሑፍ → ሙዚቃ",
      ad: "ጽሑፍ → መወዓውዒ",
      "text-video": "ጽሑፍ → ቪድዮ",
      "photo-video": "ስእሊ → ቪድዮ",
    },
    titles: {
      music: "ጽሑፍ ናብ ሙዚቃ ቀይር",
      ad: "ጽሑፍ ናብ መወዓውዒ ቀይር",
      "text-video": "ጽሑፍ ናብ ቪድዮ ቀይር",
      "photo-video": "ስእሊ ናብ ቪድዮ ቀይር",
    },
    subtitles: {
      music: "ዝደለኻዮ ስምዒት ጽሓፍ እሞ ብነጻ ናብ ሙዚቃ ይቕየር።",
      ad: "ፍርያትካ ወይ ኣገልግሎትካ ግለጽ፤ ናይ መወዓውዒ ጽሑፍን ድምጽን ርኸብ።",
      "text-video": "ትርኢት ብቃላት ጽሓፍ እሞ ቪድዮ ይፍጠር።",
      "photo-video": "ስእሊ ኣእቱ እሞ ከመይ ከም ዝንቀሳቐስ ግለጽ።",
    },
    placeholders: {
      music: "ንኣብነት፡ ዝህድእ ባህላዊ ክራርን ጃዝን ዝተሓዋወሶ ሙዚቃ...",
      ad: "ንኣብነት፡ ፍሩይ ዝተቖልወ ቡን ኣብ 20 ደቒቕ ናብ ገዛኹም...",
      "text-video": "ንኣብነት፡ ጸሓይ ክትዓርብ ከላ ኣብ ልዕሊ ኣኽራን ዝበርር ካሜራ...",
      "photo-video": "ንኣብነት፡ ቀስ ኢሉ ናብ ቅድሚት ዝቐርብ ካሜራ...",
    },
    examplesLabel: "ቅልጡፍ ኣብነታት",
    examples: {
      music: [
        "ዝህድእ ፒያኖን ክራርን ንምርግጋእ",
        "ተፈታዊ ናይ ኣፍሮቢት ሳዕስዒት ዜማ",
        "ባህላዊ ዜማ ምስ ዘመናዊ ጃዝ",
      ],
      ad: [
        "ፍሩይ ቡን ናብ ገዛኹም ብቀሊሉ ይመጽእ",
        "ዘመናዊ ናይ ክዳን ስፌትን ባህላዊ ዲዛይንን",
        "ቅልጡፍ ናይ ሞባይል ገንዘብ መላኣኺ",
      ],
      "text-video": [
        "ብለይቲ ኣብ ዝናብ እተንጸባርቕ ዘመናዊት ከተማ",
        "ውዑይ ቡን ኣብ ጀበናን ሃፋን",
        "ኣብ ሓምለዋይ ኣኽራን ዝወጽእ ብርሃን ጸሓይ",
      ],
      "photo-video": [
        "ካሜራ ቀስ ኢሉ ናብ ቅድሚት ይቕረብ",
        "ተፈጥሮኣዊ ንፋስን ምንቅስቓስ ብርሃንን ይወሰኽ",
        "ናብ ጎኒ ዝንቀሳቐስ ሲነማዊ ካሜራ",
      ],
    },
    generateBtn: {
      music: "ሙዚቃ ፍጠር",
      ad: "መወዓውዒ ፍጠር",
      "text-video": "ቪድዮ ፍጠር",
      "photo-video": "ስእሊ ኣንቀሳቕስ",
    },
    generatingBtn: "ይስራሕ ኣሎ...",
    uploadTitle: "ስእሊ ኣብዚ ኣእቱ",
    uploadHint: "PNG, JPG ወይ WEBP (ክሳብ 15MB)",
    changePhoto: "ካልእ ስእሊ ምረጽ",
    moodLabel: "ስምዒት",
    moods: ["ዝህድእ", "ዘዘናግዕ", "ሲነማዊ", "ባህላዊ", "ፍቕራዊ"],
    musicLengthLabel: "ንውሓት",
    musicShort: "16 ሰከንድ",
    musicFull: "28 ሰከንድ",
    vocalLangLabel: "ቋንቋ ግጥሚ",
    instrumental: "ብዘይ ግጥሚ",
    adPlatformLabel: "መድረኽ",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "ቃና",
    adTones: ["ውዑይን ኣእማንን", "ሞያዊ", "ተጻዋታይ", "ክቡር"],
    adVoiceLabel: "ድምጺ",
    adOutputLangLabel: "ቋንቋ መወዓውዒ",
    includeVisualLabel: "ምስሊ መወዓውዒ ብሓንሳብ ይፈጠር",
    aspectRatioLabel: "መጠን ቪድዮ",
    landscapeLabel: "ሰፊሕ (16:9)",
    portraitLabel: "ቁም (9:16)",
    videoDurationLabel: "ንውሓት",
    emptyStageTitle: "ውጽኢትኩም ኣብዚ ይርአ",
    emptyStageDesc: "ብጸጋም ሓሳብኩም ጽሒፍኩም መልግስ ጠውቑ።",
    recentTitle: "ቀረባ ስራሕቲ",
    download: "ኣውርድ",
    copyText: "ጽሑፍ ቅዳሕ",
    copied: "ተቐዲሑ",
    lyricsTitle: "ግጥሚ",
    voiceoverTitle: "ድምጺ መወዓውዒ",
    storyboardTitle: "መደብ ትርኢት",
    socialCaptionTitle: "መግለጺ ማሕበራዊ ሚድያ",
    adVisualTitle: "ስእሊ መወዓውዒ",
    autoDeleteNotice: "ብዘይ ምዝገባን ሎጊንን ስርሑ — ዝተሰርሐ ድሕሪ 10 ደቒቕ ብርእሱ ይጠፍእ፤ ብቕጽበት ኣውርዱ።",
    expiresPrefix: "ዝጠፍኣሉ",
    removeLabel: "ሕጂ ደምስስ",
  },
  ar: {
    brandName: "استوديو زيما",
    nav: {
      music: "نص → موسيقى",
      ad: "نص → إعلان",
      "text-video": "نص → فيديو",
      "photo-video": "صورة → فيديو",
    },
    titles: {
      music: "تحويل النص إلى موسيقى",
      ad: "تحويل النص إلى إعلان",
      "text-video": "تحويل النص إلى فيديو",
      "photo-video": "تحريك الصورة إلى فيديو",
    },
    subtitles: {
      music: "اكتب وصفاً أو كلمات لإنشاء مقطوعة موسيقية مجانية وقابلة للتحميل فوراً.",
      ad: "صف منتجك أو خدمتك لتحصل على نص إعلاني وتعليق صوتي وملصق.",
      "text-video": "اكتب وصف المشهد لتحويله إلى فيديو متحرك.",
      "photo-video": "ارفع صورة وحدد كيف تريد تحريكها.",
    },
    placeholders: {
      music: "مثال: موسيقى هادئة تمزج العود والبيانو مع إيقاع ليلي دافئ...",
      ad: "مثال: قهوة إثيوبية محمصة طازجة تصلك إلى باب منزلك خلال 20 دقيقة...",
      "text-video": "مثال: جبال خضراء عند غروب الشمس مع ضباب لطيف...",
      "photo-video": "مثال: نسيم لطيف يحرك العناصر مع تقريب سينمائي بطيء...",
    },
    examplesLabel: "أمثلة سريعة",
    examples: {
      music: [
        "موسيقى جاز دافئة مع بيانو وأوتار",
        "موسيقى هادئة للتركيز والدراسة",
        "إيقاع أفروبيت مبهج وسريع",
      ],
      ad: [
        "متجر قهوة مختصة طازجة مع توصيل سريع",
        "مشغل أزياء حديث يجمع بين الأصالة والحداثة",
        "تطبيق تحويل أموال فوري بدون رسوم خفية",
      ],
      "text-video": [
        "شارع حديث تحت المطر ليلاً مع أضواء المدينة",
        "قهوة ساخنة مع تصاعد البخار في إضاءة دافئة",
        "شروق الشمس فوق جبال خضراء هادئة",
      ],
      "photo-video": [
        "تقريب سينمائي بطيء مع حركة إضاءة طبيعية",
        "حركة نسيم خفيف وإضاءة دافئة",
        "تحريك الكاميرا أفقياً بسلاسة",
      ],
    },
    generateBtn: {
      music: "إنشاء موسيقى",
      ad: "إنشاء إعلان",
      "text-video": "إنشاء فيديو",
      "photo-video": "تحريك الصورة",
    },
    generatingBtn: "جاري الإنشاء...",
    uploadTitle: "اسحب الصورة هنا أو اضغط للاختيار",
    uploadHint: "PNG أو JPG أو WEBP حتى 15 ميجابايت",
    changePhoto: "اختيار صورة أخرى",
    moodLabel: "المزاج",
    moods: ["هادئ", "مبهج", "سينمائي", "تراثي", "رومانسي"],
    musicLengthLabel: "المدة",
    musicShort: "16 ثانية",
    musicFull: "28 ثانية",
    vocalLangLabel: "لغة الكلمات",
    instrumental: "موسيقى فقط",
    adPlatformLabel: "المنصة",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "الأسلوب",
    adTones: ["دافئ ومقنع", "احترافي", "مرح وسريع", "فاخر"],
    adVoiceLabel: "الصوت",
    adOutputLangLabel: "لغة الإعلان",
    includeVisualLabel: "إنشاء ملصق إعلاني مرفق",
    aspectRatioLabel: "الأبعاد",
    landscapeLabel: "عرضي (16:9)",
    portraitLabel: "طولي (9:16)",
    videoDurationLabel: "المدة",
    emptyStageTitle: "ستظهر النتيجة هنا",
    emptyStageDesc: "أدخل فكرتك في اللوحة الجانبية واضغط على زر الإنشاء.",
    recentTitle: "الأعمال الأخيرة",
    download: "تحميل",
    copyText: "نسخ النص",
    copied: "تم النسخ",
    lyricsTitle: "الكلمات والملاحظات",
    voiceoverTitle: "التعليق الصوتي",
    storyboardTitle: "خطة المشاهد",
    socialCaptionTitle: "نص المنشور",
    adVisualTitle: "الملصق الإعلاني",
    autoDeleteNotice: "بدون تسجيل أو دخول — تُحذف الأعمال تلقائياً بعد 10 دقائق؛ يمكنك التحميل فوراً.",
    expiresPrefix: "ينتهي خلال",
    removeLabel: "حذف الآن",
  },
  fr: {
    brandName: "Zema Studio",
    nav: {
      music: "Texte → Musique",
      ad: "Texte → Pub",
      "text-video": "Texte → Vidéo",
      "photo-video": "Photo → Vidéo",
    },
    titles: {
      music: "Transformer un texte en musique",
      ad: "Transformer un texte en publicité",
      "text-video": "Transformer un texte en vidéo",
      "photo-video": "Animer une photo en vidéo",
    },
    subtitles: {
      music: "Décrivez une ambiance pour composer gratuitement une vraie piste audio.",
      ad: "Décrivez votre offre pour obtenir script, voix off et affiche.",
      "text-video": "Décrivez une scène pour générer une vidéo animée.",
      "photo-video": "Importez une photo et décrivez le mouvement souhaité.",
    },
    placeholders: {
      music: "ex. : Éthio-jazz Tizita chaleureux avec krar acoustique et piano doux...",
      ad: "ex. : Café éthiopien fraîchement torréfié livré chez vous en 20 minutes...",
      "text-video": "ex. : Montagnes verdoyantes au coucher du soleil avec brume légère...",
      "photo-video": "ex. : Légère brise et zoom avant cinématique très doux...",
    },
    examplesLabel: "Exemples rapides",
    examples: {
      music: [
        "Éthio-jazz acoustique chaleureux avec krar et piano",
        "Piano lo-fi calme pour travailler",
        "Rythme Afrobeat festif et entraînant",
      ],
      ad: [
        "Café de spécialité fraîchement torréfié livré chez vous",
        "Atelier de couture mêlant tradition et modernité",
        "Transfert d'argent mobile instantané sans frais cachés",
      ],
      "text-video": [
        "Rue moderne sous la pluie la nuit avec reflets lumineux",
        "Vapeur de café chaud dans une lumière dorée",
        "Coucher de soleil sur des montagnes verdoyantes",
      ],
      "photo-video": [
        "Zoom avant cinématique lent et lumière naturelle",
        "Légère brise animant doucement la scène",
        "Panoramique fluide de gauche à droite",
      ],
    },
    generateBtn: {
      music: "Créer la musique",
      ad: "Créer la pub",
      "text-video": "Créer la vidéo",
      "photo-video": "Animer la photo",
    },
    generatingBtn: "Génération...",
    uploadTitle: "Déposez une photo ici ou cliquez pour parcourir",
    uploadHint: "PNG, JPG ou WEBP jusqu'à 15 Mo",
    changePhoto: "Changer de photo",
    moodLabel: "Ambiance",
    moods: ["Calme", "Joyeux", "Cinématique", "Traditionnel", "Romantique"],
    musicLengthLabel: "Durée",
    musicShort: "16 secondes",
    musicFull: "28 secondes",
    vocalLangLabel: "Langue des paroles",
    instrumental: "Instrumental",
    adPlatformLabel: "Plateforme",
    adPlatforms: ["TikTok / Reels", "YouTube / TV", "Instagram / Facebook", "Radio / Audio"],
    adToneLabel: "Ton",
    adTones: ["Chaleureux et persuasif", "Professionnel", "Dynamique", "Luxe"],
    adVoiceLabel: "Voix",
    adOutputLangLabel: "Langue de la pub",
    includeVisualLabel: "Générer aussi une affiche publicitaire",
    aspectRatioLabel: "Format",
    landscapeLabel: "Paysage (16:9)",
    portraitLabel: "Portrait (9:16)",
    videoDurationLabel: "Durée",
    emptyStageTitle: "Votre création apparaîtra ici",
    emptyStageDesc: "Saisissez votre idée à gauche et cliquez sur créer.",
    recentTitle: "Créations récentes",
    download: "Télécharger",
    copyText: "Copier le texte",
    copied: "Copié",
    lyricsTitle: "Paroles et notes",
    voiceoverTitle: "Voix off",
    storyboardTitle: "Storyboard",
    socialCaptionTitle: "Légende sociale",
    adVisualTitle: "Affiche publicitaire",
    autoDeleteNotice: "Sans inscription ni connexion — vos créations expirent après 10 minutes. Téléchargez immédiatement.",
    expiresPrefix: "Expire dans",
    removeLabel: "Supprimer",
  },
};
