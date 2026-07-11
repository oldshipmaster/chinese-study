export const PROGRESS_STORAGE_KEY = "zili-progress-v1";

export interface LearningProgressV1 {
  version: 1;
  completedCourseIds: string[];
  leaves: number;
  streak: number;
  recentCourseId: string;
}

export function defaultProgress(): LearningProgressV1 {
  return {
    version: 1,
    completedCourseIds: [],
    leaves: 6,
    streak: 1,
    recentCourseId: "a-o-e",
  };
}

export function parseProgress(raw: string | null): LearningProgressV1 {
  if (!raw) return defaultProgress();

  try {
    const value = JSON.parse(raw) as Partial<LearningProgressV1>;
    if (
      value.version !== 1 ||
      !Array.isArray(value.completedCourseIds) ||
      typeof value.leaves !== "number" ||
      typeof value.streak !== "number" ||
      typeof value.recentCourseId !== "string"
    ) {
      return defaultProgress();
    }

    return {
      version: 1,
      completedCourseIds: value.completedCourseIds.filter(
        (id): id is string => typeof id === "string",
      ),
      leaves: Math.max(0, value.leaves),
      streak: Math.max(1, value.streak),
      recentCourseId: value.recentCourseId || "a-o-e",
    };
  } catch {
    return defaultProgress();
  }
}

export function completeCourse(
  progress: LearningProgressV1,
  courseId: string,
): LearningProgressV1 {
  const completed = new Set(progress.completedCourseIds);
  const alreadyCompleted = completed.has(courseId);
  completed.add(courseId);

  return {
    ...progress,
    completedCourseIds: [...completed],
    leaves: progress.leaves + (alreadyCompleted ? 0 : 3),
    recentCourseId: courseId,
  };
}

export function resetCourse(
  progress: LearningProgressV1,
  courseId: string,
): LearningProgressV1 {
  if (!progress.completedCourseIds.includes(courseId)) return progress;

  return {
    ...progress,
    completedCourseIds: progress.completedCourseIds.filter((id) => id !== courseId),
    leaves: Math.max(0, progress.leaves - 3),
  };
}
