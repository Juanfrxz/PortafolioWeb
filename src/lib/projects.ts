import type { Experience, Project } from '../content/schema';

export type ContentEntryLike<T> = T | { data: T };

function entryData<T>(entry: ContentEntryLike<T>): T {
  if (typeof entry === 'object' && entry !== null && 'data' in entry) {
    return entry.data;
  }

  return entry;
}

function compareIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function compareProjects(
  left: ContentEntryLike<Project>,
  right: ContentEntryLike<Project>,
): number {
  return compareIds(entryData(left).slug, entryData(right).slug);
}

export function getFeaturedProjects<T extends ContentEntryLike<Project>>(
  projects: readonly T[],
): T[] {
  return projects
    .filter((project) => entryData(project).visibility === 'featured')
    .sort(
      (left, right) =>
        (entryData(left).featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (entryData(right).featuredOrder ?? Number.MAX_SAFE_INTEGER) ||
        compareProjects(left, right),
    );
}

export function getArchiveProjects<T extends ContentEntryLike<Project>>(
  projects: readonly T[],
): T[] {
  return projects
    .filter((project) => entryData(project).visibility === 'archive')
    .sort(
      (left, right) =>
        (entryData(left).archiveOrder ?? Number.MAX_SAFE_INTEGER) -
          (entryData(right).archiveOrder ?? Number.MAX_SAFE_INTEGER) ||
        compareProjects(left, right),
    );
}

export function getLaunchProjects<T extends ContentEntryLike<Project>>(
  projects: readonly T[],
): T[] {
  return [...getFeaturedProjects(projects), ...getArchiveProjects(projects)];
}

export function getSortedExperience<T extends ContentEntryLike<Experience>>(
  experience: readonly T[],
): T[] {
  return [...experience].sort(
    (left, right) =>
      entryData(left).order - entryData(right).order ||
      compareIds(entryData(left).id, entryData(right).id),
  );
}
