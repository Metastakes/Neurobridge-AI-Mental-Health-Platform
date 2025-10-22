import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { RiskService } from '../modules/risk/risk.service';

/**
 * Patch 04: Risk Fusion Worker
 * Nightly batch scan of all active patients for clinical risks
 * Correlates medication changes + mood patterns
 */
@Injectable()
export class RiskFusionWorker {
  private readonly logger = new Logger(RiskFusionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskService: RiskService,
  ) {}

  /**
   * Cron: Run at 2:15 AM daily (after DSM analysis)
   * Scan all active patients for risks
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runNightlyRiskScan() {
    // Offset by 15 minutes to run after DSM analysis
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));

    this.logger.log('Starting nightly risk fusion scan...');

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
      let alertsCreated = 0;

      for (const patient of patients) {
        try {
          const result = await this.riskService.scanPatient({
            patientId: patient.id,
            windowDays: 30,
          });

          scanned++;

          // Count new high-severity alerts
          if (result.overallRisk === 'high') {
            alertsCreated++;
          }
        } catch (error) {
          this.logger.error(`Failed to scan patient ${patient.id}:`, error);
          errors++;
        }
      }

      this.logger.log(
        `Risk fusion complete: ${scanned} scanned, ${alertsCreated} high-risk patients, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error('Nightly risk scan failed:', error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async scanAllPatients() {
    this.logger.log('Manual risk scan triggered');
    await this.runNightlyRiskScan();
  }
}
