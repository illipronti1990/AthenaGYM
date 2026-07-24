import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  ASSESSMENT_CREATED,
  PROGRESS_UPDATED,
  WORKOUT_COMPLETED,
  WORKOUT_PUBLISHED,
  WORKOUT_SUGGESTED,
  type AssessmentCreatedEvent,
  type ProgressUpdatedEvent,
  type WorkoutCompletedEvent,
  type WorkoutPublishedEvent,
  type WorkoutSuggestedEvent,
} from './workouts.events';

@Injectable()
export class WorkoutsEventListeners {
  private readonly log = new Logger(WorkoutsEventListeners.name);

  constructor(private readonly supabase: SupabaseService) {}

  private async outbox(companyId: string, eventType: string, payload: Record<string, unknown>) {
    try {
      await this.supabase.getAdmin().from('outbox_events').insert({
        company_id: companyId,
        event_type: eventType,
        payload,
        status: 'pending',
      });
    } catch (e) {
      this.log.warn(`outbox failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  @OnEvent(ASSESSMENT_CREATED)
  async onAssessment(e: AssessmentCreatedEvent) {
    await this.outbox(e.companyId, ASSESSMENT_CREATED, { ...e });
  }

  @OnEvent(WORKOUT_SUGGESTED)
  async onSuggested(e: WorkoutSuggestedEvent) {
    await this.outbox(e.companyId, WORKOUT_SUGGESTED, { ...e });
  }

  @OnEvent(WORKOUT_PUBLISHED)
  async onPublished(e: WorkoutPublishedEvent) {
    this.log.log(`workout published ${e.workoutId} → student ${e.studentId}`);
    await this.outbox(e.companyId, WORKOUT_PUBLISHED, { ...e });
  }

  @OnEvent(WORKOUT_COMPLETED)
  async onCompleted(e: WorkoutCompletedEvent) {
    await this.outbox(e.companyId, WORKOUT_COMPLETED, { ...e });
  }

  @OnEvent(PROGRESS_UPDATED)
  async onProgress(e: ProgressUpdatedEvent) {
    await this.outbox(e.companyId, PROGRESS_UPDATED, { ...e });
  }
}
