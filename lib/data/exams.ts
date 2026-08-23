import type { Exam } from '@/lib/types';

const EXAMS: Exam[] = [
  {
    id: 'exam-hsk1-h10901',
    name: 'HSK 1 Exam · H10901',
    station: 'HSK 1',
    sequenceOrder: 28,
    description: 'Official HSK 1 practice exam — 20 listening + 20 reading questions.',
  },
];

export default EXAMS;

export function examsByStation(): Record<string, Exam[]> {
  const result: Record<string, Exam[]> = {};
  for (const exam of EXAMS) {
    if (!result[exam.station]) result[exam.station] = [];
    result[exam.station]!.push(exam);
  }
  return result;
}

export function getExamById(id: string): Exam | undefined {
  return EXAMS.find(e => e.id === id);
}
