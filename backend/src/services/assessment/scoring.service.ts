import {
  IRequirement,
  IApplicationMapping,
  IDeterministicSummary,
  MappingStatus
} from '../../types';

export class ScoringService {
  /**
   * Deterministic scoring weights for each status
   */
  public static readonly STATUS_WEIGHTS: Record<MappingStatus, number> = {
    supported: 1.0,
    weak: 0.4,
    ambiguous: 0.2,
    missing: 0.0,
    unsupported: 0.0
  };

  /**
   * Resolves the effective status of a requirement mapping,
   * taking into account any user confirmation, correction, or rejection.
   */
  public getEffectiveStatus(mapping?: IApplicationMapping): MappingStatus {
    if (!mapping) {
      return 'missing';
    }

    if (mapping.userDecision) {
      const { action, correctedStatus } = mapping.userDecision;
      if (action === 'confirm') {
        return mapping.status;
      }
      if (action === 'correct' && correctedStatus) {
        return correctedStatus;
      }
      if (action === 'reject') {
        // A rejected AI mapping defaults to missing unless user specified otherwise
        return correctedStatus || 'missing';
      }
    }

    return mapping.status;
  }

  /**
   * Calculates the deterministic completeness score strictly in code.
   * Does NOT rely on LLM for percentage calculation.
   */
  public calculateCompleteness(
    requirements: IRequirement[],
    mappings: IApplicationMapping[]
  ): IDeterministicSummary {
    const mappingMap = new Map<string, IApplicationMapping>();
    for (const m of mappings) {
      mappingMap.set(m.requirementId, m);
    }

    const effectiveStatuses: Record<string, MappingStatus> = {};

    let totalMandatory = 0;
    let supported = 0;
    let weak = 0;
    let ambiguous = 0;
    let missing = 0;
    let unsupported = 0;
    let mandatoryPointsEarned = 0;

    let totalRecommendations = 0;
    let recommendationsSupported = 0;

    for (const req of requirements) {
      const mapping = mappingMap.get(req.id);
      const effectiveStatus = this.getEffectiveStatus(mapping);
      effectiveStatuses[req.id] = effectiveStatus;

      if (req.mandatory) {
        totalMandatory++;
        switch (effectiveStatus) {
          case 'supported':
            supported++;
            break;
          case 'weak':
            weak++;
            break;
          case 'ambiguous':
            ambiguous++;
            break;
          case 'missing':
            missing++;
            break;
          case 'unsupported':
            unsupported++;
            break;
        }

        const weight = ScoringService.STATUS_WEIGHTS[effectiveStatus] ?? 0;
        mandatoryPointsEarned += weight;
      } else {
        totalRecommendations++;
        if (effectiveStatus === 'supported') {
          recommendationsSupported++;
        }
      }
    }

    let completenessScore = 0;
    if (totalMandatory > 0) {
      completenessScore = Math.round((mandatoryPointsEarned / totalMandatory) * 1000) / 10;
    } else if (requirements.length > 0) {
      // If all requirements are recommendations
      completenessScore = totalRecommendations > 0
        ? Math.round((recommendationsSupported / totalRecommendations) * 1000) / 10
        : 100;
    }

    const recommendationScore = totalRecommendations > 0
      ? Math.round((recommendationsSupported / totalRecommendations) * 1000) / 10
      : 100;

    const formulaExplanation =
      `Score = (Sum of points for mandatory requirements / Total mandatory [${totalMandatory}]) * 100. ` +
      `Weights: Supported=1.0, Weak=0.4, Ambiguous=0.2, Missing=0.0, Unsupported=0.0. ` +
      `Earned ${mandatoryPointsEarned.toFixed(1)} / ${totalMandatory} pts. ` +
      `Recommendations are monitored separately (${recommendationsSupported}/${totalRecommendations} satisfied) without penalizing mandatory score.`;

    return {
      totalMandatory,
      supported,
      weak,
      ambiguous,
      missing,
      unsupported,
      completenessScore,
      totalRecommendations,
      recommendationsSupported,
      recommendationScore,
      formulaExplanation,
      effectiveStatuses
    };
  }
}

export const scoringService = new ScoringService();
