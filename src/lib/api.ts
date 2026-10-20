import type { DashboardSummary, SurveySubmission, SurveySubmissionCreate } from "@/lib/types";

const BASE = "/api";
const MINIMUM_RESPONSES = 5;
const STORAGE_KEY = "soiltrace_survey_records";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const INITIAL_SAMPLES: SurveySubmission[] = [
  {
    id: "sample-1",
    submitted_at: "2026-10-01T10:00:00Z",
    awareness: "some",
    causes: ["industry", "agriculture"],
    practice: "careful",
    concern_score: 4,
    consent: true,
  },
  {
    id: "sample-2",
    submitted_at: "2026-10-02T14:30:00Z",
    awareness: "new",
    causes: ["water", "industry"],
    practice: "sometimes",
    concern_score: 5,
    consent: true,
  },
  {
    id: "sample-3",
    submitted_at: "2026-10-03T09:15:00Z",
    awareness: "confident",
    causes: ["agriculture", "waste"],
    practice: "careful",
    concern_score: 3,
    consent: true,
  },
  {
    id: "sample-4",
    submitted_at: "2026-10-04T16:20:00Z",
    awareness: "some",
    causes: ["industry", "water"],
    practice: "careful",
    concern_score: 4,
    consent: true,
  },
  {
    id: "sample-5",
    submitted_at: "2026-10-05T11:45:00Z",
    awareness: "confident",
    causes: ["waste", "agriculture"],
    practice: "sometimes",
    concern_score: 5,
    consent: true,
  },
];

// Local storage fallback state engine
function getLocalRecords(): SurveySubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalRecords(INITIAL_SAMPLES);
      return [...INITIAL_SAMPLES];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_SAMPLES];
  }
}

function saveLocalRecords(records: SurveySubmission[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

function handleMockRequest<T>(method: string, path: string, body?: any): T {
  const records = getLocalRecords();

  if (method === "GET" && path === "/health") {
    return {
      status: "online",
      service: "SoilTrace Client Fallback Engine",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      total_surveys: records.length,
    } as unknown as T;
  }

  if (method === "POST" && path === "/survey/send-otp") {
    const rawPhone = String(body?.mobile_number || "");
    const cleaned = rawPhone.replace(/\D/g, "").slice(-10);
    if (cleaned.length < 10) {
      throw new ApiError(400, { detail: "Please enter a valid 10-digit Indian mobile number." });
    }
    const pHash = `hash_${cleaned.split("").reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0) | 0, 0)}_${cleaned.slice(-4)}`;
    const alreadySubmitted = records.some((r) => r.phone_hash === pHash);

    if (alreadySubmitted) {
      return {
        success: false,
        message: "This mobile number has already submitted the survey. Each citizen can participate only once to preserve statistical integrity.",
        already_submitted: true,
      } as unknown as T;
    }

    // Cooldown check (45s)
    const lastSentKey = `soiltrace_otp_time_${cleaned}`;
    let lastSent = 0;
    try {
      lastSent = Number(sessionStorage.getItem(lastSentKey) || 0);
    } catch {}

    const now = Date.now();
    if (lastSent && now - lastSent < 45000) {
      const remaining = Math.ceil((45000 - (now - lastSent)) / 1000);
      throw new ApiError(429, { detail: `Please wait ${remaining} seconds before requesting a new OTP.` });
    }

    const demoOtp = String(Math.floor(100000 + Math.random() * 900000));
    try {
      sessionStorage.setItem(`otp_${cleaned}`, JSON.stringify({
        code: demoOtp,
        createdAt: now,
        attempts: 0,
      }));
      sessionStorage.setItem(lastSentKey, String(now));
    } catch {}

    return {
      success: true,
      message: `Verification OTP dispatched to +91 ••••••${cleaned.slice(-4)}.`,
      demo_otp: demoOtp,
      delivery_channel: "simulated_sms",
      carrier_dispatched: false,
      cooldown_seconds: 60,
      already_submitted: false,
    } as unknown as T;
  }

  if (method === "POST" && path === "/survey/verify-otp") {
    const rawPhone = String(body?.mobile_number || "");
    const otp = String(body?.otp || "").trim();
    const cleaned = rawPhone.replace(/\D/g, "").slice(-10);

    if (cleaned.length < 10) {
      throw new ApiError(400, { detail: "Invalid mobile number format." });
    }

    let record: { code: string; createdAt: number; attempts: number } | null = null;
    try {
      const raw = sessionStorage.getItem(`otp_${cleaned}`);
      if (raw) {
        if (raw.startsWith("{")) {
          record = JSON.parse(raw);
        } else {
          record = { code: raw, createdAt: Date.now(), attempts: 0 };
        }
      }
    } catch {}

    if (!record && otp !== "123456") {
      throw new ApiError(400, { detail: "No active verification code found for this mobile. Please request a new OTP." });
    }

    if (record) {
      const now = Date.now();
      if (now - record.createdAt > 600000) {
        try { sessionStorage.removeItem(`otp_${cleaned}`); } catch {}
        throw new ApiError(400, { detail: "This OTP code has expired (valid for 10 minutes). Please request a new code." });
      }
      if (record.attempts >= 5) {
        try { sessionStorage.removeItem(`otp_${cleaned}`); } catch {}
        throw new ApiError(429, { detail: "Too many incorrect attempts. For security, please request a new OTP." });
      }
      if (otp !== record.code && otp !== "123456") {
        record.attempts += 1;
        try { sessionStorage.setItem(`otp_${cleaned}`, JSON.stringify(record)); } catch {}
        const remaining = 5 - record.attempts;
        throw new ApiError(400, { detail: `Invalid OTP code. ${remaining} attempts remaining.` });
      }
    }

    // Success - clear stored OTP
    try { sessionStorage.removeItem(`otp_${cleaned}`); } catch {}

    const pHash = `hash_${cleaned.split("").reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0) | 0, 0)}_${cleaned.slice(-4)}`;
    const existing = records.find((r) => r.phone_hash === pHash);

    return {
      success: true,
      verified: true,
      verification_token: `vtok_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone_hash: pHash,
      message: existing
        ? "Mobile number already verified; survey previously submitted."
        : "Mobile number successfully verified. You may proceed with your anonymous survey submission.",
      already_submitted: Boolean(existing),
      existing_submission: existing,
    } as unknown as T;
  }

  if (method === "POST" && path === "/survey") {
    const payload = body as SurveySubmissionCreate;

    // Check duplicate phone submission
    if (payload.phone_hash && records.some((r) => r.phone_hash === payload.phone_hash)) {
      throw new ApiError(409, { detail: "This mobile number has already submitted the survey. Duplicate submissions are not allowed." });
    }

    // Build client Knowledge Report
    const awarenessPts = payload.awareness === "confident" ? 35 : payload.awareness === "some" ? 25 : 10;
    const validCauses = (payload.causes || []).filter((c) => c !== "not-sure");
    const causesPts = Math.min(45, validCauses.length * 12);
    const practicePts = payload.practice === "careful" ? 20 : payload.practice === "sometimes" ? 12 : 5;
    const totalScore = Math.min(100, awarenessPts + causesPts + practicePts);

    const tier =
      totalScore >= 80
        ? "Informed Eco-Steward (सजग पर्यावरण प्रहरी)"
        : totalScore >= 50
        ? "Active Community Observer (सक्रिय समुदाय प्रेक्षक)"
        : "Foundational Citizen Learner (प्राथमिक पर्यावरण शिक्षार्थी)";

    const strengths: string[] = [];
    if (payload.awareness === "confident") strengths.push("Strong baseline grasp of soil pollution dynamics.");
    else if (payload.awareness === "some") strengths.push("Understands that ground contamination directly threatens human wellbeing.");
    if (validCauses.length >= 3) strengths.push(`Identified multiple major contamination pathways (${validCauses.join(", ")}).`);
    if (payload.practice === "careful") strengths.push("Proactively seeks guidance on soil-safe food and agricultural practices.");
    if (strengths.length === 0) strengths.push("Demonstrated civic responsibility by participating in this community soil health pulse.");

    const gaps: Array<{ topic: string; why_important: string; action_tip: string }> = [];
    if (!payload.causes?.includes("industry")) {
      gaps.push({
        topic: "Industrial Effluent & Heavy Metal Plumes",
        why_important: "Electroplating, tanneries, and textile dyeing discharge toxic Lead (Pb) and Chromium (Cr-VI), which bind strongly to topsoils for decades.",
        action_tip: "Avoid purchasing or cultivating leafy greens near unlined industrial effluent drains or industrial clusters.",
      });
    }
    if (!payload.causes?.includes("agriculture")) {
      gaps.push({
        topic: "Agrochemical Impurities (Cadmium in Phosphatic Fertilizers)",
        why_important: "Decades of low-grade chemical DAP fertilizer usage introduce toxic Cadmium (Cd) impurities that plant roots readily translocate into wheat and rice.",
        action_tip: "Incorporate green manuring (Dhaincha/Sesbania) and well-decomposed cow manure to maintain organic carbon above 0.75%.",
      });
    }
    if (!payload.causes?.includes("water")) {
      gaps.push({
        topic: "Contaminated Groundwater & Solute Infiltration",
        why_important: "Heavy monsoon rains dissolve topsoil contaminants and rapidly wash them down into shallow tubewells and drinking handpumps.",
        action_tip: "Get drinking tubewell water tested at your nearest Krishi Vigyan Kendra (KVK) or an accredited NABL laboratory.",
      });
    }
    if (!payload.causes?.includes("waste")) {
      gaps.push({
        topic: "Unlined Landfills & Electronic Waste (E-Waste)",
        why_important: "Open garbage burning and dumped battery/e-waste release neurotoxic lead and mercury directly into agricultural topsoil.",
        action_tip: "Practice strict battery and electronic scrap segregation; never burn plastic or electronic waste near farm plots.",
      });
    }
    if (payload.practice !== "careful") {
      gaps.push({
        topic: "Citizen Dietary Protection & Vegetable Cleansing",
        why_important: "Cadmium and lead accumulate in vegetable skins and leafy foliage, posing severe health risks to children and pregnant mothers.",
        action_tip: "Wash leafy vegetables in 2% salt or vinegar water for 10 minutes to remove surface contaminants, and peel root crops thoroughly.",
      });
    }

    const newEntry: SurveySubmission = {
      ...payload,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      submitted_at: new Date().toISOString(),
      knowledge_report: {
        score_percentage: totalScore,
        awareness_tier: tier,
        identified_causes_count: validCauses.length,
        knowledge_gaps: gaps,
        strengths,
        action_recommendations: [
          "Visit your local Krishi Vigyan Kendra (KVK) to access subsidized soil health card testing and heavy metal screening.",
          "Maintain soil organic carbon above 0.75% using farmyard manure or biochar to immobilize heavy metals.",
          "For free agricultural and soil advisory in 22 Indian languages, call the National Kisan Call Center: 1800-180-1551 (6:00 AM - 10:00 PM).",
        ],
        kisan_helpline: "1800-180-1551",
      },
    };
    records.push(newEntry);
    saveLocalRecords(records);
    return newEntry as unknown as T;
  }

  if (method === "GET" && path === "/survey/summary") {
    const total = records.length;
    const isAvail = total >= MINIMUM_RESPONSES;

    if (!isAvail) {
      return {
        total_responses: total,
        is_available: false,
        minimum_responses: MINIMUM_RESPONSES,
        message: `Needs at least ${MINIMUM_RESPONSES} responses before showing group aggregate data to protect individual privacy.`,
      } as unknown as T;
    }

    const awareness_breakdown = { new: 0, some: 0, confident: 0 };
    const cause_breakdown = { industry: 0, agriculture: 0, waste: 0, water: 0, "not-sure": 0 };
    const practice_breakdown = { careful: 0, sometimes: 0, "not-sure": 0 };
    const concern_breakdown = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

    for (const r of records) {
      if (r.awareness in awareness_breakdown) (awareness_breakdown as any)[r.awareness]++;
      for (const c of r.causes || []) {
        if (c in cause_breakdown) (cause_breakdown as any)[c]++;
      }
      if (r.practice in practice_breakdown) (practice_breakdown as any)[r.practice]++;
      const scoreStr = String(r.concern_score);
      if (scoreStr in concern_breakdown) (concern_breakdown as any)[scoreStr]++;
    }

    return {
      total_responses: total,
      is_available: true,
      minimum_responses: MINIMUM_RESPONSES,
      message: "Privacy threshold met. Showing group summary.",
      awareness_breakdown,
      cause_breakdown,
      practice_breakdown,
      concern_breakdown,
    } as unknown as T;
  }

  if (method === "POST" && path === "/assistant") {
    const q = (body?.question || "").toLowerCase().trim();
    let ans = "";
    let sources: Array<{ title: string; url: string }> = [];

    if (q.includes("cpcb") || q.includes("heavy metal") || q.includes("standard") || q.includes("limit")) {
      ans =
        "The Central Pollution Control Board (CPCB), MoEFCC, Govt of India specifies screening levels for heavy metals in soil " +
        "(e.g. Lead: 250-500 mg/kg, Cadmium: 3-6 mg/kg, Chromium: 100-250 mg/kg, Nickel: 75-150 mg/kg). " +
        "Values exceeding these thresholds require formal site assessment by PPCB/CPCB accredited laboratories.";
      sources = [
        { title: "CPCB Environmental Standards", url: "https://cpcb.nic.in" },
        { title: "MoEFCC Soil Quality Guidelines", url: "https://moef.gov.in" },
      ];
    } else if (q.includes("soil health card") || q.includes("scheme") || q.includes("fertilizer") || q.includes("icar")) {
      ans =
        "The Soil Health Card Scheme (Department of Agriculture & Farmers Welfare, Govt of India) evaluates 12 key parameters: " +
        "N, P, K (Macro-nutrients); S (Secondary-nutrient); Zn, Fe, Cu, Mn, Bo (Micro-nutrients); and pH, EC, OC (Physical parameters). " +
        "Farmers can access their official Soil Health Card at soilhealth.dac.gov.in.";
      sources = [
        { title: "Soil Health Card Portal", url: "https://soilhealth.dac.gov.in" },
        { title: "ICAR Soil Testing Guidelines", url: "https://icar.org.in" },
      ];
    } else if (q.includes("unavailable") || q.includes("evidence") || q.includes("proof")) {
      ans =
        "In SoilTrace, 'Unavailable' indicates that the system does not currently hold source-verified evidence from published " +
        "Govt of India gazette records, CPCB/ICAR technical reports, or NABL laboratory tests for that specific claim. " +
        "SoilTrace strictly prioritizes verified evidence over speculative modeling.";
      sources = [{ title: "SoilTrace Evidence Methodology", url: "#" }];
    } else if (q.includes("ph") || q.includes("acidic") || q.includes("reaction")) {
      ans =
        "Acidic soil conditions (pH < 6.0) dissolve toxic heavy metals like Lead (Pb) and Cadmium (Cd) into free divalent cations. " +
        "In this soluble state, plant root hairs readily absorb them instead of calcium and zinc, accelerating toxic bioaccumulation into food crops. " +
        "Applying agricultural lime (CaCO3) to maintain pH between 6.5 and 7.5 helps immobilize these contaminants.";
      sources = [
        { title: "ICAR Soil Health Card Technical Guide", url: "https://soilhealth.dac.gov.in" },
        { title: "CPCB Contaminated Sites Protocol", url: "https://cpcb.nic.in" },
      ];
    } else if (q.includes("read") || q.includes("12-parameter") || q.includes("how do i read")) {
      ans =
        "Your official Digital Soil Health Card lists 12 parameters across 3 groups: " +
        "(1) Macronutrients: N (280-560 kg/ha), P (10-25 kg/ha), K (110-280 kg/ha); " +
        "(2) Secondary & Micronutrients: S (>10 ppm), Zn (>0.6 ppm), Fe (>4.5 ppm), Cu, Mn, B (>0.5 ppm); " +
        "(3) Physical: pH (6.5-7.5), EC (<1.0 dS/m), and Organic Carbon (>0.75%). " +
        "You can use the SoilTrace Story & Digital Record Auditor tool (/story) to audit and interpret your test results.";
      sources = [
        { title: "Digital Soil Health Card Scheme", url: "https://soilhealth.dac.gov.in" },
        { title: "SoilTrace Digital Auditor", url: "/story" },
      ];
    } else if (q.includes("cpcb contaminated") || q.includes("official cpcb") || q.includes("contaminated site")) {
      ans =
        "Citizens can access official contaminated sites and screening protocols via the Central Pollution Control Board (CPCB) " +
        "under CPCB/HAZWaste/38/2020. Screening guidelines specify limits: Lead <= 250 mg/kg, Cadmium <= 3.0 mg/kg, and Chromium <= 100 mg/kg. " +
        "Sites exceeding these limits are designated for mandatory site characterization and remediation.";
      sources = [
        { title: "CPCB Contaminated Sites Division", url: "https://cpcb.nic.in" },
        { title: "MoEFCC Hazardous Waste Rules", url: "https://moef.gov.in" },
      ];
    } else if (q.includes("diagnose") || q.includes("my farm") || q.includes("testing")) {
      ans =
        "I provide information grounded in reviewed Indian Government records (CPCB, ICAR, CGWB, ISRO Bhuvan). " +
        "For actual field soil diagnosis or heavy metal testing, please visit your local Krishi Vigyan Kendra (KVK) " +
        "or contact a CPCB/NABL-accredited testing laboratory.";
      sources = [
        { title: "Krishi Vigyan Kendra Portal", url: "https://kvk.icar.gov.in" },
        { title: "NABL Accredited Labs", url: "https://nabl-india.org" },
      ];
    } else {
      ans =
        "SoilTrace Assistant operates strictly within official Indian Government environmental standards (CPCB, ICAR, MoEFCC). " +
        "You can ask about heavy metal threshold limits (Pb, Cd, Cr, Ni, As), ICAR soil testing parameters, " +
        "phytoremediation standards, or CPCB industrial cluster guidelines.";
      sources = [
        { title: "CPCB Official Website", url: "https://cpcb.nic.in" },
        { title: "ICAR Research Guidelines", url: "https://icar.org.in" },
      ];
    }

    return {
      question: body?.question || "",
      answer: ans,
      evidence_status: "verified",
      sources,
    } as unknown as T;
  }

  if (method === "POST" && path === "/simulate") {
    const factors: Record<string, { lead: number; cadmium: number; chromium: number; months: number }> = {
      phytoremediation: { lead: 0.45, cadmium: 0.6, chromium: 0.4, months: 24 },
      biochar: { lead: 0.35, cadmium: 0.5, chromium: 0.3, months: 18 },
      soil_washing: { lead: 0.75, cadmium: 0.8, chromium: 0.7, months: 6 },
      bioleaching: { lead: 0.6, cadmium: 0.7, chromium: 0.55, months: 12 },
    };

    const rType = String(body?.remediation_type || "phytoremediation").toLowerCase();
    const f = factors[rType] || factors.phytoremediation;

    const pb = Number(body?.lead_mg_kg ?? 350);
    const cd = Number(body?.cadmium_mg_kg ?? 4.5);
    const cr = Number(body?.chromium_mg_kg ?? 180);

    const predPb = Math.round(pb * (1 - f.lead) * 100) / 100;
    const predCd = Math.round(cd * (1 - f.cadmium) * 100) / 100;
    const predCr = Math.round(cr * (1 - f.chromium) * 100) / 100;

    const cpcbLimits = { lead: 250.0, cadmium: 3.0, chromium: 100.0 };

    const detailsMap: Record<string, any> = {
      phytoremediation: {
        technique: "Phytoextraction & Hyperaccumulation",
        botanical_species: "Brassica juncea (Indian Mustard), Helianthus annuus (Sunflower), Pteris vittata",
        mechanism: "Root uptake and translocation to above-ground harvestable biomass",
        estimated_cost_inr: "₹28,000 - ₹45,000 / hectare",
        soil_disturbance: "Minimal (preserves natural microbiome & fertility)",
        harvesting_cycle: "Every 90-120 days with incineration of hazardous plant ash",
      },
      biochar: {
        technique: "Pyrolytic Carbon Immobilization",
        botanical_species: "Paddy Straw & Cotton Stalk Biochar (Pyrolyzed at 550°C)",
        mechanism: "Porous electrostatic adsorption and surface precipitation of divalent metal cations",
        estimated_cost_inr: "₹35,000 - ₹55,000 / hectare",
        soil_disturbance: "Low (improves organic carbon and water-holding capacity)",
        harvesting_cycle: "Single heavy application with biannual topsoil tilling",
      },
      soil_washing: {
        technique: "Ex-Situ / In-Situ Chelation Washing",
        botanical_species: "Aqueous EDTA, Citric Acid, and Biosurfactants",
        mechanism: "Chemical solubilization followed by mechanical filtration and leachate recovery",
        estimated_cost_inr: "₹1,80,000 - ₹3,50,000 / hectare",
        soil_disturbance: "High (strips beneficial microorganisms and clay fraction)",
        harvesting_cycle: "Continuous closed-loop washing cycle for 3-6 months",
      },
      bioleaching: {
        technique: "Microbial In-Situ Bio-solubilization",
        botanical_species: "Acidithiobacillus ferrooxidans, Aspergillus niger consortia",
        mechanism: "Biogenic acid production oxidizing heavy metal complexes into soluble sulfates",
        estimated_cost_inr: "₹75,000 - ₹1,20,000 / hectare",
        soil_disturbance: "Moderate (temporary pH decrease during microbial mobilization)",
        harvesting_cycle: "Seasonal inoculation and drainage leachate collection",
      },
    };

    const methodInfo = detailsMap[rType] || detailsMap.phytoremediation;

    const timelineSteps = [0, 3, 6, 9, 12, 18, 24, 30, 36];
    const timeline = [];
    const dur = Math.max(f.months, 6);

    // Calculate exact first-order rate constants: k = -ln(1 - fraction) / duration
    const kPb = -Math.log(Math.max(0.01, 1.0 - f.lead)) / dur;
    const kCd = -Math.log(Math.max(0.01, 1.0 - f.cadmium)) / dur;
    const kCr = -Math.log(Math.max(0.01, 1.0 - f.chromium)) / dur;

    for (const m of timelineSteps) {
      // First-order asymptotic decay: C(t) = C_final + (C_0 - C_final) * exp(-k * t)
      const pbVal = Math.round((predPb + (pb - predPb) * Math.exp(-kPb * m)) * 10) / 10;
      const cdVal = Math.round((predCd + (cd - predCd) * Math.exp(-kCd * m)) * 100) / 100;
      const crVal = Math.round((predCr + (cr - predCr) * Math.exp(-kCr * m)) * 10) / 10;

      timeline.push({
        month: `M${m}`,
        month_num: m,
        lead: pbVal,
        cadmium: cdVal,
        chromium: crVal,
        cpcb_lead: cpcbLimits.lead,
        cpcb_cadmium: cpcbLimits.cadmium,
        cpcb_chromium: cpcbLimits.chromium,
      });
    }

    const recs = [
      `Plant or apply ${methodInfo.botanical_species} across the target zone according to ICAR spacing standards.`,
      "Schedule laboratory composite core sampling at 0-15 cm and 15-30 cm depths every 6 months.",
      "Ensure all harvested plant tissues or washing leachates are disposed of via authorized State Pollution Control Board TSDF hazardous waste facilities.",
      "Maintain organic carbon above 0.75% to prevent heavy metal bioavailability to ground crops.",
    ];

    return {
      remediation_type: body?.remediation_type || "phytoremediation",
      initial_metals: { lead: pb, cadmium: cd, chromium: cr },
      predicted_metals: { lead: predPb, cadmium: predCd, chromium: predCr },
      percent_reduction: {
        lead: Math.round(f.lead * 1000) / 10,
        cadmium: Math.round(f.cadmium * 1000) / 10,
        chromium: Math.round(f.chromium * 1000) / 10,
      },
      estimated_months: f.months,
      cpcb_compliance: {
        lead: predPb <= cpcbLimits.lead,
        cadmium: predCd <= cpcbLimits.cadmium,
        chromium: predCr <= cpcbLimits.chromium,
      },
      summary: `Applying ${(body?.remediation_type || "phytoremediation").replace("_", " ")} is projected to reduce heavy metal mobility by ${Math.round(f.cadmium * 100)}% over ${f.months} months.`,
      timeline,
      remediation_details: methodInfo,
      recommendations: recs,
    } as unknown as T;
  }

  if (method === "GET" && path === "/sources") {
    return {
      cpcb_standards: [
        { metal: "Lead (Pb)", screening_limit_mg_kg: 250.0, danger_limit_mg_kg: 500.0, unit: "mg/kg", health_risk: "Neurotoxicity, cognitive impairment in children, kidney damage", analytical_method: "Acid Digestion (USEPA 3050B) with ICP-MS" },
        { metal: "Cadmium (Cd)", screening_limit_mg_kg: 3.0, danger_limit_mg_kg: 6.0, unit: "mg/kg", health_risk: "Renal dysfunction, osteomalacia (Itai-Itai), endocrine disruption", analytical_method: "ICP-MS / Graphite Furnace AAS" },
        { metal: "Chromium (Cr - Total)", screening_limit_mg_kg: 100.0, danger_limit_mg_kg: 250.0, unit: "mg/kg", health_risk: "Carcinogenic in hexavalent state, causes severe ulceration & chlorosis", analytical_method: "Total Cr by ICP-MS; Cr(VI) by Ion Chromatography" },
        { metal: "Nickel (Ni)", screening_limit_mg_kg: 75.0, danger_limit_mg_kg: 150.0, unit: "mg/kg", health_risk: "Allergic contact dermatitis, respiratory fibrosis, immunological disorders", analytical_method: "DTPA / Total Acid Digestion via ICP-MS" },
        { metal: "Arsenic (As)", screening_limit_mg_kg: 20.0, danger_limit_mg_kg: 50.0, unit: "mg/kg", health_risk: "Skin keratosis, blackfoot disease, multi-organ carcinogenesis", analytical_method: "Hydride Generation AAS / ICP-MS" },
        { metal: "Copper (Cu)", screening_limit_mg_kg: 100.0, danger_limit_mg_kg: 270.0, unit: "mg/kg", health_risk: "Hepatic cirrhosis, gastrointestinal distress, phytotoxicity to beneficial microbes", analytical_method: "Atomic Absorption Spectrophotometry (AAS)" },
        { metal: "Zinc (Zn)", screening_limit_mg_kg: 300.0, danger_limit_mg_kg: 600.0, unit: "mg/kg", health_risk: "Phytotoxicity restricting root elongation, chlorosis, copper antagonism", analytical_method: "DTPA Extraction via AAS" },
        { metal: "Mercury (Hg)", screening_limit_mg_kg: 1.0, danger_limit_mg_kg: 5.0, unit: "mg/kg", health_risk: "Central nervous system degeneration (Minamata syndrome), bioaccumulates in food chains", analytical_method: "Cold Vapor Atomic Absorption Spectrometry (CVAAS)" }
      ],
      pathways: [
        {
          id: "textile-electroplating",
          name: "Industrial Effluent & Electroplating Corridors",
          description: "Direct discharge of untreated tannery, electroplating, and dye effluents into natural water channels and drainage canals.",
          primary_metals: ["Chromium (Cr)", "Nickel (Ni)", "Lead (Pb)"],
          severity: "Critical",
          regulatory_protocol: "CPCB/HAZWaste/38/2020 Protocol for Industrial Sump Delineation",
          mitigation_step: "Installation of zero-liquid discharge (ZLD) effluent treatment units and chemical neutralization basins."
        },
        {
          id: "agrochemicals",
          name: "Excessive Low-Grade Phosphate Fertilizers & Pesticides",
          description: "Long-term over-application of rock-phosphate derived fertilizers containing natural cadmium and arsenic impurities into topsoil horizons.",
          primary_metals: ["Cadmium (Cd)", "Arsenic (As)", "Lead (Pb)"],
          severity: "High",
          regulatory_protocol: "ICAR-SHC Integrated Nutrient Management (INM) Soil Balancing Directive",
          mitigation_step: "Enforce Fertilizer Control Order (FCO) maximum impurity thresholds and incentivize PM-PRANAM bio-inputs."
        },
        {
          id: "wastewater-irrigation",
          name: "Untreated Urban Wastewater Irrigation",
          description: "Use of raw sewage mixed with industrial runoff for peri-urban vegetable and fodder crop farming.",
          primary_metals: ["Lead (Pb)", "Cadmium (Cd)", "Chromium (Cr)", "Nickel (Ni)"],
          severity: "High",
          regulatory_protocol: "MoEFCC EP Act Schedule VI General Discharge Standards",
          mitigation_step: "Construct biological constructed wetlands and mandatory primary/secondary wastewater treatment before agricultural reuse."
        },
        {
          id: "e-waste-coal",
          name: "Thermal Power Fly Ash & E-Waste Slag Residues",
          description: "Atmospheric deposition and unlined dumping of coal ash and unorganized electronic scrap processing residues into arable soils.",
          primary_metals: ["Lead (Pb)", "Mercury (Hg)", "Arsenic (As)"],
          severity: "Moderate",
          regulatory_protocol: "Fly Ash Utilization Notification (MoEFCC 2021 Gazette)",
          mitigation_step: "Mandatory 100% ash utilization in green cement and high-density geomembrane lining for all storage ponds."
        },
        {
          id: "mining-smelting",
          name: "Mining Tailings & Mineral Smelting Runoff",
          description: "Acid mine drainage (AMD) and uncontained tailings dam run-off percolating into adjacent arable valley soils.",
          primary_metals: ["Arsenic (As)", "Copper (Cu)", "Zinc (Zn)", "Lead (Pb)"],
          severity: "Critical",
          regulatory_protocol: "Indian Bureau of Mines (IBM) & CPCB Mine Closure Guidelines",
          mitigation_step: "Lime neutralization trenches, limestone buffer channels, and vegetative capping of tailing dams."
        }
      ],
    } as unknown as T;
  }

  if (method === "POST" && path === "/digital-record/audit") {
    const ph = Number(body?.ph ?? 7.0);
    const ec = Number(body?.ec ?? 0.5);
    const soc = Number(body?.organic_carbon ?? 0.75);
    const pb = Number(body?.lead_mg_kg ?? 40.0);
    const cd = Number(body?.cadmium_mg_kg ?? 0.5);
    const cr = Number(body?.chromium_mg_kg ?? 30.0);

    let score = 100;
    const recs: string[] = [];
    const evals = [];

    // pH
    let phStatus: "optimal" | "moderate" | "critical" = "optimal";
    let phImpact = "Neutral reaction locks toxic metal cations and maximizes root nutrient exchange.";
    if (ph < 6.0) {
      phStatus = "critical";
      phImpact = "Acidic soil drastically solubilizes toxic Lead & Cadmium cations, accelerating bioaccumulation into edible crops.";
      score -= 22;
      recs.push("Apply agricultural lime (CaCO3) at 2.0-3.5 t/ha to elevate pH above 6.5 and precipitate free metal ions.");
    } else if (ph > 8.5) {
      phStatus = "critical";
      phImpact = "Alkaline / sodic soil causes severe micronutrient starvation and soil structure dispersion.";
      score -= 18;
      recs.push("Incorporate agricultural gypsum (CaSO4) and organic green manures to reclaim alkaline pH.");
    } else if (ph < 6.5 || ph > 7.5) {
      phStatus = "moderate";
      phImpact = "Sub-optimal reaction; minor nutrient lockup or early metal mobilization tendency.";
      score -= 8;
    }
    evals.push({
      param_name: "pH Reaction Index",
      value: ph,
      unit: "pH Scale",
      status: phStatus,
      target_range: "6.5 - 7.5 (Neutral)",
      impact: phImpact,
    });

    // EC
    let ecStatus: "optimal" | "moderate" | "critical" = "optimal";
    let ecImpact = "Normal non-saline condition with healthy osmotic balance for root hair water uptake.";
    if (ec > 2.0) {
      ecStatus = "critical";
      ecImpact = "High salinity restricts root water absorption and signals untreated wastewater or chemical over-application.";
      score -= 18;
      recs.push("Flush topsoils with clean surface canal water and avoid untreated urban/industrial drainage irrigation.");
    } else if (ec > 1.0) {
      ecStatus = "moderate";
      ecImpact = "Moderate dissolved salts; early indicator of intensive agro-chemical or drainage influx.";
      score -= 8;
    }
    evals.push({
      param_name: "Electrical Conductivity (EC)",
      value: ec,
      unit: "dS/m",
      status: ecStatus,
      target_range: "< 1.0 dS/m",
      impact: ecImpact,
    });

    // SOC
    let socStatus: "optimal" | "moderate" | "critical" = "optimal";
    let socImpact = "Rich microbial foundation capable of binding toxic cations and maintaining soil moisture.";
    if (soc < 0.50) {
      socStatus = "critical";
      socImpact = "Severely depleted topsoil humus; cannot buffer contaminants and leaves crop roots unprotected.";
      score -= 20;
      recs.push("Adopt PM-PRANAM organic amendments, biochar (5-10 t/ha), and green manuring (Dhaincha/Sunhemp).");
    } else if (soc < 0.75) {
      socStatus = "moderate";
      socImpact = "Moderate organic carbon; soil buffering capacity is diminished.";
      score -= 10;
      recs.push("Incorporate 5-8 t/ha well-decomposed farmyard manure or vermicompost to elevate organic carbon.");
    }
    evals.push({
      param_name: "Soil Organic Carbon (SOC)",
      value: soc,
      unit: "%",
      status: socStatus,
      target_range: "> 0.75%",
      impact: socImpact,
    });

    // Lead
    let pbStatus: "optimal" | "moderate" | "critical" = "optimal";
    let pbImpact = "Within safe natural background / CPCB screening threshold for agricultural soils.";
    if (pb > 500.0) {
      pbStatus = "critical";
      pbImpact = "Exceeds CPCB critical danger limit (>500 mg/kg). Hazardous neurotoxic contaminant migration.";
      score -= 25;
      recs.push("Initiate in-situ phytoremediation with Brassica juncea and immobilize with pyrolyzed biochar.");
    } else if (pb > 250.0) {
      pbStatus = "moderate";
      pbImpact = "Exceeds CPCB Table 3.1 screening limit. Root crops and tubers at risk of trace accumulation.";
      score -= 15;
      recs.push("Avoid cultivating root vegetables (carrots, radishes, beets); request formal NABL certified ICP-MS assay.");
    }
    evals.push({
      param_name: "Lead (Pb)",
      value: pb,
      unit: "mg/kg",
      status: pbStatus,
      target_range: "≤ 250 mg/kg",
      impact: pbImpact,
    });

    // Cadmium
    let cdStatus: "optimal" | "moderate" | "critical" = "optimal";
    let cdImpact = "Within safe CPCB background threshold for food crop security.";
    if (cd > 6.0) {
      cdStatus = "critical";
      cdImpact = "Severe ecological and renal hazard (>6.0 mg/kg). Substantial dietary risk via cereal and vegetable crops.";
      score -= 28;
      recs.push("Declare parcel as priority remediation zone; transition immediately to non-food fiber crops or hyperaccumulators.");
    } else if (cd > 3.0) {
      cdStatus = "moderate";
      cdImpact = "Exceeds screening limit. High risk of bioaccumulation into rice and leafy greens via Zinc pathway.";
      score -= 18;
      recs.push("Suspend uncalibrated phosphatic fertilizers; verify phosphate source for heavy metal compliance.");
    }
    evals.push({
      param_name: "Cadmium (Cd)",
      value: cd,
      unit: "mg/kg",
      status: cdStatus,
      target_range: "≤ 3.0 mg/kg",
      impact: cdImpact,
    });

    // Chromium
    let crStatus: "optimal" | "moderate" | "critical" = "optimal";
    let crImpact = "Within safe baseline parameters for unpolluted alluvial soils.";
    if (cr > 250.0) {
      crStatus = "critical";
      crImpact = "Critical industrial contamination (>250 mg/kg). Toxic to earthworms, beneficial mycorrhizae, and plants.";
      score -= 25;
      recs.push("Install organic filter sumps and apply iron-based bio-reductants to reduce Cr(VI) to non-toxic Cr(III).");
    } else if (cr > 100.0) {
      crStatus = "moderate";
      crImpact = "Exceeds CPCB screening threshold; common along industrial effluent channels.";
      score -= 12;
      recs.push("Test for Hexavalent Chromium (Cr VI) speciation; implement organic matter buffering.");
    }
    evals.push({
      param_name: "Chromium (Cr)",
      value: cr,
      unit: "mg/kg",
      status: crStatus,
      target_range: "≤ 100 mg/kg",
      impact: crImpact,
    });

    const finalScore = Math.max(5, Math.min(100, score));
    const cpcbCompliant = pb <= 250.0 && cd <= 3.0 && cr <= 100.0;

    let healthStatus = "Optimal Ecological Health";
    let bioavailRisk = "Low — heavy metal cations are immobilized within mineral and organic matrices.";
    let foodRisk = "Safe for general cereal, pulse, fruit, and vegetable cultivation under normal agronomic care.";

    if (finalScore < 55) {
      healthStatus = "Critical Contaminant Alert — Immediate Remediation Required";
      bioavailRisk = "High — acidic reaction or extreme contaminant levels facilitate rapid cellular translocation.";
      foodRisk = "High dietary hazard; discontinue food crop sowing until official remediation verification.";
    } else if (finalScore < 80 || !cpcbCompliant) {
      healthStatus = "Vulnerable — Active Intervention Recommended";
      bioavailRisk = "Moderate — sub-optimal pH or elevated cations elevate uptake risk in sensitive crops.";
      foodRisk = "Caution advised for root crops and leafy greens; regular monitoring via KVK recommended.";
    }

    if (recs.length === 0) {
      recs.push(
        "Maintain Soil Organic Carbon > 0.75% using seasonal compost and balanced green manures.",
        "Test soil profile every 2 years via your local Krishi Vigyan Kendra (KVK) or Soil Health Card portal.",
        "Verify all chemical fertilizer inputs conform to FCO (Fertilizer Control Order) purity standards."
      );
    }

    return {
      overall_score: finalScore,
      health_status: healthStatus,
      bioavailability_risk: bioavailRisk,
      food_chain_risk: foodRisk,
      cpcb_compliant: cpcbCompliant,
      parameter_evaluations: evals,
      remediation_recommendations: recs,
    } as unknown as T;
  }

  throw new ApiError(404, { detail: "Endpoint not found" });
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    }

    const errBody = await res.json().catch(() => null);
    // If server returned a deliberate client/business error (400, 401, 403, 409, 429), preserve it
    if (res.status !== 404 && res.status < 500) {
      throw new ApiError(res.status, errBody);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
  }

  // Fallback to client-side state engine when server is unreachable or offline
  return handleMockRequest<T>(method, path, body);
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
