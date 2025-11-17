'use client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">E-Learning Adaptive System</h1>
        <p className="mt-4 text-xl">Personalised Learning with Adaptive Assessments</p>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <h2>Elo Rating System</h2>
            <p>Dynamic question difficulty adjustment</p>
          </div>
          <div className="border p-4 rounded">
            <h2>Mastery Tracking</h2>
            <p>80% threshold for topic progression</p>
          </div>
          <div className="border p-4 rounded">
            <h2>Progress Dashboard</h2>
            <p>Real-time learner analytics</p>
          </div>
          <div className="border p-4 rounded">
            <h2>Gamification</h2>
            <p>Badges and achievement system</p>
          </div>
        </div>
      </div>
    </main>
  );
}
