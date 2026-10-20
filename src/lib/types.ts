export type EvidenceStatus = "verified" | "reported" | "illustrative" | "conceptual" | "unavailable";

export interface KnowledgeGap {
  topic: string;
  why_important: string;
  action_tip: string;
}

export interface KnowledgeReport {
  score_percentage: number;
  awareness_tier: string;
  identified_causes_count: number;
  knowledge_gaps: KnowledgeGap[];
  strengths: string[];
  action_recommendations: string[];
  kisan_helpline: string;
}

export interface SurveySubmissionCreate {
  awareness: "new" | "some" | "confident";
  causes: Array<"industry" | "agriculture" | "waste" | "water" | "not-sure">;
  practice: "careful" | "sometimes" | "not-sure";
  concern_score: number;
  consent: boolean;
  phone_hash?: string;
  verification_token?: string;
}

export interface SurveySubmission extends SurveySubmissionCreate {
  id: string;
  submitted_at: string;
  knowledge_report?: KnowledgeReport;
}

export interface SendOtpRequest {
  mobile_number: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  demo_otp?: string;
  delivery_channel?: "sms_gateway" | "simulated_sms";
  carrier_dispatched?: boolean;
  cooldown_seconds?: number;
  already_submitted: boolean;
}

export interface VerifyOtpRequest {
  mobile_number: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  verification_token: string;
  phone_hash: string;
  message: string;
  already_submitted: boolean;
  existing_submission?: SurveySubmission;
}

export interface DashboardSummary {
  total_responses: number;
  is_available: boolean;
  minimum_responses: number;
  message: string;
  awareness_breakdown?: Record<string, number>;
  cause_breakdown?: Record<string, number>;
  practice_breakdown?: Record<string, number>;
  concern_breakdown?: Record<string, number>;
}

export interface SimulationTimelinePoint {
  month: string;
  month_num: number;
  lead: number;
  cadmium: number;
  chromium: number;
  cpcb_lead: number;
  cpcb_cadmium: number;
  cpcb_chromium: number;
}

export interface SimulationMethodDetails {
  technique: string;
  botanical_species: string;
  mechanism: string;
  estimated_cost_inr: string;
  soil_disturbance: string;
  harvesting_cycle: string;
}

export interface SimulationResult {
  remediation_type: string;
  initial_metals: { lead: number; cadmium: number; chromium: number };
  predicted_metals: { lead: number; cadmium: number; chromium: number };
  percent_reduction: { lead: number; cadmium: number; chromium: number };
  estimated_months: number;
  cpcb_compliance: { lead: boolean; cadmium: boolean; chromium: boolean };
  summary: string;
  timeline: SimulationTimelinePoint[];
  remediation_details: SimulationMethodDetails;
  recommendations: string[];
}

export interface ParameterEvaluation {
  param_name: string;
  value: number;
  unit: string;
  status: "optimal" | "moderate" | "critical";
  target_range: string;
  impact: string;
}

export interface DigitalRecordAuditRequest {
  ph: number;
  ec: number;
  organic_carbon: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  lead_mg_kg: number;
  cadmium_mg_kg: number;
  chromium_mg_kg: number;
}

export interface DigitalRecordAuditResponse {
  overall_score: number;
  health_status: string;
  bioavailability_risk: string;
  food_chain_risk: string;
  cpcb_compliant: boolean;
  parameter_evaluations: ParameterEvaluation[];
  remediation_recommendations: string[];
}
