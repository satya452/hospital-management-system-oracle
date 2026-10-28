import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Database,
  Play,
  Clock,
  Sparkles,
  Terminal,
  Table,
  AlertCircle,
  AlignLeft
} from 'lucide-react';

const DEFAULT_SQL = `SELECT patient_id, patient_name, dob, gender, blood_group, phone, registered_date
FROM patient
ORDER BY patient_id DESC
LIMIT 10;`;

export const formatSqlQuery = (rawSql) => {
  if (!rawSql) return '';
  let sql = rawSql.trim();

  // Keep all SELECT elements/columns in a single line
  sql = sql.replace(/SELECT\s+([\s\S]*?)\s+FROM/i, (match, selectBody) => {
    const singleLineSelect = selectBody.replace(/\s+/g, ' ').trim();
    return `SELECT ${singleLineSelect}\nFROM`;
  });

  // Keep each subsequent command/clause on the next line
  const clauses = [
    'INNER JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'FULL JOIN',
    '(?<!(?:INNER|LEFT|RIGHT|FULL)\\s+)JOIN',
    'WHERE',
    'GROUP BY',
    'HAVING',
    'ORDER BY',
    'LIMIT',
    'UNION ALL',
    'UNION'
  ];

  for (const clause of clauses) {
    const reg = new RegExp(`(?<!^)[ \\t]+(${clause})\\b`, 'gi');
    sql = sql.replace(reg, '\n$1');
  }

  return sql.split('\n').map((l) => l.trimEnd()).join('\n');
};

export default function SqlRunner() {
  const [predefinedQueries, setPredefinedQueries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeQuery, setActiveQuery] = useState(null);
  const [customSql, setCustomSql] = useState(DEFAULT_SQL);
  const [results, setResults] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [execTime, setExecTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPredefined();
  }, []);

  const fetchPredefined = async () => {
    try {
      const res = await api.get('/queries/predefined');
      setPredefinedQueries(res.data);
      if (res.data.length > 0) {
        setActiveQuery(res.data[0]);
        setCustomSql(formatSqlQuery(res.data[0].sql));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunQuery = async (queryText) => {
    const sqlToRun = queryText || customSql;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/query', { sql: sqlToRun });
      setResults(res.data.results || []);
      setRowCount(res.data.rowCount || 0);
      setExecTime(res.data.executionTime || 0);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'SQL Query execution failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPredefined = (q) => {
    setActiveQuery(q);
    const formatted = formatSqlQuery(q.sql);
    setCustomSql(formatted);
    handleRunQuery(formatted);
  };

  const categories = ['ALL', 'JOIN', 'AGGREGATE', 'GROUP BY', 'SUBQUERY', 'CASE'];

  const filteredQueries = predefinedQueries.filter(
    (q) => selectedCategory === 'ALL' || q.category === selectedCategory
  );

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5 text-teal-600" /> FR8 Query Engine & Evaluation
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Database Analytics & Raw SQL Runner
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              17 Pre-built Course Project queries illustrating Joins, Aggregations, GROUP BY/HAVING, Subqueries, and CASE statements alongside an interactive SQL runner.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span>Query Engine: </span>
            <span className="text-teal-700 font-bold">SELECT Direct Pipeline</span>
          </div>
        </div>
      </div>

      {/* Pre-Built Queries Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">17 Pre-Built Course Project Queries</h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Query Pills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredQueries.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectPredefined(q)}
              className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer flex flex-col justify-between ${
                activeQuery?.id === q.id
                  ? 'bg-teal-50/90 border-teal-300 text-teal-900 shadow-2xs font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {q.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Q#{q.id}</span>
              </div>
              <p className="font-semibold text-slate-800 line-clamp-2">{q.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SQL Editor */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Interactive SQL Runner</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomSql((prev) => formatSqlQuery(prev))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Keep each SQL command and clause on a new line"
            >
              <AlignLeft className="w-3.5 h-3.5 text-teal-700" />
              <span>Format Query (Next Line)</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">Only SELECT statements allowed</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows="9"
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500 transition-colors leading-relaxed shadow-inner whitespace-pre"
            placeholder="Type your SELECT query here..."
            spellCheck="false"
          ></textarea>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-slate-400" />
              Rows: <strong className="text-slate-900 font-mono">{rowCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Latency: <strong className="text-emerald-700 font-mono">{execTime} ms</strong>
            </span>
          </div>

          <button
            onClick={() => handleRunQuery()}
            disabled={loading}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{loading ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-mono">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Result Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Query Output Grid</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">{results.length} Records</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No results to display. Click "Run Query" or pick a pre-built tab above.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-600 border-b border-slate-200 font-mono sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {results.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 whitespace-nowrap text-slate-800">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-400">NULL</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
