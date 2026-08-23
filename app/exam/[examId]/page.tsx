'use client';

import { use } from 'react';
import Link from 'next/link';
import ExamHsk1 from './ExamHsk1';
import ExamHsk2 from './ExamHsk2';

export default function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  if (examId === 'exam-hsk1-h10901') return <ExamHsk1 />;
  if (examId === 'exam-hsk2-h20901') return <ExamHsk2 />;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p>
    </div>
  );
}
