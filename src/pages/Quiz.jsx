import { useMemo, useState } from "react";

export default function Quiz() {
  const questions = useMemo(() => ([
    { q: 'What is Big-O for binary search?', options: ['O(n)', 'O(log n)', 'O(1)'], a: [1] },
    { q: 'Which HTTP methods are safe?', options: ['GET', 'POST', 'HEAD', 'PUT'], a: [0, 2] },
  ]), []);
  const [answers, setAnswers] = useState(Array(questions.length).fill([]));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce((acc, v, i) => {
    const selected = Array.isArray(v) ? v : [];
    const correct = Array.isArray(questions[i].a) ? questions[i].a : [questions[i].a];
    const isCorrect =
      selected.length === correct.length &&
      selected.every(x => correct.includes(x)) &&
      correct.every(x => selected.includes(x));
    return acc + (isCorrect ? 1 : 0);
  }, 0);

  const submit = () => setSubmitted(true);

  const toggle = (qIdx, optIdx) => {
    setAnswers(prev => prev.map((arr, i) => {
      if (i !== qIdx) return arr;
      const cur = Array.isArray(arr) ? arr : [];
      return cur.includes(optIdx) ? cur.filter(x => x !== optIdx) : [...cur, optIdx];
    }));
  };

  return (
    <main style={{ padding: 24 }}>
      <h2>Quiz</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        {questions.map((item, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', padding: 16, borderRadius: 12 }}>
            <div style={{ fontWeight: 600 }}>{idx + 1}. {item.q}</div>
            <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
              Select all correct answers (you can choose multiple options)
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
              {item.options.map((o, oi) => (
                <li key={oi} style={{ marginBottom: 8 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(answers[idx]) && answers[idx].includes(oi)}
                      onChange={() => toggle(idx, oi)}
                    />
                    <span>{o}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={submit}>Submit</button>
      </div>
      {submitted && (
        <div style={{ marginTop: 16, background: '#eef6ff', padding: 12, borderRadius: 8 }}>
          Score: {score} / {questions.length}
        </div>
      )}
    </main>
  );
}
