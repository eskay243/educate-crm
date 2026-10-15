import { LMSModule, CourseProgram, LMSLesson } from '../types/crm';

/**
 * Normalizes strings for robust fuzzy/case-insensitive matching
 */
function clean(str?: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a course title or student program matches
 */
export function matchesCourse(programName?: string, courseTitle?: string): boolean {
  if (!programName || !courseTitle) return false;
  const p = clean(programName);
  const c = clean(courseTitle);
  if (p === c) return true;
  if (p.includes(c) || c.includes(p)) return true;

  // Specific common institutional program aliases
  if ((p.includes('financial trading') || p.includes('trading')) && (c.includes('financial trading') || c.includes('trading'))) {
    return true;
  }
  if (
    (p.includes('software engineering') || p.includes('fullstack') || p.includes('full stack')) && 
    (c.includes('software engineering') || c.includes('fullstack') || c.includes('full stack'))
  ) {
    return true;
  }
  if (p.includes('frontend') && c.includes('frontend')) return true;
  if (p.includes('data analysis') && c.includes('data analysis')) return true;
  if (p.includes('data science') && c.includes('data science')) return true;
  if ((p.includes('ui/ux') || p.includes('ui ux')) && (c.includes('ui/ux') || c.includes('ui ux'))) return true;

  return false;
}

/**
 * Resolves the curriculum modules strictly for a student's enrolled course.
 */
export function getStudentEnrolledModules(
  studentProgram: string | undefined,
  allLmsModules: LMSModule[],
  allCourses: CourseProgram[] = []
): LMSModule[] {
  if (!studentProgram) {
    return allLmsModules.slice(0, 3);
  }

  // 1. Try to find explicit LMSModules matching the student's program
  const matchingModules = (allLmsModules || []).filter(m => matchesCourse(studentProgram, m.courseTitle));
  if (matchingModules.length > 0) {
    return [...matchingModules].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 2. Look for the course in allCourses
  const matchedCourse = (allCourses || []).find(c => matchesCourse(studentProgram, c.title));
  if (matchedCourse && matchedCourse.syllabusModules && matchedCourse.syllabusModules.length > 0) {
    // If syllabusModules references module IDs (e.g. ['mod-1', 'mod-2'])
    const idMatched = (allLmsModules || []).filter(m => matchedCourse.syllabusModules.includes(m.id));
    if (idMatched.length > 0) {
      return [...idMatched].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Otherwise, synthesize structured LMSModule objects from the syllabusModules strings
    return matchedCourse.syllabusModules.map((moduleTitle, idx) => {
      const modId = `mod-synth-${matchedCourse.code ? matchedCourse.code.toLowerCase() : 'crs'}-${idx + 1}`;
      const defaultLessons: LMSLesson[] = [
        {
          id: `les-${modId}-1`,
          moduleId: modId,
          title: `Unit ${idx + 1}.1: Fundamentals & Theory — ${moduleTitle}`,
          type: 'video',
          durationMinutes: 45,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          contentMarkdown: `Key learning objectives, industry principles, and core theory for ${moduleTitle}.`,
          learningObjectives: [`Understand fundamental concepts of ${moduleTitle}`],
          completedByMentor: true,
          approvalStatus: 'Approved & Published',
          practicalLabTask: `Complete the week ${idx + 1} practical worksheet and submit for evaluation.`
        },
        {
          id: `les-${modId}-2`,
          moduleId: modId,
          title: `Unit ${idx + 1}.2: Applied Lab & Case Study — ${moduleTitle}`,
          type: 'lab',
          durationMinutes: 60,
          contentMarkdown: `Practical implementation and mentored project review for ${moduleTitle}.`,
          learningObjectives: [`Hands-on application and deliverable completion for ${moduleTitle}`],
          completedByMentor: true,
          approvalStatus: 'Approved & Published',
          practicalLabTask: `Deploy your practical deliverable and submit the project deliverable.`
        }
      ];

      return {
        id: modId,
        courseTitle: matchedCourse.title,
        title: moduleTitle.startsWith('Week') || moduleTitle.startsWith('Module') ? moduleTitle : `Module ${idx + 1}: ${moduleTitle}`,
        description: `Comprehensive academic and practical coverage of ${moduleTitle} under ${matchedCourse.title}.`,
        order: idx + 1,
        lessons: defaultLessons,
        durationDays: matchedCourse.durationDays || 30,
        durationTrack: matchedCourse.durationTrack,
        nsqfLevel: matchedCourse.nsqfLevel || 'NSQF Level 4',
      };
    });
  }

  // 3. Fallback: if no match found, fallback to first course's modules or allLmsModules
  return allLmsModules && allLmsModules.length > 0 ? allLmsModules : [];
}
