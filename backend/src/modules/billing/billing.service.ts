import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface BillingEvaluation {
  emCode: string;
  basis: 'MDM' | 'Time';
  modifiers: string[];
  g2211: boolean;
  rationale: string;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Evaluate appropriate billing codes for an encounter
   */
  async evaluateCodes(encounterId: string): Promise<BillingEvaluation> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        caseNotes: true,
        patient: {
          include: {
            medications: true,
            diagnoses: true,
          },
        },
      },
    });

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    // Determine complexity based on case factors
    const complexity = this.assessComplexity(encounter);
    const duration = encounter.durationMinutes || 0;

    // Determine E/M code
    let emCode = '99213'; // Default: Level 3 established patient
    let basis: 'MDM' | 'Time' = 'MDM';

    if (complexity === 'high' || duration >= 40) {
      emCode = '99214'; // Level 4
    }

    if (complexity === 'very_high' || duration >= 60) {
      emCode = '99215'; // Level 5
    }

    // Check for time-based coding
    if (duration >= 40 && this.isTimeBasedPreferred(encounter)) {
      basis = 'Time';
    }

    // Modifiers
    const modifiers: string[] = [];
    if (encounter.meetLink) {
      modifiers.push('95'); // Telehealth modifier
    }

    // G2211 (Complexity add-on for established patient)
    const g2211 = complexity === 'high' || complexity === 'very_high';

    const rationale = this.generateRationale(emCode, basis, complexity, duration, g2211);

    return {
      emCode,
      basis,
      modifiers,
      g2211,
      rationale,
    };
  }

  /**
   * Assess clinical complexity
   */
  private assessComplexity(encounter: any): 'low' | 'moderate' | 'high' | 'very_high' {
    let score = 0;

    // Multiple diagnoses
    if (encounter.patient.diagnoses.length >= 3) score += 2;
    else if (encounter.patient.diagnoses.length >= 2) score += 1;

    // Medication management
    if (encounter.patient.medications.length >= 3) score += 2;
    else if (encounter.patient.medications.length >= 1) score += 1;

    // Case notes complexity (if AI-generated, likely comprehensive)
    if (encounter.caseNotes.some((n: any) => n.assessment && n.plan)) score += 1;

    if (score >= 5) return 'very_high';
    if (score >= 3) return 'high';
    if (score >= 1) return 'moderate';
    return 'low';
  }

  /**
   * Determine if time-based coding is preferred
   */
  private isTimeBasedPreferred(encounter: any): boolean {
    const duration = encounter.durationMinutes || 0;
    // Time-based is preferred when duration significantly exceeds typical
    return duration >= 60;
  }

  /**
   * Generate rationale for billing codes
   */
  private generateRationale(
    emCode: string,
    basis: string,
    complexity: string,
    duration: number,
    g2211: boolean,
  ): string {
    let rationale = `Code ${emCode} selected based on ${basis}. `;

    if (basis === 'MDM') {
      rationale += `Clinical complexity assessed as ${complexity}. `;
    } else {
      rationale += `Total time: ${duration} minutes. `;
    }

    if (g2211) {
      rationale += `G2211 add-on code applicable due to high complexity of visit for established patient. `;
    }

    return rationale;
  }

  /**
   * Save billing codes to encounter
   */
  async saveCodes(encounterId: string, codes: BillingEvaluation) {
    // Save primary E/M code
    await this.prisma.billingCode.create({
      data: {
        encounterId,
        code: codes.emCode,
        type: 'EM_CODE',
        basis: codes.basis,
        rationale: codes.rationale,
      },
    });

    // Save modifiers
    for (const modifier of codes.modifiers) {
      await this.prisma.billingCode.create({
        data: {
          encounterId,
          code: modifier,
          type: 'MODIFIER',
          description: modifier === '95' ? 'Telehealth' : 'Other',
        },
      });
    }

    // Save G2211 if applicable
    if (codes.g2211) {
      await this.prisma.billingCode.create({
        data: {
          encounterId,
          code: 'G2211',
          type: 'CPT',
          description: 'Visit complexity inherent to E/M',
        },
      });
    }

    return { success: true };
  }
}
