import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  BookOpen,
  Sprout,
  Activity,
  Layers,
  Sparkles,
  Printer,
  Sliders,
  Check,
  X,
  HelpCircle,
  Award,
  RefreshCw,
  Info,
} from "lucide-react";
import EvidenceBadge from "@/components/EvidenceBadge";
import SiteShell from "@/components/SiteShell";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import type { DigitalRecordAuditResponse } from "@/lib/types";

// UNIVERSAL NARRATIVE CHAPTERS - No specific city, district, or state names
const chapters = [
  {
    number: "01",
    title: "The Living Grain & Topsoil Matrix",
    type: "Soil Organic Matter & Physical Foundation",
    copy: "Under a microscope, a single grain of arable topsoil is not dead rock. It is a vibrant ecological architecture composed of weathered silicate minerals, humidified organic carbon, pore pockets holding air and moisture, and millions of beneficial mycorrhizae. In balanced natural topsoil, this particle buffers nutrients and breathes life into agricultural root systems.",
    digitalRecord: "Digital Soil Health Card (SHC) baseline: Organic Carbon (SOC) > 0.75%, neutral pH (6.5 - 7.5), and optimal cation exchange capacity.",
    recordType: "MoA&FW Digital Soil Parameters",
    recordUrl: "https://soilhealth.dac.gov.in",
    image: "https://images.unsplash.com/photo-1654035627370-f31753ad0bce?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
  {
    number: "02",
    title: "The Infiltration & Effluent Pathway",
    type: "Transport Dynamics & Drainage Influx",
    copy: "When seasonal rainfall or surface irrigation water washes across agricultural watersheds, it dissolves everything along its course. If peri-urban drainage channels carry unsegregated industrial runoff, municipal waste leachate, or excessive phosphatic fertilizers containing trace cadmium, these dissolved heavy metal cations adhere electrostatically to the surface of the soil particle.",
    digitalRecord: "CPCB Screening Thresholds (CPCB/HAZWaste/38/2020): Identifies critical migration zones where Lead exceeds 250 mg/kg or Chromium exceeds 100 mg/kg.",
    recordType: "CPCB Contaminated Sites Protocol",
    recordUrl: "https://cpcb.nic.in",
    image: "https://images.unsplash.com/photo-1771149437905-70f07327b3f2?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
  {
    number: "03",
    title: "Rhizosphere Vulnerability & The Invisible Trap",
    type: "Biological Uptake & Food Safety Interface",
    copy: "Heavy metal contamination is notoriously deceptive because it rarely causes immediate visible discoloration. To the human eye, an alluvial field may look fertile and lush green. However, root hairs of cereal and vegetable crops cannot always differentiate between essential minerals and toxic analogs—absorbing Cadmium in place of Zinc, or Lead in place of Calcium—bioaccumulating into edible grains and vegetables.",
    digitalRecord: "NABL Accredited Laboratory Assay & FSSAI Standards: Requires ICP-MS (Inductively Coupled Plasma Mass Spectrometry) testing to detect sub-surface trace elements.",
    recordType: "NABL Laboratory Standards",
    recordUrl: "https://nabl-india.org",
    image: "https://images.pexels.com/photos/11755628/pexels-photo-11755628.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    number: "04",
    title: "Empowerment Through Digital Records & Action",
    type: "Citizen Awareness & Verified Remediation",
    copy: "True environmental stewardship begins when guesswork is replaced by digital verification. By retrieving their official 12-parameter Digital Soil Health Card, participating in the PM-PRANAM organic amendment initiatives, and planting deep-rooted hyperaccumulators or incorporating pyrolyzed biochar, communities can actively arrest contaminant mobility and restore biological vitality.",
    digitalRecord: "National Krishi Vigyan Kendra (KVK) Portal & QR-coded Digital Soil Testing: Empowers agriculturalists to monitor micronutrient replenishment every 2 years.",
    recordType: "ICAR Digital Extension Registry",
    recordUrl: "https://kvk.icar.gov.in",
    image: "https://images.pexels.com/photos/6966593/pexels-photo-6966593.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

// REAL-WORLD DIGITAL RECORD SAMPLE PRESETS FOR AWARENESS
const RECORD_PRESETS = [
  {
    id: "balanced",
    name: "Arable Farmland Baseline",
    category: "Optimal Ecological Standard",
    description: "Uncontaminated arable soil with healthy humus matrix and neutral buffering capacity.",
    ph: 7.1,
    ec: 0.45,
    organic_carbon: 0.85,
    lead: 42,
    cadmium: 0.5,
    chromium: 28,
  },
  {
    id: "effluent",
    name: "Peri-Urban Drainage Influx",
    category: "High Contaminant Risk",
    description: "Agricultural tract receiving untreated municipal and light-industrial drainage channel runoff.",
    ph: 6.2,
    ec: 2.6,
    organic_carbon: 0.42,
    lead: 380,
    cadmium: 4.8,
    chromium: 220,
  },
  {
    id: "acidified",
    name: "Acidified & Depleted Soil",
    category: "Elevated Bioavailability Hazard",
    description: "Low pH mobilizes toxic cations into soil solution, dramatically elevating crop root uptake.",
    ph: 5.1,
    ec: 1.8,
    organic_carbon: 0.32,
    lead: 190,
    cadmium: 3.4,
    chromium: 65,
  },
  {
    id: "saline",
    name: "Saline Intensive Agrochemical Plain",
    category: "Chemical Stress & Cadmium Load",
    description: "Decades of excessive rock-phosphate fertilizer application leaving residual cadmium and salt stress.",
    ph: 8.6,
    ec: 3.2,
    organic_carbon: 0.45,
    lead: 85,
    cadmium: 5.2,
    chromium: 45,
  },
];

// COMPREHENSIVE 12-PARAMETER SHC & CONTAMINANT REGISTRY
type RegistryTab = "macro" | "physical" | "micro" | "contaminants";

interface RegistryParam {
  param: string;
  code: string;
  category: RegistryTab;
  target: string;
  danger: string;
  testingMethod: string;
  portal: string;
  impact: string;
  sourceUrl: string;
}

const REGISTRY_PARAMETERS: RegistryParam[] = [
  // Physical & Chemistry
  {
    param: "Soil Organic Carbon (SOC)",
    code: "SHC-P12",
    category: "physical",
    target: "> 0.75%",
    danger: "< 0.50% (Severely Depleted)",
    testingMethod: "Walkley & Black Rapid Titration Method",
    portal: "Soil Health Card (Parameter 12)",
    impact: "Drives soil microbial life, moisture retention, and binds toxic heavy metal cations to prevent absorption by crop roots.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "pH Reaction Index",
    code: "SHC-P10",
    category: "physical",
    target: "6.5 - 7.5 (Neutral)",
    danger: "< 6.0 (Acidic) or > 8.5 (Alkaline)",
    testingMethod: "Potentiometric Glass Electrode (1:2 Soil:Water suspension)",
    portal: "Soil Health Card (Parameter 10)",
    impact: "Acidic soils (pH < 6.0) solubilize heavy metals like Lead and Cadmium into soil water solution, drastically increasing toxic absorption into food crops.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Electrical Conductivity (EC)",
    code: "SHC-P11",
    category: "physical",
    target: "< 1.0 dS/m (Normal Non-Saline)",
    danger: "> 2.0 dS/m (Saline Stress)",
    testingMethod: "Conductivity Bridge (1:2 Soil:Water extract at 25°C)",
    portal: "Soil Health Card (Parameter 11)",
    impact: "Measures total soluble salt concentration. High EC indicates excessive synthetic fertilizer application or untreated industrial wastewater infiltration.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  // Macro & Secondary Nutrients
  {
    param: "Available Nitrogen (N)",
    code: "SHC-P01",
    category: "macro",
    target: "280 - 560 kg/ha (Medium / Balanced)",
    danger: "< 280 kg/ha (Deficient) or > 560 kg/ha (Excessive)",
    testingMethod: "Alkaline Permanganate Distillation (Subbiah & Asija)",
    portal: "Soil Health Card (Parameter 01)",
    impact: "Primary vegetative growth nutrient. Excessive uncalibrated urea applications acidify topsoil and increase heavy metal leaching into shallow groundwater aquifers.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Available Phosphorus (P)",
    code: "SHC-P02",
    category: "macro",
    target: "10 - 25 kg/ha (Optimal)",
    danger: "> 25 kg/ha (Over-applied / Cadmium Risk)",
    testingMethod: "Olsen's Extractable Method (0.5 M NaHCO3 at pH 8.5)",
    portal: "Soil Health Card (Parameter 02)",
    impact: "Essential for root branching and energy transfer. Low-grade rock phosphate fertilizers often carry natural Cadmium impurities that accumulate permanently in arable soils.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Available Potassium (K)",
    code: "SHC-P03",
    category: "macro",
    target: "110 - 280 kg/ha (Optimal)",
    danger: "< 110 kg/ha (Low Resistance)",
    testingMethod: "Neutral Normal Ammonium Acetate Extraction (Flame Photometer)",
    portal: "Soil Health Card (Parameter 03)",
    impact: "Regulates plant stomatal conductance and disease resistance. Critical for maintaining osmotic pressure in drought conditions.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Available Sulphur (S)",
    code: "SHC-P04",
    category: "macro",
    target: "> 10.0 ppm",
    danger: "< 10.0 ppm (Secondary Deficiency)",
    testingMethod: "0.15% CaCl2 Extractable Turbidimetric Spectrophotometry",
    portal: "Soil Health Card (Parameter 04)",
    impact: "Crucial for oilseed synthesis and chlorophyll formation. Low sulphur reduces plant protein synthesis and root vitality.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  // Micronutrients
  {
    param: "Available Zinc (Zn)",
    code: "SHC-P05",
    category: "micro",
    target: "> 0.60 ppm",
    danger: "< 0.60 ppm (Severe Crop Chlorosis)",
    testingMethod: "DTPA Extraction via Atomic Absorption Spectrophotometry (AAS)",
    portal: "Soil Health Card (Parameter 05)",
    impact: "Enzymatic catalyst. When zinc is deficient, crop root channels mistake toxic Cadmium for Zinc, magnifying food chain contamination.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Available Boron (B)",
    code: "SHC-P09",
    category: "micro",
    target: "> 0.50 ppm",
    danger: "< 0.50 ppm (Flower & Fruit Drop)",
    testingMethod: "Hot Water Soluble Azomethine-H Colorimetric Method",
    portal: "Soil Health Card (Parameter 09)",
    impact: "Vital for pollen germination, cell wall integrity, and sugar translocation across root-to-grain pathways.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  {
    param: "Available Iron (Fe)",
    code: "SHC-P06",
    category: "micro",
    target: "> 4.5 ppm",
    danger: "< 4.5 ppm (Interveinal Chlorosis)",
    testingMethod: "DTPA Extraction via AAS",
    portal: "Soil Health Card (Parameter 06)",
    impact: "Essential for electron transport in photosynthesis and respiratory enzyme cascades.",
    sourceUrl: "https://soilhealth.dac.gov.in",
  },
  // Heavy Metal Contaminants
  {
    param: "Lead (Pb) Screening Limit",
    code: "CPCB-Pb",
    category: "contaminants",
    target: "≤ 250 mg/kg",
    danger: "> 500 mg/kg (Critical Contamination)",
    testingMethod: "Acid Digestion (USEPA 3050B) with ICP-MS Analysis",
    portal: "CPCB Screening Guidelines (Table 3.1)",
    impact: "Potent neurotoxic heavy metal originating from battery recycling slag, leaded fuel residues, and industrial effluent. Bioaccumulates in root tubers and leafy crops.",
    sourceUrl: "https://cpcb.nic.in",
  },
  {
    param: "Cadmium (Cd) Threshold",
    code: "CPCB-Cd",
    category: "contaminants",
    target: "≤ 3.0 mg/kg",
    danger: "> 6.0 mg/kg (Severe Ecological Hazard)",
    testingMethod: "ICP-MS (Inductively Coupled Plasma Mass Spectrometry)",
    portal: "CPCB Screening Guidelines (Table 3.1)",
    impact: "Renal toxin and bone-mineral depleting agent. Enters topsoils via low-grade phosphate fertilizers. Easily translocates into rice grains and spinach leaves.",
    sourceUrl: "https://cpcb.nic.in",
  },
  {
    param: "Chromium (Cr) Screening Limit",
    code: "CPCB-Cr",
    category: "contaminants",
    target: "≤ 100 mg/kg",
    danger: "> 250 mg/kg (Hazardous Remediation Required)",
    testingMethod: "Total Cr by ICP-MS; Cr(VI) speciation by Ion Chromatography",
    portal: "CPCB Screening Guidelines (Table 3.1)",
    impact: "Industrial electroplating and tanning byproduct. Hexavalent form Cr(VI) is highly carcinogenic, destroys beneficial earthworms, and causes soil infertility.",
    sourceUrl: "https://cpcb.nic.in",
  },
  {
    param: "Arsenic (As) Screening Limit",
    code: "CPCB-As",
    category: "contaminants",
    target: "≤ 20 mg/kg",
    danger: "> 50 mg/kg (Critical Toxicity)",
    testingMethod: "Hydride Generation AAS / ICP-MS",
    portal: "CPCB Contaminated Sites Registry",
    impact: "Carcinogenic metalloid. Translocates rapidly into paddy rice through flooded rhizosphere silica channels, causing chronic multi-organ damage.",
    sourceUrl: "https://cpcb.nic.in",
  },
  {
    param: "Nickel (Ni) Screening Limit",
    code: "CPCB-Ni",
    category: "contaminants",
    target: "≤ 75 mg/kg",
    danger: "> 150 mg/kg (Phytotoxic Hazard)",
    testingMethod: "DTPA / Total Acid Digestion via ICP-MS",
    portal: "CPCB Screening Guidelines (Table 3.1)",
    impact: "Common in metal-finishing corridors. Restricts seed germination, inhibits root elongation, and provokes human allergic contact dermatitis.",
    sourceUrl: "https://cpcb.nic.in",
  },
];

// CITIZEN AWARENESS QUIZ
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Can toxic heavy metals like Cadmium or Lead be identified by visual color or odor in arable topsoil?",
    options: [
      { text: "Yes, contaminated soil always looks purple or smells like sulphur.", correct: false, reason: "Incorrect. Heavy metals are completely invisible and odorless at dangerous agronomic concentrations." },
      { text: "No, topsoil can appear lush and fertile while containing toxic concentrations, requiring ICP-MS laboratory testing.", correct: true, reason: "Correct! Heavy metals do not cause obvious color changes. Crops can appear green while bioaccumulating toxic levels." },
      { text: "Only when mixed with sandy soil.", correct: false, reason: "Incorrect. Texture does not reveal trace chemical contamination to the naked eye." },
    ],
  },
  {
    id: 2,
    question: "Why does an acidic soil reaction (pH < 6.0) dramatically increase heavy metal danger to human food safety?",
    options: [
      { text: "Acidic moisture breaks down metals into edible vitamins.", correct: false, reason: "Incorrect. Heavy metals are elemental toxins and cannot become vitamins." },
      { text: "Acidic soil dissolves heavy metals into free ionic cations, allowing crop root hairs to absorb them at accelerated rates.", correct: true, reason: "Correct! Low pH mobilizes heavy metals into soil water solution, bypassing natural root exclusion barriers." },
      { text: "Acidic soil prevents any rain from entering the ground.", correct: false, reason: "Incorrect. Acidity affects chemical speciation and solubility, not precipitation infiltration." },
    ],
  },
  {
    id: 3,
    question: "What is the most effective biological soil parameter to buffer against contaminant uptake into food crops?",
    options: [
      { text: "Maintaining Soil Organic Carbon (SOC) > 0.75% and incorporating pyrolyzed biochar.", correct: true, reason: "Correct! Organic humus and biochar have massive surface area and negative charges that bind toxic cations electrostatically." },
      { text: "Applying twice the recommended dose of synthetic urea.", correct: false, reason: "Incorrect. Excess urea actually acidifies soil and increases metal mobility." },
      { text: "Removing all earthworms and soil microorganisms.", correct: false, reason: "Incorrect. Beneficial biology helps stabilize soil aggregation." },
    ],
  },
];

export default function Story() {
  const [chapter, setChapter] = useState(0);
  const [selectedRegistryTab, setSelectedRegistryTab] = useState<RegistryTab>("physical");
  const [selectedParam, setSelectedParam] = useState<RegistryParam>(REGISTRY_PARAMETERS[0]);

  // Digital Record Audit Tool State
  const [selectedPresetId, setSelectedPresetId] = useState("balanced");
  const [ph, setPh] = useState(7.1);
  const [ec, setEc] = useState(0.45);
  const [soc, setSoc] = useState(0.85);
  const [lead, setLead] = useState(42);
  const [cadmium, setCadmium] = useState(0.5);
  const [chromium, setChromium] = useState(28);
  const [auditResult, setAuditResult] = useState<DigitalRecordAuditResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Awareness Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizExplanations, setShowQuizExplanations] = useState<Record<number, boolean>>({});

  const active = chapters[chapter];

  // Filtered registry parameters
  const filteredParams = useMemo(() => {
    return REGISTRY_PARAMETERS.filter((p) => p.category === selectedRegistryTab);
  }, [selectedRegistryTab]);

  // Apply Preset Values
  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = RECORD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setPh(preset.ph);
    setEc(preset.ec);
    setSoc(preset.organic_carbon);
    setLead(preset.lead);
    setCadmium(preset.cadmium);
    setChromium(preset.chromium);

    // Run audit
    runAudit(preset.ph, preset.ec, preset.organic_carbon, preset.lead, preset.cadmium, preset.chromium);
  };

  // Run Real-Time Audit
  const runAudit = async (
    targetPh = ph,
    targetEc = ec,
    targetSoc = soc,
    targetLead = lead,
    targetCadmium = cadmium,
    targetChromium = chromium
  ) => {
    setIsAuditing(true);
    try {
      const res = await apiPost<DigitalRecordAuditResponse>("/digital-record/audit", {
        ph: targetPh,
        ec: targetEc,
        organic_carbon: targetSoc,
        lead_mg_kg: targetLead,
        cadmium_mg_kg: targetCadmium,
        chromium_mg_kg: targetChromium,
      });
      setAuditResult(res);
    } catch (err) {
      console.error("Audit error:", err);
      toast.error("Could not complete digital audit. Please verify input parameters.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Run audit on first mount if not yet evaluated
  useMemo(() => {
    if (!auditResult) {
      runAudit(7.1, 0.45, 0.85, 42, 0.5, 28);
    }
  }, []);

  // Print / Save Digital Record Card
  const handlePrintCertificate = () => {
    window.print();
  };

  // Quiz Answer Handler
  const handleAnswerQuiz = (qId: number, optIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setShowQuizExplanations((prev) => ({ ...prev, [qId]: true }));
  };

  return (
    <SiteShell title="Interactive Field Stories">
      <div data-testid="story-page" className="space-y-14">
        {/* SECTION 1: HEADER & UNIVERSAL EVIDENCE BANNER */}
        <section data-testid="story-heading" className="border-b border-ink/15 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta flex items-center gap-2">
                <BookOpen size={13} /> Narrative 05 / Universal Soil Science & Digital Record Awareness Suite
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-5xl lg:text-6xl text-ink leading-tight">
                The Journey of a <em className="text-leaf">Living Soil Grain.</em>
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
                Follow an agricultural topsoil particle through mineral baseline equilibrium, invisible contaminant transport, and discover how official digital records empower citizens to verify soil safety.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <EvidenceBadge status="verified" />
              <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                Grounded in CPCB Standards & Digital Soil Health Card Protocols
              </span>
            </div>
          </div>

          {/* Universal Scope Guarantee Banner */}
          <div className="mt-6 flex items-start gap-3 rounded border border-leaf/30 bg-leaf/10 p-3.5 text-xs text-ink/90">
            <ShieldCheck size={18} className="text-leaf shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-mono uppercase text-leaf block text-[11px] tracking-wider">Universal Agro-Ecosystem Standard:</strong>
              <span>
                This scientific narrative and digital record audit tool represent universal topsoil mechanics, mineral buffering, and standardized national regulatory thresholds. It applies across all agricultural watersheds without singling out or referencing any individual city, district, or state.
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: CHAPTERED NARRATIVE WALKTHROUGH */}
        <section data-testid="story-module" className="ink-frame overflow-hidden bg-paper border-2 border-ink/20 grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Visual Art Frame */}
          <div className="relative min-h-[400px] overflow-hidden bg-ink flex flex-col justify-between p-6 sm:p-8">
            <img
              key={active.image}
              data-testid="story-chapter-image"
              src={active.image}
              alt="Universal soil and agricultural science visual"
              className="absolute inset-0 size-full object-cover opacity-60 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

            <div className="relative z-10 flex justify-between items-center text-paper font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-paper/20 backdrop-blur-xs uppercase tracking-wider">
                Chapter {active.number} / 04
              </span>
              <EvidenceBadge status="illustrative" />
            </div>

            <div className="relative z-10 text-paper space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/70 block">
                [ OFFICIAL DIGITAL CITATION REFERENCE ]
              </span>
              <p className="font-serif text-sm leading-relaxed text-paper/90 bg-ink/60 p-3 rounded backdrop-blur-xs border border-paper/10">
                {active.digitalRecord}
              </p>
              <a
                href={active.recordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-leaf hover:underline pt-1"
              >
                Access {active.recordType} <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Chapter Text & Navigation */}
          <div className="flex flex-col justify-between p-6 sm:p-10 space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <span data-testid="story-chapter-count" className="font-mono text-xs uppercase tracking-[0.16em] text-terracotta font-bold">
                  Phase {active.number} of 04
                </span>
                <span data-testid="story-chapter-type" className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {active.type}
                </span>
              </div>

              <h2 data-testid="story-chapter-title" className="mt-6 font-serif text-3xl sm:text-4xl text-ink leading-tight">
                {active.title}
              </h2>

              <p data-testid="story-chapter-copy" className="mt-5 text-sm sm:text-base leading-8 text-muted">
                {active.copy}
              </p>

              <div data-testid="story-chapter-note" className="mt-6 border-l-2 border-leaf bg-leaf/10 p-4 text-xs leading-relaxed text-ink rounded-r">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-leaf font-bold mb-1">
                  <ShieldCheck size={14} /> Scientific Grounding Note
                </div>
                <span>
                  This narrative illustrates published ICAR-NBSS&LUP soil profile dynamics and CPCB environmental guidelines without referencing individual farm parcels, cities, or specific states.
                </span>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between border-t border-ink/15 pt-5">
              <div className="flex gap-2">
                {chapters.map((item, index) => (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => setChapter(index)}
                    data-testid={`story-chapter-${index + 1}-button`}
                    className={`size-9 rounded-full border font-mono text-xs transition-all ${
                      chapter === index
                        ? "border-leaf bg-leaf text-paper font-bold shadow-xs scale-105"
                        : "border-ink/20 text-muted hover:border-leaf hover:text-ink"
                    }`}
                  >
                    {item.number}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChapter((chapter + chapters.length - 1) % chapters.length)}
                  data-testid="story-previous-button"
                  aria-label="Previous chapter"
                  className="ink-button border border-ink/20 px-3 py-2 text-ink hover:border-leaf"
                >
                  <ArrowLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setChapter((chapter + 1) % chapters.length)}
                  data-testid="story-next-button"
                  aria-label="Next chapter"
                  className="ink-button bg-leaf text-paper px-3 py-2 hover:bg-ink flex items-center gap-1.5"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INTERACTIVE DIGITAL SOIL RECORD AUDIT & HEALTH SIMULATOR */}
        <section data-testid="digital-record-auditor-section" className="ink-frame bg-paper p-6 sm:p-8 space-y-8 border-2 border-leaf/30">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta flex items-center gap-2">
                <Sparkles size={13} /> Interactive Citizen Tool / Digital Record Health Auditor
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink flex items-center gap-2 mt-1">
                <FileText className="text-leaf" size={28} /> Audit & Understand Any Digital Soil Record
              </h2>
              <p className="mt-2 text-sm text-muted max-w-2xl leading-6">
                Select a standard scenario or customize test parameters to instantly audit health status, heavy metal compliance (CPCB Table 3.1), and crop food chain safety.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="ink-button border border-ink/20 hover:border-leaf flex items-center gap-1.5 text-xs"
              >
                <Printer size={13} /> Print / Save Record Card
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted block">
              Step 1: Choose a Sample Digital Record or Enter Custom Data:
            </span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RECORD_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-4 rounded text-left border transition-all space-y-1.5 ${
                      isSelected
                        ? "border-leaf bg-leaf/10 dark:bg-leaf/20 shadow-xs ring-1 ring-leaf"
                        : "border-ink/15 bg-paper/60 hover:border-ink/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-terracotta">
                        {preset.category}
                      </span>
                      {isSelected && <CheckCircle2 size={14} className="text-leaf" />}
                    </div>
                    <p className="font-serif font-bold text-sm text-ink">{preset.name}</p>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">{preset.description}</p>
                    <div className="pt-1 font-mono text-[10px] text-ink/70 flex gap-2">
                      <span>pH: {preset.ph}</span>
                      <span>SOC: {preset.organic_carbon}%</span>
                      <span>Pb: {preset.lead} mg/kg</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameter Sliders / Custom Inputs */}
          <div className="grid gap-6 lg:grid-cols-2 bg-ink/5 p-5 rounded-sm border border-ink/10">
            {/* Left Col: Master Soil Reactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-ink flex items-center gap-1.5">
                  <Sliders size={14} className="text-leaf" /> Master Chemistry & Carbon Drivers
                </span>
                <span className="font-mono text-[10px] text-muted">SHC Parameters</span>
              </div>

              {/* pH Reaction */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>pH Reaction Index (Acidity/Alkalinity)</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${ph < 6.0 ? "bg-terracotta/20 text-terracotta" : ph <= 7.5 ? "bg-leaf/20 text-leaf" : "bg-amber/20 text-amber"}`}>
                    {ph.toFixed(1)} {ph < 6.0 ? "(Acidic - High Metal Mobility)" : ph <= 7.5 ? "(Optimal Neutral)" : "(Alkaline)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.5"
                  step="0.1"
                  value={ph}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPh(val);
                    setSelectedPresetId("custom");
                    runAudit(val, ec, soc, lead, cadmium, chromium);
                  }}
                  className="w-full accent-leaf cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>4.0 (Severe Acid)</span>
                  <span>6.5 - 7.5 (Optimal)</span>
                  <span>9.5 (Strong Alkaline)</span>
                </div>
              </div>

              {/* Electrical Conductivity (EC) */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Electrical Conductivity (EC - Salinity)</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${ec > 2.0 ? "bg-terracotta/20 text-terracotta" : "bg-leaf/20 text-leaf"}`}>
                    {ec.toFixed(2)} dS/m {ec > 2.0 ? "(Saline Stress)" : "(Normal Non-Saline)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={ec}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEc(val);
                    setSelectedPresetId("custom");
                    runAudit(ph, val, soc, lead, cadmium, chromium);
                  }}
                  className="w-full accent-leaf cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>0.1 (Fresh)</span>
                  <span>&lt; 1.0 (Optimal)</span>
                  <span>4.0 (Severe Salinity)</span>
                </div>
              </div>

              {/* Soil Organic Carbon (SOC) */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Soil Organic Carbon (SOC - Microbial Humus)</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${soc < 0.50 ? "bg-terracotta/20 text-terracotta" : soc >= 0.75 ? "bg-leaf/20 text-leaf" : "bg-amber/20 text-amber"}`}>
                    {soc.toFixed(2)}% {soc < 0.50 ? "(Depleted Buffer)" : soc >= 0.75 ? "(Rich Microbial Foundation)" : "(Moderate)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={soc}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSoc(val);
                    setSelectedPresetId("custom");
                    runAudit(ph, ec, val, lead, cadmium, chromium);
                  }}
                  className="w-full accent-leaf cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>0.1% (Barren)</span>
                  <span>&gt; 0.75% (Target)</span>
                  <span>2.0% (Forest Rich)</span>
                </div>
              </div>
            </div>

            {/* Right Col: Heavy Metal Contaminants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-ink flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-terracotta" /> Heavy Metal Contaminant Assays
                </span>
                <span className="font-mono text-[10px] text-muted">CPCB Table 3.1 Thresholds</span>
              </div>

              {/* Lead */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Lead (Pb) Concentration</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${lead > 250 ? "bg-terracotta/20 text-terracotta" : "bg-leaf/20 text-leaf"}`}>
                    {lead} mg/kg {lead > 500 ? "(Critical Hazard)" : lead > 250 ? "(Exceeds Screening)" : "(Safe Baseline)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={lead}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLead(val);
                    setSelectedPresetId("custom");
                    runAudit(ph, ec, soc, val, cadmium, chromium);
                  }}
                  className="w-full accent-terracotta cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>10 (Natural)</span>
                  <span>≤ 250 (CPCB Limit)</span>
                  <span>600+ (Extreme Industrial)</span>
                </div>
              </div>

              {/* Cadmium */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Cadmium (Cd) Concentration</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${cadmium > 3.0 ? "bg-terracotta/20 text-terracotta" : "bg-leaf/20 text-leaf"}`}>
                    {cadmium.toFixed(1)} mg/kg {cadmium > 6.0 ? "(Severe Renal Hazard)" : cadmium > 3.0 ? "(Exceeds Screening)" : "(Safe Baseline)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={cadmium}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCadmium(val);
                    setSelectedPresetId("custom");
                    runAudit(ph, ec, soc, lead, val, chromium);
                  }}
                  className="w-full accent-terracotta cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>0.1 (Pristine)</span>
                  <span>≤ 3.0 (CPCB Limit)</span>
                  <span>10.0 (Hazardous)</span>
                </div>
              </div>

              {/* Chromium */}
              <div className="space-y-1.5 bg-paper p-3 rounded border border-ink/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Chromium (Cr - Total) Concentration</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${chromium > 100 ? "bg-terracotta/20 text-terracotta" : "bg-leaf/20 text-leaf"}`}>
                    {chromium} mg/kg {chromium > 250 ? "(Carcinogenic Hazard)" : chromium > 100 ? "(Exceeds Screening)" : "(Safe Baseline)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="400"
                  step="5"
                  value={chromium}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setChromium(val);
                    setSelectedPresetId("custom");
                    runAudit(ph, ec, soc, lead, cadmium, val);
                  }}
                  className="w-full accent-terracotta cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>10 (Natural)</span>
                  <span>≤ 100 (CPCB Limit)</span>
                  <span>400 (Heavy Effluent)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Results Dashboard Card */}
          {auditResult && (
            <div data-testid="digital-audit-results-card" className="border-2 border-ink/20 p-6 sm:p-8 rounded-sm bg-paper space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-terracotta font-bold">
                    Official Digital Health Card Evaluation Result
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2">
                    {auditResult.health_status}
                  </h3>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase text-muted block">Soil Health Index</span>
                    <span className="font-mono text-xs text-muted">
                      {auditResult.cpcb_compliant ? "CPCB Standards Met" : "Contaminant Alert Triggered"}
                    </span>
                  </div>
                  <div
                    className={`size-16 rounded-full flex flex-col items-center justify-center font-mono font-bold text-paper text-xl shadow-xs ${
                      auditResult.overall_score >= 80
                        ? "bg-leaf"
                        : auditResult.overall_score >= 55
                        ? "bg-amber"
                        : "bg-terracotta"
                    }`}
                  >
                    {auditResult.overall_score}
                    <span className="text-[9px] font-normal leading-none">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Bioavailability & Food Safety Warnings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded border border-ink/15 bg-paper/60 space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block flex items-center gap-1.5">
                    <Activity size={13} className="text-terracotta" /> Bioavailability & Root Uptake Vulnerability:
                  </span>
                  <p className="font-serif text-sm text-ink leading-relaxed">
                    {auditResult.bioavailability_risk}
                  </p>
                </div>
                <div className="p-4 rounded border border-ink/15 bg-paper/60 space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block flex items-center gap-1.5">
                    <Sprout size={13} className="text-leaf" /> Crop & Food Chain Safety Advisory:
                  </span>
                  <p className="font-serif text-sm text-ink leading-relaxed">
                    {auditResult.food_chain_risk}
                  </p>
                </div>
              </div>

              {/* Parameter Table */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-ink">
                  Parameter-by-Parameter Compliance Breakdown:
                </span>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {auditResult.parameter_evaluations.map((p) => {
                    const isOpt = p.status === "optimal";
                    const isMod = p.status === "moderate";
                    return (
                      <div
                        key={p.param_name}
                        className={`p-3 rounded border text-xs font-mono space-y-1 ${
                          isOpt
                            ? "border-leaf/30 bg-leaf/5 text-ink"
                            : isMod
                            ? "border-amber/40 bg-amber/5 text-ink"
                            : "border-terracotta/40 bg-terracotta/10 text-ink"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] truncate">{p.param_name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isOpt
                                ? "bg-leaf/20 text-leaf"
                                : isMod
                                ? "bg-amber/20 text-amber"
                                : "bg-terracotta/20 text-terracotta"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted">
                          <span>Recorded: <strong>{p.value} {p.unit}</strong></span>
                          <span>Target: {p.target_range}</span>
                        </div>
                        <p className="text-[10px] text-muted font-serif leading-tight pt-1">
                          {p.impact}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Action Prescription */}
              <div className="border-t border-ink/15 pt-5 space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-terracotta flex items-center gap-1.5">
                  <ShieldCheck size={15} /> Actionable Scientific Remediation Recommendations:
                </span>
                <ul className="grid gap-2 text-sm leading-relaxed sm:grid-cols-2">
                  {auditResult.remediation_recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 bg-leaf/10 p-3 rounded border border-leaf/20 text-xs">
                      <span className="font-mono font-bold text-leaf text-sm shrink-0">0{i + 1}.</span>
                      <span className="text-ink/90">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: COMPLETE 12-PARAMETER SHC & CONTAMINANT REGISTRY EXPLORER */}
        <section data-testid="registry-explorer-section" className="ink-frame bg-paper p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta">
                AWARENESS TOOL 02 / OFFICIAL NATIONAL REGISTRY
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink flex items-center gap-2 mt-1">
                <Layers className="text-leaf" size={28} /> Complete 12-Parameter & Heavy Metal Reference
              </h2>
              <p className="mt-1 text-sm text-muted">
                Explore official Indian Government standards (Soil Health Card Scheme & CPCB Guidelines) across 4 core scientific categories.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-3">
            {[
              { id: "physical" as RegistryTab, label: "01. Soil Chemistry & Carbon (pH, EC, SOC)" },
              { id: "macro" as RegistryTab, label: "02. Primary & Secondary Nutrients (N, P, K, S)" },
              { id: "micro" as RegistryTab, label: "03. Essential Micronutrients (Zn, B, Fe)" },
              { id: "contaminants" as RegistryTab, label: "04. Toxic Heavy Metals (Pb, Cd, Cr, As, Ni)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRegistryTab(tab.id);
                  const firstOfTab = REGISTRY_PARAMETERS.find((p) => p.category === tab.id);
                  if (firstOfTab) setSelectedParam(firstOfTab);
                }}
                className={`font-mono text-xs px-3.5 py-2 rounded-sm transition-all border ${
                  selectedRegistryTab === tab.id
                    ? "bg-leaf text-paper border-leaf font-bold shadow-xs"
                    : "border-ink/15 text-muted hover:border-leaf hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Clickable parameter buttons */}
            <div className="grid gap-2.5">
              {filteredParams.map((p) => {
                const isSelected = selectedParam.param === p.param;
                return (
                  <button
                    key={p.param}
                    type="button"
                    onClick={() => setSelectedParam(p)}
                    className={`p-3.5 rounded text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-leaf bg-leaf/10 dark:bg-leaf/20 shadow-xs"
                        : "border-ink/15 bg-paper/60 hover:border-ink/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase font-bold text-terracotta">{p.code}</span>
                        <span className="font-serif font-bold text-sm text-ink">{p.param}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted">{p.portal}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-paper border border-ink/15 text-leaf">
                      {p.target}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Parameter Detailed Insight Card */}
            <div className="ink-frame bg-paper/90 p-6 rounded-sm border-2 border-leaf/40 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-terracotta font-bold">
                    [ OFFICIAL PROTOCOL ANALYSIS ]
                  </span>
                  <span className="font-mono text-[11px] text-muted">{selectedParam.code}</span>
                </div>

                <h3 className="mt-4 font-serif text-2xl font-bold text-ink">{selectedParam.param}</h3>
                <span className="font-mono text-xs text-muted block mt-1">{selectedParam.portal}</span>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded border border-leaf/30 bg-leaf/10">
                    <span className="text-[10px] uppercase text-muted block">Optimal Baseline</span>
                    <span className="font-bold text-leaf text-sm mt-0.5 block">{selectedParam.target}</span>
                  </div>
                  <div className="p-3 rounded border border-terracotta/30 bg-terracotta/10">
                    <span className="text-[10px] uppercase text-muted block">Alert / Critical Mark</span>
                    <span className="font-bold text-terracotta text-sm mt-0.5 block">{selectedParam.danger}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                    Certified Laboratory Testing Standard:
                  </span>
                  <p className="text-xs font-mono text-ink/80 bg-ink/5 p-2 rounded border border-ink/10">
                    {selectedParam.testingMethod}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                    Ecological & Food Crop Significance:
                  </span>
                  <p className="text-sm leading-relaxed text-ink/90 font-serif">
                    {selectedParam.impact}
                  </p>
                </div>
              </div>

              <div className="border-t border-ink/10 pt-4 flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-leaf">
                  <ShieldCheck size={14} /> Official Standard Registry
                </span>
                <a
                  href={selectedParam.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-leaf hover:underline uppercase tracking-wider"
                >
                  Verify Portal <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: CITIZEN AWARENESS & DIGITAL SOIL TESTING ACTION ROADMAP */}
        <section data-testid="citizen-action-checklist" className="ink-frame bg-paper p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta">AWARENESS TOOL 03 / CITIZEN ROADMAP</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink flex items-center gap-2 mt-1">
                <QrCode className="text-leaf" size={28} /> How to Use Official Digital Records in Real Life
              </h2>
              <p className="mt-1 text-sm text-muted">
                Follow these 4 practical steps to retrieve, verify, and remediate soil using published Government registries.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-ink/15 p-5 rounded-sm bg-paper/60 space-y-3">
              <span className="font-mono text-lg font-bold text-terracotta">01.</span>
              <h3 className="font-serif text-lg font-bold text-ink">Download Official Digital Card</h3>
              <p className="text-xs leading-relaxed text-muted">
                Visit <strong>soilhealth.dac.gov.in</strong> or your nearest Common Service Centre (CSC) to download your official 12-parameter digital card and verify the cryptographic QR code.
              </p>
              <a
                href="https://soilhealth.dac.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-leaf hover:underline pt-1"
              >
                Open SHC Portal <ExternalLink size={10} />
              </a>
            </div>

            <div className="border border-ink/15 p-5 rounded-sm bg-paper/60 space-y-3">
              <span className="font-mono text-lg font-bold text-terracotta">02.</span>
              <h3 className="font-serif text-lg font-bold text-ink">Consult KVK Soil Scientists</h3>
              <p className="text-xs leading-relaxed text-muted">
                Locate your nearest Krishi Vigyan Kendra (KVK) through <strong>kvk.icar.gov.in</strong> for agronomic advice on organic carbon replenishment and micronutrient balancing.
              </p>
              <a
                href="https://kvk.icar.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-leaf hover:underline pt-1"
              >
                KVK Directory <ExternalLink size={10} />
              </a>
            </div>

            <div className="border border-ink/15 p-5 rounded-sm bg-paper/60 space-y-3">
              <span className="font-mono text-lg font-bold text-terracotta">03.</span>
              <h3 className="font-serif text-lg font-bold text-ink">Request Certified NABL Assay</h3>
              <p className="text-xs leading-relaxed text-muted">
                If your parcel is near industrial drainage canals or major transport corridors, commission an ICP-MS heavy metal panel (Pb, Cd, Cr, As, Ni) from an accredited laboratory via <strong>nabl-india.org</strong>.
              </p>
              <a
                href="https://nabl-india.org"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-leaf hover:underline pt-1"
              >
                NABL Labs <ExternalLink size={10} />
              </a>
            </div>

            <div className="border border-ink/15 p-5 rounded-sm bg-paper/60 space-y-3">
              <span className="font-mono text-lg font-bold text-terracotta">04.</span>
              <h3 className="font-serif text-lg font-bold text-ink">Adopt PM-PRANAM Biochar</h3>
              <p className="text-xs leading-relaxed text-muted">
                Replace uncalibrated synthetic fertilizers with pyrolyzed biochar, green manures, and neem-coated urea to rebuild topsoil biological buffering capacity and immobilize toxic cations.
              </p>
              <a
                href="https://soilhealth.dac.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-leaf hover:underline pt-1"
              >
                Bio-Nutrient Info <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 6: INTERACTIVE DIGITAL SOIL LITERACY QUICK-CHECK (AWARENESS QUIZ) */}
        <section data-testid="soil-literacy-quiz-section" className="ink-frame bg-paper p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta">
                AWARENESS TOOL 04 / SOIL LITERACY QUICK-CHECK
              </p>
              <h2 className="font-serif text-3xl text-ink flex items-center gap-2 mt-1">
                <HelpCircle className="text-leaf" size={26} /> Test Your Soil Contamination Awareness
              </h2>
              <p className="mt-1 text-sm text-muted">
                Answer these 3 fundamental questions to understand why laboratory digital records are essential for food safety.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {QUIZ_QUESTIONS.map((q) => {
              const selectedOptIdx = selectedQuizAnswers[q.id];
              const isAnswered = selectedOptIdx !== undefined;

              return (
                <div key={q.id} className="border border-ink/15 p-5 rounded-sm bg-paper/70 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-terracotta font-bold">
                      Question 0{q.id}
                    </span>
                    <p className="font-serif font-bold text-base text-ink leading-snug">
                      {q.question}
                    </p>

                    <div className="space-y-2 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOptIdx === optIdx;
                        let btnStyle = "border-ink/15 bg-paper hover:border-ink/40 text-ink/80";
                        if (isAnswered) {
                          if (opt.correct) {
                            btnStyle = "border-leaf bg-leaf/10 text-leaf font-bold";
                          } else if (isChosen && !opt.correct) {
                            btnStyle = "border-terracotta bg-terracotta/10 text-terracotta font-bold";
                          } else {
                            btnStyle = "border-ink/10 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswerQuiz(q.id, optIdx)}
                            className={`w-full text-left p-3 rounded text-xs transition-all border ${btnStyle} flex items-start gap-2`}
                          >
                            <span className="font-mono font-bold mt-0.5">
                              {optIdx === 0 ? "A." : optIdx === 1 ? "B." : "C."}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Explanation */}
                  {showQuizExplanations[q.id] && selectedOptIdx !== undefined && (
                    <div
                      className={`p-3 rounded text-xs font-serif leading-relaxed border ${
                        q.options[selectedOptIdx].correct
                          ? "bg-leaf/10 border-leaf/30 text-ink"
                          : "bg-terracotta/10 border-terracotta/30 text-ink"
                      }`}
                    >
                      <div className="font-mono text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                        {q.options[selectedOptIdx].correct ? (
                          <span className="text-leaf flex items-center gap-1">
                            <Check size={12} /> Scientifically Accurate
                          </span>
                        ) : (
                          <span className="text-terracotta flex items-center gap-1">
                            <X size={12} /> Scientific Clarification
                          </span>
                        )}
                      </div>
                      <span>{q.options[selectedOptIdx].reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 7: DIRECT GOVERNMENT PORTAL VERIFICATION DIRECTORY */}
        <section data-testid="government-verification-directory" className="ink-frame bg-ink text-paper p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/15 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber font-bold">
                AWARENESS TOOL 05 / OFFICIAL REGISTRIES
              </p>
              <h2 className="font-serif text-3xl text-paper flex items-center gap-2 mt-1">
                <Award className="text-leaf" size={26} /> National Government Digital Verification Portals
              </h2>
              <p className="mt-1 text-sm text-paper/70">
                Direct access to verify soil health records, identify contaminated drainage corridors, and access accredited laboratories.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Digital Soil Health Card Portal",
                dept: "Dept of Agriculture & Farmers Welfare",
                desc: "Check farm soil test parameters, download 12-parameter certificates, and view recommended fertilizer doses.",
                url: "https://soilhealth.dac.gov.in",
                tag: "SHC Scheme",
              },
              {
                title: "CPCB Contaminated Sites Protocol",
                dept: "Central Pollution Control Board",
                desc: "Review screening thresholds (Table 3.1) for Lead, Cadmium, Chromium, and industrial effluent guidelines.",
                url: "https://cpcb.nic.in",
                tag: "CPCB HAZWaste",
              },
              {
                title: "National KVK Portal",
                dept: "Indian Council of Agricultural Research (ICAR)",
                desc: "Connect with district agricultural scientists for soil organic matter restoration and lime/gypsum application advice.",
                url: "https://kvk.icar.gov.in",
                tag: "ICAR Extension",
              },
              {
                title: "NABL Lab Accreditation Portal",
                dept: "Quality Council of India",
                desc: "Locate certified testing laboratories equipped with ICP-MS instruments for precise heavy metal trace analysis.",
                url: "https://nabl-india.org",
                tag: "NABL Certified",
              },
            ].map((item) => (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded border border-paper/15 bg-paper/5 hover:bg-paper/10 transition-colors flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase text-amber tracking-wider block">
                    {item.tag}
                  </span>
                  <h3 className="font-serif text-base font-bold text-paper group-hover:text-leaf transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-mono text-[10px] text-paper/60">{item.dept}</p>
                  <p className="text-xs text-paper/75 leading-relaxed pt-1">{item.desc}</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-leaf inline-flex items-center gap-1">
                  Open Portal <ExternalLink size={10} />
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}