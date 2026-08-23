import type { Exam } from '@/lib/types';

const EXAMS: Exam[] = [
  {
    id: 'exam-hsk1-h10901',
    name: 'HSK 1 Exam',
    station: 'HSK 1',
    sequenceOrder: 28,
    description: 'Official HSK1 example',
  },
  {
    id: 'exam-hsk2-h20901',
    name: 'HSK 2 Exam',
    station: 'HSK 2',
    sequenceOrder: 50,
    description: 'Official HSK2 example',
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
