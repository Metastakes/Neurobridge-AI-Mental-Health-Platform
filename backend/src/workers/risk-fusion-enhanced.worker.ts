import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

type SymKey = 'mood'|'sleep'|'energy'|'focus'|'appetite'|'motivation';
type Severity = 'LOW'|'MODERATE'|'HIGH';

function daysSince(iso: string | Date): number {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return Math.floor((Date.now() - d.getTime()) / (1000*60*60*24));
}

function within(dateIso: string, startDays: number, endDays: number): boolean {
  const d = new Date(dateIso);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000*60*60*24));
  return diff >= startDays && diff <= endDays;
}

function pickSeverity(score: number): Severity {
  if (score >= 0.7) return 'HIGH';
  if (score >= 0.4) return 'MODERATE';
  return 'LOW';
}

@Injectable()
export class RiskFusionWorker {
  private readonly logger = new Logger(RiskFusionWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron: Run at 2:15 AM daily (after DSM analysis at 2:00 AM)
   * Batch scan all active patients for risks using policy-driven algorithms
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runNightlyRiskFusion() {
    // Offset by 15 minutes to run after DSM analysis
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));

    this.logger.log('Starting nightly policy-driven risk fusion scan...');

    try {
      // Get all active patients (has recent mood check-ins or active meds)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const patients = await this.prisma.patient.findMany({
        where: {
          OR: [
            {
              moodCheckins: {
                some: {
                  day: { gte: cutoff },
                },
              },
            },
            {
              medications: {
                some: {
                  status: 'ACTIVE',
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      this.logger.log(`Scanning ${patients.length} active patients for risks`);

      let scanned = 0;
      let errors = 0;

      for (const patient of patients) {
        try {
          await this.runForPatient(patient.id);
          scanned++;
        } catch (error) {
          this.logger.error(`Failed to scan patient ${patient.id}:`, error);
          errors++;
        }
      }

      this.logger.log(
        `Risk fusion complete: ${scanned} scanned, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error('Nightly risk fusion scan failed:', error);
    }
  }

  async runForPatient(patientId: string) {
    const policy = await this.loadPolicy();
    const meds = await this.getRecentMedChanges(patientId, policy.windows.med_changes_days);
    const checkins = await this.getCheckins(patientId, policy.windows.checkins_days);

    if (checkins.length === 0) return;

    const last7 = this.aggregate(checkins.slice(-7));
    const prev7 = this.aggregate(checkins.slice(-14, -7));
    const deltas = this.diff(last7, prev7);

    for (const ev of meds) {
      // Activation signature (e.g., SSRI/SNRI) within 3–10 days post change
      if (
        policy.activation.drug_classes.includes(ev.category) &&
        within(ev.changed_at, policy.activation.window_start, policy.activation.window_end)
      ) {
        const score = this.signatureScore(deltas, policy.activation.signature);
        if (score >= policy.activation.threshold) {
          await this.upsertAlert(
            patientId,
            'activation',
            pickSeverity(score),
            `Activation pattern after ${ev.drug}`,
            { ev, deltas }
          );
        }
      }

      // Worsening depression
      if (
        deltas.mood <= -policy.worsening.mood_drop_threshold &&
        daysSince(ev.changed_at) <= policy.worsening.window_days
      ) {
        await this.upsertAlert(
          patientId,
          'worsening_depression',
          pickSeverity(Math.abs(deltas.mood)),
          `Mood decline after ${ev.drug} change`,
          { ev, deltas }
        );
      }
    }

    // Nonadherence: no check-ins + open tasks
    const nonAdherent = await this.looksNonAdherent(patientId, policy.nonadherence);
    if (nonAdherent) {
      await this.upsertAlert(
        patientId,
        'nonadherence',
        'MODERATE',
        'No check-ins and tasks overdue',
        {}
      );
    }
  }

  private async loadPolicy(): Promise<any> {
    // Load from file system
    const fs = require('fs');
    const path = require('path');
    const policyPath = path.join(__dirname, '../../../config/policies/safety.risk_fusion.json');

    if (fs.existsSync(policyPath)) {
      return JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
    }

    // Fallback policy
    return {
      windows: { checkins_days: 30, med_changes_days: 14 },
      activation: {
        drug_classes: ['SSRI','SNRI'],
        window_start: 3,
        window_end: 10,
        signature: { energy:'up', sleep:'down', mood:'down' },
        threshold: 0.6
      },
      worsening: { mood_drop_threshold: 0.2, window_days: 14 },
      nonadherence: { no_checkins_days: 7, open_tasks: true }
    };
  }

  private async getRecentMedChanges(patientId: string, days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const meds = await this.prisma.medication.findMany({
      where: {
        patientId,
        OR: [
          { updatedAt: { gte: cutoff } },
          { prescribedAt: { gte: cutoff } }
        ]
      },
      select: {
        id: true,
        name: true,
        dosage: true,
        category: true,
        prescribedAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return meds.map(m => ({
      id: m.id,
      drug: m.name,
      category: m.category || 'unknown',
      dose: m.dosage,
      changed_at: (m.updatedAt || m.prescribedAt).toISOString()
    }));
  }

  private async getCheckins(patientId: string, days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const checkins = await this.prisma.moodCheckin.findMany({
      where: {
        patientId,
        day: { gte: cutoff }
      },
      orderBy: { day: 'asc' },
      select: {
        day: true,
        mood: true,
        sleep: true,
        energy: true,
        focus: true,
        appetite: true,
        motivation: true
      }
    });

    return checkins.map(c => ({
      day: c.day.toISOString(),
      mood: c.mood,
      sleep: c.sleep,
      energy: c.energy,
      focus: c.focus,
      appetite: c.appetite,
      motivation: c.motivation
    }));
  }

  private aggregate(rows: any[]) {
    const out: Record<SymKey, number> = {
      mood:0, sleep:0, energy:0, focus:0, appetite:0, motivation:0
    };

    if (rows.length === 0) return out;

    rows.forEach(r => {
      out.mood += r.mood ?? 0;
      out.sleep += r.sleep ?? 0;
      out.energy += r.energy ?? 0;
      out.focus += r.focus ?? 0;
      out.appetite += r.appetite ?? 0;
      out.motivation += r.motivation ?? 0;
    });

    (Object.keys(out) as SymKey[]).forEach(k => out[k] = out[k] / rows.length);
    return out;
  }

  private diff(a: Record<SymKey, number>, b: Record<SymKey, number>) {
    const out: Record<SymKey, number> = {
      mood:0, sleep:0, energy:0, focus:0, appetite:0, motivation:0
    };
    (Object.keys(out) as SymKey[]).forEach(k => out[k] = (a[k] - b[k]));
    return out;
  }

  private signatureScore(
    deltas: Record<SymKey, number>,
    signature: Partial<Record<SymKey,'up'|'down'>>
  ) {
    const keys = Object.keys(signature) as SymKey[];
    if (keys.length === 0) return 0;

    let score = 0;
    keys.forEach(k => {
      const dir = signature[k];
      if (dir === 'up' && deltas[k] > 0) score += Math.min(1, deltas[k]);
      if (dir === 'down' && deltas[k] < 0) score += Math.min(1, Math.abs(deltas[k]));
    });

    return score / keys.length; // 0..1
  }

  private async upsertAlert(
    patientId: string,
    kind: string,
    severity: Severity,
    message: string,
    source: any
  ) {
    // Check if similar alert exists in last 7 days
    const recentSimilar = await this.prisma.riskAlert.findFirst({
      where: {
        patientId,
        kind,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentSimilar) {
      this.logger.debug(`Skipping duplicate ${kind} alert for patient ${patientId}`);
      return;
    }

    await this.prisma.riskAlert.create({
      data: {
        patientId,
        kind,
        severity,
        message,
        source
      }
    });

    this.logger.log(`Created ${severity} ${kind} alert for patient ${patientId}`);
  }

  private async looksNonAdherent(patientId: string, policy: any) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - policy.no_checkins_days);

    const recentCheckin = await this.prisma.moodCheckin.findFirst({
      where: {
        patientId,
        day: { gte: cutoff }
      }
    });

    if (recentCheckin) return false;

    if (policy.open_tasks) {
      const openTasks = await this.prisma.pharmTask.findFirst({
        where: {
          patientId,
          status: 'OPEN'
        }
      });
      return !!openTasks;
    }

    return true;
  }
}
