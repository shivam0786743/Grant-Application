import axios from 'axios';
import {
  IAssessment,
  IRequirement,
  IApplicationMapping,
  IAssessmentSummary,
  ReviewAction,
  MappingStatus,
  DocumentReviewStatus,
  IDeterministicSummary
} from '../types';

// Production pe VITE_API_URL set karein (e.g. https://your-backend.onrender.com/api)
// Local dev mein Vite proxy use hoti hai, isliye fallback '/api' hai
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Upload and analyze documents
  createAssessment: async (formData: FormData): Promise<IAssessment> => {
    const res = await apiClient.post<{ success: boolean; data: IAssessment }>(
      '/assessments',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return res.data.data;
  },

  // Create assessment with raw text directly
  createAssessmentFromText: async (payload: {
    guidelineFilename?: string;
    guidelineText: string;
    applicationFilename?: string;
    applicationText: string;
    supportingDocsMetadata?: Array<{ name: string; notes?: string }>;
    title?: string;
  }): Promise<IAssessment> => {
    const res = await apiClient.post<{ success: boolean; data: IAssessment }>(
      '/assessments',
      payload
    );
    return res.data.data;
  },

  // List past assessments
  listAssessments: async (): Promise<IAssessment[]> => {
    const res = await apiClient.get<{ success: boolean; data: IAssessment[] }>(
      '/assessments'
    );
    return res.data.data;
  },

  // Get full assessment by ID
  getAssessment: async (id: string): Promise<IAssessment> => {
    const res = await apiClient.get<{ success: boolean; data: IAssessment }>(
      `/assessments/${id}`
    );
    return res.data.data;
  },

  // Get requirements
  getRequirements: async (id: string): Promise<IRequirement[]> => {
    const res = await apiClient.get<{ success: boolean; data: IRequirement[] }>(
      `/assessments/${id}/requirements`
    );
    return res.data.data;
  },

  // Get mappings
  getMappings: async (id: string): Promise<IApplicationMapping[]> => {
    const res = await apiClient.get<{ success: boolean; data: IApplicationMapping[] }>(
      `/assessments/${id}/mappings`
    );
    return res.data.data;
  },

  // Review decision on a mapping (confirm / correct / reject)
  updateMappingDecision: async (
    id: string,
    requirementId: string,
    decision: {
      action: ReviewAction;
      correctedStatus?: MappingStatus;
      notes?: string;
      reviewedBy?: string;
    }
  ): Promise<IAssessment> => {
    const res = await apiClient.patch<{ success: boolean; data: IAssessment }>(
      `/assessments/${id}/mappings/${requirementId}`,
      decision
    );
    return res.data.data;
  },

  // Recalculate deterministic score
  recalculateScore: async (id: string): Promise<IDeterministicSummary> => {
    const res = await apiClient.post<{ success: boolean; data: IDeterministicSummary }>(
      `/assessments/${id}/recalculate`
    );
    return res.data.data;
  },

  // Update supporting document status
  updateDocumentStatus: async (
    id: string,
    documentId: string,
    status: DocumentReviewStatus
  ): Promise<IAssessment> => {
    const res = await apiClient.patch<{ success: boolean; data: IAssessment }>(
      `/assessments/${id}/documents/${documentId}/status`,
      { status }
    );
    return res.data.data;
  },

  // Get final reviewed completeness summary
  getSummary: async (id: string): Promise<IAssessmentSummary> => {
    const res = await apiClient.get<{ success: boolean; data: IAssessmentSummary }>(
      `/assessments/${id}/summary`
    );
    return res.data.data;
  }
};
