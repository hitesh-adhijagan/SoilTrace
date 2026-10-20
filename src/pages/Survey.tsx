import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Sprout,
  ArrowRight,
  Lock,
  Download,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  PhoneCall,
  Loader2,
  MessageSquareText,
  Zap,
  Radio,
  Info,
  Clock,
  Smartphone,
  Check,
  FileText,
  Image,
  Printer,
} from "lucide-react";
import EvidenceBadge from "@/components/EvidenceBadge";
import SiteShell from "@/components/SiteShell";
import { apiPost } from "@/lib/api";
import { downloadDossierAsPdf, downloadDossierAsJpg, printDossier } from "@/lib/dossierExporter";
import type {
  SurveySubmission,
  SurveySubmissionCreate,
  SendOtpResponse,
  VerifyOtpResponse,
  KnowledgeReport,
} from "@/lib/types";

const causeOptions = [
  ["industry", "Industrial factory effluents & heavy metal plumes"],
  ["agriculture", "Agricultural chemical inputs & fertilizer impurities (Cadmium)"],
  ["waste", "Unlined landfills & burning electronic scrap (E-waste)"],
  ["water", "Contaminated drain/canal water leaching into aquifers"],
  ["not-sure", "I am not sure of the exact factors"],
] as const;

export default function Survey() {
  const queryClient = useQueryClient();

  // Verification State
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [carrierDispatched, setCarrierDispatched] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<string>("simulated_sms");
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [showSmsSimulator, setShowSmsSimulator] = useState(false);
  const [showGatewayDetails, setShowGatewayDetails] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [phoneHash, setPhoneHash] = useState<string | null>(null);
  const [alreadySubmittedError, setAlreadySubmittedError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // WebOTP API: Auto-read SMS code on supported mobile devices
  useEffect(() => {
    if (!otpSent || isVerified) return;
    if (typeof window !== "undefined" && "OTPCredential" in window) {
      const ac = new AbortController();
      (navigator.credentials as any)
        ?.get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        })
        .then((cred: any) => {
          if (cred && cred.code) {
            setOtpCode(cred.code);
            verifyOtp(cred.code);
          }
        })
        .catch(() => {});
      return () => ac.abort();
    }
  }, [otpSent, isVerified]);

  // Survey Form State
  const [awareness, setAwareness] = useState<SurveySubmissionCreate["awareness"]>("some");
  const [causes, setCauses] = useState<SurveySubmissionCreate["causes"]>([]);
  const [practice, setPractice] = useState<SurveySubmissionCreate["practice"]>("sometimes");
  const [concernScore, setConcernScore] = useState(3);
  const [submitted, setSubmitted] = useState<SurveySubmission | null>(null);

  // Step 1: Send OTP Mutation
  const sendOtp = async () => {
    const clean = mobileNumber.replace(/\D/g, "").slice(-10);
    if (clean.length < 10) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (cooldown > 0) {
      toast.info(`Please wait ${cooldown} seconds before requesting a new OTP.`);
      return;
    }
    setIsSendingOtp(true);
    setAlreadySubmittedError(null);
    try {
      const res = await apiPost<SendOtpResponse>("/survey/send-otp", {
        mobile_number: clean,
      });

      if (res.already_submitted) {
        setAlreadySubmittedError(res.message);
        toast.error("This mobile number has already completed the survey.");
      } else {
        setOtpSent(true);
        setCooldown(res.cooldown_seconds || 60);
        setCarrierDispatched(Boolean(res.carrier_dispatched));
        setDeliveryChannel(res.delivery_channel || (res.carrier_dispatched ? "sms_gateway" : "simulated_sms"));

        if (res.carrier_dispatched) {
          setShowSmsSimulator(false);
          setReceivedOtp(null);
          toast.success(res.message || `Official SMS dispatched to +91 ••••••${clean.slice(-4)}.`);
        } else if (res.demo_otp) {
          setReceivedOtp(res.demo_otp);
          setShowSmsSimulator(true);
          toast.success(`Verification code dispatched to +91 ••••••${clean.slice(-4)}.`);
        } else {
          toast.success("Verification code sent to your mobile.");
        }
      }
    } catch (err: any) {
      const msg = err?.body?.detail || "Could not send verification code.";
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async (codeToVerify?: string) => {
    const clean = mobileNumber.replace(/\D/g, "").slice(-10);
    const targetCode = (codeToVerify || otpCode).trim();
    if (!targetCode) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    if (targetCode.length < 6) {
      toast.error("Please enter all 6 digits of the OTP code.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await apiPost<VerifyOtpResponse>("/survey/verify-otp", {
        mobile_number: clean,
        otp: targetCode,
      });

      if (res.already_submitted && res.existing_submission) {
        toast.info("Survey previously submitted from this number. Loading your Knowledge Report.");
        setSubmitted(res.existing_submission);
      } else if (res.verified) {
        setIsVerified(true);
        setVerificationToken(res.verification_token);
        setPhoneHash(res.phone_hash);
        setShowSmsSimulator(false);
        toast.success("Mobile verified successfully! Survey form unlocked.");
      }
    } catch (err: any) {
      const msg = err?.body?.detail || "Invalid or expired OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const autoFillAndVerify = (code: string) => {
    setOtpCode(code);
    verifyOtp(code);
  };

  const handleOtpInputChange = (val: string) => {
    const sanitized = val.replace(/\D/g, "").slice(0, 6);
    setOtpCode(sanitized);
    if (sanitized.length === 6) {
      verifyOtp(sanitized);
    }
  };

  // Step 3: Submit Survey Mutation
  const mutation = useMutation({
    mutationFn: (payload: SurveySubmissionCreate) => apiPost<SurveySubmission>("/survey", payload),
    onSuccess: (result) => {
      setSubmitted(result);
      queryClient.invalidateQueries({ queryKey: ["survey-summary"] });
      toast.success("Your verified perspective was recorded.");
    },
    onError: (err: any) => {
      const msg = err?.body?.detail || "The response could not be recorded. Please try again.";
      toast.error(msg);
    },
  });

  const toggleCause = (cause: SurveySubmissionCreate["causes"][number]) => {
    setCauses((current) =>
      current.includes(cause) ? current.filter((item) => item !== cause) : [...current, cause]
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isVerified) {
      toast.error("Please verify your mobile number first.");
      return;
    }
    if (causes.length === 0) {
      toast.error("Please select at least one perceived factor.");
      return;
    }

    mutation.mutate({
      awareness,
      causes,
      practice,
      concern_score: concernScore,
      consent: true,
      verification_token: verificationToken || undefined,
      phone_hash: phoneHash || undefined,
    });
  };

  // Export Citizen Knowledge Dossier as PDF
  const handleDownloadPdf = async () => {
    if (!submitted) return;
    setIsDownloadingPdf(true);
    try {
      await downloadDossierAsPdf(submitted);
      toast.success("Citizen Knowledge Dossier downloaded as publication-ready PDF.");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF dossier. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Export Citizen Knowledge Dossier as JPG
  const handleDownloadJpg = async () => {
    if (!submitted) return;
    setIsDownloadingJpg(true);
    try {
      await downloadDossierAsJpg(submitted);
      toast.success("Citizen Knowledge Dossier downloaded as high-resolution JPG.");
    } catch (err) {
      console.error("JPG export error:", err);
      toast.error("Failed to generate JPG dossier. Please try again.");
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  // Print Citizen Knowledge Dossier
  const handlePrint = async () => {
    if (!submitted) return;
    try {
      await printDossier(submitted);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Could not launch print window. Please allow popups.");
    }
  };

  return (
    <SiteShell title="Farmer & Community Survey">
      <div data-testid="survey-page" className="max-w-5xl mx-auto space-y-10 pb-12">
        {/* Page Heading */}
        <div data-testid="survey-heading" className="border-b border-ink/15 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta flex items-center gap-1.5">
            <Lock size={12} /> Field Note 01 / Verified Community Pulse (1 Response Per Citizen)
          </p>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl lg:text-6xl text-ink leading-tight">
            What do you notice <br />
            <em className="text-leaf">about the ground?</em>
          </h1>
          <p className="mt-3.5 max-w-2xl text-sm sm:text-base leading-relaxed text-muted">
            Share your perspective to help map ground contamination awareness. To maintain strict statistical integrity, each citizen may submit only once via mobile OTP verification.
          </p>

          {/* Privacy Guarantee Banner */}
          <div className="mt-5 p-3.5 rounded border border-leaf/30 bg-leaf/10 flex items-start gap-3 text-xs leading-relaxed text-ink">
            <ShieldCheck size={18} className="text-leaf shrink-0 mt-0.5" />
            <div>
              <strong className="text-leaf block font-mono uppercase tracking-wider text-[11px] mb-0.5">
                Zero Personal Details Collected (Privacy by Design)
              </strong>
              <span>
                We strictly do <b>NOT</b> ask for your name, email, home address, or identity. Your mobile number is exclusively used for a quick cryptographic OTP verification to prevent duplicate bot submissions, and is never displayed publicly or shared.
              </span>
            </div>
          </div>

          <div className="mt-4">
            <EvidenceBadge status="verified" />
          </div>
        </div>

        {/* RESULTS PAGE: Detailed Knowledge & Action Report */}
        {submitted ? (
          <section data-testid="survey-success-state" className="space-y-8 animate-fadeIn">
            {/* Success Summary Header */}
            <div className="ink-frame bg-leaf p-8 text-paper sm:p-10 rounded shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p data-testid="survey-success-label" className="font-mono text-xs uppercase tracking-[0.2em] text-paper/80 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-amber" /> Verified Entry Recorded / {submitted.id.slice(0, 8)}
                </p>
                {submitted.knowledge_report && (
                  <span className="font-mono text-xs bg-paper/20 px-3 py-1 rounded font-bold border border-paper/30">
                    Awareness Tier: {submitted.knowledge_report.awareness_tier}
                  </span>
                )}
              </div>
              <h2 data-testid="survey-success-title" className="mt-4 font-serif text-3xl sm:text-4xl text-paper">
                Thank you for contributing your verified voice.
              </h2>
              <p data-testid="survey-success-copy" className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-paper/90">
                Your response is locked into the public dataset (1 submission per citizen). Below is your <b>Personalized Soil Health & Awareness Report</b> designed to fill critical knowledge gaps and provide actionable family safety advice.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="ink-button bg-paper text-ink hover:bg-amber flex items-center gap-2 font-mono text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isDownloadingPdf ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} className="text-terracotta" />
                  )}
                  Download PDF Dossier (.pdf)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isDownloadingJpg}
                  className="ink-button bg-paper/95 text-ink hover:bg-amber flex items-center gap-2 font-mono text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isDownloadingJpg ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Image size={14} className="text-leaf" />
                  )}
                  Download JPG Image (.jpg)
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="ink-button border border-paper/40 text-paper hover:bg-paper/10 flex items-center gap-2 font-mono text-xs cursor-pointer"
                >
                  <Printer size={13} /> Print Certificate
                </button>
                <Link
                  to="/dashboard"
                  data-testid="survey-success-dashboard-link"
                  className="ink-button border border-paper/50 text-paper hover:bg-paper/10 flex items-center gap-2 cursor-pointer font-mono text-xs"
                >
                  View Public Dashboard <ArrowRight size={13} />
                </Link>
                <Link
                  to="/experiment"
                  className="ink-button border border-paper/50 text-paper hover:bg-paper/10 flex items-center gap-2 cursor-pointer font-mono text-xs"
                >
                  <Sprout size={13} /> Simulator
                </Link>
              </div>
            </div>

            {/* DETAILED REPORT: Knowledge Gaps & Actionable Advice */}
            {submitted.knowledge_report && (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Left Column: What You Might Have Missed (Knowledge Gaps) */}
                <div className="space-y-6">
                  <div className="ink-frame bg-paper p-6 sm:p-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-terracotta font-bold">
                          REPORT SECTION 01
                        </span>
                        <h3 className="font-serif text-2xl text-ink flex items-center gap-2 mt-0.5">
                          <Lightbulb className="text-amber" size={20} /> Crucial Facts You Need to Know
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-leaf bg-leaf/10 px-2.5 py-1 rounded">
                        Score: {submitted.knowledge_report.score_percentage}%
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      Based on the answers you provided, our environmental chemistry model identified specific areas where additional awareness protects your family and farm:
                    </p>

                    {submitted.knowledge_report.knowledge_gaps.length > 0 ? (
                      <div className="space-y-3.5">
                        {submitted.knowledge_report.knowledge_gaps.map((gap, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded border border-ink/15 bg-paper/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center gap-2 font-bold text-terracotta font-mono">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>0{i + 1}. {gap.topic}</span>
                            </div>
                            <p className="text-muted leading-relaxed">
                              <b>Why it matters:</b> {gap.why_important}
                            </p>
                            <div className="p-2 rounded bg-leaf/10 border border-leaf/20 text-leaf font-mono text-[11px] flex items-start gap-1.5">
                              <Sprout size={13} className="shrink-0 mt-0.5" />
                              <span><b>Action Tip:</b> {gap.action_tip}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded border border-leaf/30 bg-leaf/10 text-xs text-leaf">
                        <span className="font-bold block">Excellent Comprehensive Knowledge!</span>
                        You correctly identified all major heavy metal contamination pathways. Share this knowledge with neighbors and local farmers.
                      </div>
                    )}
                  </div>

                  {/* Strengths Card */}
                  <div className="ink-frame bg-paper p-6 space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-leaf font-bold block">
                      REPORT SECTION 02 / What You Got Right
                    </span>
                    <h4 className="font-serif text-lg text-ink flex items-center gap-1.5">
                      <Sparkles className="text-amber" size={17} /> Your Identified Strengths
                    </h4>
                    <div className="space-y-1.5 text-xs text-ink/80 font-mono">
                      {submitted.knowledge_report.strengths.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-leaf shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Citizen Action Plan & Helplines */}
                <div className="space-y-6">
                  {/* Action Checklist */}
                  <div className="ink-frame bg-paper p-6 sm:p-7 space-y-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-terracotta font-bold block">
                      REPORT SECTION 03 / Next Steps
                    </span>
                    <h3 className="font-serif text-2xl text-ink flex items-center gap-2">
                      <BookOpen className="text-leaf" size={20} /> Practical Safety Plan
                    </h3>
                    <div className="space-y-2.5 text-xs text-ink/90">
                      {submitted.knowledge_report.action_recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded border border-ink/10 bg-paper/50">
                          <span className="font-mono font-bold text-leaf text-xs">0{i + 1}.</span>
                          <span className="leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Free Kisan Call Center Helpline Card */}
                  <div className="p-4 rounded border border-amber/30 bg-amber/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber font-bold font-serif text-base">
                      <PhoneCall size={18} /> Free National Kisan Call Center
                    </div>
                    <p className="text-xs text-ink/80 leading-relaxed">
                      Need free agricultural advice on fertilizer testing, safe crop rotation, or KVK lab testing in your district?
                    </p>
                    <div className="font-mono font-bold text-lg text-ink bg-paper/80 p-2 rounded border border-amber/20 text-center">
                      📞 Toll-Free: 1800-180-1551
                    </div>
                    <span className="text-[10px] text-muted block text-center">
                      Available 6:00 AM to 10:00 PM daily across all 22 Indian regional languages.
                    </span>
                  </div>

                  {/* Further Tools in SoilTrace */}
                  <div className="ink-frame bg-paper p-5 space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold block">
                      Recommended SoilTrace Tools
                    </span>
                    <div className="space-y-2 text-xs font-mono">
                      <Link
                        to="/story"
                        className="p-2.5 rounded border border-ink/15 hover:border-leaf flex items-center justify-between text-ink transition-colors block"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <ExternalLink size={13} className="text-leaf" /> Digital Soil Card Auditor
                        </span>
                        <span className="text-[10px] text-muted">Audit 12 parameters →</span>
                      </Link>
                      <Link
                        to="/experiment"
                        className="p-2.5 rounded border border-ink/15 hover:border-leaf flex items-center justify-between text-ink transition-colors block"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <ExternalLink size={13} className="text-leaf" /> Heavy Metal Soil Simulator
                        </span>
                        <span className="text-[10px] text-muted">Simulate CPCB decay →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Official Export Callout */}
            <div className="ink-frame bg-paper p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4 border border-ink/20 shadow-xs">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-leaf font-bold block">
                  OFFICIAL CITIZEN RECORD & VERIFICATION CERTIFICATE
                </span>
                <h4 className="font-serif text-xl sm:text-2xl text-ink">
                  Save Your Ground Contamination Knowledge Dossier
                </h4>
                <p className="text-xs text-muted max-w-xl leading-relaxed">
                  Download this official, cryptographic-stamped report formatted for printing or mobile viewing. Available in publication-standard PDF or high-resolution JPG.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="ink-button bg-leaf text-paper hover:bg-ink flex items-center gap-2 font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileText size={14} />}
                  Export PDF (.pdf)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isDownloadingJpg}
                  className="ink-button bg-terracotta text-paper hover:bg-ink flex items-center gap-2 font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingJpg ? <Loader2 size={13} className="animate-spin" /> : <Image size={14} />}
                  Export JPG (.jpg)
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="ink-button border border-ink/20 hover:border-ink text-ink flex items-center gap-1.5 font-mono text-xs cursor-pointer"
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* SURVEY INPUT FORM WITH OTP VERIFICATION STEP */
          <div className="space-y-8">
            {/* STEP 1: MOBILE OTP VERIFICATION CARD (Sybil & Duplicate Protection) */}
            <section
              data-testid="survey-verification-card"
              className={`ink-frame p-6 sm:p-8 transition-all ${
                isVerified
                  ? "bg-leaf/5 border-leaf/40"
                  : "bg-paper border-ink/20 shadow-xs"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-terracotta font-bold">
                    MANDATORY STEP / ONE SUBMISSION PER CITIZEN
                  </span>
                  <h2 className="font-serif text-2xl text-ink flex items-center gap-2 mt-0.5">
                    <Phone className={isVerified ? "text-leaf" : "text-amber"} size={20} />
                    Mobile Verification Check
                  </h2>
                </div>
                {isVerified ? (
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-leaf text-paper font-bold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={13} /> Mobile Verified (••••{mobileNumber.slice(-4)})
                  </span>
                ) : (
                  <span className="font-mono text-xs text-muted flex items-center gap-1">
                    <Lock size={12} /> Required before answering
                  </span>
                )}
              </div>

              {alreadySubmittedError ? (
                <div className="mt-4 p-4 rounded border border-terracotta/30 bg-terracotta/10 space-y-2">
                  <div className="flex items-center gap-2 text-terracotta font-bold text-sm">
                    <AlertCircle size={16} /> Submission Already Recorded
                  </div>
                  <p className="text-xs text-ink/90 leading-relaxed">
                    {alreadySubmittedError}
                  </p>
                  <p className="text-xs text-muted">
                    If this is your number, enter the verification OTP to view your previously earned Knowledge Dossier.
                  </p>
                </div>
              ) : null}

              {!isVerified ? (
                <div className="mt-5 space-y-4">
                  <p className="text-xs text-muted leading-relaxed">
                    To prevent duplicate entries and bots, enter your 10-digit mobile number. We will send a secure one-time code (OTP).
                    <b> No names or personal identifiers are requested.</b>
                  </p>

                  <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted font-bold px-2.5 sm:px-3 py-2 sm:py-2.5 bg-paper/60 border border-ink/20 rounded-sm shrink-0 min-h-[42px] flex items-center">
                        <span className="hidden sm:inline">+91 (India)</span>
                        <span className="sm:hidden">+91</span>
                      </span>
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                          disabled={otpSent && isVerifyingOtp}
                          aria-label="Mobile Number"
                          className="notebook-input w-full font-mono text-xs sm:text-sm min-h-[42px] pr-8"
                        />
                        {mobileNumber.length === 10 && (
                          <span className="absolute right-2.5 text-leaf">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={isSendingOtp || mobileNumber.length < 10 || cooldown > 0}
                      className="ink-button bg-leaf text-paper hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto min-h-[42px] font-mono text-xs font-bold"
                    >
                      {isSendingOtp ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : cooldown > 0 ? (
                        <Clock size={13} className="animate-pulse" />
                      ) : (
                        <KeyRound size={13} />
                      )}
                      {cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : otpSent
                        ? "Resend OTP"
                        : "Send Verification OTP"}
                    </button>
                  </div>

                  {/* OTP Entry Field */}
                  {otpSent && (
                    <div className="mt-3 p-4 sm:p-5 rounded-lg border border-ink/20 bg-paper/60 space-y-4 animate-fadeIn">
                      {/* Carrier Dispatched Live Alert */}
                      {carrierDispatched ? (
                        <div className="p-3.5 rounded border border-leaf/40 bg-leaf/10 flex items-start gap-3">
                          <Radio className="text-leaf shrink-0 mt-0.5 animate-pulse" size={18} />
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs font-bold text-leaf flex items-center gap-2">
                              Carrier SMS Transmitted
                              <span className="px-1.5 py-0.5 rounded bg-leaf text-paper text-[9px] uppercase tracking-wider">
                                Live SMS Gateway
                              </span>
                            </div>
                            <p className="text-xs text-ink/80 leading-relaxed">
                              An official verification code has been dispatched to <b>+91 ••••••{mobileNumber.slice(-4)}</b>. Please check your SMS inbox on your mobile handset.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {/* Simulated Telecom Carrier Notification (when no paid SMS API key configured) */}
                      {!carrierDispatched && receivedOtp && showSmsSimulator ? (
                        <div className="p-4 rounded-lg bg-ink text-paper border border-amber/40 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center text-amber">
                                <MessageSquareText size={14} />
                              </div>
                              <div>
                                <span className="font-mono text-[11px] font-bold text-amber block tracking-wide">
                                  INCOMING SMS • GOV-SOILTRC
                                </span>
                                <span className="text-[10px] text-paper/60 font-mono">
                                  Telecom Carrier: Airtel / Jio Gateway Simulation
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-paper/40">Just now</span>
                          </div>

                          <div className="p-2.5 rounded bg-paper/10 border border-paper/10 font-mono text-xs text-paper/90 leading-relaxed">
                            "Your SoilTrace verification OTP is{" "}
                            <strong className="text-amber tracking-widest text-sm font-bold bg-amber/20 px-1.5 py-0.5 rounded border border-amber/30">
                              {receivedOtp}
                            </strong>
                            . Valid for 10 minutes. Use this code to verify your anonymous citizen survey response. [MoEFCC & CPCB]"
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => autoFillAndVerify(receivedOtp)}
                              className="ink-button bg-amber text-ink hover:bg-amber/90 font-mono text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Zap size={13} />
                              Tap to Auto-fill & Verify ({receivedOtp})
                            </button>
                            <span className="text-[10px] font-mono text-paper/50">
                              One-click native SMS paste & instant verify
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* 6-Digit Code Input & Verify Action */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Smartphone size={14} className="text-muted" />
                            Enter 6-Digit OTP Code
                          </label>
                          <span className="text-[11px] text-muted font-mono">
                            Expires in 10 minutes • 5 attempts
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="••••••"
                            value={otpCode}
                            onChange={(e) => handleOtpInputChange(e.target.value)}
                            className="notebook-input w-full sm:max-w-[200px] font-mono text-center tracking-[0.4em] text-lg font-bold min-h-[44px] bg-paper"
                          />
                          <button
                            type="button"
                            onClick={() => verifyOtp()}
                            disabled={isVerifyingOtp || otpCode.length < 6}
                            className="ink-button bg-terracotta text-paper hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] w-full sm:w-auto px-4 font-mono text-xs font-bold"
                          >
                            {isVerifyingOtp ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                            Verify & Unlock Survey
                          </button>
                        </div>
                      </div>

                      {/* Gateway Details Drawer */}
                      <div className="border-t border-ink/10 pt-2.5">
                        <button
                          type="button"
                          onClick={() => setShowGatewayDetails(!showGatewayDetails)}
                          className="text-[11px] font-mono text-muted hover:text-ink flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Info size={12} />
                          {showGatewayDetails ? "Hide Gateway Info" : "How Real SMS Delivery Works in SoilTrace"}
                        </button>
                        {showGatewayDetails && (
                          <div className="mt-2 p-3 rounded bg-paper/80 border border-ink/15 text-[11px] font-mono text-ink/80 space-y-1.5 leading-relaxed animate-fadeIn">
                            <p>
                              <b>Direct Gateway Integration:</b> SoilTrace natively connects to Indian SMS telecom gateways (Fast2SMS) and global providers (Twilio).
                            </p>
                            <p>
                              To deliver real SMS to any phone handset, simply set your <code className="bg-ink/5 px-1 rounded">FAST2SMS_API_KEY</code> or <code className="bg-ink/5 px-1 rounded">TWILIO_*</code> credentials in <code className="bg-ink/5 px-1 rounded">backend/.env</code>.
                            </p>
                            <p className="text-muted">
                              When running in sandbox/development mode without credentials, SoilTrace activates the simulated carrier engine with instant one-click auto-fill.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-leaf bg-leaf/10 p-3 rounded border border-leaf/25">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={16} /> Mobile Verified (+91 ••••••{mobileNumber.slice(-4)})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[11px]">
                      Token: {verificationToken?.slice(0, 12)}•••
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerified(false);
                        setOtpSent(false);
                        setOtpCode("");
                        setVerificationToken(null);
                        setPhoneHash(null);
                      }}
                      className="text-[10px] text-muted underline hover:text-ink cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 2: FOUR SURVEY QUESTIONS (Locked until OTP Verified) */}
            <form
              onSubmit={submit}
              data-testid="survey-form"
              className={`grid gap-8 lg:grid-cols-[1fr_0.85fr] transition-opacity duration-300 ${
                !isVerified ? "opacity-50 pointer-events-none select-none" : "opacity-100"
              }`}
            >
              {/* Left Column: Questions 01 & 02 */}
              <div className="space-y-8">
                {/* 01 / Familiarity */}
                <fieldset data-testid="survey-awareness-field" className="ink-frame bg-paper p-6 sm:p-8">
                  <legend className="font-mono text-xs uppercase tracking-[0.16em] text-terracotta font-bold">
                    01 / Familiarity
                  </legend>
                  <p data-testid="survey-awareness-question" className="mt-3 font-serif text-2xl text-ink">
                    How familiar are you with soil pollution?
                  </p>
                  <div className="mt-5 grid gap-2">
                    {[
                      ["new", "I am new to the topic"],
                      ["some", "I know a little about contamination"],
                      ["confident", "I feel confident explaining heavy metals and soil health"],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        data-testid={`survey-awareness-${value}-option`}
                        className={`flex cursor-pointer items-center gap-3 rounded-sm border p-3 text-sm transition-colors ${
                          awareness === value
                            ? "border-leaf bg-leaf/10 font-bold text-ink"
                            : "border-ink/15 hover:border-leaf text-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="awareness"
                          value={value}
                          checked={awareness === value}
                          onChange={() => setAwareness(value as SurveySubmissionCreate["awareness"])}
                          className="accent-leaf"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* 02 / Perceived Causes */}
                <fieldset data-testid="survey-causes-field" className="ink-frame bg-paper p-6 sm:p-8">
                  <legend className="font-mono text-xs uppercase tracking-[0.16em] text-terracotta font-bold">
                    02 / Perceived Causes
                  </legend>
                  <p data-testid="survey-causes-question" className="mt-3 font-serif text-2xl text-ink">
                    Which factors would you like to understand better?
                  </p>
                  <p className="mt-1.5 text-xs text-muted">
                    Select at least one factor you perceive in your region or want answers about.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-1">
                    {causeOptions.map(([value, label]) => (
                      <label
                        key={value}
                        data-testid={`survey-cause-${value}-option`}
                        className={`flex cursor-pointer items-center gap-3 rounded-sm border p-3 text-sm transition-colors ${
                          causes.includes(value)
                            ? "border-leaf bg-leaf/10 font-bold text-ink"
                            : "border-ink/15 hover:border-leaf text-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={causes.includes(value)}
                          onChange={() => toggleCause(value)}
                          data-testid={`survey-cause-${value}-checkbox`}
                          className="size-4 accent-leaf"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Right Column: Questions 03 & 04 + Submit */}
              <div className="space-y-8">
                {/* 03 / Everyday Practice */}
                <fieldset data-testid="survey-practice-field" className="ink-frame bg-paper p-6 sm:p-8">
                  <legend className="font-mono text-xs uppercase tracking-[0.16em] text-terracotta font-bold">
                    03 / Everyday Practice
                  </legend>
                  <label htmlFor="practice" data-testid="survey-practice-question" className="mt-3 block font-serif text-2xl text-ink">
                    How confident are you in choosing soil-safe practices?
                  </label>
                  <p className="mt-1.5 text-xs text-muted">
                    e.g., washing produce from canal fields, testing well water, choosing organic compost.
                  </p>
                  <select
                    id="practice"
                    value={practice}
                    onChange={(event) => setPractice(event.target.value as SurveySubmissionCreate["practice"])}
                    data-testid="survey-practice-select"
                    className="notebook-input mt-4 text-sm font-mono"
                  >
                    <option value="careful">I actively look for guidance & test advice</option>
                    <option value="sometimes">Sometimes, depending on context and rumors</option>
                    <option value="not-sure">I am not sure where to start</option>
                  </select>
                </fieldset>

                {/* 04 / Concern Pulse */}
                <fieldset data-testid="survey-concern-field" className="ink-frame bg-paper p-6 sm:p-8">
                  <legend className="font-mono text-xs uppercase tracking-[0.16em] text-terracotta font-bold">
                    04 / Concern Pulse
                  </legend>
                  <label htmlFor="concern" data-testid="survey-concern-question" className="mt-3 block font-serif text-2xl text-ink">
                    How concerned are you about soil pollution?
                  </label>
                  <div className="mt-5 flex items-end gap-4">
                    <input
                      id="concern"
                      type="range"
                      min="1"
                      max="5"
                      value={concernScore}
                      onChange={(event) => setConcernScore(Number(event.target.value))}
                      data-testid="survey-concern-slider"
                      aria-label="Concern score from one to five"
                      className="w-full accent-leaf cursor-pointer"
                    />
                    <output data-testid="survey-concern-value" className="font-mono text-3xl font-bold text-leaf">
                      {concernScore}/5
                    </output>
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase text-muted">
                    <span>1 (Mild Curiosity)</span>
                    <span>5 (High Urgent Priority)</span>
                  </div>
                </fieldset>

                {/* Anonymity Note */}
                <div data-testid="survey-anonymity-note" className="border-l-2 border-amber bg-amber/10 p-4 text-xs leading-relaxed text-ink space-y-1">
                  <strong className="block font-bold">Strict Anonymity Guaranteed.</strong>
                  <span>Your phone number is hashed cryptographically so duplicate votes are rejected without exposing your identity to anyone.</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={mutation.isPending || !isVerified || causes.length === 0}
                  data-testid="survey-submit-button"
                  className="ink-button w-full justify-center bg-terracotta text-paper hover:bg-ink py-3 text-xs uppercase tracking-wider font-bold disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {mutation.isPending ? "Analyzing & Generating Knowledge Report…" : "Submit Verified Anonymous Response"}
                </button>
                <p data-testid="survey-submit-hint" className="text-center text-xs text-muted">
                  {!isVerified
                    ? "Verify your mobile above to unlock submission."
                    : causes.length === 0
                    ? "Choose at least one perceived factor to continue."
                    : "1 submission per verified citizen."}
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </SiteShell>
  );
}