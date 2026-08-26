import type { Exam } from '@/lib/types';

const EXAMS: Exam[] = [
  {
    id: 'exam-hsk1-h10901',
    name: 'HSK 1 Exam',
    station: 'HSK 1',
    sequenceOrder: 28,
    passScore: 120,
    description: 'Official HSK1 example',
  },
  {
    id: 'exam-hsk2-h20901',
    name: 'HSK 2 Exam',
    station: 'HSK 2',
    sequenceOrder: 50,
    passScore: 120,
    description: 'Official HSK2 example',
  },
  {
    id: 'exam-hsk3-h31001',
    name: 'HSK 3 Exam',
    station: 'HSK 3',
    sequenceOrder: 71,
    passScore: 180,
    description: 'Official HSK3 example',
  },
  {
    id: 'exam-hsk4-h41001',
    name: 'HSK 4 Exam',
    station: 'HSK 4',
    sequenceOrder: 92,
    passScore: 180,
    description: 'Official HSK4 example',
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
