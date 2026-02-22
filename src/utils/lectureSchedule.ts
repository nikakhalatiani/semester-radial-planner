import type { CourseOffering, LectureSession } from '../types';

function fallbackSessionId(offeringId: string, date: string, index: number) {
  const safeDate = date.replace(/[^0-9]/g, '');
  return `${offeringId}-lecture-${safeDate || index}`;
}

export function getLectureSessions(offering: CourseOffering): LectureSession[] {
  if (offering.lectureSessions && offering.lectureSessions.length > 0) {
    return offering.lectureSessions.map((session, index) => ({
      ...session,
      id: session.id || fallbackSessionId(offering.id, session.date, index),
    }));
  }

  if (offering.lectureDates && offering.lectureDates.length > 0) {
    return offering.lectureDates.map((date, index) => ({
      id: fallbackSessionId(offering.id, date, index),
      date,
    }));
  }

  return [];
}

export function deriveLectureDates(sessions: LectureSession[]): string[] {
  return sessions
    .map((session) => session.date)
    .filter(Boolean);
}

export function formatTimeRange(startTime?: string, endTime?: string): string | undefined {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  if (startTime) {
    return startTime;
  }
  if (endTime) {
    return endTime;
  }
  return undefined;
}
